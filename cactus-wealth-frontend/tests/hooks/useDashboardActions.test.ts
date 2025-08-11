import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    getClients: vi.fn(),
    generateReport: vi.fn(),
  },
}));

describe('useDashboardActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens dialog and fetches clients', async () => {
    (apiClient.getClients as any).mockResolvedValueOnce([{ id: 1, first_name: 'A' }]);
    const { result } = renderHook(() => useDashboardActions());

    act(() => {
      result.current.handleDialogOpen();
    });

    await waitFor(() => expect(result.current.clientsLoading).toBe(false));
    expect(result.current.isDialogOpen).toBe(true);
    expect(apiClient.getClients).toHaveBeenCalled();
    expect(result.current.clients.length).toBe(1);
  });

  it('generates report when a client is selected', async () => {
    (apiClient.getClients as any).mockResolvedValueOnce([{ id: 2, first_name: 'B' }]);
    (apiClient.generateReport as any).mockResolvedValueOnce({ success: true, report_id: 'r1', message: 'ok' });
    // Mock fetch for download
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob()) } as any);

    const { result } = renderHook(() => useDashboardActions());
    act(() => {
      result.current.handleDialogOpen();
      result.current.setSelectedClientId('2');
    });

    await waitFor(() => expect(result.current.clientsLoading).toBe(false));

    await act(async () => {
      await result.current.handleGenerateReport();
    });

    expect(apiClient.generateReport).toHaveBeenCalledWith(2, 'PORTFOLIO_SUMMARY');
    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.selectedClientId).toBe('');
  });
});