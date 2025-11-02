#!/usr/bin/env node

/**
 * Test PDF upload with Prudential June PDF
 * Simulates the /api/pdf-upload/auto endpoint
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs').promises;
const { parsePDF, validateParsedData } = require('./src/utils/pdfParser');
const db = require('./src/utils/database-factory');

async function testUpload() {
    console.log('📤 Testing PDF upload with Prudential June PDF...\n');

    try {
        // Read PDF file
        const pdfPath = '/Users/kohki_okumura/Documents/プルデンシャル6月版.pdf';
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log('✅ PDF file loaded\n');

        // Parse PDF with auto-detection
        const parsedData = await parsePDF(pdfBuffer);
        console.log(`✅ Detected company: ${parsedData.companyCode}`);
        console.log(`✅ Parsed data date: ${parsedData.dataDate}`);
        console.log(`✅ Parsed ${parsedData.accounts.length} accounts\n`);

        // Validate parsed data
        validateParsedData(parsedData);
        console.log('✅ Data validation passed\n');

        // Get company ID
        const companies = await db.query(
            'SELECT id, display_name FROM insurance_companies WHERE company_code = $1',
            [parsedData.companyCode]
        );

        if (companies.length === 0) {
            throw new Error(`Company ${parsedData.companyCode} not found in database`);
        }

        const companyId = companies[0].id;
        console.log(`✅ Found company: ${companies[0].display_name} (ID: ${companyId})\n`);

        // Start transaction
        await db.query('BEGIN');

        let newAccountsCount = 0;
        let newPerformanceCount = 0;
        let updatedPerformanceCount = 0;

        try {
            for (const account of parsedData.accounts) {
                // Check if special account exists
                let specialAccount = await db.query(
                    'SELECT id FROM special_accounts WHERE company_id = $1 AND account_code = $2',
                    [companyId, account.accountCode]
                );

                let accountId;

                if (specialAccount.length === 0) {
                    // Insert new special account
                    const insertResult = await db.query(
                        `INSERT INTO special_accounts (
                            company_id, account_code, account_name, account_type, is_active
                        ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                        [companyId, account.accountCode, account.accountName, account.accountType]
                    );
                    accountId = insertResult[0].id;
                    newAccountsCount++;
                    console.log(`  ✅ Created account: ${account.accountName}`);
                } else {
                    accountId = specialAccount[0].id;
                    console.log(`  ⏭️  Account exists: ${account.accountName}`);
                }

                // Check if performance data exists for this date
                const existingPerf = await db.query(
                    `SELECT id FROM special_account_performance
                     WHERE special_account_id = $1 AND performance_date = $2`,
                    [accountId, parsedData.dataDate]
                );

                if (existingPerf.length === 0) {
                    // Insert new performance data
                    await db.query(
                        `INSERT INTO special_account_performance (
                            special_account_id, performance_date, unit_price,
                            return_1m, return_3m, return_6m, return_1y
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            accountId,
                            parsedData.dataDate,
                            account.unitPrice,
                            account.return1m || null,
                            account.return3m || null,
                            account.return6m || null,
                            account.return1y || null
                        ]
                    );
                    newPerformanceCount++;
                    console.log(`    ✅ Added performance data`);
                } else {
                    // Update existing performance data
                    await db.query(
                        `UPDATE special_account_performance SET
                            unit_price = $1,
                            return_1m = $2,
                            return_3m = $3,
                            return_6m = $4,
                            return_1y = $5,
                            updated_at = NOW()
                         WHERE id = $6`,
                        [
                            account.unitPrice,
                            account.return1m || null,
                            account.return3m || null,
                            account.return6m || null,
                            account.return1y || null,
                            existingPerf[0].id
                        ]
                    );
                    updatedPerformanceCount++;
                    console.log(`    ⏭️  Updated performance data`);
                }
            }

            // Commit transaction
            await db.query('COMMIT');

            console.log('\n✅ Transaction committed successfully!');
            console.log('\n📊 Summary:');
            console.log(`   Data Date: ${parsedData.dataDate}`);
            console.log(`   Company: ${parsedData.companyCode}`);
            console.log(`   Total Accounts: ${parsedData.accounts.length}`);
            console.log(`   New Accounts Created: ${newAccountsCount}`);
            console.log(`   New Performance Records: ${newPerformanceCount}`);
            console.log(`   Updated Performance Records: ${updatedPerformanceCount}`);

        } catch (error) {
            // Rollback on error
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Details:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

testUpload();
