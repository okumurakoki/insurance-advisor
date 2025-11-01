const bcrypt = require('bcryptjs');

// Fixed data store for immediate deployment
const store = {
    users: [
        {
            id: 1,
            user_id: 'admin',
            password_hash: '$2a$10$VhaxtrSyP0OFubuRg75O/e9yaSRmO7PMoD2Yk.7vzB5UjAeSUVUAW', // password123
            account_type: 'admin',
            plan_type: 'exceed',
            customer_limit: 999,
            parent_id: null,
            is_active: 1,
            last_login: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 2,
            user_id: 'demo001',
            password_hash: '$2a$10$VhaxtrSyP0OFubuRg75O/e9yaSRmO7PMoD2Yk.7vzB5UjAeSUVUAW', // password123
            account_type: 'parent',
            plan_type: 'master',
            customer_limit: 50,
            parent_id: null,
            is_active: 1,
            last_login: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 3,
            user_id: 'agent001',
            password_hash: '$2a$10$VhaxtrSyP0OFubuRg75O/e9yaSRmO7PMoD2Yk.7vzB5UjAeSUVUAW', // password123
            account_type: 'child',
            plan_type: 'standard',
            customer_limit: 10,
            parent_id: 2,
            is_active: 1,
            last_login: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        }
    ],
    insurance_companies: [
        {
            id: 1,
            company_code: 'PRUDENTIAL_LIFE',
            company_name: 'プルデンシャル生命保険株式会社',
            display_name: 'プルデンシャル生命',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 2,
            company_code: 'SONY_LIFE',
            company_name: 'ソニー生命保険株式会社（バリアブル・ライフ）',
            display_name: 'ソニー生命（バリアブル・ライフ）',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 3,
            company_code: 'SONY_LIFE_SOVANI',
            company_name: 'ソニー生命保険株式会社（SOVANI）',
            display_name: 'ソニー生命（SOVANI）',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 4,
            company_code: 'AXA_LIFE',
            company_name: 'アクサ生命保険株式会社',
            display_name: 'アクサ生命',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        }
    ],
    nextId: 4,
    nextCompanyId: 5
};

class SimpleDatabase {
    async initialize() {
        console.log('Simple database initialized');
        return Promise.resolve();
    }

    async query(sql, params = []) {
        console.log('Simple DB Query:', sql, params);
        
        const sqlLower = sql.toLowerCase().trim();
        
        // Handle SELECT queries
        if (sqlLower.startsWith('select')) {
            return this.handleSelect(sql, params);
        }
        
        // Handle INSERT queries
        if (sqlLower.startsWith('insert')) {
            return this.handleInsert(sql, params);
        }
        
        // Handle UPDATE queries
        if (sqlLower.startsWith('update')) {
            return this.handleUpdate(sql, params);
        }
        
        return [];
    }

