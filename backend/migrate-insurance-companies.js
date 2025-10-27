#!/usr/bin/env node

/**
 * Migration script to add insurance companies and special accounts
 * Run with: node migrate-insurance-companies.js
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL not found in environment variables');
        process.exit(1);
    }

    console.log('🔄 Connecting to database...');

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // Read migration SQL file
        const sqlFilePath = path.join(__dirname, '../docs/add-insurance-companies.sql');
        console.log('📄 Reading migration file:', sqlFilePath);

        const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

        // Execute migration
        console.log('🚀 Executing migration...');
        await client.query(sqlContent);

        console.log('✅ Migration completed successfully!');

        // Verify data
        console.log('\n📊 Verifying inserted data...');

        const companiesResult = await client.query('SELECT * FROM insurance_companies ORDER BY id');
        console.log('\nInsurance Companies:');
        console.table(companiesResult.rows);

        const accountsResult = await client.query(`
            SELECT sa.id, ic.company_code, sa.account_code, sa.account_name, sa.account_type
            FROM special_accounts sa
            JOIN insurance_companies ic ON sa.company_id = ic.id
            ORDER BY ic.company_code, sa.id
        `);
        console.log('\nSpecial Accounts:');
        console.table(accountsResult.rows);

        const performanceResult = await client.query(`
            SELECT
                ic.company_code,
                sa.account_code,
                COUNT(*) as performance_records
            FROM special_account_performance sap
            JOIN special_accounts sa ON sap.special_account_id = sa.id
            JOIN insurance_companies ic ON sa.company_id = ic.id
            GROUP BY ic.company_code, sa.account_code
            ORDER BY ic.company_code, sa.account_code
        `);
        console.log('\nPerformance Records:');
        console.table(performanceResult.rows);

        client.release();

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n✅ Database connection closed');
    }
}

runMigration();
