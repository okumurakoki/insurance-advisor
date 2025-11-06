-- 月次配分推奨履歴テーブル
-- このテーブルは、月ごとの最適化分析で計算された推奨配分を保存し、
-- 前月からの配分変化を追跡するために使用されます。

CREATE TABLE IF NOT EXISTS monthly_allocation_recommendations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES insurance_companies(id),
    recommendation_date DATE NOT NULL,
    fund_type VARCHAR(255) NOT NULL,
    account_code VARCHAR(100),
    recommended_allocation DECIMAL(5,2) NOT NULL CHECK (recommended_allocation >= 0 AND recommended_allocation <= 100),
    risk_profile VARCHAR(20) CHECK (risk_profile IN ('conservative', 'aggressive', 'balanced')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, recommendation_date, fund_type, risk_profile)
);

-- インデックス作成
CREATE INDEX idx_monthly_alloc_company_date ON monthly_allocation_recommendations(company_id, recommendation_date);
CREATE INDEX idx_monthly_alloc_fund_type ON monthly_allocation_recommendations(fund_type);
CREATE INDEX idx_monthly_alloc_risk_profile ON monthly_allocation_recommendations(risk_profile);

-- コメント追加
COMMENT ON TABLE monthly_allocation_recommendations IS '月次最適化分析の推奨配分履歴';
COMMENT ON COLUMN monthly_allocation_recommendations.company_id IS '保険会社ID';
COMMENT ON COLUMN monthly_allocation_recommendations.recommendation_date IS '推奨配分の基準日（月末日など）';
COMMENT ON COLUMN monthly_allocation_recommendations.fund_type IS 'ファンド名（日本株式型TOP, 世界株式型GIなど）';
COMMENT ON COLUMN monthly_allocation_recommendations.account_code IS '特別勘定コード';
COMMENT ON COLUMN monthly_allocation_recommendations.recommended_allocation IS '推奨配分割合（％）';
COMMENT ON COLUMN monthly_allocation_recommendations.risk_profile IS 'リスクプロファイル（conservative/aggressive/balanced）';
