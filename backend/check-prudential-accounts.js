#!/usr/bin/env node

/**
 * Check Prudential special accounts in database
 */

// Load environment variables
require('dotenv').config();

const db = require('./src/utils/database-factory');

async function checkPrudentialAccounts() {
    console.log('🔍 プルデンシャル生命の特別勘定を確認中...\n');

    try {
        // Get Prudential company info
        const company = await db.query(
            `SELECT * FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'`
        );

        if (company.length === 0) {
            console.log('❌ プルデンシャル生命が見つかりません');
            return;
        }

        console.log('会社情報:');
        console.table(company);

        // Get special accounts
        const accounts = await db.query(
            `SELECT id, account_code, account_name, account_type, is_active
             FROM special_accounts
             WHERE company_id = $1
             ORDER BY account_code`,
            [company[0].id]
        );

        console.log(`\n特別勘定数: ${accounts.length}\n`);
        console.table(accounts);

        // Get latest performance data
        const performance = await db.query(
            `SELECT sa.account_code, sa.account_name, sap.performance_date
             FROM special_accounts sa
             LEFT JOIN special_account_performance sap ON sa.id = sap.special_account_id
             WHERE sa.company_id = $1
             ORDER BY sa.account_code, sap.performance_date DESC`,
            [company[0].id]
        );

        console.log('\nパフォーマンスデータ:');
        console.table(performance.slice(0, 20)); // Show first 20

        console.log('\n✅ 確認完了！');

    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error('詳細:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

checkPrudentialAccounts();
