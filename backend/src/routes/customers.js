const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const logger = require('../utils/logger');
const { authenticateToken, authorizeAccountType } = require('../middleware/auth');

// Handle CORS preflight requests
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(200).send();
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const customers = await Customer.getByUserId(req.user.id);
        res.json(customers);
    } catch (error) {
        logger.error('Customer fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(customer);
    } catch (error) {
        logger.error('Customer fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const { name, email, phone, contractDate, contractAmount, monthlyPremium, riskTolerance, investmentGoal, notes } = req.body;

    if (!name || !contractDate || !contractAmount || !monthlyPremium) {
        return res.status(400).json({ 
            error: 'Name, contract date, contract amount, and monthly premium are required' 
        });
    }

    try {
        const customerCount = await Customer.countByUserId(req.user.id);
        
        if (customerCount >= req.user.customerLimit) {
            return res.status(400).json({ 
                error: `Customer limit reached. Your ${req.user.planType} plan allows ${req.user.customerLimit} customers.` 
            });
        }

        const customerId = await Customer.create({
            user_id: req.user.id,
            name,
            email,
            phone,
            contract_date: contractDate,
            contract_amount: contractAmount,
            monthly_premium: monthlyPremium,
            risk_tolerance: riskTolerance || 'balanced',
            investment_goal: investmentGoal,
            notes
        });

        logger.info(`Customer created: ${name} by user: ${req.user.userId}`);

        res.status(201).json({ 
            id: customerId,
            message: 'Customer created successfully' 
        });
    } catch (error) {
        logger.error('Customer creation error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { name, email, phone, contractAmount, monthlyPremium, riskTolerance, investmentGoal, notes } = req.body;

    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Customer.update(req.params.id, {
            name,
            email,
            phone,
            contract_amount: contractAmount,
            monthly_premium: monthlyPremium,
            risk_tolerance: riskTolerance,
            investment_goal: investmentGoal,
            notes
        });

        logger.info(`Customer updated: ${customer.name} by user: ${req.user.userId}`);

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        logger.error('Customer update error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Customer.deactivate(req.params.id);

        logger.info(`Customer deactivated: ${customer.name} by user: ${req.user.userId}`);

        res.json({ message: 'Customer deactivated successfully' });
    } catch (error) {
        logger.error('Customer deletion error:', error);
        res.status(500).json({ error: 'Failed to deactivate customer' });
    }
});

router.get('/:id/analysis-history', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const history = await Customer.getAnalysisHistory(req.params.id);
        
        res.json(history);
    } catch (error) {
        logger.error('Analysis history fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch analysis history' });
    }
});

module.exports = router;