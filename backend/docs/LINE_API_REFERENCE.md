# LINE通知機能 APIリファレンス

## ベースURL
```
Production: https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app
Development: http://localhost:3001
```

---

## エンドポイント一覧

### 1. QRコード生成

#### `POST /api/line/generate-qr`

LINE連携用のQRコードと認証トークンを生成します。

**認証**: Bearer Token（Staff/Agency）

**リクエストボディ:**
```json
{
  "customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "linkUrl": "https://line.me/R/ti/p/@your_line_id",
  "token": "ABC123",
  "expiresAt": "2025-11-11T05:10:00.000Z",
  "message": "QRコードを顧客に見せて、友だち追加後に認証コード「ABC123」を送信してもらってください。"
}
```

**エラーレスポンス:**
- `400 Bad Request`: customerId未指定、または既に連携済み
- `403 Forbidden`: 権限なし
- `404 Not Found`: 顧客が存在しない

**curlサンプル:**
```bash
curl -X POST https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/line/generate-qr \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}'
```

---

### 2. LINE連携解除

#### `POST /api/line/unlink`

顧客とLINEアカウントの連携を解除します。

**認証**: Bearer Token（Staff/Agency）

**リクエストボディ:**
```json
{
  "customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "message": "LINE account unlinked successfully"
}
```

**エラーレスポンス:**
- `400 Bad Request`: customerId未指定
- `403 Forbidden`: 権限なし

**curlサンプル:**
```bash
curl -X POST https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/line/unlink \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}'
```

---

### 3. レポート通知送信（手動）

#### `POST /api/line/send-report-notification`

指定した顧客に分析レポートのLINE通知を手動で送信します。

**認証**: Bearer Token（Staff/Agency）

**リクエストボディ:**
```json
{
  "customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "analysisId": "a3bb189e-8bf9-3888-9912-ace4e6543002"
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "message": "LINE notification sent successfully",
  "sentTo": "山田太郎"
}
```

**エラーレスポンス:**
- `400 Bad Request`: customerId/analysisId未指定、またはLINE未連携
  ```json
  {
    "error": "Customer does not have LINE linked",
    "message": "この顧客はLINE連携していません"
  }
  ```
- `403 Forbidden`: 権限なし
- `404 Not Found`: 顧客または分析結果が存在しない
- `500 Internal Server Error`: LINE API送信失敗

**curlサンプル:**
```bash
curl -X POST https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/line/send-report-notification \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "analysisId": "a3bb189e-8bf9-3888-9912-ace4e6543002"
  }'
```

---

### 4. Webhook（LINE Platform → Server）

#### `POST /api/line/webhook`

LINE Platformからのイベントを受信します（顧客のメッセージ、フォロー、ポストバックなど）。

**認証**: LINE署名検証（`X-Line-Signature`ヘッダー）

**リクエストヘッダー:**
```
X-Line-Signature: HMAC-SHA256 signature
Content-Type: application/json
```

**リクエストボディ（例: テキストメッセージ）:**
```json
{
  "destination": "Uxxxxxx",
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "id": "123456789",
        "text": "レポート"
      },
      "timestamp": 1699876543210,
      "source": {
        "type": "user",
        "userId": "Uabcdef1234567890"
      },
      "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
      "mode": "active"
    }
  ]
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true
}
```

**エラーレスポンス:**
- `401 Unauthorized`: 署名検証失敗
- `500 Internal Server Error`: 処理エラー

**注意:**
- このエンドポイントはLINE Platform専用です
- 手動でテストする場合は、有効な署名を生成する必要があります
- Vercel Serverless Functionとして実装（`/api/line/webhook.js`）
- `bodyParser: false`設定により生のリクエストボディを取得

---

## 自動返信コマンド

顧客がLINEで送信できるテキストコマンド一覧：

### レポート
**入力:** `レポート` / `report`

**動作:** 最新の分析レポートをFlex Messageで送信

**レスポンス例:**
- ヘッダー: ✨ 運用分析レポート完成
- 推奨資産配分
- 市場分析概要
- 信頼度スコア
- ボタン: 「詳細レポートを見る」（ディープリンク）

---

### 問い合わせ
**入力:** `問い合わせ` / `問合せ` / `contact` / `お問い合わせ`

**動作:** 担当者情報を表示

**レスポンス例:**
```
📞 お問い合わせ

{顧客名}様の担当者

お気軽にLINEでご連絡ください。

営業時間: 平日 9:00-18:00
```

