# 変額保険アドバイザリーシステム

NotebookLMを活用した変額保険の運用アドバイザリーシステムです。月次の市場データ分析に基づいて、顧客一人ひとりに最適化された資産配分を提案します。

## 🎯 概要

このシステムは以下の機能を提供します：

- **階層型アカウント管理**: 代理店（親）、生保担当者（子）、顧客（孫）の3階層アカウント
- **プラン別制限**: Standard/Master/Exceedの3つのプランで機能と上限を管理
- **AI分析**: NotebookLMを使用した市場データの自動分析
- **パーソナライズ**: 契約期間、金額、リスク許容度に基づく個別最適化
- **多形式エクスポート**: PDF、Excel、JSON形式での分析結果出力

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド   │    │    バックエンド    │    │   NotebookLM    │
│   React + TS     │◄──►│  Node.js + API   │◄──►│   AI分析エンジン  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │    MySQL DB     │
                       │   ユーザー・顧客   │
                       │     分析データ     │
                       └─────────────────┘
```

## 📋 プラン構成

| プラン | 顧客上限 | 分析頻度 | エクスポート形式 | 月額料金 |
|--------|----------|----------|------------------|----------|
| Standard | 10人 | 月1回 | PDF | 無料 |
| Master | 50人 | 週1回 | PDF + Excel | ¥5,000 |
| Exceed | 無制限 | 毎日 | PDF + Excel + API | ¥15,000 |

## 🚀 セットアップ

### 必要要件

- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose (推奨)
- NotebookLM API Key

### 環境構築

#### Docker Composeを使用（推奨）

1. **リポジトリクローン**
   ```bash
   git clone <repository-url>
   cd insurance-advisor
   ```

2. **環境変数設定**
   ```bash
   cp .env.production .env
   # .envファイルを編集して必要な値を設定
   ```

3. **デプロイ実行**
   ```bash
   ./deploy.sh production
   ```

#### 手動セットアップ

1. **データベース設定**
   ```bash
   mysql -u root -p < docs/database-schema.sql
   ```

2. **バックエンド起動**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # .envファイルを編集
   npm start
   ```

3. **フロントエンド起動**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 🔧 設定

### 環境変数

**バックエンド (.env)**
```bash
# データベース
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=insurance_advisor

# セキュリティ
JWT_SECRET=your_jwt_secret_key

# 外部サービス
NOTEBOOK_LM_API_KEY=your_notebooklm_key
SENDGRID_API_KEY=your_sendgrid_key
```

**フロントエンド**
```bash
REACT_APP_API_URL=http://localhost:3000/api
```

### SSL証明書設定（本番環境）

```bash
# Let's Encryptを使用する場合
certbot --nginx -d your-domain.com

# 自己署名証明書（開発用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

## 📊 API仕様

### 認証エンドポイント

```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/verify
```

### 顧客管理エンドポイント

```bash
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### 分析エンドポイント

```bash
POST /api/analysis/recommend/:customerId
GET  /api/analysis/history/:customerId
GET  /api/analysis/export/:analysisId
POST /api/analysis/upload-market-data
```

## 🧪 テスト

```bash
# バックエンドテスト
cd backend
npm test

# フロントエンドテスト
cd frontend
npm test

# 統合テスト
npm run test:integration
```

## 📈 監視・運用

### ヘルスチェック

```bash
# APIヘルスチェック
curl http://localhost:3000/health

# フロントエンドヘルスチェック
curl http://localhost/health
```

### ログ確認

```bash
# Docker環境
docker-compose -p insurance-advisor logs -f

# PM2環境
pm2 logs insurance-advisor-api
```

### データベースバックアップ

```bash
# 自動バックアップスクリプト
./scripts/backup-database.sh

# 手動バックアップ
mysqldump -u root -p insurance_advisor > backup_$(date +%Y%m%d).sql
```

## 🔒 セキュリティ

- **認証**: JWT トークンベース認証
- **暗号化**: bcrypt によるパスワードハッシュ化
- **レート制限**: API エンドポイントのレート制限
- **HTTPS**: SSL/TLS 暗号化通信
- **CORS**: クロスオリジンリクエスト制御
- **監査ログ**: 全操作の監査ログ記録

## 📝 開発ガイド

### コード規約

- **Backend**: Node.js + Express + MySQL
- **Frontend**: React + TypeScript + Material-UI
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Supertest

### Git ワークフロー

```bash
# 機能開発
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature

# プルリクエスト作成後マージ
git checkout main
git pull origin main
```

## 🚨 トラブルシューティング

### よくある問題

**データベース接続エラー**
```bash
# 接続確認
mysql -h localhost -u root -p -e "SELECT 1"

# 権限確認
SHOW GRANTS FOR 'your_db_user'@'localhost';
```

**NotebookLM API エラー**
```bash
# APIキー確認
echo $NOTEBOOK_LM_API_KEY

# レスポンス確認
curl -H "Authorization: Bearer $NOTEBOOK_LM_API_KEY" \
     https://notebooklm.googleapis.com/v1/health
```

**フロントエンドビルドエラー**
```bash
# キャッシュクリア
npm run clean
npm install

# 型チェック
npm run typecheck
```

## 📞 サポート

- **技術的な問題**: GitHub Issues を作成
- **機能リクエスト**: GitHub Discussions で議論
- **緊急時**: 開発チームに直接連絡

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 貢献

プロジェクトへの貢献を歓迎します！詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をお読みください。

---

© 2024 変額保険アドバイザリーシステム開発チーム# Last updated: 2025年 10月21日 火曜日 15時22分29秒 JST
