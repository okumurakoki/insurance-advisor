const pdf = require('pdf-parse');

/**
 * Detect company from PDF content
 * @param {string} text - PDF text content
 * @returns {string} Company code
 */
function detectCompany(text) {
    if (text.includes('ソニー生命') && text.includes('SOVANI')) {
        return 'SONY_LIFE_SOVANI';
    } else if (text.includes('変額個人年金保険（無告知型）22')) {
        return 'SONY_LIFE_ANNUITY';
    } else if (text.includes('ソニー生命') || text.includes('変額保険（特別勘定）の現況')) {
        return 'SONY_LIFE';
    } else if (text.includes('アクサ生命') || text.includes('アクサ・キャピタル')) {
        return 'AXA_LIFE';
    } else if (text.includes('プルデンシャル生命')) {
        return 'PRUDENTIAL_LIFE';
    }
    throw new Error('Unable to detect insurance company from PDF content');
}

/**
 * Parse PDF and auto-detect company
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed data with date and account information
 */
async function parsePDF(pdfBuffer) {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    const companyCode = detectCompany(text);

    switch (companyCode) {
        case 'SONY_LIFE_SOVANI':
            return parseSovaniPDF(pdfBuffer);
        case 'SONY_LIFE_ANNUITY':
            return parseSonyLifeAnnuityPDF(pdfBuffer);
        case 'SONY_LIFE':
            return parseSonyLifePDF(pdfBuffer);
        case 'AXA_LIFE':
            return parseAxaLifePDF(pdfBuffer);
        case 'PRUDENTIAL_LIFE':
            return parsePrudentialLifePDF(pdfBuffer);
        default:
            throw new Error(`Unsupported company: ${companyCode}`);
    }
}

/**
 * Parse SOVANI PDF and extract special account performance data
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed data with date and account information
 */
