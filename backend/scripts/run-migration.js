const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.vercel') });

async function runMigration() {
    // Extract project ref from Supabase URL
    // https://skqzxkdwzxjsonkwoeua.supabase.co -> skqzxkdwzxjsonkwoeua
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

        const migrationFile = path.join(__dirname, '../migrations/006_create_alerts_table.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully!');

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Table already exists, skipping migration');
        } else {
            console.error('Migration error:', error.message);
        }
    } finally {
        await client.end();
    }
}

runMigration();
