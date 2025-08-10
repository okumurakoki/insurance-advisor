import axios, { AxiosInstance, AxiosError } from 'axios';
import { User, Customer, AnalysisResult, LoginForm, CustomerForm } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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
}

export default new ApiService();