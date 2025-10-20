-- 管理者アカウントを作成
-- パスワード: admin123 (bcryptハッシュ化済み)

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
    '$2a$10$rZ5Qh3vXGXGXqXqXqXqXqO9Z5Qh3vXGXGXqXqXqXqXqO9Z5Qh3vXG', -- admin123 のハッシュ（後で実際のハッシュに置き換える）
    'admin',
    'exceed',
    999,
    999,
    999,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id, account_type) DO NOTHING;

-- 作成された管理者アカウントを確認
SELECT id, user_id, account_type, plan_type, is_active, created_at
FROM users
WHERE account_type = 'admin';
