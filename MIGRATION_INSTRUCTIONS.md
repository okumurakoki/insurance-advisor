# データベースマイグレーション手順

## 概要
新しい代理店管理機能を有効にするために、本番データベースに以下の変更を適用する必要があります。

## 実行タイミング
**今すぐ実行してください**。このマイグレーションを実行しないと、新しい認証・登録機能が正しく動作しません。

---

## 方法1: Supabaseダッシュボードから実行（推奨）

### ステップ1: Supabaseダッシュボードにログイン
1. https://supabase.com/ にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択

### ステップ2: SQLを実行
1. 「New query」をクリック
2. 以下のSQLを貼り付けて実行してください：

```sql
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
```

### ステップ3: 実行結果を確認
- エラーが表示されないことを確認
- 「Success. No rows returned」のようなメッセージが表示されればOK

---

## 方法2: psqlコマンドラインから実行

```bash
# Supabaseの接続文字列を使用
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -f backend/migrations/add_agency_plans.sql
```

---

## マイグレーション後の確認

以下のSQLで正しく適用されたか確認してください：

```sql
-- plan_definitionsテーブルが作成されているか確認
SELECT * FROM plan_definitions;

-- usersテーブルに新しいカラムが追加されているか確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('staff_limit', 'customer_limit_per_staff');

-- 管理者アカウントがexceedプランになっているか確認
SELECT user_id, account_type, plan_type, staff_limit, customer_limit
FROM users
WHERE account_type = 'admin';
```

期待される結果：
- plan_definitionsテーブルに5つのプラン（bronze, silver, gold, platinum, exceed）が存在
- usersテーブルにstaff_limit、customer_limit_per_staffカラムが存在
- adminアカウントのplan_typeが'exceed'、staff_limitが999

---

## トラブルシューティング

### エラー: "relation already exists"
→ すでにマイグレーションが実行済みです。問題ありません。

### エラー: "permission denied"
→ データベース接続ユーザーに十分な権限がありません。Supabaseの管理者権限で実行してください。

### エラー: "constraint does not exist"
→ 制約が存在しない場合は無視されます。問題ありません。

---

## 次のステップ

マイグレーション完了後、以下を確認してください：

1. ✅ バックエンドAPIが正常に動作するか
2. ✅ 管理者アカウントでログインできるか
3. ✅ 代理店作成APIが動作するか（`POST /api/admin/agencies`）

確認用コマンド：
```bash
# 管理者としてログイン
curl -X POST https://api.insurance-optimizer.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin","password":"your_password","accountType":"admin"}'

# プラン一覧を取得
curl -X GET https://api.insurance-optimizer.com/api/admin/plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ロールバック手順（問題が発生した場合）

```sql
-- 追加したカラムを削除
ALTER TABLE users DROP COLUMN IF EXISTS staff_limit;
ALTER TABLE users DROP COLUMN IF EXISTS customer_limit_per_staff;

-- テーブルを削除
DROP TABLE IF EXISTS plan_definitions;

-- 制約を元に戻す
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;
ALTER TABLE users ADD CONSTRAINT users_plan_type_check
    CHECK (plan_type IN ('standard', 'master', 'exceed'));
```

**注意**: ロールバックすると、新しい代理店管理機能が使用できなくなります。
