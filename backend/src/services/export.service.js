const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

class ExportService {
    async generateExport(analysis, customer, format) {
        switch (format.toLowerCase()) {
            case 'pdf':
                return await this.generatePDF(analysis, customer);
            case 'excel':
                return await this.generateExcel(analysis, customer);
            case 'api':
                return this.generateJSON(analysis, customer);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    async generatePDF(analysis, customer) {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        
        // Header
        doc.fontSize(20).text('変額保険運用アドバイザリーレポート', { align: 'center' });
        doc.moveDown();
        
        // Customer Information
        doc.fontSize(14).text('顧客情報', { underline: true });
        doc.fontSize(12);
        doc.text(`顧客名: ${customer.name}`);
        doc.text(`契約日: ${new Date(customer.contract_date).toLocaleDateString('ja-JP')}`);
        doc.text(`月額保険料: ¥${customer.monthly_premium.toLocaleString()}`);
        doc.text(`リスク許容度: ${this.translateRiskTolerance(customer.risk_tolerance)}`);
        doc.moveDown();
        
        // Analysis Date
        doc.fontSize(14).text('分析情報', { underline: true });
        doc.fontSize(12);
        doc.text(`分析日: ${new Date(analysis.analysis_date).toLocaleDateString('ja-JP')}`);
        doc.text(`信頼度スコア: ${(analysis.confidence_score * 100).toFixed(0)}%`);
        doc.moveDown();
        
        // Market Analysis
        doc.fontSize(14).text('市場分析', { underline: true });
        doc.fontSize(12);
        doc.text(analysis.recommendation_text, { align: 'justify' });
        doc.moveDown();
        
        // Recommended Allocation
        doc.fontSize(14).text('推奨資産配分', { underline: true });
        doc.fontSize(12);
        Object.entries(analysis.adjusted_allocation).forEach(([asset, percentage]) => {
            doc.text(`${asset}: ${percentage}%`);
        });
        doc.moveDown();
        
        // Adjustment Factors
        doc.fontSize(14).text('調整要因', { underline: true });
        doc.fontSize(12);
        doc.text(`契約期間調整: ${this.getTimeHorizonText(customer.contract_date)}`);
        doc.text(`金額層調整: ${this.getAmountTierText(customer.monthly_premium)}`);
        doc.text(`リスク調整: ${this.translateRiskTolerance(customer.risk_tolerance)}`);
        
        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve({
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                    filename: `analysis_${customer.name}_${new Date().toISOString().split('T')[0]}.pdf`
                });
            });
        });
    }

    async generateExcel(analysis, customer) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('分析レポート');

        // Title
        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = '変額保険運用アドバイザリーレポート';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Customer Information
        worksheet.addRow([]);
        worksheet.addRow(['顧客情報']);
        worksheet.addRow(['顧客名', customer.name]);
        worksheet.addRow(['契約日', new Date(customer.contract_date).toLocaleDateString('ja-JP')]);
        worksheet.addRow(['月額保険料', `¥${customer.monthly_premium.toLocaleString()}`]);
        worksheet.addRow(['リスク許容度', this.translateRiskTolerance(customer.risk_tolerance)]);

        // Analysis Information
        worksheet.addRow([]);
        worksheet.addRow(['分析情報']);
        worksheet.addRow(['分析日', new Date(analysis.analysis_date).toLocaleDateString('ja-JP')]);
        worksheet.addRow(['信頼度スコア', `${(analysis.confidence_score * 100).toFixed(0)}%`]);

        // Allocation Table
        worksheet.addRow([]);
        worksheet.addRow(['推奨資産配分']);
        worksheet.addRow(['資産クラス', '配分率(%)']);
        
        Object.entries(analysis.adjusted_allocation).forEach(([asset, percentage]) => {
            worksheet.addRow([asset, percentage]);
        });

        // Chart Data
        const chartSheet = workbook.addWorksheet('配分チャート');
        chartSheet.addRow(['資産クラス', '配分率']);
        Object.entries(analysis.adjusted_allocation).forEach(([asset, percentage]) => {
            chartSheet.addRow([asset, percentage]);
        });

        // Styling
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return {
            content: buffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename: `analysis_${customer.name}_${new Date().toISOString().split('T')[0]}.xlsx`
        };
    }

    generateJSON(analysis, customer) {
        const data = {
            report: {
                generatedAt: new Date().toISOString(),
                customer: {
                    name: customer.name,
                    contractDate: customer.contract_date,
                    monthlyPremium: customer.monthly_premium,
                    riskTolerance: customer.risk_tolerance
                },
                analysis: {
                    date: analysis.analysis_date,
                    confidenceScore: analysis.confidence_score,
                    marketAnalysis: analysis.recommendation_text,
                    baseAllocation: analysis.base_allocation,
                    adjustedAllocation: analysis.adjusted_allocation,
                    adjustmentFactors: analysis.adjustment_factors
                }
            }
        };

        return {
            content: Buffer.from(JSON.stringify(data, null, 2)),
            contentType: 'application/json',
            filename: `analysis_${customer.name}_${new Date().toISOString().split('T')[0]}.json`
        };
    }

    translateRiskTolerance(riskTolerance) {
        const translations = {
            conservative: '保守的',
            balanced: 'バランス型',
            aggressive: '積極的'
        };
        return translations[riskTolerance] || riskTolerance;
    }

    getTimeHorizonText(contractDate) {
        const months = this.calculateContractMonths(contractDate);
        if (months < 12) return '短期（1年未満）';
        if (months < 60) return '中期（1-5年）';
        return '長期（5年以上）';
    }

    getAmountTierText(monthlyPremium) {
        if (monthlyPremium < 10000) return '少額（1万円未満）';
        if (monthlyPremium <= 30000) return '中額（1-3万円）';
        return '高額（3万円超）';
    }

    calculateContractMonths(contractDate) {
        const contract = new Date(contractDate);
        const now = new Date();
        return (now.getFullYear() - contract.getFullYear()) * 12 + 
               (now.getMonth() - contract.getMonth());
    }
}

module.exports = new ExportService();