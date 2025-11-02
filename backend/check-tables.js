const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database\n');

        // Get all tables
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('=== Available Tables ===');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check if there are any performance/fund related tables
        console.log('\n=== Searching for performance/fund related tables ===');
        const perfTables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND (
                table_name LIKE '%fund%'
                OR table_name LIKE '%performance%'
                OR table_name LIKE '%market%'
                OR table_name LIKE '%special%'
            )
            ORDER BY table_name
        `);

        if (perfTables.rows.length > 0) {
            perfTables.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('  No fund/performance related tables found');
        }

        // Check insurance_companies table structure
        console.log('\n=== insurance_companies table structure ===');
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'insurance_companies'
            ORDER BY ordinal_position
        `);

        columnsResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

    } finally {
        await client.end();
        console.log('\nDatabase connection closed');
    }
}

checkTables();