---

### ヘルプ
**入力:** `ヘルプ` / `help` / `使い方` / `つかいかた`

**動作:** 利用可能なコマンド一覧を表示

**レスポンス例:**
```
💡 使い方ガイド

利用可能なキーワード：
📊 「レポート」
→ 最新の運用分析レポート

💬 「問い合わせ」
→ 担当者への連絡方法

❓ 「ヘルプ」
→ このガイド表示

その他のご質問は、直接メッセージをお送りください。
```

---

### ステータス
**入力:** `ステータス` / `status`

**動作:** 顧客の情報を表示

**レスポンス例:**
```
📋 お客様情報

お名前: 山田太郎
リスク許容度: バランス型
保険会社: プルデンシャル生命
```

---

### 認証コード
**入力:** 6桁の英数字（例: `ABC123`）

**動作:** LINE連携を完了

**レスポンス例:**
```
✅ 連携完了

山田太郎様

LINE連携が完了しました！

これから以下のサービスをご利用いただけます：
📊 分析レポートの自動配信
💬 担当者との直接チャット
📈 運用状況の確認
🔔 重要なお知らせの通知

「ヘルプ」と送信すると利用方法をご案内します
```

---

### 未対応コマンド
**入力:** その他のテキスト

**動作:** フォールバック応答

**レスポンス例:**
```
申し訳ございませんが、そのメッセージは理解できませんでした。

以下のキーワードをお試しください：
📊 「レポート」
💬 「問い合わせ」
❓ 「ヘルプ」
```

---

## 自動通知トリガー

### 分析完了時の自動通知

**トリガー:** `POST /api/analysis`で分析が完了した時

**条件:**
- `customer.line_user_id`が存在する（LINE連携済み）
- 分析が正常に完了した

**送信内容:**
- 手動通知と同じFlex Message
- ディープリンク付き

**実装箇所:** `/backend/src/routes/analysis.js:424-446`

**コード例:**
```javascript
if (customer.line_user_id) {
  try {
    const LineService = require('../services/line.service');
    const analysisResult = {
      id: analysisId,
      adjusted_allocation: personalizedAllocation,
      recommendation_text: notebookLMResult.marketAnalysis,
      confidence_score: 0.85
    };
    await LineService.sendAnalysisReport(
      customer.line_user_id,
      customer,
      analysisResult
    );
    logger.info(`LINE notification sent to customer: ${customer.name}`);
  } catch (lineError) {
    logger.error('Failed to send LINE notification:', lineError);
    // 非ブロッキング: LINE失敗でも分析は成功扱い
  }
}
```

---

## Flex Message形式

### レポート通知のFlex Message構造

```json
{
  "type": "flex",
  "altText": "山田太郎様の運用分析レポート",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "✨ 運用分析レポート完成",
          "weight": "bold",
          "color": "#ffffff",
          "size": "xl"
        }
      ],
      "backgroundColor": "#1976d2",
      "paddingAll": "20px"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "山田太郎 様",
          "weight": "bold",
          "size": "lg"
        },
        {
          "type": "text",
          "text": "📊 推奨資産配分",
          "weight": "bold"
        },
        {
          "type": "text",
          "text": "国内株式: 30%\n外国株式: 40%\n債券: 20%\n現金: 10%",
          "size": "sm",
          "wrap": true
        },
        {
          "type": "text",
          "text": "💡 市場分析概要",
          "weight": "bold"
        },
        {
          "type": "text",
          "text": "現在の市場環境では...",
          "size": "sm",
          "wrap": true
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "color": "#1976d2",
          "action": {
            "type": "uri",
            "label": "詳細レポートを見る",
            "uri": "https://prudential-insurance-optimizer.vercel.app/customers/f47ac10b.../analysis/a3bb189e..."
          }
        },
        {
          "type": "button",
          "style": "link",
          "action": {
            "type": "postback",
            "label": "リスク許容度を変更",
            "data": "action=change_risk_request&customer_id=f47ac10b..."
          }
        }
      ]
    }
  }
}
```

---

## ディープリンク仕様

### URL形式
```
${FRONTEND_URL}/customers/${customerId}/analysis/${analysisId}
```

### 例
```
https://prudential-insurance-optimizer.vercel.app/customers/f47ac10b-58cc-4372-a567-0e02b2c3d479/analysis/a3bb189e-8bf9-3888-9912-ace4e6543002
```

