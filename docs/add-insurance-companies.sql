-- Insurance Companies and Special Accounts Schema
-- Version: 1.0.0
-- Description: Add support for Sony Life and AXA Life insurance products
-- Database: PostgreSQL (Supabase)

-- Insurance Companies table (保険会社)
CREATE TABLE IF NOT EXISTS insurance_companies (
    id SERIAL PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    company_name_en VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_code ON insurance_companies(company_code);
CREATE INDEX IF NOT EXISTS idx_is_active ON insurance_companies(is_active);

-- Special Accounts table (特別勘定)
CREATE TABLE IF NOT EXISTS special_accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    investment_policy TEXT,
    benchmark VARCHAR(255),
    base_currency VARCHAR(10) DEFAULT 'JPY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES insurance_companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_special_accounts_company ON special_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_special_accounts_code ON special_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_special_accounts_active ON special_accounts(is_active);

-- Special Account Performance table (特別勘定パフォーマンス)
CREATE TABLE IF NOT EXISTS special_account_performance (
    id SERIAL PRIMARY KEY,
    special_account_id INTEGER NOT NULL,
    performance_date DATE NOT NULL,
    unit_price DECIMAL(10,4),
    return_1m DECIMAL(6,2),
    return_3m DECIMAL(6,2),
    return_6m DECIMAL(6,2),
    return_1y DECIMAL(6,2),
    return_3y DECIMAL(6,2),
    return_since_inception DECIMAL(8,2),
    total_assets DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (special_account_id) REFERENCES special_accounts(id) ON DELETE CASCADE,
    UNIQUE (special_account_id, performance_date)
);

CREATE INDEX IF NOT EXISTS idx_performance_account ON special_account_performance(special_account_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON special_account_performance(performance_date);

-- Insert Insurance Companies
INSERT INTO insurance_companies (company_code, company_name, company_name_en) VALUES
('SONY_LIFE', 'ソニー生命保険株式会社', 'Sony Life Insurance Co., Ltd.'),
('AXA_LIFE', 'アクサ生命保険株式会社', 'AXA Life Insurance Co., Ltd.')
ON CONFLICT (company_code) DO NOTHING;

-- Insert Sony Life Special Accounts
INSERT INTO special_accounts (company_id, account_code, account_name, account_type, benchmark) VALUES
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_BALANCED_STABLE', '安定成長バランス型', 'バランス型', NULL),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_BALANCED_AGGRESSIVE', '積極運用バランス型', 'バランス型', NULL),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_DOMESTIC_EQUITY', '株式型', '株式型', 'TOPIX（東証株価指数　配当込）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_DOMESTIC_GROWTH', '日本成長株式型', '株式型', 'TOPIX（配当込）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_FOREIGN_EQUITY_INDEX', '外国株式型', '株式型', 'MSCIワールド・インデックス（配当込・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_FOREIGN_EQUITY_ACTIVE', '外国株式プラス型', '株式型', 'MSCIワールド・インデックス（配当込・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_GLOBAL_EQUITY', '世界株式プラス型', '株式型', 'MSCIワールド・インデックス（配当込・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_EMERGING_EQUITY', '新興国株式型', '株式型', 'MSCIエマージング・マーケット・インデックス'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_FOREIGN_BOND', '外国債券型', '債券型', 'FTSE世界国債インデックス（ヘッジなし・円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_GLOBAL_BOND', '世界債券プラス型', '債券型', 'FTSE世界国債インデックス'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_AUSTRALIA_BOND', 'オーストラリア債券型', '債券型', 'ブルームバーグ・オーストラリア国債インデックス（円換算）'),
((SELECT id FROM insurance_companies WHERE company_code = 'SONY_LIFE'), 'SONY_MONEY_MARKET', '短期金融市場型', '短期金融', '短期金利（無担保コール翌日物など）')
ON CONFLICT (account_code) DO NOTHING;

-- Insert AXA Life Special Accounts
INSERT INTO special_accounts (company_id, account_code, account_name, account_type, benchmark) VALUES
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_BALANCED_STABLE', '安定成長バランス型', 'バランス型', NULL),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_BALANCED_AGGRESSIVE', '積極運用バランス型', 'バランス型', NULL),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_DOMESTIC_EQUITY', '日本株式型', '株式型', 'TOPIX（東証株価指数　配当込）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_DOMESTIC_EQUITY_PLUS', '日本株式プラス型', '株式型', 'なし'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_FOREIGN_EQUITY', '外国株式型', '株式型', 'MSCIコクサイ・インデックス（税引後配当込み、円ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_FOREIGN_EQUITY_PLUS', '外国株式プラス型', '株式型', 'MSCIコクサイ・インデックス（円ベース・税引後配当込み）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_GLOBAL_EQUITY', '世界株式プラス型', '株式型', 'なし'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_EMERGING_EQUITY', '新興国株式型', '株式型', 'MSCIエマージング・マーケット・インデックス（配当込み、円換算ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_SDGS_EQUITY', 'SDGs世界株式型', '株式型', 'なし'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_FOREIGN_BOND', '外国債券型', '債券型', 'FTSE世界国債インデックス（除く日本、ヘッジなし・円ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_GLOBAL_BOND', '世界債券プラス型', '債券型', 'FTSE世界国債インデックス（円ベース）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_AUSTRALIA_BOND', 'オーストラリア債券型', '債券型', 'ブルームバーグ・オーストラリア国債インデックス（円換算）'),
((SELECT id FROM insurance_companies WHERE company_code = 'AXA_LIFE'), 'AXA_MONEY_MARKET', '金融市場型', '短期金融', NULL)
ON CONFLICT (account_code) DO NOTHING;

