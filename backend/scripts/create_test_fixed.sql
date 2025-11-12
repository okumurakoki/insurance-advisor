-- テストアカウント作成（修正版）
-- ユーザーID: test-staff / パスワード: TestStaff123!

-- 既存のテストアカウントがあれば削除
DELETE FROM customers WHERE name = 'テスト太郎';
DELETE FROM users WHERE user_id IN ('test-staff', 'test-agency');

-- 1. 代理店作成
INSERT INTO users (user_id, name, email, password_hash, account_type, plan_type, staff_limit, customer_limit, customer_limit_per_staff, is_active)
VALUES ('test-agency', 'テスト代理店', 'test-agency@example.com', '$2a$10$1O3phtyP/2nNjI1o7l8gtOvEnhH3oWidQwuer6mxvd3bW.lBwKUVa', 'parent', 'standard', 50, 500, 10, true);

-- 2. スタッフ作成
INSERT INTO users (user_id, name, email, password_hash, account_type, plan_type, customer_limit, parent_id, is_active)
SELECT 'test-staff', 'テストスタッフ', 'test-staff@example.com', '$2a$10$m4MQLtLPdGyiHiCuuWPEu.TmfzYUzQDrRBiHqAFPBf8qbJ7auTVe.', 'child', 'standard', 10, id, true
FROM users WHERE user_id = 'test-agency';

-- 3. テスト顧客作成
INSERT INTO customers (user_id, name, email, phone, birth_date, gender, risk_tolerance, investment_amount, insurance_company_id, is_active)
SELECT u.id, 'テスト太郎', 'test-customer@example.com', '090-1234-5678', '1980-01-01', 'male', 'balanced', 10000000, ic.id, true
FROM users u
CROSS JOIN (SELECT id FROM insurance_companies WHERE name LIKE 'プルデンシャル%' LIMIT 1) ic
WHERE u.user_id = 'test-staff';

-- 確認
SELECT user_id, name, account_type, is_active FROM users WHERE user_id IN ('test-agency', 'test-staff');
SELECT c.name, c.email, u.user_id as staff FROM customers c JOIN users u ON c.user_id = u.id WHERE c.name = 'テスト太郎';
