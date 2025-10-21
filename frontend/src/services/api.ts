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

  // Customer endpoints
  async getCustomers(): Promise<Customer[]> {
    const response = await this.api.get('/customers');
    return response.data;
  }

  async getCustomer(id: number): Promise<Customer> {
    const response = await this.api.get(`/customers/${id}`);
    return response.data;
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

  async uploadMarketData(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('marketData', file);

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
}

export default new ApiService();