import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddClientDialog } from '../add-client-dialog';
import { ClientService, PortfolioService } from '@/services';
import { RiskProfile, ClientStatus, LeadSource } from '@/types';

// Mock services
jest.mock('@/services', () => ({
  ClientService: {
    createClient: jest.fn(),
  },
  PortfolioService: {
    getModelPortfolios: jest.fn(),
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockClientService = ClientService as jest.Mocked<typeof ClientService>;
const mockPortfolioService = PortfolioService as jest.Mocked<typeof PortfolioService>;

describe('AddClientDialog', () => {
  const mockOnClientAdded = jest.fn();
  const user = userEvent.setup();

  const mockModelPortfolios = [
    {
      id: 1,
      name: 'Conservative Portfolio',
      risk_profile: RiskProfile.LOW,
      description: 'Low risk portfolio',
    },
    {
      id: 2,
      name: 'Moderate Portfolio',
      risk_profile: RiskProfile.MEDIUM,
      description: 'Medium risk portfolio',
    },
  ];

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
    mockPortfolioService.getModelPortfolios.mockResolvedValue(mockModelPortfolios);
    mockClientService.createClient.mockResolvedValue(mockClient);
  });

  describe('Dialog Rendering', () => {
    it('renders trigger button by default', () => {
      render(<AddClientDialog />);
      expect(screen.getByRole('button', { name: /añadir cliente/i })).toBeInTheDocument();
    });

    it('renders custom trigger when provided', () => {
      const customTrigger = <button>Custom Trigger</button>;
      render(<AddClientDialog trigger={customTrigger} />);
      expect(screen.getByRole('button', { name: /custom trigger/i })).toBeInTheDocument();
    });

    it('opens dialog when trigger is clicked', async () => {
      render(<AddClientDialog />);
      
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Añadir Nuevo Cliente')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      render(<AddClientDialog onClientAdded={mockOnClientAdded} />);
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
    });

    it('shows validation errors for required fields', async () => {
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      
      await user.click(submitButton);
      
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      expect(screen.getByText('El formato del email no es válido')).toBeInTheDocument();
    });

    it('clears validation errors when user starts typing', async () => {
      const nameInput = screen.getByLabelText(/nombre/i);
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      
      // Trigger validation error
      await user.click(submitButton);
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      
      // Start typing to clear error
      await user.type(nameInput, 'John');
      expect(screen.queryByText('El nombre es obligatorio')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      render(<AddClientDialog onClientAdded={mockOnClientAdded} />);
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
    });

    it('submits form with valid data', async () => {
      // Fill required fields
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockClientService.createClient).toHaveBeenCalledWith({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '',
          risk_profile: RiskProfile.MEDIUM,
          status: ClientStatus.PROSPECT,
          lead_source: LeadSource.ORGANIC,
          notes: '',
          portfolio_name: undefined,
        });
      });
    });

    it('shows loading state during submission', async () => {
      mockClientService.createClient.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockClient), 100))
      );
      
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/creando.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('handles submission errors', async () => {
      const errorMessage = 'Email already exists';
      mockClientService.createClient.mockRejectedValue(new Error(errorMessage));
      
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Risk Profile and Portfolio Selection', () => {
    beforeEach(async () => {
      render(<AddClientDialog onClientAdded={mockOnClientAdded} />);
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
    });

    it('loads model portfolios on dialog open', async () => {
      await waitFor(() => {
        expect(mockPortfolioService.getModelPortfolios).toHaveBeenCalled();
      });
    });

    it('filters portfolios by risk profile', async () => {
      // Wait for portfolios to load
      await waitFor(() => {
        expect(mockPortfolioService.getModelPortfolios).toHaveBeenCalled();
      });

      // Change risk profile to LOW
      const riskProfileSelect = screen.getByDisplayValue('Moderado');
      await user.click(riskProfileSelect);
      await user.click(screen.getByText('Conservador'));

      // Check that portfolio options are filtered
      const portfolioSelect = screen.getByDisplayValue('Seleccionar cartera modelo');
      await user.click(portfolioSelect);
      
      expect(screen.getByText('Conservative Portfolio')).toBeInTheDocument();
      expect(screen.queryByText('Moderate Portfolio')).not.toBeInTheDocument();
    });
  });

  describe('Two-Step Wizard', () => {
    beforeEach(async () => {
      render(<AddClientDialog onClientAdded={mockOnClientAdded} />);
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
    });

    it('progresses to step 2 after successful client creation', async () => {
      // Fill and submit form
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/productos financieros - john doe/i)).toBeInTheDocument();
      });
    });

    it('finishes wizard and calls onClientAdded', async () => {
      // Complete step 1
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      
      await user.click(screen.getByRole('button', { name: /crear cliente/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/productos financieros/i)).toBeInTheDocument();
      });

      // Finish wizard
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      await user.click(finishButton);
      
      expect(mockOnClientAdded).toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('resets form when dialog is closed', async () => {
      render(<AddClientDialog />);
      
      // Open dialog and fill form
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      
      // Close dialog
      await user.keyboard('{Escape}');
      
      // Reopen dialog
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
      
      // Check form is reset
      expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and roles', async () => {
      render(<AddClientDialog />);
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      render(<AddClientDialog />);
      await user.click(screen.getByRole('button', { name: /añadir cliente/i }));
      
      const submitButton = screen.getByRole('button', { name: /crear cliente/i });
      await user.click(submitButton);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      expect(nameInput).toHaveAttribute('class', expect.stringContaining('border-red-500'));
    });
  });
});