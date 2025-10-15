const axios = require('axios');
const logger = require('./logger');

/**
 * プルデンシャルのウェブサイトから最新のディスクロージャーPDFをダウンロード
 */
class PrudentialPDFDownloader {
    constructor() {
        this.baseUrl = 'https://www.prudential.co.jp';
        this.pdfs = [
            {
                url: '/contractor/disclosure/pdf/discKessan.pdf',
                name: '変額保険決算のお知らせ',
                type: 'kessan'
            },
            {
                url: '/contractor/disclosure/pdf/discRisk.pdf',
                name: '変額保険リスク等説明書面',
                type: 'risk'
            }
        ];
    }

    /**
     * PDFをダウンロードしてバッファとして取得
     * @param {string} pdfUrl - PDFのURL（相対パス）
     * @returns {Promise<Buffer>} PDFデータ
     */
    async downloadPDF(pdfUrl) {
        try {
            const fullUrl = `${this.baseUrl}${pdfUrl}`;
            logger.info(`Downloading PDF from: ${fullUrl}`);

            const response = await axios.get(fullUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30秒タイムアウト
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            logger.info(`PDF downloaded successfully: ${pdfUrl} (${response.data.length} bytes)`);
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Failed to download PDF from ${pdfUrl}:`, error.message);
            throw error;
        }
    }

    /**
     * 全ての最新PDFをダウンロード
     * @returns {Promise<Array>} ダウンロードしたPDFの情報
     */
    async downloadAllPDFs() {
        const results = [];

        for (const pdf of this.pdfs) {
            try {
                const buffer = await this.downloadPDF(pdf.url);
                results.push({
                    name: pdf.name,
                    type: pdf.type,
                    buffer: buffer,
                    url: pdf.url,
                    downloadDate: new Date(),
                    success: true
                });
            } catch (error) {
                logger.error(`Failed to download ${pdf.name}:`, error);
                results.push({
                    name: pdf.name,
                    type: pdf.type,
                    buffer: null,
                    url: pdf.url,
                    downloadDate: new Date(),
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * PDFデータを分析用のマーケットデータフォーマットに変換
     * @param {Array} pdfResults - ダウンロード結果
     * @returns {Array} マーケットデータフォーマット
     */
    convertToMarketData(pdfResults) {
        const today = new Date();
        const dataDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return pdfResults.filter(pdf => pdf.success).map(pdf => ({
            fileName: `${pdf.name}-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.pdf`,
            buffer: pdf.buffer,
            dataDate: dataDate,
            dataType: 'monthly_report',
            metadata: {
                source: 'prudential',
                type: pdf.type,
                url: pdf.url,
                autoDownloaded: true
            }
        }));
    }
}

module.exports = new PrudentialPDFDownloader();
