export interface User {
  id: number;
  userId: string;
  accountType: 'parent' | 'child' | 'grandchild';
  planType: 'standard' | 'master' | 'exceed';
  customerLimit: number;
  parentId?: number;
}

export interface Customer {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  contractDate: string;
  contractAmount: number;
  monthlyPremium: number;
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  investmentGoal?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  id: number;
  customerId: number;
  analysisDate: string;
  marketDataSource: string;
  baseAllocation: AllocationData;
  adjustedAllocation: AllocationData;
  adjustmentFactors: AdjustmentFactors;
  recommendationText: string;
  confidenceScore: number;
  createdBy: number;
  createdAt: string;
}

export interface AllocationData {
  '国内株式': number;
  '海外株式': number;
  '国内債券': number;
  '海外債券': number;
  '不動産': number;
}

export interface AdjustmentFactors {
  timeHorizon: {
    short: number;
    medium: number;
    long: number;
  };
  riskProfile: {
    conservative: number;
    balanced: number;
    aggressive: number;
  };
  amountTier: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface LoginForm {
  userId: string;
  password: string;
  accountType: 'parent' | 'child' | 'grandchild';
}

export interface CustomerForm {
  name: string;
  email?: string;
  phone?: string;
  contractDate: string;
  contractAmount: number;
  monthlyPremium: number;
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  investmentGoal?: string;
  notes?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}