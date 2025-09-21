# Supabase Edge Functions デプロイメントガイド

## 1. Supabase CLI セットアップ

```bash
# Supabase CLI インストール (if not already installed)
npm install -g supabase

# プロジェクトの初期化
supabase init

# ログイン
supabase login
```

## 2. Edge Function デプロイ手順

### 方法1: CLI経由でデプロイ
```bash
cd /Users/kohki_okumura/insurance-advisor

# リモートプロジェクトにリンク
supabase link --project-ref cqjxcfchrsjllyhsqawu

# Edge Functionをデプロイ
supabase functions deploy server

# 環境変数を設定
supabase secrets set ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### 方法2: Supabase Dashboard経由（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `cqjxcfchrsjllyhsqawu` を選択
3. 左メニューから "Edge Functions" を選択
4. "Create a new function" をクリック
5. Function name: `server`
6. `/Users/kohki_okumura/insurance-advisor/supabase/functions/server/index.ts` の内容をコピー&ペースト
7. "Deploy function" をクリック

## 3. 環境変数設定

Supabase Dashboard > Settings > Environment variables で設定:

```
ALPHA_VANTAGE_API_KEY=your_actual_api_key
NODE_ENV=production
```

## 4. Edge Function エンドポイント

デプロイ後、以下のエンドポイントが利用可能:

- **ヘルスチェック**: `GET /functions/v1/server/ping`
- **デバッグ情報**: `GET /functions/v1/server/debug`
- **市場データ取得**: `GET /functions/v1/server/market-data/real-time`
- **顧客データ**: `GET /functions/v1/server/customers`
- **レポート生成**: `POST /functions/v1/server/generate-report-pdf`

## 5. フロントエンド設定

`/Users/kohki_okumura/insurance-advisor/frontend/src/services/api.ts` で、
SUPABASE_FUNCTIONS_URL を実際のプロジェクトURLに更新済み:

```typescript
const SUPABASE_FUNCTIONS_URL = 'https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server';
```

## 6. テスト手順

### API エンドポイントテスト
```bash
# ヘルスチェック
curl https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server/ping

# デバッグ情報取得
curl https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server/debug

# 市場データ取得（Alpha Vantage API Key必要）
curl https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server/market-data/real-time
```

### フロントエンドテスト
1. `npm run build` でアプリケーションをビルド
2. `npm run start` でローカル開発サーバー起動
3. ログイン後、ダッシュボードで市場データ表示を確認
4. 顧客分析機能でPDF分析をテスト
5. レポート生成機能をテスト

## トラブルシューティング

### CORS エラーが発生する場合
Edge Function の corsHeaders 設定を確認:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

### 環境変数が読み込まれない場合
Supabase Dashboard > Settings > Environment variables で設定を確認

### Edge Function がデプロイできない場合
- Supabase CLI のバージョン確認
- プロジェクトリンクの確認 (`supabase status`)
- 構文エラーのチェック (TypeScript)