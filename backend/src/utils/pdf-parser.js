const pdf = require('pdf-parse');
const logger = require('./logger');

/**
 * 変額保険のPDFから運用実績データを抽出
 */
class PDFParser {
    constructor() {
        // 会社別・商品別ファンド名マッピング
        this.fundNamesByCompany = {
            // プルデンシャル生命
            'PRUDENTIAL_LIFE': [
                '総合型', '債券型', '株式型',
                '米国債券型', '米国株式型', 'REIT型',
                '世界株式型', 'マネー型'
            ],
            // ソニー生命 - バリアブル・ライフ版（8ファンド）
            'SONY_LIFE': [
                '株式型', '日本成長株式型',
                '世界コア株式型', '世界株式型',
                '債券型', '世界債券型',
                '総合型',
                '短期金融市場型'
            ],
            // ソニー生命 - SOVANI版（16ファンド）
            'SONY_LIFE_SOVANI': [
                // バランス型
                'バランス型20', 'バランス型40', 'バランス型60', 'バランス型80',
                // パッシブ型
                '日本株式型TOP', '海外株式型MSP', '日本債券型NOP', '海外債券型FTP',
                '日本リート型TSP', '海外リート型SPP',
                // アクティブ型
                '日本株式型JV', '日本株式型JG', '世界株式型GQ', '世界株式型GI',
                '世界債券型GQ',
                // マネー型
                'マネー型'
            ],
            // アクサ生命（今後追加）
            'AXA_LIFE': []
        };
    }

