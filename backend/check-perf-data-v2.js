const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('=== Connected to database ===\n');

        // 1. Check insurance companies
        const companies = await client.query(`
            SELECT id, company_code, company_name, display_name, is_active
            FROM insurance_companies
            ORDER BY id
        `);
        console.log('=== Insurance Companies ===');
        console.log(`Total: ${companies.rows.length} companies\n`);
        companies.rows.forEach(c => {
            console.log(`  [${c.company_code}] ${c.company_name}`);
            if (c.display_name) console.log(`    Display: ${c.display_name}`);
            console.log(`    Active: ${c.is_active}, ID: ${c.id}`);
        });

        // 2. Check special_accounts table structure
        console.log('\n=== special_accounts table structure ===');
        const saColumns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'special_accounts'
            ORDER BY ordinal_position
        `);
        saColumns.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

        // 3. Check special accounts count per company
        console.log('\n=== Special Accounts by Company ===');
        const accountCount = await client.query(`
            SELECT
                ic.company_code,
                ic.company_name,
                COUNT(sa.id) as account_count,
                STRING_AGG(sa.account_name, ', ' ORDER BY sa.account_name) as account_names
            FROM insurance_companies ic
            LEFT JOIN special_accounts sa ON sa.company_id = ic.id
            GROUP BY ic.company_code, ic.company_name
            ORDER BY ic.company_code
        `);
        accountCount.rows.forEach(r => {
            console.log(`\n  ${r.company_code}: ${r.account_count} accounts`);
            if (r.account_names) {
                const names = r.account_names.split(', ');
                names.forEach(name => {
                    console.log(`    - ${name}`);
                });
            }
        });

        // 4. Check special_account_performance table structure
        console.log('\n\n=== special_account_performance table structure ===');
        const sapColumns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'special_account_performance'
            ORDER BY ordinal_position
        `);
        sapColumns.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

        // 5. Check performance data count per company
        console.log('\n=== Performance Data by Company ===');
        const perfCount = await client.query(`
            SELECT
                ic.company_code,
                COUNT(sap.id) as perf_records,
                MIN(sap.performance_date) as earliest_date,
                MAX(sap.performance_date) as latest_date,
                COUNT(DISTINCT sa.id) as accounts_with_data
            FROM insurance_companies ic
            LEFT JOIN special_accounts sa ON sa.company_id = ic.id
            LEFT JOIN special_account_performance sap ON sap.special_account_id = sa.id
            GROUP BY ic.company_code
            ORDER BY ic.company_code
        `);
        perfCount.rows.forEach(r => {
            console.log(`\n  ${r.company_code}:`);
            console.log(`    Records: ${r.perf_records}`);
            console.log(`    Accounts with data: ${r.accounts_with_data}`);
            console.log(`    Date range: ${r.earliest_date || 'N/A'} to ${r.latest_date || 'N/A'}`);
        });

        // 6. Check market_data table
        console.log('\n\n=== market_data table structure ===');
        const mdColumns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'market_data'
            ORDER BY ordinal_position
        `);
        mdColumns.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

        // 7. Check market data count
        const marketDataCount = await client.query(`
            SELECT COUNT(*) as total FROM market_data
        `);
        console.log(`\nTotal market_data records: ${marketDataCount.rows[0].total}`);

        // 8. Sample performance data for each company
        console.log('\n\n=== Sample Performance Data (latest per company) ===');
        const sampleData = await client.query(`
            SELECT
                ic.company_code,
                sa.account_name,
                sap.performance_date,
                sap.unit_price,
                sap.return_1m,
                sap.return_3m,
                sap.return_1y
            FROM insurance_companies ic
            JOIN special_accounts sa ON sa.company_id = ic.id
            JOIN special_account_performance sap ON sap.special_account_id = sa.id
            WHERE sap.id IN (
                SELECT MAX(id)
                FROM special_account_performance
                WHERE special_account_id IN (
                    SELECT id FROM special_accounts WHERE company_id = ic.id
                )
            )
            ORDER BY ic.company_code, sa.account_name
            LIMIT 20
        `);

        if (sampleData.rows.length > 0) {
            sampleData.rows.forEach(r => {
                console.log(`\n  ${r.company_code} - ${r.account_name}`);
                console.log(`    Date: ${r.performance_date}`);
                console.log(`    Unit Price: ${r.unit_price}`);
                console.log(`    Returns: 1M=${r.return_1m}%, 3M=${r.return_3m}%, 1Y=${r.return_1y}%`);
            });
        } else {
            console.log('  No performance data found');
        }

    } finally {
        await client.end();
        console.log('\n\n=== Database connection closed ===');
    }
}

checkData().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
