// Stripe payment routes
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripe');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../utils/database-factory');

/**
 * POST /api/stripe/create-checkout-session
 * Create Stripe Checkout session for subscription
 * Available to agencies (parent accounts)
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { planType } = req.body;

        // Only parent accounts can create subscriptions
        if (req.user.accountType !== 'parent') {
            return res.status(403).json({
                success: false,
                message: 'Only agencies can subscribe to plans'
            });
        }

        // Validate plan type - agencies cannot select exceed
        const allowedPlans = ['bronze', 'silver', 'gold', 'platinum'];
        if (!allowedPlans.includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type. Agencies can only select bronze, silver, gold, or platinum plans.'
            });
        }

        // Create checkout session
        const session = await stripeService.createCheckoutSession(
            req.user.id,
            planType,
            `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            `${process.env.FRONTEND_URL}/my-agency`
        );

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create checkout session',
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/create-portal-session
 * Create Stripe Customer Portal session for self-service management
 * Available to agencies (parent accounts)
 */
router.post('/create-portal-session', authenticateToken, async (req, res) => {
    try {
        // Only parent accounts can access portal
        if (req.user.accountType !== 'parent') {
            return res.status(403).json({
                success: false,
                message: 'Only agencies can access the billing portal'
            });
        }

        const session = await stripeService.createPortalSession(
            req.user.id,
            `${process.env.FRONTEND_URL}/my-agency`
        );

        res.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create portal session',
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * Public endpoint (authenticated via Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).send('Webhook secret not configured');
    }

    let event;

    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        await stripeService.handleWebhook(event);
        res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook handling failed',
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/change-plan
 * Change subscription plan for agency
 * Available to agencies (parent accounts)
 */
router.post('/change-plan', authenticateToken, async (req, res) => {
    try {
        const { planType } = req.body;

        // Only parent accounts can change plans
        if (req.user.accountType !== 'parent') {
            return res.status(403).json({
                success: false,
                message: 'Only agencies can change subscription plans'
            });
        }

        // Validate plan type - agencies cannot select exceed
        const allowedPlans = ['bronze', 'silver', 'gold', 'platinum'];
        if (!allowedPlans.includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type. Agencies can only select bronze, silver, gold, or platinum plans.'
            });
        }

        // Get current plan limits
        const planDef = await db.query(
            'SELECT * FROM plan_definitions WHERE plan_type = $1',
            [planType]
        );

        if (!planDef || planDef.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Update subscription in Stripe
        const subscription = await stripeService.createOrUpdateSubscription(req.user.id, planType);

        // Update user's plan in database
        await db.query(
            `UPDATE users SET
                plan_type = $1,
                staff_limit = $2,
                customer_limit = $3,
                customer_limit_per_staff = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5`,
            [
                planType,
                planDef[0].staff_limit,
                planDef[0].customer_limit,
                planDef[0].customer_limit_per_staff,
                req.user.id
            ]
        );

        res.json({
            success: true,
            message: 'Plan changed successfully',
            subscription: {
                id: subscription.id,
                status: subscription.status,
                current_period_end: subscription.current_period_end
            },
            plan: planDef[0]
        });

    } catch (error) {
        console.error('Error changing plan:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change plan',
            error: error.message
        });
    }
});

/**
 * GET /api/stripe/subscription-status
 * Get current subscription status for agency
 * Available to agencies (parent accounts)
 */
router.get('/subscription-status', authenticateToken, async (req, res) => {
    try {
        // Only parent accounts have subscriptions
        if (req.user.accountType !== 'parent') {
            return res.status(403).json({
                success: false,
                message: 'Only agencies have subscriptions'
            });
        }

        const user = await db.query(
            `SELECT
                stripe_subscription_id,
                stripe_customer_id,
                payment_method,
                plan_type,
                custom_monthly_price,
                is_active
            FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (!user || user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = user[0];
        let subscriptionData = null;

        // Get Stripe subscription details if exists
        if (userData.stripe_subscription_id) {
            try {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);

                subscriptionData = {
                    id: subscription.id,
                    status: subscription.status,
                    current_period_start: subscription.current_period_start,
                    current_period_end: subscription.current_period_end,
                    cancel_at_period_end: subscription.cancel_at_period_end
                };
            } catch (error) {
                console.error('Error fetching subscription from Stripe:', error);
            }
        }

        // Get monthly price
        const monthlyPrice = await stripeService.getMonthlyPrice(req.user.id);

        res.json({
            success: true,
            subscription: subscriptionData,
            payment_method: userData.payment_method,
            plan_type: userData.plan_type,
            monthly_price: monthlyPrice,
            is_active: userData.is_active,
            has_stripe_customer: !!userData.stripe_customer_id
        });

    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription status',
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/cancel-subscription
 * Cancel current subscription
 * Available to agencies (parent accounts)
 */
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
    try {
        // Only parent accounts can cancel subscriptions
        if (req.user.accountType !== 'parent') {
            return res.status(403).json({
                success: false,
                message: 'Only agencies can cancel subscriptions'
            });
        }

        const subscription = await stripeService.cancelSubscription(req.user.id);

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: {
                id: subscription.id,
                status: subscription.status
            }
        });

    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription',
            error: error.message
        });
    }
});

/**
 * GET /api/stripe/available-plans
 * Get list of plans available for agency subscription
 */
router.get('/available-plans', authenticateToken, async (req, res) => {
    try {
        // Only show plans that agencies can select
        const plans = await db.query(
            `SELECT
                plan_type,
                plan_name,
                monthly_price,
                staff_limit,
                customer_limit,
                customer_limit_per_staff,
                description
            FROM plan_definitions
            WHERE plan_type IN ('bronze', 'silver', 'gold', 'platinum')
            ORDER BY monthly_price ASC`
        );

        res.json({
            success: true,
            plans
        });

    } catch (error) {
        console.error('Error fetching available plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available plans',
            error: error.message
        });
    }
});

module.exports = router;
