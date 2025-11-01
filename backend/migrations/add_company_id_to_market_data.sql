-- マーケットデータに保険会社IDを追加して会社別のPDF管理を可能にする

-- company_idカラムを追加（NULLを許可して既存データとの互換性を保持）
ALTER TABLE market_data
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- insurance_companiesテーブルへの外部キー制約を追加
ALTER TABLE market_data
ADD CONSTRAINT fk_market_data_company
FOREIGN KEY (company_id) REFERENCES insurance_companies(id);

-- company_idとdata_dateでのインデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_market_data_company_date
ON market_data(company_id, data_date DESC);

-- company_idとdata_typeでのインデックスを作成（分析クエリのパフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_market_data_company_type
ON market_data(company_id, data_type);

-- 既存のマーケットデータをプルデンシャルに紐付け
-- PRUDENTIAL_LIFEのIDを取得して既存レコードに設定
UPDATE market_data
SET company_id = (
    SELECT id FROM insurance_companies
    WHERE company_code = 'PRUDENTIAL_LIFE'
    LIMIT 1
)
WHERE company_id IS NULL;

-- 今後のデータはcompany_idを必須にする（既存データの移行後）
-- Note: 管理者がPDFアップロード時に保険会社を選択必須とする
