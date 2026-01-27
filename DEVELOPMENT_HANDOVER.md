# Insurance Advisor - 開発引き継ぎドキュメント

**最終更新**: 2025年12月14日
**プロジェクトパス**: `/Users/kohki_okumura/insurance-advisor/`

---

## 1. プロジェクト概要

変額保険の運用最適化アドバイザリーシステム。保険代理店が顧客の変額保険ポートフォリオを管理・分析するためのSaaS。

### 本番環境URL
- **フロントエンド**: https://app.insurance-optimizer.com
- **バックエンドAPI**: https://api.insurance-optimizer.com
- **Vercelダッシュボード**: https://vercel.com/kokiokumuras-projects

---

## 2. 技術スタック

### バックエンド (`/backend/`)
- **Node.js + Express**
- **PostgreSQL** (Supabase)
- **Stripe** (決済)
- **デプロイ**: Vercel Serverless

### フロントエンド (`/frontend/`)
- **React 18 + TypeScript**
- **Material UI (MUI) v5**
- **Chart.js / Recharts** (グラフ)
- **デプロイ**: Vercel

### データベース
- **Supabase PostgreSQL** (無料プラン - アイドル時に一時停止される)
- 接続情報: Vercel環境変数 `DATABASE_URL`

---

## 3. 現在の状態

### 完了している機能
1. **ユーザー認証** (JWT)
   - 代理店(parent) / 担当者(child) / 顧客(grandchild) / 管理者(admin)の4層構造

2. **Stripe決済連携**
   - 代理店登録時のサブスクリプション決済
   - 料金計算: 基本料金 × 契約保険会社数
   - プラン: Bronze(980円), Silver(1,980円), Gold(3,980円), Platinum(8,980円)
   - Webhookでアカウント自動有効化

3. **代理店登録フロー** (3ステップ)
   - ステップ1: アカウント情報入力
   - ステップ2: 取り扱い保険会社選択
   - ステップ3: プラン選択 → Stripe決済

4. **PDFアップロード・解析**
   - 保険会社のファンドレポートPDFをアップロード
   - 自動解析してファンドパフォーマンスデータ抽出
   - 対応: ソニー生命SOVANI, アクサ生命, プルデンシャル生命等

5. **顧客管理・分析機能**
   - 顧客情報登録
   - ポートフォリオ配分表示（Pieチャート）

### 現在の環境変数（テストモード中）
```
STRIPE_SECRET_KEY=sk_test_... (テストキー)
STRIPE_WEBHOOK_SECRET=whsec_t3LVqhSmSyiHaX7Er5qY0ywnXJMMhoCo (テスト用)
```

**重要**: 本番移行時は本番キーに戻す必要あり

---

## 4. 次に実装すべき機能

### 優先度1: シミュレーション機能
**目的**: 営業時に顧客へ将来の運用予測を見せる

#### バックエンド実装
ファイル: `backend/src/routes/simulation.js` (新規作成)

**API仕様**:
```
GET /api/simulation/funds
- シミュレーション可能なファンド一覧

GET /api/simulation/fund/:id/performance
- 特定ファンドの過去パフォーマンス

POST /api/simulation/run
Body: {
  initialAmount: number,    // 初期投資額
  monthlyPremium: number,   // 月額保険料
  years: number,            // 運用年数
  fundId?: number,          // ファンドID
  customReturn?: number,    // カスタム期待リターン
  customVolatility?: number // カスタムボラティリティ
}

GET /api/simulation/presets
- プリセット（安定型/バランス型/成長型/積極型）
```

**計算ロジック**:
- モンテカルロシミュレーション（1000回）
- 過去データから年間リターン・ボラティリティを算出
- 5%/25%/50%/75%/95%パーセンタイルで表示

#### フロントエンド実装
ファイル: `frontend/src/pages/Simulation.tsx` (新規作成)

**UI要素**:
- 入力フォーム: 初期投資額、月額保険料、運用年数、ファンド選択
- 結果表示: 上振れ/平均/下振れシナリオ
- 年次推移チャート（Recharts LineChart使用）
- 結果のPDF出力機能

### 優先度2: UIのビジネスライク改善
- ダッシュボードをカード型レイアウトに
- 統一感のあるMUIテーマ設定
- 時系列チャートの追加

---

## 5. データベーススキーマ（主要テーブル）

