import { vi } from 'vitest';
import { NotificationService } from '@/services/notification.service';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    getNotifications: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockApiClient = apiClient as any;

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should call apiClient.getNotifications with default limit', async () => {
      const mockNotifications = [
        {
          id: 1,
          type: 'CLIENT_CREATED',
          title: 'New Client Added',
          message: 'John Doe has been added as a new client',
          is_read: false,
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          type: 'PORTFOLIO_UPDATED',
          title: 'Portfolio Updated',
          message: 'Portfolio Conservative has been updated',
          is_read: true,
          created_at: '2023-01-02T00:00:00Z',
        },
      ];
      mockApiClient.getNotifications.mockResolvedValue(mockNotifications);

      const result = await NotificationService.getNotifications();

      expect(mockApiClient.getNotifications).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockNotifications);
    });

    it('should call apiClient.getNotifications with custom limit', async () => {
      const mockNotifications = [
        {
          id: 1,
          type: 'CLIENT_CREATED',
          title: 'New Client Added',
          message: 'John Doe has been added as a new client',
          is_read: false,
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      mockApiClient.getNotifications.mockResolvedValue(mockNotifications);

      const result = await NotificationService.getNotifications(5);

      expect(mockApiClient.getNotifications).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockNotifications);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockApiClient.getNotifications.mockRejectedValue(error);

      await expect(NotificationService.getNotifications()).rejects.toThrow(
        'API Error'
      );
    });

    it('should handle empty notifications', async () => {
      const mockNotifications: Array<any> = [];
      mockApiClient.getNotifications.mockResolvedValue(mockNotifications);

      const result = await NotificationService.getNotifications();

      expect(mockApiClient.getNotifications).toHaveBeenCalledWith(10);
      expect(result).toEqual([]);
    });
  });
});
