-- 既存の代理店アカウントのプラン情報を修正
-- plan_type が NULL または不正な値の場合、デフォルトでブロンズプランを設定

-- まず、すべての parent アカウントの現在の状態を確認
SELECT id, user_id, plan_type, staff_limit, customer_limit, customer_limit_per_staff
FROM users
WHERE account_type = 'parent';

-- plan_type が NULL の代理店にブロンズプランを設定
UPDATE users
SET
    plan_type = 'bronze',
    staff_limit = 1,
    customer_limit = 5,
    customer_limit_per_staff = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE account_type = 'parent'
  AND plan_type IS NULL;

-- 既存の代理店で staff_limit が NULL または 0 の場合、プラン定義から取得
UPDATE users u
SET
    staff_limit = pd.staff_limit,
    customer_limit = pd.customer_limit,
    customer_limit_per_staff = pd.customer_limit_per_staff,
    updated_at = CURRENT_TIMESTAMP
FROM plan_definitions pd
WHERE u.account_type = 'parent'
  AND u.plan_type::text = pd.plan_type
  AND (u.staff_limit IS NULL OR u.staff_limit = 0);

-- 更新後の状態を確認
SELECT id, user_id, plan_type, staff_limit, customer_limit, customer_limit_per_staff
FROM users
WHERE account_type = 'parent'
ORDER BY id;
