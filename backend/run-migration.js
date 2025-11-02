const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Reading migration file...');
        const migrationPath = path.join(__dirname, 'migrations', 'add_agency_plans_fixed.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);

        console.log('✅ Migration completed successfully!');

        // Verify plan_definitions table
        console.log('\nVerifying plan_definitions table:');
        const plansResult = await client.query('SELECT * FROM plan_definitions ORDER BY plan_type');
        console.table(plansResult.rows);

        // Check agency users
        console.log('\nChecking agency users:');
        const agenciesResult = await client.query(`
            SELECT u.id, u.user_id, u.plan_type, u.staff_limit, u.customer_limit_per_staff,
                   pd.plan_name, pd.staff_limit as plan_staff_limit
            FROM users u
            LEFT JOIN plan_definitions pd ON u.plan_type::text = pd.plan_type
            WHERE u.account_type = 'parent'
            ORDER BY u.id
        `);
        console.table(agenciesResult.rows);

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
