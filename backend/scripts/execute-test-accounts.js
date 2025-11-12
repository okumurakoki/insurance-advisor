const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

const db = require('../src/utils/database-factory');

async function executeSQL() {
    try {
        console.log('📝 読み込み中: create_test_accounts.sql');

        const sql = fs.readFileSync(
            path.join(__dirname, 'create_test_accounts.sql'),
            'utf8'
        );

        console.log('🔄 SQL実行中...');

        // PostgreSQLでは複数のステートメントを一度に実行できる
        const result = await db.query(sql);

        console.log('✅ テストアカウント作成完了！');
        console.log('\n📋 作成されたアカウント:');
        console.log('  代理店: test-agency / TestAgency123!');
        console.log('  スタッフ: test-staff / TestStaff123!');
        console.log('  顧客: テスト太郎');

        // 確認クエリを実行
        console.log('\n🔍 確認中...');
        const users = await db.query(`
            SELECT
                u.id,
                u.user_id,
                u.name,
                u.email,
                u.account_type,
                u.plan_type,
                u.is_active,
                parent.user_id as parent_user_id
            FROM users u
            LEFT JOIN users parent ON u.parent_id = parent.id
            WHERE u.user_id IN ('test-agency', 'test-staff')
            ORDER BY u.account_type DESC
        `);

        console.log('\n👥 ユーザー:');
        console.table(users.rows);

        const customers = await db.query(`
            SELECT
                c.id,
                c.name,
                c.email,
                c.risk_tolerance,
                u.user_id as staff_user_id,
                u.name as staff_name
            FROM customers c
            JOIN users u ON c.user_id = u.id
            WHERE c.name = 'テスト太郎'
        `);

        console.log('\n👤 顧客:');
        console.table(customers.rows);

        process.exit(0);
    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error(error);
        process.exit(1);
    }
}

executeSQL();
