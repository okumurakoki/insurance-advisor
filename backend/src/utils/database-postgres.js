const { Pool } = require('pg');

class DatabasePostgreSQL {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        if (!this.pool) {
            const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

            if (!connectionString) {
                console.error('DATABASE_URL not found in environment variables');
                throw new Error('DATABASE_URL is required for PostgreSQL connection');
            }

            console.log('Initializing PostgreSQL with connection string:', connectionString.substring(0, 30) + '...');

            this.pool = new Pool({
                connectionString,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 5, // Reduced for Vercel serverless
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 20000, // Increased to 20s for serverless cold starts
                statement_timeout: 30000, // 30s query timeout
            });

            // Test connection
            try {
                const client = await this.pool.connect();
                await client.query('SELECT NOW()');
                client.release();
                console.log('✅ PostgreSQL database connection established successfully');

                // Skip automatic table setup - tables already exist in Supabase
                // await this.setupTables();
            } catch (error) {
                console.error('❌ Database connection failed:', error.message);
                console.error('Connection string (masked):', connectionString.substring(0, 30) + '...');
                // Don't throw error - allow app to start even if DB connection fails initially
                // The connection will be retried on each query
                console.warn('⚠️  App starting without database connection. Queries may fail until connection is established.');
            }
        }
        return this.pool;
    }

    async setupTables() {
        const schema = `
        -- Create users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            account_type VARCHAR(20) CHECK(account_type IN ('parent', 'child', 'grandchild')) NOT NULL,
            plan_type VARCHAR(20) CHECK(plan_type IN ('standard', 'master', 'exceed')) DEFAULT 'standard',
            parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            customer_limit INTEGER DEFAULT 10,
            is_active BOOLEAN DEFAULT TRUE,
            line_user_id VARCHAR(100),
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create customers table
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            contract_date DATE NOT NULL,
            contract_amount DECIMAL(10,2) NOT NULL,
            monthly_premium DECIMAL(10,2) NOT NULL,
            risk_tolerance VARCHAR(20) CHECK(risk_tolerance IN ('conservative', 'balanced', 'aggressive')) DEFAULT 'balanced',
            investment_goal TEXT,
            notes TEXT,
            line_user_id VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create analysis_results table
        CREATE TABLE IF NOT EXISTS analysis_results (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            analysis_date DATE NOT NULL,
            market_data_source VARCHAR(255),
            base_allocation JSONB NOT NULL,
            adjusted_allocation JSONB NOT NULL,
            adjustment_factors JSONB NOT NULL,
            recommendation_text TEXT,
            confidence_score DECIMAL(3,2),
            created_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create market_data table
        CREATE TABLE IF NOT EXISTS market_data (
            id SERIAL PRIMARY KEY,
            data_date DATE NOT NULL,
            data_type VARCHAR(50) NOT NULL,
            source_file VARCHAR(255),
            data_content JSONB NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            uploaded_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(data_date, data_type)
        );
        
        -- Create user_sessions table
        CREATE TABLE IF NOT EXISTS user_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL UNIQUE,
            ip_address INET,
            user_agent TEXT,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create audit_logs table
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INTEGER,
            old_value JSONB,
            new_value JSONB,
            ip_address INET,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create plan_features table
        CREATE TABLE IF NOT EXISTS plan_features (
            id SERIAL PRIMARY KEY,
            plan_type VARCHAR(20) CHECK(plan_type IN ('standard', 'master', 'exceed')) NOT NULL,
            feature_name VARCHAR(100) NOT NULL,
            feature_value VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(plan_type, feature_name)
        );
        
        -- Create line_webhook_logs table
        CREATE TABLE IF NOT EXISTS line_webhook_logs (
            id SERIAL PRIMARY KEY,
            line_user_id VARCHAR(100) NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            event_data JSONB NOT NULL,
            processed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_users_account_plan ON users(account_type, plan_type);
        CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
        CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
        CREATE INDEX IF NOT EXISTS idx_analysis_customer_date ON analysis_results(customer_id, analysis_date DESC);
        CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data(data_date DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_audit_user_date ON audit_logs(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_line_logs_user ON line_webhook_logs(line_user_id);
        `;

        const client = await this.pool.connect();
        try {
            await client.query(schema);
            await this.insertInitialData(client);
            console.log('Database schema created successfully');
        } catch (error) {
            console.error('Error creating schema:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async insertInitialData(client) {
        // Insert plan features
        const planFeatures = `
        INSERT INTO plan_features (plan_type, feature_name, feature_value, description) VALUES
        ('standard', 'customer_limit', '10', 'Maximum number of customers'),
        ('standard', 'analysis_frequency', 'monthly', 'Analysis frequency'),
        ('standard', 'export_formats', 'pdf', 'Available export formats'),
        ('master', 'customer_limit', '50', 'Maximum number of customers'),
        ('master', 'analysis_frequency', 'weekly', 'Analysis frequency'),
        ('master', 'export_formats', 'pdf,excel', 'Available export formats'),
        ('exceed', 'customer_limit', '999', 'Maximum number of customers'),
        ('exceed', 'analysis_frequency', 'daily', 'Analysis frequency'),
        ('exceed', 'export_formats', 'pdf,excel,api', 'Available export formats')
        ON CONFLICT (plan_type, feature_name) DO NOTHING;
        `;

        // Insert demo accounts
        const demoAccounts = `
        INSERT INTO users (user_id, password_hash, account_type, plan_type, customer_limit) VALUES
        ('agency001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'exceed', 999),
        ('agency002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'master', 50),
        ('agent_tanaka', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'child', 'exceed', 999),
        ('agent_sato', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'child', 'exceed', 999),
        ('agent_suzuki', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'child', 'master', 50)
        ON CONFLICT (user_id) DO NOTHING;
        `;

        // Set parent relationships
        const parentRelations = `
        UPDATE users SET parent_id = (SELECT id FROM users WHERE user_id = 'agency001') 
        WHERE user_id IN ('agent_tanaka', 'agent_sato');
        
        UPDATE users SET parent_id = (SELECT id FROM users WHERE user_id = 'agency002') 
        WHERE user_id = 'agent_suzuki';
        `;

        // Insert customer accounts
        const customerAccounts = `
        INSERT INTO users (user_id, password_hash, account_type, plan_type, customer_limit, line_user_id) VALUES
        ('customer_yamada', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'grandchild', 'exceed', 0, 'yamada_line_id_123'),
        ('customer_takahashi', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'grandchild', 'exceed', 0, 'takahashi_line_id_456'),
        ('customer_ito', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'grandchild', 'exceed', 0, 'ito_line_id_789'),
        ('customer_watanabe', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'grandchild', 'master', 0, 'watanabe_line_id_012')
        ON CONFLICT (user_id) DO NOTHING;
        `;

        try {
            await client.query(planFeatures);
            await client.query(demoAccounts);
            await client.query(parentRelations);
            await client.query(customerAccounts);
            
            // Insert demo customers
            const demoCustomers = `
            INSERT INTO customers (user_id, name, email, phone, contract_date, contract_amount, monthly_premium, risk_tolerance, investment_goal, line_user_id) 
            SELECT 
                u1.id,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN '山田太郎'
                    WHEN u2.user_id = 'customer_takahashi' THEN '高橋花子'
                    WHEN u2.user_id = 'customer_ito' THEN '伊藤次郎'
                    WHEN u2.user_id = 'customer_watanabe' THEN '渡辺美和'
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN 'yamada@example.com'
                    WHEN u2.user_id = 'customer_takahashi' THEN 'takahashi@example.com'
                    WHEN u2.user_id = 'customer_ito' THEN 'ito@example.com'
                    WHEN u2.user_id = 'customer_watanabe' THEN 'watanabe@example.com'
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN '03-1234-5678'
                    WHEN u2.user_id = 'customer_takahashi' THEN '090-2345-6789'
                    WHEN u2.user_id = 'customer_ito' THEN '080-3456-7890'
                    WHEN u2.user_id = 'customer_watanabe' THEN '070-4567-8901'
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN '2023-06-15'::date
                    WHEN u2.user_id = 'customer_takahashi' THEN '2023-09-20'::date
                    WHEN u2.user_id = 'customer_ito' THEN '2024-01-10'::date
                    WHEN u2.user_id = 'customer_watanabe' THEN '2023-12-05'::date
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN 1500000.00
                    WHEN u2.user_id = 'customer_takahashi' THEN 2500000.00
                    WHEN u2.user_id = 'customer_ito' THEN 800000.00
                    WHEN u2.user_id = 'customer_watanabe' THEN 1800000.00
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN 45000.00
                    WHEN u2.user_id = 'customer_takahashi' THEN 65000.00
                    WHEN u2.user_id = 'customer_ito' THEN 30000.00
                    WHEN u2.user_id = 'customer_watanabe' THEN 55000.00
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN 'balanced'
                    WHEN u2.user_id = 'customer_takahashi' THEN 'aggressive'
                    WHEN u2.user_id = 'customer_ito' THEN 'conservative'
                    WHEN u2.user_id = 'customer_watanabe' THEN 'balanced'
                END,
                CASE 
                    WHEN u2.user_id = 'customer_yamada' THEN '老後資金の準備'
                    WHEN u2.user_id = 'customer_takahashi' THEN '資産増大・積極運用'
                    WHEN u2.user_id = 'customer_ito' THEN '安全第一の運用'
                    WHEN u2.user_id = 'customer_watanabe' THEN '教育資金の準備'
                END,
                u2.line_user_id
            FROM users u1
            JOIN users u2 ON u2.account_type = 'grandchild'
            WHERE u1.account_type = 'child'
            AND (
                (u1.user_id IN ('agent_tanaka') AND u2.user_id IN ('customer_yamada', 'customer_takahashi')) OR
                (u1.user_id = 'agent_sato' AND u2.user_id = 'customer_ito') OR
                (u1.user_id = 'agent_suzuki' AND u2.user_id = 'customer_watanabe')
            )
            ON CONFLICT DO NOTHING;
            `;
            
            await client.query(demoCustomers);
            console.log('Initial demo data inserted');
        } catch (error) {
            // Ignore conflicts on demo data
            if (!error.message.includes('duplicate key')) {
                console.error('Error inserting demo data:', error);
            }
        }
    }

    async query(sql, params = []) {
        try {
            await this.initialize();

            console.log('PostgreSQL Query:', sql.substring(0, 100), 'params:', params);

            const client = await this.pool.connect();
            try {
                const result = await client.query(sql, params);

                console.log('Query result:', result.rowCount, 'rows affected/returned');

                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    return result.rows;
                } else {
                    return {
                        insertId: result.rows[0]?.id || null,
                        affectedRows: result.rowCount
                    };
                }
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('❌ Query execution error:', error.message);
            console.error('SQL:', sql.substring(0, 100));
            throw error;
        }
    }

    async transaction(callback) {
        await this.initialize();
        
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('PostgreSQL connection closed');
        }
    }
}

module.exports = new DatabasePostgreSQL();