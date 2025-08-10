# 変額保険アドバイザリーシステム デプロイメントガイド

## 必要な手順

### 1. GitHub リポジトリの作成
1. https://github.com にログイン
   - ユーザー名: `okumurakoki`
   - パスワード: `Kohki040108`
2. "New repository" をクリック
3. Repository name: `insurance-advisor`
4. Public に設定
5. README で初期化しない
6. "Create repository" をクリック

### 2. コードのプッシュ
```bash
git push -u origin main
```

### 3. Supabase データベースの設定
1. https://supabase.com にアクセス
2. GitHub アカウントでログイン
3. "New Project" をクリック
4. プロジェクト名: `insurance-advisor`
5. データベースパスワードを設定
6. プロジェクトが作成されたら、Settings > Database でURL を確認
7. Query Editor で以下のSQLを実行:

```sql
-- docs/database-schema.sql の内容を実行
-- docs/init-dev-data.sql の内容を実行（デモデータ）
```

### 4. Vercel バックエンドデプロイ
1. https://vercel.com にアクセス
2. GitHub アカウントでログイン  
3. "Add New Project"
4. GitHubリポジトリから `insurance-advisor` を選択
5. Root Directory: `backend` を指定
6. Environment Variables を追加:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Supabase の接続URL
   - `JWT_SECRET`: ランダムな文字列
   - `LINE_CHANNEL_ACCESS_TOKEN`: LINEから取得
   - `LINE_CHANNEL_SECRET`: `5d156a9c9db2a8cf36ae21f4e005afc6`
   - `FRONTEND_URL`: フロントエンドのURL（後で設定）

### 5. Vercel フロントエンドデプロイ
1. Vercel で新しいプロジェクトを作成
2. 同じGitHubリポジトリを選択
3. Root Directory: `frontend` を指定
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: バックエンドのURL

### 6. LINE Bot の設定
1. LINE Developers Console にアクセス
2. Webhook URL: `https://your-backend-url.vercel.app/api/line/webhook`
3. Webhook の利用: ON
4. 応答メッセージ: OFF

### 7. カスタムドメイン（推奨）
- Cloudflare でドメインを取得
- Vercel でカスタムドメインを設定

## デモアカウント

### 代理店（Parent）
- ユーザーID: `demo-agency`
- パスワード: `agency123`
- プラン: Master (50顧客まで)

### 生保担当者（Child）
- ユーザーID: `demo-agent`
- パスワード: `agent123`
- 親アカウント: demo-agency

### 顧客（Grandchild）
- ユーザーID: `demo-customer`
- パスワード: `customer123`
- 親アカウント: demo-agent

## 環境変数チェックリスト

### Backend
- [x] NODE_ENV=production
- [x] DATABASE_URL (Supabase)
- [x] JWT_SECRET
- [x] LINE_CHANNEL_ACCESS_TOKEN
- [x] LINE_CHANNEL_SECRET
- [x] FRONTEND_URL

### Frontend  
- [x] NEXT_PUBLIC_API_URL

## デプロイ後の確認

1. バックエンドヘルスチェック: `https://your-backend.vercel.app/health`
2. フロントエンドアクセス: `https://your-frontend.vercel.app`
3. LINE Bot webhook テスト
4. デモアカウントでのログインテスト