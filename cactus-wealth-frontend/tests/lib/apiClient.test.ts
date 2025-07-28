import { jest } from '@jest/globals';

// Mock axios before importing the module under test
const mockAxiosInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
};

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(() => ({
    token: 'test-token',
    logout: jest.fn(),
  })),
}));

jest.mock('@/lib/token-utils', () => ({
  isTokenExpired: jest.fn(() => false),
}));

describe('ApiClientInterceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  it('creates axios instance', () => {
    // Clear any previous calls
    mockAxios.create.mockClear();
    
    // Import after mocking - this will create the singleton instance
    require('@/lib/apiClient');

    expect(mockAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        Pragma: 'cache',
      },
      timeout: 15000,
      validateStatus: expect.any(Function),
    });
  });

  it('returns axios client instance', () => {
    const { apiClientInterceptor } = require('@/lib/apiClient');

    const client = apiClientInterceptor.getClient();
    expect(client).toBe(mockAxiosInstance);
  });

  it('sets up interceptors when module is loaded', () => {
    // Clear any previous calls
    mockAxiosInstance.interceptors.request.use.mockClear();
    mockAxiosInstance.interceptors.response.use.mockClear();

    // Import the module y crear instancia test
    const { createTestApiClientInterceptor } = require('@/lib/apiClient');
    createTestApiClientInterceptor('http://test');

    // Check that interceptors were set up
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });
});
