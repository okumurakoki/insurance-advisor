const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected\n');

        const companies = await client.query('SELECT company_code, company_name FROM insurance_companies ORDER BY id');
        console.log('Companies:', companies.rows.length);
        companies.rows.forEach(c => console.log(`  ${c.company_code}: ${c.company_name}`));

        const fundCount = await client.query('SELECT ic.company_code, COUNT(f.id) as cnt FROM insurance_companies ic LEFT JOIN funds f ON f.company_id = ic.id GROUP BY ic.company_code ORDER BY ic.company_code');
        console.log('\nFunds:');
        fundCount.rows.forEach(r => console.log(`  ${r.company_code}: ${r.cnt}`));

        const dataCount = await client.query('SELECT ic.company_code, COUNT(md.id) as cnt, MAX(md.data_date) as latest FROM insurance_companies ic LEFT JOIN funds f ON f.company_id = ic.id LEFT JOIN market_data md ON md.fund_id = f.id GROUP BY ic.company_code');
        console.log('\nMarket Data:');
        dataCount.rows.forEach(r => console.log(`  ${r.company_code}: ${r.cnt} records, latest: ${r.latest}`));

    } finally {
        await client.end();
    }
}

checkData();
