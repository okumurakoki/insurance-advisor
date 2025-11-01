const db = require('../utils/database-factory');

class MarketData {
    static async create(marketData) {
        const {
            data_date,
            data_type,
            source_file,
            data_content,
            pdf_content,
            uploaded_by,
            company_id
        } = marketData;

        // Validate that company_id is provided
        if (!company_id) {
            throw new Error('company_id is required when uploading market data');
        }

        const sql = `
            INSERT INTO market_data (
                data_date, data_type, source_file,
                data_content, pdf_content, uploaded_by, company_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (data_date, data_type)
            DO UPDATE SET
                source_file = EXCLUDED.source_file,
                data_content = EXCLUDED.data_content,
                pdf_content = EXCLUDED.pdf_content,
                uploaded_by = EXCLUDED.uploaded_by,
                company_id = EXCLUDED.company_id,
                created_at = CURRENT_TIMESTAMP
            RETURNING id
        `;

        const result = await db.query(sql, [
            data_date,
            data_type,
            source_file,
            JSON.stringify(data_content),
            pdf_content || null,
            uploaded_by,
            company_id
        ]);

        return result.insertId || result[0]?.id || result.affectedRows;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM market_data WHERE id = $1 AND is_active = TRUE';
        const results = await db.query(sql, [id]);

        if (results[0]) {
            // PostgreSQL JSONB columns are already parsed as objects
            if (typeof results[0].data_content === 'string') {
                results[0].data_content = JSON.parse(results[0].data_content || '{}');
            }
        }

        return results[0] || null;
    }

    static async getLatest(companyId = null, dataType = 'monthly_report') {
        let sql;
        let params;

        if (companyId) {
            // Get latest market data for specific company
            sql = `
                SELECT md.*, ic.company_code, ic.company_name
                FROM market_data md
                LEFT JOIN insurance_companies ic ON md.company_id = ic.id
                WHERE md.data_type = $1
                AND md.company_id = $2
                AND md.is_active = TRUE
                ORDER BY md.data_date DESC
                LIMIT 1
            `;
            params = [dataType, companyId];
        } else {
            // Get latest market data across all companies (for backward compatibility)
            sql = `
                SELECT md.*, ic.company_code, ic.company_name
                FROM market_data md
                LEFT JOIN insurance_companies ic ON md.company_id = ic.id
                WHERE md.data_type = $1
                AND md.is_active = TRUE
                ORDER BY md.data_date DESC
                LIMIT 1
            `;
            params = [dataType];
        }

        const results = await db.query(sql, params);

        if (results[0]) {
            // PostgreSQL JSONB columns are already parsed as objects
            if (typeof results[0].data_content === 'string') {
                results[0].data_content = JSON.parse(results[0].data_content || '{}');
            }
        }

        return results[0] || null;
    }

    static async getByDateRange(startDate, endDate, dataType = null) {
        let sql = `
            SELECT * FROM market_data
            WHERE data_date BETWEEN $1 AND $2
            AND is_active = TRUE
        `;
        const params = [startDate, endDate];

        if (dataType) {
            sql += ' AND data_type = $3';
            params.push(dataType);
        }

        sql += ' ORDER BY data_date DESC';

        const results = await db.query(sql, params);

        return results.map(result => ({
            ...result,
            data_content: typeof result.data_content === 'string'
                ? JSON.parse(result.data_content || '{}')
                : result.data_content
        }));
    }

    static async deactivate(id) {
        const sql = 'UPDATE market_data SET is_active = FALSE WHERE id = $1';
        await db.query(sql, [id]);
    }

    static async getAll(limit = 100) {
        const sql = `
            SELECT
                md.*,
                u.user_id as uploaded_by_user_id
            FROM market_data md
            JOIN users u ON md.uploaded_by = u.id
            WHERE md.is_active = TRUE
            ORDER BY md.data_date DESC
            LIMIT $1
        `;
        const results = await db.query(sql, [limit]);

        return results.map(result => ({
            ...result,
            data_content: typeof result.data_content === 'string'
                ? JSON.parse(result.data_content || '{}')
                : result.data_content
        }));
    }

    static async checkDataExists(dataDate, dataType) {
        const sql = `
            SELECT COUNT(*) as count
            FROM market_data
            WHERE data_date = $1
            AND data_type = $2
            AND is_active = TRUE
        `;
        const results = await db.query(sql, [dataDate, dataType]);
        return results[0].count > 0;
    }
}

module.exports = MarketData;