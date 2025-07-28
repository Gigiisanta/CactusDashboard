import { renderHook, act, waitFor } from '@testing-library/react';
import { useClientDetailPage } from '../useClientDetailPage';
import { apiClient } from '@/lib/api';
import { useClient } from '@/context/ClientContext';
import { Client, RiskProfile, ClientStatus, LeadSource } from '@/types';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/context/ClientContext');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseClient = useClient as jest.MockedFunction<typeof useClient>;

const mockClient: Client = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  risk_profile: RiskProfile.MEDIUM,
  status: ClientStatus.ACTIVE_INVESTOR,
  lead_source: LeadSource.REFERRAL,
  owner_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  investment_accounts: [],
  insurance_policies: [],
  notes: 'Test notes',
};

const mockSetActiveClient = jest.fn();

describe('useClientDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    mockUseClient.mockReturnValue({
      setActiveClient: mockSetActiveClient,
      activeClient: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useClientDetailPage('1'));

      expect(result.current.client).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isEditing).toBe(false);
      expect(result.current.isSaving).toBe(false);
    });

    it('should not fetch client when clientId is empty', () => {
      renderHook(() => useClientDetailPage(''));
      
      expect(mockApiClient.getClient).not.toHaveBeenCalled();
    });
  });

  describe('Client Fetching', () => {
    it('should fetch client successfully', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);

      const { result } = renderHook(() => useClientDetailPage('1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClient.getClient).toHaveBeenCalledWith(1);
      expect(result.current.client).toEqual(mockClient);
      expect(mockSetActiveClient).toHaveBeenCalledWith(mockClient);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Client not found');
      mockApiClient.getClient.mockRejectedValue(error);

      const { result } = renderHook(() => useClientDetailPage('1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.client).toBeNull();
      expect(result.current.error).toBe('Cliente no encontrado');
      expect(mockSetActiveClient).toHaveBeenCalledWith(null);
    });

    it('should prevent multiple simultaneous requests', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);

      const { result } = renderHook(() => useClientDetailPage('1'));

      // Call refreshClient multiple times quickly
      act(() => {
        result.current.refreshClient();
        result.current.refreshClient();
        result.current.refreshClient();
      });

      // Fast-forward timers
      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only call API once due to debouncing
      expect(mockApiClient.getClient).toHaveBeenCalledTimes(2); // Initial + one refresh
    });
  });

  describe('refreshClient', () => {
    it('should refresh client successfully', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);
      const { result } = renderHook(() => useClientDetailPage('1'));

      await act(async () => {
        result.current.refreshClient();
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(mockApiClient.getClient).toHaveBeenCalledWith(1);
      expect(result.current.client).toEqual(mockClient);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle refresh error', async () => {
      const error = new Error('Failed to fetch client');
      mockApiClient.getClient.mockRejectedValue(error);
      const { result } = renderHook(() => useClientDetailPage('1'));

      await act(async () => {
        result.current.refreshClient();
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.client).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Cliente no encontrado');
    });

    it('should debounce multiple calls', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);
      const { result } = renderHook(() => useClientDetailPage('1'));

      await act(async () => {
        result.current.refreshClient();
        result.current.refreshClient();
        result.current.refreshClient();
        
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should only be called once due to debouncing
      expect(mockApiClient.getClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh client data', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);

      const { result } = renderHook(() => useClientDetailPage('1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous calls
      mockApiClient.getClient.mockClear();

      act(() => {
        result.current.refreshClient();
      });

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(mockApiClient.getClient).toHaveBeenCalledWith(1);
      });
    });

    it('should debounce refresh calls', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);

      const { result } = renderHook(() => useClientDetailPage('1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockApiClient.getClient.mockClear();

      // Call refresh multiple times
      act(() => {
        result.current.refreshClient();
        result.current.refreshClient();
        result.current.refreshClient();
      });

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(mockApiClient.getClient).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edit State Management', () => {
    it('should handle edit start', () => {
      const { result } = renderHook(() => useClientDetailPage('1'));

      act(() => {
        result.current.handleEditStart();
      });

      expect(result.current.isEditing).toBe(true);
    });

    it('should handle edit cancel', () => {
      const { result } = renderHook(() => useClientDetailPage('1'));

      // Start editing first
      act(() => {
        result.current.setIsEditing(true);
      });

      expect(result.current.isEditing).toBe(true);

      // Mock window.dispatchEvent
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      act(() => {
        result.current.handleEditCancel();
      });

      expect(result.current.isEditing).toBe(false);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'client:cancel',
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should allow setting editing state directly', () => {
      const { result } = renderHook(() => useClientDetailPage('1'));

      act(() => {
        result.current.setIsEditing(true);
      });

      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.setIsEditing(false);
      });

      expect(result.current.isEditing).toBe(false);
    });

    it('should allow setting saving state', () => {
      const { result } = renderHook(() => useClientDetailPage('1'));

      act(() => {
        result.current.setIsSaving(true);
      });

      expect(result.current.isSaving).toBe(true);

      act(() => {
        result.current.setIsSaving(false);
      });

      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('Client State Management', () => {
    it('should allow setting client directly', () => {
      const { result } = renderHook(() => useClientDetailPage('1'));

      act(() => {
        result.current.setActiveClient(mockClient);
      });

      expect(result.current.client).toEqual(mockClient);

      act(() => {
        result.current.setClient(null);
      });

      expect(result.current.client).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clear active client on unmount', () => {
      const { unmount } = renderHook(() => useClientDetailPage('1'));

      unmount();

      expect(mockSetActiveClient).toHaveBeenCalledWith(null);
    });

    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { result, unmount } = renderHook(() => useClientDetailPage('1'));

      act(() => {
        result.current.refreshClient();
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('ClientId Changes', () => {
    it('should refetch when clientId changes', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);

      const { result, rerender } = renderHook(
        ({ clientId }) => useClientDetailPage(clientId),
        { initialProps: { clientId: '1' } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClient.getClient).toHaveBeenCalledWith(1);

      // Change clientId
      rerender({ clientId: '2' });

      await waitFor(() => {
        expect(mockApiClient.getClient).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should prevent requests within 1 second', async () => {
      mockApiClient.getClient.mockResolvedValue(mockClient);

      const { result } = renderHook(() => useClientDetailPage('1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous calls
      mockApiClient.getClient.mockClear();

      // Try to refresh immediately (should be rate limited)
      act(() => {
        result.current.refreshClient();
      });

      act(() => {
        jest.runAllTimers();
      });

      // Should not make new request due to rate limiting
      expect(mockApiClient.getClient).not.toHaveBeenCalled();
    });
  });
});