async function parseSovaniPDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Extract data date from the PDF (e.g., "2025年8月31日現在" or "令和7年8月31日現在")
        const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日現在/);
        let dataDate = null;
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const day = dateMatch[3].padStart(2, '0');
            dataDate = `${year}-${month}-${day}`;
        }

        // Extract special account performance data
        const accounts = [];

        // Pattern to match account names and their performance data
        // The PDF contains a table like:
        // バランス型20 105.87 ＋0.29％ ＋2.06％ ＋1.74％ ＋2.29％ ＋5.87％
        const accountPatterns = [
            { name: 'バランス型20', code: 'BALANCE_20', type: 'balanced' },
            { name: 'バランス型40', code: 'BALANCE_40', type: 'balanced' },
            { name: 'バランス型60', code: 'BALANCE_60', type: 'balanced' },
            { name: 'バランス型80', code: 'BALANCE_80', type: 'balanced' },
            { name: '日本株式型TOP', code: 'JP_STOCK_TOP', type: 'equity', altNames: ['日本株式ＴＯＰ型', '日本株式TOP型'] },
            { name: '日本株式型JV', code: 'JP_STOCK_JV', type: 'equity', altNames: ['日本株式ＪＶ型', '日本株式JV型'] },
            { name: '日本株式型JG', code: 'JP_STOCK_JG', type: 'equity', altNames: ['日本株式ＪＧ型', '日本株式JG型'] },
            { name: '世界株式型GQ', code: 'WORLD_STOCK_GQ', type: 'equity', altNames: ['世界株式ＧＱ型', '世界株式GQ型'] },
            { name: '世界株式型GI', code: 'WORLD_STOCK_GI', type: 'equity', altNames: ['世界株式ＧＩ型', '世界株式GI型'] },
            { name: '海外株式型MSP', code: 'FOREIGN_STOCK_MSP', type: 'equity', altNames: ['外国株式ＭＳＰ型', '外国株式MSP型', '海外株式ＭＳＰ型'] },
            { name: '日本債券型NOP', code: 'DOMESTIC_BOND', type: 'bond', altNames: ['国内債券型', '日本債券ＮＯＰ型'] },
            { name: '海外債券型FTP', code: 'FOREIGN_BOND', type: 'bond', altNames: ['外国債券型', '海外債券ＦＴＰ型'] },
            { name: '世界債券型GQ', code: 'WORLD_BOND_GD', type: 'bond', altNames: ['世界債券ＧＤ型', '世界債券ＧＱ型', '世界債券GD型', '世界債券GQ型'] },
            { name: '海外リート型SPP', code: 'WORLD_REIT', type: 'reit', altNames: ['世界ＲＥＩＴ型', '世界リート型', '海外リートＳＰＰ型'] },
            { name: '日本リート型TSP', code: 'JP_REIT', type: 'reit', altNames: ['日本ＲＥＩＴ型', '日本リートＴＳＰ型'] },
            { name: 'マネー型', code: 'MONEY_MARKET', type: 'money_market', altNames: ['マネーマーケット型'] }
        ];

        // Find the performance table section
        // The table looks like:
        // 特別勘定 指数値 前月末比 3ヶ月 6ヶ月 1年 設定来
        // バランス型20 105.87 ＋0.29％ ＋2.06％ ＋1.74％ ＋2.29％ ＋5.87％

        for (const pattern of accountPatterns) {
            // Build regex to search for this account name and all possible alt names
            const searchNames = [pattern.name, ...(pattern.altNames || [])];
            let foundData = null;

            for (const searchName of searchNames) {
                if (foundData) break;

                // Escape special characters for regex
                const escapedName = searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Try to match a line in the performance table
                // Format: AccountName IndexValue ％ ％ ％ ％ ％
                // Example: バランス型20105.87＋0.29％＋2.06％＋1.74％＋2.29％＋5.87％
                // or: バランス型20 105.87 ＋0.29％ ＋2.06％ ＋1.74％ ＋2.29％ ＋5.87％

                const linePattern = new RegExp(
                    escapedName +
                    '[\\s\\u3000]*' +  // Optional whitespace (including full-width)
                    '([\\d,]+\\.\\d+)' + // Index value
                    '[\\s\\u3000]*' +
                    '[＋\\+\\-－−][\\d\\.]+[％%]' + // Skip 前月末比 (previous month)
                    '[\\s\\u3000]*' +
                    '[＋\\+\\-－−]?([\\d\\.]+)[％%]' + // 3 months
                    '[\\s\\u3000]*' +
                    '[＋\\+\\-－−]?([\\d\\.]+)[％%]' + // 6 months
                    '[\\s\\u3000]*' +
                    '[＋\\+\\-－−]?([\\d\\.]+)[％%]', // 1 year
                    'u'
                );

                const match = text.match(linePattern);
                if (match) {
                    foundData = {
                        accountName: pattern.name,
                        accountCode: pattern.code,
                        accountType: pattern.type,
                        unitPrice: parseFloat(match[1].replace(/,/g, '')),
                        return3m: parseFloat(match[2].replace(/[＋\\+]/g, '').replace(/[－−]/g, '-')),
                        return6m: parseFloat(match[3].replace(/[＋\\+]/g, '').replace(/[－−]/g, '-')),
                        return1y: parseFloat(match[4].replace(/[＋\\+]/g, '').replace(/[－−]/g, '-'))
                    };

                    // Try to extract 1M return by looking for the value before 3M
                    const oneMonthPattern = new RegExp(
                        escapedName +
                        '[\\s\\u3000]*' +
                        match[1] + // Use the found index value
                        '[\\s\\u3000]*' +
                        '[＋\\+\\-－−]?([\\d\\.]+)[％%]', // Previous month / 1M
                        'u'
                    );
                    const oneMonthMatch = text.match(oneMonthPattern);
                    if (oneMonthMatch) {
                        foundData.return1m = parseFloat(oneMonthMatch[1].replace(/[＋\\+]/g, '').replace(/[－−]/g, '-'));
                    }
                }
            }

            if (foundData) {
                accounts.push(foundData);
            } else {
                console.warn(`Could not extract data for ${pattern.name}`);
            }
        }

        return {
            dataDate,
            accounts,
            companyCode: 'SONY_LIFE_SOVANI'
        };
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`PDF parsing failed: ${error.message}`);
    }
}

/**
 * Parse Sony Life Variable Life PDF
 * This format shows monthly returns in a table format
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed data
 */
