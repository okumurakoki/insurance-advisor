# 代理店管理システム 実装サマリー

## 実装完了した機能

### 1. プラン体系

| プラン名 | 月額料金 | 担当者数 | 顧客数 |
|---------|---------|---------|--------|
| ブロンズ | 980円 | 1人まで | 5人まで（全体） |
| シルバー | 1980円 | 3人まで | 30人まで（全体） |
| ゴールド | 3980円 | 10人まで | 15人/担当者 |
| プラチナ | 8980円 | 30人まで | 30人/担当者 |
| エクシード | 相談 | **カスタム** | **カスタム** |

**エクシードプランの特徴:**
- 管理者が担当者数・顧客数を自由に設定可能
- 代理店ごとに異なる制限値を設定できます

---

## 2. 利用フロー

### 代理店の開始まで
1. **顧客が決済を完了**（外部決済システム）
2. **管理者が代理店権限を付与**
   - 管理者画面から代理店アカウントを作成
   - プランを選択（ブロンズ〜エクシード）
   - エクシードの場合、担当者数・顧客数をカスタム設定
3. **代理店が担当者IDとパスワードを決めて新規登録**
   - `POST /api/auth/register` に `agencyUserId` なしで登録
   - ログイン可能になる

### 担当者の追加
1. **代理店が担当者を追加したい場合**
2. **担当者に代理店IDを教える**
3. **担当者が自分のIDとパスワードを決めて新規登録**
   - `POST /api/auth/register` に `agencyUserId` を指定
   - プラン制限を自動チェック（担当者数上限）

### 顧客の追加
1. **担当者が顧客を追加したい場合**
2. **顧客に担当者IDを教える**
3. **顧客が自分のIDとパスワードを決めて新規登録**
   - `POST /api/auth/register` に `staffUserId` を指定
   - プラン制限を自動チェック（顧客数上限）

---

## 3. API エンドポイント

### 管理者用API（`/api/admin`）

#### 代理店管理
```bash
# 代理店を作成
POST /api/admin/agencies
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": "agency001",
  "password": "password123",
  "planType": "exceed",
  "customStaffLimit": 50,           // エクシードプランの場合のみ
  "customCustomerLimitPerStaff": 100 // エクシードプランの場合のみ
}

# 全代理店を取得
GET /api/admin/agencies
Authorization: Bearer {admin_token}

# 代理店のプランを更新
PUT /api/admin/agencies/{id}/plan
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "planType": "platinum",
  "customStaffLimit": 100,           // エクシードの場合のみ
  "customCustomerLimitPerStaff": 200 // エクシードの場合のみ
}

# 代理店を有効化/無効化（支払い停止時）
PUT /api/admin/agencies/{id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "isActive": false  // false = 利用停止
}

# プラン一覧を取得
GET /api/admin/plans
Authorization: Bearer {admin_token}

# システム統計を取得
GET /api/admin/stats
Authorization: Bearer {admin_token}
```

### 認証API（`/api/auth`）

#### ログイン
```bash
POST /api/auth/login
Content-Type: application/json

{
  "userId": "user001",
  "password": "password123",
  "accountType": "parent"  // parent, child, grandchild, admin
}
```

#### 新規登録

**担当者登録（childアカウント）:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "userId": "staff001",
  "password": "password123",
  "accountType": "child",
  "agencyUserId": "agency001"  // 代理店ID（必須）
}
```

**顧客登録（grandchildアカウント）:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "userId": "customer001",
  "password": "password123",
  "accountType": "grandchild",
  "staffUserId": "staff001"  // 担当者ID（必須）
}
```

---

## 4. プラン制限の仕組み

### ブロンズ・シルバープラン
- **代理店全体**で顧客数を制限
- 例: シルバープラン（30人まで）の場合、担当者3人で合計30人まで

### ゴールド・プラチナプラン
- **担当者ごと**に顧客数を制限
- 例: ゴールドプラン（15人/担当者）の場合、担当者10人×15人＝最大150人

