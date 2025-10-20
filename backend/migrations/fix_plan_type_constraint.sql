-- プランタイプのCHECK制約を修正
-- 既存の制約を削除して、新しいプランタイプに対応

-- Step 1: 既存のCHECK制約を削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;

-- Step 2: 新しいCHECK制約を追加（すべてのプランタイプを含む）
ALTER TABLE users ADD CONSTRAINT users_plan_type_check
    CHECK (plan_type IN ('bronze', 'silver', 'gold', 'platinum', 'exceed', 'standard', 'master'));

-- Step 3: 古いプランタイプを新しいものに移行（必要に応じて）
-- standardプランをbronzeに移行
UPDATE users
SET plan_type = 'bronze'
WHERE plan_type = 'standard' AND account_type = 'parent';

-- masterプランをplatinumに移行
UPDATE users
SET plan_type = 'platinum'
WHERE plan_type = 'master' AND account_type = 'parent';