async function parseSonyLifePDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Extract data date
        const dateMatch = text.match(/(\d{4})年(\d{1,2})月末現在/);
        let dataDate = null;
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            // Use last day of month
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            dataDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        }

        const accounts = [];

        // Account patterns for Sony Life Variable Life
        // These accounts are from the performance table that shows monthly returns
        const accountPatterns = [
            { name: '世界株式型', code: 'SONY_GLOBAL_EQUITY', type: '株式型' },
            { name: '世界コア株式型', code: 'SONY_CORE_GLOBAL_EQUITY', type: '株式型' },
            { name: '世界債券型', code: 'SONY_GLOBAL_BOND', type: '債券型' },
            { name: '株式型', code: 'SONY_DOMESTIC_EQUITY', type: '株式型' },
            { name: '日本成長株式型', code: 'SONY_DOMESTIC_GROWTH', type: '株式型' },
            { name: '総合型', code: 'SONY_BALANCED_TOTAL', type: 'バランス型' },
            { name: '債券型', code: 'SONY_BOND', type: '債券型' },
            { name: '短期金融市場型', code: 'SONY_MONEY_MARKET', type: '短期金融' }
        ];

        // Look for the monthly return table
        // Format: 特別勘定 指数騰落率
        for (const pattern of accountPatterns) {
            const escapedName = pattern.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Try to find the monthly return percentage
            const returnPattern = new RegExp(
                escapedName +
                '[\\s\\u3000]*' +
                '([＋\\+\\-－−]?[\\d\\.]+)[％%]',
                'u'
            );

            const match = text.match(returnPattern);
            if (match) {
                const monthlyReturn = parseFloat(match[1].replace(/[＋\\+]/g, '').replace(/[－−]/g, '-'));

                accounts.push({
                    accountName: pattern.name,
                    accountCode: pattern.code,
                    accountType: pattern.type,
                    return1m: monthlyReturn,
                    // Note: This PDF format doesn't provide unit prices directly
                    // We only have monthly return percentages
                    unitPrice: null
                });
            } else {
                console.warn(`Could not extract data for ${pattern.name}`);
            }
        }

        return {
            dataDate,
            accounts,
            companyCode: 'SONY_LIFE'
        };
    } catch (error) {
        console.error('Error parsing Sony Life PDF:', error);
        throw new Error(`Sony Life PDF parsing failed: ${error.message}`);
    }
}

/**
 * Parse Sony Life Annuity (変額個人年金保険(無告知型)22) PDF
 * This format shows index values and multi-period returns in a table format
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed data
 */
async function parseSonyLifeAnnuityPDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Extract data date from "2025年8月" pattern
        // Convert to last day of month (e.g., "2025年8月" -> "2025-08-31")
        const dateMatch = text.match(/(\d{4})年(\d{1,2})月/);
        let dataDate = null;
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            // Calculate last day of month
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            dataDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        }

        const accounts = [];

        // Account patterns for Sony Life Annuity
        // Format: バランス型20 105.87 ＋0.29％ ＋2.06％ ＋1.74％ ＋2.29％
        // Or: バランス型20105.87＋0.29％＋2.06％＋1.74％＋2.29％
        const accountPatterns = [
            { name: 'バランス型20', code: 'SONY_ANNUITY_BALANCE20', type: 'バランス型' },
            { name: 'バランス型40', code: 'SONY_ANNUITY_BALANCE40', type: 'バランス型' },
            { name: 'バランス型60', code: 'SONY_ANNUITY_BALANCE60', type: 'バランス型' },
            { name: 'バランス型80', code: 'SONY_ANNUITY_BALANCE80', type: 'バランス型' },
            { name: '日本株式型TOP', code: 'SONY_ANNUITY_JP_EQUITY_TOP', type: '株式型' },
            { name: '日本株式型JV', code: 'SONY_ANNUITY_JP_EQUITY_JV', type: '株式型' },
            { name: '日本株式型JG', code: 'SONY_ANNUITY_JP_EQUITY_JG', type: '株式型' },
            { name: 'マネー型', code: 'SONY_ANNUITY_MONEY', type: '短期金融' },
            { name: '世界株式型GQ', code: 'SONY_ANNUITY_GLOBAL_EQUITY_GQ', type: '株式型' },
            { name: '世界株式型GI', code: 'SONY_ANNUITY_GLOBAL_EQUITY_GI', type: '株式型' },
            { name: '海外株式型MSP', code: 'SONY_ANNUITY_FOREIGN_EQUITY_MSP', type: '株式型' },
            { name: '日本債券型NOP', code: 'SONY_ANNUITY_JP_BOND_NOP', type: '債券型' },
            { name: '世界債券型GQ', code: 'SONY_ANNUITY_GLOBAL_BOND_GQ', type: '債券型' },
            { name: '海外債券型FTP', code: 'SONY_ANNUITY_FOREIGN_BOND_FTP', type: '債券型' }
        ];

        // Parse each account's data
        for (const pattern of accountPatterns) {
            const escapedName = pattern.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Pattern to match: AccountName + IndexValue + 前月末比 + 3ヶ月 + 6ヶ月 + 1年
            // Example: バランス型20105.87＋0.29％＋2.06％＋1.74％＋2.29％
            // or: バランス型20 105.87 ＋0.29％ ＋2.06％ ＋1.74％ ＋2.29％
            // Note: Negative values may be marked with △ or －
            const linePattern = new RegExp(
                escapedName +
                '[\\s\\u3000]*' +  // Optional whitespace
                '([\\d,]+\\.\\d+)' + // Index value (unit price)
                '[\\s\\u3000]*' +
                '([＋\\+\\-－−△]?[\\d\\.]+)[％%]' + // 前月末比 (1M return)
                '[\\s\\u3000]*' +
                '([＋\\+\\-－−△]?[\\d\\.]+)[％%]' + // 3ヶ月 (3M return)
                '[\\s\\u3000]*' +
                '([＋\\+\\-－−△]?[\\d\\.]+)[％%]' + // 6ヶ月 (6M return)
                '[\\s\\u3000]*' +
                '([＋\\+\\-－−△]?[\\d\\.]+)[％%]', // 1年 (1Y return)
                'u'
            );

            const match = text.match(linePattern);
            if (match) {
                // Parse unit price
                const unitPrice = parseFloat(match[1].replace(/,/g, ''));

                // Parse returns - handle △ and － as negative, remove ＋
                const return1m = parseFloat(
                    match[2]
                        .replace(/[＋\\+]/g, '')
                        .replace(/[△－−]/g, '-')
                );
                const return3m = parseFloat(
                    match[3]
                        .replace(/[＋\\+]/g, '')
                        .replace(/[△－−]/g, '-')
                );
                const return6m = parseFloat(
                    match[4]
                        .replace(/[＋\\+]/g, '')
                        .replace(/[△－−]/g, '-')
                );
                const return1y = parseFloat(
                    match[5]
                        .replace(/[＋\\+]/g, '')
                        .replace(/[△－−]/g, '-')
                );

                accounts.push({
                    accountName: pattern.name,
                    accountCode: pattern.code,
                    accountType: pattern.type,
                    unitPrice: unitPrice,
                    return1m: return1m,
                    return3m: return3m,
                    return6m: return6m,
                    return1y: return1y
                });
            } else {
                console.warn(`Could not extract data for ${pattern.name}`);
            }
        }

        return {
            dataDate,
            accounts,
            companyCode: 'SONY_LIFE_ANNUITY'
        };
    } catch (error) {
        console.error('Error parsing Sony Life Annuity PDF:', error);
        throw new Error(`Sony Life Annuity PDF parsing failed: ${error.message}`);
    }
}

/**
 * Parse AXA Life PDF
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed data
 */
