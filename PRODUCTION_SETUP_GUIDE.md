# プルデンシャル変額保険最適化システム - 本番環境構築ガイド

## 概要
このシステムを本番環境で運用するためのセットアップガイドです。

## 必要な準備

### 1. データベース (PostgreSQL)

#### オプション A: Supabase (推奨)
```bash
# 1. Supabaseにサインアップ
https://supabase.com/

# 2. 新しいプロジェクトを作成
# 3. データベースURLとAPIキーを取得
# 4. SQLエディターでschema.sqlを実行
```

#### オプション B: Railway
```bash
# 1. Railwayにサインアップ
https://railway.app/

# 2. PostgreSQLサービスをデプロイ
# 3. 接続情報を取得
```

#### オプション C: Neon (サーバーレスPostgreSQL)
```bash
# 1. Neonにサインアップ
https://neon.tech/

# 2. データベースを作成
# 3. 接続文字列を取得
```

### 2. バックエンドAPI (Node.js)

#### オプション A: Vercel (推奨)
```bash
# バックエンドフォルダで実行
cd backend
npx vercel --prod

# 環境変数を設定:
# - DATABASE_URL
# - JWT_SECRET
# - NODE_ENV=production
```

#### オプション B: Railway
```bash
# 1. backend/をGitにプッシュ
# 2. RailwayでGitHubからデプロイ
# 3. 環境変数を設定
```

#### オプション C: Fly.io
```bash
cd backend
fly launch
fly secrets set DATABASE_URL="your-db-url"
fly secrets set JWT_SECRET="your-secret"
fly deploy
```

### 3. フロントエンド

既にデプロイ済み:
- 本番URL: https://prudential-insurance-optimizer-frontend-7c7krg48v.vercel.app
- カスタムドメイン設定可能: app.insurance-optimizer.jp

## セットアップ手順

### Step 1: データベース構築
```sql
-- schema.sqlを実行してテーブル作成
-- 初期データ投入（管理者ユーザー、基本ファンド）
```

### Step 2: バックエンド環境変数設定
```bash
# 本番環境で設定が必要な環境変数
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-key
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Step 3: 初期ユーザー作成
```sql
-- 管理者アカウント
INSERT INTO users (user_id, password_hash, account_type, plan_type) VALUES
('admin', '$2b$10$hashed_password', 'admin', 'exceed');

-- デモアカウント
INSERT INTO users (user_id, password_hash, account_type, plan_type) VALUES
('demo_agency', '$2b$10$hashed_password', 'parent', 'master');
```

### Step 4: ドメイン設定 (オプション)
- フロントエンド: app.insurance-optimizer.jp
- API: api.insurance-optimizer.jp

## セキュリティ設定

### 1. JWT秘密鍵の生成
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. パスワードハッシュ化
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password123', 10))"
```

### 3. CORS設定
```javascript
// 本番フロントエンドドメインのみ許可
ALLOWED_ORIGINS=https://app.insurance-optimizer.jp
```

## 監視・メンテナンス

### 1. ヘルスチェック
- API: `/health` エンドポイント
- データベース接続チェック

### 2. ログ監視
- アプリケーションログ
- エラーログ
- アクセスログ

### 3. バックアップ
- データベースの定期バックアップ
- 設定ファイルのバックアップ

## コスト見積もり

### 小規模運用 (月間)
- Supabase: $0-25
- Vercel: $0-20
- 合計: $0-45

### 中規模運用 (月間)
- データベース: $25-50
- API: $20-40
- 合計: $45-90

## 運用開始チェックリスト

- [ ] データベース構築完了
- [ ] バックエンドAPI デプロイ完了
- [ ] フロントエンド デプロイ完了
- [ ] 管理者アカウント作成済み
- [ ] 基本ファンドデータ投入済み
- [ ] セキュリティ設定完了
- [ ] ドメイン設定完了 (オプション)
- [ ] 動作テスト完了
- [ ] バックアップ設定完了

## サポート
システムの運用開始後のサポートや追加機能開発についてはお気軽にご相談ください。