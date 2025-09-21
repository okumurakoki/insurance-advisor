-- プルデンシャル生命変額保険最適化システム
-- 初期データベーススキーマ

-- 1. KVストアテーブル（システム設定用）
CREATE TABLE IF NOT EXISTS kv_store_e075ba47 (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ユーザーテーブル（プルデンシャル認証）
CREATE TABLE prudential_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('agency', 'staff', 'customer', 'admin')),
  company TEXT DEFAULT 'プルデンシャル生命',
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_users_email ON prudential_users(email);
CREATE INDEX idx_users_username ON prudential_users(username);
CREATE INDEX idx_users_type ON prudential_users(user_type);

-- 3. 顧客管理テーブル
CREATE TABLE prudential_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surname TEXT NOT NULL,
  given_name TEXT,
  age_range TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  occupation TEXT NOT NULL,
  annual_income INTEGER NOT NULL,
  assigned_staff_id UUID REFERENCES prudential_users(id),
  agency_id UUID REFERENCES prudential_users(id),
  management_info JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_customers_staff ON prudential_customers(assigned_staff_id);
CREATE INDEX idx_customers_agency ON prudential_customers(agency_id);

-- 4. 分析結果テーブル
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES prudential_customers(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  performance_metrics JSONB,
  created_by UUID REFERENCES prudential_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_analysis_customer ON analysis_results(customer_id);
CREATE INDEX idx_analysis_type ON analysis_results(analysis_type);
CREATE INDEX idx_analysis_created ON analysis_results(created_at DESC);

-- 5. マーケットデータテーブル
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  source TEXT DEFAULT 'alpha_vantage',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- インデックス作成
CREATE INDEX idx_market_symbol ON market_data(symbol);
CREATE INDEX idx_market_type ON market_data(data_type);
CREATE INDEX idx_market_fetched ON market_data(fetched_at DESC);

-- 6. 監査ログテーブル
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prudential_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- 7. セッション管理テーブル
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prudential_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- 8. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーを各テーブルに適用
CREATE TRIGGER update_kv_store_updated_at BEFORE UPDATE ON kv_store_e075ba47
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON prudential_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON prudential_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Row Level Security (RLS) 設定
ALTER TABLE prudential_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prudential_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLSポリシー作成
-- ユーザーテーブルのポリシー
CREATE POLICY "Users can view their own profile" ON prudential_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON prudential_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prudential_users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- 顧客テーブルのポリシー
CREATE POLICY "Staff can view assigned customers" ON prudential_customers
    FOR SELECT USING (
        assigned_staff_id = auth.uid() OR
        agency_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM prudential_users 
            WHERE id = auth.uid() AND user_type IN ('admin', 'agency')
        )
    );

-- 分析結果のポリシー
CREATE POLICY "Users can view analysis for their customers" ON analysis_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prudential_customers c
            WHERE c.id = analysis_results.customer_id
            AND (c.assigned_staff_id = auth.uid() OR c.agency_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM prudential_users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- 監査ログのポリシー
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prudential_users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );