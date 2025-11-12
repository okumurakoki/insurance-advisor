-- LINE通知機能テスト用アカウント作成
--
-- 作成するアカウント:
-- 1. 代理店（parent）: test-agency / password: TestAgency123!
-- 2. スタッフ（child）: test-staff / password: TestStaff123!
-- 3. 顧客（customer）: テスト太郎

-- パスワードハッシュ（bcrypt生成済み）:
-- TestAgency123!: $2a$10$1O3phtyP/2nNjI1o7l8gtOvEnhH3oWidQwuer6mxvd3bW.lBwKUVa
-- TestStaff123!: $2a$10$m4MQLtLPdGyiHiCuuWPEu.TmfzYUzQDrRBiHqAFPBf8qbJ7auTVe.

BEGIN;

-- 1. 代理店アカウント作成
INSERT INTO users (
    user_id,
    name,
    email,
    password_hash,
    account_type,
    plan_type,
    staff_limit,
    customer_limit,
    customer_limit_per_staff,
    parent_id,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'test-agency',
    'テスト代理店',
    'test-agency@example.com',
    '$2a$10$1O3phtyP/2nNjI1o7l8gtOvEnhH3oWidQwuer6mxvd3bW.lBwKUVa', -- TestAgency123!
    'parent',
    'standard',
    50,
    500,
    10,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id, account_type) DO NOTHING;

-- 代理店IDを取得
DO $$
DECLARE
    agency_id UUID;
    staff_id UUID;
BEGIN
    -- 代理店IDを取得
    SELECT id INTO agency_id FROM users WHERE user_id = 'test-agency' AND account_type = 'parent';

    -- 2. スタッフアカウント作成
    INSERT INTO users (
        user_id,
        name,
        email,
        password_hash,
        account_type,
        plan_type,
        staff_limit,
        customer_limit,
        customer_limit_per_staff,
        parent_id,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        'test-staff',
        'テストスタッフ',
        'test-staff@example.com',
        '$2a$10$m4MQLtLPdGyiHiCuuWPEu.TmfzYUzQDrRBiHqAFPBf8qbJ7auTVe.', -- TestStaff123!
        'child',
        'standard',
        0,
        10,
        0,
        agency_id,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, account_type) DO NOTHING;

    -- スタッフIDを取得
    SELECT id INTO staff_id FROM users WHERE user_id = 'test-staff' AND account_type = 'child';

    -- 3. テスト顧客作成
    INSERT INTO customers (
        user_id,
        name,
        email,
        phone,
        birth_date,
        gender,
        risk_tolerance,
        investment_amount,
        insurance_company_id,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        staff_id,
        'テスト太郎',
        'test-customer@example.com',
        '090-1234-5678',
        '1980-01-01',
        'male',
        'balanced',
        10000000,
        (SELECT id FROM insurance_companies WHERE name LIKE 'プルデンシャル%' LIMIT 1),
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT DO NOTHING;

END $$;

COMMIT;

-- 作成されたアカウントを確認
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
ORDER BY u.account_type DESC;

-- 作成された顧客を確認
SELECT
    c.id,
    c.name,
    c.email,
    c.risk_tolerance,
    u.user_id as staff_user_id,
    u.name as staff_name
FROM customers c
JOIN users u ON c.user_id = u.id
WHERE c.name = 'テスト太郎';
