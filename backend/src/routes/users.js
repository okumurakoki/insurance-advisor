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

router.get('/children', authenticateToken, authorizeAccountType('parent'), async (req, res) => {
    try {
        const children = await User.getChildren(req.user.id);

        const childrenWithoutPasswords = children.map(child => {
            const { password_hash, ...childWithoutPassword } = child;
            return childWithoutPassword;
        });

        res.json(childrenWithoutPasswords);
    } catch (error) {
        logger.error('Children fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch child accounts' });
    }
});

// 代理店用：担当者一覧を顧客数と一緒に取得
router.get('/staff', authenticateToken, authorizeAccountType('parent'), async (req, res) => {
    try {
        const staff = await User.getChildren(req.user.id);
        const Customer = require('../models/Customer');

        // 各担当者の顧客数を取得
        const staffWithCustomerCount = await Promise.all(
            staff.map(async (s) => {
                const customerCount = await Customer.countByUserId(s.id);
                const { password_hash, ...staffWithoutPassword } = s;
                return {
                    ...staffWithoutPassword,
                    customerCount
                };
            })
        );

        res.json(staffWithCustomerCount);
    } catch (error) {
        logger.error('Staff fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

router.post('/create-child', authenticateToken, authorizeAccountType('parent'), async (req, res) => {
    const { userId, password, accountType } = req.body;

    if (!userId || !password || !accountType) {
        return res.status(400).json({ 
            error: 'User ID, password, and account type are required' 
        });
    }

    if (accountType !== 'child' && accountType !== 'grandchild') {
        return res.status(400).json({ 
            error: 'Parent accounts can only create child or grandchild accounts' 
        });
    }

    try {
        const existingUser = await User.findByUserId(userId, accountType);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const parentUser = await User.findById(req.user.id);

        const newUserId = await User.create({
            userId,
            password,
            accountType,
            planType: parentUser.plan_type,
            parentId: req.user.id,
            customerLimit: parentUser.customer_limit
        });

        logger.info(`Child account created: ${userId} (${accountType}) by parent: ${req.user.userId}`);

        res.status(201).json({ 
            message: 'Child account created successfully',
            userId: newUserId
        });
    } catch (error) {
        logger.error('Child account creation error:', error);
        res.status(500).json({ error: 'Failed to create child account' });
    }
});

router.put('/update-plan', authenticateToken, authorizeAccountType('parent'), async (req, res) => {
    const { planType } = req.body;

    const validPlans = ['standard', 'master', 'exceed'];
    if (!planType || !validPlans.includes(planType)) {
        return res.status(400).json({ 
            error: 'Valid plan type required: standard, master, or exceed' 
        });
    }

    try {
        const customerLimits = {
            'standard': 10,
            'master': 50,
            'exceed': 999
        };

        await User.updatePlan(req.user.id, planType, customerLimits[planType]);

        const children = await User.getChildren(req.user.id);
        for (const child of children) {
            await User.updatePlan(child.id, planType, customerLimits[planType]);
        }

        logger.info(`Plan updated to ${planType} for user: ${req.user.userId}`);

        res.json({ 
            message: 'Plan updated successfully',
            planType,
            customerLimit: customerLimits[planType]
        });
    } catch (error) {
        logger.error('Plan update error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
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

router.get('/plan-features', authenticateToken, async (req, res) => {
    try {
        const features = await User.getPlanFeatures(req.user.planType);
        
        res.json({
            planType: req.user.planType,
            features: features.reduce((acc, feature) => {
                acc[feature.feature_name] = {
                    value: feature.feature_value,
                    description: feature.description
                };
                return acc;
            }, {})
        });
    } catch (error) {
        logger.error('Plan features fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch plan features' });
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

// 管理者専用: 新規ユーザー作成
router.post('/', authenticateToken, authorizeAccountType('admin'), async (req, res) => {
    const { userId, name, email, password, accountType, planType, customerLimit, parentId, customerId } = req.body;

    if (!userId || !name || !email || !password || !accountType) {
        return res.status(400).json({ 
            error: 'ユーザーID、名前、メール、パスワード、アカウント種別は必須です' 
        });
    }

    const validAccountTypes = ['admin', 'parent', 'child', 'grandchild'];
    if (!validAccountTypes.includes(accountType)) {
        return res.status(400).json({ 
            error: '無効なアカウント種別です' 
        });
    }

    try {
        const existingUser = await User.findByUserId(userId);
        if (existingUser) {
            return res.status(409).json({ error: 'ユーザーIDが既に存在します' });
        }

        const newUserId = await User.createWithDetails({
            userId,
            name,
            email,
            password,
            accountType,
            planType: planType || 'standard',
            customerLimit: customerLimit || 10,
            parentId,
            customerId
        });

        logger.info(`New user created: ${userId} (${accountType}) by admin: ${req.user.userId}`);

        res.status(201).json({ 
            message: 'ユーザーが正常に作成されました',
            userId: newUserId
        });
    } catch (error) {
        logger.error('User creation error:', error);
        res.status(500).json({ error: 'ユーザー作成に失敗しました' });
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