-- Insert Sample Performance Data for Sony Life (2025年8月末現在)
INSERT INTO special_account_performance (special_account_id, performance_date, unit_price, return_1m, return_3m, return_6m, return_1y, return_3y, return_since_inception) VALUES
-- 安定成長バランス型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_BALANCED_STABLE'), '2025-08-31', 249.23, 0.99, 4.13, 5.11, 6.74, 33.73, 149.24),
-- 積極運用バランス型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_BALANCED_AGGRESSIVE'), '2025-08-31', 341.45, 1.38, 5.79, 8.13, 10.05, 55.29, 241.46),
-- 株式型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_DOMESTIC_EQUITY'), '2025-08-31', 192.87, 4.43, 15.70, 15.45, 18.17, 104.23, 92.87),
-- 日本成長株式型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_DOMESTIC_GROWTH'), '2025-08-31', 406.72, 4.31, 12.20, 11.81, 15.28, 73.17, 306.72),
-- 外国株式型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_FOREIGN_EQUITY_INDEX'), '2025-08-31', 171.51, 0.90, 9.90, 18.61, 19.70, NULL, 71.52),
-- 外国株式プラス型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_FOREIGN_EQUITY_ACTIVE'), '2025-08-31', 743.96, 1.05, 7.48, 14.82, 17.25, 126.24, 643.96),
-- 世界株式プラス型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_GLOBAL_EQUITY'), '2025-08-31', 282.76, 0.84, 9.00, 18.91, 19.04, 118.77, 182.76),
-- 新興国株式型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_EMERGING_EQUITY'), '2025-08-31', 165.83, -0.53, 11.78, 18.42, 12.00, 65.58, 65.83),
-- 外国債券型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_FOREIGN_BOND'), '2025-08-31', 112.32, -0.25, 3.51, 4.41, 3.95, NULL, 12.33),
-- 世界債券プラス型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_GLOBAL_BOND'), '2025-08-31', 168.67, -0.22, 2.98, 3.17, 3.11, 14.09, 68.67),
-- オーストラリア債券型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_AUSTRALIA_BOND'), '2025-08-31', 116.20, -0.12, 5.68, 0.55, 3.12, 18.35, 16.21),
-- 短期金融市場型
((SELECT id FROM special_accounts WHERE account_code = 'SONY_MONEY_MARKET'), '2025-08-31', 93.13, 0.01, 0.02, -0.24, -0.35, -0.44, -6.87)
ON CONFLICT (special_account_id, performance_date) DO NOTHING;

-- Insert Sample Performance Data for AXA Life (2025年8月末現在)
INSERT INTO special_account_performance (special_account_id, performance_date, unit_price, return_1m, return_3m, return_6m, return_1y, return_3y, return_since_inception) VALUES
-- 安定成長バランス型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_BALANCED_STABLE'), '2025-08-31', 249.23, 0.99, 4.13, 5.11, 6.74, 33.73, 149.24),
-- 積極運用バランス型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_BALANCED_AGGRESSIVE'), '2025-08-31', 341.45, 1.38, 5.79, 8.13, 10.05, 55.29, 241.46),
-- 日本株式型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_DOMESTIC_EQUITY'), '2025-08-31', 192.87, 4.43, 15.70, 15.45, 18.17, 104.23, 92.87),
-- 日本株式プラス型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_DOMESTIC_EQUITY_PLUS'), '2025-08-31', 406.72, 4.31, 12.20, 11.81, 15.28, 73.17, 306.72),
-- 外国株式型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_FOREIGN_EQUITY'), '2025-08-31', 171.51, 0.90, 9.90, 18.61, 19.70, NULL, 71.52),
-- 外国株式プラス型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_FOREIGN_EQUITY_PLUS'), '2025-08-31', 743.96, 1.05, 7.48, 14.82, 17.25, 126.24, 643.96),
-- 世界株式プラス型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_GLOBAL_EQUITY'), '2025-08-31', 282.76, 0.84, 9.00, 18.91, 19.04, 118.77, 182.76),
-- 新興国株式型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_EMERGING_EQUITY'), '2025-08-31', 165.83, -0.53, 11.78, 18.42, 12.00, 65.58, 65.83),
-- SDGs世界株式型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_SDGS_EQUITY'), '2025-08-31', 112.30, 1.17, 6.27, 10.74, NULL, NULL, 12.30),
-- 外国債券型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_FOREIGN_BOND'), '2025-08-31', 112.32, -0.25, 3.51, 4.41, 3.95, NULL, 12.33),
-- 世界債券プラス型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_GLOBAL_BOND'), '2025-08-31', 168.67, -0.22, 2.98, 3.17, 3.11, 14.09, 68.67),
-- オーストラリア債券型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_AUSTRALIA_BOND'), '2025-08-31', 116.20, -0.12, 5.68, 0.55, 3.12, 18.35, 16.21),
-- 金融市場型
((SELECT id FROM special_accounts WHERE account_code = 'AXA_MONEY_MARKET'), '2025-08-31', 93.13, 0.01, 0.02, -0.24, -0.35, -0.44, -0.43)
ON CONFLICT (special_account_id, performance_date) DO NOTHING;

-- Additional index for performance queries
CREATE INDEX IF NOT EXISTS idx_performance_account_date ON special_account_performance(special_account_id, performance_date DESC);
