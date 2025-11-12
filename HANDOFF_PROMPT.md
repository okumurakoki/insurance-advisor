# Insurance Advisor System - 完全引き継ぎプロンプト

このプロジェクトは保険代理店向けの顧客管理・アドバイスシステムです。以下の情報を100%理解して作業を継続してください。

## 🎯 プロジェクト概要

**プロジェクト名**: Insurance Advisor (Prudential Insurance Optimizer)
**目的**: 保険代理店が顧客情報を管理し、変額保険の資産配分をAIでアドバイスするSaaSシステム

**デプロイ先**:
- Frontend: https://app.insurance-optimizer.com (Vercel)
- Backend API: https://api.insurance-optimizer.com (Vercel)
- Database: Supabase PostgreSQL

**ローカル開発**:
- Backend: `/Users/kohki_okumura/insurance-advisor/backend` (Port 3001)
- Frontend: `/Users/kohki_okumura/insurance-advisor/frontend` (Port 3000)

---

## 📁 プロジェクト構造

```
/Users/kohki_okumura/insurance-advisor/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── models/   # Database models
│   │   ├── utils/    # ユーティリティ
│   │   └── middleware/
│   ├── package.json
│   └── vercel.json
└── frontend/         # React SPA
    ├── src/
    ├── package.json
    └── vercel.json
```

---

## 🏗️ システムアーキテクチャ

### アカウント種別階層

1. **admin** - システム管理者(最上位)
2. **parent** - 代理店アカウント
3. **child** - 代理店の担当者(営業スタッフ)
4. **grandchild** - 顧客アカウント

### プラン体系 (代理店向け)

| プラン | 月額料金 | 担当者数上限 | 顧客数上限 | 備考 |
|--------|----------|-------------|-----------|------|
| **bronze** (ブロンズ) | 980円 | 1人 | 5人 | 基本プラン |
| **silver** (シルバー) | 1,980円 | 3人 | 30人 | 小規模代理店向け |
| **gold** (ゴールド) | 3,980円 | 10人 | 15人/担当者 | 中規模代理店向け |
| **platinum** (プラチナ) | 8,980円 | 30人 | 30人/担当者 | 大規模代理店向け |
| **exceed** (エクシード) | カスタム | カスタム | カスタム | 管理者が手動設定 |

**重要**:
- 代理店自身は **exceed プランを選択できない**(bronze/silver/gold/platinumのみ)
- 管理者は各代理店の月額料金を手動で変更可能(`custom_monthly_price`フィールド)

---

## 🗄️ データベーススキーマ

### users テーブル (重要カラム)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) CHECK(account_type IN ('admin', 'parent', 'child', 'grandchild')),
    plan_type VARCHAR(20) CHECK(plan_type IN ('bronze', 'silver', 'gold', 'platinum', 'exceed')),
    parent_id INTEGER REFERENCES users(id),

    -- プラン関連
    staff_limit INTEGER,                -- 担当者数上限
    customer_limit INTEGER,             -- 顧客数上限(総数)
    customer_limit_per_staff INTEGER,   -- 1担当者あたりの顧客数上限
    custom_monthly_price DECIMAL(10,2), -- カスタム月額料金(管理者が設定)

    -- Stripe関連(これから実装予定)
    payment_method VARCHAR(20),         -- 'card' or 'bank_transfer'
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### その他の主要テーブル

- **customers**: 顧客情報
- **plan_definitions**: プラン定義マスター
- **analysis_results**: 資産配分分析結果
- **market_data**: 市場データ(月次更新)

---

## 🔑 認証・認可

### JWT認証
- ヘッダー: `Authorization: Bearer <token>`
- トークンに含まれる情報: `{ id, userId, accountType, planType }`
- 有効期限: 24時間

### エンドポイント認可

- `/api/admin/*` - admin のみアクセス可
- `/api/users/agencies` - parent のみアクセス可
- 各ユーザーは自分の配下のデータのみ操作可能

---

## 📡 主要APIエンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register-agency` - 代理店登録(public)
- `POST /api/auth/register-staff` - 担当者登録(parent用)

### 管理者
- `GET /api/admin/agencies` - 全代理店取得
- `POST /api/admin/agencies` - 代理店作成
- `PUT /api/admin/agencies/:id/plan` - 代理店プラン更新
- `PUT /api/admin/agencies/:id/status` - 代理店有効/無効化

### 代理店
- `GET /api/users/my-agency` - 自分の代理店情報
- `POST /api/users/staff` - 担当者追加
- `GET /api/users/staff` - 担当者一覧

### 顧客管理
- `GET /api/customers` - 顧客一覧
- `POST /api/customers` - 顧客追加
- `PUT /api/customers/:id` - 顧客更新

### PDF処理
- `POST /api/pdf-upload` - 運用レポートPDFアップロード・解析

---

## 🎨 フロントエンド構造

### 主要ページ

1. `/login` - ログイン画面
2. `/dashboard` - ダッシュボード(全ユーザー共通)
3. `/admin/agencies` - 代理店管理(admin専用)
4. `/admin/agency-management` - 代理店詳細管理
5. `/my-agency` - 自分の代理店情報(parent用)
6. `/customers` - 顧客一覧
7. `/analysis` - 資産配分分析

### 技術スタック (Frontend)
- React 18
- React Router v6
- Axios
- Chart.js (グラフ表示用)

---

## ⚙️ バックエンド技術スタック

- **Node.js** + **Express.js**
- **PostgreSQL** (Supabase経由)
- **pg** (PostgreSQLクライアント)
- **bcryptjs** (パスワードハッシュ)
- **jsonwebtoken** (JWT認証)
- **multer** (ファイルアップロード)
- **pdf-parse** (PDF解析)
- **stripe** (決済・サブスクリプション管理) **← 現在実装中**

