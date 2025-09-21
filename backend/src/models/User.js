const db = require('../utils/database-factory');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { userId, password, accountType, planType, parentId, customerLimit } = userData;
        
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const sql = `
            INSERT INTO users (user_id, password_hash, account_type, plan_type, parent_id, customer_limit)
            VALUES ($1, $2, $3, $4, $5, $6)
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
        const sql = 'SELECT id, username as user_id, password_hash, user_type as account_type, name, email, created_at FROM prudential_users WHERE id = $1 AND is_active = TRUE';
        const results = await db.query(sql, [id]);
        return results[0] || null;
    }

    static async findByUserId(userId, accountType) {
        // Map frontend account types to database user types
        const typeMapping = {
            'parent': 'agency',
            'child': 'staff', 
            'grandchild': 'admin'
        };
        
        const dbUserType = typeMapping[accountType] || accountType;
        
        const sql = 'SELECT id, username as user_id, password_hash, user_type as account_type, name, email, created_at FROM prudential_users WHERE username = $1 AND user_type = $2';
        const results = await db.query(sql, [userId, dbUserType]);
        return results[0] || null;
    }

    static async updateLastLogin(id) {
        const sql = 'UPDATE prudential_users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
        await db.query(sql, [id]);
    }

    static async updatePlan(id, planType, customerLimit) {
        const sql = 'UPDATE users SET plan_type = $1, customer_limit = $2 WHERE id = $3';
        await db.query(sql, [planType, customerLimit, id]);
    }

    static async getChildren(parentId) {
        const sql = 'SELECT * FROM users WHERE parent_id = $1 AND is_active = TRUE';
        return await db.query(sql, [parentId]);
    }

    static async countByParentId(parentId) {
        const sql = 'SELECT COUNT(*) as count FROM users WHERE parent_id = $1 AND is_active = TRUE';
        const results = await db.query(sql, [parentId]);
        return results[0].count;
    }

    static async deactivate(id) {
        const sql = 'UPDATE users SET is_active = FALSE WHERE id = $1';
        await db.query(sql, [id]);
    }

    static async checkPassword(inputPassword, hashedPassword) {
        console.log('Checking password with bcrypt:', { inputPassword, hashedPassword: hashedPassword ? hashedPassword.substring(0, 20) + '...' : 'null' });
        const result = await bcrypt.compare(inputPassword, hashedPassword);
        console.log('Bcrypt compare result:', result);
        return result;
    }

    static async changePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const sql = 'UPDATE users SET password_hash = $1 WHERE id = $2';
        await db.query(sql, [passwordHash, id]);
    }

    static async getPlanFeatures(planType) {
        const sql = 'SELECT * FROM plan_features WHERE plan_type = $1';
        return await db.query(sql, [planType]);
    }

    static async findByLineId(lineUserId) {
        const sql = 'SELECT * FROM users WHERE line_user_id = $1 AND is_active = TRUE';
        const results = await db.query(sql, [lineUserId]);
        return results[0] || null;
    }

    static async updateLineId(id, lineUserId) {
        const sql = 'UPDATE users SET line_user_id = $1 WHERE id = $2';
        await db.query(sql, [lineUserId, id]);
    }

    static async getAll(filters = {}) {
        let sql = 'SELECT id, user_id, account_type, plan_type, parent_id, customer_limit, is_active, last_login, created_at FROM users WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (filters.accountType) {
            paramCount++;
            sql += ` AND account_type = $${paramCount}`;
            params.push(filters.accountType);
        }

        if (filters.parentId) {
            paramCount++;
            sql += ` AND parent_id = $${paramCount}`;
            params.push(filters.parentId);
        }

        if (filters.isActive !== undefined) {
            paramCount++;
            sql += ` AND is_active = $${paramCount}`;
            params.push(filters.isActive);
        }

        sql += ' ORDER BY created_at DESC';

        return await db.query(sql, params);
    }
}

module.exports = User;