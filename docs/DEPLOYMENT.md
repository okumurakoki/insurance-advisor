# デプロイメントガイド

このドキュメントでは、変額保険アドバイザリーシステムの本番環境へのデプロイ手順を詳しく説明します。

## 🎯 デプロイメント概要

### サポート環境

- **開発環境**: ローカル開発用
- **ステージング環境**: テスト・検証用
- **本番環境**: 実際の運用環境

### デプロイメント方法

1. **Docker Compose**: 推奨方法（簡単セットアップ）
2. **AWS ECS**: コンテナ本番運用
3. **手動インストール**: カスタム環境用

## 🐳 Docker Compose デプロイメント

### 前提条件

- Docker 20.10+
- Docker Compose 1.29+
- 4GB以上のRAM
- 20GB以上のディスク容量

### デプロイ手順

1. **環境準備**
   ```bash
   # プロジェクトクローン
   git clone <repository-url>
   cd insurance-advisor
   
   # 環境設定
   cp .env.production .env
   ```

2. **環境変数設定**
   ```bash
   vim .env
   ```
   
   必須設定項目：
   ```bash
   # データベース認証情報
   DB_PASSWORD=strong_database_password
   DB_ROOT_PASSWORD=strong_root_password
   
   # JWT秘密鍵（32文字以上）
   JWT_SECRET=your_very_secure_jwt_secret_32chars
   
   # NotebookLM API設定
   NOTEBOOK_LM_API_KEY=your_notebooklm_api_key
   
   # ドメイン設定
   REACT_APP_API_URL=https://your-domain.com/api
   ```

3. **SSL証明書設定**
   ```bash
   # Let's Encrypt証明書取得
   sudo certbot certonly --standalone -d your-domain.com
   
   # 証明書を適切な場所にコピー
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

4. **デプロイ実行**
   ```bash
   # デプロイスクリプト実行
   chmod +x deploy.sh
   ./deploy.sh production
   ```

5. **動作確認**
   ```bash
   # サービス状態確認
   docker-compose -p insurance-advisor ps
   
   # ログ確認
   docker-compose -p insurance-advisor logs -f
   
   # ヘルスチェック
   curl https://your-domain.com/health
   curl https://your-domain.com/api/health
   ```

## ☁️ AWS ECS デプロイメント

### 前提条件

- AWS CLI設定済み
- ECS Cluster作成済み
- RDS MySQL インスタンス
- Application Load Balancer

### デプロイ手順

1. **ECR リポジトリ作成**
   ```bash
   aws ecr create-repository --repository-name insurance-advisor-api
   aws ecr create-repository --repository-name insurance-advisor-frontend
   ```

2. **イメージビルド・プッシュ**
   ```bash
   # APIイメージ
   cd backend
   docker build -t insurance-advisor-api .
   docker tag insurance-advisor-api:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/insurance-advisor-api:latest
   docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/insurance-advisor-api:latest
   
   # フロントエンドイメージ
   cd ../frontend
   docker build -t insurance-advisor-frontend .
   docker tag insurance-advisor-frontend:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/insurance-advisor-frontend:latest
   docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/insurance-advisor-frontend:latest
   ```

3. **ECS タスク定義作成**
   ```json
   {
     "family": "insurance-advisor",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "api",
         "image": "account.dkr.ecr.region.amazonaws.com/insurance-advisor-api:latest",
         "portMappings": [{"containerPort": 3000}],
         "environment": [
           {"name": "NODE_ENV", "value": "production"},
           {"name": "DB_HOST", "value": "your-rds-endpoint"}
         ],
         "secrets": [
           {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
         ]
       }
     ]
   }
   ```

4. **ECS サービス作成**
   ```bash
   aws ecs create-service \
     --cluster your-cluster \
     --service-name insurance-advisor \
     --task-definition insurance-advisor:1 \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

## 🔧 手動インストール

### Ubuntu 20.04 LTS での手順

1. **システム更新**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Node.js インストール**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **MySQL インストール**
   ```bash
   sudo apt install mysql-server -y
   sudo mysql_secure_installation
   ```

4. **Nginx インストール**
   ```bash
   sudo apt install nginx -y
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

5. **アプリケーション配置**
   ```bash
   # アプリケーション用ユーザー作成
   sudo adduser insurance-app
   sudo usermod -aG sudo insurance-app
   
   # アプリケーション配置
   sudo -u insurance-app git clone <repository-url> /home/insurance-app/app
   cd /home/insurance-app/app
   
   # バックエンド設定
   cd backend
   npm install --production
   cp .env.example .env
   # .env編集
   
   # フロントエンド設定
   cd ../frontend
   npm install
   npm run build
   ```

6. **PM2 設定**
   ```bash
   # PM2インストール
   npm install -g pm2
   
   # アプリケーション起動
   cd /home/insurance-app/app/backend
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

7. **Nginx設定**
   ```bash
   sudo cp nginx/nginx.conf /etc/nginx/sites-available/insurance-advisor
   sudo ln -s /etc/nginx/sites-available/insurance-advisor /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 📊 監視・メンテナンス

### ログローテーション設定

```bash
# /etc/logrotate.d/insurance-advisor
/home/insurance-app/app/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 insurance-app insurance-app
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 自動バックアップ設定

```bash
# /etc/cron.daily/insurance-advisor-backup
#!/bin/bash
BACKUP_DIR="/backup/insurance-advisor"
DATE=$(date +%Y%m%d_%H%M%S)

# データベースバックアップ
mysqldump -u backup_user -p$BACKUP_PASSWORD insurance_advisor > \
    "$BACKUP_DIR/db_backup_$DATE.sql"

# アップロードファイルバックアップ
tar czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" \
    /home/insurance-app/app/backend/uploads

# 古いバックアップ削除（30日以上）
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### SSL証明書自動更新

```bash
# /etc/cron.daily/certbot-renew
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
```

## 🚨 トラブルシューティング

### データベース接続問題

```bash
# 接続テスト
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"

# 権限確認
mysql -u root -p -e "SHOW GRANTS FOR '$DB_USER'@'%'"

# プロセス確認
mysql -u root -p -e "SHOW PROCESSLIST"
```

### メモリ不足問題

```bash
# メモリ使用量確認
free -h
docker stats

# スワップファイル作成
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### SSL証明書問題

```bash
# 証明書有効期限確認
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"

# 証明書更新
sudo certbot renew --dry-run
```

## 🔄 ローリングアップデート

### Docker環境

```bash
# 新しいイメージをビルド
docker-compose -p insurance-advisor build

# サービスを一つずつ更新
docker-compose -p insurance-advisor up -d --no-deps api
docker-compose -p insurance-advisor up -d --no-deps frontend
```

### PM2環境

```bash
# アプリケーション更新
git pull origin main
npm install --production

# ローリングリスタート
pm2 reload ecosystem.config.js --env production
```

## 🔐 セキュリティ設定

### ファイアウォール設定

```bash
# UFW基本設定
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Fail2Ban設定

```bash
# Fail2Banインストール
sudo apt install fail2ban -y

# 設定ファイル作成
sudo tee /etc/fail2ban/jail.local << EOF
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

sudo systemctl restart fail2ban
```

---

このデプロイメントガイドに従って、安全で確実なシステム運用を実現してください。