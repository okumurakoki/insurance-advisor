#!/usr/bin/env node

/**
 * Seed script to add insurance companies to the database
 * Supports both simple in-memory DB and PostgreSQL
 */

// Load environment variables
require('dotenv').config();

const db = require('./src/utils/database-factory');

const INSURANCE_COMPANIES = [
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
        company_code: 'SONY_LIFE_ANNUITY',
        company_name: 'ソニー生命保険株式会社（変額個人年金）',
        display_name: 'ソニー生命（個人年金）'
    },
    {
        company_code: 'AXA_LIFE',
        company_name: 'アクサ生命保険株式会社',
        display_name: 'アクサ生命'
    },
    {
        company_code: 'SOMPO_HIMAWARI_LIFE',
        company_name: 'SOMPOひまわり生命保険株式会社',
        display_name: 'SOMPOひまわり生命'
    },
    {
        company_code: 'HANASAKU_LIFE',
        company_name: 'はなさく生命保険株式会社',
        display_name: 'はなさく生命'
    }
];

async function seedInsuranceCompanies() {
    console.log('🔄 保険会社データのシーディングを開始します...');

    try {
        // Check if companies already exist
        const existing = await db.query(
            'SELECT company_code FROM insurance_companies'
        );

        const existingCodes = existing.map(row => row.company_code);
        console.log('既存の保険会社コード:', existingCodes);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const company of INSURANCE_COMPANIES) {
            if (existingCodes.includes(company.company_code)) {
                console.log(`⏭️  スキップ: ${company.company_code} (既に存在します)`);
                skippedCount++;
                continue;
            }

            await db.query(
                `INSERT INTO insurance_companies (company_code, company_name, display_name, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [company.company_code, company.company_name, company.display_name]
            );

            console.log(`✅ 追加完了: ${company.company_code} - ${company.display_name}`);
            insertedCount++;
        }

        console.log(`\n📊 結果:`);
        console.log(`   追加: ${insertedCount}件`);
        console.log(`   スキップ: ${skippedCount}件`);

        // Verify all companies
        const allCompanies = await db.query(
            'SELECT id, company_code, company_name, display_name FROM insurance_companies ORDER BY id'
        );

        console.log('\n📋 登録されている保険会社一覧:');
        console.table(allCompanies);

        console.log('\n✅ シーディング完了！');

    } catch (error) {
        console.error('❌ シーディングエラー:', error.message);
        console.error('詳細:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Run seeding
seedInsuranceCompanies();
