const { Pool } = require('pg');
require('dotenv').config();

async function fixAgencyLimits() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('\n現在の状態:');
        const beforeResult = await client.query(`
            SELECT u.id, u.user_id, u.plan_type, u.staff_limit, u.customer_limit_per_staff,
                   pd.staff_limit as plan_staff_limit, pd.customer_limit_per_staff as plan_customer_limit_per_staff
            FROM users u
            LEFT JOIN plan_definitions pd ON u.plan_type::text = pd.plan_type
            WHERE u.account_type = 'parent'
            ORDER BY u.id
        `);
        console.table(beforeResult.rows);

        console.log('\nプラン定義に基づいて代理店の上限を修正中...');

        // エクシードプラン以外の代理店：プラン定義の値で上書き
        const updateNormalResult = await client.query(`
            UPDATE users u
            SET
                staff_limit = pd.staff_limit,
                customer_limit = pd.customer_limit,
                customer_limit_per_staff = pd.customer_limit_per_staff,
                updated_at = CURRENT_TIMESTAMP
            FROM plan_definitions pd
            WHERE u.account_type = 'parent'
              AND u.plan_type::text = pd.plan_type
              AND u.plan_type != 'exceed'
              AND (u.staff_limit != pd.staff_limit
                   OR u.customer_limit_per_staff IS DISTINCT FROM pd.customer_limit_per_staff)
        `);
        console.log(`✅ ${updateNormalResult.rowCount}件の通常プラン代理店を更新しました`);

        console.log('\n修正後の状態:');
        const afterResult = await client.query(`
            SELECT u.id, u.user_id, u.plan_type, u.staff_limit, u.customer_limit_per_staff,
                   pd.staff_limit as plan_staff_limit, pd.customer_limit_per_staff as plan_customer_limit_per_staff
            FROM users u
            LEFT JOIN plan_definitions pd ON u.plan_type::text = pd.plan_type
            WHERE u.account_type = 'parent'
            ORDER BY u.id
        `);
        console.table(afterResult.rows);

        client.release();
        await pool.end();
        console.log('\n✅ 修正完了！');

    } catch (error) {
        console.error('❌ 修正失敗:', error);
        await pool.end();
        process.exit(1);
    }
}

fixAgencyLimits();