    /**
     * PDFバッファからテキストを抽出
     * @param {Buffer} pdfBuffer
     * @returns {Promise<string>}
     */
    async extractText(pdfBuffer) {
        try {
            logger.info('Starting PDF text extraction, buffer size:', pdfBuffer.length);
            const data = await pdf(pdfBuffer);
            logger.info('PDF parsing completed, text length:', data.text.length);

            // デバッグ: PDFの最初の2000文字を出力
            logger.info('=== PDF Content Preview (first 2000 chars) ===');
            logger.info(data.text.substring(0, 2000));
            logger.info('=== End of Preview ===');

            // デバッグ: ファンド名を含む行を全て出力
            const lines = data.text.split('\n');
            logger.info('=== Lines containing fund names ===');
            const fundNames = ['総合型', '債券型', '株式型', '米国債券型', '米国株式型', 'REIT型'];
            lines.forEach((line, index) => {
                if (fundNames.some(name => line.includes(name))) {
                    logger.info(`Line ${index}: ${line}`);
                }
            });
            logger.info('=== End of fund name lines ===');

            return data.text;
        } catch (error) {
            logger.error('PDF text extraction failed:', error);
            logger.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                bufferSize: pdfBuffer ? pdfBuffer.length : 'null'
            });
            console.error('EXTRACT TEXT ERROR:', error);
            throw error;
        }
    }

    /**
     * 変額保険PDFから特別勘定の運用実績を抽出
     * @param {Buffer} pdfBuffer
     * @param {string} companyCode - 保険会社コード (e.g., 'PRUDENTIAL_LIFE', 'SONY_LIFE')
     * @returns {Promise<Object>} { fundName: performance }
     */
    async extractFundPerformance(pdfBuffer, companyCode = null) {
        try {
            const text = await this.extractText(pdfBuffer);

            // 変額保険のPDFは「直近1年」テーブル形式でデータを提供
            // 直接テーブル抽出を使用（正規表現は信託報酬などの他のデータにマッチする可能性があるため）
            const funds = this.extractPerformanceTable(text);

            if (Object.keys(funds).length === 0) {
                logger.warn('No fund performance data found in table, trying fallback extraction');
                // Fallback: 汎用的なテーブル抽出を試みる
                return this.extractFromTable(text, companyCode);
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
     * @param {string} companyCode - 保険会社コード
     * @returns {Object}
     */
    extractFromTable(text, companyCode = null) {
        const funds = {};
        const lines = text.split('\n');

        // 会社別のファンド名リストを取得
        let fundNames = [];
        if (companyCode && this.fundNamesByCompany[companyCode]) {
            fundNames = this.fundNamesByCompany[companyCode];
        } else {
            // デフォルト：全てのファンド名を結合
            fundNames = [
                ...this.fundNamesByCompany['PRUDENTIAL_LIFE'],
                ...this.fundNamesByCompany['SONY_LIFE']
            ];
        }

        logger.info(`Using fund names for ${companyCode || 'default'}: ${fundNames.join(', ')}`);

        // ファンド名を長い順にソート（部分一致を防ぐため）
        // 例: "世界株式型" を "株式型" より先に処理
        const sortedFundNames = [...fundNames].sort((a, b) => b.length - a.length);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const fundName of sortedFundNames) {
                if (funds[fundName]) {
                    // すでに見つかっている場合はスキップ
                    continue;
                }

                // ファンド名の前後に区切り文字があることを確認する正確なマッチング
                // 区切り文字: 行頭、空白、全角空白、タブ、括弧など
                const escapedFundName = fundName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const exactMatchRegex = new RegExp('(^|[\\s　\\t(（【\\[])' + escapedFundName + '([^\\w\\u3040-\\u309f\\u30a0-\\u30ff\\u4e00-\\u9faf])', 'g');

                if (line.match(exactMatchRegex)) {
                    // ファンド名の直後の数値を探す
                    // 全角マイナス（−）、半角マイナス（-）、プラス（+）に対応
                    // 例: "株式型+3.52%", "債券型−0.27%"
                    const valueRegex = new RegExp(escapedFundName + '[^\\d]*?([−\\-+]?\\d+\\.?\\d*)%');
                    const match = line.match(valueRegex);

                    if (match) {
                        // 全角マイナスを半角マイナスに変換
                        let numStr = match[1].replace('−', '-');
                        funds[fundName] = parseFloat(numStr);
                        logger.info(`Found ${fundName} in table: ${funds[fundName]}%`);
                    } else if (i + 1 < lines.length) {
                        // 次の行で数値を探す
                        const nextLineMatch = lines[i + 1].match(/([−\-+]?\d+\.?\d*)%/);
                        if (nextLineMatch) {
                            let numStr = nextLineMatch[1].replace('−', '-');
                            funds[fundName] = parseFloat(numStr);
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
                logger.info(`Found header at line ${i}: ${line}`);
                break;
            }
        }

        if (headerLine && headerIndex >= 0) {
            // Extract fund names from header - detect which funds are actually present
            const allFundNames = ['総合型', '債券型', '株式型', '米国債券型', '米国株式型', 'REIT型', '世界株式型', 'マネー型'];
            const detectedFunds = [];

            // Detect which fund names appear in the header and in what order
            for (const fundName of allFundNames) {
                if (headerLine.includes(fundName)) {
                    detectedFunds.push(fundName);
                    logger.info(`Detected fund in header: ${fundName}`);
                }
            }

            // Find "直近1年" line
            for (let i = headerIndex + 1; i < Math.min(headerIndex + 10, lines.length); i++) {
                const periodLine = lines[i];

                if (periodLine.includes('直近1年') || periodLine.includes('直近１年')) {
                    logger.info(`Found "直近1年" at line ${i}`);

                    // Data is on the NEXT line
                    if (i + 1 < lines.length) {
                        const dataLine = lines[i + 1];
                        logger.info(`Data line ${i + 1}: ${dataLine}`);

                        // Extract all percentage values from data line
                        const percentMatches = dataLine.match(/([-+]?\d+\.\d+)%/g);

                        if (percentMatches && percentMatches.length > 0) {
                            logger.info(`Found ${percentMatches.length} percentage values`);
                            // Map percentages to fund names based on detected funds
                            for (let j = 0; j < Math.min(percentMatches.length, detectedFunds.length); j++) {
                                const percentStr = percentMatches[j].replace('%', '');
                                const performance = parseFloat(percentStr);
                                funds[detectedFunds[j]] = performance;
                                logger.info(`Extracted ${detectedFunds[j]}: ${performance}%`);
                            }
                        }
                    }
                    break;
                }
            }
        }

        return funds;
    }

    /**
     * すべての期間のパフォーマンスデータを抽出
     * @param {string} text
     * @returns {Object}
     */
    extractAllPerformanceData(text) {
        const result = {
            totalReturn: {},      // 累積騰落率
            annualizedReturn: {}, // 年率換算利回り
            monthlyReturn: {}     // 月次利回り (年率 / 12)
        };

        const lines = text.split('\n');
        const periods = ['直近1年', '５年', '10年', '20年', '設定来'];

        // Find header line
        let headerLine = null;
        let headerIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('総合型') && line.includes('債券型') && line.includes('株式型')) {
                headerLine = line;
                headerIndex = i;
                logger.info(`Found performance header at line ${i}`);
                break;
            }
        }

        if (!headerLine || headerIndex < 0) {
            logger.warn('Performance table header not found');
            return result;
        }

        const headerParts = headerLine.split(/\t+|\s{2,}/);

        // Extract data for each period
        // First table: Total Return (累積騰落率)
        for (let i = headerIndex + 1; i < Math.min(headerIndex + 10, lines.length); i++) {
            const dataLine = lines[i];

            // Stop when we hit the next header
            if (dataLine.includes('期間') && dataLine.includes('総合型')) {
                break;
            }

            for (const period of periods) {
                if (dataLine.includes(period)) {
                    const dataParts = dataLine.split(/\t+|\s{2,}/);

                    if (!result.totalReturn[period]) {
                        result.totalReturn[period] = {};
                    }

                    for (let j = 0; j < headerParts.length && j < dataParts.length; j++) {
                        const fundName = headerParts[j].trim();
                        const value = dataParts[j].trim();

                        const percentMatch = value.match(/([-+]?\d+\.?\d*)%/);
                        if (percentMatch && fundName !== '期間' && fundName !== '') {
                            result.totalReturn[period][fundName] = parseFloat(percentMatch[1]);
                        }
                    }

                    logger.info(`Extracted total return for ${period}:`, result.totalReturn[period]);
                    break;
                }
            }
        }

        // Second table: Annualized Return (年率換算利回り)
        // Find second header (should be around line headerIndex + 6-7)
        let secondHeaderIndex = -1;
        for (let i = headerIndex + 5; i < Math.min(headerIndex + 15, lines.length); i++) {
            const line = lines[i];
            if (line.includes('期間') && line.includes('総合型')) {
                secondHeaderIndex = i;
                logger.info(`Found annualized return header at line ${i}`);
                break;
            }
        }

        if (secondHeaderIndex >= 0) {
            for (let j = secondHeaderIndex + 1; j < Math.min(secondHeaderIndex + 10, lines.length); j++) {
                const dataLine = lines[j];

                // Stop when we hit the third header
                if (dataLine.includes('期間') && dataLine.includes('総合型') && j > secondHeaderIndex + 1) {
                    break;
                }

                for (const period of periods) {
                    if (dataLine.includes(period)) {
                        const dataParts = dataLine.split(/\t+|\s{2,}/);

                        if (!result.annualizedReturn[period]) {
                            result.annualizedReturn[period] = {};
                        }
                        if (!result.monthlyReturn[period]) {
                            result.monthlyReturn[period] = {};
                        }

                        for (let k = 0; k < headerParts.length && k < dataParts.length; k++) {
                            const fundName = headerParts[k].trim();
                            const value = dataParts[k].trim();

                            const percentMatch = value.match(/([-+]?\d+\.?\d*)%/);
                            if (percentMatch && fundName !== '期間' && fundName !== '') {
                                const annualReturn = parseFloat(percentMatch[1]);
                                result.annualizedReturn[period][fundName] = annualReturn;
                                result.monthlyReturn[period][fundName] = parseFloat((annualReturn / 12).toFixed(3));
                            }
                        }

                        logger.info(`Extracted annualized return for ${period}:`, result.annualizedReturn[period]);
                        break;
                    }
                }
            }
        }

        return result;
    }

    /**
     * 国債利回りを抽出
     * @param {string} text
     * @returns {Object}
     */
    extractBondYields(text) {
        const result = {
            japan10Y: null,
            japanChange: null,
            us10Y: null,
            usChange: null
        };

        const lines = text.split('\n');

        for (const line of lines) {
            // 日本10年国債利回り
            // 例: "月末の10年国債金利は、1.600％(前月末比 +0.055％)で終了しました。"
            const jpMatch = line.match(/10年国債.*?(\d+\.\d+)％.*?([-+]?\d+\.\d+)％/);
            if (jpMatch && !result.japan10Y) {
                result.japan10Y = parseFloat(jpMatch[1]);
                result.japanChange = parseFloat(jpMatch[2]);
                logger.info(`Extracted Japan 10Y yield: ${result.japan10Y}% (${result.japanChange >= 0 ? '+' : ''}${result.japanChange}%)`);
            }

            // 米国10年国債利回り
            // 例: "月末の10年米国国債金利は、4.230％(前月末比 -0.146％)で終了しました。"
            const usMatch = line.match(/10年米国国債.*?(\d+\.\d+)％.*?([-+]?\d+\.\d+)％/);
            if (usMatch && !result.us10Y) {
                result.us10Y = parseFloat(usMatch[1]);
                result.usChange = parseFloat(usMatch[2]);
                logger.info(`Extracted US 10Y yield: ${result.us10Y}% (${result.usChange >= 0 ? '+' : ''}${result.usChange}%)`);
            }
        }

        return result;
    }

    /**
     * PDFから全てのメタデータとデータを抽出
     * @param {Buffer} pdfBuffer
     * @param {string} companyCode - 保険会社コード
     * @returns {Promise<Object>}
     */
    async extractAllData(pdfBuffer, companyCode = null) {
        try {
            const text = await this.extractText(pdfBuffer);
            const fundPerformance = await this.extractFundPerformance(pdfBuffer, companyCode);
            const allPerformanceData = this.extractAllPerformanceData(text);
            const bondYields = this.extractBondYields(text);

            // 決算日を抽出
            const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            let reportDate = null;
            if (dateMatch) {
                reportDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            }

            return {
                text,
                fundPerformance,
                allPerformanceData,
                bondYields,
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