async function parseAxaLifePDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Extract data date
        const dateMatch = text.match(/(\d{4})年(\d{1,2})月末現在/);
        let dataDate = null;
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            dataDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        }

        const accounts = [];

        // Account patterns for AXA Life
        // Note: "外国株式型" doesn't exist in performance data, only "外国株式プラス型"
        const accountPatterns = [
            { name: '安定成長バランス型', code: 'AXA_BALANCED_STABLE', type: 'バランス型' },
            { name: '積極運用バランス型', code: 'AXA_BALANCED_AGGRESSIVE', type: 'バランス型' },
            { name: '日本株式型', code: 'AXA_DOMESTIC_EQUITY', type: '株式型' },
            { name: '日本株式プラス型', code: 'AXA_DOMESTIC_EQUITY_PLUS', type: '株式型' },
            { name: '新興国株式型', code: 'AXA_EMERGING_EQUITY', type: '株式型' },
            { name: '外国株式プラス型', code: 'AXA_FOREIGN_EQUITY_PLUS', type: '株式型' },
            { name: '世界株式プラス型', code: 'AXA_GLOBAL_EQUITY', type: '株式型' },
            { name: 'SDGs世界株式型', code: 'AXA_SDGS_EQUITY', type: '株式型' },
            { name: '外国債券型', code: 'AXA_FOREIGN_BOND', type: '債券型' },
            { name: 'オーストラリア債券型', code: 'AXA_AUSTRALIA_BOND', type: '債券型' },
            { name: '世界債券プラス型', code: 'AXA_GLOBAL_BOND', type: '債券型' },
            { name: '金融市場型', code: 'AXA_MONEY_MARKET', type: '短期金融' }
        ];

        // AXA PDF has a specific format:
        // Line 1: AccountName + Date
        // Line 2: UnitPrice + 1M + 6M + 1Y + 3Y + 5Y + Inception (numbers with △ for negative)
        // Example: 新興国株式型2015/5/1\n165.83△ 0.5311.7818.42
        for (const pattern of accountPatterns) {
            const escapedName = pattern.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Pattern: AccountName followed by date, then next line has numbers
            // Handle both space-separated and concatenated numbers, with △ for negative
            const performancePattern = new RegExp(
                escapedName +
                '\\d{4}/\\d{1,2}/\\d{1,2}[\\s\\u3000]*[\\n\\r]+' +
                '([\\d\\.△\\s＋\\+\\-－−]+)',   // Numbers with optional △, spaces, and +/- signs
                'u'
            );

            const match = text.match(performancePattern);
            if (match) {
                // Clean up the matched string
                let numbersStr = match[1].trim();

                // Replace △ with minus sign
                numbersStr = numbersStr.replace(/△/g, '-');

                // Parse concatenated format like: 249.230.994.135.11
                // Strategy: Split by dots, then group digits appropriately
                // Unit price format: XXX.XX (3 digits, dot, 2 digits)
                // Return format: X.XX or XX.XX (1-2 digits, dot, 2 digits)

                // Remove all △ symbols first and handle negatives separately
                const hasNegative = numbersStr.includes('-');
                const cleanStr = numbersStr.replace(/[\-△＋\\+\s]/g, '');

                // Split by decimal point
                const parts = cleanStr.split('.');

                if (parts.length >= 5) {
                    // Parse format: 249.230.994.135.11
                    // Which represents: 249.23 | 0.99 | 4.13 | 5.11
                    //
                    // parts[0] = "249"
                    // parts[1] = "23" + "0" (unit price decimal + next int)
                    // parts[2] = "99" + "4" (1M decimal + next int)
                    // parts[3] = "13" + "5" (6M decimal + next int)
                    // parts[4] = "11" (1Y decimal)

                    // Unit Price: parts[0] + "." + first 2 chars of parts[1]
                    const unitPrice = parseFloat(parts[0] + '.' + parts[1].substring(0, 2));

                    let return1m = null;
                    let return6m = null;
                    let return1y = null;

                    // 1M Return: remaining chars of parts[1] + "." + first 2 chars of parts[2]
                    if (parts[1].length > 2 && parts[2].length >= 2) {
                        const r1m_int = parts[1].substring(2); // After unit price decimal
                        const r1m_dec = parts[2].substring(0, 2); // First 2 digits
                        return1m = parseFloat(r1m_int + '.' + r1m_dec);

                        // Check if negative
                        if (numbersStr.includes('-' + r1m_dec) || numbersStr.includes('- ' + r1m_dec)) {
                            return1m = -return1m;
                        }
                    }

                    // 6M Return: remaining chars of parts[2] + "." + first 2 chars of parts[3]
                    if (parts[2].length > 2 && parts[3].length >= 2) {
                        const r6m_int = parts[2].substring(2);
                        const r6m_dec = parts[3].substring(0, 2);
                        return6m = parseFloat(r6m_int + '.' + r6m_dec);
                    }

                    // 1Y Return: remaining chars of parts[3] + "." + parts[4]
                    if (parts[3].length > 2 && parts[4]) {
                        const r1y_int = parts[3].substring(2);
                        const r1y_dec = parts[4];
                        return1y = parseFloat(r1y_int + '.' + r1y_dec);
                    }

                    accounts.push({
                        accountName: pattern.name,
                        accountCode: pattern.code,
                        accountType: pattern.type,
                        unitPrice: unitPrice,
                        return1m: return1m,
                        return6m: return6m,
                        return1y: return1y
                    });
                } else {
                    console.warn(`Could not parse performance data for ${pattern.name}: ${numbersStr}`);
                }
            } else {
                console.warn(`Could not extract data for ${pattern.name}`);
            }
        }

        return {
            dataDate,
            accounts,
            companyCode: 'AXA_LIFE'
        };
    } catch (error) {
        console.error('Error parsing AXA Life PDF:', error);
        throw new Error(`AXA Life PDF parsing failed: ${error.message}`);
    }
}

/**
 * Parse Prudential Life PDF
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed data
 */
