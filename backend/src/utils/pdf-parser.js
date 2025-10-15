const pdf = require('pdf-parse');
const logger = require('./logger');

/**
 * プルデンシャルのPDFから運用実績データを抽出
 */
class PDFParser {
    /**
     * PDFバッファからテキストを抽出
     * @param {Buffer} pdfBuffer
     * @returns {Promise<string>}
     */
    async extractText(pdfBuffer) {
        try {
            const data = await pdf(pdfBuffer);
            return data.text;
        } catch (error) {
            logger.error('PDF text extraction failed:', error);
            throw error;
        }
    }

    /**
     * プルデンシャルPDFから特別勘定の運用実績を抽出
     * @param {Buffer} pdfBuffer
     * @returns {Promise<Object>} { fundName: performance }
     */
    async extractFundPerformance(pdfBuffer) {
        try {
            const text = await this.extractText(pdfBuffer);
            const funds = {};

            // プルデンシャルのPDFフォーマットに基づいて解析
            // 特別勘定名と騰落率のパターンを検索

            // パターン1: "特別勘定名 ... 騰落率 X.X%"
            const patterns = [
                // 株式型
                { regex: /株式型.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '株式型' },
                { regex: /国内株式.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '株式型' },

                // 米国株式型
                { regex: /米国株式.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '米国株式型' },
                { regex: /US.*?株式.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '米国株式型' },

                // 米国債券型
                { regex: /米国債券.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '米国債券型' },
                { regex: /US.*?債券.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '米国債券型' },

                // REIT型
                { regex: /REIT.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: 'REIT型' },
                { regex: /不動産.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: 'REIT型' },

                // 世界株式型
                { regex: /世界株式.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '世界株式型' },
                { regex: /グローバル.*?株式.*?(?:騰落率|収益率|運用実績).*?([-+]?\d+\.?\d*)%/i, name: '世界株式型' }
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern.regex);
                if (match && !funds[pattern.name]) {
                    funds[pattern.name] = parseFloat(match[1]);
                    logger.info(`Found ${pattern.name}: ${funds[pattern.name]}%`);
                }
            }

            // データが見つからない場合は、テキスト全体から数値テーブルを探す
            if (Object.keys(funds).length === 0) {
                logger.warn('No fund performance data found with regex patterns, trying table extraction');
                funds = this.extractFromTable(text);
            }

            return funds;
        } catch (error) {
            logger.error('Fund performance extraction failed:', error);
            throw error;
        }
    }

    /**
     * テーブル形式のデータから運用実績を抽出
     * @param {string} text
     * @returns {Object}
     */
    extractFromTable(text) {
        const funds = {};
        const lines = text.split('\n');

        // テーブル形式を探す
        // 例: "株式型   6.8%"
        const fundNames = ['株式型', '米国株式型', '米国債券型', 'REIT型', '世界株式型'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const fundName of fundNames) {
                if (line.includes(fundName) && !funds[fundName]) {
                    // 同じ行または次の行で数値を探す
                    const currentLineMatch = line.match(/([-+]?\d+\.?\d*)%/);
                    if (currentLineMatch) {
                        funds[fundName] = parseFloat(currentLineMatch[1]);
                        logger.info(`Found ${fundName} in table: ${funds[fundName]}%`);
                    } else if (i + 1 < lines.length) {
                        const nextLineMatch = lines[i + 1].match(/([-+]?\d+\.?\d*)%/);
                        if (nextLineMatch) {
                            funds[fundName] = parseFloat(nextLineMatch[1]);
                            logger.info(`Found ${fundName} in next line: ${funds[fundName]}%`);
                        }
                    }
                }
            }
        }

        return funds;
    }

    /**
     * PDFから全てのメタデータとデータを抽出
     * @param {Buffer} pdfBuffer
     * @returns {Promise<Object>}
     */
    async extractAllData(pdfBuffer) {
        try {
            const text = await this.extractText(pdfBuffer);
            const fundPerformance = await this.extractFundPerformance(pdfBuffer);

            // 決算日を抽出
            const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            let reportDate = null;
            if (dateMatch) {
                reportDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            }

            return {
                text,
                fundPerformance,
                reportDate,
                extractedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('PDF data extraction failed:', error);
            throw error;
        }
    }
}

module.exports = new PDFParser();
