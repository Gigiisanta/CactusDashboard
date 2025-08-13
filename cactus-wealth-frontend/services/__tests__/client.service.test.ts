import { ClientService } from '../client.service';
import { apiClient } from '@/lib/api';
import {
  Client,
  ClientCreate,
  ClientUpdate,
  InvestmentAccount,
  InsurancePolicy,
  RiskProfile,
  ClientStatus,
} from '@/types';

// Mock the apiClient
jest.mock('@/lib/api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock data
  const mockClient: Client = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.ACTIVE_INVESTOR,
    owner_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    investment_accounts: [],
    insurance_policies: [],
  };

  const mockClientCreate: ClientCreate = {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1987654321',
    risk_profile: RiskProfile.LOW,
  };

  const mockClientUpdate: ClientUpdate = {
    first_name: 'John Updated',
    phone: '+1111111111',
  };

  const mockInvestmentAccount: InvestmentAccount = {
    id: 1,
    client_id: 1,
    platform: 'Interactive Brokers',
    account_number: 'IB123456',
    aum: 100000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockInsurancePolicy: InsurancePolicy = {
    id: 1,
    client_id: 1,
    policy_number: 'POL123456',
    insurance_type: 'Vida',
    premium_amount: 1200,
    coverage_amount: 500000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('Client CRUD Operations', () => {
    describe('getClients', () => {
      it('should fetch all clients successfully', async () => {
        const mockClients = [mockClient];
        mockApiClient.getClients.mockResolvedValue(mockClients);

        const result = await ClientService.getClients();

        expect(mockApiClient.getClients).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockClients);
      });

      it('should handle empty client list', async () => {
        mockApiClient.getClients.mockResolvedValue([]);

        const result = await ClientService.getClients();

        expect(result).toEqual([]);
      });

      it('should handle API errors', async () => {
        const error = new Error('Failed to fetch clients');
        mockApiClient.getClients.mockRejectedValueOnce(error);

        await expect(ClientService.getClients()).rejects.toThrow('Failed to fetch clients');
      });
    });

    describe('getClient', () => {
      it('should fetch a specific client successfully', async () => {
        mockApiClient.getClient.mockResolvedValue(mockClient);

        const result = await ClientService.getClient(1);

        expect(mockApiClient.getClient).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockClient);
      });

      it('should handle client not found', async () => {
        const error = new Error('Client not found');
        mockApiClient.getClient.mockRejectedValueOnce(error);

        await expect(ClientService.getClient(999)).rejects.toThrow('Client not found');
      });
    });

    describe('createClient', () => {
      it('should create a new client successfully', async () => {
        mockApiClient.createClient.mockResolvedValue(mockClient);

        const result = await ClientService.createClient(mockClientCreate);

        expect(mockApiClient.createClient).toHaveBeenCalledWith(mockClientCreate);
        expect(result).toEqual(mockClient);
      });

      it('should handle validation errors', async () => {
        const error = new Error('Invalid client data');
        mockApiClient.createClient.mockRejectedValue(error);

        await expect(ClientService.createClient(mockClientCreate)).rejects.toThrow('Invalid client data');
      });
    });

    describe('updateClient', () => {
      it('should update a client successfully', async () => {
        const updatedClient = { ...mockClient, ...mockClientUpdate };
        mockApiClient.updateClient.mockResolvedValue(updatedClient);

        const result = await ClientService.updateClient(1, mockClientUpdate);

        expect(mockApiClient.updateClient).toHaveBeenCalledWith(1, mockClientUpdate);
        expect(result).toEqual(updatedClient);
      });

      it('should handle partial updates', async () => {
        const partialUpdate = { first_name: 'Partial Update' };
        const updatedClient = { ...mockClient, first_name: 'Partial Update' };
        mockApiClient.updateClient.mockResolvedValue(updatedClient);

        const result = await ClientService.updateClient(1, partialUpdate);

        expect(mockApiClient.updateClient).toHaveBeenCalledWith(1, partialUpdate);
        expect(result).toEqual(updatedClient);
      });
    });

    describe('deleteClient', () => {
      it('should delete a client successfully', async () => {
        mockApiClient.deleteClient.mockResolvedValue(mockClient);

        const result = await ClientService.deleteClient(1);

        expect(mockApiClient.deleteClient).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockClient);
      });

      it('should handle delete errors', async () => {
        const error = new Error('Cannot delete client with active accounts');
        mockApiClient.deleteClient.mockRejectedValue(error);

        await expect(ClientService.deleteClient(1)).rejects.toThrow('Cannot delete client with active accounts');
      });
    });
  });

  describe('Investment Account Operations', () => {
    describe('createInvestmentAccount', () => {
      it('should create an investment account successfully', async () => {
        const accountData = {
          platform: 'Interactive Brokers',
          account_number: 'IB123456',
          aum: 100000,
        };
        mockApiClient.createInvestmentAccount.mockResolvedValue(mockInvestmentAccount);

        const result = await ClientService.createInvestmentAccount(1, accountData);

        expect(mockApiClient.createInvestmentAccount).toHaveBeenCalledWith(1, accountData);
        expect(result).toEqual(mockInvestmentAccount);
      });

      it('should handle missing optional fields', async () => {
        const accountData = {
          platform: 'TD Ameritrade',
          aum: 50000,
        };
        mockApiClient.createInvestmentAccount.mockResolvedValue(mockInvestmentAccount);

        const result = await ClientService.createInvestmentAccount(1, accountData);

        expect(mockApiClient.createInvestmentAccount).toHaveBeenCalledWith(1, accountData);
        expect(result).toEqual(mockInvestmentAccount);
      });
    });

    describe('updateInvestmentAccount', () => {
      it('should update an investment account successfully', async () => {
        const updateData = { aum: 150000 };
        const updatedAccount = { ...mockInvestmentAccount, aum: 150000 };
        mockApiClient.updateInvestmentAccount.mockResolvedValue(updatedAccount);

        const result = await ClientService.updateInvestmentAccount(1, updateData);

        expect(mockApiClient.updateInvestmentAccount).toHaveBeenCalledWith(1, updateData);
        expect(result).toEqual(updatedAccount);
      });
    });

    describe('deleteInvestmentAccount', () => {
      it('should delete an investment account successfully', async () => {
        mockApiClient.deleteInvestmentAccount.mockResolvedValue(mockInvestmentAccount);

        const result = await ClientService.deleteInvestmentAccount(1);

        expect(mockApiClient.deleteInvestmentAccount).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockInvestmentAccount);
      });
    });
  });

  describe('Insurance Policy Operations', () => {
    describe('createInsurancePolicy', () => {
      it('should create an insurance policy successfully', async () => {
        const policyData = {
          policy_number: 'POL123456',
          insurance_type: 'Vida',
          premium_amount: 1200,
          coverage_amount: 500000,
        };
        mockApiClient.createInsurancePolicy.mockResolvedValue(mockInsurancePolicy);

        const result = await ClientService.createInsurancePolicy(1, policyData);

        expect(mockApiClient.createInsurancePolicy).toHaveBeenCalledWith(1, policyData);
        expect(result).toEqual(mockInsurancePolicy);
      });

      it('should handle different insurance types', async () => {
        const policyData = {
          policy_number: 'AUTO123',
          insurance_type: 'Auto',
          premium_amount: 800,
          coverage_amount: 25000,
        };
        const autoPolicy = { ...mockInsurancePolicy, ...policyData };
        mockApiClient.createInsurancePolicy.mockResolvedValue(autoPolicy);

        const result = await ClientService.createInsurancePolicy(1, policyData);

        expect(result).toEqual(autoPolicy);
      });
    });

    describe('updateInsurancePolicy', () => {
      it('should update an insurance policy successfully', async () => {
        const updateData = { premium_amount: 1500 };
        const updatedPolicy = { ...mockInsurancePolicy, premium_amount: 1500 };
        mockApiClient.updateInsurancePolicy.mockResolvedValue(updatedPolicy);

        const result = await ClientService.updateInsurancePolicy(1, updateData);

        expect(mockApiClient.updateInsurancePolicy).toHaveBeenCalledWith(1, updateData);
        expect(result).toEqual(updatedPolicy);
      });
    });

    describe('deleteInsurancePolicy', () => {
      it('should delete an insurance policy successfully', async () => {
        mockApiClient.deleteInsurancePolicy.mockResolvedValue(mockInsurancePolicy);

        const result = await ClientService.deleteInsurancePolicy(1);

        expect(mockApiClient.deleteInsurancePolicy).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockInsurancePolicy);
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate network errors', async () => {
      const networkError = new Error('Network timeout');
      mockApiClient.getClients.mockRejectedValueOnce(networkError);

      await expect(ClientService.getClients()).rejects.toThrow('Network timeout');
    });

    it('should handle authorization errors', async () => {
      const authError = new Error('Unauthorized');
      mockApiClient.getClient.mockRejectedValueOnce(authError);

      await expect(ClientService.getClient(1)).rejects.toThrow('Unauthorized');
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error');
      mockApiClient.createClient.mockRejectedValue(serverError);

      await expect(ClientService.createClient(mockClientCreate)).rejects.toThrow('Internal server error');
    });
  });

  describe('Static Methods', () => {
    it('should be callable as static methods', () => {
      expect(typeof ClientService.getClients).toBe('function');
      expect(typeof ClientService.getClient).toBe('function');
      expect(typeof ClientService.createClient).toBe('function');
      expect(typeof ClientService.updateClient).toBe('function');
      expect(typeof ClientService.deleteClient).toBe('function');
      expect(typeof ClientService.createInvestmentAccount).toBe('function');
      expect(typeof ClientService.updateInvestmentAccount).toBe('function');
      expect(typeof ClientService.deleteInvestmentAccount).toBe('function');
      expect(typeof ClientService.createInsurancePolicy).toBe('function');
      expect(typeof ClientService.updateInsurancePolicy).toBe('function');
      expect(typeof ClientService.deleteInsurancePolicy).toBe('function');
    });

    it('should not require instantiation', () => {
      // Should be able to call without creating an instance
      expect(() => ClientService.getClients()).not.toThrow();
      expect(() => ClientService.getClient(1)).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete client lifecycle', async () => {
      // Create client
      mockApiClient.createClient.mockResolvedValue(mockClient);
      const createdClient = await ClientService.createClient(mockClientCreate);
      expect(createdClient).toEqual(mockClient);

      // Update client
      const updatedClient = { ...mockClient, ...mockClientUpdate };
      mockApiClient.updateClient.mockResolvedValue(updatedClient);
      const updated = await ClientService.updateClient(1, mockClientUpdate);
      expect(updated).toEqual(updatedClient);

      // Add investment account
      mockApiClient.createInvestmentAccount.mockResolvedValue(mockInvestmentAccount);
      const account = await ClientService.createInvestmentAccount(1, {
        platform: 'Interactive Brokers',
        aum: 100000,
      });
      expect(account).toEqual(mockInvestmentAccount);

      // Add insurance policy
      mockApiClient.createInsurancePolicy.mockResolvedValue(mockInsurancePolicy);
      const policy = await ClientService.createInsurancePolicy(1, {
        policy_number: 'POL123456',
        insurance_type: 'Vida',
        premium_amount: 1200,
        coverage_amount: 500000,
      });
      expect(policy).toEqual(mockInsurancePolicy);

      // Delete client
      mockApiClient.deleteClient.mockResolvedValue(mockClient);
      const deleted = await ClientService.deleteClient(1);
      expect(deleted).toEqual(mockClient);
    });

    it('should handle bulk operations', async () => {
      const clients = [mockClient, { ...mockClient, id: 2, name: 'Client 2' }];
      mockApiClient.getClients.mockResolvedValue(clients);

      const result = await ClientService.getClients();
      expect(result).toHaveLength(2);
      expect(result).toEqual(clients);
    });
  });
});