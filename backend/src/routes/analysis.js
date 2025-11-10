const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Customer = require('../models/Customer');
const AnalysisResult = require('../models/AnalysisResult');
const MarketData = require('../models/MarketData');
const NotebookLMService = require('../services/notebookLM.service');
const AllocationCalculator = require('../services/calculator.service');
const logger = require('../utils/logger');
const { authenticateToken, authorizePlanFeature, authorizeAccountType } = require('../middleware/auth');
const PDFReportGenerator = require('../utils/pdf-generator');
const ExcelReportGenerator = require('../utils/excel-generator');
const db = require('../utils/database-factory');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

/**
 * Helper function: Get fund performance returns from latest market data
 * @param {number} companyId - Insurance company ID
 * @returns {Promise<Object>} { fundType: annualReturn }
 */
async function getFundReturnsFromMarketData(companyId) {
    try {
        const latestMarketData = await MarketData.getLatest('monthly_report', companyId);

        if (!latestMarketData || !latestMarketData.data_content) {
            logger.warn(`No market data found for company ${companyId}, returning empty fund returns`);
            return {};
        }

        const fundPerformance = latestMarketData.data_content.fundPerformance || {};

        // Convert to object with fund type as key
        const fundReturns = {};
        if (Array.isArray(fundPerformance)) {
            // If it's an array, convert to object
            fundPerformance.forEach(fund => {
                if (fund.fundType && fund.performance !== undefined) {
                    fundReturns[fund.fundType] = fund.performance;
                }
            });
        } else if (typeof fundPerformance === 'object') {
            // If it's already an object, use it directly
            Object.keys(fundPerformance).forEach(fundType => {
                fundReturns[fundType] = fundPerformance[fundType];
            });
        }

        logger.info(`Retrieved ${Object.keys(fundReturns).length} fund returns for company ${companyId}`);
        return fundReturns;
    } catch (error) {
        logger.error('Error retrieving fund returns from market data:', error);
        return {};
    }
}

// Get latest market data info
router.get('/market-data/latest', authenticateToken, async (req, res) => {
    try {
        // Get company_id from query parameter (optional for backward compatibility)
        const companyId = req.query.company_id ? parseInt(req.query.company_id) : null;

        logger.info(`Fetching latest market data for company_id: ${companyId}`);

        const latest = await MarketData.getLatest('monthly_report', companyId);

        if (!latest) {
            logger.info(`No market data found for company_id: ${companyId}`);
            return res.json(null);
        }

        res.json({
            id: latest.id,
            fileName: latest.data_content?.fileName || latest.source_file,
            uploadedAt: latest.created_at,
            uploadedBy: latest.uploaded_by,
            dataDate: latest.data_date,
            companyCode: latest.company_code,
            companyName: latest.company_name,
            fundPerformance: latest.data_content?.fundPerformance || {},
            allPerformanceData: latest.data_content?.allPerformanceData || {},
            bondYields: latest.data_content?.bondYields || {},
            parsedSuccessfully: latest.data_content?.parsedSuccessfully || false
        });
    } catch (error) {
        // Check if the error is due to table not existing
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            logger.info('Market data table does not exist - returning null (feature not enabled)');
            return res.json(null);
        }

        logger.error('Failed to get latest market data:', error);
        logger.error('Error stack:', error.stack);
        logger.error('Company ID:', req.query.company_id);
        // Return null instead of 500 error since market data is optional
        res.json(null);
    }
});

