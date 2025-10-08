const bcrypt = require('bcryptjs');

class DatabaseMemory {
    constructor() {
        this.tables = {
            users: [],
            customers: [],
            analysis_results: [],
            market_data: [],
            user_sessions: [],
            audit_logs: []
        };
        this.nextId = {
            users: 1,
            customers: 1,
            analysis_results: 1,
            market_data: 1,
            user_sessions: 1,
            audit_logs: 1
        };
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.insertInitialData();
            this.initialized = true;
            console.log('Memory database initialized with sample data');
        }
        return Promise.resolve();
    }

    async insertInitialData() {
        // Create password hash for 'password123'
        const passwordHash = await bcrypt.hash('password123', 10);
        
        this.tables.users = [
            {
                id: 1,
                user_id: 'admin',
                password_hash: passwordHash,
                account_type: 'admin',
                plan_type: 'exceed',
                customer_limit: 999,
                parent_id: null,
                is_active: 1,
                last_login: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                user_id: 'demo001',
                password_hash: passwordHash,
                account_type: 'parent',
                plan_type: 'master',
                customer_limit: 50,
                parent_id: null,
                is_active: 1,
                last_login: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                user_id: 'agent001',
                password_hash: passwordHash,
                account_type: 'child',
                plan_type: 'standard',
                customer_limit: 10,
                parent_id: 2,
                is_active: 1,
                last_login: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        
        this.nextId.users = 4;

        this.tables.customers = [
            {
                id: 1,
                user_id: 1,
                name: '田中太郎',
                email: 'tanaka@example.com',
                phone: '03-1234-5678',
                contract_date: '2024-01-15',
                contract_amount: 1000000,
                monthly_premium: 50000,
                risk_tolerance: 'balanced',
                investment_goal: '老後資金の準備',
                notes: 'サンプル顧客データ',
                is_active: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        
        this.nextId.customers = 2;
    }

    async query(sql, params = []) {
        try {
            console.log('Executing query:', sql, 'with params:', params);
            
            // Parse basic SQL queries for in-memory operations
            const sqlLower = sql.toLowerCase().trim();
            
            if (sqlLower.startsWith('select')) {
                const result = this.handleSelect(sql, params);
                console.log('Query result:', result);
                return result;
            } else if (sqlLower.startsWith('insert')) {
                return this.handleInsert(sql, params);
            } else if (sqlLower.startsWith('update')) {
                return this.handleUpdate(sql, params);
            } else if (sqlLower.startsWith('delete')) {
                return this.handleDelete(sql, params);
            }
            
            throw new Error(`Unsupported SQL operation: ${sql}`);
        } catch (error) {
            console.error('Database query error:', error, 'SQL:', sql, 'Params:', params);
            throw error;
        }
    }

    handleSelect(sql, params) {
        const sqlLower = sql.toLowerCase();
        
        // Extract table name
        const fromMatch = sqlLower.match(/from\s+(\w+)/);
        if (!fromMatch) {
            console.error('Invalid SELECT query:', sql);
            return [];
        }
        
        const tableName = fromMatch[1];
        let results = [...(this.tables[tableName] || [])];
        
        // Handle WHERE clauses
        if (sqlLower.includes('where')) {
            try {
                results = this.applyWhereClause(results, sql, params);
            } catch (error) {
                console.error('Error in WHERE clause:', error, sql, params);
                return [];
            }
        }
        
        // Handle LIMIT
        const limitMatch = sqlLower.match(/limit\s+(\d+)/);
        if (limitMatch) {
            results = results.slice(0, parseInt(limitMatch[1]));
        }
        
        // Handle ORDER BY
        if (sqlLower.includes('order by')) {
            const orderMatch = sqlLower.match(/order by\s+(\w+)(?:\s+(asc|desc))?/);
            if (orderMatch) {
                const field = orderMatch[1];
                const direction = orderMatch[2] || 'asc';
                results.sort((a, b) => {
                    if (direction === 'desc') {
                        return b[field] > a[field] ? 1 : -1;
                    }
                    return a[field] > b[field] ? 1 : -1;
                });
            }
        }
        
        return results;
    }

    handleInsert(sql, params) {
        const sqlLower = sql.toLowerCase();
        const tableMatch = sqlLower.match(/insert\s+(?:or\s+ignore\s+)?into\s+(\w+)/);
        if (!tableMatch) throw new Error('Invalid INSERT query');
        
        const tableName = tableMatch[1];
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table ${tableName} not found`);
        
        // Extract column names
        const columnsMatch = sql.match(/\(([^)]+)\)\s*values/i);
        if (!columnsMatch) throw new Error('Invalid INSERT format');
        
        const columns = columnsMatch[1].split(',').map(col => col.trim());
        
        // Create new record
        const newRecord = { id: this.nextId[tableName]++ };
        columns.forEach((col, index) => {
            newRecord[col] = params[index];
        });
        
        // Add timestamps if not provided
        if (!newRecord.created_at) {
            newRecord.created_at = new Date().toISOString();
        }
        if (!newRecord.updated_at) {
            newRecord.updated_at = new Date().toISOString();
        }
        
        table.push(newRecord);
        
        return { insertId: newRecord.id, lastID: newRecord.id, affectedRows: 1 };
    }

    handleUpdate(sql, params) {
        const sqlLower = sql.toLowerCase();
        const tableMatch = sqlLower.match(/update\s+(\w+)\s+set/);
        if (!tableMatch) throw new Error('Invalid UPDATE query');
        
        const tableName = tableMatch[1];
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table ${tableName} not found`);
        
        let affectedRows = 0;
        
        // Simple WHERE id = ? handling
        if (sqlLower.includes('where id = ?')) {
            const id = params[params.length - 1];
            const record = table.find(r => r.id == id);
            if (record) {
                // Update the record (simplified - assumes SET field = ? format)
                if (sqlLower.includes('last_login')) {
                    record.last_login = new Date().toISOString();
                }
                if (sqlLower.includes('password_hash')) {
                    record.password_hash = params[0];
                }
                record.updated_at = new Date().toISOString();
                affectedRows = 1;
            }
        }
        
        return { affectedRows };
    }

    handleDelete(sql, params) {
        // Implement if needed
        return { affectedRows: 0 };
    }

    applyWhereClause(results, sql, params) {
        const sqlLower = sql.toLowerCase();
        let paramIndex = 0;
        
        // Handle WHERE id = ?
        if (sqlLower.includes('where id = ?')) {
            const id = params[paramIndex++];
            results = results.filter(r => r.id == id);
        }
        
        // Handle WHERE user_id = ? AND account_type = ?
        if (sqlLower.includes('user_id = ?') && sqlLower.includes('account_type = ?')) {
            const userId = params[paramIndex++];
            const accountType = params[paramIndex++];
            results = results.filter(r => r.user_id === userId && r.account_type === accountType);
        }
        
        // Handle WHERE user_id = ?
        else if (sqlLower.includes('user_id = ?')) {
            const userId = params[paramIndex++];
            results = results.filter(r => r.user_id === userId);
        }
        
        // Handle WHERE account_type = ?
        else if (sqlLower.includes('account_type = ?')) {
            const accountType = params[paramIndex++];
            results = results.filter(r => r.account_type === accountType);
        }
        
        // Handle WHERE is_active = 1 or is_active = TRUE
        if (sqlLower.includes('is_active = 1') || sqlLower.includes('is_active = true')) {
            results = results.filter(r => r.is_active === 1 || r.is_active === true);
        }
        
        return results;
    }

    async close() {
        // No-op for memory database
        return Promise.resolve();
    }
}

module.exports = new DatabaseMemory();