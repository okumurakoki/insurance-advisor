// Script to run database migration
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL not found in environment variables');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔗 Connecting to database...');
        const client = await pool.connect();

        console.log('📄 Reading migration file...');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add_stripe_payment_fields.sql'),
            'utf8'
        );

        console.log('🚀 Running migration...');
        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

        // Verify columns were added
        console.log('\n📋 Verifying new columns...');
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('payment_method', 'stripe_customer_id', 'stripe_subscription_id')
            ORDER BY column_name;
        `);

        console.log('New columns in users table:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
