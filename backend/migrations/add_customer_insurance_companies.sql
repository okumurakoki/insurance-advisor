-- 顧客と保険会社の多対多リレーションシップ用の中間テーブルを作成
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

-- 既存の顧客データで insurance_company_id が設定されている場合、中間テーブルに移行
INSERT INTO customer_insurance_companies (customer_id, insurance_company_id, joined_date)
SELECT id, insurance_company_id, contract_date
FROM customers
WHERE insurance_company_id IS NOT NULL;

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX idx_customer_insurance_customer ON customer_insurance_companies(customer_id);
CREATE INDEX idx_customer_insurance_company ON customer_insurance_companies(insurance_company_id);

-- 注意: customers テーブルの insurance_company_id カラムは後方互換性のため残します
-- 将来的に削除する場合は、以下のコメントを外してください
-- ALTER TABLE customers DROP COLUMN insurance_company_id;
