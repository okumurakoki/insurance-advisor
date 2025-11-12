-- Add Stripe payment fields to users table
-- This migration adds support for Stripe subscription management

-- Add payment_method column (card or bank_transfer)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) CHECK(payment_method IN ('card', 'bank_transfer'));

-- Add Stripe customer ID
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Add Stripe subscription ID
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE;

-- Add index for faster Stripe ID lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);

-- Add comment for documentation
COMMENT ON COLUMN users.payment_method IS 'Payment method: card (credit card via Stripe) or bank_transfer (manual bank transfer)';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for billing';
