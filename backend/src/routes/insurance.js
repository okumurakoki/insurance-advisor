const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../utils/database-factory');
const { authenticateToken } = require('../middleware/auth');

// Handle CORS preflight requests
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(200).send();
});

/**
 * GET /api/insurance/companies
 * Get all insurance companies
 */
router.get('/companies', async (req, res) => {
    try {
        const companies = await db.query(`
            SELECT
                id,
                company_code,
                company_name,
                company_name_en,
                display_name,
                is_active,
                created_at,
                updated_at
            FROM insurance_companies
            WHERE is_active = TRUE
            ORDER BY id
        `);

        res.json(companies);
    } catch (error) {
        logger.error('Insurance companies fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch insurance companies' });
    }
});

/**
 * GET /api/insurance/companies/:id
 * Get a specific insurance company by ID
 */
router.get('/companies/:id', async (req, res) => {
    try {
        const companies = await db.query(
            `SELECT
                id,
                company_code,
                company_name,
                company_name_en,
                display_name,
                is_active,
                created_at,
                updated_at
            FROM insurance_companies
            WHERE id = $1`,
            [req.params.id]
        );

        if (companies.length === 0) {
            return res.status(404).json({ error: 'Insurance company not found' });
        }

        res.json(companies[0]);
    } catch (error) {
        logger.error('Insurance company fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch insurance company' });
    }
});

/**
 * GET /api/insurance/companies/:id/special-accounts
 * Get all special accounts for a specific insurance company
 */
router.get('/companies/:id/special-accounts', async (req, res) => {
    try {
        const accounts = await db.query(`
            SELECT
                sa.id,
                sa.company_id,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.investment_policy,
                sa.benchmark,
                sa.base_currency,
                sa.is_active,
                sa.created_at,
                sa.updated_at,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM special_accounts sa
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sa.company_id = $1 AND sa.is_active = TRUE
            ORDER BY sa.account_type, sa.id
        `, [req.params.id]);

        res.json(accounts);
    } catch (error) {
        logger.error('Special accounts fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch special accounts' });
    }
});

/**
 * GET /api/insurance/special-accounts
 * Get all special accounts (optionally filter by company_code)
 */
router.get('/special-accounts', async (req, res) => {
    try {
        const { company_code } = req.query;

        let query = `
            SELECT
                sa.id,
                sa.company_id,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.investment_policy,
                sa.benchmark,
                sa.base_currency,
                sa.is_active,
                sa.created_at,
                sa.updated_at,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM special_accounts sa
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sa.is_active = TRUE
        `;

        const params = [];

        if (company_code) {
            query += ` AND ic.company_code = $1`;
            params.push(company_code);
        }

        query += ` ORDER BY ic.company_code, sa.account_type, sa.id`;

        const accounts = await db.query(query, params);

        res.json(accounts);
    } catch (error) {
        logger.error('Special accounts fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch special accounts' });
    }
});

/**
 * GET /api/insurance/special-accounts/:id
 * Get a specific special account by ID
 */
router.get('/special-accounts/:id', async (req, res) => {
    try {
        const accounts = await db.query(`
            SELECT
                sa.id,
                sa.company_id,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.investment_policy,
                sa.benchmark,
                sa.base_currency,
                sa.is_active,
                sa.created_at,
                sa.updated_at,
                ic.company_code,
                ic.company_name,
                ic.company_name_en,
                ic.display_name
            FROM special_accounts sa
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sa.id = $1
        `, [req.params.id]);

        if (accounts.length === 0) {
            return res.status(404).json({ error: 'Special account not found' });
        }

        res.json(accounts[0]);
    } catch (error) {
        logger.error('Special account fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch special account' });
    }
});

/**
 * GET /api/insurance/special-accounts/:id/performance
 * Get performance data for a specific special account
 */
