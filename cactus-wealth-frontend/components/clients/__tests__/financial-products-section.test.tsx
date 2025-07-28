import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProductsSection } from '../financial-products-section';
import { RiskProfile, ClientStatus, LeadSource } from '@/types';

// Mock child components
jest.mock('../add-investment-account-dialog', () => ({
  AddInvestmentAccountDialog: ({ client, onAccountAdded }: any) => (
    <div data-testid="add-investment-account-dialog">
      <button onClick={() => onAccountAdded?.()}>Add Investment Account</button>
      <span>Client: {client.first_name}</span>
    </div>
  ),
}));

jest.mock('../add-insurance-policy-dialog', () => ({
  AddInsurancePolicyDialog: ({ client, onPolicyAdded }: any) => (
    <div data-testid="add-insurance-policy-dialog">
      <button onClick={() => onPolicyAdded?.()}>Add Insurance Policy</button>
      <span>Client: {client.first_name}</span>
    </div>
  ),
}));

describe('FinancialProductsSection', () => {
  const user = userEvent.setup();
  const mockOnProductUpdate = jest.fn();

  const mockClient = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.PROSPECT,
    lead_source: LeadSource.ORGANIC,
    notes: 'Test notes',
    owner_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the section title', () => {
      render(<FinancialProductsSection client={mockClient} />);
      
      expect(screen.getByText('Productos Financieros')).toBeInTheDocument();
    });

    it('renders both dialog components', () => {
      render(<FinancialProductsSection client={mockClient} />);
      
      expect(screen.getByTestId('add-investment-account-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('add-insurance-policy-dialog')).toBeInTheDocument();
    });

    it('passes client data to child components', () => {
      render(<FinancialProductsSection client={mockClient} />);
      
      const investmentDialog = screen.getByTestId('add-investment-account-dialog');
      const insuranceDialog = screen.getByTestId('add-insurance-policy-dialog');
      
      expect(investmentDialog).toHaveTextContent('Client: John');
      expect(insuranceDialog).toHaveTextContent('Client: John');
    });
  });

  describe('Product Update Callbacks', () => {
    it('calls onProductUpdate when investment account is added', async () => {
      render(
        <FinancialProductsSection 
          client={mockClient} 
          onProductUpdate={mockOnProductUpdate} 
        />
      );
      
      const addButton = screen.getByText('Add Investment Account');
      await user.click(addButton);
      
      expect(mockOnProductUpdate).toHaveBeenCalled();
    });

    it('calls onProductUpdate when insurance policy is added', async () => {
      render(
        <FinancialProductsSection 
          client={mockClient} 
          onProductUpdate={mockOnProductUpdate} 
        />
      );
      
      const addButton = screen.getByText('Add Insurance Policy');
      await user.click(addButton);
      
      expect(mockOnProductUpdate).toHaveBeenCalled();
    });

    it('works without onProductUpdate callback', async () => {
      render(<FinancialProductsSection client={mockClient} />);
      
      const addButton = screen.getByText('Add Investment Account');
      
      // Should not throw error when callback is not provided
      expect(() => user.click(addButton)).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    it('has proper semantic structure', () => {
      render(<FinancialProductsSection client={mockClient} />);
      
      const section = screen.getByText('Productos Financieros').closest('div');
      expect(section).toHaveClass('space-y-4');
    });

    it('displays section title with proper styling', () => {
      render(<FinancialProductsSection client={mockClient} />);
      
      const title = screen.getByText('Productos Financieros');
      expect(title).toHaveClass('text-sm', 'font-semibold', 'uppercase', 'tracking-wide', 'text-muted-foreground');
    });
  });

  describe('Client Data Handling', () => {
    it('handles client with minimal data', () => {
      const minimalClient = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        risk_profile: RiskProfile.LOW,
        status: ClientStatus.ACTIVE_INVESTOR,
        owner_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      render(<FinancialProductsSection client={minimalClient} />);
      
      expect(screen.getByText('Productos Financieros')).toBeInTheDocument();
      expect(screen.getByTestId('add-investment-account-dialog')).toHaveTextContent('Client: Jane');
    });

    it('handles client with complete data', () => {
      const completeClient = {
        ...mockClient,
        investment_accounts: [
          {
            id: 1,
            platform: 'Test Platform',
            account_number: '123456',
            aum: 100000,
            client_id: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        insurance_policies: [
          {
            id: 1,
            policy_number: 'POL123',
            insurance_type: 'Life',
            premium_amount: 1000,
            coverage_amount: 100000,
            client_id: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<FinancialProductsSection client={completeClient} />);
      
      expect(screen.getByText('Productos Financieros')).toBeInTheDocument();
      expect(screen.getByTestId('add-investment-account-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('add-insurance-policy-dialog')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('maintains component state across interactions', async () => {
      render(
        <FinancialProductsSection 
          client={mockClient} 
          onProductUpdate={mockOnProductUpdate} 
        />
      );
      
      // Interact with both components
      await user.click(screen.getByText('Add Investment Account'));
      await user.click(screen.getByText('Add Insurance Policy'));
      
      expect(mockOnProductUpdate).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Productos Financieros')).toBeInTheDocument();
    });
  });
});