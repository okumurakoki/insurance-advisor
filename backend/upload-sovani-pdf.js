const fs = require('fs').promises;
const { parseSovaniPDF, validateParsedData } = require('./src/utils/pdfParser');
const { Client } = require('pg');
require('dotenv').config();

async function uploadPDF() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Read and parse PDF
        console.log('Reading PDF file...');
        const pdfPath = '/Users/kohki_okumura/Downloads/SOVANI 8月.pdf';
        const pdfBuffer = await fs.readFile(pdfPath);

        console.log('Parsing PDF...');
        const parsedData = await parseSovaniPDF(pdfBuffer);

        console.log('Validating parsed data...');
        validateParsedData(parsedData);

        console.log(`\n✅ Parsed ${parsedData.accounts.length} accounts for date ${parsedData.dataDate}`);

        // Connect to database
        await client.connect();
        console.log('\n✅ Connected to database');

        // Get company ID
        const companyResult = await client.query(
            'SELECT id FROM insurance_companies WHERE company_code = $1',
            [parsedData.companyCode]
        );

        if (companyResult.rows.length === 0) {
            throw new Error(`Company ${parsedData.companyCode} not found`);
        }

        const companyId = companyResult.rows[0].id;
        console.log(`✅ Found company ID: ${companyId}`);

        // Start transaction
        await client.query('BEGIN');

        let newAccountsCount = 0;
        let newPerformanceCount = 0;
        let updatedPerformanceCount = 0;

        try {
            for (const account of parsedData.accounts) {
                // Check if special account exists
                let specialAccountResult = await client.query(
                    'SELECT id FROM special_accounts WHERE company_id = $1 AND account_code = $2',
                    [companyId, account.accountCode]
                );

                let accountId;

                if (specialAccountResult.rows.length === 0) {
                    // Insert new special account
                    const insertResult = await client.query(
                        `INSERT INTO special_accounts (
                            company_id, account_code, account_name, account_type, is_active
                        ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                        [companyId, account.accountCode, account.accountName, account.accountType]
                    );
                    accountId = insertResult.rows[0].id;
                    newAccountsCount++;
                    console.log(`  ✅ Created new account: ${account.accountName} (ID: ${accountId})`);
                } else {
                    accountId = specialAccountResult.rows[0].id;
                }

                // Check if performance data already exists for this date
                const existingPerfResult = await client.query(
                    `SELECT id FROM special_account_performance
                     WHERE special_account_id = $1 AND performance_date = $2`,
                    [accountId, parsedData.dataDate]
                );

                if (existingPerfResult.rows.length === 0) {
                    // Insert new performance data
                    await client.query(
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
                    console.log(`  ✅ Added performance data for ${account.accountName}`);
                } else {
                    // Update existing performance data
                    await client.query(
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
                            existingPerfResult.rows[0].id
                        ]
                    );
                    updatedPerformanceCount++;
                    console.log(`  ✅ Updated performance data for ${account.accountName}`);
                }
            }

            // Commit transaction
            await client.query('COMMIT');

            console.log('\n=== UPLOAD SUMMARY ===');
            console.log(`Data Date: ${parsedData.dataDate}`);
            console.log(`Company: ${parsedData.companyCode}`);
            console.log(`Total Accounts Processed: ${parsedData.accounts.length}`);
            console.log(`New Accounts Created: ${newAccountsCount}`);
            console.log(`New Performance Records: ${newPerformanceCount}`);
            console.log(`Updated Performance Records: ${updatedPerformanceCount}`);
            console.log('\n✅ Upload completed successfully!');

        } catch (error) {
            // Rollback on error
            await client.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n Database connection closed');
    }
}

uploadPDF();
