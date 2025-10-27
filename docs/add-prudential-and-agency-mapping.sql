-- Add Prudential Life and Agency-Company Mapping
-- Version: 1.1.0
-- Description: Add Prudential Life and agency-company relationship management
-- Database: PostgreSQL (Supabase)

-- Insert Prudential Life Insurance Company
INSERT INTO insurance_companies (company_code, company_name, company_name_en) VALUES
('PRUDENTIAL_LIFE', 'プルデンシャル生命保険株式会社', 'Prudential Life Insurance Co., Ltd.')
ON CONFLICT (company_code) DO NOTHING;

-- Insert Prudential Life Special Accounts
INSERT INTO special_accounts (company_id, account_code, account_name, account_type, benchmark) VALUES
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_BALANCED_STABLE', '安定成長バランス型', 'バランス型', NULL),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_BALANCED_GROWTH', '成長バランス型', 'バランス型', NULL),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_DOMESTIC_EQUITY', '日本株式型', '株式型', 'TOPIX（東証株価指数　配当込）'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_DOMESTIC_VALUE', '日本株式バリュー型', '株式型', 'TOPIX（配当込）'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_FOREIGN_EQUITY', '外国株式型', '株式型', 'MSCIワールド・インデックス（配当込・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_GLOBAL_EQUITY', '世界株式型', '株式型', 'MSCIワールド・インデックス（配当込・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_EMERGING_EQUITY', '新興国株式型', '株式型', 'MSCIエマージング・マーケット・インデックス'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_FOREIGN_BOND', '外国債券型', '債券型', 'FTSE世界国債インデックス（ヘッジなし・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_GLOBAL_BOND', '世界債券型', '債券型', 'FTSE世界国債インデックス'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_REIT', '世界REIT型', 'REIT型', 'S&P先進国REIT指数（除く日本、配当込み、円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'PRUDENTIAL_LIFE'), 'PRU_MONEY_MARKET', '短期金融市場型', '短期金融', '短期金利（無担保コール翌日物など）')
ON CONFLICT (account_code) DO NOTHING;

-- Insert Sample Performance Data for Prudential Life (2025年8月末現在)
INSERT INTO special_account_performance (special_account_id, performance_date, unit_price, return_1m, return_3m, return_6m, return_1y, return_3y, return_since_inception) VALUES
-- 安定成長バランス型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_BALANCED_STABLE'), '2025-08-31', 245.67, 1.05, 4.25, 5.33, 6.95, 34.12, 145.67),
-- 成長バランス型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_BALANCED_GROWTH'), '2025-08-31', 338.92, 1.42, 5.88, 8.35, 10.22, 56.18, 238.92),
-- 日本株式型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_DOMESTIC_EQUITY'), '2025-08-31', 195.43, 4.52, 15.88, 15.67, 18.45, 105.67, 95.43),
-- 日本株式バリュー型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_DOMESTIC_VALUE'), '2025-08-31', 412.18, 4.38, 12.45, 12.03, 15.56, 74.89, 312.18),
-- 外国株式型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_FOREIGN_EQUITY'), '2025-08-31', 173.28, 0.95, 10.05, 18.87, 19.92, NULL, 73.28),
-- 世界株式型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_GLOBAL_EQUITY'), '2025-08-31', 285.43, 0.88, 9.15, 19.12, 19.28, 120.45, 185.43),
-- 新興国株式型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_EMERGING_EQUITY'), '2025-08-31', 167.55, -0.48, 11.92, 18.67, 12.23, 66.78, 67.55),
-- 外国債券型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_FOREIGN_BOND'), '2025-08-31', 113.45, -0.22, 3.62, 4.53, 4.08, NULL, 13.45),
-- 世界債券型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_GLOBAL_BOND'), '2025-08-31', 170.23, -0.19, 3.05, 3.28, 3.22, 14.35, 70.23),
-- 世界REIT型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_REIT'), '2025-08-31', 142.67, 1.23, 7.88, 12.45, 15.67, 45.89, 42.67),
-- 短期金融市場型
((SELECT id FROM special_accounts WHERE account_code = 'PRU_MONEY_MARKET'), '2025-08-31', 93.25, 0.01, 0.02, -0.23, -0.33, -0.42, -6.75)
ON CONFLICT (special_account_id, performance_date) DO NOTHING;

-- Create Agency-Company Mapping Table (代理店と保険会社の紐付け)
CREATE TABLE IF NOT EXISTS agency_insurance_companies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    contract_start_date DATE,
    contract_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES insurance_companies(id) ON DELETE CASCADE,
    UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_companies_user ON agency_insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_companies_company ON agency_insurance_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_agency_companies_active ON agency_insurance_companies(is_active);

-- Insert demo data: Agency001 handles all 3 companies
INSERT INTO agency_insurance_companies (user_id, company_id, contract_start_date, is_active)
SELECT
    u.id,
    ic.id,
    '2024-01-01'::date,
    true
FROM users u
CROSS JOIN insurance_companies ic
WHERE u.user_id = 'agency001'
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Insert demo data: Agency002 handles only Sony Life and AXA Life
INSERT INTO agency_insurance_companies (user_id, company_id, contract_start_date, is_active)
SELECT
    u.id,
    ic.id,
    '2024-06-01'::date,
    true
FROM users u
CROSS JOIN insurance_companies ic
WHERE u.user_id = 'agency002'
AND ic.company_code IN ('SONY_LIFE', 'AXA_LIFE')
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Create view for easy querying
CREATE OR REPLACE VIEW v_agency_companies AS
SELECT
    aic.id,
    aic.user_id,
    u.user_id as agency_user_id,
    u.account_type,
    aic.company_id,
    ic.company_code,
    ic.company_name,
    ic.company_name_en,
    aic.contract_start_date,
    aic.contract_end_date,
    aic.is_active,
    aic.notes,
    aic.created_at,
    aic.updated_at
FROM agency_insurance_companies aic
JOIN users u ON aic.user_id = u.id
JOIN insurance_companies ic ON aic.company_id = ic.id;

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON agency_insurance_companies TO authenticated;
-- GRANT SELECT ON v_agency_companies TO authenticated;
