const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

// 管理者権限チェックミドルウェア
const requireAdmin = (req, res, next) => {
    if (req.user.accountType !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// 全プラン定義を取得
router.get('/plans', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const plans = await Plan.getAllDefinitions();
        res.json(plans);
    } catch (error) {
        logger.error('Failed to fetch plan definitions:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// 全代理店を取得
router.get('/agencies', authenticateToken, requireAdmin, async (req, res) => {
    try {
        logger.info('Fetching agencies...');
        const agencies = await User.getAll({ accountType: 'parent' });
        logger.info(`Found ${agencies.length} agencies`);

        // 各代理店の統計情報を取得
        const agenciesWithStats = await Promise.all(
            agencies.map(async (agency) => {
                try {
                    logger.info(`Fetching stats for agency ${agency.id}...`);
                    const stats = await Plan.getAgencyStats(agency.id);
                    return {
                        id: agency.id,
                        userId: agency.user_id,
                        planType: agency.plan_type,
                        isActive: agency.is_active,
                        createdAt: agency.created_at,
                        ...stats
                    };
                } catch (statsError) {
                    logger.error(`Failed to fetch stats for agency ${agency.id}:`, statsError);
                    // エラーでも基本情報は返す
                    return {
                        id: agency.id,
                        userId: agency.user_id,
                        planType: agency.plan_type,
                        isActive: agency.is_active,
                        createdAt: agency.created_at,
                        staffCount: 0,
                        staffLimit: 0,
                        customerCount: 0,
                        customerLimit: 0
                    };
                }
            })
        );

        res.json(agenciesWithStats);
    } catch (error) {
        logger.error('Failed to fetch agencies:', error);
        res.status(500).json({
            error: 'Failed to fetch agencies',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 代理店を作成（管理者が手動で作成）
router.post('/agencies', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, password, planType, customStaffLimit, customCustomerLimitPerStaff, customMonthlyPrice } = req.body;

        if (!userId || !password || !planType) {
            return res.status(400).json({ error: 'userId, password, planType are required' });
        }

        // プラン定義を取得
        const planDef = await Plan.getDefinition(planType);
        if (!planDef) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }

        // 既存のユーザーIDをチェック
        const existing = await User.findByUserId(userId, 'parent');
        if (existing) {
            return res.status(400).json({ error: 'User ID already exists' });
        }

        // エクシードプランの場合、カスタム制限を使用
        let staffLimit = planDef.staff_limit;
        let customerLimitPerStaff = planDef.customer_limit_per_staff;
        let monthlyPrice = null;

        if (planType === 'exceed') {
            if (customStaffLimit !== undefined && customStaffLimit > 0) {
                staffLimit = customStaffLimit;
            }
            if (customCustomerLimitPerStaff !== undefined && customCustomerLimitPerStaff > 0) {
                customerLimitPerStaff = customCustomerLimitPerStaff;
            }
            if (customMonthlyPrice !== undefined && customMonthlyPrice > 0) {
                monthlyPrice = customMonthlyPrice;
            }
        }

        // 代理店ユーザーを作成
        const newUserId = await User.create({
            userId,
            password,
            accountType: 'parent',
            planType,
            customerLimit: planDef.customer_limit,
            parentId: null
        });

        // プラン情報を更新（staff_limit, customer_limit_per_staff, custom_monthly_priceを設定）
        const db = require('../utils/database-factory');
        const sql = `
            UPDATE users
            SET staff_limit = $1,
                customer_limit = $2,
                customer_limit_per_staff = $3,
                custom_monthly_price = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `;
        await db.query(sql, [staffLimit, planDef.customer_limit, customerLimitPerStaff, monthlyPrice, newUserId]);

        logger.info(`Agency created by admin: ${userId}, plan: ${planType}, staffLimit: ${staffLimit}, customerLimitPerStaff: ${customerLimitPerStaff}, monthlyPrice: ${monthlyPrice}`);

        res.status(201).json({
            message: 'Agency created successfully',
            userId: newUserId,
            planType,
            planName: planDef.plan_name,
            staffLimit,
            customerLimitPerStaff
        });
    } catch (error) {
        logger.error('Failed to create agency:', error);
        res.status(500).json({ error: 'Failed to create agency' });
    }
});

// 代理店のプランを更新
router.put('/agencies/:id/plan', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { planType, customStaffLimit, customCustomerLimitPerStaff, customMonthlyPrice } = req.body;

        if (!planType) {
            return res.status(400).json({ error: 'planType is required' });
        }

        const planDef = await Plan.getDefinition(planType);
        if (!planDef) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }

        // エクシードプランの場合、カスタム制限を使用
        let staffLimit = planDef.staff_limit;
        let customerLimitPerStaff = planDef.customer_limit_per_staff;
        let monthlyPrice = null;

        if (planType === 'exceed') {
            if (customStaffLimit !== undefined && customStaffLimit > 0) {
                staffLimit = customStaffLimit;
            }
            if (customCustomerLimitPerStaff !== undefined && customCustomerLimitPerStaff > 0) {
                customerLimitPerStaff = customCustomerLimitPerStaff;
            }
            if (customMonthlyPrice !== undefined && customMonthlyPrice > 0) {
                monthlyPrice = customMonthlyPrice;
            }
        }

        // プラン情報を更新
        const db = require('../utils/database-factory');
        const sql = `
            UPDATE users
            SET plan_type = $1,
                staff_limit = $2,
                customer_limit = $3,
                customer_limit_per_staff = $4,
                custom_monthly_price = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND account_type = 'parent'
        `;

        await db.query(sql, [
            planType,
            staffLimit,
            planDef.customer_limit,
            customerLimitPerStaff,
            monthlyPrice,
            parseInt(id)
        ]);

        logger.info(`Agency plan updated by admin: ID ${id}, new plan: ${planType}, staffLimit: ${staffLimit}, customerLimitPerStaff: ${customerLimitPerStaff}, monthlyPrice: ${monthlyPrice}`);

        res.json({
            message: 'Agency plan updated successfully',
            planType,
            planName: planDef.plan_name,
            staffLimit,
            customerLimitPerStaff
        });
    } catch (error) {
        logger.error('Failed to update agency plan:', error);
        res.status(500).json({ error: 'Failed to update agency plan' });
    }
});

// 代理店を有効/無効化
router.put('/agencies/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({ error: 'isActive is required' });
        }

        await User.update(parseInt(id), { isActive });

        logger.info(`Agency status updated by admin: ID ${id}, isActive: ${isActive}`);

        res.json({
            message: `Agency ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        logger.error('Failed to update agency status:', error);
        res.status(500).json({ error: 'Failed to update agency status' });
    }
});

// 代理店の統計情報のみを取得
router.get('/agencies/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const agency = await User.findById(parseInt(id));

        if (!agency || agency.account_type !== 'parent') {
            return res.status(404).json({ error: 'Agency not found' });
        }

        const stats = await Plan.getAgencyStats(parseInt(id));
        res.json(stats);
    } catch (error) {
        logger.error('Failed to fetch agency stats:', error);
        res.status(500).json({ error: 'Failed to fetch agency stats' });
    }
});

// 代理店の詳細情報を取得
router.get('/agencies/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const agency = await User.findById(parseInt(id));

        if (!agency || agency.account_type !== 'parent') {
            return res.status(404).json({ error: 'Agency not found' });
        }

        const stats = await Plan.getAgencyStats(parseInt(id));
        const staff = await User.getChildren(parseInt(id));

        res.json({
            id: agency.id,
            userId: agency.user_id,
            planType: agency.plan_type,
            isActive: agency.is_active,
            createdAt: agency.created_at,
            stats,
            staff
        });
    } catch (error) {
        logger.error('Failed to fetch agency details:', error);
        res.status(500).json({ error: 'Failed to fetch agency details' });
    }
});

// 代理店を削除（論理削除）
router.delete('/agencies/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await User.deactivate(parseInt(id));

        logger.info(`Agency deactivated by admin: ID ${id}`);

        res.json({ message: 'Agency deactivated successfully' });
    } catch (error) {
        logger.error('Failed to deactivate agency:', error);
        res.status(500).json({ error: 'Failed to deactivate agency' });
    }
});

// システム統計情報を取得
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const agencies = await User.getAll({ accountType: 'parent', isActive: true });
        const allStaff = await User.getAll({ accountType: 'child', isActive: true });

        // 顧客数を取得
        const customerCountSql = `
            SELECT COUNT(*) as count
            FROM customers
            WHERE is_active = true
        `;
        const db = require('../utils/database-factory');
        const customerCountResults = await db.query(customerCountSql);
        const customerCount = parseInt(customerCountResults[0].count);

        // プランごとの代理店数
        const planDistribution = {};
        agencies.forEach(agency => {
            planDistribution[agency.plan_type] = (planDistribution[agency.plan_type] || 0) + 1;
        });

        res.json({
            totalAgencies: agencies.length,
            totalStaff: allStaff.length,
            totalCustomers: customerCount,
            planDistribution
        });
    } catch (error) {
        logger.error('Failed to fetch system stats:', error);
        res.status(500).json({ error: 'Failed to fetch system stats' });
    }
});

// 既存の代理店のプラン情報を一括修正
router.post('/agencies/fix-plans', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = require('../utils/database-factory');

        // すべての parent アカウントのプラン情報を修正
        const updateSql = `
            UPDATE users u
            SET
                staff_limit = CASE
                    WHEN u.plan_type = 'exceed' AND u.staff_limit IS NOT NULL THEN u.staff_limit
                    ELSE COALESCE(pd.staff_limit, 1)
                END,
                customer_limit = CASE
                    WHEN u.plan_type = 'exceed' AND u.customer_limit IS NOT NULL THEN u.customer_limit
                    ELSE pd.customer_limit
                END,
                customer_limit_per_staff = CASE
                    WHEN u.plan_type = 'exceed' AND u.customer_limit_per_staff IS NOT NULL THEN u.customer_limit_per_staff
                    ELSE pd.customer_limit_per_staff
                END,
                updated_at = CURRENT_TIMESTAMP
            FROM plan_definitions pd
            WHERE u.account_type = 'parent'
              AND u.plan_type::text = pd.plan_type
              AND (u.staff_limit IS NULL OR u.staff_limit = 0 OR u.customer_limit IS NULL)
        `;

        const result = await db.query(updateSql);

        logger.info('Fixed agency plans for existing agencies');

        res.json({
            message: 'Agency plans fixed successfully',
            affectedRows: result.rowCount || 0
        });
    } catch (error) {
        logger.error('Failed to fix agency plans:', error);
        res.status(500).json({ error: 'Failed to fix agency plans' });
    }
});

module.exports = router;
