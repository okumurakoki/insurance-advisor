#!/usr/bin/env node

/**
 * Fix production database:
 * 1. Update SOVANI company code
 * 2. Clean up old account data
 */

require('dotenv').config();
const db = require('./src/utils/database-factory');

async function fixProductionData() {
    console.log('🔧 本番データベースを修正中...\n');

    try {
        // Step 1: Update SOVANI company code
        console.log('ステップ 1: SOVANI会社コードを修正中...');
        const beforeSovani = await db.query(
            "SELECT id, company_code, display_name FROM insurance_companies WHERE display_name LIKE '%SOVANI%'"
        );
        console.log('修正前:');
        console.table(beforeSovani);

        await db.query(
            "UPDATE insurance_companies SET company_code = 'SONY_LIFE_ANNUITY' WHERE company_code = 'SONY_LIFE_SOVANI'"
        );

        const afterSovani = await db.query(
            "SELECT id, company_code, display_name FROM insurance_companies WHERE display_name LIKE '%SOVANI%'"
        );
        console.log('\n修正後:');
        console.table(afterSovani);
        console.log('✅ SOVANI会社コード修正完了\n');

        // Step 2: Show current data
        console.log('ステップ 2: 現在のデータを確認中...');
        const currentData = await db.query(`
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
        console.table(currentData);

        // Step 3: Clean up all old data
        console.log('\nステップ 3: 古いデータをクリーンアップ中...');
        console.log('⚠️  全パフォーマンスデータと特別勘定を削除します...');

        const deletedPerf = await db.query('DELETE FROM special_account_performance');
        console.log(`✅ パフォーマンスデータ削除完了`);

        const deletedAccounts = await db.query('DELETE FROM special_accounts');
        console.log(`✅ 特別勘定削除完了`);

        // Verify cleanup
        const afterCleanup = await db.query(`
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
        console.log('\nクリーンアップ後:');
        console.table(afterCleanup);

        console.log('\n✅ 本番データベース修正完了！');
        console.log('\n📝 次のステップ:');
        console.log('   /pdf-upload ページで以下のPDFをアップロードしてください:');
        console.log('   1. ソニー生命バリアブル (ソニーdemo.pdf)');
        console.log('   2. アクサ生命 (アクサdemo1.pdf)');
        console.log('   3. SOVANI (SOVANI 8月.pdf)');
        console.log('   4. プルデンシャル生命 (プルデンシャル6月版.pdf)');

    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

fixProductionData();
