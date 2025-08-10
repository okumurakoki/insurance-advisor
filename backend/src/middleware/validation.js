const { AppError } = require('./errorHandler');

const validateRegistration = (req, res, next) => {
    const { userId, password, accountType } = req.body;

    if (!userId || userId.length < 3) {
        throw new AppError('User ID must be at least 3 characters long', 400);
    }

    if (!password || password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
    }

    const validAccountTypes = ['parent', 'child', 'grandchild'];
    if (!accountType || !validAccountTypes.includes(accountType)) {
        throw new AppError('Invalid account type', 400);
    }

    next();
};

const validateCustomer = (req, res, next) => {
    const { name, contractDate, contractAmount, monthlyPremium } = req.body;

    if (!name || name.trim().length === 0) {
        throw new AppError('Customer name is required', 400);
    }

    if (!contractDate || !isValidDate(contractDate)) {
        throw new AppError('Valid contract date is required', 400);
    }

    if (!contractAmount || contractAmount <= 0) {
        throw new AppError('Contract amount must be greater than 0', 400);
    }

    if (!monthlyPremium || monthlyPremium <= 0) {
        throw new AppError('Monthly premium must be greater than 0', 400);
    }

    const validRiskTolerances = ['conservative', 'balanced', 'aggressive'];
    if (req.body.riskTolerance && !validRiskTolerances.includes(req.body.riskTolerance)) {
        throw new AppError('Invalid risk tolerance level', 400);
    }

    next();
};

const validatePlanUpdate = (req, res, next) => {
    const { planType } = req.body;
    const validPlans = ['standard', 'master', 'exceed'];

    if (!planType || !validPlans.includes(planType)) {
        throw new AppError('Invalid plan type', 400);
    }

    next();
};

const validateAnalysisRequest = (req, res, next) => {
    const { customerId } = req.params;

    if (!customerId || isNaN(customerId)) {
        throw new AppError('Valid customer ID is required', 400);
    }

    next();
};

const sanitizeInput = (req, res, next) => {
    // Remove any potentially harmful characters from string inputs
    const sanitize = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
                // Remove any HTML tags
                obj[key] = obj[key].replace(/<[^>]*>/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);

    next();
};

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

module.exports = {
    validateRegistration,
    validateCustomer,
    validatePlanUpdate,
    validateAnalysisRequest,
    sanitizeInput
};