router.get('/special-accounts/:id/performance', async (req, res) => {
    try {
        const { start_date, end_date, limit = 12 } = req.query;

        let query = `
            SELECT
                sap.id,
                sap.special_account_id,
                sap.performance_date,
                sap.unit_price,
                sap.return_1m,
                sap.return_3m,
                sap.return_6m,
                sap.return_1y,
                sap.return_3y,
                sap.return_since_inception,
                sap.total_assets,
                sap.created_at,
                sa.account_code,
                sa.account_name,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM special_account_performance sap
            JOIN special_accounts sa ON sap.special_account_id = sa.id
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sap.special_account_id = $1
        `;

        const params = [req.params.id];
        let paramCount = 1;

        if (start_date) {
            paramCount++;
            query += ` AND sap.performance_date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND sap.performance_date <= $${paramCount}`;
            params.push(end_date);
        }

        query += ` ORDER BY sap.performance_date DESC`;

        if (limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limit));
        }

        const performance = await db.query(query, params);

        res.json(performance);
    } catch (error) {
        logger.error('Performance data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch performance data' });
    }
});

/**
 * GET /api/insurance/special-accounts/:id/performance/latest
 * Get the latest performance data for a specific special account
 */
router.get('/special-accounts/:id/performance/latest', async (req, res) => {
    try {
        const performance = await db.query(`
            SELECT
                sap.id,
                sap.special_account_id,
                sap.performance_date,
                sap.unit_price,
                sap.return_1m,
                sap.return_3m,
                sap.return_6m,
                sap.return_1y,
                sap.return_3y,
                sap.return_since_inception,
                sap.total_assets,
                sap.created_at,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.benchmark,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM special_account_performance sap
            JOIN special_accounts sa ON sap.special_account_id = sa.id
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sap.special_account_id = $1
            ORDER BY sap.performance_date DESC
            LIMIT 1
        `, [req.params.id]);

        if (performance.length === 0) {
            return res.status(404).json({ error: 'Performance data not found' });
        }

        res.json(performance[0]);
    } catch (error) {
        logger.error('Latest performance data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch latest performance data' });
    }
});

/**
 * GET /api/insurance/performance/latest
 * Get the latest performance data for all special accounts (optionally filter by company)
 */
router.get('/performance/latest', async (req, res) => {
    try {
        const { company_code } = req.query;

        let query = `
            SELECT
                sap.id,
                sap.special_account_id,
                sap.performance_date,
                sap.unit_price,
                sap.return_1m,
                sap.return_3m,
                sap.return_6m,
                sap.return_1y,
                sap.return_3y,
                sap.return_since_inception,
                sap.total_assets,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.benchmark,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM special_account_performance sap
            JOIN special_accounts sa ON sap.special_account_id = sa.id
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sap.performance_date = (
                SELECT MAX(performance_date)
                FROM special_account_performance
                WHERE special_account_id = sap.special_account_id
            )
        `;

        const params = [];

        if (company_code) {
            query += ` AND ic.company_code = $1`;
            params.push(company_code);
        }

        query += ` ORDER BY ic.company_code, sa.account_type, sa.id`;

        const performance = await db.query(query, params);

        res.json(performance);
    } catch (error) {
        logger.error('Latest performance data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch latest performance data' });
    }
});

/**
 * GET /api/insurance/my-companies
 * Get insurance companies available to the current user (based on their agency)
 */
router.get('/my-companies', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountType = req.user.accountType;

        let query;
        let params;

        // If parent (agency), get their contracted companies
        if (accountType === 'parent') {
            query = `
                SELECT DISTINCT
                    ic.id,
                    ic.company_code,
                    ic.company_name,
                    ic.company_name_en,
                    ic.display_name,
                    ic.is_active,
                    aic.id as agency_company_id,
                    aic.contract_start_date,
                    aic.contract_end_date
                FROM insurance_companies ic
                JOIN agency_insurance_companies aic ON ic.id = aic.company_id
                WHERE aic.user_id = $1 AND aic.is_active = TRUE AND ic.is_active = TRUE
                ORDER BY ic.id
            `;
            params = [userId];
        }
        // If child (agent), get their parent agency's companies
        else if (accountType === 'child') {
            query = `
                SELECT DISTINCT
                    ic.id,
                    ic.company_code,
                    ic.company_name,
                    ic.company_name_en,
                    ic.display_name,
                    ic.is_active,
                    aic.id as agency_company_id,
                    aic.contract_start_date,
                    aic.contract_end_date
                FROM insurance_companies ic
                JOIN agency_insurance_companies aic ON ic.id = aic.company_id
                JOIN users u ON aic.user_id = u.id
                WHERE u.id = (SELECT parent_id FROM users WHERE id = $1)
                AND aic.is_active = TRUE AND ic.is_active = TRUE
                ORDER BY ic.id
            `;
            params = [userId];
        }
        // Grandchild (customer) - should not access this endpoint
        else {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companies = await db.query(query, params);
        res.json(companies);
    } catch (error) {
        logger.error('My companies fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch available companies' });
    }
});

