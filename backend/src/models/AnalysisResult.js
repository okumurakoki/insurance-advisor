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
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
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

        return result[0]?.id || result.insertId;
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
            WHERE ar.id = $1
        `;
        const results = await db.query(sql, [id]);

        if (results[0]) {
            // Handle PostgreSQL JSONB columns (already objects) vs JSON strings
            results[0].base_allocation = typeof results[0].base_allocation === 'string'
                ? JSON.parse(results[0].base_allocation)
                : results[0].base_allocation;
            results[0].adjusted_allocation = typeof results[0].adjusted_allocation === 'string'
                ? JSON.parse(results[0].adjusted_allocation)
                : results[0].adjusted_allocation;
            results[0].adjustment_factors = typeof results[0].adjustment_factors === 'string'
                ? JSON.parse(results[0].adjustment_factors)
                : results[0].adjustment_factors;
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
            WHERE ar.customer_id = $1
            ORDER BY ar.analysis_date DESC
            LIMIT $2
        `;
        const results = await db.query(sql, [customerId, limit]);

        return results.map(result => ({
            ...result,
            base_allocation: typeof result.base_allocation === 'string'
                ? JSON.parse(result.base_allocation)
                : (result.base_allocation || {}),
            adjusted_allocation: typeof result.adjusted_allocation === 'string'
                ? JSON.parse(result.adjusted_allocation)
                : (result.adjusted_allocation || {}),
            adjustment_factors: typeof result.adjustment_factors === 'string'
                ? JSON.parse(result.adjustment_factors)
                : (result.adjustment_factors || {})
        }));
    }

    static async getByUserId(userId) {
        const sql = `
            SELECT
                ar.id,
                ar.customer_id,
                ar.analysis_date,
                ar.base_allocation as recommended_allocation,
                ar.adjusted_allocation as current_allocation,
                ar.adjustment_factors,
                ar.recommendation_text,
                ar.confidence_score,
                ar.created_at,
                c.name as customer_name
            FROM analysis_results ar
            JOIN customers c ON ar.customer_id = c.id
            WHERE c.user_id = $1
            ORDER BY ar.created_at DESC
        `;
        const results = await db.query(sql, [userId]);

        return results.map(result => ({
            ...result,
            recommended_allocation: typeof result.recommended_allocation === 'string'
                ? JSON.parse(result.recommended_allocation)
                : (result.recommended_allocation || {}),
            current_allocation: typeof result.current_allocation === 'string'
                ? JSON.parse(result.current_allocation)
                : (result.current_allocation || {}),
            adjustment_factors: typeof result.adjustment_factors === 'string'
                ? JSON.parse(result.adjustment_factors)
                : (result.adjustment_factors || {})
        }));
    }

    static async checkAnalysisFrequency(customerId, frequency) {
        const frequencyDays = {
            'daily': 1,
            'weekly': 7,
            'monthly': 30
        };

        const days = frequencyDays[frequency] || 30;

        // Use string interpolation for interval since PostgreSQL doesn't support parameterized intervals well
        const sql = `
            SELECT COUNT(*) as count
            FROM analysis_results
            WHERE customer_id = $1
            AND analysis_date >= NOW() - INTERVAL '${days} days'
        `;

        const results = await db.query(sql, [customerId]);
        const count = parseInt(results[0].count) || 0;
        console.log('checkAnalysisFrequency - customerId:', customerId, 'frequency:', frequency, 'days:', days, 'count:', count);
        return count === 0;
    }

    static async getLatestByCustomerId(customerId) {
        const sql = `
            SELECT * FROM analysis_results
            WHERE customer_id = $1
            ORDER BY analysis_date DESC
            LIMIT 1
        `;
        const results = await db.query(sql, [customerId]);

        if (results[0]) {
            results[0].base_allocation = typeof results[0].base_allocation === 'string'
                ? JSON.parse(results[0].base_allocation)
                : results[0].base_allocation;
            results[0].adjusted_allocation = typeof results[0].adjusted_allocation === 'string'
                ? JSON.parse(results[0].adjusted_allocation)
                : results[0].adjusted_allocation;
            results[0].adjustment_factors = typeof results[0].adjustment_factors === 'string'
                ? JSON.parse(results[0].adjustment_factors)
                : results[0].adjustment_factors;
        }

        return results[0] || null;
    }

    static async deleteByCustomerId(customerId) {
        const sql = 'DELETE FROM analysis_results WHERE customer_id = $1';
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
            WHERE c.user_id = $1
            AND ar.analysis_date BETWEEN $2 AND $3
        `;

        const results = await db.query(sql, [userId, dateFrom, dateTo]);
        return results[0];
    }
}

module.exports = AnalysisResult;