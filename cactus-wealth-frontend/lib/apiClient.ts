import axios, { AxiosInstance } from 'axios';

// Use Next.js internal proxy for all API calls
const API_BASE_URL = '/api/v1';

export class ApiClientInterceptor {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache for GET requests
        Pragma: 'cache',
      },
      // Optimized timeout for better UX
      timeout: 15000, // Reduced from 30s to 15s
      validateStatus: (status) => status < 500, // Accept 4xx errors for proper handling
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - NextAuth handles tokens automatically
    this.client.interceptors.request.use(
      (config) => {
        // Add cache headers for GET requests
        if (config.method?.toLowerCase() === 'get') {
          config.headers['Cache-Control'] = 'public, max-age=300'; // 5 minutes
        } else {
          config.headers['Cache-Control'] = 'no-cache';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('🔒 Received 401 error - authentication required');
          
          // Dispatch logout event to notify components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance only if not in test environment
let apiClientInterceptorInstance: ApiClientInterceptor;
let apiClientInterceptor: ApiClientInterceptor;
let apiClient: AxiosInstance;

if (process.env.NODE_ENV !== 'test') {
  apiClientInterceptorInstance = new ApiClientInterceptor(API_BASE_URL);
  apiClientInterceptor = apiClientInterceptorInstance;
  apiClient = apiClientInterceptorInstance.getClient();
} else {
  // In test environment, create mock instances
  apiClientInterceptor = {} as ApiClientInterceptor;
  apiClient = {} as AxiosInstance;
}

export { apiClientInterceptor, apiClient };

// Test-only: permite crear una instancia nueva para tests
// @ts-ignore
if (process.env.NODE_ENV === 'test') {
  // @ts-ignore
  module.exports.createTestApiClientInterceptor = (baseURL: string) =>
    new ApiClientInterceptor(baseURL);
}

// Extended API client with additional methods
export const extendedApiClient = {
  bulkUploadInvestmentAccounts: async (
    clientId: number,
    formData: FormData
  ) => {
    const client = process.env.NODE_ENV !== 'test' 
      ? apiClientInterceptor.getClient()
      : {} as AxiosInstance;
    
    const response = await client.post(`/clients/${clientId}/investment-accounts/bulk-upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },
};
