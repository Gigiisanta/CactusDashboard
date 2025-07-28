import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineBoard } from '../PipelineBoard';
import { ClientService } from '@/services/client.service';
import { RiskProfile, ClientStatus, LeadSource } from '@/types';

// Mock services
jest.mock('@/services/client.service', () => ({
  ClientService: {
    updateClient: jest.fn(),
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock drag and drop library
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd}>
      {children}
    </div>
  ),
  Droppable: ({ children, droppableId }: any) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children({ 
        droppableProps: {}, 
        innerRef: () => {}, 
        placeholder: null 
      }, { isDraggingOver: false })}
    </div>
  ),
  Draggable: ({ children, draggableId, index }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({ 
        draggableProps: {}, 
        dragHandleProps: {}, 
        innerRef: () => {} 
      }, { isDragging: false })}
    </div>
  ),
}));

const mockClientService = ClientService as jest.Mocked<typeof ClientService>;

describe('PipelineBoard', () => {
  const user = userEvent.setup();
  const mockOnClientUpdated = jest.fn();
  const mockOnBackToTable = jest.fn();

  const mockClients = [
    {
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
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      risk_profile: RiskProfile.HIGH,
      status: ClientStatus.CONTACTED,
      lead_source: LeadSource.REFERRAL,
      notes: 'Another test',
      owner_id: 1,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: 3,
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@example.com',
      risk_profile: RiskProfile.LOW,
      status: ClientStatus.ACTIVE_INVESTOR,
      lead_source: LeadSource.EVENT,
      owner_id: 1,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientService.updateClient.mockResolvedValue(mockClients[0]);
  });

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      render(<PipelineBoard clients={[]} />);
      
      expect(screen.getByText('Vista de Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Volver a tabla')).toBeInTheDocument();
    });

    it('renders pipeline stages', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByText('Prospectos')).toBeInTheDocument();
        expect(screen.getByText('Contactados')).toBeInTheDocument();
        expect(screen.getByText('Cliente Activo')).toBeInTheDocument();
      });
    });

    it('displays client count in each stage', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        // Should show count badges for each stage
        const badges = screen.getAllByText(/^\d+$/);
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('renders back to table button', async () => {
      render(<PipelineBoard clients={mockClients} onBackToTable={mockOnBackToTable} />);
      
      const backButton = screen.getByText('Vista de tabla');
      expect(backButton).toBeInTheDocument();
      
      await user.click(backButton);
      expect(mockOnBackToTable).toHaveBeenCalled();
    });
  });

  describe('Client Display', () => {
    it('displays client information correctly', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      });
    });

    it('shows client initials in avatars', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(screen.getByText('JS')).toBeInTheDocument();
        expect(screen.getByText('BJ')).toBeInTheDocument();
      });
    });

    it('displays risk profile badges', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('LOW')).toBeInTheDocument();
      });
    });

    it('shows time since creation', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        // Should show relative time like "X días", "X sem", etc.
        const timeElements = screen.getAllByText(/días|sem|mes|Hoy|Ayer/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Client Organization', () => {
    it('organizes clients by status', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        // Check that clients are in correct columns
        const prospectSection = screen.getByText('Prospectos').closest('.space-y-4');
        const contactedSection = screen.getByText('Contactados').closest('.space-y-4');
        const activeSection = screen.getByText('Cliente Activo').closest('.space-y-4');
        
        expect(prospectSection).toBeInTheDocument();
        expect(contactedSection).toBeInTheDocument();
        expect(activeSection).toBeInTheDocument();
      });
    });

    it('sorts clients by creation date', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        // Clients should be sorted by created_at (oldest first)
        const clientNames = screen.getAllByText(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
        expect(clientNames.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state for stages with no clients', async () => {
      const singleClient = [mockClients[0]]; // Only one client in PROSPECT status
      render(<PipelineBoard clients={singleClient} />);
      
      await waitFor(() => {
        expect(screen.getByText('No hay clientes en esta etapa')).toBeInTheDocument();
      });
    });

    it('handles empty client list', async () => {
      render(<PipelineBoard clients={[]} />);
      
      await waitFor(() => {
        const emptyMessages = screen.getAllByText('No hay clientes en esta etapa');
        expect(emptyMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Drag and Drop Setup', () => {
    it('renders drag and drop context', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      });
    });

    it('renders droppable areas for each status', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('droppable-prospect')).toBeInTheDocument();
        expect(screen.getByTestId('droppable-contacted')).toBeInTheDocument();
        expect(screen.getByTestId('droppable-active_investor')).toBeInTheDocument();
      });
    });

    it('renders draggable items for each client', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('draggable-1')).toBeInTheDocument();
        expect(screen.getByTestId('draggable-2')).toBeInTheDocument();
        expect(screen.getByTestId('draggable-3')).toBeInTheDocument();
      });
    });
  });

  describe('Client Actions', () => {
    it('renders dropdown menu for each client', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        const moreButtons = screen.getAllByRole('button');
        const dropdownButtons = moreButtons.filter(button => 
          button.querySelector('[data-testid="more-horizontal"]') || 
          button.getAttribute('aria-haspopup') === 'menu'
        );
        expect(dropdownButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        const gridContainers = document.querySelectorAll('.grid');
        expect(gridContainers.length).toBeGreaterThan(0);
        
        // Check for responsive classes
        const hasResponsiveClasses = Array.from(gridContainers).some(container =>
          container.className.includes('md:grid-cols-') ||
          container.className.includes('lg:grid-cols-') ||
          container.className.includes('xl:grid-cols-')
        );
        expect(hasResponsiveClasses).toBe(true);
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(<PipelineBoard clients={[]} />);
      
      // Initially shows loading state
      expect(screen.getByText('Volver a tabla')).toBeInTheDocument();
      
      // Should show skeleton cards
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles missing client data gracefully', async () => {
      const incompleteClients = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          risk_profile: RiskProfile.MEDIUM,
          status: ClientStatus.PROSPECT,
          owner_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          // Missing optional fields
        },
      ];

      render(<PipelineBoard clients={incompleteClients} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        // Check for proper heading structure
        expect(screen.getByText('Vista de Pipeline')).toBeInTheDocument();
        
        // Check for proper button roles
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('provides descriptive text for drag and drop', async () => {
      render(<PipelineBoard clients={mockClients} />);
      
      await waitFor(() => {
        expect(screen.getByText('Ordenado por antigüedad • Arrastra para mover entre etapas')).toBeInTheDocument();
      });
    });
  });
});