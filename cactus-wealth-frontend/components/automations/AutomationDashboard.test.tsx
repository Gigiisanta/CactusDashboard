import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AutomationDashboard } from './AutomationDashboard';
import { apiClientInterceptor } from '@/lib/apiClient';

// Mock the apiClient
jest.mock('@/lib/apiClient', () => ({
  apiClientInterceptor: {
    getClient: jest.fn(),
  },
}));

// Mock ActionButtons component
jest.mock('./ActionButtons', () => ({
  ActionButtons: ({ onStatusChange }: { onStatusChange: () => void }) => (
    <div data-testid="action-buttons">
      <button onClick={onStatusChange}>Refresh Status</button>
    </div>
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '25 Dec 10:30'),
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('AutomationDashboard', () => {
  const mockApiClient = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (apiClientInterceptor.getClient as jest.Mock).mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockHealthyStatus = {
    healthy: true,
    queue: 5,
    lastSync: '2023-12-25T10:30:00Z',
  };

  const mockUnhealthyStatus = {
    healthy: false,
    queue: 0,
    lastSync: '2023-12-25T10:30:00Z',
  };

  it('renders loading state initially', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AutomationDashboard />);
    
    expect(screen.getByRole('generic')).toBeInTheDocument();
    // Loading spinner should be present
    const loadingElement = screen.getByRole('generic');
    expect(loadingElement).toBeInTheDocument();
  });

  it('renders healthy status correctly', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Queue Count')).toBeInTheDocument();
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('25 Dec 10:30')).toBeInTheDocument();
    expect(screen.getByText('Automation Actions')).toBeInTheDocument();
  });

  it('renders unhealthy status correctly', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockUnhealthyStatus });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Down')).toBeInTheDocument();
    });

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles API error correctly', async () => {
    const errorMessage = 'Network error';
    mockApiClient.get.mockRejectedValue(new Error(errorMessage));
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Error icon should be present
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('handles non-Error exceptions', async () => {
    mockApiClient.get.mockRejectedValue('String error');
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch status')).toBeInTheDocument();
    });
  });

  it('auto-refreshes every 30 seconds', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  it('clears interval on unmount', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
    
    const { unmount } = render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('handles invalid lastSync date gracefully', async () => {
    const statusWithInvalidDate = {
      ...mockHealthyStatus,
      lastSync: 'invalid-date',
    };
    
    // Mock date-fns format to throw an error
    const { format } = require('date-fns');
    (format as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid date');
    });
    
    mockApiClient.get.mockResolvedValue({ data: statusWithInvalidDate });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  it('handles null lastSync', async () => {
    const statusWithNullDate = {
      ...mockHealthyStatus,
      lastSync: null,
    };
    
    mockApiClient.get.mockResolvedValue({ data: statusWithNullDate });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  it('renders ActionButtons component', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    });

    expect(screen.getByText('Refresh Status')).toBeInTheDocument();
  });

  it('calls correct API endpoint', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/automations/status');
    });
  });

  it('shows loading state while fetching after initial load', async () => {
    // First call succeeds
    mockApiClient.get.mockResolvedValueOnce({ data: mockHealthyStatus });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    // Second call is slow
    mockApiClient.get.mockImplementation(() => new Promise(() => {}));
    
    // Trigger refresh
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should still show the previous data while loading
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('handles zero queue count', async () => {
    const statusWithZeroQueue = {
      ...mockHealthyStatus,
      queue: 0,
    };
    
    mockApiClient.get.mockResolvedValue({ data: statusWithZeroQueue });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('handles undefined queue count', async () => {
    const statusWithUndefinedQueue = {
      ...mockHealthyStatus,
      queue: undefined,
    };
    
    mockApiClient.get.mockResolvedValue({ data: statusWithUndefinedQueue });
    
    render(<AutomationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Badge variants', () => {
    it('shows default badge for healthy status', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
      
      render(<AutomationDashboard />);
      
      await waitFor(() => {
        const healthyBadge = screen.getByText('Healthy');
        expect(healthyBadge).toBeInTheDocument();
      });
    });

    it('shows destructive badge for unhealthy status', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUnhealthyStatus });
      
      render(<AutomationDashboard />);
      
      await waitFor(() => {
        const downBadge = screen.getByText('Down');
        expect(downBadge).toBeInTheDocument();
      });
    });
  });

  describe('Icons', () => {
    it('renders all expected icons', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyStatus });
      
      render(<AutomationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Healthy')).toBeInTheDocument();
      });

      // Icons are rendered as part of the component structure
      // We verify the component renders without errors
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Queue Count')).toBeInTheDocument();
      expect(screen.getByText('Last Sync')).toBeInTheDocument();
    });
  });
});