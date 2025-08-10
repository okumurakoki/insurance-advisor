-- Initial development data
USE insurance_advisor_dev;

-- Create initial admin user
INSERT INTO users (user_id, password_hash, account_type, plan_type, customer_limit) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'exceed', 999),
('demo001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'master', 50),
('agent001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'child', 'standard', 10);

-- Create sample customers
INSERT INTO customers (user_id, name, email, phone, contract_date, contract_amount, monthly_premium, risk_tolerance, investment_goal, notes) VALUES
(1, '田中太郎', 'tanaka@example.com', '03-1234-5678', '2024-01-15', 1000000, 50000, 'balanced', '老後資金の準備', 'サンプル顧客データ'),
(1, '佐藤花子', 'sato@example.com', '090-1234-5678', '2024-02-20', 2000000, 80000, 'aggressive', '資産増大', '積極運用希望'),
(1, '鈴木一郎', 'suzuki@example.com', '080-9876-5432', '2023-12-10', 500000, 25000, 'conservative', '安全運用', '保守的運用'),
(2, '山田三郎', 'yamada@example.com', '070-5555-1234', '2024-03-01', 1500000, 60000, 'balanced', '教育資金', 'demo001ユーザーの顧客');

-- Create sample plan features
INSERT INTO plan_features (plan_type, feature_name, feature_value, description) VALUES
('standard', 'customer_limit', '10', 'Maximum number of customers'),
('standard', 'analysis_frequency', 'monthly', 'Analysis frequency'),
('standard', 'export_formats', 'pdf', 'Available export formats'),
('master', 'customer_limit', '50', 'Maximum number of customers'),
('master', 'analysis_frequency', 'weekly', 'Analysis frequency'),
('master', 'export_formats', 'pdf,excel', 'Available export formats'),
('exceed', 'customer_limit', '999', 'Maximum number of customers'),
('exceed', 'analysis_frequency', 'daily', 'Analysis frequency'),
('exceed', 'export_formats', 'pdf,excel,api', 'Available export formats');

-- Create sample market data
INSERT INTO market_data (data_date, data_type, source_file, data_content, uploaded_by) VALUES
('2024-01-01', 'monthly_report', 'sample_market_data.pdf', '{"market_trend": "positive", "volatility": "moderate"}', 1);

-- Create sample analysis results
INSERT INTO analysis_results (
    customer_id, analysis_date, market_data_source, 
    base_allocation, adjusted_allocation, adjustment_factors,
    recommendation_text, confidence_score, created_by
) VALUES
(1, CURDATE(), 'sample_market_data.pdf',
 '{"国内株式": 30, "海外株式": 30, "国内債券": 20, "海外債券": 15, "不動産": 5}',
 '{"国内株式": 25, "海外株式": 35, "国内債券": 20, "海外債券": 15, "不動産": 5}',
 '{"time_adjustment": 1.0, "risk_adjustment": 1.0, "amount_adjustment": 1.0}',
 '現在の市場環境は緩やかな成長トレンドを示しており、バランス型のポートフォリオを推奨します。',
 0.85, 1);

-- Set password: 'password' for all demo users
UPDATE users SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE user_id IN ('admin', 'demo001', 'agent001');