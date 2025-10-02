import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth store
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add tenant context if available
    const tenant = useAuthStore.getState().user?.tenant;
    if (tenant && config.headers) {
      config.headers['X-Tenant-ID'] = tenant;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          useAuthStore.getState().setToken(token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('[Token Refresh Failed]', refreshError);
        // Clear auth and redirect to login
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[Access Denied]', error.response.data);
      // Could show a notification here
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.warn(`[Rate Limited] Retry after ${retryAfter} seconds`);
      // Could implement automatic retry with backoff
    }

    // Handle network errors
    if (!error.response) {
      console.error('[Network Error]', error.message);
      // Could show offline notification
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// Type-safe API methods
export const api = {
  // Generic methods
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config).then(res => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post(url, data, config).then(res => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put(url, data, config).then(res => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.patch(url, data, config).then(res => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config).then(res => res.data),

  // Auth endpoints
  auth: {
    login: (provider: 'google' | 'microsoft') =>
      api.get<{ authUrl: string }>(`/auth/login/${provider}`),

    callback: (provider: string, code: string, state: string) =>
      api.get(`/auth/callback/${provider}?code=${code}&state=${state}`),

    verify: () =>
      api.get<{ valid: boolean; user: any }>('/auth/verify'),

    logout: (sessionId: string) =>
      api.post('/auth/logout', { sessionId }),

    refresh: (sessionId: string) =>
      api.post<{ token: string }>('/auth/refresh', { sessionId }),
  },

  // Cost endpoints
  costs: {
    getAllocation: (params?: { startDate?: string; endDate?: string }) =>
      api.get('/costs/allocation', { params }),

    getAnomalies: (params?: { severity?: string; limit?: number }) =>
      api.get('/costs/anomalies', { params }),

    getTrend: (params?: { period?: string; groupBy?: string }) =>
      api.get('/costs/trend', { params }),

    getByService: (params?: { services?: string[]; date?: string }) =>
      api.get('/costs/by-service', { params }),
  },

  // Optimization endpoints
  optimization: {
    getRecommendations: (params?: { type?: string; minSavings?: number }) =>
      api.get('/optimization/recommendations', { params }),

    getESR: () =>
      api.get<{ esr: number; breakdown: any }>('/optimization/esr'),

    getRightsizing: () =>
      api.get('/optimization/rightsizing'),

    getWaste: () =>
      api.get('/optimization/waste'),

    applyRecommendation: (id: string, action: string) =>
      api.post(`/optimization/recommendations/${id}/apply`, { action }),
  },

  // Budget endpoints
  budgets: {
    getAll: () =>
      api.get('/budgets'),

    getById: (id: string) =>
      api.get(`/budgets/${id}`),

    create: (data: any) =>
      api.post('/budgets', data),

    update: (id: string, data: any) =>
      api.put(`/budgets/${id}`, data),

    delete: (id: string) =>
      api.delete(`/budgets/${id}`),

    getAlerts: (id: string) =>
      api.get(`/budgets/${id}/alerts`),
  },

  // Reports endpoints
  reports: {
    generate: (type: string, params: any) =>
      api.post('/reports/generate', { type, params }),

    getAll: () =>
      api.get('/reports'),

    download: (id: string) =>
      api.get(`/reports/${id}/download`, { responseType: 'blob' }),

    schedule: (data: any) =>
      api.post('/reports/schedule', data),
  },

  // Unit metrics endpoints
  unitMetrics: {
    getAll: () =>
      api.get('/metrics/unit'),

    getByType: (type: string) =>
      api.get(`/metrics/unit/${type}`),

    update: (type: string, value: number) =>
      api.post(`/metrics/unit/${type}`, { value }),
  },

  // Cloud accounts endpoints
  cloudAccounts: {
    getAll: () =>
      api.get('/cloud-accounts'),

    connect: (provider: string, credentials: any) =>
      api.post('/cloud-accounts/connect', { provider, credentials }),

    test: (id: string) =>
      api.post(`/cloud-accounts/${id}/test`),

    sync: (id: string) =>
      api.post(`/cloud-accounts/${id}/sync`),

    disconnect: (id: string) =>
      api.delete(`/cloud-accounts/${id}`),
  },

  // Policies endpoints
  policies: {
    getAll: () =>
      api.get('/governance/policies'),

    getViolations: () =>
      api.get('/governance/violations'),

    create: (data: any) =>
      api.post('/governance/policies', data),

    update: (id: string, data: any) =>
      api.put(`/governance/policies/${id}`, data),

    enforce: (id: string, enforce: boolean) =>
      api.patch(`/governance/policies/${id}`, { enforced: enforce }),
  },

  // Tenant endpoints
  tenant: {
    getSettings: () =>
      api.get('/tenant/settings'),

    updateSettings: (settings: any) =>
      api.put('/tenant/settings', settings),

    getUsers: () =>
      api.get('/tenant/users'),

    inviteUser: (email: string, role: string) =>
      api.post('/tenant/users/invite', { email, role }),

    updateUserRole: (userId: string, role: string) =>
      api.patch(`/tenant/users/${userId}`, { role }),

    removeUser: (userId: string) =>
      api.delete(`/tenant/users/${userId}`),
  },
};

// Export types
export type ApiClient = typeof api;
export default api;