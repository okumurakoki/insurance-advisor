#!/usr/bin/env node

/**
 * Upload all demo PDFs to database
 */

require('dotenv').config();
const fs = require('fs').promises;
const { parsePDF, validateParsedData } = require('./src/utils/pdfParser');
const db = require('./src/utils/database-factory');

const PDFS = [
    {
        name: 'ソニー生命バリアブル',
        path: '/Users/kohki_okumura/Downloads/ソニーdemo.pdf'
    },
    {
        name: 'アクサ生命',
        path: '/Users/kohki_okumura/Downloads/アクサdemo1.pdf'
    },
    {
        name: 'SOVANI',
        path: '/Users/kohki_okumura/Downloads/SOVANI 8月.pdf'
    },
    {
        name: 'プルデンシャル生命',
        path: '/Users/kohki_okumura/Documents/プルデンシャル6月版.pdf'
    }
];

async function uploadPDF(pdfInfo) {
    console.log(`\n📤 ${pdfInfo.name} をアップロード中...`);

    try {
        // Read PDF
        const pdfBuffer = await fs.readFile(pdfInfo.path);

        // Parse PDF
        const parsedData = await parsePDF(pdfBuffer);
        validateParsedData(parsedData);

        console.log(`  会社コード: ${parsedData.companyCode}`);
        console.log(`  データ日付: ${parsedData.dataDate}`);
        console.log(`  特別勘定数: ${parsedData.accounts.length}`);

        // Get company ID
        const companies = await db.query(
            'SELECT id, display_name FROM insurance_companies WHERE company_code = $1',
            [parsedData.companyCode]
        );

        if (companies.length === 0) {
            throw new Error(`Company ${parsedData.companyCode} not found in database`);
        }

        const companyId = companies[0].id;
        console.log(`  会社: ${companies[0].display_name} (ID: ${companyId})`);

        // Start transaction
        await db.query('BEGIN');

        let newAccountsCount = 0;
        let newPerformanceCount = 0;

        try {
            for (const account of parsedData.accounts) {
                // Check if account exists
                let specialAccount = await db.query(
                    'SELECT id FROM special_accounts WHERE company_id = $1 AND account_code = $2',
                    [companyId, account.accountCode]
                );

                let accountId;

                if (specialAccount.length === 0) {
                    // Insert new account
                    const insertResult = await db.query(
                        `INSERT INTO special_accounts (
                            company_id, account_code, account_name, account_type, is_active
                        ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                        [companyId, account.accountCode, account.accountName, account.accountType]
                    );
                    accountId = insertResult[0].id;
                    newAccountsCount++;
                } else {
                    accountId = specialAccount[0].id;
                }

                // Insert performance data
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
            }

            await db.query('COMMIT');

            console.log(`  ✅ 成功!`);
            console.log(`     新規特別勘定: ${newAccountsCount}`);
            console.log(`     パフォーマンスデータ: ${newPerformanceCount}`);

            return { success: true, accounts: newAccountsCount, performance: newPerformanceCount };

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error(`  ❌ エラー: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function uploadAll() {
    console.log('🚀 全PDFアップロード開始\n');
    console.log('='.repeat(60));

    const results = [];

    for (const pdf of PDFS) {
        const result = await uploadPDF(pdf);
        results.push({ name: pdf.name, ...result });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 アップロード結果サマリー:');
    results.forEach(r => {
        if (r.success) {
            console.log(`  ✅ ${r.name}: ${r.accounts}社 / ${r.performance}件`);
        } else {
            console.log(`  ❌ ${r.name}: ${r.error}`);
        }
    });

    // Verify
    console.log('\n📋 データベース確認:');
    const summary = await db.query(`
        SELECT
            ic.display_name,
            COUNT(DISTINCT sa.id) as account_count,
            COUNT(sap.id) as perf_count
        FROM insurance_companies ic
        LEFT JOIN special_accounts sa ON ic.id = sa.company_id
        LEFT JOIN special_account_performance sap ON sa.id = sap.special_account_id
        GROUP BY ic.id, ic.display_name
        ORDER BY ic.id
    `);
    console.table(summary);

    await db.close();
    console.log('\n✅ 完了!');
}

uploadAll().catch(console.error);
