# PDFマーケットデータの活用フロー

## PDFデータの保存先
- テーブル: `market_data`
- アップロード方法: ダッシュボード > マーケットデータアップロード
- API: `POST /api/analysis/upload-market-data`

## PDFデータの活用箇所

### 1. 顧客分析の実行 (analysis.js:293)
**エンドポイント:** `POST /api/analysis/recommend/:customerId`
**使用目的:** 顧客の保険会社に対応する最新のマーケットデータを取得し、NotebookLM AIで分析
**コード:**
```javascript
const latestMarketData = await MarketData.getLatest(customer.insurance_company_id);
const notebookLMResult = await notebookLM.analyzePDF(
    latestMarketData.pdf_content,
    analysisPrompt,
    latestMarketData.data_content
);
```

### 2. ファンドパフォーマンスの取得 (analysis.js:34, 618)
**エンドポイント:** `GET /api/analysis/fund-performance?company_id=X`
**使用目的:** 選択された保険会社の最新ファンド騰落率データを取得して表示
**コード:**
```javascript
const latestMarketData = await MarketData.getLatest('monthly_report', companyId);
const fundPerformance = latestMarketData.data_content.fundPerformance;
```

### 3. 顧客パフォーマンス履歴の計算 (analysis.js:540)
**エンドポイント:** `GET /api/analysis/performance/:customerId`
**使用目的:** 顧客のポートフォリオパフォーマンスを計算する際に、各ファンドの年間リターンを取得
**コード:**
```javascript
const annualFundReturns = await getFundReturnsFromMarketData(customer.insurance_company_id);
// 月次リターンに変換してパフォーマンス計算
```

### 4. ダッシュボード統計の計算 (analysis.js:883)
**エンドポイント:** `GET /api/analysis/statistics`
**使用目的:** ダッシュボードで平均リターンを計算する際に、各保険会社のマーケットデータを参照
**コード:**
```javascript
const fundReturns = fundReturnsByCompany[customer.insurance_company_id];
// ポートフォリオの加重平均リターンを計算
```

### 5. マーケットデータ情報の取得 (analysis.js:73)
**エンドポイント:** `GET /api/analysis/market-data/latest?company_id=X`
**使用目的:** ダッシュボードに最新のマーケットデータ情報を表示
**戻り値:**
```javascript
{
  id: latest.id,
  fileName: latest.data_content?.fileName,
  uploadedAt: latest.created_at,
  dataDate: latest.data_date,
  companyName: latest.company_name,
  fundPerformance: latest.data_content?.fundPerformance,
  parsedSuccessfully: latest.data_content?.parsedSuccessfully
}
```

## データフロー図
```
[管理者]
   ↓ PDFアップロード
[market_data テーブル]
   ↓ getLatest(company_id)
   ├→ [顧客分析] → AIが最適配分を提案
   ├→ [ファンドパフォーマンス表示] → チャート表示
   ├→ [パフォーマンス計算] → 顧客のポートフォリオ実績
   ├→ [統計計算] → ダッシュボードの平均リターン
   └→ [マーケットデータ情報] → ダッシュボード表示
```

## 重要な注意事項
1. PDFは保険会社ごとに管理される (company_id)
2. 同じ保険会社の複数PDFがある場合、最新のもの (data_date順) が使用される
3. PDFのパース失敗時でも保存されるが、`parsedSuccessfully: false` となる
4. PDFデータ本体は `pdf_content` (bytea) に、パース結果は `data_content` (jsonb) に保存される
