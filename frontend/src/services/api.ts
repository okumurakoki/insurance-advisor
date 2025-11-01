import axios, { AxiosInstance, AxiosError } from 'axios';
import { User, Customer, AnalysisResult, LoginForm, CustomerForm } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.insurance-optimizer.com/api';
const SUPABASE_FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL || 'https://api.insurance-optimizer.com/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<{ token: string; user: User }> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: LoginForm & { parentUserId?: string }): Promise<{ message: string; userId: number }> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    const response = await this.api.get('/auth/verify');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // User endpoints
  async getProfile(): Promise<User> {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async getUser(userId: number): Promise<User> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async getChildren(): Promise<User[]> {
    const response = await this.api.get('/users/children');
    return response.data;
  }

  async createChildAccount(data: LoginForm): Promise<{ message: string; userId: number }> {
    const response = await this.api.post('/users/create-child', data);
    return response.data;
  }

  async updatePlan(planType: 'standard' | 'master' | 'exceed'): Promise<{ message: string; planType: string; customerLimit: number }> {
    const response = await this.api.put('/users/update-plan', { planType });
    return response.data;
  }

  async getPlanFeatures(): Promise<any> {
    const response = await this.api.get('/users/plan-features');
    return response.data;
  }

  // Helper function to convert snake_case to camelCase for customer data
  private convertCustomerData(data: any): Customer {
    return {
      ...data,
      userId: data.user_id,
      contractDate: data.contract_date,
      contractAmount: parseFloat(data.contract_amount) || 0,
      monthlyPremium: parseFloat(data.monthly_premium) || 0,
      riskTolerance: data.risk_tolerance,
      investmentGoal: data.investment_goal,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      companyId: data.company_id,
      companyCode: data.company_code,
      companyName: data.company_name,
      displayName: data.display_name,
    };
  }

  // Customer endpoints
  async getCustomers(): Promise<Customer[]> {
    const response = await this.api.get('/customers');
    return response.data.map((customer: any) => this.convertCustomerData(customer));
  }

  async getCustomer(id: number): Promise<Customer> {
    const response = await this.api.get(`/customers/${id}`);
    return this.convertCustomerData(response.data);
  }

  async createCustomer(data: CustomerForm): Promise<{ id: number; message: string }> {
    const response = await this.api.post('/customers', data);
    return response.data;
  }

  async updateCustomer(id: number, data: Partial<CustomerForm>): Promise<{ message: string }> {
    const response = await this.api.put(`/customers/${id}`, data);
    return response.data;
  }

  async deleteCustomer(id: number): Promise<{ message: string }> {
    const response = await this.api.delete(`/customers/${id}`);
    return response.data;
  }

  async getCustomerAnalysisHistory(customerId: number): Promise<AnalysisResult[]> {
    const response = await this.api.get(`/customers/${customerId}/analysis-history`);
    return response.data;
  }

  // Analysis endpoints
  async generateRecommendation(customerId: number): Promise<{
    analysisId: number;
    customer: any;
    allocation: any;
    marketAnalysis: string;
    adjustmentFactors: any;
    confidenceScore: number;
  }> {
    const response = await this.api.post(`/analysis/recommend/${customerId}`);
    return response.data;
  }

  async getAnalysisHistory(customerId: number): Promise<AnalysisResult[]> {
    const response = await this.api.get(`/analysis/history/${customerId}`);
    return response.data;
  }

  async exportAnalysis(analysisId: number, format: 'pdf' | 'excel' | 'api'): Promise<Blob> {
    const response = await this.api.get(`/analysis/export/${analysisId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async uploadMarketData(file: File, companyId: number): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('marketData', file);
    formData.append('company_id', companyId.toString());

    const response = await this.api.post('/analysis/upload-market-data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Market Data endpoints (Supabase Edge Functions)
  async getMarketData(): Promise<{ success: boolean; data: any[]; timestamp: string }> {
    const response = await axios.get(`${SUPABASE_FUNCTIONS_URL}/market-data/real-time`);
    return response.data;
  }

  async generatePdfReport(reportType: string, customerId: string, dateRange: any): Promise<{ success: boolean; reportId: string; downloadUrl: string }> {
    const response = await axios.post(`${SUPABASE_FUNCTIONS_URL}/generate-report-pdf`, {
      reportType,
      customerId,
      dateRange,
    });
    return response.data;
  }

  async getCustomersFromKV(): Promise<{ success: boolean; data: any[]; timestamp: string }> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SUPABASE_FUNCTIONS_URL}/customers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  // PDF Analysis endpoints
  async analyzePdfDocument(file: File, customerId: number): Promise<{ success: boolean; analysis: any; message: string }> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('customerId', customerId.toString());

    const response = await this.api.post('/analysis/pdf-analysis', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async extractPdfText(file: File): Promise<{ success: boolean; text: string }> {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await this.api.post('/analysis/extract-pdf-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get current user info with customer count and limit
  async getCurrentUser(): Promise<{
    id: number;
    userId: string;
    accountType: string;
    parentId: number | null;
    customerCount: number;
    customerLimit: number;
    canAddCustomer: boolean;
  }> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Get staff list with customer count and limit (for agency accounts)
  async getStaff(): Promise<Array<{
    id: number;
    user_id: string;
    account_type: string;
    customerCount: number;
    customerLimit: number;
    canAddCustomer: boolean;
  }>> {
    const response = await this.api.get('/users/staff');
    return response.data;
  }

  // Get statistics (for dashboard)
  async getStatistics(): Promise<{
    customerCount: number;
    reportCount: number;
    totalAssets: number;
    totalMonthlyPremium: number;
    averageReturn: number;
  }> {
    const response = await this.api.get('/analysis/statistics');
    return response.data;
  }

  // Insurance Company endpoints
  async getInsuranceCompanies(): Promise<Array<{
    id: number;
    company_code: string;
    company_name: string;
    company_name_en: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>> {
    const response = await this.api.get('/insurance/companies');
    return response.data;
  }

  async getInsuranceCompany(id: number): Promise<{
    id: number;
    company_code: string;
    company_name: string;
    company_name_en: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }> {
    const response = await this.api.get(`/insurance/companies/${id}`);
    return response.data;
  }

  // Get insurance companies available to current user
  async getMyInsuranceCompanies(): Promise<Array<{
    id: number;
    company_code: string;
    company_name: string;
    company_name_en: string;
    display_name: string;
    is_active: boolean;
    contract_start_date: string;
    contract_end_date: string | null;
  }>> {
    const response = await this.api.get('/insurance/my-companies');
    return response.data;
  }

  // Add insurance company to agency (admin only)
  async addAgencyCompany(data: {
    user_id?: number;
    company_id: number;
    contract_start_date?: string;
    notes?: string;
  }): Promise<{ message: string; data: any }> {
    const response = await this.api.post('/insurance/agency-companies', data);
    return response.data;
  }

  // Get agencies list (admin only)
  async getAgencies(): Promise<Array<{
    id: number;
    userId: string;
    user_id?: string;
    account_type?: string;
    planType?: string;
    isActive?: boolean;
    createdAt?: string;
    staffCount?: number;
    staffLimit?: number;
    customerCount?: number;
    customerLimit?: number;
  }>> {
    const response = await this.api.get('/admin/agencies');
    // Map userId to user_id for backward compatibility
    return response.data.map((agency: any) => ({
      ...agency,
      user_id: agency.userId || agency.user_id,
      account_type: 'parent',
    }));
  }

  // Get agency's contracted insurance companies (admin only)
  async getAgencyCompanies(agencyId: number): Promise<Array<{
    id: number;
    company_id: number;
    company_code: string;
    company_name: string;
    display_name: string;
    contract_start_date: string;
    contract_end_date: string | null;
    is_active: boolean;
  }>> {
    const response = await this.api.get(`/insurance/agency-companies/${agencyId}`);
    return response.data;
  }

  // Remove insurance company from agency
  async removeAgencyCompany(id: number): Promise<{ message: string }> {
    const response = await this.api.delete(`/insurance/agency-companies/${id}`);
    return response.data;
  }

  async getSpecialAccounts(companyCode?: string): Promise<Array<{
    id: number;
    company_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    investment_policy: string | null;
    benchmark: string | null;
    base_currency: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    company_code: string;
    company_name: string;
  }>> {
    const params = companyCode ? { company_code: companyCode } : {};
    const response = await this.api.get('/insurance/special-accounts', { params });
    return response.data;
  }

  async getSpecialAccountsByCompany(companyId: number): Promise<Array<{
    id: number;
    company_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    investment_policy: string | null;
    benchmark: string | null;
    base_currency: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    company_code: string;
    company_name: string;
  }>> {
    const response = await this.api.get(`/insurance/companies/${companyId}/special-accounts`);
    return response.data;
  }

  async getSpecialAccountPerformance(
    accountId: number,
    options?: {
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<Array<{
    id: number;
    special_account_id: number;
    performance_date: string;
    unit_price: string;
    return_1m: string;
    return_3m: string;
    return_6m: string;
    return_1y: string;
    return_3y: string;
    return_since_inception: string;
    total_assets: string | null;
    created_at: string;
    account_code: string;
    account_name: string;
    company_code: string;
    company_name: string;
  }>> {
    const response = await this.api.get(`/insurance/special-accounts/${accountId}/performance`, {
      params: options,
    });
    return response.data;
  }

  async getLatestPerformanceByCompany(companyCode?: string): Promise<Array<{
    id: number;
    special_account_id: number;
    performance_date: string;
    unit_price: string;
    return_1m: string;
    return_3m: string;
    return_6m: string;
    return_1y: string;
    return_3y: string;
    return_since_inception: string;
    total_assets: string | null;
    account_code: string;
    account_name: string;
    account_type: string;
    benchmark: string | null;
    company_code: string;
    company_name: string;
  }>> {
    const params = companyCode ? { company_code: companyCode } : {};
    const response = await this.api.get('/insurance/performance/latest', { params });
    return response.data;
  }
}

export default new ApiService();