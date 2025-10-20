const axios = require('axios');
const logger = require('../utils/logger');

class NotebookLMService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || process.env.NOTEBOOK_LM_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    }

    async analyzePDF(pdfBuffer, analysisPrompt, marketDataContent = null) {
        try {
            logger.info('Analyzing PDF with Gemini AI...');

            // Gemini APIキーが設定されていることを確認
            if (!this.apiKey || this.apiKey === 'your-gemini-api-key-here') {
                throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.');
            }

            // Gemini APIで分析を実行
            return await this.analyzeWithGemini(pdfBuffer, analysisPrompt, marketDataContent);
        } catch (error) {
            logger.error('Analysis error:', error);
            throw new Error(`Gemini API analysis failed: ${error.message}`);
        }
    }

    async analyzeWithGemini(pdfBuffer, analysisPrompt, marketDataContent = null) {
        // 市場データがあれば、それを使って詳細なプロンプトを作成
        let enrichedPrompt = analysisPrompt;

        if (marketDataContent && marketDataContent.fundPerformance) {
            const fundData = Object.entries(marketDataContent.fundPerformance)
                .map(([fund, perf]) => `- ${fund}: ${JSON.stringify(perf)}`)
                .join('\n');

            enrichedPrompt = `${analysisPrompt}

市場データ（最新のファンドパフォーマンス）:
${fundData}

${marketDataContent.extractedText ? `\nPDFから抽出されたテキスト（要約）:\n${marketDataContent.extractedText.substring(0, 1000)}...\n` : ''}

上記の市場データに基づいて、以下のJSON形式で推奨配分を提案してください。
パフォーマンスが良いファンドの配分を増やし、悪いファンドの配分を減らすように調整してください。

**重要な制約条件**:
1. 以下の6つのファンド型すべてを必ず含めてください：
   - 株式型
   - 米国株式型
   - 総合型
   - 米国債券型
   - 債券型
   - REIT型

2. **各ファンド型の配分は最低5%以上を維持してください**
   - リスク分散のため、パフォーマンスが悪いファンドでも最低5%は保持します
   - パフォーマンスが良いファンドは10-30%の範囲で増やしてください

3. パフォーマンスに基づく推奨配分の目安：
   - 非常に良い（+15%以上）: 25-30%
   - 良い（+10%以上）: 20-25%
   - 普通（0-10%）: 15-20%
   - やや悪い（0%未満）: 10-15%
   - 悪い（-5%未満）: 5-10%

{
  "analysis": {
    "marketConditions": "市場の現在の状況についての詳細な分析（200文字程度）",
    "recommendations": {
      "allocation": {
        "株式型": 数値（0-100）,
        "米国株式型": 数値（0-100）,
        "総合型": 数値（0-100）,
        "米国債券型": 数値（0-100）,
        "債券型": 数値（0-100）,
        "REIT型": 数値（0-100）
      },
      "adjustmentFactors": {
        "timeHorizon": { "short": 0.8, "medium": 1.0, "long": 1.2 },
        "riskProfile": { "conservative": 0.7, "balanced": 1.0, "aggressive": 1.3 },
        "amountTier": { "small": 0.9, "medium": 1.0, "large": 1.1 }
      }
    },
    "confidence": 0.85
  }
}

重要: 配分の合計が100になるようにしてください。JSONのみを返してください（説明文は不要）。`;
        }

        logger.info('Calling Gemini API with enriched prompt...');

        const response = await axios.post(
            `${this.baseURL}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
            {
                contents: [{
                    parts: [
                        { text: enrichedPrompt }
                    ]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('Gemini API response received');
        return this.parseGeminiResponse(response.data);
    }

    parseGeminiResponse(response) {
        // Gemini APIレスポンスをパース
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        logger.info('Gemini response text:', text.substring(0, 500));

        // JSONコードブロックを削除（```json ... ```）
        let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // JSONを抽出
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                logger.info('Successfully parsed Gemini response');
                return this.parseAnalysisResult(parsed);
            } catch (parseError) {
                logger.error('Failed to parse JSON from Gemini:', parseError);
                logger.error('JSON string:', jsonMatch[0]);
                throw new Error(`Failed to parse Gemini response JSON: ${parseError.message}`);
            }
        }

        // JSON抽出失敗時はエラーをスロー
        logger.error('Could not extract valid JSON from Gemini response');
        logger.error('Full response text:', text);
        throw new Error('Could not extract valid JSON from Gemini response. The response may be malformed.');
    }

    generateMockAnalysis(prompt) {
        // This simulates NotebookLM's analysis based on the prompt
        return {
            analysis: {
                marketConditions: "現在の市場は適度なボラティリティを示しており、テクノロジーおよびヘルスケアセクターでプラスの成長トレンドが見られます。グローバル経済の回復基調が続く中、分散投資によるリスク管理が重要です。",
                recommendations: {
                    allocation: {
                        "株式型": 20,
                        "米国株式型": 25,
                        "総合型": 15,
                        "米国債券型": 15,
                        "債券型": 15,
                        "REIT型": 10
                    },
                    adjustmentFactors: {
                        timeHorizon: {
                            short: 0.8,
                            medium: 1.0,
                            long: 1.2
                        },
                        riskProfile: {
                            conservative: 0.7,
                            balanced: 1.0,
                            aggressive: 1.3
                        },
                        amountTier: {
                            small: 0.9,
                            medium: 1.0,
                            large: 1.1
                        }
                    }
                },
                confidence: 0.85
            }
        };
    }

    parseAnalysisResult(response) {
        const { analysis } = response;

        // 必須のファンド型をすべて含むことを確認
        const requiredFunds = ['株式型', '米国株式型', '総合型', '米国債券型', '債券型', 'REIT型'];
        const allocation = analysis.recommendations.allocation || {};

        // 欠けているファンド型があれば、または5%未満であれば、最小値（5%）を設定
        requiredFunds.forEach(fund => {
            if (!(fund in allocation) || allocation[fund] === null || allocation[fund] === undefined) {
                logger.warn(`Missing fund type in AI response: ${fund}, setting to 5%`);
                allocation[fund] = 5;
            } else if (allocation[fund] < 5) {
                logger.warn(`Fund type ${fund} is below 5% (${allocation[fund]}%), increasing to 5%`);
                allocation[fund] = 5;
            }
        });

        // 合計が100になるように正規化
        const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
        if (total !== 100) {
            logger.info(`Normalizing allocation from ${total}% to 100%`);
            Object.keys(allocation).forEach(fund => {
                allocation[fund] = Math.round((allocation[fund] / total) * 100);
            });

            // 端数調整
            const newTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0);
            if (newTotal !== 100) {
                const diff = 100 - newTotal;
                allocation['株式型'] += diff;
            }
        }

        logger.info('Final validated allocation:', allocation);

        return {
            marketAnalysis: analysis.marketConditions,
            recommendedAllocation: allocation,
            adjustmentFactors: analysis.recommendations.adjustmentFactors,
            confidence: analysis.confidence
        };
    }

    async uploadDocument(documentBuffer, documentType = 'pdf') {
        // Mock document upload
        return {
            documentId: `doc_${Date.now()}`,
            status: 'uploaded'
        };
    }

    async performAnalysis(documentId, prompt) {
        // Mock analysis execution
        return this.generateMockAnalysis(prompt);
    }

    extractMarketAnalysis(response) {
        return response.marketAnalysis || "市場分析データが利用できません";
    }

    extractAllocation(response) {
        return response.recommendedAllocation || {
            "株式型": 20,
            "米国株式型": 25,
            "総合型": 15,
            "米国債券型": 15,
            "債券型": 15,
            "REIT型": 10
        };
    }

    extractAdjustmentFactors(response) {
        return response.adjustmentFactors || {
            timeHorizon: { short: 0.8, medium: 1.0, long: 1.2 },
            riskProfile: { conservative: 0.7, balanced: 1.0, aggressive: 1.3 },
            amountTier: { small: 0.9, medium: 1.0, large: 1.1 }
        };
    }
}

module.exports = NotebookLMService;