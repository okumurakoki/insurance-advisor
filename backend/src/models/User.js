const db = require('../utils/database-factory');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { userId, password, accountType, planType, parentId, customerLimit } = userData;
        
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const sql = `
            INSERT INTO users (user_id, password_hash, account_type, plan_type, parent_id, customer_limit)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [
            userId,
            passwordHash,
            accountType,
            planType || 'standard',
            parentId || null,
            customerLimit || 10
        ]);
        
        return result.insertId;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ? AND is_active = TRUE';
        const results = await db.query(sql, [id]);
        return results[0] || null;
    }

    static async findByUserId(userId, accountType) {
        const sql = 'SELECT * FROM users WHERE user_id = ? AND account_type = ? AND is_active = TRUE';
        const results = await db.query(sql, [userId, accountType]);
        return results[0] || null;
    }

    static async updateLastLogin(id) {
        const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
        await db.query(sql, [id]);
    }

    static async updatePlan(id, planType, customerLimit) {
        const sql = 'UPDATE users SET plan_type = ?, customer_limit = ? WHERE id = ?';
        await db.query(sql, [planType, customerLimit, id]);
    }

    static async getChildren(parentId) {
        const sql = 'SELECT * FROM users WHERE parent_id = ? AND is_active = TRUE';
        return await db.query(sql, [parentId]);
    }

    static async countByParentId(parentId) {
        const sql = 'SELECT COUNT(*) as count FROM users WHERE parent_id = ? AND is_active = TRUE';
        const results = await db.query(sql, [parentId]);
        return results[0].count;
    }

    static async deactivate(id) {
        const sql = 'UPDATE users SET is_active = FALSE WHERE id = ?';
        await db.query(sql, [id]);
    }

    static async checkPassword(inputPassword, hashedPassword) {
        return await bcrypt.compare(inputPassword, hashedPassword);
    }

    static async changePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
        await db.query(sql, [passwordHash, id]);
    }

    static async getPlanFeatures(planType) {
        const sql = 'SELECT * FROM plan_features WHERE plan_type = ?';
        return await db.query(sql, [planType]);
    }

    static async findByLineId(lineUserId) {
        const sql = 'SELECT * FROM users WHERE line_user_id = ? AND is_active = TRUE';
        const results = await db.query(sql, [lineUserId]);
        return results[0] || null;
    }

    static async updateLineId(id, lineUserId) {
        const sql = 'UPDATE users SET line_user_id = ? WHERE id = ?';
        await db.query(sql, [lineUserId, id]);
    }

    static async getAll(filters = {}) {
        let sql = 'SELECT id, user_id, account_type, plan_type, parent_id, customer_limit, is_active, last_login, created_at FROM users WHERE 1=1';
        const params = [];

        if (filters.accountType) {
            sql += ' AND account_type = ?';
            params.push(filters.accountType);
        }

        if (filters.parentId) {
            sql += ' AND parent_id = ?';
            params.push(filters.parentId);
        }

        if (filters.isActive !== undefined) {
            sql += ' AND is_active = ?';
            params.push(filters.isActive);
        }

        sql += ' ORDER BY created_at DESC';

        return await db.query(sql, params);
    }
}

module.exports = User;