const db = require('../utils/database-factory');

class MarketData {
    static async create(marketData) {
        const {
            data_date,
            data_type,
            source_file,
            data_content,
            uploaded_by
        } = marketData;

        const sql = `
            INSERT INTO market_data (
                data_date, data_type, source_file,
                data_content, uploaded_by
            )
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                source_file = VALUES(source_file),
                data_content = VALUES(data_content),
                uploaded_by = VALUES(uploaded_by),
                created_at = CURRENT_TIMESTAMP
        `;

        const result = await db.query(sql, [
            data_date,
            data_type,
            source_file,
            JSON.stringify(data_content),
            uploaded_by
        ]);

        return result.insertId || result.affectedRows;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM market_data WHERE id = ? AND is_active = TRUE';
        const results = await db.query(sql, [id]);
        
        if (results[0]) {
            results[0].data_content = JSON.parse(results[0].data_content);
        }
        
        return results[0] || null;
    }

    static async getLatest(dataType = 'monthly_report') {
        const sql = `
            SELECT * FROM market_data 
            WHERE data_type = ? AND is_active = TRUE
            ORDER BY data_date DESC
            LIMIT 1
        `;
        const results = await db.query(sql, [dataType]);
        
        if (results[0]) {
            results[0].data_content = JSON.parse(results[0].data_content);
        }
        
        return results[0] || null;
    }

    static async getByDateRange(startDate, endDate, dataType = null) {
        let sql = `
            SELECT * FROM market_data 
            WHERE data_date BETWEEN ? AND ?
            AND is_active = TRUE
        `;
        const params = [startDate, endDate];

        if (dataType) {
            sql += ' AND data_type = ?';
            params.push(dataType);
        }

        sql += ' ORDER BY data_date DESC';

        const results = await db.query(sql, params);
        
        return results.map(result => ({
            ...result,
            data_content: JSON.parse(result.data_content)
        }));
    }

    static async deactivate(id) {
        const sql = 'UPDATE market_data SET is_active = FALSE WHERE id = ?';
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
            LIMIT ?
        `;
        const results = await db.query(sql, [limit]);
        
        return results.map(result => ({
            ...result,
            data_content: JSON.parse(result.data_content)
        }));
    }

    static async checkDataExists(dataDate, dataType) {
        const sql = `
            SELECT COUNT(*) as count
            FROM market_data
            WHERE data_date = ?
            AND data_type = ?
            AND is_active = TRUE
        `;
        const results = await db.query(sql, [dataDate, dataType]);
        return results[0].count > 0;
    }
}

module.exports = MarketData;