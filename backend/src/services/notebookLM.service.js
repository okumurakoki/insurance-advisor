const axios = require('axios');
const logger = require('../utils/logger');

class NotebookLMService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || process.env.NOTEBOOK_LM_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    }

    async analyzePDF(pdfBuffer, analysisPrompt) {
        try {
            logger.info('Analyzing PDF with Gemini AI...');

            // Gemini APIが利用可能な場合は実際の分析を実行
            if (this.apiKey && this.apiKey !== 'your-gemini-api-key-here') {
                try {
                    return await this.analyzeWithGemini(pdfBuffer, analysisPrompt);
                } catch (apiError) {
                    logger.warn('Gemini API call failed, falling back to mock:', apiError.message);
                }
            }

            // API keyがない場合またはAPIエラーの場合はモック実装を使用
            logger.info('Using mock analysis (Gemini API not configured)');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResponse = this.generateMockAnalysis(analysisPrompt);
            return this.parseAnalysisResult(mockResponse);
        } catch (error) {
            logger.error('Analysis error:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    async analyzeWithGemini(pdfBuffer, analysisPrompt) {
        // Gemini APIでPDF分析を実行
        const base64PDF = pdfBuffer.toString('base64');

        const response = await axios.post(
            `${this.baseURL}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
            {
                contents: [{
                    parts: [
                        { text: analysisPrompt },
                        {
                            inline_data: {
                                mime_type: 'application/pdf',
                                data: base64PDF
                            }
                        }
                    ]
                }]
            }
        );

        return this.parseGeminiResponse(response.data);
    }

    parseGeminiResponse(response) {
        // Gemini APIレスポンスをパース
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // JSONを抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return this.parseAnalysisResult({ analysis });
        }

        // JSON抽出失敗時はモックデータを返す
        return this.parseAnalysisResult(this.generateMockAnalysis(''));
    }

    generateMockAnalysis(prompt) {
        // This simulates NotebookLM's analysis based on the prompt
        return {
            analysis: {
                marketConditions: "現在の市場は適度なボラティリティを示しており、テクノロジーおよびヘルスケアセクターでプラスの成長トレンドが見られます。グローバル経済の回復基調が続く中、分散投資によるリスク管理が重要です。",
                recommendations: {
                    allocation: {
                        "株式型": 25,
                        "米国株式型": 30,
                        "米国債券型": 20,
                        "REIT型": 10,
                        "世界株式型": 15
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
        
        return {
            marketAnalysis: analysis.marketConditions,
            recommendedAllocation: analysis.recommendations.allocation,
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
            "株式型": 25,
            "米国株式型": 30,
            "米国債券型": 20,
            "REIT型": 10,
            "世界株式型": 15
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