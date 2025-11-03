-- 顧客テーブルに保険会社IDを追加
-- 代理店が顧客に保険会社を割り当てられるようにする

-- insurance_company_idカラムを追加（NULLを許可して既存データとの互換性を保持）
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS insurance_company_id INTEGER;

-- insurance_companiesテーブルへの外部キー制約を追加
ALTER TABLE customers
ADD CONSTRAINT fk_customers_insurance_company
FOREIGN KEY (insurance_company_id) REFERENCES insurance_companies(id);

-- insurance_company_idでのインデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_customers_insurance_company
ON customers(insurance_company_id);

-- ビューを作成: 顧客と保険会社の情報を結合
CREATE OR REPLACE VIEW v_customer_insurance AS
SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.email,
    c.user_id,
    u.user_id as agency_user_id,
    u.account_type,
    c.insurance_company_id,
    ic.company_code,
    ic.company_name,
    ic.company_name_en,
    ic.display_name,
    c.contract_date,
    c.contract_amount,
    c.monthly_premium,
    c.risk_tolerance,
    c.is_active,
    c.created_at,
    c.updated_at
FROM customers c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN insurance_companies ic ON c.insurance_company_id = ic.id;

COMMENT ON COLUMN customers.insurance_company_id IS '顧客が加入している保険会社のID（代理店が持つ権限内でのみ割り当て可能）';
