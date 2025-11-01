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

// Get latest market data info
router.get('/market-data/latest', authenticateToken, async (req, res) => {
    try {
        const latest = await MarketData.getLatest();

        if (!latest) {
            return res.json(null);
        }

        res.json({
            id: latest.id,
            fileName: latest.data_content?.fileName || latest.source_file,
            uploadedAt: latest.created_at,
            uploadedBy: latest.uploaded_by,
            dataDate: latest.data_date,
            fundPerformance: latest.data_content?.fundPerformance || {},
            allPerformanceData: latest.data_content?.allPerformanceData || {},
            bondYields: latest.data_content?.bondYields || {},
            parsedSuccessfully: latest.data_content?.parsedSuccessfully || false
        });
    } catch (error) {
        logger.error('Failed to get latest market data:', error);
        res.status(500).json({ error: 'Failed to get market data' });
    }
});

// Get historical market data (past 24 months)
router.get('/market-data/history', authenticateToken, async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago

        const historyData = await MarketData.getByDateRange(startDate, endDate, 'monthly_report');

        const formattedData = historyData.map(data => ({
            id: data.id,
            fileName: data.data_content?.fileName || data.source_file,
            uploadedAt: data.created_at,
            dataDate: data.data_date,
            uploadedBy: data.uploaded_by
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

            // Parse PDF to extract fund performance data
            let fundPerformance = {};
            let allPerformanceData = {};
            let bondYields = {};
            let extractedText = '';
            let reportDate = null;
            let parseError = null;

            try {
                const parser = require('../utils/pdf-parser');
                const extractedData = await parser.extractAllData(pdfBuffer, companyCode);

                fundPerformance = extractedData.fundPerformance || {};
                allPerformanceData = extractedData.allPerformanceData || {};
                bondYields = extractedData.bondYields || {};
                extractedText = extractedData.text || '';
                reportDate = extractedData.reportDate || null;

                logger.info('PDF parsing successful:', {
                    fundPerformance,
                    allPerformanceData,
                    bondYields,
                    reportDate,
                    textLength: extractedText.length
                });
            } catch (err) {
                parseError = err;
                logger.error('PDF parsing failed:', err);
                logger.error('Parse error details:', {
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                });
                console.error('PDF PARSE ERROR:', err);
                // Continue without parsed data - save PDF anyway
            }

            const result = await MarketData.create({
                data_date: reportDate || new Date(),
                data_type: 'monthly_report',
                source_file: req.file.originalname,
                data_content: {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    uploadedAt: new Date().toISOString(),
                    fundPerformance: fundPerformance,
                    allPerformanceData: allPerformanceData,
                    bondYields: bondYields,
                    reportDate: reportDate,
                    extractedText: extractedText.substring(0, 5000),
                    parsedSuccessfully: Object.keys(fundPerformance).length > 0
                },
                pdf_content: pdfBuffer,
                uploaded_by: req.user.id,
                company_id: parseInt(companyId)
            });

            logger.info(`Market data uploaded by user: ${req.user.userId}, file: ${req.file.originalname}`);

            res.json({
                message: 'Market data uploaded and parsed successfully',
                id: result,
                fileName: req.file.originalname,
                uploadedAt: new Date().toISOString(),
                fundPerformance: fundPerformance,
                allPerformanceData: allPerformanceData,
                bondYields: bondYields,
                reportDate: reportDate,
                parsedSuccessfully: Object.keys(fundPerformance).length > 0,
                parseError: parseError ? {
                    message: parseError.message,
                    name: parseError.name
                } : null
            });
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
            if (!customer.company_id) {
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
            const latestMarketData = await MarketData.getLatest(customer.company_id);

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
                logger.warn(`No market data available for company_id: ${customer.company_id}`);
                return res.status(400).json({
                    error: 'この保険会社の市場データ（PDF）が登録されていません。管理者にPDFのアップロードを依頼してください。',
                    code: 'MISSING_MARKET_DATA',
                    companyId: customer.company_id
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

router.get('/export/:analysisId', 
    authenticateToken,
    authorizePlanFeature('export_formats'),
    async (req, res) => {
        const { analysisId } = req.params;
        const { format } = req.query;

        try {
            const analysis = await AnalysisResult.findById(analysisId);
            
            if (!analysis) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            const customer = await Customer.findById(analysis.customer_id);
            
            if (!customer || customer.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const allowedFormats = req.planFeature.feature_value.split(',');
            
            if (!format || !allowedFormats.includes(format)) {
                return res.status(400).json({ 
                    error: `Invalid export format. Your ${req.user.planType} plan supports: ${allowedFormats.join(', ')}` 
                });
            }

            const exportService = require('../services/export.service');
            const exportData = await exportService.generateExport(analysis, customer, format);

            res.setHeader('Content-Type', exportData.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
            res.send(exportData.content);

        } catch (error) {
            logger.error('Export error:', error);
            res.status(500).json({ error: 'Failed to export analysis' });
        }
    }
);

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
                const fundReturns = {
                    '株式型': 6.8 / 12,
                    '米国株式型': 12.3 / 12,
                    '総合型': 5.5 / 12,
                    '米国債券型': 3.2 / 12,
                    '債券型': 2.8 / 12,
                    'REIT型': -1.5 / 12
                };

                Object.keys(allocation).forEach(fundType => {
                    const weight = allocation[fundType] / 100;
                    const monthlyFundReturn = fundReturns[fundType] || 0;
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

// Get fund performance data
router.get('/fund-performance', authenticateToken, async (req, res) => {
    try {
        // Get latest market data to extract fund performance from PDF
        const latestMarketData = await MarketData.getLatest('monthly_report');

        // Extract fund performance from latest market data if available
        let actualFundPerformance = {};
        let allPerformanceData = null;
        let bondYields = null;
        let hasActualData = false;

        logger.info('=== Fund Performance API Debug ===');
        logger.info('Latest market data ID:', latestMarketData?.id);
        logger.info('Latest market data source_file:', latestMarketData?.source_file);
        logger.info('Latest market data data_date:', latestMarketData?.data_date);
        logger.info('Data content type:', typeof latestMarketData?.data_content);
        logger.info('Data content keys:', latestMarketData?.data_content ? Object.keys(latestMarketData.data_content) : 'null');

        if (latestMarketData && latestMarketData.data_content) {
            actualFundPerformance = latestMarketData.data_content.fundPerformance || {};
            allPerformanceData = latestMarketData.data_content.allPerformanceData || null;
            bondYields = latestMarketData.data_content.bondYields || null;
            hasActualData = Object.keys(actualFundPerformance).length > 0;

            logger.info('actualFundPerformance keys:', Object.keys(actualFundPerformance));
            logger.info('actualFundPerformance:', actualFundPerformance);
            logger.info('bondYields:', bondYields);
            logger.info('hasActualData:', hasActualData);

            if (hasActualData) {
                logger.info('Using actual fund performance from PDF:', actualFundPerformance);
            } else {
                logger.warn('fundPerformance is empty object');
            }
        } else {
            logger.warn('No latestMarketData or data_content');
        }

        // PDFデータがない場合は空配列を返す
        if (!hasActualData) {
            logger.warn('No fund performance data found in market data - PDF not uploaded or parsing failed');
            return res.json({ funds: [], bondYields: null });
        }

        // Calculate fund performance based on actual market data
        const fundTypes = ['総合型', '債券型', '株式型', '米国債券型', '米国株式型', 'REIT型'];

        const performance = fundTypes
            .map(fundType => {
                // If fund type not in extracted data, use 0
                const performanceValue = actualFundPerformance[fundType] !== undefined
                    ? actualFundPerformance[fundType]
                    : 0;

                // Determine recommendation based on performance
                let recommendation = 'neutral';
                if (performanceValue > 10) {
                    recommendation = 'recommended';
                } else if (performanceValue < 0) {
                    recommendation = 'overpriced';
                } else if (performanceValue > 5) {
                    recommendation = 'neutral';
                }

                // Get additional performance data for this fund
                const additionalData = {};
                if (allPerformanceData) {
                    // 年率換算利回り (直近1年)
                    if (allPerformanceData.annualizedReturn && allPerformanceData.annualizedReturn['直近1年']) {
                        additionalData.annualizedReturn = allPerformanceData.annualizedReturn['直近1年'][fundType];
                    }
                    // 月次利回り (直近1年)
                    if (allPerformanceData.monthlyReturn && allPerformanceData.monthlyReturn['直近1年']) {
                        additionalData.monthlyReturn = allPerformanceData.monthlyReturn['直近1年'][fundType];
                    }
                    // 5年年率換算
                    if (allPerformanceData.annualizedReturn && allPerformanceData.annualizedReturn['５年']) {
                        additionalData.annualizedReturn5Y = allPerformanceData.annualizedReturn['５年'][fundType];
                    }
                    // 累積騰落率
                    if (allPerformanceData.totalReturn) {
                        additionalData.totalReturn1Y = allPerformanceData.totalReturn['直近1年']?.[fundType];
                        additionalData.totalReturn5Y = allPerformanceData.totalReturn['５年']?.[fundType];
                        additionalData.totalReturn10Y = allPerformanceData.totalReturn['10年']?.[fundType];
                    }
                }

                return {
                    fundType,
                    performance: parseFloat(performanceValue.toFixed(1)),
                    recommendation,
                    dataSource: 'actual',
                    ...additionalData
                };
            })
            .filter(Boolean); // Remove null entries

        res.json({
            funds: performance,
            bondYields: bondYields
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
        const fundTypes = ['株式型', '米国株式型', '米国債券型', 'REIT型', '世界株式型'];
        const fundKeyMap = {
            '株式型': 'equity',
            '米国株式型': 'usEquity',
            '米国債券型': 'usBond',
            'REIT型': 'reit',
            '世界株式型': 'global'
        };

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

        for (const result of results) {
            const customer = customers.find(c => c.id === result.customer_id);
            if (!customer) continue;

            // Calculate return based on adjusted allocation
            const allocation = result.current_allocation || result.adjusted_allocation;
            if (!allocation) continue;

            const fundReturns = {
                '株式型': 6.8,
                '米国株式型': 12.3,
                '総合型': 5.5,
                '米国債券型': 3.2,
                '債券型': 2.8,
                'REIT型': -1.5,
                '世界株式型': 8.7
            };

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

module.exports = router;