const express = require('express');
const multer = require('multer');
const { put } = require('@vercel/blob');
const { parsePDF, parseSovaniPDF, validateParsedData } = require('../utils/pdfParser');
const db = require('../utils/database-factory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for PDF uploads - use memoryStorage for Vercel compatibility
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

/**
 * POST /api/pdf-upload/sovani
 * Upload and parse SOVANI PDF
 */
router.post('/sovani', authenticateToken, upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log(`Processing PDF: ${req.file.originalname}`);

        // Get PDF buffer from memory
        const pdfBuffer = req.file.buffer;

        // Parse PDF
        const parsedData = await parseSovaniPDF(pdfBuffer);

        // Validate parsed data
        validateParsedData(parsedData);

        console.log(`Parsed data date: ${parsedData.dataDate}`);
        console.log(`Parsed ${parsedData.accounts.length} accounts`);

        // Get company ID for SONY_LIFE_SOVANI
        const companies = await db.query(
            'SELECT id FROM insurance_companies WHERE company_code = $1',
            [parsedData.companyCode]
        );

        if (companies.length === 0) {
            throw new Error(`Company ${parsedData.companyCode} not found`);
        }

        const companyId = companies[0].id;

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
                    [companyId, account.accountCode]
                );

                let accountId;

                if (specialAccount.length === 0) {
                    // Insert new special account
                    const insertResult = await db.query(
                        `INSERT INTO special_accounts (
                            company_id, account_code, account_name, account_type, is_active
                        ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                        [companyId, account.accountCode, account.accountName, account.accountType]
                    );
                    accountId = insertResult[0].id;
                    newAccountsCount++;
                    console.log(`Created new account: ${account.accountName} (ID: ${accountId})`);
                } else {
                    accountId = specialAccount[0].id;
                }

                // Check if performance data already exists for this date
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
                            account.return1m,
                            account.return3m,
                            account.return6m,
                            account.return1y
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
                            account.return1m,
                            account.return3m,
                            account.return6m,
                            account.return1y,
                            existingPerf[0].id
                        ]
                    );
                    updatedPerformanceCount++;
                }
            }

            // Commit transaction
            await db.query('COMMIT');


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
        console.error('Error processing PDF:', error);


        res.status(500).json({
            error: 'Failed to process PDF',
            message: error.message,
            details: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

/**
 * POST /api/pdf-upload/auto
 * Upload and parse PDF with auto-detection of company
 */
router.post('/auto', authenticateToken, upload.single('pdf'), async (req, res) => {
    

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // File is in memory (req.file.buffer)
        console.log(`Processing PDF: ${req.file.originalname}`);

        // Read PDF file
        const pdfBuffer = req.file.buffer;

        // Parse PDF with auto-detection
        const parsedData = await parsePDF(pdfBuffer);

        // Validate parsed data
        validateParsedData(parsedData);

        console.log(`Detected company: ${parsedData.companyCode}`);
        console.log(`Parsed data date: ${parsedData.dataDate}`);
        console.log(`Parsed ${parsedData.accounts.length} accounts`);

        // Get company ID
        const companies = await db.query(
            'SELECT id FROM insurance_companies WHERE company_code = $1',
            [parsedData.companyCode]
        );

        if (companies.length === 0) {
            throw new Error(`Company ${parsedData.companyCode} not found in database`);
        }

        const companyId = companies[0].id;

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
                    [companyId, account.accountCode]
                );

                let accountId;

                if (specialAccount.length === 0) {
                    // Insert new special account
                    const insertResult = await db.query(
                        `INSERT INTO special_accounts (
                            company_id, account_code, account_name, account_type, is_active
                        ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                        [companyId, account.accountCode, account.accountName, account.accountType]
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
        console.error('Error processing PDF:', error);


        res.status(500).json({
            error: 'Failed to process PDF',
            message: error.message,
            details: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

/**
 * POST /api/pdf-upload/blob
 * Upload PDF to Vercel Blob and process it
 */
router.post('/blob', authenticateToken, async (req, res) => {
    try {
        const { filename, fileData } = req.body;

        if (!filename || !fileData) {
            return res.status(400).json({ error: 'Missing filename or fileData' });
        }

        console.log(`Processing blob upload: ${filename}`);

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(fileData, 'base64');

        // Upload to Vercel Blob
        const blob = await put(filename, pdfBuffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log(`Uploaded to Vercel Blob: ${blob.url}`);

        // Parse PDF
        const parsedData = await parsePDF(pdfBuffer);

        // Validate parsed data
        validateParsedData(parsedData);

        console.log(`Detected company: ${parsedData.companyCode}`);
        console.log(`Parsed data date: ${parsedData.dataDate}`);
        console.log(`Parsed ${parsedData.accounts.length} accounts`);

        // Get company ID
        const companies = await db.query(
            'SELECT id FROM insurance_companies WHERE company_code = $1',
            [parsedData.companyCode]
        );

        if (companies.length === 0) {
            throw new Error(`Company ${parsedData.companyCode} not found in database`);
        }

        const companyId = companies[0].id;

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
                    [companyId, account.accountCode]
                );

                let accountId;

                if (specialAccount.length === 0) {
                    // Insert new special account
                    const insertResult = await db.query(
                        `INSERT INTO special_accounts (
                            company_id, account_code, account_name, account_type, is_active
                        ) VALUES ($1, $2, $3, $4, true) RETURNING id`,
                        [companyId, account.accountCode, account.accountName, account.accountType]
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

            res.json({
                success: true,
                message: 'PDF processed successfully',
                data: {
                    blobUrl: blob.url,
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
        console.error('Error processing blob PDF:', error);

        res.status(500).json({
            error: 'Failed to process PDF',
            message: error.message,
            details: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

/**
 * GET /api/pdf-upload/history
 * Get upload history (from performance records)
 */
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const history = await db.query(`
            SELECT
                ic.company_code,
                ic.display_name as company_name,
                sap.performance_date,
                COUNT(DISTINCT sap.special_account_id) as accounts_count,
                COUNT(*) as records_count,
                MAX(sap.created_at) as uploaded_at
            FROM special_account_performance sap
            JOIN special_accounts sa ON sa.id = sap.special_account_id
            JOIN insurance_companies ic ON ic.id = sa.company_id
            GROUP BY ic.company_code, ic.display_name, sap.performance_date
            ORDER BY sap.performance_date DESC
            LIMIT 50
        `);

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            error: 'Failed to fetch upload history',
            message: error.message
        });
    }
});

module.exports = router;
