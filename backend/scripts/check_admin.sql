-- 管理者アカウントを確認
SELECT id, user_id, account_type, plan_type, is_active, created_at, last_login
FROM users
WHERE account_type = 'admin';

-- 全ユーザーのアカウントタイプ別集計
SELECT account_type, COUNT(*) as count,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM users
GROUP BY account_type
ORDER BY account_type;

-- 最近作成されたユーザー上位10件
SELECT id, user_id, account_type, is_active, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
