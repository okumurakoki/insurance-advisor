const db = require('./database-factory');
const logger = require('./logger');

class AuditLogger {
    static async log(userId, action, entityType, entityId, oldValue = null, newValue = null, ipAddress = null) {
        try {
            const sql = `
                INSERT INTO audit_logs (
                    user_id, action, entity_type, entity_id, 
                    old_value, new_value, ip_address
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await db.query(sql, [
                userId,
                action,
                entityType,
                entityId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                ipAddress
            ]);

            logger.info(`Audit log: User ${userId} performed ${action} on ${entityType} ${entityId}`);
        } catch (error) {
            logger.error('Failed to create audit log:', error);
            // Don't throw - audit logging should not break the main flow
        }
    }

    static async logLogin(userId, ipAddress, userAgent, success = true) {
        await this.log(
            userId,
            success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            'user',
            userId,
            null,
            { userAgent },
            ipAddress
        );
    }

    static async logCustomerCreation(userId, customerId, customerData, ipAddress) {
        await this.log(
            userId,
            'CUSTOMER_CREATE',
            'customer',
            customerId,
            null,
            customerData,
            ipAddress
        );
    }

    static async logCustomerUpdate(userId, customerId, oldData, newData, ipAddress) {
        await this.log(
            userId,
            'CUSTOMER_UPDATE',
            'customer',
            customerId,
            oldData,
            newData,
            ipAddress
        );
    }

    static async logAnalysisGeneration(userId, analysisId, customerId, ipAddress) {
        await this.log(
            userId,
            'ANALYSIS_GENERATE',
            'analysis',
            analysisId,
            null,
            { customerId },
            ipAddress
        );
    }

    static async logPlanChange(userId, oldPlan, newPlan, ipAddress) {
        await this.log(
            userId,
            'PLAN_CHANGE',
            'user',
            userId,
            { plan: oldPlan },
            { plan: newPlan },
            ipAddress
        );
    }

    static async getAuditLogs(filters = {}) {
        let sql = `
            SELECT 
                al.*,
                u.user_id as user_name
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            sql += ' AND al.user_id = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            sql += ' AND al.action = ?';
            params.push(filters.action);
        }

        if (filters.entityType) {
            sql += ' AND al.entity_type = ?';
            params.push(filters.entityType);
        }

        if (filters.startDate) {
            sql += ' AND al.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND al.created_at <= ?';
            params.push(filters.endDate);
        }

        sql += ' ORDER BY al.created_at DESC LIMIT 1000';

        const results = await db.query(sql, params);
        
        return results.map(log => ({
            ...log,
            old_value: log.old_value ? JSON.parse(log.old_value) : null,
            new_value: log.new_value ? JSON.parse(log.new_value) : null
        }));
    }
}

module.exports = AuditLogger;