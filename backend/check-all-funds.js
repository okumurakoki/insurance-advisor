const { Client } = require('pg');
require('dotenv').config();

async function checkAllFunds() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('=== Detailed Fund Analysis ===\n');

        // Get all special accounts with full details
        const allAccounts = await client.query(`
            SELECT
                ic.company_code,
                ic.company_name,
                sa.id as account_id,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.benchmark,
                sa.is_active,
                (SELECT COUNT(*) FROM special_account_performance WHERE special_account_id = sa.id) as perf_count,
                (SELECT MAX(performance_date) FROM special_account_performance WHERE special_account_id = sa.id) as latest_perf_date
            FROM insurance_companies ic
            LEFT JOIN special_accounts sa ON sa.company_id = ic.id
            ORDER BY ic.company_code, sa.account_name
        `);

        let currentCompany = null;
        let companyTotal = 0;
        let companyWithData = 0;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        allAccounts.rows.forEach((row, idx) => {
            // Print company header when it changes
            if (currentCompany !== row.company_code) {
                // Print summary for previous company
                if (currentCompany !== null) {
                    console.log(`\n  📊 Summary: ${companyWithData}/${companyTotal} accounts have data`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                }

                currentCompany = row.company_code;
                companyTotal = 0;
                companyWithData = 0;

                console.log(`\n🏢 ${row.company_code} - ${row.company_name}`);
                console.log('─────────────────────────────────────────────────────');
            }

            if (row.account_id) {
                companyTotal++;
                const hasData = row.perf_count > 0;
                if (hasData) companyWithData++;

                const status = hasData ? '✅' : '❌';
                console.log(`\n  ${status} ${row.account_name}`);
                console.log(`     Code: ${row.account_code || 'N/A'}`);
                console.log(`     Type: ${row.account_type || 'N/A'}`);
                console.log(`     Benchmark: ${row.benchmark || 'N/A'}`);
                console.log(`     Active: ${row.is_active}`);
                console.log(`     Performance Records: ${row.perf_count}`);
                console.log(`     Latest Data: ${row.latest_perf_date || 'N/A'}`);
            } else if (currentCompany === row.company_code) {
                console.log('\n  ⚠️  No special accounts found for this company');
            }
        });

        // Print summary for last company
        if (currentCompany !== null) {
            console.log(`\n  📊 Summary: ${companyWithData}/${companyTotal} accounts have data`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        // Overall summary
        const totalAccounts = await client.query(`
            SELECT COUNT(*) as total FROM special_accounts
        `);
        const accountsWithData = await client.query(`
            SELECT COUNT(DISTINCT special_account_id) as total
            FROM special_account_performance
        `);
        const totalPerf = await client.query(`
            SELECT COUNT(*) as total FROM special_account_performance
        `);

        console.log('\n=== OVERALL SUMMARY ===');
        console.log(`Total Special Accounts: ${totalAccounts.rows[0].total}`);
        console.log(`Accounts with Performance Data: ${accountsWithData.rows[0].total}`);
        console.log(`Total Performance Records: ${totalPerf.rows[0].total}`);
        console.log(`Coverage Rate: ${((accountsWithData.rows[0].total / totalAccounts.rows[0].total) * 100).toFixed(1)}%`);

        // Check for duplicate fund names
        console.log('\n=== DUPLICATE FUND NAME CHECK ===');
        const duplicates = await client.query(`
            SELECT account_name, COUNT(*) as count, STRING_AGG(ic.company_code, ', ') as companies
            FROM special_accounts sa
            JOIN insurance_companies ic ON ic.id = sa.company_id
            GROUP BY account_name
            HAVING COUNT(*) > 1
            ORDER BY count DESC, account_name
        `);

        if (duplicates.rows.length > 0) {
            console.log(`Found ${duplicates.rows.length} fund names used across multiple companies:\n`);
            duplicates.rows.forEach(row => {
                console.log(`  "${row.account_name}"`);
                console.log(`    Used by ${row.count} companies: ${row.companies}\n`);
            });
        } else {
            console.log('✅ No duplicate fund names found - all fund names are unique per company');
        }

    } finally {
        await client.end();
        console.log('\n=== Done ===');
    }
}

checkAllFunds().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
