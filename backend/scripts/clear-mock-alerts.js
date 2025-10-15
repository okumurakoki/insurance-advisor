const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.vercel') });

async function clearMockAlerts() {
    // Extract project ref from Supabase URL
    const projectRef = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

    const client = new Client({
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || 'your-database-password',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Delete alerts for non-existent customers (mock data)
        const deleteQuery = `
            DELETE FROM alerts
            WHERE customer_id NOT IN (SELECT id FROM customers)
            OR user_id NOT IN (SELECT user_id FROM users);
        `;

        const result = await client.query(deleteQuery);
        console.log(`Deleted ${result.rowCount} mock alerts`);

        // Show remaining alerts
        const countQuery = 'SELECT COUNT(*) as count FROM alerts';
        const countResult = await client.query(countQuery);
        console.log(`Remaining alerts: ${countResult.rows[0].count}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

clearMockAlerts();
