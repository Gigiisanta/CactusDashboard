import { DashboardService, AUMDataPoint } from '../dashboard.service';
import { apiClient } from '@/lib/api';
import { DashboardSummaryResponse } from '@/types';

// Mock the apiClient
jest.mock('@/lib/api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    const mockSummaryResponse: DashboardSummaryResponse = {
      total_clients: 150,
      assets_under_management: 25000000,
      monthly_growth_percentage: 5.2,
      reports_generated_this_quarter: 8,
    };

    it('should fetch dashboard summary successfully', async () => {
      mockApiClient.getDashboardSummary.mockResolvedValue(mockSummaryResponse);

      const result = await DashboardService.getDashboardSummary();

      expect(mockApiClient.getDashboardSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSummaryResponse);
    });
  });

  describe('getAumHistory', () => {
    const mockAumData: AUMDataPoint[] = [
      { date: '2024-01-01', value: 24000000 },
      { date: '2024-01-02', value: 24100000 },
      { date: '2024-01-03', value: 24200000 },
      { date: '2024-01-04', value: 24150000 },
      { date: '2024-01-05', value: 25000000 },
    ];

    it('should fetch AUM history with default days (30)', async () => {
      mockApiClient.getAumHistory.mockResolvedValue(mockAumData);

      const result = await DashboardService.getAumHistory();

      expect(mockApiClient.getAumHistory).toHaveBeenCalledWith(30);
      expect(result).toEqual(mockAumData);
    });

    it('should fetch AUM history with custom days', async () => {
      mockApiClient.getAumHistory.mockResolvedValue(mockAumData);

      const result = await DashboardService.getAumHistory(90);

      expect(mockApiClient.getAumHistory).toHaveBeenCalledWith(90);
      expect(result).toEqual(mockAumData);
    });

    it('should handle empty AUM data', async () => {
      mockApiClient.getAumHistory.mockResolvedValue([]);

      const result = await DashboardService.getAumHistory(7);

      expect(mockApiClient.getAumHistory).toHaveBeenCalledWith(7);
      expect(result).toEqual([]);
    });

    it('should handle invalid days parameter gracefully', async () => {
      mockApiClient.getAumHistory.mockResolvedValue(mockAumData);

      // Test with edge cases
      await DashboardService.getAumHistory(0);
      expect(mockApiClient.getAumHistory).toHaveBeenCalledWith(0);

      await DashboardService.getAumHistory(365);
      expect(mockApiClient.getAumHistory).toHaveBeenCalledWith(365);

      await DashboardService.getAumHistory(-1);
      expect(mockApiClient.getAumHistory).toHaveBeenCalledWith(-1);
    });

    it('should validate AUM data structure', async () => {
      const validData: AUMDataPoint[] = [
        { date: '2024-01-01', value: 1000000 },
        { date: '2024-01-02', value: 1100000 },
      ];

      mockApiClient.getAumHistory.mockResolvedValue(validData);

      const result = await DashboardService.getAumHistory(2);

      expect(result).toEqual(validData);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
      expect(typeof result[0].date).toBe('string');
      expect(typeof result[0].value).toBe('number');
    });
  });

  describe('Static Methods', () => {
    it('should be callable as static methods', () => {
      expect(typeof DashboardService.getDashboardSummary).toBe('function');
      expect(typeof DashboardService.getAumHistory).toBe('function');
    });

    it('should not require instantiation', () => {
      // Should be able to call without creating an instance
      expect(() => DashboardService.getDashboardSummary()).not.toThrow();
      expect(() => DashboardService.getAumHistory()).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work with real-world data patterns', async () => {
      const realisticSummary: DashboardSummaryResponse = {
        total_clients: 1247,
        assets_under_management: 156789000,
        monthly_growth_percentage: 3.7,
        reports_generated_this_quarter: 23,
      };

      const realisticAumData: AUMDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 150000000 + Math.random() * 10000000,
      }));

      mockApiClient.getDashboardSummary.mockResolvedValue(realisticSummary);
      mockApiClient.getAumHistory.mockResolvedValue(realisticAumData);

      const [summary, aumHistory] = await Promise.all([
        DashboardService.getDashboardSummary(),
        DashboardService.getAumHistory(30),
      ]);

      expect(summary).toEqual(realisticSummary);
      expect(aumHistory).toEqual(realisticAumData);
      expect(aumHistory).toHaveLength(30);
    });
  });
});