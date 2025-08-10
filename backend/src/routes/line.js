const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const LineService = require('../services/line.service');
const Customer = require('../models/Customer');
const User = require('../models/User');
const logger = require('../utils/logger');

// LINE webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // Verify signature
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        const signature = crypto
            .createHmac('SHA256', channelSecret)
            .update(req.body)
            .digest('base64');

        if (signature !== req.headers['x-line-signature']) {
            logger.warn('Invalid LINE webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const events = JSON.parse(req.body.toString()).events;
        
        // Process each event
        for (const event of events) {
            await handleLineEvent(event);
        }
        
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        logger.error('LINE webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle LINE events
async function handleLineEvent(event) {
    try {
        const { type, source, postback, message } = event;
        const lineUserId = source.userId;

        logger.info(`LINE event: ${type} from user: ${lineUserId}`);

        switch (type) {
            case 'postback':
                await handlePostback(lineUserId, postback);
                break;
            
            case 'message':
                if (message.type === 'text') {
                    await handleTextMessage(lineUserId, message.text);
                }
                break;
            
            case 'follow':
                await handleFollow(lineUserId);
                break;
            
            case 'unfollow':
                await handleUnfollow(lineUserId);
                break;
        }
    } catch (error) {
        logger.error('Error handling LINE event:', error);
    }
}

// Handle postback events (button clicks)
async function handlePostback(lineUserId, postback) {
    const data = new URLSearchParams(postback.data);
    const action = data.get('action');
    const customerId = data.get('customer_id');
    const newRisk = data.get('new_risk');

    switch (action) {
        case 'change_risk':
            await processRiskChange(lineUserId, customerId, newRisk);
            break;
        
        case 'cancel_risk_change':
            await LineService.sendMessage(lineUserId, {
                type: 'text',
                text: 'リスク許容度の変更をキャンセルしました。'
            });
            break;
        
        case 'change_risk_request':
            await sendRiskChangeOptions(lineUserId, customerId);
            break;
    }
}

// Handle text messages
async function handleTextMessage(lineUserId, text) {
    // Find user by LINE ID
    const user = await User.findByLineId(lineUserId);
    
    if (!user) {
        await LineService.sendMessage(lineUserId, {
            type: 'text',
            text: 'アカウントが見つかりません。システム管理者にお問い合わせください。'
        });
        return;
    }

    // Simple command handling
    const command = text.toLowerCase().trim();
    
    switch (command) {
        case 'ステータス':
        case 'status':
            await sendUserStatus(lineUserId, user);
            break;
        
        case 'レポート':
        case 'report':
            await sendLatestReport(lineUserId, user);
            break;
        
        case 'ヘルプ':
        case 'help':
            await sendHelpMessage(lineUserId);
            break;
        
        default:
            await LineService.sendMessage(lineUserId, {
                type: 'text',
                text: '申し訳ございませんが、そのメッセージは理解できませんでした。「ヘルプ」と送信してください。'
            });
    }
}

// Handle new followers
async function handleFollow(lineUserId) {
    const welcomeMessage = {
        type: 'flex',
        altText: '変額保険アドバイザリーシステムへようこそ',
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '変額保険アドバイザリーシステム',
                        weight: 'bold',
                        size: 'xl',
                        color: '#1976d2'
                    }
                ]
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'ご登録ありがとうございます！',
                        weight: 'bold',
                        size: 'lg'
                    },
                    {
                        type: 'text',
                        text: '以下の機能をご利用いただけます：',
                        margin: 'md'
                    },
                    {
                        type: 'text',
                        text: '📊 分析レポートの自動配信\n🔄 リスク許容度の変更依頼\n💬 担当者への直接連絡\n📈 運用状況の確認',
                        margin: 'md',
                        wrap: true
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '「ヘルプ」と送信すると、利用方法をご案内します。',
                        size: 'sm',
                        color: '#666666'
                    }
                ]
            }
        }
    };

    await LineService.sendMessage(lineUserId, welcomeMessage);
}

// Handle unfollows
async function handleUnfollow(lineUserId) {
    logger.info(`User unfollowed: ${lineUserId}`);
    // Could update database status if needed
}

// Process risk tolerance change
async function processRiskChange(lineUserId, customerId, newRisk) {
    try {
        const customer = await Customer.findById(customerId);
        if (!customer || customer.line_user_id !== lineUserId) {
            throw new Error('Customer not found or unauthorized');
        }

        // Update risk tolerance
        await Customer.update(customerId, { risk_tolerance: newRisk });
        
        const riskLabels = {
            conservative: '保守的',
            balanced: 'バランス型',
            aggressive: '積極的'
        };

        await LineService.sendMessage(lineUserId, {
            type: 'text',
            text: `リスク許容度を「${riskLabels[newRisk]}」に変更しました。\n\n次回の分析から新しい設定が反映されます。`
        });

        logger.info(`Risk tolerance changed for customer ${customerId}: ${newRisk}`);
    } catch (error) {
        logger.error('Error processing risk change:', error);
        await LineService.sendMessage(lineUserId, {
            type: 'text',
            text: 'リスク許容度の変更でエラーが発生しました。担当者にお問い合わせください。'
        });
    }
}

// Send risk change options
async function sendRiskChangeOptions(lineUserId, customerId) {
    const message = {
        type: 'template',
        altText: 'リスク許容度を選択してください',
        template: {
            type: 'buttons',
            text: '変更したいリスク許容度を選択してください',
            actions: [
                {
                    type: 'postback',
                    label: '保守的（安全重視）',
                    data: `action=change_risk&customer_id=${customerId}&new_risk=conservative`
                },
                {
                    type: 'postback',
                    label: 'バランス型',
                    data: `action=change_risk&customer_id=${customerId}&new_risk=balanced`
                },
                {
                    type: 'postback',
                    label: '積極的（収益重視）',
                    data: `action=change_risk&customer_id=${customerId}&new_risk=aggressive`
                }
            ]
        }
    };

    await LineService.sendMessage(lineUserId, message);
}

// Send user status
async function sendUserStatus(lineUserId, user) {
    // Implementation depends on user type
    await LineService.sendMessage(lineUserId, {
        type: 'text',
        text: `ユーザー情報：\nID: ${user.user_id}\nアカウント種別: ${user.account_type}\nプラン: ${user.plan_type}`
    });
}

// Send latest report
async function sendLatestReport(lineUserId, user) {
    // Get latest analysis for the user
    await LineService.sendMessage(lineUserId, {
        type: 'text',
        text: '最新のレポートを準備中です。しばらくお待ちください。'
    });
}

// Send help message
async function sendHelpMessage(lineUserId) {
    const helpMessage = {
        type: 'flex',
        altText: 'ヘルプ - 利用可能なコマンド',
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '💡 ヘルプ',
                        weight: 'bold',
                        size: 'xl',
                        color: '#1976d2'
                    }
                ]
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '利用可能なコマンド：',
                        weight: 'bold'
                    },
                    {
                        type: 'text',
                        text: '「ステータス」- ユーザー情報の確認\n「レポート」- 最新分析レポート\n「ヘルプ」- このメッセージ表示',
                        margin: 'md',
                        wrap: true
                    }
                ]
            }
        }
    };

    await LineService.sendMessage(lineUserId, helpMessage);
}

module.exports = router;