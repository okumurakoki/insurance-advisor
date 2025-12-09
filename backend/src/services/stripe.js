// Stripe service for subscription management
const db = require('../utils/database-factory');
const logger = require('../utils/logger');

// Lazy initialization - Stripe client created on first use
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        _stripe = require('stripe')(key, {
            apiVersion: '2024-11-20.acacia',
            maxNetworkRetries: 3,
            timeout: 30000, // 30 seconds
            httpAgent: null, // Use default agent
            telemetry: false
        });
        logger.info('Stripe client initialized', {
            keyPrefix: key.substring(0, 7),
            keyLength: key.length
        });
    }
    return _stripe;
}

class StripeService {
    constructor() {
        // Stripe will be initialized lazily on first API call
    }

    get stripe() {
        return getStripe();
    }

    /**
     * Get monthly price for an agency
     * Returns: 基本料金 × 契約保険会社数
     */
    async getMonthlyPrice(userId) {
        const user = await db.query(
            'SELECT custom_monthly_price, plan_type FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        // 基本料金を決定（カスタム価格 or プラン定義）
        let basePlanPrice;
        if (user[0].custom_monthly_price !== null && user[0].custom_monthly_price > 0) {
            basePlanPrice = parseFloat(user[0].custom_monthly_price);
        } else {
            const planDef = await db.query(
                'SELECT monthly_price FROM plan_definitions WHERE plan_type = $1',
                [user[0].plan_type]
            );

            if (!planDef || planDef.length === 0) {
                throw new Error('Plan not found');
            }
            basePlanPrice = parseFloat(planDef[0].monthly_price);
        }

        // 契約保険会社数を取得
        const contractCountResult = await db.query(
            'SELECT COUNT(*) as count FROM agency_insurance_companies WHERE user_id = $1 AND is_active = true',
            [userId]
        );
        const contractCount = parseInt(contractCountResult[0].count) || 0;
        const effectiveContractCount = Math.max(contractCount, 1); // 最低1社

        // 月額料金 = 基本料金 × 契約保険会社数
        const totalMonthlyPrice = basePlanPrice * effectiveContractCount;

        logger.info('Monthly price calculated', {
            userId,
            basePlanPrice,
            contractCount,
            effectiveContractCount,
            totalMonthlyPrice
        });

        return totalMonthlyPrice;
    }

    /**
     * Get base plan price (without multiplying by contract count)
     */
    async getBasePlanPrice(userId) {
        const user = await db.query(
            'SELECT custom_monthly_price, plan_type FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        if (user[0].custom_monthly_price !== null && user[0].custom_monthly_price > 0) {
            return parseFloat(user[0].custom_monthly_price);
        }

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
     * Get contract count for an agency
     */
    async getContractCount(userId) {
        const result = await db.query(
            'SELECT COUNT(*) as count FROM agency_insurance_companies WHERE user_id = $1 AND is_active = true',
            [userId]
        );
        return parseInt(result[0].count) || 0;
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
        const customer = await this.stripe.customers.create({
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

        const session = await this.stripe.checkout.sessions.create({
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
        const unitAmount = Math.round(amount);

        // If STRIPE_PRODUCT_ID is set, try to find existing price
        if (process.env.STRIPE_PRODUCT_ID) {
            try {
                const prices = await this.stripe.prices.list({
                    product: process.env.STRIPE_PRODUCT_ID,
                    active: true,
                    limit: 100
                });

                const existingPrice = prices.data.find(price =>
                    price.unit_amount === unitAmount &&
                    price.recurring?.interval === 'month'
                );

                if (existingPrice) {
                    return existingPrice.id;
                }
            } catch (err) {
                logger.warn('Failed to list existing prices, will create new one', { error: err.message });
            }
        }

        // Create new price with inline product
        const price = await this.stripe.prices.create({
            unit_amount: unitAmount,
            currency: 'jpy',
            recurring: {
                interval: 'month'
            },
            product_data: {
                name: `変額保険アドバイザー - ${planType.toUpperCase()}プラン`
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
            const subscription = await this.stripe.subscriptions.retrieve(user[0].stripe_subscription_id);

            // Update subscription with new price
            const updated = await this.stripe.subscriptions.update(user[0].stripe_subscription_id, {
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
        const subscription = await this.stripe.subscriptions.create({
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
     * Update subscription amount when contract count changes
     * Called when insurance company is added/removed
     */
    async updateSubscriptionAmount(userId) {
        const user = await db.query(
            'SELECT stripe_subscription_id, plan_type, payment_method FROM users WHERE id = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        // 銀行振込の場合はStripe更新不要
        if (user[0].payment_method === 'bank_transfer') {
            logger.info('Skipping Stripe update for bank_transfer payment method', { userId });
            return null;
        }

        // サブスクリプションがない場合は何もしない
        if (!user[0].stripe_subscription_id) {
            logger.info('No subscription to update', { userId });
            return null;
        }

        try {
            // 新しい月額料金を計算
            const newMonthlyPrice = await this.getMonthlyPrice(userId);
            const planType = user[0].plan_type;

            // 新しい価格オブジェクトを作成/取得
            const priceId = await this.getOrCreatePrice(planType, newMonthlyPrice);

            // 現在のサブスクリプションを取得
            const subscription = await this.stripe.subscriptions.retrieve(user[0].stripe_subscription_id);

            // サブスクリプションを更新
            const updated = await this.stripe.subscriptions.update(user[0].stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: priceId
                }],
                proration_behavior: 'create_prorations', // 日割り計算
                metadata: {
                    user_id: userId.toString(),
                    plan_type: planType,
                    updated_at: new Date().toISOString()
                }
            });

            logger.info('Subscription amount updated', {
                userId,
                subscriptionId: updated.id,
                newMonthlyPrice,
                status: updated.status
            });

            return updated;
        } catch (error) {
            logger.error('Failed to update subscription amount', {
                userId,
                error: error.message
            });
            throw error;
        }
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

        const subscription = await this.stripe.subscriptions.del(user[0].stripe_subscription_id);

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

        const session = await this.stripe.billingPortal.sessions.create({
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
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;

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

    /**
     * Handle checkout session completed - activate account
     */
    async handleCheckoutCompleted(session) {
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (!userId) {
            logger.error('No user_id in checkout session metadata');
            return;
        }

        logger.info('Checkout completed', { userId, planType, customerId: session.customer });

        // プラン定義を取得
        const planDef = await db.query(
            'SELECT * FROM plan_definitions WHERE plan_type = $1',
            [planType]
        );

        // アカウントを有効化し、Stripe Customer IDを保存
        await db.query(
            `UPDATE users SET
                is_active = TRUE,
                stripe_customer_id = $1,
                stripe_subscription_id = $2,
                staff_limit = $3,
                customer_limit = $4,
                customer_limit_per_staff = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6`,
            [
                session.customer,
                session.subscription,
                planDef[0]?.staff_limit || 5,
                planDef[0]?.customer_limit || 100,
                planDef[0]?.customer_limit_per_staff || 20,
                userId
            ]
        );

        logger.info('Account activated after payment', { userId, planType });
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
