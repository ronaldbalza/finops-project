// Centralized API configuration and utilities
const isDevelopment = import.meta.env.DEV;

// API Base URL Configuration
// Use environment variable with fallback for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  isDevelopment 
    ? 'http://localhost:8787' // Local Cloudflare Workers dev server
    : 'https://backend-api.ronaldbalza23.workers.dev' // Production fallback
);

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
  timestamp?: string;
}

// Enhanced fetch wrapper with better error handling
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    
    // Handle different content types
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = {
        error: data.error || `HTTP ${response.status}`,
        message: data.message || response.statusText,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
      
      // Handle specific error codes
      if (response.status === 401) {
        // Redirect to login on authentication failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      throw error;
    }

    return data;
  } catch (error) {
    // Network or parsing errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        status: 0,
      } as ApiError;
    }
    
    // Re-throw API errors
    if (error && typeof error === 'object' && 'error' in error) {
      throw error;
    }
    
    // Unknown errors
    throw {
      error: 'Unknown Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: 500,
    } as ApiError;
  }
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
    
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
    
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
    
  delete: <T = any>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
    
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined,
      ...options 
    }),
};

// Retry mechanism for failed requests
export async function apiRequestWithRetry<T = any>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: ApiError | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error as ApiError;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (lastError.status && lastError.status >= 400 && lastError.status < 500 && lastError.status !== 429) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Debug logging helper (only in development)
export const logApiCall = (endpoint: string, options: RequestInit, response?: any) => {
  if (isDevelopment) {
    console.group(`🌐 API Call: ${options.method || 'GET'} ${endpoint}`);
    console.log('Options:', options);
    if (response) {
      console.log('Response:', response);
    }
    console.groupEnd();
  }
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    refresh: `${API_BASE_URL}/api/auth/refresh`,
  },
  users: `${API_BASE_URL}/api/users`,
  tenants: `${API_BASE_URL}/api/tenants`,
  reports: `${API_BASE_URL}/api/reports`,
  messages: `${API_BASE_URL}/api/messages`,
  conversations: `${API_BASE_URL}/api/conversations`,
}; 