const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSupabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase\n');

        // Check tables
        const tables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('📋 Existing tables:');
        tables.rows.forEach(row => console.log('  ✓', row.table_name));

        // Check users
        const users = await client.query('SELECT user_id, account_type, plan_type FROM users');
        console.log('\n👥 Users in database:');
        users.rows.forEach(user => console.log('  -', user.user_id, `(${user.account_type}, ${user.plan_type})`));

        // Check funds
        const funds = await client.query('SELECT code, name, category FROM funds LIMIT 5');
        console.log('\n💰 Sample funds:');
        funds.rows.forEach(fund => console.log('  -', fund.code, '-', fund.name));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkSupabase();
