const db = require('../utils/database-factory');

class AnalysisResult {
    static async create(analysisData) {
        const {
            customer_id,
            analysis_date,
            market_data_source,
            base_allocation,
            adjusted_allocation,
            adjustment_factors,
            recommendation_text,
            confidence_score,
            created_by
        } = analysisData;

        const sql = `
            INSERT INTO analysis_results (
                customer_id, analysis_date, market_data_source,
                base_allocation, adjusted_allocation, adjustment_factors,
                recommendation_text, confidence_score, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.query(sql, [
            customer_id,
            analysis_date,
            market_data_source,
            JSON.stringify(base_allocation),
            JSON.stringify(adjusted_allocation),
            JSON.stringify(adjustment_factors),
            recommendation_text,
            confidence_score,
            created_by
        ]);

        return result.insertId;
    }

    static async findById(id) {
        const sql = `
            SELECT 
                ar.*,
                c.name as customer_name,
                c.contract_date,
                c.monthly_premium,
                c.risk_tolerance,
                u.user_id as created_by_user_id
            FROM analysis_results ar
            JOIN customers c ON ar.customer_id = c.id
            JOIN users u ON ar.created_by = u.id
            WHERE ar.id = ?
        `;
        const results = await db.query(sql, [id]);
        
        if (results[0]) {
            results[0].base_allocation = JSON.parse(results[0].base_allocation);
            results[0].adjusted_allocation = JSON.parse(results[0].adjusted_allocation);
            results[0].adjustment_factors = JSON.parse(results[0].adjustment_factors);
        }
        
        return results[0] || null;
    }

    static async getByCustomerId(customerId, limit = 10) {
        const sql = `
            SELECT 
                ar.*,
                u.user_id as created_by_user_id
            FROM analysis_results ar
            JOIN users u ON ar.created_by = u.id
            WHERE ar.customer_id = ?
            ORDER BY ar.analysis_date DESC
            LIMIT ?
        `;
        const results = await db.query(sql, [customerId, limit]);
        
        return results.map(result => ({
            ...result,
            base_allocation: JSON.parse(result.base_allocation),
            adjusted_allocation: JSON.parse(result.adjusted_allocation),
            adjustment_factors: JSON.parse(result.adjustment_factors)
        }));
    }

    static async checkAnalysisFrequency(customerId, frequency) {
        const frequencyDays = {
            'daily': 1,
            'weekly': 7,
            'monthly': 30
        };

        const days = frequencyDays[frequency] || 30;

        const sql = `
            SELECT COUNT(*) as count
            FROM analysis_results
            WHERE customer_id = ?
            AND analysis_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `;

        const results = await db.query(sql, [customerId, days]);
        return results[0].count === 0;
    }

    static async getLatestByCustomerId(customerId) {
        const sql = `
            SELECT * FROM analysis_results
            WHERE customer_id = ?
            ORDER BY analysis_date DESC
            LIMIT 1
        `;
        const results = await db.query(sql, [customerId]);
        
        if (results[0]) {
            results[0].base_allocation = JSON.parse(results[0].base_allocation);
            results[0].adjusted_allocation = JSON.parse(results[0].adjusted_allocation);
            results[0].adjustment_factors = JSON.parse(results[0].adjustment_factors);
        }
        
        return results[0] || null;
    }

    static async deleteByCustomerId(customerId) {
        const sql = 'DELETE FROM analysis_results WHERE customer_id = ?';
        await db.query(sql, [customerId]);
    }

    static async getStatistics(userId, dateFrom, dateTo) {
        const sql = `
            SELECT 
                COUNT(DISTINCT ar.id) as total_analyses,
                COUNT(DISTINCT ar.customer_id) as unique_customers,
                AVG(ar.confidence_score) as avg_confidence_score,
                COUNT(DISTINCT DATE(ar.created_at)) as analysis_days
            FROM analysis_results ar
            JOIN customers c ON ar.customer_id = c.id
            WHERE c.user_id = ?
            AND ar.analysis_date BETWEEN ? AND ?
        `;
        
        const results = await db.query(sql, [userId, dateFrom, dateTo]);
        return results[0];
    }
}

module.exports = AnalysisResult;