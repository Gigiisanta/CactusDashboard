import { ApiClient, apiClient } from '../api';
import { apiClientInterceptor } from '../apiClient';
import {
  UserRole,
  RiskProfile,
  ClientStatus,
  LeadSource,
} from '@/types';

// Mock the apiClientInterceptor
const mockAxiosClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../apiClient', () => ({
  apiClientInterceptor: {
    getClient: jest.fn(() => mockAxiosClient),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  const mockApiClientInterceptor = apiClientInterceptor as jest.Mocked<typeof apiClientInterceptor>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  // Mock data used across tests
  const mockClient = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.PROSPECT,
    lead_source: LeadSource.REFERRAL,
    owner_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockClientCreate = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    risk_profile: RiskProfile.MEDIUM,
  };

  const mockClientUpdate = {
    first_name: 'Jane',
    last_name: 'Smith',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClientInterceptor.getClient.mockReturnValue(mockAxiosClient as any);
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Basic Setup', () => {
    it('creates instance with correct baseURL', () => {
      const customApiClient = new ApiClient('https://custom-api.com');
      expect(customApiClient).toBeInstanceOf(ApiClient);
    });

    it('exports default apiClient instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });

    it('uses environment variable for baseURL', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://test-api.com';
      
      // Create new instance to test env variable
      const testClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'fallback');
      expect(testClient).toBeInstanceOf(ApiClient);
      
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });

  describe('Auth Methods', () => {
    describe('login', () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'testpass',
      };

      const mockToken = {
        access_token: 'mock-token',
        token_type: 'bearer',
      };

      it('successfully logs in with valid credentials', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockToken),
        } as any);

        const result = await apiClient.login(mockCredentials);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/login/access-token'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: expect.stringContaining('username=testuser'),
          })
        );
        expect(result).toEqual(mockToken);
      });

      it('handles login failure with error message', async () => {
        const errorResponse = { detail: 'Invalid credentials' };
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValue(errorResponse),
          statusText: 'Unauthorized',
        } as any);

        await expect(apiClient.login(mockCredentials)).rejects.toThrow('Invalid credentials');
      });

      it('handles login failure without error detail', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockRejectedValue(new Error('Parse error')),
          statusText: 'Unauthorized',
        } as any);

        await expect(apiClient.login(mockCredentials)).rejects.toThrow('Unauthorized');
      });

      it('formats login request body correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockToken),
        } as any);

        await apiClient.login(mockCredentials);

        const fetchCall = mockFetch.mock.calls[0];
        const body = fetchCall[1]?.body as string;
        
        expect(body).toContain('username=testuser');
        expect(body).toContain('password=testpass');
        expect(body).toContain('grant_type=password');
        expect(body).toContain('scope=');
        expect(body).toContain('client_id=');
        expect(body).toContain('client_secret=');
      });
    });

    describe('register', () => {
      const mockUserCreate = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpass',
        role: UserRole.JUNIOR_ADVISOR,
      };

      it('successfully registers a new user', async () => {
        const mockResponse = { id: 1, ...mockUserCreate };
        
        // Mock the private request method by mocking fetch
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(mockResponse),
        } as any);

        const result = await apiClient.register(mockUserCreate);

        expect(result).toEqual(mockResponse);
      });

      it('handles registration errors', async () => {
        const errorResponse = { detail: 'Username already exists' };
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValue(errorResponse),
          status: 400,
          statusText: 'Bad Request',
        } as any);

        await expect(apiClient.register(mockUserCreate)).rejects.toThrow('Username already exists');
      });
    });
  });

  describe('Client Methods', () => {
    describe('getClients', () => {
      it('fetches all clients successfully', async () => {
        const mockClients = [mockClient];
        mockAxiosClient.get.mockResolvedValue({
          data: mockClients,
        });

        const result = await apiClient.getClients();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/clients/');
        expect(result).toEqual(mockClients);
      });

      it('handles errors when fetching clients', async () => {
        mockAxiosClient.get.mockRejectedValue(new Error('Network error'));

        await expect(apiClient.getClients()).rejects.toThrow('Network error');
      });
    });

    describe('getClient', () => {
      it('fetches a specific client successfully', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockClient,
        });

        const result = await apiClient.getClient(1);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/clients/1');
        expect(result).toEqual(mockClient);
      });

      it('handles client not found error', async () => {
        mockAxiosClient.get.mockRejectedValue(new Error('Client not found'));

        await expect(apiClient.getClient(999)).rejects.toThrow('Client not found');
      });
    });

    describe('createClient', () => {
      it('creates a new client successfully', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockClient,
        });

        const result = await apiClient.createClient(mockClientCreate);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/clients/', mockClientCreate);
        expect(result).toEqual(mockClient);
      });

      it('handles client creation errors', async () => {
        mockAxiosClient.post.mockRejectedValue(new Error('Validation error'));

        await expect(apiClient.createClient(mockClientCreate)).rejects.toThrow('Validation error');
      });
    });

    describe('updateClient', () => {
      const mockClientUpdate = {
        first_name: 'Jane',
        status: ClientStatus.ACTIVE_INVESTOR,
      };

      it('updates a client successfully', async () => {
        const updatedClient = { ...mockClient, ...mockClientUpdate };
        mockAxiosClient.put.mockResolvedValue({
          data: updatedClient,
        });

        const result = await apiClient.updateClient(1, mockClientUpdate);

        expect(mockAxiosClient.put).toHaveBeenCalledWith('/clients/1', mockClientUpdate);
        expect(result).toEqual(updatedClient);
      });

      it('handles client update errors', async () => {
        mockAxiosClient.put.mockRejectedValue(new Error('Update failed'));

        await expect(apiClient.updateClient(1, mockClientUpdate)).rejects.toThrow('Update failed');
      });
    });

    describe('deleteClient', () => {
      it('deletes a client successfully', async () => {
        mockAxiosClient.delete.mockResolvedValue({
          data: mockClient,
        });

        const result = await apiClient.deleteClient(1);

        expect(mockAxiosClient.delete).toHaveBeenCalledWith('/clients/1');
        expect(result).toEqual(mockClient);
      });

      it('handles client deletion errors', async () => {
        mockAxiosClient.delete.mockRejectedValue(new Error('Delete failed'));

        await expect(apiClient.deleteClient(1)).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Portfolio Methods', () => {
    const mockPortfolioValuation = {
      portfolio_id: 1,
      portfolio_name: 'Test Portfolio',
      total_value: 100000,
      total_cost_basis: 90000,
      total_pnl: 10000,
      total_pnl_percentage: 11.11,
      positions_count: 5,
      last_updated: '2024-01-01T00:00:00Z',
    };

    describe('getPortfolioValuation', () => {
      it('fetches portfolio valuation successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(mockPortfolioValuation),
        } as any);

        const result = await apiClient.getPortfolioValuation(1);

        expect(result).toEqual(mockPortfolioValuation);
      });

      it('handles portfolio valuation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValue({ detail: 'Portfolio not found' }),
          status: 404,
          statusText: 'Not Found',
        } as any);

        await expect(apiClient.getPortfolioValuation(999)).rejects.toThrow('Portfolio not found');
      });
    });

    describe('downloadPortfolioReport', () => {
      it('downloads portfolio report successfully', async () => {
        const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: jest.fn().mockResolvedValue(mockBlob),
        } as any);

        const result = await apiClient.downloadPortfolioReport(1);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/portfolios/1/report/download'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
        expect(result).toEqual(mockBlob);
      });

      it('handles download errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValue({ detail: 'Report generation failed' }),
        } as any);

        await expect(apiClient.downloadPortfolioReport(1)).rejects.toThrow('Report generation failed');
      });
    });
  });

  describe('Dashboard Methods', () => {
    const mockDashboardSummary = {
      total_clients: 50,
      assets_under_management: 1000000,
      monthly_growth_percentage: 5.5,
      reports_generated_this_quarter: 25,
    };

    describe('getDashboardSummary', () => {
      it('fetches dashboard summary successfully', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockDashboardSummary,
        });

        const result = await apiClient.getDashboardSummary();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/dashboard/summary');
        expect(result).toEqual(mockDashboardSummary);
      });

      it('handles dashboard summary errors', async () => {
        mockAxiosClient.get.mockRejectedValue(new Error('Dashboard error'));

        await expect(apiClient.getDashboardSummary()).rejects.toThrow('Dashboard error');
      });
    });

    describe('getAumHistory', () => {
      const mockAumHistory = [
        { date: '2024-01-01', value: 1000000 },
        { date: '2024-01-02', value: 1010000 },
      ];

      it('fetches AUM history with default days', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockAumHistory,
        });

        const result = await apiClient.getAumHistory();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/dashboard/aum-history?days=30');
        expect(result).toEqual(mockAumHistory);
      });

      it('fetches AUM history with custom days', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockAumHistory,
        });

        const result = await apiClient.getAumHistory(60);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/dashboard/aum-history?days=60');
        expect(result).toEqual(mockAumHistory);
      });
    });
  });

  describe('Report Methods', () => {
    const mockReportResponse = {
      success: true,
      message: 'Report generated successfully',
      report_id: 123,
    };

    describe('generateReport', () => {
      it('generates report with default type', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockReportResponse,
        });

        const result = await apiClient.generateReport(1);

        expect(mockAxiosClient.post).toHaveBeenCalledWith(
          '/reports/clients/1/generate-report',
          {
            client_id: 1,
            report_type: 'PORTFOLIO_SUMMARY',
          }
        );
        expect(result).toEqual(mockReportResponse);
      });

      it('generates report with custom type', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockReportResponse,
        });

        const result = await apiClient.generateReport(1, 'RISK_ANALYSIS');

        expect(mockAxiosClient.post).toHaveBeenCalledWith(
          '/reports/clients/1/generate-report',
          {
            client_id: 1,
            report_type: 'RISK_ANALYSIS',
          }
        );
        expect(result).toEqual(mockReportResponse);
      });
    });
  });

  describe('Investment Account Methods', () => {
    const mockInvestmentAccount = {
      id: 1,
      platform: 'Fidelity',
      account_number: '123456789',
      aum: 50000,
      client_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('createInvestmentAccount', () => {
      const mockAccountCreate = {
        platform: 'Fidelity',
        account_number: '123456789',
        aum: 50000,
      };

      it('creates investment account successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(mockInvestmentAccount),
        } as any);

        const result = await apiClient.createInvestmentAccount(1, mockAccountCreate);

        expect(result).toEqual(mockInvestmentAccount);
      });
    });

    describe('updateInvestmentAccount', () => {
      const mockAccountUpdate = {
        aum: 55000,
      };

      it('updates investment account successfully', async () => {
        const updatedAccount = { ...mockInvestmentAccount, aum: 55000 };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(updatedAccount),
        } as any);

        const result = await apiClient.updateInvestmentAccount(1, mockAccountUpdate);

        expect(result).toEqual(updatedAccount);
      });
    });

    describe('deleteInvestmentAccount', () => {
      it('deletes investment account successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(mockInvestmentAccount),
        } as any);

        const result = await apiClient.deleteInvestmentAccount(1);

        expect(result).toEqual(mockInvestmentAccount);
      });
    });
  });

  describe('Insurance Policy Methods', () => {
    const mockInsurancePolicy = {
      id: 1,
      policy_number: 'POL123456',
      insurance_type: 'Life Insurance',
      premium_amount: 1000,
      coverage_amount: 100000,
      client_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('createInsurancePolicy', () => {
      const mockPolicyCreate = {
        policy_number: 'POL123456',
        insurance_type: 'Life Insurance',
        premium_amount: 1000,
        coverage_amount: 100000,
      };

      it('creates insurance policy successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(mockInsurancePolicy),
        } as any);

        const result = await apiClient.createInsurancePolicy(1, mockPolicyCreate);

        expect(result).toEqual(mockInsurancePolicy);
      });
    });

    describe('updateInsurancePolicy', () => {
      const mockPolicyUpdate = {
        premium_amount: 1200,
      };

      it('updates insurance policy successfully', async () => {
        const updatedPolicy = { ...mockInsurancePolicy, premium_amount: 1200 };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(updatedPolicy),
        } as any);

        const result = await apiClient.updateInsurancePolicy(1, mockPolicyUpdate);

        expect(result).toEqual(updatedPolicy);
      });
    });

    describe('deleteInsurancePolicy', () => {
      it('deletes insurance policy successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          json: jest.fn().mockResolvedValue(mockInsurancePolicy),
        } as any);

        const result = await apiClient.deleteInsurancePolicy(1);

        expect(result).toEqual(mockInsurancePolicy);
      });
    });
  });

  describe('Notification Methods', () => {
    const mockNotifications = [
      {
        id: 1,
        message: 'Test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
      },
    ];

    describe('getNotifications', () => {
      it('fetches notifications with default limit', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockNotifications,
        });

        const result = await apiClient.getNotifications();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/notifications?limit=10');
        expect(result).toEqual(mockNotifications);
      });

      it('fetches notifications with custom limit', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockNotifications,
        });

        const result = await apiClient.getNotifications(5);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/notifications?limit=5');
        expect(result).toEqual(mockNotifications);
      });
    });

    describe('createNotification', () => {
      const mockNotificationCreate = {
        message: 'New test notification',
      };

      const mockCreatedNotification = {
        id: 2,
        message: 'New test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
      };

      it('creates notification successfully', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockCreatedNotification,
        });

        const result = await apiClient.createNotification(mockNotificationCreate);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/notifications/', mockNotificationCreate);
        expect(result).toEqual(mockCreatedNotification);
      });
    });
  });

  describe('Model Portfolio Methods', () => {
    const mockModelPortfolio = {
      id: 1,
      name: 'Conservative Portfolio',
      description: 'Low risk portfolio',
      risk_profile: 'LOW',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      positions: [],
    };

    describe('getModelPortfolios', () => {
      it('fetches all model portfolios successfully', async () => {
        const mockPortfolios = [mockModelPortfolio];
        mockAxiosClient.get.mockResolvedValue({
          data: mockPortfolios,
        });

        const result = await apiClient.getModelPortfolios();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/model-portfolios/');
        expect(result).toEqual(mockPortfolios);
      });
    });

    describe('createModelPortfolio', () => {
      const mockPortfolioCreate = {
        name: 'Aggressive Portfolio',
        description: 'High risk portfolio',
        risk_profile: 'HIGH' as const,
      };

      it('creates model portfolio successfully', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockModelPortfolio,
        });

        const result = await apiClient.createModelPortfolio(mockPortfolioCreate);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/model-portfolios/', mockPortfolioCreate);
        expect(result).toEqual(mockModelPortfolio);
      });
    });

    describe('updateModelPortfolio', () => {
      const mockPortfolioUpdate = {
        name: 'Updated Portfolio',
      };

      it('updates model portfolio successfully', async () => {
        const updatedPortfolio = { ...mockModelPortfolio, name: 'Updated Portfolio' };
        mockAxiosClient.put.mockResolvedValue({
          data: updatedPortfolio,
        });

        const result = await apiClient.updateModelPortfolio(1, mockPortfolioUpdate);

        expect(mockAxiosClient.put).toHaveBeenCalledWith('/model-portfolios/1', mockPortfolioUpdate);
        expect(result).toEqual(updatedPortfolio);
      });
    });

    describe('deleteModelPortfolio', () => {
      it('deletes model portfolio successfully', async () => {
        mockAxiosClient.delete.mockResolvedValue({
          data: mockModelPortfolio,
        });

        const result = await apiClient.deleteModelPortfolio(1);

        expect(mockAxiosClient.delete).toHaveBeenCalledWith('/model-portfolios/1');
        expect(result).toEqual(mockModelPortfolio);
      });
    });

    describe('getModelPortfolio', () => {
      it('fetches specific model portfolio successfully', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockModelPortfolio,
        });

        const result = await apiClient.getModelPortfolio(1);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/model-portfolios/1');
        expect(result).toEqual(mockModelPortfolio);
      });
    });
  });

  describe('Asset Search Methods', () => {
    const mockAssets = [
      {
        id: 1,
        ticker_symbol: 'AAPL',
        name: 'Apple Inc.',
        asset_type: 'STOCK',
        sector: 'Technology',
      },
    ];

    describe('searchAssets', () => {
      it('searches assets with default limit', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockAssets,
        });

        const result = await apiClient.searchAssets('AAPL');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/assets/search?query=AAPL&limit=10');
        expect(result).toEqual(mockAssets);
      });

      it('searches assets with custom limit', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockAssets,
        });

        const result = await apiClient.searchAssets('AAPL', 5);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/assets/search?query=AAPL&limit=5');
        expect(result).toEqual(mockAssets);
      });

      it('encodes query parameters correctly', async () => {
        mockAxiosClient.get.mockResolvedValue({
          data: mockAssets,
        });

        await apiClient.searchAssets('Apple Inc.', 5);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/assets/search?query=Apple%20Inc.&limit=5');
      });
    });
  });

  describe('Model Portfolio Position Methods', () => {
    const mockPosition = {
      id: 1,
      weight: 25.5,
      asset_id: 1,
      model_portfolio_id: 1,
    };

    describe('addModelPortfolioPosition', () => {
      const mockPositionCreate = {
        asset_id: 1,
        weight: 25.5,
      };

      it('adds position to model portfolio successfully', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockPosition,
        });

        const result = await apiClient.addModelPortfolioPosition(1, mockPositionCreate);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/model-portfolios/1/positions', mockPositionCreate);
        expect(result).toEqual(mockPosition);
      });
    });

    describe('updateModelPortfolioPosition', () => {
      const mockPositionUpdate = {
        weight: 30.0,
      };

      it('updates model portfolio position successfully', async () => {
        const updatedPosition = { ...mockPosition, weight: 30.0 };
        mockAxiosClient.put.mockResolvedValue({
          data: updatedPosition,
        });

        const result = await apiClient.updateModelPortfolioPosition(1, 1, mockPositionUpdate);

        expect(mockAxiosClient.put).toHaveBeenCalledWith('/model-portfolios/1/positions/1', mockPositionUpdate);
        expect(result).toEqual(updatedPosition);
      });
    });

    describe('deleteModelPortfolioPosition', () => {
      it('deletes model portfolio position successfully', async () => {
        mockAxiosClient.delete.mockResolvedValue({
          data: mockPosition,
        });

        const result = await apiClient.deleteModelPortfolioPosition(1, 1);

        expect(mockAxiosClient.delete).toHaveBeenCalledWith('/model-portfolios/1/positions/1');
        expect(result).toEqual(mockPosition);
      });
    });
  });

  describe('Portfolio Backtesting Methods', () => {
    const mockBacktestRequest = {
      composition: [
        { ticker: 'AAPL', weight: 50 },
        { ticker: 'GOOGL', weight: 50 },
      ],
      benchmarks: ['SPY'],
      period: '1Y',
    };

    const mockBacktestResponse = {
      start_date: '2023-01-01',
      end_date: '2024-01-01',
      portfolio_composition: mockBacktestRequest.composition,
      benchmarks: mockBacktestRequest.benchmarks,
      data_points: [
        {
          date: '2023-01-01',
          portfolio_value: 10000,
          benchmark_values: { SPY: 10000 },
          dividend_events: [],
        },
      ],
      performance_metrics: {
        total_return: 0.15,
        volatility: 0.12,
        sharpe_ratio: 1.25,
      },
    };

    describe('backtestPortfolio', () => {
      it('performs portfolio backtest successfully', async () => {
        mockAxiosClient.post.mockResolvedValue({
          data: mockBacktestResponse,
        });

        const result = await apiClient.backtestPortfolio(mockBacktestRequest);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/portfolios/backtest', mockBacktestRequest);
        expect(result).toEqual(mockBacktestResponse);
      });

      it('handles backtest errors', async () => {
        mockAxiosClient.post.mockRejectedValue(new Error('Backtest failed'));

        await expect(apiClient.backtestPortfolio(mockBacktestRequest)).rejects.toThrow('Backtest failed');
      });
    });
  });

  describe('Private Request Method', () => {
    it('handles non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
      } as any);

      const result = await apiClient.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
        role: UserRole.JUNIOR_ADVISOR,
      });

      expect(result).toEqual({});
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
        role: UserRole.JUNIOR_ADVISOR,
      })).rejects.toThrow('Network error occurred');
    });

    it('handles non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error');

      await expect(apiClient.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
        role: UserRole.JUNIOR_ADVISOR,
      })).rejects.toThrow('Network error occurred');
    });

    it('handles HTTP errors without JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      } as any);

      await expect(apiClient.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
        role: UserRole.JUNIOR_ADVISOR,
      })).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('Error Handling', () => {
    it('handles interceptor errors gracefully', async () => {
      mockApiClientInterceptor.getClient.mockImplementation(() => {
        throw new Error('Interceptor error');
      });

      await expect(apiClient.getClients()).rejects.toThrow('Interceptor error');
    });

    it('handles malformed API responses', async () => {
      mockAxiosClient.get.mockResolvedValue({
        data: null,
      });

      const result = await apiClient.getClients();
      expect(result).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('performs complete client workflow', async () => {
      // Mock all required API calls
      mockAxiosClient.get.mockResolvedValueOnce({
        data: [mockClient],
      });
      mockAxiosClient.post.mockResolvedValueOnce({
        data: mockClient,
      });
      mockAxiosClient.put.mockResolvedValueOnce({
        data: { ...mockClient, first_name: 'Updated Client' },
      });
      mockAxiosClient.delete.mockResolvedValueOnce({
        data: mockClient,
      });

      // Execute workflow
      const clients = await apiClient.getClients();
      const newClient = await apiClient.createClient(mockClientCreate);
      const updatedClient = await apiClient.updateClient(1, mockClientUpdate);
      const deletedClient = await apiClient.deleteClient(1);

      // Verify results
      expect(clients).toEqual([mockClient]);
      expect(newClient).toEqual(mockClient);
      expect(updatedClient.first_name).toBe('Updated Client');
      expect(deletedClient).toEqual(mockClient);
    });

    it('handles mixed success and error responses', async () => {
      mockAxiosClient.get.mockResolvedValueOnce({
        data: [mockClient],
      });
      mockAxiosClient.post.mockRejectedValueOnce(new Error('Creation failed'));

      const clients = await apiClient.getClients();
      expect(clients).toEqual([mockClient]);

      await expect(apiClient.createClient(mockClientCreate)).rejects.toThrow('Creation failed');
    });

    it('maintains consistent API interface', () => {
      // Verify that all expected methods exist
      expect(typeof apiClient.login).toBe('function');
      expect(typeof apiClient.register).toBe('function');
      expect(typeof apiClient.getClients).toBe('function');
      expect(typeof apiClient.createClient).toBe('function');
      expect(typeof apiClient.updateClient).toBe('function');
      expect(typeof apiClient.deleteClient).toBe('function');
      expect(typeof apiClient.getDashboardSummary).toBe('function');
      expect(typeof apiClient.getAumHistory).toBe('function');
      expect(typeof apiClient.generateReport).toBe('function');
      expect(typeof apiClient.getNotifications).toBe('function');
      expect(typeof apiClient.createNotification).toBe('function');
      expect(typeof apiClient.getModelPortfolios).toBe('function');
      expect(typeof apiClient.searchAssets).toBe('function');
      expect(typeof apiClient.backtestPortfolio).toBe('function');
    });

    it('uses correct base URL configuration', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });
  });
});