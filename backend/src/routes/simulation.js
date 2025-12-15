const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const db = require('../utils/database-factory');

/**
 * モンテカルロシミュレーション
 * @param {number} initialAmount - 初期投資額
 * @param {number} monthlyPremium - 月額保険料
 * @param {number} years - 運用年数
 * @param {number} annualReturn - 年間期待リターン（小数）
 * @param {number} annualVolatility - 年間ボラティリティ（小数）
 * @param {number} numSimulations - シミュレーション回数
 * @returns {Object} シミュレーション結果
 */
function runMonteCarloSimulation(initialAmount, monthlyPremium, years, annualReturn, annualVolatility, numSimulations = 1000) {
    const monthlyReturn = annualReturn / 12;
    const monthlyVolatility = annualVolatility / Math.sqrt(12);
    const totalMonths = years * 12;

    // 各シミュレーションの最終資産額を格納
    const finalValues = [];
    // 各月の資産額を格納（パーセンタイル計算用）
    const monthlyValues = Array.from({ length: totalMonths + 1 }, () => []);

    for (let sim = 0; sim < numSimulations; sim++) {
        let currentValue = initialAmount;
        monthlyValues[0].push(currentValue);

        for (let month = 1; month <= totalMonths; month++) {
            // Box-Muller法で正規乱数を生成
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

            // 月次リターンを計算
            const monthReturn = monthlyReturn + monthlyVolatility * z;

            // 資産額を更新（月初に保険料を追加）
            currentValue = (currentValue + monthlyPremium) * (1 + monthReturn);
            monthlyValues[month].push(currentValue);
        }

        finalValues.push(currentValue);
    }

    // 最終資産額をソート
    finalValues.sort((a, b) => a - b);

    // パーセンタイルを計算
    const getPercentile = (arr, p) => {
        const index = Math.floor(arr.length * p / 100);
        return arr[Math.min(index, arr.length - 1)];
    };

    // 年次データを抽出
    const yearlyData = [];
    for (let year = 0; year <= years; year++) {
        const monthIndex = year * 12;
        const values = monthlyValues[monthIndex].sort((a, b) => a - b);

        yearlyData.push({
            year,
            p5: Math.round(getPercentile(values, 5)),
            p25: Math.round(getPercentile(values, 25)),
            p50: Math.round(getPercentile(values, 50)),
            p75: Math.round(getPercentile(values, 75)),
            p95: Math.round(getPercentile(values, 95)),
            mean: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        });
    }

    // 累計払込保険料を計算
    const totalPremiumPaid = initialAmount + (monthlyPremium * totalMonths);

    return {
        summary: {
            initialAmount,
            monthlyPremium,
            years,
            totalPremiumPaid,
            annualReturn: Math.round(annualReturn * 10000) / 100, // パーセント表示
            annualVolatility: Math.round(annualVolatility * 10000) / 100,
            numSimulations
        },
        finalValues: {
            p5: Math.round(getPercentile(finalValues, 5)),
            p25: Math.round(getPercentile(finalValues, 25)),
            p50: Math.round(getPercentile(finalValues, 50)),
            p75: Math.round(getPercentile(finalValues, 75)),
            p95: Math.round(getPercentile(finalValues, 95)),
            mean: Math.round(finalValues.reduce((a, b) => a + b, 0) / finalValues.length)
        },
        yearlyData
    };
}

/**
 * 過去のパフォーマンスデータからリターンとボラティリティを計算
 * @param {Array} performanceData - パフォーマンスデータ配列
 * @returns {Object} { annualReturn, annualVolatility }
 */
function calculateReturnAndVolatility(performanceData) {
    if (!performanceData || performanceData.length < 2) {
        // デフォルト値を返す
        return { annualReturn: 0.05, annualVolatility: 0.15 };
    }

    // 月次リターンを抽出
    const monthlyReturns = performanceData
        .map(d => parseFloat(d.return_1m))
        .filter(r => !isNaN(r) && r !== null);

    if (monthlyReturns.length < 2) {
        return { annualReturn: 0.05, annualVolatility: 0.15 };
    }

    // 月次リターンを小数に変換（パーセントの場合）
    const returns = monthlyReturns.map(r => r > 1 || r < -1 ? r / 100 : r);

    // 平均月次リターン
    const meanMonthlyReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // 月次ボラティリティ（標準偏差）
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanMonthlyReturn, 2), 0) / returns.length;
    const monthlyVolatility = Math.sqrt(variance);

    // 年率換算
    const annualReturn = meanMonthlyReturn * 12;
    const annualVolatility = monthlyVolatility * Math.sqrt(12);

    return {
        annualReturn: Math.max(-0.5, Math.min(0.5, annualReturn)), // -50%〜50%に制限
        annualVolatility: Math.max(0.01, Math.min(0.5, annualVolatility)) // 1%〜50%に制限
    };
}

