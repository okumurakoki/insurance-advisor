const logger = require('../utils/logger');

class AllocationCalculator {
    constructor(baseAllocation, adjustmentFactors) {
        this.baseAllocation = baseAllocation;
        this.adjustmentFactors = adjustmentFactors;
    }

    calculatePersonalizedAllocation(customer) {
        const contractMonths = this.getContractMonths(customer.contract_date);
        const amountTier = this.getAmountTier(customer.monthly_premium);
        
        let allocation = { ...this.baseAllocation };
        
        // 契約期間による調整
        const timeAdjustment = this.getTimeAdjustment(contractMonths);
        
        // 契約金額による調整
        const amountAdjustment = this.getAmountAdjustment(amountTier);
        
        // リスク許容度による調整
        const riskAdjustment = this.getRiskAdjustment(customer.risk_tolerance);
        
        // 各資産クラスに調整を適用
        Object.keys(allocation).forEach(asset => {
            allocation[asset] = allocation[asset] * timeAdjustment * amountAdjustment * riskAdjustment;
        });
        
        // 合計を100%に正規化
        allocation = this.normalizeAllocation(allocation);
        
        // 最小/最大制限を適用
        allocation = this.applyLimits(allocation);
        
        logger.info(`Calculated allocation for customer ${customer.name}: ${JSON.stringify(allocation)}`);
        
        return allocation;
    }
    
    getContractMonths(contractDate) {
        const contract = new Date(contractDate);
        const now = new Date();
        const months = (now.getFullYear() - contract.getFullYear()) * 12 + 
                      (now.getMonth() - contract.getMonth());
        return Math.max(0, months);
    }
    
    getAmountTier(monthlyPremium) {
        if (monthlyPremium < 10000) return 'small';
        if (monthlyPremium <= 30000) return 'medium';
        return 'large';
    }
    
    getTimeAdjustment(contractMonths) {
        const factors = this.adjustmentFactors.timeHorizon;
        
        if (contractMonths < 12) {
            return factors.short || 0.8;
        } else if (contractMonths < 60) {
            return factors.medium || 1.0;
        } else {
            return factors.long || 1.2;
        }
    }
    
    getAmountAdjustment(tier) {
        const factors = this.adjustmentFactors.amountTier;
        return factors[tier] || 1.0;
    }
    
    getRiskAdjustment(riskTolerance) {
        const factors = this.adjustmentFactors.riskProfile;
        return factors[riskTolerance] || 1.0;
    }
    
    normalizeAllocation(allocation) {
        const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
        
        if (total === 0) {
            // デフォルト配分を返す
            return {
                "国内株式": 30,
                "海外株式": 30,
                "国内債券": 20,
                "海外債券": 15,
                "不動産": 5
            };
        }
        
        const normalized = {};
        Object.keys(allocation).forEach(asset => {
            normalized[asset] = Math.round((allocation[asset] / total) * 100);
        });
        
        // 端数調整
        const normalizedTotal = Object.values(normalized).reduce((sum, value) => sum + value, 0);
        if (normalizedTotal !== 100) {
            const diff = 100 - normalizedTotal;
            const largestAsset = Object.keys(normalized).reduce((a, b) => 
                normalized[a] > normalized[b] ? a : b
            );
            normalized[largestAsset] += diff;
        }
        
        return normalized;
    }
    
    applyLimits(allocation) {
        const limits = {
            "国内株式": { min: 10, max: 40 },
            "海外株式": { min: 10, max: 50 },
            "国内債券": { min: 10, max: 40 },
            "海外債券": { min: 5, max: 30 },
            "不動産": { min: 0, max: 20 }
        };
        
        const limited = {};
        let adjustmentNeeded = false;
        
        // 制限を適用
        Object.keys(allocation).forEach(asset => {
            const limit = limits[asset] || { min: 0, max: 100 };
            if (allocation[asset] < limit.min) {
                limited[asset] = limit.min;
                adjustmentNeeded = true;
            } else if (allocation[asset] > limit.max) {
                limited[asset] = limit.max;
                adjustmentNeeded = true;
            } else {
                limited[asset] = allocation[asset];
            }
        });
        
        // 調整が必要な場合は再正規化
        if (adjustmentNeeded) {
            return this.normalizeAllocation(limited);
        }
        
        return limited;
    }
    
    calculateRebalancingSuggestions(currentAllocation, targetAllocation) {
        const suggestions = [];
        
        Object.keys(targetAllocation).forEach(asset => {
            const current = currentAllocation[asset] || 0;
            const target = targetAllocation[asset];
            const diff = target - current;
            
            if (Math.abs(diff) > 2) { // 2%以上の差がある場合のみ提案
                suggestions.push({
                    asset,
                    current,
                    target,
                    action: diff > 0 ? 'increase' : 'decrease',
                    amount: Math.abs(diff)
                });
            }
        });
        
        return suggestions.sort((a, b) => b.amount - a.amount);
    }
}

module.exports = AllocationCalculator;