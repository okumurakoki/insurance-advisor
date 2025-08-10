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

module.exports = router;