// シミュレーション可能なファンド一覧
router.get('/funds', authenticateToken, async (req, res) => {
    try {
        const { company_id } = req.query;

        let query = `
            SELECT
                sa.id,
                sa.account_code,
                sa.account_name,
                sa.account_type,
                sa.benchmark,
                ic.id as company_id,
                ic.company_code,
                ic.company_name,
                ic.display_name,
                (
                    SELECT COUNT(*)
                    FROM special_account_performance sap
                    WHERE sap.special_account_id = sa.id
                ) as performance_count
            FROM special_accounts sa
            JOIN insurance_companies ic ON sa.company_id = ic.id
            WHERE sa.is_active = TRUE
        `;

        const params = [];
        if (company_id) {
            query += ` AND sa.company_id = $1`;
            params.push(company_id);
        }

        query += ` ORDER BY ic.display_name, sa.account_type, sa.account_name`;

        const funds = await db.query(query, params);

        res.json(funds);
    } catch (error) {
        logger.error('ファンド一覧取得エラー:', error);
        res.status(500).json({ error: 'ファンド一覧の取得に失敗しました' });
    }
});

// 特定ファンドの過去パフォーマンス
router.get('/fund/:id/performance', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { months = 24 } = req.query;

        const performance = await db.query(`
            SELECT
                sap.id,
                sap.performance_date,
                sap.unit_price,
                sap.return_1m,
                sap.return_3m,
                sap.return_6m,
                sap.return_1y,
                sap.return_3y,
                sap.return_5y,
                sap.return_since_inception
            FROM special_account_performance sap
            WHERE sap.special_account_id = $1
            ORDER BY sap.performance_date DESC
            LIMIT $2
        `, [id, parseInt(months)]);

        // リターンとボラティリティを計算
        const stats = calculateReturnAndVolatility(performance);

        res.json({
            performance,
            statistics: {
                annualReturn: Math.round(stats.annualReturn * 10000) / 100,
                annualVolatility: Math.round(stats.annualVolatility * 10000) / 100,
                dataPoints: performance.length
            }
        });
    } catch (error) {
        logger.error('パフォーマンス取得エラー:', error);
        res.status(500).json({ error: 'パフォーマンスデータの取得に失敗しました' });
    }
});

// シミュレーション実行
router.post('/run', authenticateToken, async (req, res) => {
    try {
        const {
            initialAmount,
            monthlyPremium,
            years,
            fundId,
            customReturn,
            customVolatility
        } = req.body;

        // バリデーション
        if (!initialAmount || initialAmount < 0) {
            return res.status(400).json({ error: '初期投資額を正しく入力してください' });
        }
        if (monthlyPremium === undefined || monthlyPremium < 0) {
            return res.status(400).json({ error: '月額保険料を正しく入力してください' });
        }
        if (!years || years < 1 || years > 50) {
            return res.status(400).json({ error: '運用年数は1〜50年の範囲で入力してください' });
        }

        let annualReturn, annualVolatility;

        // カスタム値が指定されている場合はそれを使用
        if (customReturn !== undefined && customVolatility !== undefined) {
            annualReturn = customReturn / 100; // パーセントを小数に変換
            annualVolatility = customVolatility / 100;
        }
        // ファンドIDが指定されている場合は過去データから計算
        else if (fundId) {
            const performance = await db.query(`
                SELECT return_1m
                FROM special_account_performance
                WHERE special_account_id = $1
                ORDER BY performance_date DESC
                LIMIT 24
            `, [fundId]);

            const stats = calculateReturnAndVolatility(performance);
            annualReturn = stats.annualReturn;
            annualVolatility = stats.annualVolatility;
        }
        // どちらも指定されていない場合はデフォルト値
        else {
            annualReturn = 0.05;
            annualVolatility = 0.15;
        }

        // モンテカルロシミュレーション実行
        const result = runMonteCarloSimulation(
            initialAmount,
            monthlyPremium,
            years,
            annualReturn,
            annualVolatility
        );

        logger.info(`シミュレーション実行: 初期=${initialAmount}, 月額=${monthlyPremium}, 年数=${years}, リターン=${annualReturn}, ボラティリティ=${annualVolatility}`);

        res.json(result);
    } catch (error) {
        logger.error('シミュレーション実行エラー:', error);
        res.status(500).json({ error: 'シミュレーションの実行に失敗しました' });
    }
});

// プリセット一覧
router.get('/presets', authenticateToken, async (req, res) => {
    try {
        const presets = [
            {
                id: 'conservative',
                name: '安定型',
                description: '債券中心の安定運用',
                annualReturn: 3.0,
                annualVolatility: 5.0
            },
            {
                id: 'balanced',
                name: 'バランス型',
                description: '株式と債券のバランス運用',
                annualReturn: 5.0,
                annualVolatility: 10.0
            },
            {
                id: 'growth',
                name: '成長型',
                description: '株式中心の成長運用',
                annualReturn: 7.0,
                annualVolatility: 15.0
            },
            {
                id: 'aggressive',
                name: '積極型',
                description: '高リスク高リターンの積極運用',
                annualReturn: 10.0,
                annualVolatility: 25.0
            }
        ];

        res.json(presets);
    } catch (error) {
        logger.error('プリセット取得エラー:', error);
        res.status(500).json({ error: 'プリセットの取得に失敗しました' });
    }
});

module.exports = router;