```sql
-- ユーザー
users (id, user_id, password_hash, account_type, plan_type, parent_id,
       stripe_customer_id, stripe_subscription_id, is_active, ...)

-- プラン定義
plan_definitions (plan_type, plan_name, monthly_price, staff_limit,
                  customer_limit, customer_limit_per_staff, description)

-- 保険会社
insurance_companies (id, company_code, company_name, display_name, is_active)

-- 代理店の契約保険会社
agency_insurance_companies (id, user_id, company_id, is_active,
                            contract_start_date, contract_end_date)

-- 特別勘定（ファンド）
special_accounts (id, company_id, account_code, account_name, account_type, is_active)

-- ファンドパフォーマンス
special_account_performance (id, special_account_id, performance_date,
                             unit_price, return_1m, return_3m, return_6m, return_1y)

-- 顧客
customers (id, user_id, name, email, phone, contract_date,
           contract_amount, monthly_premium, risk_tolerance, ...)

-- 市場データ（PDFアップロード結果）
market_data (id, data_date, fund_id, data_content JSONB, ...)
```

---

## 6. 主要ファイル構成

### バックエンド
```
backend/
├── src/
│   ├── app.js              # Express設定、ルーティング
│   ├── routes/
│   │   ├── auth.js         # 認証・登録
│   │   ├── stripe.js       # Stripe決済
│   │   ├── analysis.js     # 分析・市場データ
│   │   ├── insurance.js    # 保険会社情報
│   │   ├── admin.js        # 管理機能
│   │   └── simulation.js   # 【新規作成】シミュレーション
│   ├── services/
│   │   └── stripe.js       # Stripeサービスクラス
│   ├── utils/
│   │   ├── database-postgres.js  # DB接続
│   │   ├── database-factory.js   # DB切り替え
│   │   └── pdfParser.js          # PDF解析
│   └── middleware/
│       └── auth.js         # JWT認証ミドルウェア
└── vercel.json
```

### フロントエンド
```
frontend/
├── src/
│   ├── App.tsx             # メインアプリ（157KB、大きい）
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── CustomerList.tsx
│   │   ├── CustomerDetail.tsx
│   │   ├── MarketData.tsx
│   │   ├── AgencyRegister.tsx
│   │   ├── AgencySettings.tsx
│   │   └── Simulation.tsx  # 【新規作成】
│   ├── services/
│   │   └── api.ts          # APIクライアント
│   └── components/
│       └── Layout.tsx
└── vercel.json
```

---

## 7. デプロイ手順

### バックエンド
```bash
cd /Users/kohki_okumura/insurance-advisor/backend
vercel --prod
```

### フロントエンド
```bash
cd /Users/kohki_okumura/insurance-advisor/frontend
npm run build && vercel --prod
```

---

## 8. 注意事項

### Supabase無料プラン
- アイドル状態が続くと**自動一時停止**される
- 復元: https://supabase.com/dashboard → プロジェクト → "Restore project"
- 復元には数分かかる

### DB接続リトライ
`database-postgres.js`に接続リトライロジック実装済み（MAX_RETRIES=2）

### Stripe本番移行時
1. Vercel環境変数を変更:
   - `STRIPE_SECRET_KEY` → 本番キー (`sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` → 本番Webhookシークレット
2. バックエンドを再デプロイ

### エラーメッセージ
`auth.js`のエラーメッセージは日本語化済み

---

## 9. 開発再開時のコマンド

```bash
# プロジェクトディレクトリへ移動
cd /Users/kohki_okumura/insurance-advisor

# バックエンド起動（ローカル開発）
cd backend && npm run dev

# フロントエンド起動（ローカル開発）
cd frontend && npm start

# API動作確認
curl https://api.insurance-optimizer.com/api/health
curl https://api.insurance-optimizer.com/api/stripe/available-plans
```

---

## 10. 次のチャットへの指示

以下の順序で実装を進めてください：

1. **シミュレーションAPI作成** (`backend/src/routes/simulation.js`)
   - モンテカルロシミュレーション実装
   - 過去ファンドデータからリターン・ボラティリティ計算

2. **シミュレーション画面作成** (`frontend/src/pages/Simulation.tsx`)
   - 入力フォーム（初期投資額、月額保険料、年数、ファンド選択）
   - 結果表示（上振れ/平均/下振れ）
   - Rechartsで年次推移グラフ

3. **UIビジネスライク化**
   - ダッシュボードのカード型レイアウト
   - MUIテーマの統一

4. **本番移行**
   - StripeキーをLiveに変更
   - 最終テスト
