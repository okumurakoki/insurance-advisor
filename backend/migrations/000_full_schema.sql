-- 変額保険最適化システム 完全スキーマ
-- 新しいSupabaseプロジェクト用

-- ユーザー管理テーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    account_type VARCHAR(20) CHECK (account_type IN ('admin', 'parent', 'child', 'grandchild')) NOT NULL DEFAULT 'parent',
    plan_type VARCHAR(20) CHECK (plan_type IN ('standard', 'master', 'exceed')) NOT NULL DEFAULT 'standard',
    customer_limit INTEGER DEFAULT 10,
    parent_id INTEGER REFERENCES users(id),
    customer_id INTEGER,
    payment_method VARCHAR(50) DEFAULT 'manual',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 保険会社テーブル
CREATE TABLE IF NOT EXISTS insurance_companies (
    id SERIAL PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_name_en VARCHAR(255),
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 顧客管理テーブル
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    insurance_company_id INTEGER REFERENCES insurance_companies(id),
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

-- 顧客と保険会社の多対多リレーション
CREATE TABLE IF NOT EXISTS customer_insurance_companies (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    insurance_company_id INTEGER NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    joined_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, insurance_company_id)
);

-- ファンド情報テーブル
CREATE TABLE IF NOT EXISTS funds (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES insurance_companies(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    provider VARCHAR(100) DEFAULT 'variable_insurance',
    expected_return DECIMAL(6,4),
    management_fee DECIMAL(6,4) DEFAULT 0,
    min_amount DECIMAL(12,2) DEFAULT 100000,
    max_amount DECIMAL(12,2) DEFAULT 50000000,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('normal', 'undervalued', 'overvalued')) DEFAULT 'normal',
    monthly_status VARCHAR(20) CHECK (monthly_status IN ('buy', 'hold', 'sell', 'normal')) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

-- 市場データテーブル
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    data_date DATE NOT NULL,
    fund_id INTEGER REFERENCES funds(id) NOT NULL,
    company_id INTEGER REFERENCES insurance_companies(id),
    price DECIMAL(12,4),
    unit_price DECIMAL(12,4),
    daily_return DECIMAL(8,4),
    return_1m DECIMAL(8,4),
    return_3m DECIMAL(8,4),
    return_6m DECIMAL(8,4),
    return_1y DECIMAL(8,4),
    return_3y DECIMAL(8,4),
    return_5y DECIMAL(8,4),
    return_inception DECIMAL(8,4),
    volume BIGINT,
    market_cap DECIMAL(15,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_date, fund_id)
);

-- 最適化分析結果テーブル
CREATE TABLE IF NOT EXISTS analysis_results (
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
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    analysis_id INTEGER REFERENCES analysis_results(id),
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'optimization',
    content JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) NOT NULL
);

-- アラートテーブル
CREATE TABLE IF NOT EXISTS alerts (
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
CREATE TABLE IF NOT EXISTS customer_portfolios (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    fund_id INTEGER REFERENCES funds(id) NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    amount DECIMAL(12,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, fund_id)
);

-- 月次配分推奨テーブル
CREATE TABLE IF NOT EXISTS monthly_allocation_recommendations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) NOT NULL,
    recommendation_date DATE NOT NULL,
    current_allocation JSONB NOT NULL,
    recommended_allocation JSONB NOT NULL,
    recommendation_text TEXT,
    is_applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, recommendation_date)
);

-- 代理店プランテーブル
CREATE TABLE IF NOT EXISTS agency_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    custom_monthly_price DECIMAL(10,2),
    annual_price DECIMAL(10,2),
    max_staff INTEGER DEFAULT 1,
    max_customers INTEGER DEFAULT 10,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ユーザーと保険会社の関連テーブル
CREATE TABLE IF NOT EXISTS user_insurance_companies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    insurance_company_id INTEGER REFERENCES insurance_companies(id) ON DELETE CASCADE,
    contract_start_date DATE,
    contract_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, insurance_company_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_analysis_results_customer_id ON analysis_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_date ON analysis_results(analysis_date);
CREATE INDEX IF NOT EXISTS idx_reports_customer_id ON reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_portfolios_customer_id ON customer_portfolios(customer_id);
CREATE INDEX IF NOT EXISTS idx_market_data_date_fund ON market_data(data_date, fund_id);
CREATE INDEX IF NOT EXISTS idx_funds_company_id ON funds(company_id);
CREATE INDEX IF NOT EXISTS idx_market_data_company_id ON market_data(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_insurance_customer ON customer_insurance_companies(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_insurance_company ON customer_insurance_companies(insurance_company_id);

-- 更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新トリガー設定
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funds_updated_at ON funds;
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_insurance_companies_updated_at ON insurance_companies;
CREATE TRIGGER update_insurance_companies_updated_at BEFORE UPDATE ON insurance_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期保険会社データ
INSERT INTO insurance_companies (company_code, company_name, display_name) VALUES
('PRUDENTIAL_LIFE', 'プルデンシャル生命保険株式会社', 'プルデンシャル生命'),
('SONY_LIFE', 'ソニー生命保険株式会社（バリアブル・ライフ）', 'ソニー生命（バリアブル・ライフ）'),
('SONY_LIFE_SOVANI', 'ソニー生命保険株式会社（SOVANI）', 'ソニー生命（SOVANI）'),
('SONY_LIFE_ANNUITY', 'ソニー生命保険株式会社（変額個人年金）', 'ソニー生命（個人年金）'),
('AXA_LIFE', 'アクサ生命保険株式会社', 'アクサ生命'),
('SOMPO_HIMAWARI_LIFE', 'SOMPOひまわり生命保険株式会社', 'SOMPOひまわり生命'),
('HANASAKU_LIFE', 'はなさく生命保険株式会社', 'はなさく生命')
ON CONFLICT (company_code) DO NOTHING;

-- 代理店プラン初期データ
INSERT INTO agency_plans (plan_code, plan_name, description, monthly_price, max_staff, max_customers, features) VALUES
('standard', 'スタンダードプラン', '個人向けの基本プラン', 3000, 1, 10, '{"pdf_upload": true, "basic_analysis": true}'),
('master', 'マスタープラン', '代理店向けプラン', 10000, 5, 100, '{"pdf_upload": true, "basic_analysis": true, "advanced_analysis": true, "team_management": true}'),
('exceed', 'エクシードプラン', '大規模代理店向けプラン', 30000, 20, 500, '{"pdf_upload": true, "basic_analysis": true, "advanced_analysis": true, "team_management": true, "api_access": true, "priority_support": true}')
ON CONFLICT (plan_code) DO NOTHING;
