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
            const parser = new pdf.PDFParse({ data: pdfBuffer });
            const result = await parser.getText();
            await parser.destroy();
            return result.text;
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

            // プルデンシャルのPDFは「直近1年」テーブル形式でデータを提供
            // 直接テーブル抽出を使用（正規表現は信託報酬などの他のデータにマッチする可能性があるため）
            const funds = this.extractPerformanceTable(text);

            if (Object.keys(funds).length === 0) {
                logger.warn('No fund performance data found in table, trying fallback extraction');
                // Fallback: 汎用的なテーブル抽出を試みる
                return this.extractFromTable(text);
            }

            return funds;
        } catch (error) {
            logger.error('Fund performance extraction failed:', error);
            throw error;
        }
    }

    /**
     * テーブル形式のデータから運用実績を抽出（fallback method）
     * @param {string} text
     * @returns {Object}
     */
    extractFromTable(text) {
        const funds = {};
        const lines = text.split('\n');

        // テーブル形式を探す
        // 例: "株式型   6.8%"
        const fundNames = ['総合型', '債券型', '株式型', '米国債券型', '米国株式型', 'REIT型', '世界株式型'];

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
     * 「直近1年」のパフォーマンステーブルを抽出
     * @param {string} text
     * @returns {Object}
     */
    extractPerformanceTable(text) {
        const funds = {};
        const lines = text.split('\n');

        // Find header line with fund types
        let headerLine = null;
        let headerIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // ヘッダー行を探す（複数のファンドタイプを含む行）
            if (line.includes('総合型') && line.includes('債券型') && line.includes('株式型')) {
                headerLine = line;
                headerIndex = i;
                logger.info(`Found header at line ${i}`);
                break;
            }
        }

        if (headerLine && headerIndex >= 0) {
            // Find "直近1年" data line
            for (let i = headerIndex + 1; i < Math.min(headerIndex + 5, lines.length); i++) {
                const dataLine = lines[i];

                if (dataLine.includes('直近1年') || dataLine.includes('直近１年')) {
                    logger.info(`Found performance data at line ${i}`);

                    // Split by tabs or multiple spaces
                    const headerParts = headerLine.split(/\t+|\s{2,}/);
                    const dataParts = dataLine.split(/\t+|\s{2,}/);

                    // Map fund names to performance values
                    for (let j = 0; j < headerParts.length && j < dataParts.length; j++) {
                        const fundName = headerParts[j].trim();
                        const value = dataParts[j].trim();

                        // Extract percentage value
                        const percentMatch = value.match(/([-+]?\d+\.?\d*)%/);
                        if (percentMatch && fundName !== '期間' && fundName !== '') {
                            const performance = parseFloat(percentMatch[1]);
                            funds[fundName] = performance;
                            logger.info(`Extracted ${fundName}: ${performance}%`);
                        }
                    }
                    break;
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
