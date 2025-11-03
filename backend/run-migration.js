require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Running migration: add_name_email_to_users.sql');

        const migrationFile = path.join(__dirname, 'migrations', 'add_name_email_to_users.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        await pool.query(sql);

        console.log('✓ Migration completed successfully');

        // Verify the columns were added
        const result = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('name', 'email')
            ORDER BY column_name
        `);

        console.log('\nVerification - Columns added:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
