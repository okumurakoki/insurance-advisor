#!/usr/bin/env node

/**
 * Check PDF upload history
 */

// Load environment variables
require('dotenv').config();

const db = require('./src/utils/database-factory');

async function checkUploadHistory() {
    console.log('📋 PDFアップロード履歴を確認中...\n');

    try {
        // Check if table exists
        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE '%upload%'
            ORDER BY table_name
        `);

        console.log('Upload関連のテーブル:');
        console.table(tables);

        // Get recent uploads
        const uploads = await db.query(`
            SELECT * FROM pdf_upload_history
            ORDER BY uploaded_at DESC
            LIMIT 10
        `);

        console.log('\n最近のアップロード履歴:');
        console.table(uploads);

        // Check all companies data
        console.log('\n\n全保険会社の特別勘定数:');
        const companyCounts = await db.query(`
            SELECT
                ic.company_code,
                ic.display_name,
                COUNT(sa.id) as account_count,
                COUNT(DISTINCT sap.performance_date) as performance_dates
            FROM insurance_companies ic
            LEFT JOIN special_accounts sa ON ic.id = sa.company_id
            LEFT JOIN special_account_performance sap ON sa.id = sap.special_account_id
            GROUP BY ic.id, ic.company_code, ic.display_name
            ORDER BY ic.id
        `);
        console.table(companyCounts);

        console.log('\n✅ 確認完了！');

    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error('詳細:', error);
    } finally {
        await db.close();
    }
}

checkUploadHistory();