### エクシードプラン
- 管理者が代理店ごとに自由に設定
- 担当者数: `customStaffLimit`で指定
- 顧客数: `customCustomerLimitPerStaff`で指定（担当者ごと）

---

## 5. 支払い管理

### 決済システムとの連携
- **決済は外部システムで管理**（このアプリでは決済処理なし）
- 決済確認後、管理者が手動で代理店権限を付与

### 支払い停止時
```bash
# 管理者が代理店を無効化
PUT /api/admin/agencies/{id}/status
{
  "isActive": false
}
```
→ 代理店・担当者・顧客すべてログイン不可になります

### 再開時
```bash
# 管理者が代理店を有効化
PUT /api/admin/agencies/{id}/status
{
  "isActive": true
}
```

---

## 6. プラン変更・解約

### プラン変更
1. 顧客が管理者LINEに連絡
2. 管理者が `PUT /api/admin/agencies/{id}/plan` でプラン更新

### 解約
1. 顧客が管理者LINEに連絡
2. 管理者が `PUT /api/admin/agencies/{id}/status` で無効化

---

## 7. データベース構造

### usersテーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| id | SERIAL | 主キー |
| user_id | VARCHAR | ログインID（ユニーク） |
| password_hash | VARCHAR | ハッシュ化パスワード |
| account_type | VARCHAR | admin, parent, child, grandchild |
| plan_type | VARCHAR | bronze, silver, gold, platinum, exceed |
| staff_limit | INTEGER | 担当者数上限 |
| customer_limit | INTEGER | 顧客数上限（全体、bronze/silverのみ） |
| customer_limit_per_staff | INTEGER | 担当者ごとの顧客数上限（gold/platinum/exceed） |
| parent_id | INTEGER | 親アカウントID |
| is_active | BOOLEAN | 有効/無効 |

### plan_definitionsテーブル
| カラム名 | 型 | 説明 |
|---------|---|------|
| plan_type | VARCHAR | プラン種別（主キー） |
| plan_name | VARCHAR | プラン名 |
| monthly_price | INTEGER | 月額料金 |
| staff_limit | INTEGER | 担当者数上限 |
| customer_limit | INTEGER | 顧客数上限（全体） |
| customer_limit_per_staff | INTEGER | 担当者ごとの顧客数上限 |

---

## 8. 次のステップ

### すぐに必要
1. ✅ **データベースマイグレーション実行**
   - `MIGRATION_INSTRUCTIONS.md`を参照
   - Supabaseダッシュボードから SQL を実行

2. ⏳ **管理者アカウントの確認**
   - 管理者アカウント（admin）でログインできるか確認
   - パスワードを設定（初期パスワードは変更推奨）

### フロントエンド実装（次の作業）
3. ⏳ ログイン・新規登録画面
4. ⏳ 管理者用代理店管理画面
5. ⏳ ダッシュボードの権限調整

---

## トラブルシューティング

### Q: 担当者登録時に「Staff limit reached」エラー
→ プランの担当者数上限に達しています。管理者にプラン変更を依頼してください。

### Q: 顧客登録時に「Customer limit reached」エラー
→ プランの顧客数上限に達しています。管理者にプラン変更を依頼してください。

### Q: ログインできない
→ `isActive`が`false`になっている可能性があります。管理者に確認してください。

### Q: 代理店を作成できない
→ 管理者権限（admin）でログインしているか確認してください。

---

## 管理者向け運用フロー

### 新規代理店の受付
1. 顧客から申し込み・決済確認
2. 管理者画面から代理店作成
3. 代理店にユーザーID・初期パスワードを通知
4. 代理店がログイン後、パスワード変更

### 支払い遅延時
1. 決済システムで未払いを確認
2. 管理者画面から代理店を無効化
3. 代理店に通知

### プラン変更依頼時
1. 顧客からLINEで連絡
2. 管理者画面からプラン更新
3. 新しい制限値を通知
