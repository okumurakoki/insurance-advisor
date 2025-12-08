const db = require('../utils/database-factory');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { userId, name, email, password, accountType, planType, parentId, customerLimit } = userData;

        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        // No mapping needed anymore - using accountType directly

        const sql = `
            INSERT INTO users (user_id, name, email, password_hash, account_type, plan_type, customer_limit, parent_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;

        const result = await db.query(sql, [
            userId,
            name || null,
            email || null,
            passwordHash,
            accountType, // Use original accountType, not mapped
            planType || 'standard',
            customerLimit || 10,
            parentId,
            true
        ]);

        return result[0]?.id;
    }

    static async findById(id) {
        const sql = 'SELECT id, user_id, password_hash, account_type, plan_type, customer_limit, parent_id, created_at, is_active FROM users WHERE id = $1 AND is_active = true';
        const results = await db.query(sql, [id]);
        return results[0] || null;
    }

    static async findByUserId(userId, accountType) {
        const sql = 'SELECT id, user_id, password_hash, account_type, plan_type, customer_limit, parent_id, created_at, is_active FROM users WHERE user_id = $1 AND account_type = $2';
        const results = await db.query(sql, [userId, accountType]);
        return results[0] || null;
    }

    static async updateLastLogin(id) {
        const sql = 'UPDATE users SET last_login = $1 WHERE id = $2';
        await db.query(sql, [new Date().toISOString(), id]);
    }

    static async updatePlan(id, planType, customerLimit) {
        const sql = 'UPDATE users SET plan_type = $1, customer_limit = $2, updated_at = $3 WHERE id = $4';
        await db.query(sql, [planType, customerLimit, new Date().toISOString(), id]);
    }

    static async getChildren(parentId) {
        const sql = 'SELECT id, user_id, name, email, account_type, plan_type, customer_limit, created_at, is_active FROM users WHERE parent_id = $1 AND is_active = true ORDER BY created_at DESC';
        return await db.query(sql, [parentId]);
    }

    static async countByParentId(parentId) {
        const sql = 'SELECT COUNT(*) as count FROM users WHERE parent_id = $1 AND is_active = true';
        const result = await db.query(sql, [parentId]);
        return result[0]?.count || 0;
    }

    static async deactivate(id) {
        const sql = 'UPDATE users SET is_active = $1, updated_at = $2 WHERE id = $3';
        await db.query(sql, [false, new Date().toISOString(), id]);
    }

    static async checkPassword(inputPassword, hashedPassword) {
        return await bcrypt.compare(inputPassword, hashedPassword);
    }

    static async changePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const sql = 'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3';
        await db.query(sql, [passwordHash, new Date().toISOString(), id]);
    }

    static async getPlanFeatures(planType) {
        const sql = 'SELECT feature_name, feature_value, description FROM plan_features WHERE plan_type = $1';
        const features = await db.query(sql, [planType]);
        return features;
    }

    static async findByLineId(lineUserId) {
        // TODO: Add line_user_id column to users table if LINE integration is needed
        return null;
    }

    static async updateLineId(id, lineUserId) {
        // TODO: Add line_user_id column to users table if LINE integration is needed
        return Promise.resolve();
    }

    static async getAll(filters = {}) {
        let sql = 'SELECT id, user_id, account_type, plan_type, customer_limit, parent_id, created_at, updated_at as last_login, COALESCE(is_active, true) as is_active FROM users WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (filters.accountType) {
            paramCount++;
            sql += ` AND account_type = $${paramCount}`;
            params.push(filters.accountType);
        }

        if (filters.isActive !== undefined) {
            paramCount++;
            sql += ` AND is_active = $${paramCount}`;
            params.push(filters.isActive);
        }

        sql += ' ORDER BY created_at DESC';

        return await db.query(sql, params);
    }

    static async findAll() {
        const sql = `
            SELECT id, user_id as userId, account_type as accountType, plan_type as planType,
                   customer_limit as customerLimit, parent_id as parentId,
                   created_at as createdAt, updated_at as lastLogin, is_active as isActive
            FROM users 
            ORDER BY created_at DESC
        `;
        return await db.query(sql);
    }

    static async update(id, userData) {
        const { name, email, accountType, planType, customerLimit, isActive } = userData;
        
        // Build dynamic update query based on provided fields
        const updateFields = [];
        const values = [];
        let paramCount = 0;
        
        if (accountType !== undefined) {
            paramCount++;
            updateFields.push(`account_type = $${paramCount}`);
            values.push(accountType);
        }
        
        if (planType !== undefined) {
            paramCount++;
            updateFields.push(`plan_type = $${paramCount}`);
            values.push(planType);
        }
        
        if (customerLimit !== undefined) {
            paramCount++;
            updateFields.push(`customer_limit = $${paramCount}`);
            values.push(customerLimit);
        }
        
        if (isActive !== undefined) {
            paramCount++;
            updateFields.push(`is_active = $${paramCount}`);
            values.push(isActive);
        }
        
        paramCount++;
        updateFields.push(`updated_at = $${paramCount}`);
        values.push(new Date().toISOString());

        paramCount++;
        values.push(id);

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
        
        await db.query(sql, values);
    }

    static async createWithDetails(userData) {
        const { userId, name, email, password, accountType, planType, customerLimit, parentId, customerId } = userData;
        
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const sql = `
            INSERT INTO users (user_id, password_hash, account_type, plan_type, customer_limit, parent_id, customer_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;
        
        const result = await db.query(sql, [
            userId,
            passwordHash,
            accountType,
            planType || 'standard',
            customerLimit || 10,
            parentId,
            customerId,
            true
        ]);
        return result[0].id;
    }
}

module.exports = User;