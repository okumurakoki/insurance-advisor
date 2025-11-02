-- Add custom_monthly_price column to users table for exceed plan
-- This allows exceed plan agencies to have custom pricing per company

ALTER TABLE users
ADD COLUMN IF NOT EXISTS custom_monthly_price INTEGER;

COMMENT ON COLUMN users.custom_monthly_price IS 'Custom monthly price per company for exceed plan agencies (in yen)';
