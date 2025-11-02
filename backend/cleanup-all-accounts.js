#!/usr/bin/env node

/**
 * Clean up all special accounts and performance data
 * to start fresh with correct PDF data
 */

require('dotenv').config();
const db = require('./src/utils/database-factory');

async function cleanupAll() {
    console.log('🔄 全特別勘定とパフォーマンスデータをクリーンアップ中...\n');

    try {
        // Show current data
        const current = await db.query(`
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

        console.log('現在のデータ:');
        console.table(current);

        // Delete all performance data
        console.log('\n⏳ パフォーマンスデータを削除中...');
        const deletedPerf = await db.query('DELETE FROM special_account_performance');
        console.log(`✅ パフォーマンスデータ削除完了`);

        // Delete all special accounts
        console.log('\n⏳ 特別勘定を削除中...');
        const deletedAccounts = await db.query('DELETE FROM special_accounts');
        console.log(`✅ 特別勘定削除完了`);

        // Verify
        const remaining = await db.query(`
            SELECT
                COUNT(DISTINCT sa.id) as account_count,
                COUNT(sap.id) as perf_count
            FROM special_accounts sa
            LEFT JOIN special_account_performance sap ON sa.id = sap.special_account_id
        `);

        console.log('\n残りのデータ:');
        console.table(remaining);
        console.log('\n✅ クリーンアップ完了！');
        console.log('\n📝 次のステップ: /pdf-upload ページで正しいPDFをアップロードしてください');

    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

cleanupAll();
