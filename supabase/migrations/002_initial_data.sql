-- 初期データ投入スクリプト

-- 1. 初期管理者アカウント作成
-- パスワード: Admin@Insurance2025! (本番環境では必ず変更してください)
INSERT INTO prudential_users (username, email, name, user_type, password_hash) VALUES
('admin', 'admin@insurance-optimizer.com', 'システム管理者', 'admin', '$2a$12$xH8zN5qKPVH3Y9xC7T6Oq.QGvx8yK3C.gNHKc4bXVHKBqWYxN.YYq'),
('demo_agency', 'agency@insurance-optimizer.com', 'デモ代理店', 'agency', '$2a$12$xH8zN5qKPVH3Y9xC7T6Oq.QGvx8yK3C.gNHKc4bXVHKBqWYxN.YYq'),
('demo_staff', 'staff@insurance-optimizer.com', 'デモスタッフ', 'staff', '$2a$12$xH8zN5qKPVH3Y9xC7T6Oq.QGvx8yK3C.gNHKc4bXVHKBqWYxN.YYq')
ON CONFLICT (username) DO NOTHING;

-- 2. システム設定の初期値
INSERT INTO kv_store_e075ba47 (key, value) VALUES 
('system_config', '{
  "version": "1.0.0",
  "company_name": "変額保険アドバイザリーシステム",
  "features": {
    "ai_analysis": true,
    "market_data": true,
    "export_pdf": true,
    "export_excel": true
  },
  "analysis_settings": {
    "default_simulation_years": 30,
    "default_return_rate": 3.5,
    "default_inflation_rate": 2.0
  }
}'::jsonb),
('maintenance_mode', '{"enabled": false, "message": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. デモ顧客データ
INSERT INTO prudential_customers (
  surname, 
  given_name, 
  age_range, 
  gender, 
  occupation, 
  annual_income, 
  assigned_staff_id,
  agency_id,
  management_info
) 
SELECT 
  '山田', 
  '太郎', 
  '30-39', 
  'male', 
  '会社員', 
  6000000,
  (SELECT id FROM prudential_users WHERE username = 'demo_staff' LIMIT 1),
  (SELECT id FROM prudential_users WHERE username = 'demo_agency' LIMIT 1),
  '{
    "risk_tolerance": "moderate",
    "investment_experience": "beginner",
    "goals": ["retirement", "education"],
    "preferred_contact": "email"
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM prudential_customers WHERE surname = '山田' AND given_name = '太郎'
);

-- 4. マーケットデータのサンプル
INSERT INTO market_data (symbol, data_type, data, expires_at) VALUES 
('NIKKEI225', 'daily', '{
  "latest": {
    "open": 38500.00,
    "high": 38750.00,
    "low": 38400.00,
    "close": 38650.00,
    "volume": 1250000000,
    "date": "2024-01-15"
  },
  "history": []
}'::jsonb, NOW() + INTERVAL '1 day'),
('TOPIX', 'daily', '{
  "latest": {
    "open": 2650.00,
    "high": 2675.00,
    "low": 2645.00,
    "close": 2670.00,
    "volume": 980000000,
    "date": "2024-01-15"
  },
  "history": []
}'::jsonb, NOW() + INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 5. 初期監査ログ
INSERT INTO audit_logs (
  user_id,
  action,
  resource_type,
  details
) VALUES (
  (SELECT id FROM prudential_users WHERE username = 'admin' LIMIT 1),
  'system_initialized',
  'system',
  '{
    "message": "システムが初期化されました",
    "version": "1.0.0",
    "timestamp": "2024-01-15T00:00:00Z"
  }'::jsonb
);