---

## 🚀 デプロイ

### Vercel設定

**Backend (`backend/vercel.json`)**:
```json
{
  "version": 2,
  "functions": {
    "api/**/*": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

### 環境変数 (Vercel)

**Backend**:
- `DATABASE_URL` - Supabase PostgreSQL接続文字列
- `JWT_SECRET` - JWT署名用シークレット
- `NODE_ENV=production`
- `STRIPE_SECRET_KEY` (実装予定)
- `STRIPE_WEBHOOK_SECRET` (実装予定)

**Frontend**:
- `REACT_APP_ENV=production`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

---

## 🔄 Git管理

**現在のコミット**: `267277a` - "Remove 13 unused API endpoints to improve code maintainability"

**重要な過去の経緯**:
- LINE Webhook機能を実装したが、ログイン機能が壊れたため完全ロールバックを実施
- `git reset --hard 267277a` で元の状態に戻した
- **LINE関連コードは現在すべて削除済み**

**デプロイフロー**:
```bash
# Backend
cd /Users/kohki_okumura/insurance-advisor/backend
git add .
git commit -m "commit message"
git push origin main
vercel --prod --yes

# Frontend
cd /Users/kohki_okumura/insurance-advisor/frontend
git add .
git commit -m "commit message"
git push origin main
vercel --prod --yes
```

---

## 🛠️ 現在進行中のタスク

### Stripe決済統合 (進行中)

**目標**:
1. 代理店の月額サブスクリプション管理
2. クレジットカード決済と銀行振込の選択
3. プラン変更時の差額請求(proration)

**実装状況**:
- [x] `stripe` パッケージインストール完了
- [ ] usersテーブルに`payment_method`, `stripe_customer_id`, `stripe_subscription_id`追加
- [ ] Stripeサービスモジュール作成
- [ ] `/api/stripe/create-checkout-session` エンドポイント
- [ ] `/api/stripe/webhook` エンドポイント
- [ ] `/api/stripe/create-portal-session` エンドポイント
- [ ] 管理画面で支払い方法を設定可能に
- [ ] 代理店自身がプラン変更可能に(exceedプランは除外)

**Stripe実装の要件**:
1. 月額料金は`custom_monthly_price`または`plan_definitions.monthly_price`から取得
2. 代理店は自分でbronze/silver/gold/platinumにプラン変更可能
3. プラン変更時に料金が増えた場合は即座に差額請求
4. 管理者は各代理店の`custom_monthly_price`を手動変更可能
5. 支払い方法は「クレカ」と「銀行振込」の2択

---

## 📝 コーディング規約

### バックエンド
- エラーハンドリングは必ずtry-catch
- ログは`logger.info()`, `logger.error()`を使用
- SQLインジェクション対策: パラメータ化クエリ必須
- 認証必須エンドポイントには`authenticateToken`ミドルウェア

### フロントエンド
- コンポーネントはfunctional component
- API呼び出しは`async/await`
- エラーは`alert()`または`console.error()`で表示

---

## 🐛 過去のトラブルと解決策

### 1. LINE Webhook実装後のログイン破損
**問題**: LINE機能実装後、`POST /api/auth/login`が500/404エラー
**原因**: データベースアダプター(`database-supabase.js`)の誤実装
**解決**: `git reset --hard 267277a`で完全ロールバック

### 2. Vercelデプロイ時のルーティング問題
**問題**: `/api/*`へのリクエストが404
**解決**: `vercel.json`の`rewrites`設定で`/(.*)`を`/api/index`にルーティング

### 3. Supabase接続タイムアウト
**問題**: Cold startでDB接続タイムアウト
**解決**: `connectionTimeoutMillis: 20000`に設定

---

## 🔐 重要なセキュリティ事項

1. **パスワード**: bcryptで必ずハッシュ化(salt rounds: 10)
2. **JWT**: `JWT_SECRET`は環境変数で管理
3. **SQL**: 必ずパラメータ化クエリ使用
4. **CORS**: フロントエンドドメインからのアクセスのみ許可
5. **認可**: 必ず`req.user`で権限チェック

---

## 📞 連絡先・参考情報

- **Supabase Project**: `skqzxkdwzxjsonkwoeua.supabase.co`
- **Vercel Projects**:
  - `prudential-insurance-optimizer-api` (backend)
  - `prudential-insurance-optimizer-frontend` (frontend)

---

## ✅ 次のClaude Codeセッションでの最初のステップ

このプロンプトを読んだら、以下を確認してください:

1. 現在のGitコミット位置: `git log --oneline -5`
2. デプロイ状態: `vercel ls`
3. 未完了タスク: TodoListを確認
4. ログイン機能が正常動作するか: https://app.insurance-optimizer.com/ でテスト

**最重要**:
- コード変更前に必ず現在のGit状態を確認
- デプロイ前に必ずローカルでテスト
- 大きな変更の前にユーザーに確認
- 絶対にLINE関連コードを追加しない(ユーザーが明示的に依頼しない限り)

---

## 🎓 プロジェクト固有の用語

- **代理店** = parent アカウント
- **担当者** = child アカウント (代理店の営業スタッフ)
- **顧客** = grandchild アカウント
- **プラン** = 代理店の契約プラン(bronze/silver/gold/platinum/exceed)
- **エクシード** = カスタム設定可能な特別プラン(管理者のみ設定可)

---

**このプロンプトを100%理解して、前任者(私)の作業を完璧に引き継いでください!**
