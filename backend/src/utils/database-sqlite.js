const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseSQLite {
    constructor() {
        this.db = null;
    }

    async initialize() {
        if (!this.db) {
            return new Promise((resolve, reject) => {
                // Use in-memory database for Vercel deployment
                this.db = new sqlite3.Database(':memory:', (err) => {
                    if (err) {
                        console.error('Database connection failed:', err);
                        reject(err);
                    } else {
                        console.log('SQLite in-memory database connection established');
                        this.setupTables().then(resolve).catch(reject);
                    }
                });
            });
        }
        return Promise.resolve(this.db);
    }

    async setupTables() {
        const schema = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            account_type TEXT CHECK(account_type IN ('admin', 'parent', 'child', 'grandchild')) NOT NULL,
            plan_type TEXT CHECK(plan_type IN ('standard', 'master', 'exceed')) DEFAULT 'standard',
            parent_id INTEGER,
            customer_limit INTEGER DEFAULT 10,
            is_active BOOLEAN DEFAULT 1,
            last_login TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (parent_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            contract_date TEXT NOT NULL,
            contract_amount REAL NOT NULL,
            monthly_premium REAL NOT NULL,
            risk_tolerance TEXT CHECK(risk_tolerance IN ('conservative', 'balanced', 'aggressive')) DEFAULT 'balanced',
            investment_goal TEXT,
            notes TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            analysis_date TEXT NOT NULL,
            market_data_source TEXT,
            base_allocation TEXT NOT NULL,
            adjusted_allocation TEXT NOT NULL,
            adjustment_factors TEXT NOT NULL,
            recommendation_text TEXT,
            confidence_score REAL,
            created_by INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS market_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_date TEXT NOT NULL,
            data_type TEXT NOT NULL,
            source_file TEXT,
            data_content TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            uploaded_by INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            ip_address TEXT,
            user_agent TEXT,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        `;

        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.insertInitialData().then(resolve).catch(reject);
                }
            });
        });
    }

    async insertInitialData() {
        const users = `
        INSERT OR IGNORE INTO users (user_id, password_hash, account_type, plan_type, customer_limit) VALUES
        ('admin', '$2a$10$VhaxtrSyP0OFubuRg75O/e9yaSRmO7PMoD2Yk.7vzB5UjAeSUVUAW', 'admin', 'exceed', 999),
        ('demo001', '$2a$10$VhaxtrSyP0OFubuRg75O/e9yaSRmO7PMoD2Yk.7vzB5UjAeSUVUAW', 'parent', 'master', 50),
        ('agent001', '$2a$10$VhaxtrSyP0OFubuRg75O/e9yaSRmO7PMoD2Yk.7vzB5UjAeSUVUAW', 'child', 'standard', 10);
        `;

        const customers = `
        INSERT OR IGNORE INTO customers (user_id, name, email, phone, contract_date, contract_amount, monthly_premium, risk_tolerance, investment_goal, notes) VALUES
        (1, '田中太郎', 'tanaka@example.com', '03-1234-5678', '2024-01-15', 1000000, 50000, 'balanced', '老後資金の準備', 'サンプル顧客データ'),
        (1, '佐藤花子', 'sato@example.com', '090-1234-5678', '2024-02-20', 2000000, 80000, 'aggressive', '資産増大', '積極運用希望'),
        (1, '鈴木一郎', 'suzuki@example.com', '080-9876-5432', '2023-12-10', 500000, 25000, 'conservative', '安全運用', '保守的運用'),
        (2, '山田三郎', 'yamada@example.com', '070-5555-1234', '2024-03-01', 1500000, 60000, 'balanced', '教育資金', 'demo001ユーザーの顧客');
        `;

        const marketData = `
        INSERT OR IGNORE INTO market_data (data_date, data_type, source_file, data_content, uploaded_by) VALUES
        ('2024-01-01', 'monthly_report', 'sample_market_data.pdf', '{"market_trend": "positive", "volatility": "moderate"}', 1);
        `;

        return new Promise((resolve, reject) => {
            this.db.exec(users + customers + marketData, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Initial data inserted');
                    resolve();
                }
            });
        });
    }

    async query(sql, params = []) {
        await this.initialize();
        
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ insertId: this.lastID, affectedRows: this.changes });
                    }
                });
            }
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Database connection closed');
                    }
                    resolve();
                });
            });
        }
    }
}

module.exports = new DatabaseSQLite();