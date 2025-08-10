# 🚀 本番環境セットアップガイド

## 📋 必要なサービス・アカウント

### 1. GitHub Repository
- Private repository を作成
- Secrets 設定が必要

### 2. Vercel Account
- Frontend と Backend の2つのプロジェクト作成
- Environment Variables 設定

### 3. Supabase PostgreSQL
- データベースインスタンス作成
- Connection string 取得

### 4. LINE Developers
- LINE Bot チャンネル作成
- Webhook URL設定

### 5. Domain & DNS
- カスタムドメイン取得
- Cloudflare などでDNS設定

---

## 🔧 セットアップ手順

### Step 1: GitHub Repository 作成

```bash
# リポジトリ作成・プッシュ
git init
git add .
git commit -m "Initial commit: Insurance Advisory System"
git branch -M main
git remote add origin https://github.com/yourusername/insurance-advisor.git
git push -u origin main
```

**GitHub Secrets 設定:**
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=backend_project_id
VERCEL_FRONTEND_PROJECT_ID=frontend_project_id
REACT_APP_API_URL=https://your-api-domain.vercel.app/api
```

### Step 2: Supabase セットアップ

1. [Supabase](https://supabase.com) でプロジェクト作成
2. PostgreSQL URL をコピー
3. データベース接続テスト

```bash
# 接続確認
psql "your-postgres-connection-string"
```

### Step 3: Vercel Backend デプロイ

**Environment Variables 設定:**
```env
DATABASE_URL=your_supabase_postgres_url
JWT_SECRET=your_super_secure_jwt_secret_64_characters_minimum_length_string
BCRYPT_ROUNDS=12
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
NOTEBOOK_LM_API_KEY=your_notebooklm_api_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

**デプロイコマンド:**
```bash
cd backend
vercel --prod
```

### Step 4: Vercel Frontend デプロイ

**Environment Variables 設定:**
```env
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
REACT_APP_ENV=production
```

**デプロイコマンド:**
```bash
cd frontend
npm run build
vercel --prod
```

### Step 5: LINE Bot セットアップ

**LINE Developers Console:**
1. チャンネル作成 (Messaging API)
2. Webhook URL設定: `https://your-backend-domain.vercel.app/api/line/webhook`
3. Channel Access Token をコピー
4. 友達追加用QRコード生成

**Webhook エンドポイント作成:**

```javascript
// backend/src/routes/line.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const LineService = require('../services/line.service');

router.post('/webhook', (req, res) => {
    const body = JSON.stringify(req.body);
    const signature = crypto
        .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET)
        .update(body)
        .digest('base64');

    if (signature !== req.headers['x-line-signature']) {
        return res.status(401).end();
    }

    const events = req.body.events;
    events.forEach(handleEvent);
    
    res.status(200).end();
});

async function handleEvent(event) {
    if (event.type === 'postback') {
        await handlePostback(event);
    } else if (event.type === 'message') {
        await handleMessage(event);
    }
}

module.exports = router;
```

### Step 6: カスタムドメイン設定

**DNS Records (Cloudflare example):**
```
# Frontend
CNAME   www              your-frontend.vercel.app
CNAME   insurance-app    your-frontend.vercel.app

# Backend API  
CNAME   api              your-backend.vercel.app
```

**Vercel Domain 設定:**
- Frontend Project → Settings → Domains
- Backend Project → Settings → Domains

---

## 🔑 デモアカウント情報

### 本番用階層アカウント

#### 親アカウント（代理店）
```
ユーザーID: agency001
パスワード: Agency@2024!
URL: https://your-domain.com/login
```

#### 子アカウント（担当者）
```
# 田中担当者
ユーザーID: agent_tanaka  
パスワード: Agent@2024!
担当エリア: 東京都内

# 佐藤担当者
ユーザーID: agent_sato
パスワード: Agent@2024!  
担当エリア: 神奈川県内
```

#### 孫アカウント（顧客）
```
# 山田太郎様
ユーザーID: customer_yamada
パスワード: Customer@2024!
LINE: 友達追加後に自動連携

# 高橋花子様  
ユーザーID: customer_takahashi
パスワード: Customer@2024!
LINE: 友達追加後に自動連携
```

---

## 📱 LINE Bot 機能

### 顧客向け機能
- 📊 **分析レポート配信**: 毎月自動送信
- 🔄 **リスク変更依頼**: ボタンで簡単変更申請
- 📈 **運用状況確認**: いつでも最新状況を確認
- 💬 **担当者連絡**: 直接メッセージ送信

### 担当者向け機能
- 🚨 **変更依頼通知**: 顧客からのリクエスト即座に通知
- 📋 **担当顧客管理**: LINE上で顧客情報確認
- ⏰ **分析リマインダー**: 定期分析のお知らせ

### 管理者向け機能
- 📊 **全体統計**: システム利用状況の把握
- 👥 **アカウント管理**: 子・孫アカウントの管理
- 🔧 **システム設定**: プラン変更・機能制御

---

## 🛡️ セキュリティ設定

### 環境変数の管理
```bash
# 本番環境では必須
JWT_SECRET=minimum_64_characters_super_secure_random_string_for_production
BCRYPT_ROUNDS=12
DATABASE_URL=postgresql://encrypted_connection_string
```

### CORS設定
```javascript
app.use(cors({
    origin: [
        'https://your-domain.com',
        'https://www.your-domain.com'
    ],
    credentials: true
}));
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: 'Too many requests'
});
```

---

## 📈 監視・運用

### ヘルスチェック
- **Frontend**: `https://your-domain.com/health`  
- **Backend**: `https://api.your-domain.com/health`

### ログ監視
- Vercel Function Logs
- Supabase Database Logs  
- LINE Webhook Logs

### バックアップ
- Supabase 自動バックアップ
- 定期的なデータエクスポート

---

## 🚀 デプロイフロー

### 自動デプロイ
1. `main` ブランチにプッシュ
2. GitHub Actions が自動実行
3. テスト → ビルド → デプロイ
4. Vercel で本番環境更新

### 手動デプロイ
```bash
# Backend
cd backend && vercel --prod

# Frontend  
cd frontend && npm run build && vercel --prod
```

### ロールバック
```bash
vercel rollback [deployment-url]
```

---

## 📞 運用サポート

### 緊急時対応
- Vercel Dashboard でインスタント監視
- Supabase でデータベース状態確認
- LINE Webhook ログで連携状況確認

### 定期メンテナンス
- 月次: データベース最適化
- 四半期: セキュリティパッチ適用
- 半年: 機能アップデート

システムの準備が完了したら、ドメインとデプロイ設定をお知らせください！