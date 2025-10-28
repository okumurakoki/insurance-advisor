const db = require('../utils/database-factory');

class Customer {
    static async create(customerData) {
        const {
            user_id,
            name,
            email,
            phone,
            contract_date,
            contract_amount,
            monthly_premium,
            risk_tolerance,
            investment_goal,
            notes,
            company_id
        } = customerData;

        const sql = `
            INSERT INTO customers (
                user_id, name, email, phone, contract_date,
                contract_amount, monthly_premium, risk_tolerance,
                investment_goal, notes, company_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;

        const result = await db.query(sql, [
            user_id,
            name,
            email || null,
            phone || null,
            contract_date,
            contract_amount,
            monthly_premium,
            risk_tolerance || 'balanced',
            investment_goal || null,
            notes || null,
            company_id || null
        ]);

        return result.insertId || result[0]?.id;
    }

    static async findById(id) {
        const sql = `
            SELECT
                c.*,
                ic.id as company_id,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM customers c
            LEFT JOIN insurance_companies ic ON c.company_id = ic.id
            WHERE c.id = $1 AND c.is_active = TRUE
        `;
        const results = await db.query(sql, [id]);
        return results[0] || null;
    }

    static async getByUserId(userId) {
        const sql = `
            SELECT
                c.*,
                ic.id as company_id,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM customers c
            LEFT JOIN insurance_companies ic ON c.company_id = ic.id
            WHERE c.user_id = $1 AND c.is_active = TRUE
            ORDER BY c.created_at DESC
        `;
        return await db.query(sql, [userId]);
    }

    static async getByAgencyId(agencyId) {
        // 代理店配下の全担当者の全顧客を取得（customersテーブルの場合）
        const sql = `
            SELECT
                c.*,
                u.user_id as staff_user_id,
                u.id as staff_id,
                ic.id as company_id,
                ic.company_code,
                ic.company_name,
                ic.display_name
            FROM customers c
            INNER JOIN users u ON c.user_id = u.id
            LEFT JOIN insurance_companies ic ON c.company_id = ic.id
            WHERE u.parent_id = $1 AND c.is_active = TRUE
            ORDER BY c.created_at DESC
        `;
        return await db.query(sql, [agencyId]);
    }

    static async countByUserId(userId) {
        // 顧客数を取得（customersテーブル）
        const sql = 'SELECT COUNT(*) as count FROM customers WHERE user_id = $1 AND is_active = TRUE';
        const results = await db.query(sql, [userId]);
        return parseInt(results[0].count, 10);
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            return;
        }

        values.push(id);

        const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramCount}`;
        await db.query(sql, values);
    }

    static async deactivate(id) {
        const sql = 'UPDATE customers SET is_active = FALSE WHERE id = $1';
        await db.query(sql, [id]);
    }

    static async getAnalysisHistory(customerId) {
        const sql = `
            SELECT
                ar.*,
                u.user_id as created_by_user_id
            FROM analysis_results ar
            JOIN users u ON ar.created_by = u.id
            WHERE ar.customer_id = $1
            ORDER BY ar.analysis_date DESC
        `;
        return await db.query(sql, [customerId]);
    }

    static async calculateContractMonths(contractDate) {
        const contract = new Date(contractDate);
        const now = new Date();
        const months = (now.getFullYear() - contract.getFullYear()) * 12 + 
                      (now.getMonth() - contract.getMonth());
        return Math.max(0, months);
    }

    static async getAmountTier(monthlyPremium) {
        if (monthlyPremium < 10000) return 'small';
        if (monthlyPremium <= 30000) return 'medium';
        return 'large';
    }

    static async search(userId, searchTerm) {
        const sql = `
            SELECT * FROM customers
            WHERE user_id = $1
            AND is_active = TRUE
            AND (
                name LIKE $2
                OR email LIKE $3
                OR phone LIKE $4
                OR notes LIKE $5
            )
            ORDER BY name ASC
        `;
        const term = `%${searchTerm}%`;
        return await db.query(sql, [userId, term, term, term, term]);
    }

    static async getStatistics(userId) {
        const sql = `
            SELECT
                COUNT(*) as total_customers,
                SUM(contract_amount) as total_contract_amount,
                SUM(monthly_premium) as total_monthly_premium,
                AVG(contract_amount) as avg_contract_amount,
                AVG(monthly_premium) as avg_monthly_premium,
                COUNT(CASE WHEN risk_tolerance = 'conservative' THEN 1 END) as conservative_count,
                COUNT(CASE WHEN risk_tolerance = 'balanced' THEN 1 END) as balanced_count,
                COUNT(CASE WHEN risk_tolerance = 'aggressive' THEN 1 END) as aggressive_count
            FROM customers
            WHERE user_id = $1 AND is_active = TRUE
        `;
        const results = await db.query(sql, [userId]);
        return results[0];
    }
}

module.exports = Customer;