async function parsePrudentialLifePDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Extract data date - Prudential uses two formats:
        // Format 1: "2025年4月30日現在"
        // Format 2: "（2025年7月末）" - convert to last day of month
        let dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日現在/);
        let dataDate = null;
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const day = dateMatch[3].padStart(2, '0');
            dataDate = `${year}-${month}-${day}`;
        } else {
            // Try format 2: "（2025年7月末）"
            dateMatch = text.match(/[（(](\d{4})年(\d{1,2})月末[）)]/);
            if (dateMatch) {
                const year = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]);
                // Get last day of month
                const lastDay = new Date(year, month, 0).getDate();
                dataDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
            }
        }

        const accounts = [];

        // Account patterns for Prudential Life
        const accountPatterns = [
            { name: '総合型', code: 'PRU_BALANCED_TOTAL', type: 'バランス型' },
            { name: '債券型', code: 'PRU_BOND', type: '債券型' },
            { name: '株式型', code: 'PRU_DOMESTIC_EQUITY', type: '株式型' },
            { name: '米国債券型', code: 'PRU_US_BOND', type: '債券型' },
            { name: '米国株式型', code: 'PRU_US_EQUITY', type: '株式型' },
            { name: 'REIT型', code: 'PRU_REIT', type: 'REIT型' },
            { name: '世界株式型', code: 'PRU_GLOBAL_EQUITY', type: '株式型' },
            { name: '外国株式型', code: 'PRU_FOREIGN_EQUITY', type: '株式型' },
            { name: '新興国株式型', code: 'PRU_EMERGING_EQUITY', type: '株式型' },
            { name: '世界債券型', code: 'PRU_GLOBAL_BOND', type: '債券型' },
            { name: '外国債券型', code: 'PRU_FOREIGN_BOND', type: '債券型' },
            { name: '短期金融市場型', code: 'PRU_MONEY_MARKET', type: '短期金融' }
        ];

        // Prudential uses format:
        // ●総合型
        // ﾕﾆｯﾄﾊﾞﾘｭｰ︓ 306.58
        // 期 間騰落率利回り月払利回り
        // 直近1年   -0.64%   -0.64%-2.32%

        for (const pattern of accountPatterns) {
            const escapedName = pattern.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Pattern to match: ●AccountName\nﾕﾆｯﾄﾊﾞﾘｭｰ: UnitPrice\n...\n直近1年 Return%
            const accountPattern = new RegExp(
                '●' + escapedName +
                '[\\s\\S]*?' +
                'ﾕﾆｯﾄﾊﾞﾘｭｰ[︓:]\\s*([0-9.]+)' +
                '[\\s\\S]*?' +
                '直近1年\\s+([＋\\+\\-－−△]?[0-9.]+)[％%]',
                'u'
            );

            const match = text.match(accountPattern);
            if (match) {
                const unitPrice = parseFloat(match[1]);
                let return1y = parseFloat(match[2].replace(/[＋\\+]/g, '').replace(/[－−△]/g, '-'));

                accounts.push({
                    accountName: pattern.name,
                    accountCode: pattern.code,
                    accountType: pattern.type,
                    unitPrice: unitPrice,
                    return1m: null,
                    return3m: null,
                    return6m: null,
                    return1y: return1y
                });
            } else {
                console.warn(`Could not extract data for ${pattern.name}`);
            }
        }

        return {
            dataDate,
            accounts,
            companyCode: 'PRUDENTIAL_LIFE'
        };
    } catch (error) {
        console.error('Error parsing Prudential Life PDF:', error);
        throw new Error(`Prudential Life PDF parsing failed: ${error.message}`);
    }
}

/**
 * Validate parsed data
 * @param {Object} parsedData - Data returned from parseSovaniPDF
 * @returns {boolean} True if valid
 */
function validateParsedData(parsedData) {
    if (!parsedData.dataDate) {
        throw new Error('Data date not found in PDF');
    }

    if (!parsedData.accounts || parsedData.accounts.length === 0) {
        throw new Error('No account data found in PDF');
    }

    // Check that each account has required fields
    for (const account of parsedData.accounts) {
        if (!account.accountName) {
            throw new Error(`Invalid account data: ${JSON.stringify(account)}`);
        }
        // Note: unitPrice may be null for some PDF formats that only provide returns
    }

    return true;
}

module.exports = {
    parsePDF,
    parseSovaniPDF,
    parseSonyLifePDF,
    parseSonyLifeAnnuityPDF,
    parseAxaLifePDF,
    parsePrudentialLifePDF,
    detectCompany,
    validateParsedData
};
