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
            customer_limit: null,
            customer_limit_per_staff: 999,
            staff_limit: 999,
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
            plan_type: 'gold',
            customer_limit: null,
            customer_limit_per_staff: 15,
            staff_limit: 10,
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
            plan_type: 'gold',
            customer_limit: null,
            customer_limit_per_staff: 15,
            staff_limit: 10,
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
    agency_insurance_companies: [
        // デモデータ: demo001ユーザーはアクサ生命のみ契約
        {
            id: 1,
            user_id: 2,
            company_id: 4, // AXA_LIFE
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        }
    ],
    plan_definitions: [
        {
            plan_type: 'bronze',
            plan_name: 'ブロンズ',
            monthly_price: 980,
            staff_limit: 1,
            customer_limit: 5,
            customer_limit_per_staff: null,
            description: '小規模代理店向け',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            plan_type: 'silver',
            plan_name: 'シルバー',
            monthly_price: 980,
            staff_limit: 3,
            customer_limit: 30,
            customer_limit_per_staff: null,
            description: '中小規模代理店向け',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            plan_type: 'gold',
            plan_name: 'ゴールド',
            monthly_price: 980,
            staff_limit: 10,
            customer_limit: null,
            customer_limit_per_staff: 15,
            description: '中規模代理店向け',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            plan_type: 'platinum',
            plan_name: 'プラチナ',
            monthly_price: 980,
            staff_limit: 30,
            customer_limit: null,
            customer_limit_per_staff: 30,
            description: '大規模代理店向け',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
            plan_type: 'exceed',
            plan_name: 'エクシード',
            monthly_price: 980,
            staff_limit: 999,
            customer_limit: null,
            customer_limit_per_staff: 999,
            description: 'カスタムプラン',
            is_active: true,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        }
    ],
    nextId: 4,
    nextCompanyId: 5,
    nextContractId: 2
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

        // Handle agency_insurance_companies table with JOIN
        if (sqlLower.includes('from agency_insurance_companies')) {
            let results = [...store.agency_insurance_companies];

            // Handle JOIN with insurance_companies
            if (sqlLower.includes('join insurance_companies')) {
                results = results.map(contract => {
                    const company = store.insurance_companies.find(c => c.id === contract.company_id);
                    return {
                        ...contract,
                        company_code: company?.company_code || null,
                        company_name: company?.company_name || null,
                        display_name: company?.display_name || null
                    };
                });
            }

            // WHERE handling for agency_insurance_companies
            if (sqlLower.includes('where user_id = ')) {
                const userId = parseInt(getParam());
                results = results.filter(contract => contract.user_id === userId);

                if (sqlLower.includes('and is_active = true')) {
                    results = results.filter(contract => contract.is_active === true);
                }
            }

            // Support for WHERE user_id = $1 AND company_id = $2
            if (sqlLower.includes('where user_id = $1 and company_id = $2')) {
                const userId = parseInt(params[0]);
                const companyId = parseInt(params[1]);
                results = results.filter(contract =>
                    contract.user_id === userId && contract.company_id === companyId
                );
            }

            // ORDER BY handling
            if (sqlLower.includes('order by created_at') || sqlLower.includes('order by uic.created_at')) {
                results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            }

            return results;
        }

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

        // Handle plan_definitions table
        if (sqlLower.includes('from plan_definitions')) {
            let results = [...store.plan_definitions];

            // WHERE handling for plan_definitions
            if (sqlLower.includes('where is_active = true')) {
                results = results.filter(plan => plan.is_active === true);
            } else if (sqlLower.includes('where plan_type = ')) {
                const planType = getParam();
                results = results.filter(plan => plan.plan_type === planType);
            }

            // ORDER BY handling
            if (sqlLower.includes('order by plan_name')) {
                results.sort((a, b) => a.plan_name.localeCompare(b.plan_name));
            }

            return results;
        }

        // Handle JOIN queries with plan_definitions
        if (sqlLower.includes('from users') && sqlLower.includes('join plan_definitions')) {
            let results = [...store.users];

            // WHERE handling for user ID
            if (sqlLower.includes('where u.id = $')) {
                const id = parseInt(getParam());
                results = results.filter(user => user.id === id);
            }

            // Add plan_definitions data via JOIN
            results = results.map(user => {
                const plan = store.plan_definitions.find(p => p.plan_type === user.plan_type);
                return {
                    plan_type: user.plan_type,
                    staff_limit: user.staff_limit,
                    customer_limit: user.customer_limit,
                    customer_limit_per_staff: user.customer_limit_per_staff,
                    plan_name: plan?.plan_name || null,
                    monthly_price: plan?.monthly_price || null,
                    plan_staff_limit: plan?.staff_limit || null,
                    plan_customer_limit: plan?.customer_limit || null,
                    plan_customer_limit_per_staff: plan?.customer_limit_per_staff || null
                };
            });

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

        if (sqlLower.includes('insert into agency_insurance_companies')) {
            const newContract = {
                id: store.nextContractId++,
                user_id: params[0],
                company_id: params[1],
                is_active: params[2] !== undefined ? params[2] : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            store.agency_insurance_companies.push(newContract);

            // Return format that matches what the code expects
            return [{ id: newContract.id }];
        }

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

        // Handle agency_insurance_companies updates
        if (sqlLower.includes('update agency_insurance_companies')) {
            // Soft delete: SET is_active = false WHERE id = ?
            if (sqlLower.includes('set is_active')) {
                const id = parseInt(params[params.length - 1]);
                const contract = store.agency_insurance_companies.find(c => c.id === id);

                if (contract) {
                    contract.is_active = params[0] === false ? false : true;
                    contract.updated_at = params[1] || new Date().toISOString();
                    return { affectedRows: 1 };
                }
            }
            return { affectedRows: 0 };
        }

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