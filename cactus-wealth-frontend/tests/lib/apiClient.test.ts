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

const { apiClientInterceptor, createTestApiClientInterceptor } = require('@/lib/apiClient');

describe('ApiClientInterceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates axios instance', () => {
    // Import after mocking
    require('@/lib/apiClient');

    expect(mockAxios.create).toHaveBeenCalled();
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
