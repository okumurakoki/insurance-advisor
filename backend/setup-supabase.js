const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupSupabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to Supabase...');
        await client.connect();
        console.log('✅ Connected to Supabase');

        // Read schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Creating database schema...');
        await client.query(schema);
        console.log('✅ Database schema created');

        // Update admin password to bcrypt hash
        const bcrypt = require('bcryptjs');
        const adminPasswordHash = await bcrypt.hash('password123', 10);

        console.log('Updating admin user password...');
        await client.query(`
            UPDATE users
            SET password_hash = $1
            WHERE user_id = 'admin'
        `, [adminPasswordHash]);
        console.log('✅ Admin password updated');

        // Verify tables
        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('\n✅ Tables created:');
        result.rows.forEach(row => console.log('  -', row.table_name));

        // Verify admin user
        const adminCheck = await client.query(`
            SELECT user_id, account_type, plan_type
            FROM users
            WHERE user_id = 'admin'
        `);

        if (adminCheck.rows.length > 0) {
            console.log('\n✅ Admin user verified:', adminCheck.rows[0]);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\nDatabase setup complete!');
    }
}

setupSupabase();
