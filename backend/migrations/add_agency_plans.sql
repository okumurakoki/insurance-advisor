-- 代理店プラン管理のためのスキーマ更新

-- usersテーブルにstaff_limitとcustomer_limit_per_staffを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_limit INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_limit_per_staff INTEGER DEFAULT NULL;

-- plan_typeの制約を更新（新しいプランを追加）
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;
ALTER TABLE users ADD CONSTRAINT users_plan_type_check
    CHECK (plan_type IN ('bronze', 'silver', 'gold', 'platinum', 'exceed', 'standard', 'master'));

-- プラン機能定義テーブル（新規作成）
CREATE TABLE IF NOT EXISTS plan_definitions (
    plan_type VARCHAR(20) PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    monthly_price INTEGER NOT NULL,
    staff_limit INTEGER NOT NULL,
    customer_limit INTEGER,
    customer_limit_per_staff INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- プラン定義データを挿入
INSERT INTO plan_definitions (plan_type, plan_name, monthly_price, staff_limit, customer_limit, customer_limit_per_staff, description) VALUES
('bronze', 'ブロンズプラン', 980, 1, 5, NULL, '担当者1人まで、顧客5人まで'),
('silver', 'シルバープラン', 1980, 3, 30, NULL, '担当者3人まで、顧客30人まで'),
('gold', 'ゴールドプラン', 3980, 10, NULL, 15, '担当者10人まで、顧客15人/担当者まで'),
('platinum', 'プラチナプラン', 8980, 30, NULL, 30, '担当者30人まで、顧客30人/担当者まで'),
('exceed', 'エクシードプラン', 0, 999, NULL, 999, '管理者LINEに相談')
ON CONFLICT (plan_type) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    monthly_price = EXCLUDED.monthly_price,
    staff_limit = EXCLUDED.staff_limit,
    customer_limit = EXCLUDED.customer_limit,
    customer_limit_per_staff = EXCLUDED.customer_limit_per_staff,
    description = EXCLUDED.description;

-- 既存のparentアカウントにデフォルト値を設定
UPDATE users
SET
    staff_limit = 1,
    customer_limit_per_staff = NULL,
    plan_type = 'bronze'
WHERE account_type = 'parent' AND plan_type IN ('standard', 'master');

-- 管理者アカウントをexceedプランに設定
UPDATE users
SET
    staff_limit = 999,
    customer_limit = 999,
    plan_type = 'exceed'
WHERE account_type = 'admin';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
