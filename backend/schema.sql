-- プルデンシャル変額保険最適化システム データベーススキーマ

-- ユーザー管理テーブル
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) CHECK (account_type IN ('admin', 'parent', 'child', 'grandchild')) NOT NULL DEFAULT 'parent',
    plan_type VARCHAR(20) CHECK (plan_type IN ('standard', 'master', 'exceed')) NOT NULL DEFAULT 'standard',
    customer_limit INTEGER DEFAULT 10,
    parent_id INTEGER REFERENCES users(id),
    customer_id INTEGER, -- grandchild用：どの顧客に紐づくか
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 顧客管理テーブル
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    contract_date DATE NOT NULL,
    contract_amount DECIMAL(15,2) NOT NULL,
    monthly_premium DECIMAL(10,2) NOT NULL,
    risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('conservative', 'balanced', 'aggressive')) NOT NULL,
    investment_goal TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ファンド情報テーブル
CREATE TABLE funds (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    provider VARCHAR(100) DEFAULT 'prudential',
    expected_return DECIMAL(6,4) NOT NULL,
    management_fee DECIMAL(6,4) NOT NULL DEFAULT 0,
    min_amount DECIMAL(12,2) DEFAULT 100000,
    max_amount DECIMAL(12,2) DEFAULT 50000000,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('normal', 'undervalued', 'overvalued')) DEFAULT 'normal',
    monthly_status VARCHAR(20) CHECK (monthly_status IN ('buy', 'hold', 'sell', 'normal')) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 最適化分析結果テーブル
CREATE TABLE analysis_results (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    market_data_source VARCHAR(255),
    current_allocation JSONB NOT NULL,
    recommended_allocation JSONB NOT NULL,
    adjustment_factors JSONB,
    recommendation_text TEXT,
    confidence_score DECIMAL(4,2),
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- レポートテーブル
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    analysis_id INTEGER REFERENCES analysis_results(id),
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'optimization',
    content JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) NOT NULL
);

-- アラート・通知テーブル
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 顧客ポートフォリオテーブル
CREATE TABLE customer_portfolios (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    fund_id INTEGER REFERENCES funds(id) NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    amount DECIMAL(12,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, fund_id)
);

-- 市場データテーブル
CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    data_date DATE NOT NULL,
    fund_id INTEGER REFERENCES funds(id) NOT NULL,
    price DECIMAL(12,4),
    daily_return DECIMAL(8,4),
    volume BIGINT,
    market_cap DECIMAL(15,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_date, fund_id)
);

-- インデックス作成
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_analysis_results_customer_id ON analysis_results(customer_id);
CREATE INDEX idx_analysis_results_date ON analysis_results(analysis_date);
CREATE INDEX idx_reports_customer_id ON reports(customer_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_customer_portfolios_customer_id ON customer_portfolios(customer_id);
CREATE INDEX idx_market_data_date_fund ON market_data(data_date, fund_id);

-- 初期データ挿入

-- 管理者ユーザー
INSERT INTO users (user_id, password_hash, account_type, plan_type) VALUES
('admin', '$2b$10$example_hash_for_password123', 'admin', 'exceed');

-- デモユーザー
INSERT INTO users (user_id, password_hash, account_type, plan_type, customer_limit) VALUES
('demo_agency', '$2b$10$example_hash_for_password123', 'parent', 'master', 100),
('demo_staff', '$2b$10$example_hash_for_password123', 'child', 'standard', 10);

-- 基本ファンド情報
INSERT INTO funds (code, name, category, expected_return, management_fee, risk_level, description, status) VALUES
('PF001', '株式型ファンド', 'equity', 0.0680, 0.0150, 'high', '国内株式を中心とした積極運用ファンド', 'normal'),
('PF002', '米国株式型ファンド', 'us_equity', 0.0750, 0.0180, 'high', '米国株式市場への分散投資ファンド', 'undervalued'),
('PF003', '米国債券型ファンド', 'us_bond', 0.0420, 0.0120, 'medium', '米国債券を中心とした安定運用ファンド', 'normal'),
('PF004', 'REIT型ファンド', 'reit', 0.0550, 0.0160, 'medium', '不動産投資信託への分散投資ファンド', 'overvalued'),
('PF005', '世界株式型ファンド', 'global_equity', 0.0720, 0.0200, 'high', '世界各国の株式市場への分散投資ファンド', 'normal');

-- 更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新トリガー設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();