// Get historical market data (past 24 months) - Admin only
router.get('/market-data/history', authenticateToken, async (req, res) => {
    try {
        // 管理者のみアクセス可能
        if (req.user.accountType !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin account required.' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago

        const historyData = await MarketData.getByDateRange(startDate, endDate, 'monthly_report');

        // 各PDFの活用状況を取得
        const db = require('../utils/database-factory');
        const formattedData = await Promise.all(historyData.map(async (data) => {
            // このPDFを使って分析した顧客数を取得
            const usageQuery = await db.query(`
                SELECT COUNT(DISTINCT ar.customer_id) as usage_count,
                       MAX(ar.analysis_date) as last_used
                FROM analysis_results ar
                JOIN customers c ON ar.customer_id = c.id
                WHERE c.insurance_company_id = $1
                AND ar.analysis_date >= $2
            `, [data.company_id, data.created_at]);

            const usage = usageQuery[0] || { usage_count: 0, last_used: null };

            return {
                id: data.id,
                fileName: data.data_content?.fileName || data.source_file,
                uploadedAt: data.created_at,
                dataDate: data.data_date,
                uploadedBy: data.uploaded_by,
                companyId: data.company_id,
                companyCode: data.company_code,
                companyName: data.company_name,
                displayName: data.display_name,
                parsedSuccessfully: data.data_content?.parsedSuccessfully || false,
                fundCount: Object.keys(data.data_content?.fundPerformance || {}).length,
                usageCount: parseInt(usage.usage_count, 10),
                lastUsed: usage.last_used
            };
        }));

        res.json(formattedData);
    } catch (error) {
        logger.error('Failed to get market data history:', error);
        res.status(500).json({ error: 'Failed to get market data history' });
    }
});

router.post('/upload-market-data',
    authenticateToken,
    (req, res, next) => {
        // 管理者のみ許可
        if (req.user.accountType !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin account required.' });
        }
        next();
    },
    upload.single('marketData'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }

        try {
            const pdfBuffer = req.file.buffer;
            const companyId = req.body.company_id;

            // Validate that company_id is provided
            if (!companyId) {
                return res.status(400).json({
                    error: '保険会社を選択してください',
                    code: 'MISSING_COMPANY_ID'
                });
            }

            // Get company code from company_id
            const db = require('../utils/database-factory');
            const companyResult = await db.query(
                'SELECT company_code FROM insurance_companies WHERE id = $1',
                [parseInt(companyId)]
            );
            const companyCode = companyResult[0] ? companyResult[0].company_code : null;

            logger.info(`Uploading PDF for company: ${companyCode} (ID: ${companyId})`);

            // Parse PDF with auto-detection using new parser
            const { parsePDF, validateParsedData } = require('../utils/pdfParser');
            const parsedData = await parsePDF(pdfBuffer);

            // Validate parsed data
            validateParsedData(parsedData);

            logger.info(`Detected company: ${parsedData.companyCode}`);
            logger.info(`Parsed data date: ${parsedData.dataDate}`);
            logger.info(`Parsed ${parsedData.accounts.length} accounts`);

            // Start transaction
            await db.query('BEGIN');

            let newAccountsCount = 0;
            let newPerformanceCount = 0;
            let updatedPerformanceCount = 0;

            try {
                for (const account of parsedData.accounts) {
                    // Check if special account exists
                    let specialAccount = await db.query(
                        'SELECT id FROM special_accounts WHERE company_id = $1 AND account_code = $2',
                        [parseInt(companyId), account.accountCode]
                    );

                    let accountId;

                    if (specialAccount.length === 0) {
                        // Insert new special account
                        const insertResult = await db.query(
                            `INSERT INTO special_accounts (
                                company_id, account_code, account_name, account_type, is_active
                            ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                            [parseInt(companyId), account.accountCode, account.accountName, account.accountType]
                        );
                        accountId = insertResult[0].id;
                        newAccountsCount++;
                    } else {
                        accountId = specialAccount[0].id;
                    }

                    // Check if performance data exists for this date
                    const existingPerf = await db.query(
                        `SELECT id FROM special_account_performance
                         WHERE special_account_id = $1 AND performance_date = $2`,
                        [accountId, parsedData.dataDate]
                    );

                    if (existingPerf.length === 0) {
                        // Insert new performance data
                        await db.query(
                            `INSERT INTO special_account_performance (
                                special_account_id, performance_date, unit_price,
                                return_1m, return_3m, return_6m, return_1y
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [
                                accountId,
                                parsedData.dataDate,
                                account.unitPrice,
                                account.return1m || null,
                                account.return3m || null,
                                account.return6m || null,
                                account.return1y || null
                            ]
                        );
                        newPerformanceCount++;
                    } else {
                        // Update existing performance data
                        await db.query(
                            `UPDATE special_account_performance SET
                                unit_price = $1,
                                return_1m = $2,
                                return_3m = $3,
                                return_6m = $4,
                                return_1y = $5
                             WHERE id = $6`,
                            [
                                account.unitPrice,
                                account.return1m || null,
                                account.return3m || null,
                                account.return6m || null,
                                account.return1y || null,
                                existingPerf[0].id
                            ]
                        );
                        updatedPerformanceCount++;
                    }
                }

                // Commit transaction
                await db.query('COMMIT');

                logger.info(`Market data uploaded by user: ${req.user.userId}, file: ${req.file.originalname}`);

                res.json({
                    success: true,
                    message: 'PDF processed successfully',
                    data: {
                        dataDate: parsedData.dataDate,
                        companyCode: parsedData.companyCode,
                        totalAccounts: parsedData.accounts.length,
                        newAccountsCreated: newAccountsCount,
                        newPerformanceRecords: newPerformanceCount,
                        updatedPerformanceRecords: updatedPerformanceCount
                    }
                });

            } catch (error) {
                // Rollback on error
                await db.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            logger.error('Market data upload error:', error);
            res.status(500).json({ error: 'Failed to upload market data' });
        }
    }
);

router.post('/recommend/:customerId',
    authenticateToken,
    async (req, res) => {
        const { customerId } = req.params;

        try {
            const customer = await Customer.findById(customerId);

            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            // 権限チェック：担当者は自分の顧客のみ、代理店は配下の担当者の顧客すべて、管理者は全て
            const User = require('../models/User');
            let hasAccess = false;

            if (req.user.accountType === 'admin') {
                // 管理者：全ての顧客にアクセス可能
                hasAccess = true;
            } else if (req.user.accountType === 'child') {
                // 担当者：自分の顧客のみ
                hasAccess = customer.user_id === req.user.id;
            } else if (req.user.accountType === 'parent') {
                // 代理店：配下の担当者の顧客すべて
                const staff = await User.findById(customer.user_id);
                hasAccess = staff && staff.parent_id === req.user.id;
            }

            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Check if customer has insurance company assigned
            if (!customer.insurance_company_id) {
                return res.status(400).json({
                    error: 'この顧客には保険会社が設定されていません。顧客情報を更新して保険会社を設定してください。',
                    code: 'MISSING_INSURANCE_COMPANY'
                });
            }

            // Frequency check disabled - allow unlimited analysis
            // const canAnalyze = await AnalysisResult.checkAnalysisFrequency(
            //     customerId,
            //     req.planFeature.feature_value
            // );

            // if (!canAnalyze) {
            //     return res.status(429).json({
            //         error: `Analysis frequency limit reached. Your ${req.user.planType} plan allows ${req.planFeature.feature_value} analysis.`
            //     });
            // }

            // Get latest market data for customer's insurance company
            const latestMarketData = await MarketData.getLatest(customer.insurance_company_id);

            const notebookLM = new NotebookLMService();
            const analysisPrompt = `
                顧客プロフィール:
                - 契約日: ${customer.contract_date}
                - 月額保険料: ${customer.monthly_premium} 円
                - リスク許容度: ${customer.risk_tolerance}
                - 投資目標: ${customer.investment_goal || '資産形成'}

                上記の顧客プロフィールと市場データを考慮して、最適な投資配分を提案してください。
            `;

            let notebookLMResult;
            if (!latestMarketData) {
                logger.warn(`No market data available for insurance_company_id: ${customer.insurance_company_id}`);
                return res.status(400).json({
                    error: 'この保険会社の市場データ（PDF）が登録されていません。管理者にPDFのアップロードを依頼してください。',
                    code: 'MISSING_MARKET_DATA',
                    companyId: customer.insurance_company_id
                });
            } else {
                notebookLMResult = await notebookLM.analyzePDF(
                    latestMarketData.pdf_content,
                    analysisPrompt,
                    latestMarketData.data_content
                );
            }

            const calculator = new AllocationCalculator(
                notebookLMResult.recommendedAllocation,
                notebookLMResult.adjustmentFactors
            );

            const personalizedAllocation = calculator.calculatePersonalizedAllocation(customer);

            const analysisId = await AnalysisResult.create({
                customer_id: customerId,
                analysis_date: new Date(),
                market_data_source: latestMarketData?.source_file || 'default_analysis',
                base_allocation: notebookLMResult.recommendedAllocation,
                adjusted_allocation: personalizedAllocation,
                adjustment_factors: notebookLMResult.adjustmentFactors,
                recommendation_text: notebookLMResult.marketAnalysis,
                confidence_score: 0.85,
                created_by: req.user.id
            });

            logger.info(`Analysis generated for customer: ${customer.name} by user: ${req.user.userId}`);

            res.json({
                analysisId,
                customer: {
                    name: customer.name,
                    contractMonths: await Customer.calculateContractMonths(customer.contract_date),
                    monthlyPremium: customer.monthly_premium,
                    riskTolerance: customer.risk_tolerance
                },
                allocation: personalizedAllocation,
                marketAnalysis: notebookLMResult.marketAnalysis,
                adjustmentFactors: notebookLMResult.adjustmentFactors,
                confidenceScore: 0.85
            });
        } catch (error) {
            logger.error('Analysis recommendation error:', error);
            res.status(500).json({ error: 'Failed to generate recommendation' });
        }
    }
);

router.get('/history/:customerId', authenticateToken, async (req, res) => {
    const { customerId } = req.params;

    try {
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 権限チェック：担当者は自分の顧客のみ、代理店は配下の担当者の顧客すべて、管理者は全て
        const User = require('../models/User');
        let hasAccess = false;

        if (req.user.accountType === 'admin') {
            // 管理者：全ての顧客にアクセス可能
            hasAccess = true;
        } else if (req.user.accountType === 'child') {
            // 担当者：自分の顧客のみ
            hasAccess = customer.user_id === req.user.id;
        } else if (req.user.accountType === 'parent') {
            // 代理店：配下の担当者の顧客すべて
            const staff = await User.findById(customer.user_id);
            hasAccess = staff && staff.parent_id === req.user.id;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const history = await AnalysisResult.getByCustomerId(customerId);
        
        res.json(history);
    } catch (error) {
        logger.error('Analysis history fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch analysis history' });
    }
});

// Get all analysis results (reports) for current user
router.get('/results', authenticateToken, async (req, res) => {
    try {
        const results = await AnalysisResult.getByUserId(req.user.id);

        // Format results for frontend
        const formattedResults = await Promise.all(results.map(async (result) => {
            const customer = await Customer.findById(result.customer_id);
            return {
                id: result.id,
                title: `${customer?.name || '不明'}様 分析レポート`,
                customerId: result.customer_id,
                customerName: customer?.name || '不明',
                type: 'analysis',
                status: 'completed',
                createdDate: result.created_at,
                completedDate: result.created_at,
                summary: result.recommendation_text || '最適化提案',
                recommendations: Object.keys(result.recommended_allocation || {}).length
            };
        }));

        res.json(formattedResults);
    } catch (error) {
        logger.error('Failed to fetch analysis results:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Get single analysis result
router.get('/results/:id', authenticateToken, async (req, res) => {
    try {
        const result = await AnalysisResult.findById(req.params.id);

        if (!result) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const customer = await Customer.findById(result.customer_id);

        if (customer.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({
            id: result.id,
            customerId: result.customer_id,
            customerName: customer.name,
            analysisDate: result.analysis_date,
            currentAllocation: result.current_allocation,
            recommendedAllocation: result.recommended_allocation,
            adjustmentFactors: result.adjustment_factors,
            recommendationText: result.recommendation_text,
            confidenceScore: result.confidence_score
        });
    } catch (error) {
        logger.error('Failed to fetch analysis result:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

// Get customer performance history
router.get('/performance/:customerId', authenticateToken, async (req, res) => {
    const { customerId } = req.params;

    try {
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 権限チェック：担当者は自分の顧客のみ、代理店は配下の担当者の顧客すべて、管理者は全て
        const User = require('../models/User');
        let hasAccess = false;

        if (req.user.accountType === 'admin') {
            // 管理者：全ての顧客にアクセス可能
            hasAccess = true;
        } else if (req.user.accountType === 'child') {
            // 担当者：自分の顧客のみ
            hasAccess = customer.user_id === req.user.id;
        } else if (req.user.accountType === 'parent') {
            // 代理店：配下の担当者の顧客すべて
            const staff = await User.findById(customer.user_id);
            hasAccess = staff && staff.parent_id === req.user.id;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get all analysis results for this customer
        const analysisHistory = await AnalysisResult.getByCustomerId(customerId, 100);

        // Get fund returns from market data based on customer's insurance company
        const annualFundReturns = await getFundReturnsFromMarketData(customer.insurance_company_id);

        // Convert annual returns to monthly returns
        const monthlyFundReturns = {};
        Object.keys(annualFundReturns).forEach(fundType => {
            monthlyFundReturns[fundType] = annualFundReturns[fundType] / 12;
        });

        // Calculate performance based on contract date and analysis history
        const contractDate = new Date(customer.contract_date);
        const today = new Date();
        const monthsDiff = Math.floor((today.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

        const performance = [];

        // Generate monthly performance data
        for (let i = 0; i <= Math.min(monthsDiff, 12); i++) {
            const month = new Date(contractDate);
            month.setMonth(month.getMonth() + i);

            // Calculate expected return based on allocation
            let monthlyReturn = 0;

            // Find analysis result closest to this month
            const relevantAnalysis = analysisHistory.find(a => {
                const analysisDate = new Date(a.analysis_date);
                return analysisDate <= month;
            });

            if (relevantAnalysis && relevantAnalysis.adjusted_allocation) {
                // Calculate weighted return based on allocation
                const allocation = relevantAnalysis.adjusted_allocation;

                Object.keys(allocation).forEach(fundType => {
                    const weight = allocation[fundType] / 100;
                    const monthlyFundReturn = monthlyFundReturns[fundType] || 0;
                    monthlyReturn += weight * monthlyFundReturn;
                });
            } else {
                // Default return if no analysis
                monthlyReturn = 0.5; // 0.5% per month default
            }

            // Calculate cumulative value
            const cumulativeReturn = i === 0 ? 0 : performance[i - 1].cumulativeReturn + monthlyReturn;
            const value = 100 + cumulativeReturn;

            performance.push({
                month: i,
                date: month.toISOString().split('T')[0],
                value: parseFloat(value.toFixed(2)),
                monthlyReturn: parseFloat(monthlyReturn.toFixed(2)),
                cumulativeReturn: parseFloat(cumulativeReturn.toFixed(2))
            });
        }

        res.json(performance);
    } catch (error) {
        logger.error('Failed to fetch performance:', error);
        res.status(500).json({ error: 'Failed to fetch performance data' });
    }
});

// Get fund performance data from special_account_performance
router.get('/fund-performance', authenticateToken, async (req, res) => {
    try {
        // Get company_id from query parameter (selected company from frontend)
        const companyId = req.query.company_id ? parseInt(req.query.company_id) : null;
        const performanceDate = req.query.performance_date || null;

        logger.info('=== Fund Performance API (special_account_performance) ===');
        logger.info('Requested company_id:', companyId || 'all companies');
        logger.info('Requested performance_date:', performanceDate || 'latest');

        // Get latest performance data from special_account_performance
        let performanceData;
        if (companyId) {
            // Get company code for the requested company_id
            const companyQuery = await db.query(
                'SELECT company_code FROM insurance_companies WHERE id = $1',
                [companyId]
            );

            if (companyQuery.length === 0) {
                logger.warn('Company not found for company_id:', companyId);
                return res.status(404).json({
                    error: '保険会社が見つかりません',
                    code: 'COMPANY_NOT_FOUND'
                });
            }

            const companyCode = companyQuery[0].company_code;
            logger.info('Company code:', companyCode);

            if (performanceDate) {
                // Get data for specific date
                performanceData = await db.query(`
                    SELECT
                        sap.id,
                        sap.special_account_id,
                        sap.performance_date,
                        sap.unit_price,
                        sap.return_1m,
                        sap.return_3m,
                        sap.return_6m,
                        sap.return_1y,
                        sa.account_code,
                        sa.account_name,
                        sa.account_type,
                        ic.company_code,
                        ic.company_name,
                        ic.display_name
                    FROM special_account_performance sap
                    JOIN special_accounts sa ON sap.special_account_id = sa.id
                    JOIN insurance_companies ic ON sa.company_id = ic.id
                    WHERE ic.id = $1
                    AND sap.performance_date = $2
                    ORDER BY sa.account_type, sa.id
                `, [companyId, performanceDate]);
            } else {
                // Get latest data
                performanceData = await db.query(`
                    SELECT
                        sap.id,
                        sap.special_account_id,
                        sap.performance_date,
                        sap.unit_price,
                        sap.return_1m,
                        sap.return_3m,
                        sap.return_6m,
                        sap.return_1y,
                        sa.account_code,
                        sa.account_name,
                        sa.account_type,
                        ic.company_code,
                        ic.company_name,
                        ic.display_name
                    FROM special_account_performance sap
                    JOIN special_accounts sa ON sap.special_account_id = sa.id
                    JOIN insurance_companies ic ON sa.company_id = ic.id
                    WHERE ic.id = $1
                    AND sap.performance_date = (
                        SELECT MAX(performance_date)
                        FROM special_account_performance
                        WHERE special_account_id = sap.special_account_id
                    )
                    ORDER BY sa.account_type, sa.id
                `, [companyId]);
            }
        } else {
            // Get all companies' latest performance data
            performanceData = await db.query(`
                SELECT
                    sap.id,
                    sap.special_account_id,
                    sap.performance_date,
                    sap.unit_price,
                    sap.return_1m,
                    sap.return_3m,
                    sap.return_6m,
                    sap.return_1y,
                    sa.account_code,
                    sa.account_name,
                    sa.account_type,
                    ic.company_code,
                    ic.company_name,
                    ic.display_name
                FROM special_account_performance sap
                JOIN special_accounts sa ON sap.special_account_id = sa.id
                JOIN insurance_companies ic ON sa.company_id = ic.id
                WHERE sap.performance_date = (
                    SELECT MAX(performance_date)
                    FROM special_account_performance
                    WHERE special_account_id = sap.special_account_id
                )
                ORDER BY ic.id, sa.account_type, sa.id
            `);
        }

        logger.info('Found performance records:', performanceData.length);

        if (performanceData.length === 0) {
            logger.warn('No performance data found for company_id:', companyId);
            return res.json({
                funds: [],
                bondYields: null,
                message: 'この保険会社の市場データがまだアップロードされていません'
            });
        }

        // Calculate missing multi-period returns from historical data if needed
        // Also get previous month's data for comparison
        const enrichedData = await Promise.all(performanceData.map(async (record) => {
            let return3m = record.return_3m;
            let return6m = record.return_6m;
            let return1y = record.return_1y;
            let previousMonthReturn = null;

            // Get historical data for this account (for calculations and previous month)
            try {
                const historicalData = await db.query(`
                    SELECT performance_date, return_1m, return_1y
                    FROM special_account_performance
                    WHERE special_account_id = $1
                    AND return_1m IS NOT NULL
                    ORDER BY performance_date DESC
                    LIMIT 13
                `, [record.special_account_id]);

                if (historicalData.length >= 2) {
                    // Get previous month's performance (second most recent)
                    const previousMonth = historicalData[1];
                    previousMonthReturn = previousMonth.return_1y !== null
                        ? parseFloat(previousMonth.return_1y)
                        : (previousMonth.return_1m !== null ? parseFloat(previousMonth.return_1m) : null);

                    // Calculate 3-month return if missing
                    if (return3m === null && historicalData.length >= 3) {
                        return3m = historicalData.slice(0, 3).reduce((sum, r) => sum + parseFloat(r.return_1m || 0), 0);
                    }

                    // Calculate 6-month return if missing
                    if (return6m === null && historicalData.length >= 6) {
                        return6m = historicalData.slice(0, 6).reduce((sum, r) => sum + parseFloat(r.return_1m || 0), 0);
                    }

                    // Calculate 1-year return if missing
                    if (return1y === null && historicalData.length >= 12) {
                        return1y = historicalData.slice(0, 12).reduce((sum, r) => sum + parseFloat(r.return_1m || 0), 0);
                    }
                }
            } catch (err) {
                logger.error('Error calculating historical returns:', err);
            }

            return {
                ...record,
                return_3m: return3m,
                return_6m: return6m,
                return_1y: return1y,
                previous_month_return: previousMonthReturn
            };
        }));

        // Convert performance data to the format expected by the frontend
        const performance = enrichedData
            .map(record => {
                // Use return_1y as the performance value, fallback to return_1m if not available
                const performanceValue = record.return_1y !== null
                    ? parseFloat(record.return_1y)
                    : (record.return_1m !== null ? parseFloat(record.return_1m) : 0);

                // Determine recommendation based on performance
                let recommendation = 'neutral';
                if (performanceValue > 10) {
                    recommendation = 'recommended';
                } else if (performanceValue < 0) {
                    recommendation = 'overpriced';
                } else if (performanceValue > 5) {
                    recommendation = 'neutral';
                }

                return {
                    fundType: record.account_name,
                    performance: parseFloat(performanceValue.toFixed(2)),
                    previousPerformance: record.previous_month_return !== null
                        ? parseFloat(record.previous_month_return.toFixed(2))
                        : null,
                    recommendation,
                    dataSource: 'special_account_performance',
                    accountCode: record.account_code,
                    accountType: record.account_type,
                    unitPrice: record.unit_price,
                    return1m: record.return_1m,
                    return3m: record.return_3m,
                    return6m: record.return_6m,
                    return1y: record.return_1y,
                    performanceDate: record.performance_date
                };
            })
            .filter(Boolean); // Remove null entries

        logger.info(`Returning ${performance.length} fund performance records`);

        // Get previous month's allocation recommendations if available
        let previousAllocations = null;
        if (companyId && performanceData.length > 0) {
            try {
                const currentDate = performanceData[0].performance_date;

                // Get previous month's allocations for balanced profile (60/40 mix)
                const previousAllocData = await db.query(`
                    SELECT fund_type, recommended_allocation, recommendation_date
                    FROM monthly_allocation_recommendations
                    WHERE company_id = $1
                    AND risk_profile = 'balanced'
                    AND recommendation_date < $2
                    ORDER BY recommendation_date DESC
                    LIMIT 50
                `, [companyId, currentDate]);

                if (previousAllocData.length > 0) {
                    previousAllocations = {
                        date: previousAllocData[0].recommendation_date,
                        allocations: {}
                    };

                    previousAllocData.forEach(row => {
                        previousAllocations.allocations[row.fund_type] = parseFloat(row.recommended_allocation);
                    });

                    logger.info(`Found ${previousAllocData.length} previous allocations from ${previousAllocations.date}`);
                }
            } catch (err) {
                logger.error('Error fetching previous allocations:', err);
            }
        }

        res.json({
            funds: performance,
            bondYields: null,
            previousAllocations
        });
    } catch (error) {
        logger.error('Failed to fetch fund performance:', error);
        res.status(500).json({ error: 'Failed to fetch fund performance' });
    }
});

// Get optimization recommendations based on latest analysis results
router.get('/optimization-summary', authenticateToken, async (req, res) => {
    try {
        // Get all analysis results for this user
        const results = await AnalysisResult.getByUserId(req.user.id);

        if (results.length === 0) {
            return res.json(null);
        }

        // Aggregate current and recommended allocations from all customers
        // Dynamically extract fund types from analysis results
        const fundTypesSet = new Set();
        results.forEach(result => {
            const current = result.current_allocation || {};
            const recommended = result.recommended_allocation || {};
            Object.keys(current).forEach(fundType => fundTypesSet.add(fundType));
            Object.keys(recommended).forEach(fundType => fundTypesSet.add(fundType));
        });

        const fundTypes = Array.from(fundTypesSet);

        // Generate key map dynamically
        const fundKeyMap = {};
        fundTypes.forEach((fundType, index) => {
            // Create a safe key name (remove special characters)
            const safeKey = fundType
                .replace(/型/g, '')
                .replace(/\s+/g, '')
                .toLowerCase();
            fundKeyMap[fundType] = safeKey || `fund${index}`;
        });

        const aggregatedCurrent = {};
        const aggregatedRecommended = {};
        let count = 0;

        fundTypes.forEach(fundType => {
            aggregatedCurrent[fundType] = 0;
            aggregatedRecommended[fundType] = 0;
        });

        // Calculate average allocations
        for (const result of results) {
            const current = result.current_allocation || {};
            const recommended = result.recommended_allocation || {};

            fundTypes.forEach(fundType => {
                aggregatedCurrent[fundType] += (current[fundType] || 0);
                aggregatedRecommended[fundType] += (recommended[fundType] || 0);
            });

            count++;
        }

        // Convert to percentage averages
        const recommendations = {};
        fundTypes.forEach(fundType => {
            const currentAvg = count > 0 ? aggregatedCurrent[fundType] / count : 0;
            const recommendedAvg = count > 0 ? aggregatedRecommended[fundType] / count : 0;
            const change = recommendedAvg - currentAvg;

            recommendations[fundKeyMap[fundType]] = {
                current: parseFloat(currentAvg.toFixed(1)),
                recommended: parseFloat(recommendedAvg.toFixed(1)),
                change: parseFloat(change.toFixed(1)),
                reason: change > 5 ? `市場環境が良好なため増額推奨` :
                       change < -5 ? `リスク調整のため減額推奨` :
                       change > 0 ? `バランス調整のため微増推奨` :
                       change < 0 ? `バランス調整のため微減推奨` : 'バランス維持'
            };
        });

        res.json({
            recommendations,
            summary: {
                totalChanges: Object.values(recommendations).filter(fund => Math.abs(fund.change) >= 3).length,
                majorRebalancing: Object.values(recommendations).some(fund => Math.abs(fund.change) >= 8),
                lastUpdated: results[0].created_at
            }
        });
    } catch (error) {
        logger.error('Failed to fetch optimization summary:', error);
        res.status(500).json({ error: 'Failed to fetch optimization summary' });
    }
});

// Get dashboard statistics for current user
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        let customers = [];
        let results = [];

        // 管理者: 全顧客・全分析を取得
        if (req.user.accountType === 'admin') {
            const db = require('../utils/database-factory');
            const allCustomers = await db.query('SELECT * FROM customers WHERE is_active = TRUE');
            customers = allCustomers;
            const allResults = await db.query('SELECT * FROM analysis_results');
            results = allResults;
        }
        // 代理店: 配下の担当者の顧客・分析を取得
        else if (req.user.accountType === 'parent') {
            customers = await Customer.getByAgencyId(req.user.id);
            // 配下の担当者の分析結果を取得
            const User = require('../models/User');
            const staff = await User.getChildren(req.user.id);
            const staffIds = [req.user.id, ...staff.map(s => s.id)];

            results = [];
            for (const staffId of staffIds) {
                const staffResults = await AnalysisResult.getByUserId(staffId);
                results.push(...staffResults);
            }
        }
        // 担当者: 自分の顧客・分析のみ
        else {
            customers = await Customer.getByUserId(req.user.id);
            results = await AnalysisResult.getByUserId(req.user.id);
        }

        const customerCount = customers.length;
        const reportCount = results.length;

        // Calculate total assets (sum of all customer contract amounts)
        const totalAssets = customers.reduce((sum, customer) => {
            const amount = parseFloat(customer.contract_amount) || 0;
            return sum + amount;
        }, 0);

        // Calculate total monthly premium (sum of all customer monthly premiums)
        const totalMonthlyPremium = customers.reduce((sum, customer) => {
            const premium = parseFloat(customer.monthly_premium) || 0;
            return sum + premium;
        }, 0);

        // Calculate average return from all analysis results
        let totalReturn = 0;
        let returnCount = 0;

        // Cache fund returns by company to avoid redundant queries
        const fundReturnsByCompany = {};

        for (const result of results) {
            const customer = customers.find(c => c.id === result.customer_id);
            if (!customer) continue;

            // Calculate return based on adjusted allocation
            const allocation = result.current_allocation || result.adjusted_allocation;
            if (!allocation) continue;

            // Get fund returns for this customer's insurance company
            if (!fundReturnsByCompany[customer.insurance_company_id]) {
                fundReturnsByCompany[customer.insurance_company_id] = await getFundReturnsFromMarketData(customer.insurance_company_id);
            }
            const fundReturns = fundReturnsByCompany[customer.insurance_company_id];

            let customerReturn = 0;
            Object.keys(allocation).forEach(fundType => {
                const weight = allocation[fundType] / 100;
                const fundReturn = fundReturns[fundType] || 0;
                customerReturn += weight * fundReturn;
            });

            totalReturn += customerReturn;
            returnCount++;
        }

        const averageReturn = returnCount > 0 ? totalReturn / returnCount : 0;

        res.json({
            customerCount,
            reportCount,
            totalAssets,
            totalMonthlyPremium,
            averageReturn: parseFloat(averageReturn.toFixed(1))
        });
    } catch (error) {
        logger.error('Failed to fetch statistics:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics',
            details: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
});

// Get historical analysis results for a customer
router.get('/history/:customerId/detailed', authenticateToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 権限チェック：担当者は自分の顧客のみ、代理店は配下の担当者の顧客すべて、管理者は全て
        const User = require('../models/User');
        let hasAccess = false;

        if (req.user.accountType === 'admin') {
            // 管理者：全ての顧客にアクセス可能
            hasAccess = true;
        } else if (req.user.accountType === 'child') {
            // 担当者：自分の顧客のみ
            hasAccess = customer.user_id === req.user.id;
        } else if (req.user.accountType === 'parent') {
            // 代理店：配下の担当者の顧客すべて
            const staff = await User.findById(customer.user_id);
            hasAccess = staff && staff.parent_id === req.user.id;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get all analysis results for this customer
        const analyses = await AnalysisResult.getByCustomerId(customerId);

        // Get past 24 months of data
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const filteredAnalyses = analyses.filter(analysis => {
            const analysisDate = new Date(analysis.analysis_date);
            return analysisDate >= twoYearsAgo;
        });

        res.json(filteredAnalyses);
    } catch (error) {
        logger.error('Failed to get historical analysis:', error);
        res.status(500).json({ error: 'Failed to get historical analysis' });
    }
});

// Export report as PDF
router.get('/report/:analysisId/pdf', authenticateToken, async (req, res) => {
    const { analysisId } = req.params;

    try {
        const analysis = await AnalysisResult.findById(analysisId);

        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        const customer = await Customer.findById(analysis.customer_id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 権限チェック：担当者は自分の顧客のみ、代理店は配下の担当者の顧客すべて
        const User = require('../models/User');
        let hasAccess = false;

        if (req.user.accountType === 'child') {
            hasAccess = customer.user_id === req.user.id;
        } else if (req.user.accountType === 'parent') {
            const staff = await User.findById(customer.user_id);
            hasAccess = staff && staff.parent_id === req.user.id;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const pdfGenerator = new PDFReportGenerator();
        const pdfBuffer = await pdfGenerator.generateAnalysisReport(analysis, customer);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=analysis-report-${analysisId}.pdf`);
        res.send(pdfBuffer);

        logger.info(`PDF report generated for analysis ${analysisId} by user ${req.user.userId}`);
    } catch (error) {
        logger.error('Failed to generate PDF report:', error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
});

// Export report as Excel
router.get('/report/:analysisId/excel', authenticateToken, async (req, res) => {
    const { analysisId } = req.params;

    try {
        const analysis = await AnalysisResult.findById(analysisId);

        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        const customer = await Customer.findById(analysis.customer_id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 権限チェック：担当者は自分の顧客のみ、代理店は配下の担当者の顧客すべて
        const User = require('../models/User');
        let hasAccess = false;

        if (req.user.accountType === 'child') {
            hasAccess = customer.user_id === req.user.id;
        } else if (req.user.accountType === 'parent') {
            const staff = await User.findById(customer.user_id);
            hasAccess = staff && staff.parent_id === req.user.id;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const excelGenerator = new ExcelReportGenerator();
        const excelBuffer = await excelGenerator.generateAnalysisReport(analysis, customer);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=analysis-report-${analysisId}.xlsx`);
        res.send(excelBuffer);

        logger.info(`Excel report generated for analysis ${analysisId} by user ${req.user.userId}`);
    } catch (error) {
        logger.error('Failed to generate Excel report:', error);
        res.status(500).json({ error: 'Failed to generate Excel report' });
    }
});

// Save allocation recommendations
router.post('/save-allocations', authenticateToken, async (req, res) => {
    try {
        const { companyId, recommendationDate, allocations, riskProfile } = req.body;

        if (!companyId || !recommendationDate || !allocations || !riskProfile) {
            return res.status(400).json({
                error: '必須パラメータが不足しています',
                required: ['companyId', 'recommendationDate', 'allocations', 'riskProfile']
            });
        }

        logger.info('Saving allocation recommendations:', {
            companyId,
            recommendationDate,
            riskProfile,
            allocationCount: allocations.length
        });

        // Filter out invalid allocations
        const validAllocations = allocations.filter(allocation => {
            const { fundType, recommendedAllocation } = allocation;
            if (!fundType || recommendedAllocation === undefined) {
                logger.warn('Skipping invalid allocation:', allocation);
                return false;
            }
            return true;
        });

        if (validAllocations.length === 0) {
            return res.status(400).json({
                error: '有効な配分データがありません'
            });
        }

        // Build bulk upsert query using PostgreSQL's ON CONFLICT
        const values = [];
        const placeholders = [];

        validAllocations.forEach((allocation, index) => {
            const { fundType, recommendedAllocation, accountCode } = allocation;
            const offset = index * 6;
            placeholders.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
            );
            values.push(
                companyId,
                recommendationDate,
                fundType,
                accountCode || null,
                recommendedAllocation,
                riskProfile
            );
        });

        const upsertQuery = `
            INSERT INTO monthly_allocation_recommendations
            (company_id, recommendation_date, fund_type, account_code, recommended_allocation, risk_profile)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (company_id, recommendation_date, fund_type, risk_profile)
            DO UPDATE SET
                recommended_allocation = EXCLUDED.recommended_allocation,
                account_code = EXCLUDED.account_code
        `;

        try {
            await db.query(upsertQuery, values);

            logger.info(`Allocations saved: ${validAllocations.length} records upserted`);

            res.json({
                success: true,
                message: '配分推奨データを保存しました',
                data: {
                    total: validAllocations.length
                }
            });
        } catch (error) {
            throw error;
        }
    } catch (error) {
        logger.error('Failed to save allocations:', error);
        res.status(500).json({
            error: '配分推奨データの保存に失敗しました',
            message: error.message
        });
    }
});

// Get available performance dates for a company
router.get('/available-dates', authenticateToken, async (req, res) => {
    try {
        const companyId = req.query.company_id ? parseInt(req.query.company_id) : null;

        if (!companyId) {
            return res.status(400).json({
                error: 'company_idパラメータが必要です'
            });
        }

        logger.info('Fetching available dates for company:', companyId);

        // Get distinct performance dates for this company
        const dates = await db.query(`
            SELECT DISTINCT sap.performance_date
            FROM special_account_performance sap
            JOIN special_accounts sa ON sap.special_account_id = sa.id
            WHERE sa.company_id = $1
            ORDER BY sap.performance_date DESC
        `, [companyId]);

        // Format dates as YYYY-MM-DD strings
        const availableDates = dates.map(row => {
            const date = new Date(row.performance_date);
            return date.toISOString().split('T')[0];
        });

        logger.info(`Found ${availableDates.length} available dates for company ${companyId}`);

        res.json({
            success: true,
            dates: availableDates
        });
    } catch (error) {
        logger.error('Failed to fetch available dates:', error);
        res.status(500).json({
            error: '利用可能な日付の取得に失敗しました',
            message: error.message
        });
    }
});

module.exports = router;