const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        const sql = `
ALTER TABLE users
ADD COLUMN IF NOT EXISTS custom_monthly_price INTEGER;

COMMENT ON COLUMN users.custom_monthly_price IS 'Custom monthly price per company for exceed plan agencies (in yen)';
        `;

        console.log('Running migration...');
        console.log(sql);

        await client.query(sql);
        
        console.log('✅ Migration completed successfully!');

        // Verify the column was added
        const verifyResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'custom_monthly_price'
        `);

        if (verifyResult.rows.length > 0) {
            console.log('✅ Verified: custom_monthly_price column exists');
            console.log('Column details:', verifyResult.rows[0]);
        } else {
            console.log('⚠️  Warning: Could not verify column creation');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

runMigration();