    handleSelect(sql, params) {
        const sqlLower = sql.toLowerCase();

        // Convert PostgreSQL-style params ($1, $2) to array indexes
        let paramIndex = 0;
        const getParam = () => {
            if (paramIndex < params.length) {
                return params[paramIndex++];
            }
            return null;
        };

        // Handle insurance_companies table
        if (sqlLower.includes('from insurance_companies')) {
            let results = [...store.insurance_companies];

            // WHERE handling for insurance_companies
            if (sqlLower.includes('where is_active = true')) {
                results = results.filter(company => company.is_active === true);
            } else if (sqlLower.includes('where id = ')) {
                const id = parseInt(getParam());
                results = results.filter(company => company.id === id);
            } else if (sqlLower.includes('where company_code = ')) {
                const companyCode = getParam();
                results = results.filter(company => company.company_code === companyCode);
            }

            // ORDER BY handling
            if (sqlLower.includes('order by id')) {
                results.sort((a, b) => a.id - b.id);
            }

            return results;
        }

        // Simple table detection
        if (sqlLower.includes('from users')) {
            let results = [...store.users];

            // Basic WHERE handling - support both ? and $1 style params
            if (sqlLower.includes('where id = ?') || sqlLower.includes('where id = $')) {
                const id = parseInt(getParam());
                results = results.filter(user => user.id === id);
            } else if (sqlLower.includes('where user_id = ') && sqlLower.includes('and account_type = ')) {
                const userId = getParam();
                const accountType = getParam();
                results = results.filter(user => user.user_id === userId && user.account_type === accountType);
            } else if (sqlLower.includes('where parent_id = ')) {
                const parentId = parseInt(getParam());
                results = results.filter(user => user.parent_id === parentId);
            }

            // Handle SELECT with aliases (e.g., "as userId")
            if (sqlLower.includes(' as ')) {
                results = results.map(user => ({
                    ...user,
                    userId: user.user_id,
                    accountType: user.account_type,
                    planType: user.plan_type,
                    customerLimit: user.customer_limit,
                    parentId: user.parent_id,
                    createdAt: user.created_at,
                    lastLogin: user.updated_at,
                    isActive: user.is_active
                }));
            }

            // Handle COALESCE for is_active
            if (sqlLower.includes('coalesce(is_active')) {
                results = results.map(user => ({
                    ...user,
                    is_active: user.is_active ?? 1
                }));
            }

            // Basic ORDER BY handling
            if (sqlLower.includes('order by created_at desc')) {
                results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            // Basic LIMIT handling
            if (sqlLower.includes('limit')) {
                const limitMatch = sqlLower.match(/limit\s+(\d+)/);
                if (limitMatch) {
                    results = results.slice(0, parseInt(limitMatch[1]));
                }
            }

            return results;
        }

        return [];
    }

    handleInsert(sql, params) {
        const sqlLower = sql.toLowerCase();

        if (sqlLower.includes('insert into insurance_companies')) {
            const newCompany = {
                id: store.nextCompanyId++,
                company_code: params[0],
                company_name: params[1],
                display_name: params[2],
                created_at: new Date().toISOString()
            };

            store.insurance_companies.push(newCompany);

            // Return format that matches what the code expects
            return [{ id: newCompany.id }];
        }

        if (sqlLower.includes('insert into users')) {
            // Parse field order from SQL
            let fieldOrder = [];
            if (sqlLower.includes('(user_id, password_hash, account_type')) {
                // Determine field order based on SQL
                if (sqlLower.includes('customer_id')) {
                    // With customer_id (createWithDetails)
                    fieldOrder = ['user_id', 'password_hash', 'account_type', 'plan_type', 'customer_limit', 'parent_id', 'customer_id', 'is_active'];
                } else {
                    // Without customer_id (create)
                    fieldOrder = ['user_id', 'password_hash', 'account_type', 'plan_type', 'customer_limit', 'parent_id', 'is_active'];
                }
            }

            // Create new user
            const newUser = {
                id: store.nextId++,
                user_id: params[0],
                password_hash: params[1],
                account_type: params[2],
                plan_type: params[3] || 'standard',
                customer_limit: params[4] || 10,
                parent_id: params[5] || null,
                customer_id: params[6] || null,
                is_active: params[fieldOrder.length - 1] !== undefined ? params[fieldOrder.length - 1] : 1,
                name: '',
                email: '',
                last_login: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            store.users.push(newUser);

            // Return format that matches what the code expects
            return [{ id: newUser.id }];
        }

        return { insertId: null, affectedRows: 0 };
    }

    handleUpdate(sql, params) {
        const sqlLower = sql.toLowerCase();

        if (sqlLower.includes('update users')) {
            // Find the ID parameter (usually last one)
            const id = parseInt(params[params.length - 1]);
            const user = store.users.find(u => u.id === id);

            if (user) {
                // Parse SET clause to determine what to update
                if (sqlLower.includes('set last_login')) {
                    user.last_login = params[0]; // Use timestamp from params
                }
                if (sqlLower.includes('set password_hash')) {
                    user.password_hash = params[0];
                    if (sqlLower.includes('updated_at')) {
                        user.updated_at = params[1]; // Use timestamp from params
                    }
                }
                if (sqlLower.includes('set plan_type')) {
                    user.plan_type = params[0];
                    if (sqlLower.includes('customer_limit')) {
                        user.customer_limit = params[1];
                        if (sqlLower.includes('updated_at')) {
                            user.updated_at = params[2]; // Use timestamp from params
                        }
                    }
                }
                if (sqlLower.includes('set is_active') && !sqlLower.includes('account_type')) {
                    user.is_active = params[0] === false ? 0 : 1;
                    if (sqlLower.includes('updated_at')) {
                        user.updated_at = params[1]; // Use timestamp from params
                    }
                }

                // Parse dynamic updates (for admin update)
                if (sqlLower.includes('account_type = ')) {
                    let paramIdx = 0;
                    if (sqlLower.includes('account_type = $')) {
                        user.account_type = params[paramIdx++];
                    }
                    if (sqlLower.includes('plan_type = $')) {
                        user.plan_type = params[paramIdx++];
                    }
                    if (sqlLower.includes('customer_limit = $')) {
                        user.customer_limit = params[paramIdx++];
                    }
                    if (sqlLower.includes('is_active = $')) {
                        user.is_active = params[paramIdx++];
                    }
                    if (sqlLower.includes('updated_at = $')) {
                        user.updated_at = params[paramIdx++]; // Use timestamp from params
                    }
                } else if (!sqlLower.includes('last_login') && !sqlLower.includes('password_hash') && !sqlLower.includes('plan_type') && !sqlLower.includes('is_active')) {
                    user.updated_at = new Date().toISOString();
                }

                return { affectedRows: 1 };
            }
        }

        return { affectedRows: 0 };
    }

    async close() {
        console.log('Simple database connection closed');
        return Promise.resolve();
    }
}

module.exports = new SimpleDatabase();