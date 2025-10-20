-- 管理者アカウントを作成
-- ユーザーID: admin
-- パスワード: admin123

INSERT INTO users (
    user_id,
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
    'admin',
    '$2a$10$DF13g2TiiC5NogmTDaq96eq2rP6oOFWTl3pLI9jJljj5JRZR4juSy',
    'admin',
    'exceed',
    999,
    999,
    999,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 作成された管理者アカウントを確認
SELECT id, user_id, account_type, plan_type, is_active, created_at
FROM users
WHERE account_type = 'admin';
