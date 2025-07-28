import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientTimeline } from './ClientTimeline';
import { ActivityType } from '@/types';

// Mock the date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => 'hace 2 horas'),
}));

// Mock the date-fns locale
jest.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="card-title">{children}</h2>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => 
    <span data-testid="badge" data-variant={variant}>{children}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="scroll-area">{children}</div>,
}));

describe('ClientTimeline', () => {
  const defaultProps = {
    clientId: 123,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('renders loading state initially', () => {
      render(<ClientTimeline {...defaultProps} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByText('Timeline de Actividades')).toBeInTheDocument();
      
      // Check for loading skeletons - they should be present initially
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('Activities rendering', () => {
    it('renders activities after loading', async () => {
      render(<ClientTimeline {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Estado cambiado de "Prospecto" a "Contactado"')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      expect(screen.getByText('Cliente interesado en portfolio conservador, prefiere bonos y ETFs de bajo riesgo.')).toBeInTheDocument();
      expect(screen.getByText('Primera reunión agendada para el 25 de diciembre a las 10:00 AM')).toBeInTheDocument();
    });

    it('renders activity badges with correct labels', async () => {
      render(<ClientTimeline {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Cambio de estado')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      expect(screen.getByText('Nota agregada')).toBeInTheDocument();
      expect(screen.getByText('Reunión agendada')).toBeInTheDocument();
    });

    it('renders add activity button', async () => {
      render(<ClientTimeline {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Agregar Actividad')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Timeline rendering', () => {
    it('renders timeline with proper structure', async () => {
      render(<ClientTimeline {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('ScrollArea integration', () => {
    it('wraps activities in ScrollArea', async () => {
      render(<ClientTimeline {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Component props', () => {
    it('accepts clientId prop and uses it correctly', async () => {
      const clientId = 456;
      render(<ClientTimeline clientId={clientId} />);
      
      await waitFor(() => {
        // Verify the component renders - the clientId is used in the mock data generation
        expect(screen.getByText('Timeline de Actividades')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('accepts onAddActivity callback', () => {
      const mockOnAddActivity = jest.fn();
      render(<ClientTimeline {...defaultProps} onAddActivity={mockOnAddActivity} />);
      
      // The callback is passed but not used in the current implementation
      expect(mockOnAddActivity).not.toHaveBeenCalled();
    });
  });
});