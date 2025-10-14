const ExcelJS = require('exceljs');

class ExcelReportGenerator {
    async generateAnalysisReport(analysisData, customerData) {
        const workbook = new ExcelJS.Workbook();

        // Set workbook properties
        workbook.creator = 'Prudential Insurance Optimizer';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Analysis Summary');
        this.createSummarySheet(summarySheet, analysisData, customerData);

        // Allocation Comparison Sheet
        const allocationSheet = workbook.addWorksheet('Allocation Comparison');
        this.createAllocationSheet(allocationSheet, analysisData);

        // Details Sheet
        const detailsSheet = workbook.addWorksheet('Customer Details');
        this.createDetailsSheet(detailsSheet, customerData);

        return await workbook.xlsx.writeBuffer();
    }

    createSummarySheet(sheet, analysisData, customerData) {
        // Set column widths
        sheet.columns = [
            { width: 30 },
            { width: 40 }
        ];

        // Title
        sheet.getCell('A1').value = 'Portfolio Analysis Report';
        sheet.getCell('A1').font = { size: 16, bold: true };
        sheet.mergeCells('A1:B1');
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // Date
        sheet.getCell('A2').value = 'Generated Date:';
        sheet.getCell('B2').value = new Date().toLocaleDateString('ja-JP');
        sheet.getRow(2).font = { italic: true };

        // Add empty row
        sheet.addRow([]);

        // Customer Information Section
        let currentRow = 4;
        sheet.getCell(`A${currentRow}`).value = 'Customer Information';
        sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        sheet.getCell(`A${currentRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Name:';
        sheet.getCell(`B${currentRow}`).value = customerData.name;
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Contract Date:';
        sheet.getCell(`B${currentRow}`).value = new Date(customerData.contract_date).toLocaleDateString('ja-JP');
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Monthly Premium:';
        sheet.getCell(`B${currentRow}`).value = `¥${customerData.monthly_premium.toLocaleString()}`;
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Risk Tolerance:';
        sheet.getCell(`B${currentRow}`).value = this.getRiskToleranceLabel(customerData.risk_tolerance);
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Contract Amount:';
        sheet.getCell(`B${currentRow}`).value = `¥${customerData.contract_amount.toLocaleString()}`;
        currentRow += 2;

        // Analysis Information Section
        sheet.getCell(`A${currentRow}`).value = 'Analysis Information';
        sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        sheet.getCell(`A${currentRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Analysis Date:';
        sheet.getCell(`B${currentRow}`).value = new Date(analysisData.analysis_date).toLocaleDateString('ja-JP');
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Confidence Score:';
        sheet.getCell(`B${currentRow}`).value = `${analysisData.confidence_score}%`;
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Market Data Source:';
        sheet.getCell(`B${currentRow}`).value = analysisData.market_data_source;
        currentRow++;

        // Recommendations
        if (analysisData.recommendation_text) {
            currentRow += 2;
            sheet.getCell(`A${currentRow}`).value = 'Recommendations';
            sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
            sheet.getCell(`A${currentRow}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            sheet.mergeCells(`A${currentRow}:B${currentRow}`);
            currentRow++;

            sheet.getCell(`A${currentRow}`).value = analysisData.recommendation_text;
            sheet.mergeCells(`A${currentRow}:B${currentRow}`);
            sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
            sheet.getRow(currentRow).height = 60;
        }
    }

    createAllocationSheet(sheet, analysisData) {
        // Set column widths
        sheet.columns = [
            { width: 25 },
            { width: 20 },
            { width: 20 },
            { width: 20 }
        ];

        // Headers
        sheet.getCell('A1').value = 'Asset Allocation Comparison';
        sheet.getCell('A1').font = { size: 14, bold: true };
        sheet.mergeCells('A1:D1');
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.addRow([]);

        // Column headers
        const headerRow = sheet.addRow(['Fund Type', 'Current (%)', 'Recommended (%)', 'Change (%)']);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
        });

        // Data rows
        const currentAllocation = analysisData.adjusted_allocation || {};
        const recommendedAllocation = analysisData.base_allocation || {};

        const fundTypes = new Set([
            ...Object.keys(currentAllocation),
            ...Object.keys(recommendedAllocation)
        ]);

        fundTypes.forEach(fundType => {
            const current = currentAllocation[fundType] || 0;
            const recommended = recommendedAllocation[fundType] || 0;
            const change = recommended - current;

            const row = sheet.addRow([
                fundType,
                current,
                recommended,
                change
            ]);

            // Format percentage columns
            row.getCell(2).numFmt = '0.0"%"';
            row.getCell(3).numFmt = '0.0"%"';
            row.getCell(4).numFmt = '0.0"%"';

            // Color code the change
            if (change > 0) {
                row.getCell(4).font = { color: { argb: 'FF00B050' } };
            } else if (change < 0) {
                row.getCell(4).font = { color: { argb: 'FFFF0000' } };
            }
        });

        // Add borders to all cells
        const lastRow = sheet.lastRow.number;
        for (let i = 3; i <= lastRow; i++) {
            for (let j = 1; j <= 4; j++) {
                const cell = sheet.getRow(i).getCell(j);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }
    }

    createDetailsSheet(sheet, customerData) {
        // Set column widths
        sheet.columns = [
            { width: 30 },
            { width: 40 }
        ];

        // Title
        sheet.getCell('A1').value = 'Customer Detailed Information';
        sheet.getCell('A1').font = { size: 14, bold: true };
        sheet.mergeCells('A1:B1');
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.addRow([]);

        // All customer fields
        const fields = [
            ['Customer ID', customerData.id],
            ['Name', customerData.name],
            ['Birth Date', customerData.birth_date ? new Date(customerData.birth_date).toLocaleDateString('ja-JP') : 'N/A'],
            ['Gender', customerData.gender || 'N/A'],
            ['Contract Date', new Date(customerData.contract_date).toLocaleDateString('ja-JP')],
            ['Contract Amount', `¥${customerData.contract_amount.toLocaleString()}`],
            ['Monthly Premium', `¥${customerData.monthly_premium.toLocaleString()}`],
            ['Risk Tolerance', this.getRiskToleranceLabel(customerData.risk_tolerance)],
            ['Investment Goal', customerData.investment_goal || 'N/A'],
            ['Time Horizon (years)', customerData.time_horizon || 'N/A'],
            ['Contact Email', customerData.email || 'N/A'],
            ['Contact Phone', customerData.phone || 'N/A']
        ];

        fields.forEach(([label, value]) => {
            const row = sheet.addRow([label, value]);
            row.getCell(1).font = { bold: true };
            row.getCell(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' }
            };
        });
    }

    getRiskToleranceLabel(level) {
        const labels = {
            1: 'Very Conservative',
            2: 'Conservative',
            3: 'Moderate',
            4: 'Aggressive',
            5: 'Very Aggressive'
        };
        return labels[level] || 'Unknown';
    }
}

module.exports = ExcelReportGenerator;
