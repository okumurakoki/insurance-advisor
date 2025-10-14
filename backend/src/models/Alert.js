const db = require('../utils/database-factory');

class Alert {
    static async create(alertData) {
        const {
            user_id,
            customer_id,
            type,
            priority,
            title,
            message,
            action_type,
            is_read = false
        } = alertData;

        const sql = `
            INSERT INTO alerts (
                user_id, customer_id, type, priority,
                title, message, action_type, is_read, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *
        `;

        const result = await db.query(sql, [
            user_id,
            customer_id,
            type,
            priority,
            title,
            message,
            action_type,
            is_read
        ]);

        return result[0];
    }

    static async getByUserId(userId) {
        const sql = `
            SELECT
                a.*,
                c.name as customer_name
            FROM alerts a
            LEFT JOIN customers c ON a.customer_id = c.id
            WHERE a.user_id = $1
            ORDER BY a.is_read ASC, a.created_at DESC
        `;

        const result = await db.query(sql, [userId]);
        return result;
    }

    static async markAsRead(id, userId) {
        const sql = `
            UPDATE alerts
            SET is_read = true, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;

        const result = await db.query(sql, [id, userId]);
        return result[0];
    }

    static async markAllAsRead(userId) {
        const sql = `
            UPDATE alerts
            SET is_read = true, updated_at = NOW()
            WHERE user_id = $1 AND is_read = false
            RETURNING *
        `;

        const result = await db.query(sql, [userId]);
        return result;
    }

    static async delete(id, userId) {
        const sql = `
            DELETE FROM alerts
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;

        const result = await db.query(sql, [id, userId]);
        return result[0];
    }

    static async getUnreadCount(userId) {
        const sql = `
            SELECT COUNT(*) as count
            FROM alerts
            WHERE user_id = $1 AND is_read = false
        `;

        const result = await db.query(sql, [userId]);
        return parseInt(result[0]?.count || 0);
    }

    // アラート生成ヘルパー関数
    static async createPortfolioWarning(userId, customerId, customerName, message) {
        return this.create({
            user_id: userId,
            customer_id: customerId,
            type: 'warning',
            priority: 'high',
            title: 'ポートフォリオ配分バランス注意',
            message,
            action_type: 'rebalance'
        });
    }

    static async createMarketOpportunity(userId, customerId, customerName, message) {
        return this.create({
            user_id: userId,
            customer_id: customerId,
            type: 'success',
            priority: 'medium',
            title: '市場機会アラート',
            message,
            action_type: 'buy_opportunity'
        });
    }

    static async createRiskAlert(userId, customerId, customerName, message) {
        return this.create({
            user_id: userId,
            customer_id: customerId,
            type: 'error',
            priority: 'high',
            title: '損失限界アラート',
            message,
            action_type: 'risk_management'
        });
    }

    static async createReportReady(userId, customerId, customerName) {
        return this.create({
            user_id: userId,
            customer_id: customerId,
            type: 'info',
            priority: 'low',
            title: 'レポート生成完了',
            message: `${customerName}様のリスク分析レポートが完成しました。確認してください。`,
            action_type: 'report_ready'
        });
    }
}

module.exports = Alert;