### パラメータ
- `customerId`: UUID形式の顧客ID
- `analysisId`: UUID形式の分析結果ID

### 用途
- LINE通知の「詳細レポートを見る」ボタン
- レポートコマンドの応答内ボタン

### 実装箇所
`/backend/src/services/line.service.js:79-80`

---

## 権限チェック

### LINE機能の権限ルール

#### Staff（子アカウント）
- 自分が担当する顧客のみ操作可能
- `customer.user_id === user.userId`

#### Agency（親アカウント）
- 配下のスタッフが担当する全顧客を操作可能
- `staff.parent_id === user.userId`

### 実装箇所
`/backend/src/routes/line.js:244-261` (`checkLineAccessPermission`関数)

```javascript
async function checkLineAccessPermission(user, customerId) {
  const customer = await Customer.findById(customerId);
  if (!customer) return false;

  // Staff: own customers only
  if (user.accountType === 'child') {
    return customer.user_id === user.userId;
  }

  // Agency: all customers under their staff
  if (user.accountType === 'parent') {
    const staff = await User.findById(customer.user_id);
    return staff && staff.parent_id === user.userId;
  }

  return false;
}
```

---

## 環境変数

### 必須環境変数

```bash
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_long_lived_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
LINE_OFFICIAL_ACCOUNT_ID=@your_line_id

# フロントエンドURL（ディープリンク用）
FRONTEND_URL=https://prudential-insurance-optimizer.vercel.app
```

### 環境変数の設定場所

#### ローカル開発
`.env`ファイル

#### Vercel Production
```bash
vercel env add LINE_CHANNEL_ACCESS_TOKEN production
vercel env add LINE_CHANNEL_SECRET production
vercel env add LINE_OFFICIAL_ACCOUNT_ID production
vercel env add FRONTEND_URL production
```

または Vercel Dashboard:
1. Project Settings
2. Environment Variables
3. 各変数を追加（Production環境を選択）

---

## エラーコード一覧

| HTTPステータス | エラーコード | 説明 | 対処法 |
|-------------|------------|------|-------|
| 400 | Bad Request | リクエストパラメータ不正 | リクエストボディを確認 |
| 401 | Unauthorized | 認証失敗 | トークンを確認・再取得 |
| 403 | Forbidden | 権限なし | 顧客の担当者を確認 |
| 404 | Not Found | リソースが存在しない | customerId/analysisIdを確認 |
| 500 | Internal Server Error | サーバーエラー | ログを確認、LINE API状態を確認 |

---

## レート制限

### LINE Messaging API制限
- Push API: 500メッセージ/秒
- Reply API: 送信数無制限（replyTokenの有効期限: 1分）
- Profile API: 2000リクエスト/秒

### Vercel制限
- Function実行時間: 最大30秒（Pro/Teamプラン）
- 同時実行数: 1000（Proプラン）
- 帯域幅: 1TB/月（Proプラン）

### 推奨対策
- 大量通知時はキューイング実装を検討
- バッチ処理の場合は適切な遅延を追加
- エラー時のリトライロジック実装

---

## サンプルコード

### JavaScript (Fetch API)

```javascript
// 認証
const loginResponse = await fetch('https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'staff@example.com',
    password: 'password123'
  })
});

const { accessToken } = await loginResponse.json();

// LINE通知送信
const notificationResponse = await fetch('https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/line/send-report-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    analysisId: 'a3bb189e-8bf9-3888-9912-ace4e6543002'
  })
});

const result = await notificationResponse.json();
console.log(result);
// { success: true, message: 'LINE notification sent successfully', sentTo: '山田太郎' }
```

### Python (requests)

```python
import requests

# 認証
login_response = requests.post(
    'https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/auth/login',
    json={
        'email': 'staff@example.com',
        'password': 'password123'
    }
)

access_token = login_response.json()['accessToken']

# LINE通知送信
notification_response = requests.post(
    'https://prudential-insurance-optimizer-qfn0i3jfh-kokiokumuras-projects.vercel.app/api/line/send-report-notification',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
    },
    json={
        'customerId': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'analysisId': 'a3bb189e-8bf9-3888-9912-ace4e6543002'
    }
)

result = notification_response.json()
print(result)
# {'success': True, 'message': 'LINE notification sent successfully', 'sentTo': '山田太郎'}
```

---

## 関連ドキュメント

- [LINE通知機能テストガイド](./LINE_NOTIFICATION_TESTING.md)
- [LINE Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
