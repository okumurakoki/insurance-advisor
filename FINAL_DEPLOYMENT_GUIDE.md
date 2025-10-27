# 🏦 変額保険最適化システム - 完全デプロイメントガイド

## 📋 システム概要

Figma仕様に基づいて完全実装されたAI搭載保険アドバイザリーシステム

### 主要機能
- ✅ JWT認証システム
- ✅ 顧客管理(CRUD)
- ✅ AI分析エンジン
- ✅ PDF分析機能
- ✅ 市場データ取得(Alpha Vantage)
- ✅ レポート生成(PDF/HTML)
- ✅ レスポンシブUI(Material-UI)

## 🚀 デプロイメント手順

### 1. Supabase Edge Functions デプロイ

#### 方法A: Supabase Dashboard（推奨）
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト選択 (ID: `cqjxcfchrsjllyhsqawu`)
3. Edge Functions → "Create a new function"
4. Function name: `server`
5. ファイル内容をコピー: `/supabase/functions/server/index.ts`
6. "Deploy function" をクリック

#### 方法B: CLI経由
```bash
cd /Users/kohki_okumura/insurance-advisor

# Supabase CLI インストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトリンク
supabase link --project-ref cqjxcfchrsjllyhsqawu

# デプロイ
supabase functions deploy server
```

### 2. 環境変数設定

Supabase Dashboard > Settings > Environment variables:
```
ALPHA_VANTAGE_API_KEY=your_actual_api_key
NODE_ENV=production
```

### 3. Alpha Vantage API キー取得

1. [Alpha Vantage](https://www.alphavantage.co/support/#api-key) でAPIキー取得
2. 無料プラン: 1日25リクエスト制限
3. テスト用: `ALPHA_VANTAGE_API_KEY=demo` も利用可能

### 4. フロントエンドデプロイ

#### Vercel デプロイ
```bash
cd /Users/kohki_okumura/insurance-advisor/frontend

# 環境変数設定
cp .env.local.example .env.local
# .env.local を編集してAPIキーを設定

# ビルド確認
npm run build

# Vercel デプロイ
npx vercel --prod
```

#### 環境変数 (Vercel Dashboard)
```
REACT_APP_SUPABASE_URL=https://cqjxcfchrsjllyhsqawu.supabase.co
REACT_APP_FUNCTIONS_URL=https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server
REACT_APP_API_BASE_URL=https://api.insurance-optimizer.com/api
```

### 5. バックエンドAPI デプロイ

```bash
cd /Users/kohki_okumura/insurance-advisor/backend

# 環境変数設定
cp production.env.example .env
# DATABASE_URL, JWT_SECRET等を設定

# Vercel デプロイ
npx vercel --prod
```

## 🧪 テスト手順

### 1. Edge Functions テスト

テストページを開く:
```bash
open /Users/kohki_okumura/insurance-advisor/test-edge-functions.html
```

または直接APIテスト:
```bash
# ヘルスチェック
curl https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server/ping

# 市場データ取得
curl https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server/market-data/real-time
```

### 2. フロントエンド機能テスト

1. **ログイン機能**
   - URL: https://app.insurance-optimizer.com/login
   - テストアカウント: `admin` / `password123`

2. **ダッシュボード**
   - 市場データ表示確認
   - 統計情報表示確認

3. **顧客管理**
   - 新規顧客登録
   - 顧客一覧表示
   - 顧客詳細編集

4. **分析機能**
   - PDF分析アップロード
   - AI分析実行
   - 結果表示

5. **レポート生成**
   - PDF生成テスト
   - エクスポート機能

### 3. 統合テスト

```bash
# フロントエンド開発サーバー起動
cd /Users/kohki_okumura/insurance-advisor/frontend
npm start

# ブラウザで http://localhost:3000 にアクセス
# 全機能の動作確認
```

## 📊 システム構成

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Edge Functions │    │   Database      │
│   (React/TS)    ├────┤   (Supabase)     ├────┤   (PostgreSQL)  │
│   Vercel        │    │   Deno Runtime   │    │   Supabase      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌──────────────────┐               │
         └──────────────┤   Backend API    ├───────────────┘
                        │   (Node.js)      │
                        │   Vercel         │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   External APIs  │
                        │   Alpha Vantage  │
                        └──────────────────┘
```

## 🔧 トラブルシューティング

### CORS エラー
- Edge Function の corsHeaders 設定確認
- ドメイン設定確認

### 認証エラー
- JWT_SECRET 設定確認
- データベース接続確認

### 市場データ取得エラー
- Alpha Vantage API キー確認
- レート制限確認

### ビルドエラー
- TypeScript型定義確認
- 依存関係確認

## 📁 ファイル構成

```
/Users/kohki_okumura/insurance-advisor/
├── frontend/                  # React TypeScript アプリ
│   ├── src/
│   │   ├── components/       # UI コンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # API サービス
│   │   └── types/           # TypeScript 型定義
│   └── package.json
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── models/          # データモデル
│   │   ├── routes/          # API ルート
│   │   └── services/        # ビジネスロジック
│   └── package.json
├── supabase/
│   ├── functions/server/    # Edge Functions
│   └── migrations/          # DB マイグレーション
├── SUPABASE_DEPLOYMENT.md   # Supabase デプロイガイド
├── API_KEYS_SETUP.md        # API キー設定ガイド
└── test-edge-functions.html # テストページ
```

## ✅ 完成チェックリスト

- [ ] Supabase Edge Functions デプロイ完了
- [ ] Alpha Vantage API キー設定完了
- [ ] フロントエンド Vercel デプロイ完了
- [ ] バックエンド API デプロイ完了
- [ ] 認証機能動作確認完了
- [ ] 顧客管理機能動作確認完了
- [ ] 分析機能動作確認完了
- [ ] PDF生成機能動作確認完了
- [ ] 市場データ取得動作確認完了

## 🎯 次のステップ

1. **本番データ投入**: 実際の顧客データでテスト
2. **パフォーマンス最適化**: 大量データでの動作確認
3. **セキュリティ監査**: 認証・認可の詳細確認
4. **ユーザートレーニング**: 操作マニュアル作成
5. **監視設定**: エラーログ・パフォーマンス監視

変額保険最適化システムの完全実装が完了しました！🎉