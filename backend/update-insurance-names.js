#!/usr/bin/env node

/**
 * Update insurance company display names to proper names
 */

// Load environment variables
require('dotenv').config();

const db = require('./src/utils/database-factory');

const COMPANY_UPDATES = [
    {
        company_code: 'PRUDENTIAL_LIFE',
        company_name: 'プルデンシャル生命保険株式会社',
        display_name: 'プルデンシャル生命'
    },
    {
        company_code: 'SONY_LIFE',
        company_name: 'ソニー生命保険株式会社（バリアブル・ライフ）',
        display_name: 'ソニー生命（バリアブル・ライフ）'
    },
    {
        company_code: 'SONY_LIFE_SOVANI',
        company_name: 'ソニー生命保険株式会社（SOVANI）',
        display_name: 'ソニー生命（SOVANI）'
    },
    {
        company_code: 'AXA_LIFE',
        company_name: 'アクサ生命保険株式会社',
        display_name: 'アクサ生命'
    }
];

async function updateInsuranceNames() {
    console.log('🔄 保険会社名の更新を開始します...\n');

    try {
        for (const company of COMPANY_UPDATES) {
            console.log(`更新中: ${company.company_code}`);

            await db.query(
                `UPDATE insurance_companies
                 SET company_name = $1,
                     display_name = $2,
                     updated_at = NOW()
                 WHERE company_code = $3`,
                [company.company_name, company.display_name, company.company_code]
            );

            console.log(`✅ ${company.company_code} → ${company.display_name}`);
        }

        // Verify updates
        const allCompanies = await db.query(
            'SELECT id, company_code, company_name, display_name FROM insurance_companies ORDER BY id'
        );

        console.log('\n📋 更新後の保険会社一覧:');
        console.table(allCompanies);

        console.log('\n✅ 更新完了！');

    } catch (error) {
        console.error('❌ 更新エラー:', error.message);
        console.error('詳細:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Run update
updateInsuranceNames();
