const axios = require('axios');
const logger = require('../utils/logger');

class LineService {
    constructor() {
        this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        this.apiUrl = 'https://api.line.me/v2/bot';
    }

    async sendAnalysisReport(lineUserId, customer, analysisResult) {
        try {
            const message = this.formatAnalysisMessage(customer, analysisResult);
            
            const response = await axios.post(`${this.apiUrl}/message/push`, {
                to: lineUserId,
                messages: [message]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.channelAccessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info(`Analysis report sent to LINE user: ${lineUserId}`);
            return response.data;
        } catch (error) {
            logger.error('Failed to send LINE message:', error);
            throw error;
        }
    }

    async sendRiskToleranceChangeRequest(lineUserId, customer, newRiskTolerance) {
        try {
            const message = {
                type: 'template',
                altText: 'リスク許容度変更のご相談',
                template: {
                    type: 'confirm',
                    text: `${customer.name}様\n\nリスク許容度を「${this.getRiskLabel(newRiskTolerance)}」に変更をご希望でしょうか？\n\n現在：${this.getRiskLabel(customer.riskTolerance)}\n変更後：${this.getRiskLabel(newRiskTolerance)}`,
                    actions: [
                        {
                            type: 'postback',
                            label: '変更する',
                            data: `action=change_risk&customer_id=${customer.id}&new_risk=${newRiskTolerance}`
                        },
                        {
                            type: 'postback',
                            label: 'キャンセル',
                            data: `action=cancel_risk_change&customer_id=${customer.id}`
                        }
                    ]
                }
            };

            const response = await axios.post(`${this.apiUrl}/message/push`, {
                to: lineUserId,
                messages: [message]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.channelAccessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info(`Risk change request sent to LINE user: ${lineUserId}`);
            return response.data;
        } catch (error) {
            logger.error('Failed to send risk change request:', error);
            throw error;
        }
    }

    formatAnalysisMessage(customer, analysisResult) {
        const allocation = analysisResult.adjusted_allocation;
        const allocationText = Object.entries(allocation)
            .map(([asset, percentage]) => `${asset}: ${percentage}%`)
            .join('\n');

        return {
            type: 'flex',
            altText: `${customer.name}様の運用分析レポート`,
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '運用分析レポート',
                            weight: 'bold',
                            color: '#1976d2',
                            size: 'xl'
                        },
                        {
                            type: 'text',
                            text: new Date().toLocaleDateString('ja-JP'),
                            color: '#666666',
                            size: 'sm'
                        }
                    ]
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: `${customer.name} 様`,
                            weight: 'bold',
                            size: 'lg',
                            margin: 'none'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'text',
                                    text: '📊 推奨資産配分',
                                    weight: 'bold',
                                    color: '#333333'
                                },
                                {
                                    type: 'text',
                                    text: allocationText,
                                    size: 'sm',
                                    color: '#666666',
                                    wrap: true
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'text',
                                    text: '💡 市場分析',
                                    weight: 'bold',
                                    color: '#333333'
                                },
                                {
                                    type: 'text',
                                    text: analysisResult.recommendation_text.substring(0, 100) + '...',
                                    size: 'sm',
                                    color: '#666666',
                                    wrap: true
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'baseline',
                            margin: 'lg',
                            contents: [
                                {
                                    type: 'text',
                                    text: '信頼度スコア:',
                                    size: 'sm',
                                    color: '#aaaaaa',
                                    flex: 1
                                },
                                {
                                    type: 'text',
                                    text: `${(analysisResult.confidence_score * 100).toFixed(0)}%`,
                                    size: 'sm',
                                    color: '#1976d2',
                                    flex: 1,
                                    weight: 'bold'
                                }
                            ]
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            color: '#1976d2',
                            action: {
                                type: 'uri',
                                label: '詳細レポートを見る',
                                uri: `${process.env.FRONTEND_URL}/analysis/${analysisResult.id}`
                            }
                        },
                        {
                            type: 'button',
                            style: 'secondary',
                            action: {
                                type: 'postback',
                                label: 'リスク許容度を変更',
                                data: `action=change_risk_request&customer_id=${customer.id}`
                            }
                        }
                    ]
                }
            }
        };
    }

    async sendMessage(lineUserId, message) {
        try {
            const response = await axios.post(`${this.apiUrl}/message/push`, {
                to: lineUserId,
                messages: [message]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.channelAccessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info(`Message sent to LINE user: ${lineUserId}`);
            return response.data;
        } catch (error) {
            logger.error('Failed to send LINE message:', error);
            throw error;
        }
    }

    getRiskLabel(riskTolerance) {
        const labels = {
            conservative: '保守的',
            balanced: 'バランス型',
            aggressive: '積極的'
        };
        return labels[riskTolerance] || riskTolerance;
    }
}

module.exports = new LineService();