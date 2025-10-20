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

// Test endpoint for database connectivity
router.get('/test', async (req, res) => {
    try {
        console.log('Testing database connection...');
        console.log('Environment vars:', {
            USE_SQLITE: process.env.USE_SQLITE,
            NODE_ENV: process.env.NODE_ENV
        });
        
        const db = require('../utils/database-factory');
        console.log('Database factory loaded');
        
        // Initialize if needed
        if (db.initialize && typeof db.initialize === 'function') {
            await db.initialize();
            console.log('Database initialized');
        }
        
        // Check users in database
        const users = await db.query('SELECT id, user_id, account_type FROM users LIMIT 5');
        console.log('Users in database:', users);
        
        res.json({
            status: 'OK',
            message: 'Auth endpoint and database working',
            cors: 'Enabled',
            database: 'Connected',
            users: users,
            timestamp: new Date().toISOString(),
            env: {
                USE_SQLITE: process.env.USE_SQLITE,
                NODE_ENV: process.env.NODE_ENV
            }
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            env: {
                USE_SQLITE: process.env.USE_SQLITE,
                NODE_ENV: process.env.NODE_ENV
            }
        });
    }
});

router.post('/login', async (req, res) => {
    const { userId, password, accountType } = req.body;
    console.log('Login attempt:', { userId, accountType });

    try {

        if (!userId || !password || !accountType) {
            return res.status(400).json({
                error: 'User ID, password, and account type are required'
            });
        }

        const user = await User.findByUserId(userId, accountType);

        if (!user) {
            logger.warn(`User not found: ${userId}, type: ${accountType}`);
            return res.status(401).json({ error: 'User not found' });
        }

        // Debug password check
        console.log('Password check:', { 
            userId, 
            inputPassword: password,
            passwordHash: user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'null'
        });
        
        const isValid = await User.checkPassword(password, user.password_hash);
        console.log('Password valid:', isValid);
        
        if (!isValid) {
            logger.warn(`Wrong password for user: ${userId}`);
            return res.status(401).json({ error: 'Invalid credentials' });
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
        console.error('Login error details:', error);
        logger.error('Login error:', {
            error: error.message,
            stack: error.stack,
            userId: userId,
            accountType: accountType
        });
        
        // Check for specific database connection errors
        if (error.message.includes('connect ECONNREFUSED') || error.message.includes('Connection terminated')) {
            res.status(503).json({ error: 'Database connection failed' });
        } else if (error.message.includes('CORS') || error.message.includes('Host validation')) {
            res.status(403).json({ error: 'Request not allowed from this origin' });
        } else {
            res.status(500).json({ error: 'Login failed' });
        }
    }
});

router.post('/register', async (req, res) => {
    const { userId, password, accountType, agencyUserId, staffUserId } = req.body;

    if (!userId || !password || !accountType) {
        return res.status(400).json({
            error: 'User ID, password, and account type are required'
        });
    }

    try {
        // ユーザーIDの重複チェック（全アカウントタイプで）
        const existingUser = await User.findByUserId(userId, accountType);
        if (existingUser) {
            return res.status(409).json({ error: 'User ID already exists' });
        }

        let parentId = null;
        const Plan = require('../models/Plan');

        // 担当者登録（childアカウント）
        if (accountType === 'child') {
            if (!agencyUserId) {
                return res.status(400).json({ error: 'Agency user ID is required for staff registration' });
            }

            // 代理店ユーザーを取得
            const agencyUser = await User.findByUserId(agencyUserId, 'parent');
            if (!agencyUser) {
                return res.status(400).json({ error: 'Agency not found' });
            }

            if (!agencyUser.is_active) {
                return res.status(403).json({ error: 'Agency is not active' });
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
                return res.status(400).json({ error: 'Staff user ID is required for customer registration' });
            }

            // 担当者ユーザーを取得
            const staffUser = await User.findByUserId(staffUserId, 'child');
            if (!staffUser) {
                return res.status(400).json({ error: 'Staff not found' });
            }

            if (!staffUser.is_active) {
                return res.status(403).json({ error: 'Staff is not active' });
            }

            // 代理店ユーザーを取得
            const agencyUser = await User.findById(staffUser.parent_id);
            if (!agencyUser || !agencyUser.is_active) {
                return res.status(403).json({ error: 'Agency is not active' });
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

        // 代理店は管理者のみが作成可能
        if (accountType === 'parent') {
            return res.status(403).json({
                error: 'Agency accounts can only be created by administrators'
            });
        }

        // adminアカウントの作成は禁止
        if (accountType === 'admin') {
            return res.status(403).json({
                error: 'Admin accounts cannot be created through this endpoint'
            });
        }

        return res.status(400).json({ error: 'Invalid account type' });
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

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
            await db.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
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
            return res.status(401).json({ error: 'Current password is incorrect' });
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
            return res.status(404).json({ error: 'User not found' });
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