/**
 * GET /api/insurance/agency-companies/:userId
 * Get insurance companies for a specific agency (admin only)
 */
router.get('/agency-companies/:userId', authenticateToken, async (req, res) => {
    try {
        // Only allow admin accounts to view
        if (req.user.accountType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const query = `
            SELECT
                aic.id,
                aic.user_id,
                aic.company_id,
                ic.company_code,
                ic.company_name,
                ic.company_name_en,
                ic.display_name,
                aic.contract_start_date,
                aic.contract_end_date,
                aic.is_active
            FROM agency_insurance_companies aic
            JOIN insurance_companies ic ON aic.company_id = ic.id
            WHERE aic.user_id = $1 AND aic.is_active = TRUE
            ORDER BY ic.company_code
        `;

        const companies = await db.query(query, [req.params.userId]);
        res.json(companies);
    } catch (error) {
        logger.error('Agency companies fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch agency companies' });
    }
});

/**
 * POST /api/insurance/agency-companies
 * Add insurance company to agency (admin only)
 */
router.post('/agency-companies', authenticateToken, async (req, res) => {
    try {
        // Only allow admin accounts
        if (req.user.accountType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { user_id, company_id, contract_start_date, notes } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const userId = user_id;

        if (!company_id) {
            return res.status(400).json({ error: 'company_id is required' });
        }

        const query = `
            INSERT INTO agency_insurance_companies (user_id, company_id, contract_start_date, notes, is_active)
            VALUES ($1, $2, $3, $4, TRUE)
            ON CONFLICT (user_id, company_id)
            DO UPDATE SET
                contract_start_date = EXCLUDED.contract_start_date,
                notes = EXCLUDED.notes,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [
            userId,
            company_id,
            contract_start_date || new Date().toISOString().split('T')[0],
            notes || null
        ]);

        res.json({
            message: 'Insurance company added successfully',
            data: result[0] || result
        });
    } catch (error) {
        logger.error('Add agency company error:', error);
        res.status(500).json({ error: 'Failed to add insurance company' });
    }
});

/**
 * PUT /api/insurance/agency-companies/:id
 * Update agency-company relationship (admin only)
 */
router.put('/agency-companies/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.accountType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { contract_start_date, contract_end_date, is_active, notes } = req.body;

        const query = `
            UPDATE agency_insurance_companies
            SET
                contract_start_date = COALESCE($1, contract_start_date),
                contract_end_date = $2,
                is_active = COALESCE($3, is_active),
                notes = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;

        const result = await db.query(query, [
            contract_start_date,
            contract_end_date,
            is_active,
            notes,
            req.params.id
        ]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json({
            message: 'Updated successfully',
            data: result[0] || result
        });
    } catch (error) {
        logger.error('Update agency company error:', error);
        res.status(500).json({ error: 'Failed to update record' });
    }
});

/**
 * DELETE /api/insurance/agency-companies/:id
 * Remove insurance company from agency (soft delete, admin only)
 */
router.delete('/agency-companies/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.accountType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const query = `
            UPDATE agency_insurance_companies
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [req.params.id]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json({ message: 'Insurance company removed successfully' });
    } catch (error) {
        logger.error('Delete agency company error:', error);
        res.status(500).json({ error: 'Failed to remove insurance company' });
    }
});

module.exports = router;
