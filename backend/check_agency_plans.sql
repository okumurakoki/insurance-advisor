-- 代理店のプラン情報を確認
SELECT 
    u.id,
    u.user_id,
    u.plan_type,
    u.staff_limit,
    pd.plan_name,
    pd.staff_limit as plan_staff_limit
FROM users u
LEFT JOIN plan_definitions pd ON u.plan_type::text = pd.plan_type
WHERE u.account_type = 'parent'
ORDER BY u.id;
