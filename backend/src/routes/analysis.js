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

router.post('/upload-market-data', 
    authenticateToken, 
    authorizeAccountType('parent'), 
    upload.single('marketData'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }

        try {
            const pdfBuffer = req.file.buffer;

            const result = await MarketData.create({
                data_date: new Date(),
                data_type: 'monthly_report',
                source_file: req.file.originalname,
                data_content: {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    uploadedAt: new Date().toISOString()
                },
                pdf_content: pdfBuffer,
                uploaded_by: req.user.id
            });

            logger.info(`Market data uploaded by user: ${req.user.userId}, file: ${req.file.originalname}`);

            res.json({
                message: 'Market data uploaded successfully',
                id: result,
                fileName: req.file.originalname
            });
        } catch (error) {
            logger.error('Market data upload error:', error);
            res.status(500).json({ error: 'Failed to upload market data' });
        }
    }
);

router.post('/recommend/:customerId', 
    authenticateToken,
    authorizePlanFeature('analysis_frequency'),
    async (req, res) => {
        const { customerId } = req.params;

        try {
            const customer = await Customer.findById(customerId);
            
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            if (customer.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const canAnalyze = await AnalysisResult.checkAnalysisFrequency(
                customerId, 
                req.planFeature.feature_value
            );

            if (!canAnalyze) {
                return res.status(429).json({ 
                    error: `Analysis frequency limit reached. Your ${req.user.planType} plan allows ${req.planFeature.feature_value} analysis.` 
                });
            }

            const latestMarketData = await MarketData.getLatest();
            
            if (!latestMarketData) {
                return res.status(400).json({ 
                    error: 'No market data available. Please upload market data first.' 
                });
            }

            const notebookLM = new NotebookLMService();
            const analysisPrompt = `
                Based on the market data, provide investment allocation recommendations for:
                - Contract Date: ${customer.contract_date}
                - Monthly Premium: ${customer.monthly_premium} JPY
                - Risk Tolerance: ${customer.risk_tolerance}
                - Investment Goal: ${customer.investment_goal || 'General growth'}
                
                Please provide:
                1. Recommended asset allocation percentages
                2. Market analysis summary
                3. Adjustment factors based on customer profile
            `;

            const notebookLMResult = await notebookLM.analyzePDF(
                latestMarketData.pdf_content,
                analysisPrompt
            );

            const calculator = new AllocationCalculator(
                notebookLMResult.recommendedAllocation,
                notebookLMResult.adjustmentFactors
            );

            const personalizedAllocation = calculator.calculatePersonalizedAllocation(customer);

            const analysisId = await AnalysisResult.create({
                customer_id: customerId,
                analysis_date: new Date(),
                market_data_source: latestMarketData.source_file,
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

        if (customer.user_id !== req.user.id) {
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

module.exports = router;