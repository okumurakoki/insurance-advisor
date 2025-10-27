import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Supabase初期化
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/make-server-e075ba47', '')

    // ルーティング
    switch (path) {
      case '/ping':
        return handlePing()
      
      case '/debug':
        return handleDebug()
      
      case '/market-data/real-time':
        return handleMarketData()
      
      case '/customers':
        return handleCustomers(req)
      
      case '/generate-report-pdf':
        return handleReportGeneration(req)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ヘルスチェック
async function handlePing() {
  return new Response(
    JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: '変額保険最適化システム API'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// デバッグ情報
async function handleDebug() {
  const debugInfo = {
    environment: Deno.env.get('NODE_ENV') || 'development',
    supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not set',
    timestamp: new Date().toISOString(),
    deno: Deno.version
  }

  return new Response(
    JSON.stringify(debugInfo),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 市場データ取得
async function handleMarketData() {
  try {
    // Alpha Vantage APIキー
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured')
    }

    // 主要指数のデータを取得
    const symbols = ['SPY', 'QQQ', 'VTI', 'VXUS', 'AGG']
    const marketData = []

    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
        )
        const data = await response.json()
        
        if (data['Global Quote']) {
          const quote = data['Global Quote']
          marketData.push({
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: quote['10. change percent'],
            lastUpdate: quote['07. latest trading day']
          })
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error)
      }
    }

    // KVストアに保存
    await supabase
      .from('kv_store_e075ba47')
      .upsert({
        key: 'market_data_latest',
        value: {
          data: marketData,
          lastUpdate: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: marketData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Market data fetch failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// 顧客データ取得
async function handleCustomers(req: Request) {
  try {
    // 認証チェック
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // KVストアから顧客データ取得
    const { data: customerData } = await supabase
      .from('kv_store_e075ba47')
      .select('value')
      .eq('key', 'customers_data')
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        data: customerData?.value || [],
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Customer data fetch failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// レポート生成
async function handleReportGeneration(req: Request) {
  try {
    const body = await req.json()
    const { reportType, customerId, dateRange } = body

    // レポートHTMLテンプレート生成
    const reportHTML = generateReportHTML(reportType, customerId, dateRange)
    
    // KVストアに保存
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await supabase
      .from('kv_store_e075ba47')
      .insert({
        key: reportId,
        value: {
          html: reportHTML,
          metadata: {
            reportType,
            customerId,
            dateRange,
            generatedAt: new Date().toISOString()
          }
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        downloadUrl: `/make-server-e075ba47/download-report/${reportId}`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Report generation failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// レポートHTMLテンプレート生成
function generateReportHTML(reportType: string, customerId: string, dateRange: any): string {
  const currentDate = new Date().toLocaleDateString('ja-JP')
  
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>変額保険 分析レポート</title>
  <style>
    body { 
      font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #ffffff;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
    }
    .company-logo { 
      font-size: 32px; 
      color: #667eea; 
      font-weight: bold;
      margin-bottom: 10px;
    }
    .report-title { 
      font-size: 24px; 
      color: #2c3e50; 
      margin-bottom: 10px;
    }
    .report-date { 
      color: #666; 
      font-size: 14px; 
    }
    .content-section {
      margin: 30px 0;
      padding: 20px;
      background: #f8f9ff;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .section-title {
      font-size: 18px;
      color: #2c3e50;
      margin-bottom: 15px;
      font-weight: bold;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .data-table th, .data-table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    .data-table th {
      background-color: #667eea;
      color: white;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-logo">変額保険アドバイザリーシステム</div>
    <div class="report-title">変額保険 AI分析レポート</div>
    <div class="report-date">生成日時: ${currentDate}</div>
  </div>

  <div class="content-section">
    <div class="section-title">📊 ポートフォリオ分析概要</div>
    <p>本レポートは、AI技術を活用した市場分析に基づいて生成されています。</p>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>項目</th>
          <th>推奨配分</th>
          <th>リスクレベル</th>
          <th>期待リターン</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>国内株式型</td>
          <td>30%</td>
          <td>中</td>
          <td>6.5%</td>
        </tr>
        <tr>
          <td>海外株式型</td>
          <td>40%</td>
          <td>高</td>
          <td>8.2%</td>
        </tr>
        <tr>
          <td>債券型</td>
          <td>20%</td>
          <td>低</td>
          <td>3.1%</td>
        </tr>
        <tr>
          <td>REIT型</td>
          <td>10%</td>
          <td>中</td>
          <td>5.8%</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="content-section">
    <div class="section-title">📈 市場環境分析</div>
    <p>現在の市場環境は安定的な成長トレンドを示しており、バランス型のポートフォリオを推奨します。</p>
    <ul>
      <li>米国株式市場: 堅調な推移継続</li>
      <li>債券市場: 金利環境の正常化進行</li>
      <li>REIT市場: 安定した配当利回り</li>
    </ul>
  </div>

  <div class="content-section">
    <div class="section-title">💡 投資アドバイス</div>
    <p>以下の点にご注意いただき、長期的な資産形成を目指されることをお勧めします：</p>
    <ol>
      <li>定期的なリバランスの実施</li>
      <li>市場変動への冷静な対応</li>
      <li>投資目標の定期的な見直し</li>
    </ol>
  </div>

  <div class="footer">
    <p>このレポートは情報提供を目的として作成されており、投資勧誘を目的としたものではありません。</p>
    <p>変額保険アドバイザリーシステム | 変額保険最適化システム</p>
  </div>
</body>
</html>`
}