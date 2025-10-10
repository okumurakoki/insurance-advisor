const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function addAdmin() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase');

        // Check if admin exists
        const check = await client.query("SELECT * FROM users WHERE user_id = 'admin'");
        
        const passwordHash = await bcrypt.hash('password123', 10);
        
        if (check.rows.length > 0) {
            console.log('ℹ️  Admin user already exists, updating...');
            await client.query(
                "UPDATE users SET password_hash = $1, account_type = 'parent', plan_type = 'exceed', customer_limit = 999 WHERE user_id = 'admin'",
                [passwordHash]
            );
        } else {
            console.log('Creating admin user as parent with exceed plan...');
            await client.query(
                "INSERT INTO users (user_id, password_hash, account_type, plan_type, customer_limit, is_active) VALUES ($1, $2, $3, $4, $5, $6)",
                ['admin', passwordHash, 'parent', 'exceed', 999, true]
            );
        }

        console.log('✅ Admin user ready:');
        console.log('   userId: admin');
        console.log('   password: password123');
        console.log('   accountType: parent (admin権限)');

        // Verify
        const verify = await client.query("SELECT user_id, account_type, plan_type, customer_limit FROM users WHERE user_id = 'admin'");
        console.log('\nVerified:', verify.rows[0]);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

addAdmin();
