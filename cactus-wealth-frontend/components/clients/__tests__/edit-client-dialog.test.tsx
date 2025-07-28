import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditClientDialog } from '../edit-client-dialog';
import { ClientService, PortfolioService } from '@/services';
import { RiskProfile, ClientStatus, LeadSource } from '@/types';

// Mock services
jest.mock('@/services', () => ({
  ClientService: {
    updateClient: jest.fn(),
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

describe('EditClientDialog', () => {
  const mockOnClientUpdated = jest.fn();
  const user = userEvent.setup();

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

  const mockModelPortfolios = [
    {
      id: 1,
      name: 'Conservative Portfolio',
      risk_profile: RiskProfile.LOW,
      description: 'Low risk portfolio',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      positions: [],
    },
    {
      id: 2,
      name: 'Moderate Portfolio',
      risk_profile: RiskProfile.MEDIUM,
      description: 'Medium risk portfolio',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      positions: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolioService.getModelPortfolios.mockResolvedValue(mockModelPortfolios);
    mockClientService.updateClient.mockResolvedValue(mockClient);
  });

  describe('Dialog Rendering', () => {
    it('renders trigger button by default', () => {
      render(<EditClientDialog client={mockClient} />);
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    });

    it('renders custom trigger when provided', () => {
      const customTrigger = <button>Custom Edit</button>;
      render(<EditClientDialog client={mockClient} trigger={customTrigger} />);
      expect(screen.getByRole('button', { name: /custom edit/i })).toBeInTheDocument();
    });

    it('opens dialog when trigger is clicked', async () => {
      render(<EditClientDialog client={mockClient} />);
      
      await user.click(screen.getByRole('button', { name: /editar/i }));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/editar cliente/i)).toBeInTheDocument();
    });
  });

  describe('Form Pre-population', () => {
    beforeEach(async () => {
      render(<EditClientDialog client={mockClient} onClientUpdated={mockOnClientUpdated} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
    });

    it('pre-populates form with client data', async () => {
      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      });
    });

    it('loads model portfolios on dialog open', async () => {
      await waitFor(() => {
        expect(mockPortfolioService.getModelPortfolios).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      render(<EditClientDialog client={mockClient} onClientUpdated={mockOnClientUpdated} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
    });

    it('shows validation errors for required fields', async () => {
      const nameInput = screen.getByDisplayValue('John');
      const lastNameInput = screen.getByDisplayValue('Doe');
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      
      await user.clear(nameInput);
      await user.clear(lastNameInput);
      await user.click(submitButton);
      
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const emailInput = screen.getByDisplayValue('john.doe@example.com');
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      expect(screen.getByText('El formato del email no es válido')).toBeInTheDocument();
    });

    it('clears validation errors when user starts typing', async () => {
      const nameInput = screen.getByDisplayValue('John');
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      
      // Clear field to trigger validation error
      await user.clear(nameInput);
      await user.click(submitButton);
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      
      // Start typing to clear error
      await user.type(nameInput, 'Jane');
      expect(screen.queryByText('El nombre es obligatorio')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      render(<EditClientDialog client={mockClient} onClientUpdated={mockOnClientUpdated} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
    });

    it('submits form with updated data', async () => {
      const nameInput = screen.getByDisplayValue('John');
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockClientService.updateClient).toHaveBeenCalledWith(1, {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          risk_profile: RiskProfile.MEDIUM,
          status: ClientStatus.PROSPECT,
          lead_source: LeadSource.ORGANIC,
          notes: 'Test notes',
          portfolio_name: '',
        });
      });
    });

    it('shows loading state during submission', async () => {
      mockClientService.updateClient.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockClient), 100))
      );
      
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/actualizando.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('handles submission errors', async () => {
      const errorMessage = 'Email already exists';
      mockClientService.updateClient.mockRejectedValue(new Error(errorMessage));
      
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('calls onClientUpdated after successful update', async () => {
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnClientUpdated).toHaveBeenCalled();
      });
    });

    it('closes dialog after successful update', async () => {
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Risk Profile and Portfolio Selection', () => {
    beforeEach(async () => {
      render(<EditClientDialog client={mockClient} onClientUpdated={mockOnClientUpdated} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
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

  describe('Status Updates', () => {
    beforeEach(async () => {
      render(<EditClientDialog client={mockClient} onClientUpdated={mockOnClientUpdated} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
    });

    it('allows changing client status', async () => {
      const statusSelect = screen.getByDisplayValue('Prospecto');
      await user.click(statusSelect);
      await user.click(screen.getByText('Contactado'));
      
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockClientService.updateClient).toHaveBeenCalledWith(1, expect.objectContaining({
          status: ClientStatus.CONTACTED,
        }));
      });
    });
  });

  describe('Form Reset', () => {
    it('resets form when dialog is closed and reopened', async () => {
      render(<EditClientDialog client={mockClient} />);
      
      // Open dialog and modify form
      await user.click(screen.getByRole('button', { name: /editar/i }));
      const nameInput = screen.getByDisplayValue('John');
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified');
      
      // Close dialog
      await user.keyboard('{Escape}');
      
      // Reopen dialog
      await user.click(screen.getByRole('button', { name: /editar/i }));
      
      // Check form is reset to original values
      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and roles', async () => {
      render(<EditClientDialog client={mockClient} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      render(<EditClientDialog client={mockClient} />);
      await user.click(screen.getByRole('button', { name: /editar/i }));
      
      const nameInput = screen.getByDisplayValue('John');
      const submitButton = screen.getByRole('button', { name: /actualizar cliente/i });
      
      await user.clear(nameInput);
      await user.click(submitButton);
      
      expect(nameInput).toHaveAttribute('class', expect.stringContaining('border-red-500'));
    });
  });
});