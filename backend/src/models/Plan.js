const db = require('../utils/database-factory');

class Plan {
    /**
     * プラン定義を取得
     * @param {string} planType
     * @returns {Promise<Object>}
     */
    static async getDefinition(planType) {
        const sql = `
            SELECT plan_type, plan_name, monthly_price, staff_limit,
                   customer_limit, customer_limit_per_staff, description, is_active
            FROM plan_definitions
            WHERE plan_type = $1 AND is_active = true
        `;
        const results = await db.query(sql, [planType]);
        return results[0] || null;
    }

    /**
     * 全プラン定義を取得
     * @returns {Promise<Array>}
     */
    static async getAllDefinitions() {
        const sql = `
            SELECT plan_type, plan_name, monthly_price, staff_limit,
                   customer_limit, customer_limit_per_staff, description, is_active
            FROM plan_definitions
            WHERE is_active = true
            ORDER BY monthly_price ASC
        `;
        return await db.query(sql);
    }

    /**
     * プラン制限をチェック
     * @param {number} userId - 代理店のユーザーID
     * @param {string} checkType - 'staff' or 'customer'
     * @param {number} staffId - 担当者ID（顧客チェック時のみ）
     * @returns {Promise<{allowed: boolean, current: number, limit: number, message: string}>}
     */
    static async checkLimit(userId, checkType, staffId = null) {
        // ユーザーのプラン情報を取得
        const userSql = `
            SELECT u.id, u.plan_type, u.staff_limit, u.customer_limit, u.customer_limit_per_staff,
                   pd.plan_name, pd.customer_limit as plan_customer_limit,
                   pd.customer_limit_per_staff as plan_customer_limit_per_staff
            FROM users u
            LEFT JOIN plan_definitions pd ON u.plan_type::text = pd.plan_type
            WHERE u.id = $1 AND u.is_active = true
        `;
        const userResults = await db.query(userSql, [userId]);
        const user = userResults[0];

        if (!user) {
            return {
                allowed: false,
                current: 0,
                limit: 0,
                message: 'ユーザーが見つかりません'
            };
        }

        if (checkType === 'staff') {
            // 担当者数制限チェック
            const countSql = `
                SELECT COUNT(*) as count
                FROM users
                WHERE parent_id = $1 AND account_type = 'child' AND is_active = true
            `;
            const countResults = await db.query(countSql, [userId]);
            const currentStaffCount = parseInt(countResults[0].count);
            const staffLimit = user.staff_limit;

            return {
                allowed: currentStaffCount < staffLimit,
                current: currentStaffCount,
                limit: staffLimit,
                message: currentStaffCount < staffLimit
                    ? `担当者追加可能（${currentStaffCount}/${staffLimit}）`
                    : `担当者数が上限に達しています（${staffLimit}人まで）`
            };
        } else if (checkType === 'customer') {
            // 顧客数制限チェック
            if (user.customer_limit) {
                // 代理店全体の顧客数制限（bronze, silver）
                const countSql = `
                    SELECT COUNT(*) as count
                    FROM users staff
                    INNER JOIN users customers ON customers.parent_id = staff.id
                    WHERE staff.parent_id = $1
                      AND staff.account_type = 'child'
                      AND customers.account_type = 'grandchild'
                      AND staff.is_active = true
                      AND customers.is_active = true
                `;
                const countResults = await db.query(countSql, [userId]);
                const currentCustomerCount = parseInt(countResults[0].count);
                const customerLimit = user.customer_limit;

                return {
                    allowed: currentCustomerCount < customerLimit,
                    current: currentCustomerCount,
                    limit: customerLimit,
                    message: currentCustomerCount < customerLimit
                        ? `顧客追加可能（${currentCustomerCount}/${customerLimit}）`
                        : `顧客数が上限に達しています（${customerLimit}人まで）`
                };
            } else if (user.customer_limit_per_staff && staffId) {
                // 担当者ごとの顧客数制限（gold, platinum）
                const countSql = `
                    SELECT COUNT(*) as count
                    FROM users
                    WHERE parent_id = $1 AND account_type = 'grandchild' AND is_active = true
                `;
                const countResults = await db.query(countSql, [staffId]);
                const currentCustomerCount = parseInt(countResults[0].count);
                const customerLimit = user.customer_limit_per_staff;

                return {
                    allowed: currentCustomerCount < customerLimit,
                    current: currentCustomerCount,
                    limit: customerLimit,
                    message: currentCustomerCount < customerLimit
                        ? `顧客追加可能（${currentCustomerCount}/${customerLimit}）`
                        : `この担当者の顧客数が上限に達しています（${customerLimit}人まで）`
                };
            } else {
                return {
                    allowed: false,
                    current: 0,
                    limit: 0,
                    message: 'プラン設定が不正です'
                };
            }
        }

        return {
            allowed: false,
            current: 0,
            limit: 0,
            message: '不明なチェックタイプです'
        };
    }

    /**
     * 代理店のプランを更新
     * @param {number} userId
     * @param {string} planType
     * @returns {Promise<void>}
     */
    static async updateAgencyPlan(userId, planType) {
        const planDef = await this.getDefinition(planType);
        if (!planDef) {
            throw new Error('無効なプランタイプです');
        }

        const sql = `
            UPDATE users
            SET plan_type = $1,
                staff_limit = $2,
                customer_limit = $3,
                customer_limit_per_staff = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND account_type = 'parent'
        `;

        await db.query(sql, [
            planType,
            planDef.staff_limit,
            planDef.customer_limit,
            planDef.customer_limit_per_staff,
            userId
        ]);
    }

    /**
     * 代理店の統計情報を取得
     * @param {number} userId
     * @returns {Promise<Object>}
     */
    static async getAgencyStats(userId) {
        // 担当者数
        const staffCountSql = `
            SELECT COUNT(*) as count
            FROM users
            WHERE parent_id = $1 AND account_type = 'child' AND is_active = true
        `;
        const staffCountResults = await db.query(staffCountSql, [userId]);
        const staffCount = parseInt(staffCountResults[0].count);

        // 顧客数（grandchildアカウント）
        const customerCountSql = `
            SELECT COUNT(*) as count
            FROM users staff
            INNER JOIN users customers ON customers.parent_id = staff.id
            WHERE staff.parent_id = $1
              AND staff.account_type = 'child'
              AND customers.account_type = 'grandchild'
              AND staff.is_active = true
              AND customers.is_active = true
        `;
        const customerCountResults = await db.query(customerCountSql, [userId]);
        const customerCount = parseInt(customerCountResults[0].count);

        // プラン情報（ENUM型をtextにキャスト）
        const planSql = `
            SELECT u.plan_type, u.staff_limit, u.customer_limit, u.customer_limit_per_staff,
                   pd.plan_name, pd.monthly_price
            FROM users u
            LEFT JOIN plan_definitions pd ON u.plan_type::text = pd.plan_type
            WHERE u.id = $1
        `;
        const planResults = await db.query(planSql, [userId]);
        const plan = planResults[0];

        if (!plan) {
            throw new Error(`User not found: ${userId}`);
        }

        return {
            staffCount,
            staffLimit: plan.staff_limit || 0,
            customerCount,
            customerLimit: plan.customer_limit || (plan.customer_limit_per_staff ? plan.customer_limit_per_staff * staffCount : 0),
            planType: plan.plan_type || 'unknown',
            planName: plan.plan_name || plan.plan_type || 'Unknown',
            monthlyPrice: plan.monthly_price || 0
        };
    }
}

module.exports = Plan;
