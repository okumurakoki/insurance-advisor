const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
    // Skip authentication for OPTIONS (CORS preflight) requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.is_active) {
            return res.status(403).json({ error: 'Invalid or inactive user' });
        }

        req.user = {
            id: user.id,
            userId: user.user_id,
            accountType: user.account_type,
            planType: user.plan_type,
            parentId: user.parent_id,
            customerLimit: user.customer_limit
        };

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authorizeAccountType = (...allowedTypes) => {
    return (req, res, next) => {
        // Skip authorization for OPTIONS (CORS preflight) requests
        if (req.method === 'OPTIONS') {
            return next();
        }

        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedTypes.includes(req.user.accountType)) {
            return res.status(403).json({
                error: `Access denied. Required account type: ${allowedTypes.join(' or ')}`
            });
        }

        next();
    };
};

const authorizeParentAccess = async (req, res, next) => {
    // Skip authorization for OPTIONS (CORS preflight) requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const targetUserId = req.params.userId || req.body.userId;

        if (!targetUserId) {
            return next();
        }

        if (req.user.accountType === 'parent') {
            const targetUser = await User.findById(targetUserId);

            if (!targetUser || targetUser.parent_id !== req.user.id) {
                return res.status(403).json({
                    error: 'Access denied. You can only manage your own child accounts.'
                });
            }
        }

        next();
    } catch (error) {
        logger.error('Authorization error:', error);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
};

const authorizePlanFeature = (feature) => {
    return async (req, res, next) => {
        // Skip authorization for OPTIONS (CORS preflight) requests
        if (req.method === 'OPTIONS') {
            return next();
        }

        try {
            const features = await User.getPlanFeatures(req.user.planType);
            const featureObj = features.find(f => f.feature_name === feature);

            if (!featureObj) {
                return res.status(403).json({
                    error: `This feature is not available in your ${req.user.planType} plan`
                });
            }

            req.planFeature = featureObj;
            next();
        } catch (error) {
            logger.error('Plan authorization error:', error);
            return res.status(500).json({ error: 'Plan check failed' });
        }
    };
};

module.exports = {
    authenticateToken,
    authorizeAccountType,
    authorizeParentAccess,
    authorizePlanFeature
};