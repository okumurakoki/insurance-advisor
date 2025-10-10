const { Client } = require('pg');

// Try transaction pooler with @ symbol
const connectionString = 'postgres://postgres:Kohki040108%40@db.rozunxmzoaaksmehefuj.supabase.co:6543/postgres';

async function testConnection() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Testing connection with password ending in @...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        const result = await client.query('SELECT current_database(), current_user, version()');
        console.log('Database:', result.rows[0].current_database);
        console.log('User:', result.rows[0].current_user);
        console.log('Version:', result.rows[0].version.substring(0, 50));
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await client.end();
    }
}

testConnection();
