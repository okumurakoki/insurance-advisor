const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const db = require('../utils/database-factory');

// Handle CORS preflight requests
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(200).send();
});

router.post('/login', async (req, res) => {
    const { userId, password, accountType } = req.body;
    logger.info('Login attempt', { userId, accountType });

    try {

        if (!userId || !password || !accountType) {
            return res.status(400).json({
                error: 'User ID, password, and account type are required'
            });
        }

        const user = await User.findByUserId(userId, accountType);

        if (!user) {
            logger.warn(`User not found: ${userId}, type: ${accountType}`);
            return res.status(401).json({ error: 'ユーザーが見つかりません' });
        }

        const isValid = await User.checkPassword(password, user.password_hash);
        
        if (!isValid) {
            logger.warn(`Wrong password for user: ${userId}`);
            return res.status(401).json({ error: 'パスワードが正しくありません' });
        }

        await User.updateLastLogin(user.id);
        const token = jwt.sign(
            { 
                id: user.id, 
                userId: user.user_id, 
                accountType: user.account_type 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // TODO: Create user_sessions table and restore session tracking
        // Temporarily disabled to fix login issue
        // await db.query(
        //     'INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'24 hours\')',
        //     [user.id, require('crypto').createHash('sha256').update(token).digest('hex'), req.ip, req.headers['user-agent']]
        // );

        logger.info(`User logged in: ${user.user_id} (${user.account_type})`);

        res.json({ 
            token, 
            user: {
                id: user.id,
                userId: user.user_id,
                accountType: user.account_type,
                planType: user.plan_type,
                customerLimit: user.customer_limit
            }
        });
    } catch (error) {
        logger.error('Login error:', {
            error: error.message,
            stack: error.stack,
            userId: userId,
            accountType: accountType
        });
        
        // Check for specific database connection errors
        if (error.message.includes('connect ECONNREFUSED') || error.message.includes('Connection terminated')) {
            res.status(503).json({ error: 'サービスが一時的に利用できません。しばらくしてから再度お試しください。' });
        } else if (error.message.includes('CORS') || error.message.includes('Host validation')) {
            res.status(403).json({ error: 'このリクエストは許可されていません。' });
        } else {
            res.status(500).json({ error: 'ログインに失敗しました。しばらくしてから再度お試しください。' });
        }
    }
});

router.post('/register', async (req, res) => {
    const { userId, name, email, password, accountType, agencyUserId, staffUserId } = req.body;

    if (!userId || !password || !accountType) {
        return res.status(400).json({
            error: 'User ID, password, and account type are required'
        });
    }

    try {
        // ユーザーIDの重複チェック（全アカウントタイプで）
        const existingUser = await User.findByUserId(userId, accountType);
        if (existingUser) {
            return res.status(409).json({ error: 'このログインIDは既に使用されています' });
        }

        let parentId = null;
        const Plan = require('../models/Plan');

        // 担当者登録（childアカウント）
        if (accountType === 'child') {
            if (!agencyUserId) {
                return res.status(400).json({ error: '代理店IDが必要です' });
            }

            // 代理店ユーザーを取得
            const agencyUser = await User.findByUserId(agencyUserId, 'parent');
            if (!agencyUser) {
                return res.status(400).json({ error: '代理店が見つかりません' });
            }

            if (!agencyUser.is_active) {
                return res.status(403).json({ error: '代理店が有効ではありません' });
            }

            // 担当者数の制限チェック
            const limitCheck = await Plan.checkLimit(agencyUser.id, 'staff');
            if (!limitCheck.allowed) {
                return res.status(403).json({
                    error: 'Staff limit reached',
                    message: limitCheck.message
                });
            }

            parentId = agencyUser.id;

            const newUserId = await User.create({
                userId,
                name,
                email,
                password,
                accountType: 'child',
                planType: agencyUser.plan_type,
                parentId,
                customerLimit: agencyUser.customer_limit_per_staff || 10
            });

            logger.info(`New staff registered: ${userId} under agency: ${agencyUserId}`);

            return res.status(201).json({
                message: 'Staff registered successfully',
                userId: newUserId,
                agencyUserId
            });
        }

        // 顧客登録（grandchildアカウント）
        if (accountType === 'grandchild') {
            if (!staffUserId) {
                return res.status(400).json({ error: '担当者IDが必要です' });
            }

            // 担当者ユーザーを取得
            const staffUser = await User.findByUserId(staffUserId, 'child');
            if (!staffUser) {
                return res.status(400).json({ error: '担当者が見つかりません' });
            }

            if (!staffUser.is_active) {
                return res.status(403).json({ error: '担当者が有効ではありません' });
            }

            // 代理店ユーザーを取得
            const agencyUser = await User.findById(staffUser.parent_id);
            if (!agencyUser || !agencyUser.is_active) {
                return res.status(403).json({ error: '代理店が有効ではありません' });
            }

            // 顧客数の制限チェック
            const limitCheck = await Plan.checkLimit(agencyUser.id, 'customer', staffUser.id);
            if (!limitCheck.allowed) {
                return res.status(403).json({
                    error: 'Customer limit reached',
                    message: limitCheck.message
                });
            }

            const newUserId = await User.create({
                userId,
                password,
                accountType: 'grandchild',
                planType: staffUser.plan_type,
                parentId: staffUser.id,
                customerLimit: null
            });

            logger.info(`New customer registered: ${userId} under staff: ${staffUserId}`);

            return res.status(201).json({
                message: 'Customer registered successfully',
                userId: newUserId,
                staffUserId
            });
        }

        // 代理店の新規登録（決済前は非アクティブ状態）
        if (accountType === 'parent') {
            const { planType, insuranceCompanyIds } = req.body;

            // プランタイプの検証
            const allowedPlans = ['bronze', 'silver', 'gold', 'platinum'];
            if (!planType || !allowedPlans.includes(planType)) {
                return res.status(400).json({
                    error: 'プランを選択してください（bronze, silver, gold, platinum）'
                });
            }

            // 保険会社の選択検証（最低1社必要）
            if (!insuranceCompanyIds || !Array.isArray(insuranceCompanyIds) || insuranceCompanyIds.length === 0) {
                return res.status(400).json({
                    error: '契約する保険会社を最低1社選択してください'
                });
            }

            // プラン定義を取得
            const planDef = await db.query(
                'SELECT * FROM plan_definitions WHERE plan_type = $1',
                [planType]
            );

            if (!planDef || planDef.length === 0) {
                return res.status(400).json({ error: 'プランが見つかりません' });
            }

            // アカウント作成（is_active = false で作成）
            const newUserId = await User.create({
                userId,
                name,
                email,
                password,
                accountType: 'parent',
                planType: planType,
                parentId: null,
                customerLimit: planDef[0].customer_limit || 100,
                isActive: false  // 決済完了まで非アクティブ
            });

            // 選択した保険会社を登録（is_active = false で作成、決済完了後に有効化）
            for (const companyId of insuranceCompanyIds) {
                await db.query(
                    `INSERT INTO agency_insurance_companies (user_id, company_id, is_active, created_at, updated_at)
                     VALUES ($1, $2, false, NOW(), NOW())
                     ON CONFLICT (user_id, company_id) DO NOTHING`,
                    [newUserId, companyId]
                );
            }

            logger.info(`New agency registered (pending payment): ${userId}, plan: ${planType}, companies: ${insuranceCompanyIds.length}`);

            return res.status(201).json({
                message: '代理店アカウントを作成しました。決済を完了してサービスを開始してください。',
                userId: newUserId,
                planType: planType,
                insuranceCompanyCount: insuranceCompanyIds.length,
                requiresPayment: true
            });
        }

        // adminアカウントの作成は禁止
        if (accountType === 'admin') {
            return res.status(403).json({
                error: 'Admin accounts cannot be created through this endpoint'
            });
        }

        return res.status(400).json({ error: '無効なアカウントタイプです' });
    } catch (error) {
        logger.error('Registration error:', error);
        logger.error('Error details:', {
            message: error.message,
            stack: error.stack,
            userId,
            accountType
        });
        res.status(500).json({
            error: 'Registration failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
            error: 'Current password and new password are required' 
        });
    }

    try {
        const user = await User.findById(req.user.id);
        
        if (!(await User.checkPassword(currentPassword, user.password_hash))) {
            return res.status(401).json({ error: '現在のパスワードが正しくありません' });
        }

        await User.changePassword(req.user.id, newPassword);
        
        logger.info(`Password changed for user: ${user.user_id}`);
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        logger.error('Password change error:', error);
        res.status(500).json({ error: 'Password change failed' });
    }
});

router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Get current user info with customer count and limit
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        // Get customer count for this user
        const Customer = require('../models/Customer');
        const customerCount = await Customer.countByUserId(user.id);
        const customerLimit = user.customer_limit || 10;

        res.json({
            id: user.id,
            userId: user.user_id,
            accountType: user.account_type,
            parentId: user.parent_id,
            customerCount,
            customerLimit,
            canAddCustomer: customerCount < customerLimit
        });
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

module.exports = router;