const express = require('express');
const router = express.Router();
const User = require('../models/User');
const logger = require('../utils/logger');
const { authenticateToken, authorizeAccountType, authorizeParentAccess } = require('../middleware/auth');

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password_hash, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
    } catch (error) {
        logger.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// 代理店用：担当者一覧を顧客数と一緒に取得
router.get('/staff', authenticateToken, authorizeAccountType('parent'), async (req, res) => {
    try {
        const staff = await User.getChildren(req.user.id);
        const Customer = require('../models/Customer');

        // 各担当者の顧客数と上限を取得
        const staffWithCustomerInfo = await Promise.all(
            staff.map(async (s) => {
                const customerCount = await Customer.countByUserId(s.id);
                const customerLimit = s.customer_limit || 10;
                const { password_hash, ...staffWithoutPassword } = s;
                return {
                    ...staffWithoutPassword,
                    customerCount,
                    customerLimit,
                    canAddCustomer: customerCount < customerLimit
                };
            })
        );

        res.json(staffWithCustomerInfo);
    } catch (error) {
        logger.error('Staff fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

// Get user info by ID (for staff information on customer details page)
// IMPORTANT: This route must be defined AFTER all specific routes like /profile, /children, /staff
// because Express matches routes in order and /:id would match those paths first
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // セキュリティチェック: 代理店は配下の担当者の情報のみ取得可能
        if (req.user.accountType === 'parent') {
            // 代理店は配下の担当者情報のみ取得可能
            if (user.parent_id !== req.user.id && user.id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        } else if (req.user.accountType === 'child') {
            // 担当者は自分の情報のみ取得可能
            if (user.id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const { password_hash, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
    } catch (error) {
        logger.error('User fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.delete('/deactivate/:userId', authenticateToken, authorizeAccountType('parent'), authorizeParentAccess, async (req, res) => {
    const { userId } = req.params;

    try {
        await User.deactivate(userId);
        
        logger.info(`User deactivated: ${userId} by ${req.user.userId}`);
        
        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        logger.error('Deactivation error:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

// Get current user's agency stats (parent only)
router.get('/my-stats', authenticateToken, authorizeAccountType('parent'), async (req, res) => {
    try {
        const Plan = require('../models/Plan');
        const stats = await Plan.getAgencyStats(req.user.id);
        res.json(stats);
    } catch (error) {
        logger.error('Agency stats fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch agency stats' });
    }
});

// 管理者専用: 全ユーザー一覧取得
router.get('/', authenticateToken, authorizeAccountType('admin'), async (req, res) => {
    try {
        const users = await User.findAll();
        
        // パスワードハッシュを除外
        const usersWithoutPasswords = users.map(user => {
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        logger.info(`All users fetched by admin: ${req.user.userId}`);
        res.json(usersWithoutPasswords);
    } catch (error) {
        logger.error('Users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 管理者専用: ユーザー情報更新
router.put('/:id', authenticateToken, authorizeAccountType('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, email, accountType, planType, customerLimit, isActive } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        await User.update(id, {
            name: name || user.name,
            email: email || user.email,
            accountType: accountType || user.account_type,
            planType: planType || user.plan_type,
            customerLimit: customerLimit !== undefined ? customerLimit : user.customer_limit,
            isActive: isActive !== undefined ? isActive : user.is_active
        });

        logger.info(`User updated: ${user.user_id} by admin: ${req.user.userId}`);

        res.json({ message: 'ユーザー情報が正常に更新されました' });
    } catch (error) {
        logger.error('User update error:', error);
        res.status(500).json({ error: 'ユーザー情報の更新に失敗しました' });
    }
});

module.exports = router;