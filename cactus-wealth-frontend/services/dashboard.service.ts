/**
 * 🚀 CLEAN ARCHITECTURE: Dashboard Service
 *
 * Centralized service for all dashboard-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { DashboardSummaryResponse, DashboardMetrics } from '@/types';
import { apiClient } from '@/lib/api';

// 🚀 INSIGHT ANALYTICS: Type for AUM history data points
export interface AUMDataPoint {
  date: string;
  value: number;
}

// Union type for dashboard data
export type DashboardData = DashboardSummaryResponse | DashboardMetrics;

export class DashboardService {
  /**
   * Get dashboard data - handles both summary and metrics based on user role
   */
  static async getDashboardData(): Promise<DashboardData> {
    try {
      // The backend endpoint returns different data based on user role
      const response = await apiClient.getDashboardSummary();
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary data with KPIs (legacy method for backward compatibility)
   */
  static async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const data = await this.getDashboardData();
    
    // If it's DashboardMetrics, convert to DashboardSummaryResponse format
    if ('advisors' in data) {
      const metrics = data as DashboardMetrics;
      return {
        total_clients: metrics.n_clients,
        assets_under_management: metrics.aum_total,
        monthly_growth_percentage: null, // Not available in metrics
        reports_generated_this_quarter: 0, // Not available in metrics
      };
    }
    
    return data as DashboardSummaryResponse;
  }

  /**
   * Get dashboard metrics for Manager/Advisor roles
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const data = await this.getDashboardData();
    
    // If it's DashboardSummaryResponse, convert to DashboardMetrics format
    if ('total_clients' in data && !('advisors' in data)) {
      const summary = data as DashboardSummaryResponse;
      return {
        n_clients: summary.total_clients,
        n_prospects: 0, // Not available in summary
        aum_total: summary.assets_under_management,
        advisors: [], // Not available in summary
      };
    }
    
    return data as DashboardMetrics;
  }

  /**
   * Check if the data is DashboardMetrics (for Manager/Advisor roles)
   */
  static isDashboardMetrics(data: DashboardData): data is DashboardMetrics {
    return 'advisors' in data;
  }

  /**
   * Check if the data is DashboardSummaryResponse (for other roles)
   */
  static isDashboardSummary(data: DashboardData): data is DashboardSummaryResponse {
    return 'total_clients' in data && !('advisors' in data);
  }

  /**
   * 🚀 INSIGHT ANALYTICS: Get AUM (Assets Under Management) historical data
   *
   * @param days Number of days to look back (1-365, default: 30)
   * @returns Array of data points for time series visualization
   */
  static async getAumHistory(days: number = 30): Promise<AUMDataPoint[]> {
    return apiClient.getAumHistory(days);
  }

  /**
   * 🚀 INSIGHT ANALYTICS: Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
