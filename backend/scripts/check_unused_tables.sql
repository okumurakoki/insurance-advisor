-- 使用していない可能性のあるテーブルのデータを確認

-- audit_logs の状況
SELECT 'audit_logs' AS table_name, COUNT(*) AS row_count,
       MAX(created_at) AS last_entry
FROM audit_logs;

-- line_webhook_logs の状況
SELECT 'line_webhook_logs' AS table_name, COUNT(*) AS row_count,
       MAX(created_at) AS last_entry
FROM line_webhook_logs;

-- plan_features の状況
SELECT 'plan_features' AS table_name, COUNT(*) AS row_count,
       NULL AS last_entry
FROM plan_features;

-- user_sessions の状況
SELECT 'user_sessions' AS table_name, COUNT(*) AS row_count,
       MAX(expires_at) AS last_entry
FROM user_sessions;

-- plan_features の内容確認
SELECT * FROM plan_features LIMIT 10;
