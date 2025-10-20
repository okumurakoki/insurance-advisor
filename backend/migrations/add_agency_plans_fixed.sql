-- 代理店プラン管理のためのスキーマ更新（ENUM対応版）

-- Step 1: usersテーブルに新しいカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_limit INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_limit_per_staff INTEGER DEFAULT NULL;

-- Step 2: plan_typeがENUM型かどうか確認して、新しい値を追加
DO $$
BEGIN
    -- ENUMに新しい値を追加（存在しない場合のみ）
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'plan_type' AND e.enumlabel = 'bronze') THEN
        ALTER TYPE plan_type ADD VALUE 'bronze';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'plan_type' AND e.enumlabel = 'silver') THEN
        ALTER TYPE plan_type ADD VALUE 'silver';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'plan_type' AND e.enumlabel = 'gold') THEN
        ALTER TYPE plan_type ADD VALUE 'gold';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'plan_type' AND e.enumlabel = 'platinum') THEN
        ALTER TYPE plan_type ADD VALUE 'platinum';
    END IF;

    -- 'exceed'は既に存在する可能性が高いので、存在チェック
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'plan_type' AND e.enumlabel = 'exceed') THEN
        ALTER TYPE plan_type ADD VALUE 'exceed';
    END IF;
END $$;

-- Step 3: プラン定義テーブルを作成
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

-- Step 4: プランデータを挿入
INSERT INTO plan_definitions (plan_type, plan_name, monthly_price, staff_limit, customer_limit, customer_limit_per_staff, description) VALUES
('bronze', 'ブロンズ', 980, 1, 5, NULL, '担当者設定1人まで、顧客5人まで'),
('silver', 'シルバー', 1980, 3, 30, NULL, '担当者設定3人まで、顧客30人まで'),
('gold', 'ゴールド', 3980, 10, NULL, 15, '担当者設定10人まで、顧客15人/担当者まで'),
('platinum', 'プラチナ', 8980, 30, NULL, 30, '担当者設定30人まで、顧客30人/担当者まで'),
('exceed', 'エクシード', 0, 999, NULL, 999, 'カスタムプラン（管理者が設定）')
ON CONFLICT (plan_type) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    monthly_price = EXCLUDED.monthly_price,
    staff_limit = EXCLUDED.staff_limit,
    customer_limit = EXCLUDED.customer_limit,
    customer_limit_per_staff = EXCLUDED.customer_limit_per_staff,
    description = EXCLUDED.description;

-- Step 5: 既存のparentアカウントにデフォルト値を設定
UPDATE users
SET
    staff_limit = 1,
    customer_limit_per_staff = NULL,
    plan_type = 'bronze'
WHERE account_type = 'parent' AND plan_type IN ('standard', 'master');

-- Step 6: 管理者アカウントをexceedプランに設定
UPDATE users
SET
    staff_limit = 999,
    customer_limit = 999,
    plan_type = 'exceed'
WHERE account_type = 'admin';

-- Step 7: インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
