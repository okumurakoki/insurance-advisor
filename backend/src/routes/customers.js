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
        let customers;

        // 管理者は顧客管理にアクセスできない
        if (req.user.accountType === 'admin') {
            return res.status(403).json({
                error: 'Administrators do not have access to customer management. Please use agency management instead.'
            });
        }

        // 代理店は全担当者の顧客を取得
        if (req.user.accountType === 'parent') {
            customers = await Customer.getByAgencyId(req.user.id);
        }
        // 担当者は自分の顧客のみ取得
        else if (req.user.accountType === 'child') {
            customers = await Customer.getByUserId(req.user.id);
        }
        // 顧客アカウントは顧客管理にアクセスできない
        else {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

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

        // 権限チェック
        const hasAccess = await checkCustomerAccess(req.user, customer);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(customer);
    } catch (error) {
        logger.error('Customer fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// 顧客アクセス権限チェック関数
async function checkCustomerAccess(user, customer) {
    // 担当者：自分の顧客のみ
    if (user.accountType === 'child') {
        return customer.user_id === user.id;
    }

    // 代理店：配下の担当者の顧客すべて
    if (user.accountType === 'parent') {
        const User = require('../models/User');
        const staff = await User.findById(customer.user_id);
        return staff && staff.parent_id === user.id;
    }

    // 管理者と顧客アカウントはアクセス不可
    return false;
}

router.post('/', authenticateToken, async (req, res) => {
    const { name, email, phone, contractDate, contractAmount, monthlyPremium, riskTolerance, investmentGoal, notes, staffId, companyId } = req.body;

    if (!name || !contractDate || !contractAmount || !monthlyPremium) {
        return res.status(400).json({
            error: 'Name, contract date, contract amount, and monthly premium are required'
        });
    }

    try {
        let assignedUserId = req.user.id;

        // 代理店の場合、担当者IDを指定する必要がある
        if (req.user.accountType === 'parent') {
            if (!staffId) {
                return res.status(400).json({
                    error: 'Staff ID is required for agency accounts. Please select a staff member to assign this customer.'
                });
            }

            // 担当者が代理店配下であることを確認
            const User = require('../models/User');
            const staff = await User.findById(staffId);
            if (!staff || staff.parent_id !== req.user.id) {
                return res.status(403).json({
                    error: 'Invalid staff member. The staff must belong to your agency.'
                });
            }

            assignedUserId = staffId;
        }

        const customerCount = await Customer.countByUserId(assignedUserId);

        // 担当者の顧客数制限をチェック
        const User = require('../models/User');
        const assignedUser = await User.findById(assignedUserId);
        const customerLimit = assignedUser.customer_limit || 10;

        if (customerCount >= customerLimit) {
            return res.status(400).json({
                error: `Customer limit reached for this staff member. Limit: ${customerLimit} customers.`
            });
        }

        const customerId = await Customer.create({
            user_id: assignedUserId,
            name,
            email,
            phone,
            contract_date: contractDate,
            contract_amount: contractAmount,
            monthly_premium: monthlyPremium,
            risk_tolerance: riskTolerance || 'balanced',
            investment_goal: investmentGoal,
            notes,
            company_id: companyId
        });

        logger.info(`Customer created: ${name} by user: ${req.user.userId}, assigned to: ${assignedUserId}`);

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
    const { name, email, phone, contractAmount, monthlyPremium, riskTolerance, investmentGoal, notes, staffId, companyId } = req.body;

    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 権限チェック
        const hasAccess = await checkCustomerAccess(req.user, customer);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = {
            name,
            email,
            phone,
            contract_amount: contractAmount,
            monthly_premium: monthlyPremium,
            risk_tolerance: riskTolerance,
            investment_goal: investmentGoal,
            notes,
            company_id: companyId
        };

        // 代理店の場合、担当者変更が可能
        if (req.user.accountType === 'parent' && staffId) {
            const User = require('../models/User');
            const newStaff = await User.findById(staffId);

            // 担当者が代理店配下であることを確認
            if (!newStaff || newStaff.parent_id !== req.user.id) {
                return res.status(403).json({
                    error: 'Invalid staff member. The staff must belong to your agency.'
                });
            }

            // 新しい担当者の顧客数制限をチェック
            if (staffId !== customer.user_id) {
                const newStaffCustomerCount = await Customer.countByUserId(staffId);
                const customerLimit = newStaff.customer_limit || 10;

                if (newStaffCustomerCount >= customerLimit) {
                    return res.status(400).json({
                        error: `Cannot reassign customer. Staff member has reached their customer limit (${customerLimit}).`
                    });
                }

                updateData.user_id = staffId;
            }
        }

        await Customer.update(req.params.id, updateData);

        logger.info(`Customer updated: ${customer.name} by user: ${req.user.userId}${staffId ? `, reassigned to staff: ${staffId}` : ''}`);

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

        // 権限チェック
        const hasAccess = await checkCustomerAccess(req.user, customer);
        if (!hasAccess) {
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

        // 権限チェック
        const hasAccess = await checkCustomerAccess(req.user, customer);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const history = await Customer.getAnalysisHistory(req.params.id);
        
        res.json(history);
    } catch (error) {
        logger.error('Analysis history fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch analysis history' });
    }
});

// Get customer comparison data (admin and parent only)
router.get('/comparison', authenticateToken, async (req, res) => {
    try {
        // Only allow admin and parent users
        if (req.user.accountType !== 'admin' && req.user.accountType !== 'parent') {
            return res.status(403).json({ error: 'Access denied. Admin or parent account required.' });
        }

        const { customerIds } = req.query;

        if (!customerIds) {
            return res.status(400).json({ error: 'customerIds parameter is required' });
        }

        const ids = customerIds.split(',').map(id => parseInt(id));

        // Get customers with their latest analysis results
        const customers = await Promise.all(
            ids.map(async (customerId) => {
                const customer = await Customer.findById(customerId);

                if (!customer) {
                    return null;
                }

                // Check access rights
                if (customer.user_id !== req.user.id) {
                    return null;
                }

                // Get latest analysis result
                const analysisResults = await AnalysisResult.getByCustomerId(customerId);
                const latestAnalysis = analysisResults[0];

                return {
                    id: customer.id,
                    name: customer.name,
                    monthlyPremium: parseFloat(customer.monthly_premium),
                    contractAmount: parseFloat(customer.contract_amount),
                    riskTolerance: customer.risk_tolerance,
                    contractDate: customer.contract_date,
                    portfolio: latestAnalysis ? latestAnalysis.adjusted_allocation : null,
                    latestAnalysisDate: latestAnalysis ? latestAnalysis.analysis_date : null
                };
            })
        );

        // Filter out null entries (customers not found or no access)
        const validCustomers = customers.filter(c => c !== null);

        res.json(validCustomers);
    } catch (error) {
        logger.error('Customer comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch comparison data' });
    }
});

module.exports = router;