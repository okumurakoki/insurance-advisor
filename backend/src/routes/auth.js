const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const db = require('../utils/database-factory');

// Test endpoint for CORS debugging
router.get('/test', (req, res) => {
    try {
        res.json({
            status: 'OK',
            message: 'Auth endpoint is working',
            cors: 'Enabled',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { userId, password, accountType } = req.body;

    if (!userId || !password || !accountType) {
        return res.status(400).json({ 
            error: 'User ID, password, and account type are required' 
        });
    }

    try {
        const user = await User.findByUserId(userId, accountType);

        if (!user || !(await User.checkPassword(password, user.password_hash))) {
            logger.warn(`Failed login attempt for user: ${userId}, type: ${accountType}`);
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

        await db.query(
            'INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
            [user.id, require('crypto').createHash('sha256').update(token).digest('hex'), req.ip, req.headers['user-agent']]
        );

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
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/register', async (req, res) => {
    const { userId, password, accountType, planType, parentUserId } = req.body;

    if (!userId || !password || !accountType) {
        return res.status(400).json({ 
            error: 'User ID, password, and account type are required' 
        });
    }

    try {
        const existingUser = await User.findByUserId(userId, accountType);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        let parentId = null;
        if (accountType !== 'parent' && parentUserId) {
            const parentUser = await User.findByUserId(parentUserId, 'parent');
            if (!parentUser) {
                return res.status(400).json({ error: 'Parent user not found' });
            }
            parentId = parentUser.id;
        }

        const customerLimits = {
            'standard': 10,
            'master': 50,
            'exceed': 999
        };

        const newUserId = await User.create({
            userId,
            password,
            accountType,
            planType: planType || 'standard',
            parentId,
            customerLimit: customerLimits[planType || 'standard']
        });

        logger.info(`New user registered: ${userId} (${accountType})`);

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: newUserId
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
            await db.query('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
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

module.exports = router;