// Stripe service for subscription management
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../utils/database-factory');
const logger = require('../utils/logger');

class StripeService {
    constructor() {
        if (!process.env.STRIPE_SECRET_KEY) {
            logger.warn('STRIPE_SECRET_KEY not configured - Stripe payments will not work');
        }
    }

    /**
     * Get monthly price for an agency
     * Returns custom_monthly_price if set, otherwise returns plan default
     */
    async getMonthlyPrice(userId) {
        const user = await db.query(
            'SELECT custom_monthly_price, plan_type FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        // If custom price is set, use it
        if (user[0].custom_monthly_price !== null && user[0].custom_monthly_price > 0) {
            return parseFloat(user[0].custom_monthly_price);
        }

        // Otherwise get default plan price
        const planDef = await db.query(
            'SELECT monthly_price FROM plan_definitions WHERE plan_type = $1',
            [user[0].plan_type]
        );

        if (!planDef || planDef.length === 0) {
            throw new Error('Plan not found');
        }

        return parseFloat(planDef[0].monthly_price);
    }

    /**
     * Create or get Stripe customer for an agency
     */
    async getOrCreateCustomer(userId, userInfo) {
        // Check if customer already exists
        const user = await db.query(
            'SELECT stripe_customer_id, user_id FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        // Return existing customer if available
        if (user[0].stripe_customer_id) {
            return user[0].stripe_customer_id;
        }

        // Create new Stripe customer
        const customer = await stripe.customers.create({
            metadata: {
                user_id: userId,
                account_type: 'parent',
                login_id: user[0].user_id
            },
            description: `Insurance Advisor Agency: ${user[0].user_id}`
        });

        // Save customer ID to database
        await db.query(
            'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
            [customer.id, userId]
        );

        return customer.id;
    }

    /**
     * Create Stripe Checkout Session for subscription
     */
    async createCheckoutSession(userId, planType, successUrl, cancelUrl) {
        const customerId = await this.getOrCreateCustomer(userId);
        const monthlyPrice = await this.getMonthlyPrice(userId);

        // Create or get price object in Stripe
        const priceId = await this.getOrCreatePrice(planType, monthlyPrice);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                user_id: userId,
                plan_type: planType
            }
        });

        return session;
    }

    /**
     * Create or get Stripe Price for a plan
     */
    async getOrCreatePrice(planType, amount) {
        // Search for existing price
        const prices = await stripe.prices.list({
            product: process.env.STRIPE_PRODUCT_ID || 'insurance_advisor',
            active: true,
            limit: 100
        });

        const existingPrice = prices.data.find(price =>
            price.unit_amount === Math.round(amount * 100) &&
            price.recurring?.interval === 'month'
        );

        if (existingPrice) {
            return existingPrice.id;
        }

        // Create new price
        const price = await stripe.prices.create({
            unit_amount: Math.round(amount * 100), // Convert to cents
            currency: 'jpy',
            recurring: {
                interval: 'month'
            },
            product_data: {
                name: `Insurance Advisor - ${planType.toUpperCase()} Plan`,
                description: `Monthly subscription for ${planType} plan`
            },
            metadata: {
                plan_type: planType
            }
        });

        return price.id;
    }

    /**
     * Create or update subscription for an agency
     */
    async createOrUpdateSubscription(userId, planType) {
        const user = await db.query(
            'SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        const customerId = user[0].stripe_customer_id || await this.getOrCreateCustomer(userId);
        const monthlyPrice = await this.getMonthlyPrice(userId);
        const priceId = await this.getOrCreatePrice(planType, monthlyPrice);

        // If subscription exists, update it
        if (user[0].stripe_subscription_id) {
            const subscription = await stripe.subscriptions.retrieve(user[0].stripe_subscription_id);

            // Update subscription with new price
            const updated = await stripe.subscriptions.update(user[0].stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: priceId
                }],
                proration_behavior: 'always_invoice', // Immediate proration
                metadata: {
                    plan_type: planType
                }
            });

            return updated;
        }

        // Create new subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{
                price: priceId
            }],
            metadata: {
                user_id: userId,
                plan_type: planType
            }
        });

        // Save subscription ID
        await db.query(
            'UPDATE users SET stripe_subscription_id = $1 WHERE id = $2',
            [subscription.id, userId]
        );

        return subscription;
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(userId) {
        const user = await db.query(
            'SELECT stripe_subscription_id FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        if (!user[0].stripe_subscription_id) {
            throw new Error('No active subscription');
        }

        const subscription = await stripe.subscriptions.del(user[0].stripe_subscription_id);

        // Clear subscription ID
        await db.query(
            'UPDATE users SET stripe_subscription_id = NULL WHERE id = $1',
            [userId]
        );

        return subscription;
    }

    /**
     * Create Customer Portal session for self-service
     */
    async createPortalSession(userId, returnUrl) {
        const user = await db.query(
            'SELECT stripe_customer_id FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        if (!user[0].stripe_customer_id) {
            throw new Error('No Stripe customer found');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user[0].stripe_customer_id,
            return_url: returnUrl
        });

        return session;
    }

    /**
     * Handle webhook events from Stripe
     */
    async handleWebhook(event) {
        logger.info('Stripe webhook event', { type: event.type });

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdate(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await this.handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object);
                break;

            default:
                logger.info('Unhandled Stripe event type', { type: event.type });
        }
    }

    async handleSubscriptionUpdate(subscription) {
        const userId = subscription.metadata.user_id;

        if (!userId) {
            logger.error('No user_id in subscription metadata');
            return;
        }

        // Update subscription ID and status
        await db.query(
            'UPDATE users SET stripe_subscription_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [subscription.id, userId]
        );

        logger.info('Subscription updated', { userId, status: subscription.status });
    }

    async handleSubscriptionDeleted(subscription) {
        const userId = subscription.metadata.user_id;

        if (!userId) {
            logger.error('No user_id in subscription metadata');
            return;
        }

        // Clear subscription ID and potentially deactivate account
        await db.query(
            'UPDATE users SET stripe_subscription_id = NULL, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );

        logger.info('Subscription deleted', { userId });
    }

    async handlePaymentSucceeded(invoice) {
        const customerId = invoice.customer;

        // Find user by customer ID
        const user = await db.query(
            'SELECT id FROM users WHERE stripe_customer_id = $1',
            [customerId]
        );

        if (!user || user.length === 0) {
            logger.error('User not found for customer', { customerId });
            return;
        }

        // Ensure account is active
        await db.query(
            'UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user[0].id]
        );

        logger.info('Payment succeeded', { userId: user[0].id, amount: invoice.amount_paid / 100 });
    }

    async handlePaymentFailed(invoice) {
        const customerId = invoice.customer;

        // Find user by customer ID
        const user = await db.query(
            'SELECT id FROM users WHERE stripe_customer_id = $1',
            [customerId]
        );

        if (!user || user.length === 0) {
            logger.error('User not found for customer', { customerId });
            return;
        }

        logger.error('Payment failed', { userId: user[0].id, invoiceId: invoice.id });
        // Optionally notify user or take other actions
    }
}

module.exports = new StripeService();
