# 🚀 変額保険最適化システム - 本番環境デプロイガイド

## 📋 事前準備チェックリスト

### ✅ 完了済み項目
- [x] プロジェクト構造確認
- [x] package.json設定確認
- [x] vercel.json設定（セキュリティヘッダー追加済み）
- [x] 環境変数テンプレート作成
- [x] Supabaseマイグレーションスクリプト作成
- [x] ビルドプロセス確認

### 🔧 必要なツール
- Node.js 18.x以上
- npm または yarn
- Vercel CLI
- Supabase CLI
- Git

## 📦 ステップ1: Supabaseプロジェクトセットアップ

### 1.1 Supabaseプロジェクト作成
```bash
# Supabaseダッシュボードにアクセス
https://supabase.com/dashboard

# 新規プロジェクト作成
プロジェクト名: insurance-optimizer
リージョン: Northeast Asia (Tokyo)
データベースパスワード: 強力なパスワードを設定
```

### 1.2 データベース初期化
```bash
# Supabase CLIでプロジェクトに接続
supabase link --project-ref YOUR_PROJECT_REF

# マイグレーション実行
supabase db push --include-all

# または、SQL Editorで直接実行
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_initial_data.sql
```

### 1.3 環境変数取得
Supabaseダッシュボード → Settings → API から以下を取得：
- `Project URL` → REACT_APP_SUPABASE_URL
- `anon public` → REACT_APP_SUPABASE_ANON_KEY
- `service_role` → SUPABASE_SERVICE_ROLE_KEY

## 🔐 ステップ2: 環境変数設定

### 2.1 本番環境変数ファイル作成
```bash
# プロジェクトルートで実行
cp production.env.example .env.production

# フロントエンドディレクトリ
cd frontend
cp .env.production.example .env.production
```

### 2.2 必須環境変数の設定
```env
# Supabase（必須）
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY

# 外部API（必須）
ALPHA_VANTAGE_API_KEY=YOUR_KEY
NOTEBOOK_LM_API_KEY=YOUR_KEY

# セキュリティ（必須）
JWT_SECRET=生成した32文字以上のランダム文字列
```

### 2.3 JWT Secret生成
```bash
# 安全なJWT Secretを生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 ステップ3: Vercelデプロイ

### 3.1 Vercel CLI セットアップ
```bash
# Vercel CLIインストール
npm install -g vercel

# ログイン
vercel login
```

### 3.2 フロントエンドデプロイ
```bash
cd frontend

# ビルド確認
npm run build

# Vercelプロジェクト初期化
vercel

# 本番デプロイ
vercel --prod
```

### 3.3 バックエンドデプロイ
```bash
cd ../backend

# Vercelプロジェクト初期化
vercel

# 本番デプロイ
vercel --prod
```

### 3.4 環境変数設定（Vercelダッシュボード）
1. https://vercel.com/dashboard にアクセス
2. プロジェクト → Settings → Environment Variables
3. 以下の変数を設定：

**フロントエンド環境変数：**
```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_API_URL（バックエンドのURL）
REACT_APP_ENV=production
```

**バックエンド環境変数：**
```
NODE_ENV=production
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
ALPHA_VANTAGE_API_KEY
NOTEBOOK_LM_API_KEY
ALLOWED_ORIGINS（フロントエンドのURL）
```

## 🌐 ステップ4: 独自ドメイン設定

### 4.1 Cloudflare DNS設定
```bash
# Cloudflareダッシュボードで設定
A レコード: @ → 76.76.19.61
CNAME レコード: www → cname.vercel-dns.com
```

### 4.2 Vercelドメイン追加
```bash
# フロントエンド
vercel domains add insurance-optimizer.com
vercel domains add www.insurance-optimizer.com

# バックエンド（サブドメイン）
vercel domains add api.insurance-optimizer.com
```

## ✅ ステップ5: 動作確認

### 5.1 ヘルスチェック
```bash
# フロントエンド
curl -I https://insurance-optimizer.com

# バックエンドAPI
curl https://api.insurance-optimizer.com/health
```

### 5.2 SSL証明書確認
```bash
openssl s_client -connect insurance-optimizer.com:443 -servername insurance-optimizer.com
```

### 5.3 セキュリティヘッダー確認
```bash
curl -I https://insurance-optimizer.com | grep -E "X-Frame-Options|X-Content-Type-Options|Content-Security-Policy"
```

### 5.4 機能テスト
- [ ] ログインページアクセス
- [ ] 管理者アカウントでログイン
- [ ] 顧客データ作成・編集
- [ ] AI分析実行（30秒以内）
- [ ] マーケットデータ取得
- [ ] PDF/Excelエクスポート
- [ ] レスポンシブデザイン確認

## 📊 ステップ6: 監視・運用設定

### 6.1 Vercel Analytics
```bash
# Vercelダッシュボード → Analytics → Enable
```

### 6.2 アップタイム監視
```bash
# UptimeRobot設定
URL: https://insurance-optimizer.com
チェック間隔: 5分
アラート: メール通知
```

### 6.3 エラー監視（Sentry）
```javascript
// 環境変数にSentry DSNを設定
REACT_APP_SENTRY_DSN=your_sentry_dsn
```

## 🔒 セキュリティチェックリスト

- [ ] 初期管理者パスワード変更
- [ ] 環境変数の安全な管理
- [ ] HTTPS強制有効
- [ ] セキュリティヘッダー確認
- [ ] Rate Limiting設定
- [ ] CORS設定確認
- [ ] SQLインジェクション対策
- [ ] XSS対策

## 🆘 トラブルシューティング

### ビルドエラー
```bash
# キャッシュクリア
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Supabase接続エラー
- 環境変数が正しく設定されているか確認
- Supabaseダッシュボードでプロジェクトステータス確認
- RLSポリシーが正しく設定されているか確認

### Vercelデプロイエラー
```bash
# ログ確認
vercel logs

# 環境変数確認
vercel env ls
```

## 📞 サポート

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- プロジェクト固有の問題: admin@insurance-optimizer.com

## 🔄 デプロイ後のメンテナンス

### 定期バックアップ
```bash
# Supabaseダッシュボード → Backups
# 毎日自動バックアップを設定
```

### アップデート手順
1. ステージング環境でテスト
2. データベースバックアップ
3. メンテナンスモード有効化
4. デプロイ実行
5. 動作確認
6. メンテナンスモード解除

---

最終更新: 2024年1月15日
バージョン: 1.0.0