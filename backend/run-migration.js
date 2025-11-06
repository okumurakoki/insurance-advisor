require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Running migration: 001_add_monthly_allocation_recommendations.sql\n');

        const migrationFile = path.join(__dirname, 'migrations', '001_add_monthly_allocation_recommendations.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        await pool.query(sql);

        console.log('✓ Migration completed successfully\n');

        // Verify the table was created
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'monthly_allocation_recommendations'
            ORDER BY ordinal_position
        `);

        console.log('Table structure:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
