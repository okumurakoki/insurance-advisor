const express = require('express');
const router = express.Router();
const pdfDownloader = require('../utils/pdf-downloader');
const pdfParser = require('../utils/pdf-parser');
const MarketData = require('../models/MarketData');
const User = require('../models/User');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Vercel Cronジョブ用のエンドポイント
 * 毎月10日、20日、30日に実行される
 *
 * Vercel Cronの設定で以下のように認証トークンをヘッダーで送信することを推奨
 */
router.post('/update-market-data', async (req, res) => {
    try {
        // Vercel Cronからのリクエストを検証
        // Vercelからのcronリクエストには x-vercel-cron ヘッダーが含まれる
        const isVercelCron = req.headers['x-vercel-cron'] === '1';

        // 本番環境では追加の検証を行う
        if (process.env.NODE_ENV === 'production') {
            if (!isVercelCron) {
                // Vercel Cronでない場合は、認証トークンをチェック
                const cronSecret = process.env.CRON_SECRET;
                const authHeader = req.headers.authorization;
                if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
                    logger.warn('Unauthorized cron job attempt - not from Vercel and no valid token');
                    return res.status(401).json({ error: 'Unauthorized' });
                }
            }
        }

        logger.info(`Market data update triggered. Source: ${isVercelCron ? 'Vercel Cron' : 'Manual'}`);

        logger.info('Starting automatic market data update...');

        // 1. PDFをダウンロード
        const pdfResults = await pdfDownloader.downloadAllPDFs();
        logger.info(`Downloaded ${pdfResults.length} PDFs`);

        // 2. マーケットデータフォーマットに変換
        const marketDataList = pdfDownloader.convertToMarketData(pdfResults);

        if (marketDataList.length === 0) {
            logger.warn('No PDFs were successfully downloaded');
            return res.status(500).json({
                error: 'Failed to download PDFs',
                details: pdfResults
            });
        }

        // 3. システムユーザーを取得または作成（自動更新用）
        // システムユーザーを探す（parent typeで）
        let systemUser = await User.findByUserId('system_auto_update', 'parent');
        if (!systemUser) {
            // システムユーザーが存在しない場合は最初のparentユーザーを使用
            const allUsers = await User.findAll();
            systemUser = allUsers.find(u => u.account_type === 'parent') || allUsers[0];
            if (!systemUser) {
                throw new Error('No user found for market data upload');
            }
            logger.info(`Using user ${systemUser.user_id} for automatic market data upload`);
        }

        // 4. 各PDFをマーケットデータとして保存
        const savedResults = [];
        // Vercelのサーバーレス環境では /tmp のみ書き込み可能
        // VERCEL環境変数で判定
        const uploadsDir = process.env.VERCEL
            ? '/tmp/uploads'
            : path.join(__dirname, '../../uploads');

        // uploadsディレクトリが存在しない場合は作成
        try {
            await fs.mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            // ディレクトリが既に存在する場合は無視
        }

        for (const marketData of marketDataList) {
            try {
                // ファイルを保存
                const fileName = marketData.fileName;
                const filePath = path.join(uploadsDir, fileName);
                await fs.writeFile(filePath, marketData.buffer);

                // PDFをダウンロードして保存（解析はマニュアルアップロード時に実行）
                logger.info(`Saving PDF without parsing: ${fileName}`);

                // データベースに登録（解析なし）
                const dataContent = {
                    fileName: marketData.fileName,
                    ...marketData.metadata,
                    note: 'PDFは保存されました。運用実績データを抽出するには、ダッシュボードから手動でアップロードしてください。'
                };

                const marketDataId = await MarketData.create({
                    data_date: marketData.dataDate,
                    data_type: marketData.dataType,
                    source_file: fileName,
                    data_content: dataContent,
                    pdf_content: marketData.buffer,
                    uploaded_by: systemUser.id
                });

                savedResults.push({
                    id: marketDataId,
                    fileName: fileName,
                    success: true,
                    note: 'PDF saved, parsing skipped (parse manually via dashboard)'
                });

                logger.info(`Market data saved without parsing: ${fileName} (ID: ${marketDataId})`);
            } catch (error) {
                logger.error(`Failed to save market data ${marketData.fileName}:`, error);
                savedResults.push({
                    fileName: marketData.fileName,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = savedResults.filter(r => r.success).length;
        logger.info(`Market data update completed: ${successCount}/${savedResults.length} successful`);

        res.json({
            success: true,
            message: `Market data updated successfully: ${successCount}/${savedResults.length}`,
            timestamp: new Date().toISOString(),
            results: savedResults
        });

    } catch (error) {
        logger.error('Market data update failed:', error);
        res.status(500).json({
            success: false,
            error: 'Market data update failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 手動でマーケットデータを更新するエンドポイント（管理者のみ）
 */
router.post('/manual-update', async (req, res) => {
    try {
        // 実装は上記と同じだが、認証が必要
        // TODO: 管理者認証を追加

        logger.info('Manual market data update triggered');

        // 上記と同じロジックを実行
        const pdfResults = await pdfDownloader.downloadAllPDFs();
        const marketDataList = pdfDownloader.convertToMarketData(pdfResults);

        res.json({
            success: true,
            message: 'Manual update completed',
            pdfCount: marketDataList.length,
            results: pdfResults.map(r => ({
                name: r.name,
                success: r.success,
                error: r.error
            }))
        });

    } catch (error) {
        logger.error('Manual market data update failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
