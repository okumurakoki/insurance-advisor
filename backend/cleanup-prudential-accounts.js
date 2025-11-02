#!/usr/bin/env node

/**
 * Clean up Prudential special accounts - remove old incorrect data
 * and keep only the 6 accounts that actually exist in the PDFs
 */

// Load environment variables
require('dotenv').config();

const db = require('./src/utils/database-factory');

async function cleanupPrudentialAccounts() {
    console.log('🔄 プルデンシャル生命の特別勘定をクリーンアップ中...\n');

    try {
        // Get Prudential company
        const company = await db.query(
            `SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'`
        );

        if (company.length === 0) {
            console.log('❌ プルデンシャル生命が見つかりません');
            return;
        }

        const companyId = company[0].id;

        // Show current accounts
        const currentAccounts = await db.query(
            `SELECT id, account_code, account_name FROM special_accounts WHERE company_id = $1 ORDER BY account_code`,
            [companyId]
        );

        console.log('現在の特別勘定 (11社):');
        console.table(currentAccounts);

        // Delete all performance data first (foreign key constraint)
        console.log('\n⏳ パフォーマンスデータを削除中...');
        const deletePerf = await db.query(
            `DELETE FROM special_account_performance
             WHERE special_account_id IN (
                 SELECT id FROM special_accounts WHERE company_id = $1
             )`,
            [companyId]
        );
        console.log(`✅ ${deletePerf.length || 'All'} パフォーマンスレコードを削除しました`);

        // Delete all special accounts
        console.log('\n⏳ 特別勘定を削除中...');
        const deleteAccounts = await db.query(
            `DELETE FROM special_accounts WHERE company_id = $1`,
            [companyId]
        );
        console.log(`✅ ${deleteAccounts.length || 'All'} 特別勘定を削除しました`);

        // The correct 6 accounts will be created when PDF is uploaded
        console.log('\n📝 注意: 正しい6社のデータは次回のPDFアップロード時に自動作成されます');
        console.log('   - 総合型');
        console.log('   - 債券型');
        console.log('   - 株式型');
        console.log('   - 米国債券型');
        console.log('   - 米国株式型');
        console.log('   - REIT型');

        // Verify deletion
        const remaining = await db.query(
            `SELECT COUNT(*) as count FROM special_accounts WHERE company_id = $1`,
            [companyId]
        );

        console.log(`\n残りの特別勘定数: ${remaining[0].count}`);
        console.log('\n✅ クリーンアップ完了！');

    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error('詳細:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

cleanupPrudentialAccounts();
