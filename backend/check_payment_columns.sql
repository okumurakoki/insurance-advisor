SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('payment_method', 'stripe_customer_id', 'stripe_subscription_id');
