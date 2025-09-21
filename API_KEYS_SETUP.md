# API キー設定ガイド

## Alpha Vantage API キー取得

市場データ取得に必要なAlpha Vantage API キーを取得してください。

### 手順:
1. [Alpha Vantage](https://www.alphavantage.co/support/#api-key) にアクセス
2. "Get your free API key today!" をクリック
3. 必要情報を入力してアカウント作成
4. API キーをメモ (例: `ABCD1234567890`)

### 制限事項:
- 無料プラン: 1日25リクエスト、1分間5リクエスト
- 有料プランでより多くのリクエスト可能

## API キー設定方法

### 1. Supabase Edge Functions 環境変数設定

Supabase Dashboard で設定:
```
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
```

### 2. ローカル開発用環境変数

`.env.local` ファイルを作成 (フロントエンド):
```
REACT_APP_ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
REACT_APP_SUPABASE_URL=https://cqjxcfchrsjllyhsqawu.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. バックエンド環境変数

`production.env` ファイルを作成:
```
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

## テスト用デモキー

開発・テスト目的で以下のデモキーを使用可能:
```
ALPHA_VANTAGE_API_KEY=demo
```

注意: デモキーは制限された機能のみ提供し、本番環境では使用不可。

## セキュリティ注意事項

1. **APIキーをGitにコミットしない**
   - `.env` ファイルを `.gitignore` に追加
   - 環境変数で管理

2. **フロントエンドでのAPIキー露出を避ける**
   - 市場データ取得はSupabase Edge Functions経由で実行
   - APIキーはサーバーサイドのみで使用

3. **定期的なキーローテーション**
   - 月1回程度でAPIキーを更新
   - 古いキーの無効化

## 設定確認方法

### Edge Function 動作確認:
```bash
curl https://cqjxcfchrsjllyhsqawu.supabase.co/functions/v1/server/market-data/real-time
```

期待される応答:
```json
{
  "success": true,
  "data": [
    {
      "symbol": "SPY",
      "price": 445.20,
      "change": 2.15,
      "changePercent": "+0.48%",
      "lastUpdate": "2024-01-15"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

エラーの場合:
```json
{
  "error": "Alpha Vantage API key not configured"
}
```