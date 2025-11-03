-- 顧客と担当者の紐付けを確認
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.user_id,
    u.user_id as staff_user_id,
    u.account_type,
    u.parent_id
FROM customers c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 10;
