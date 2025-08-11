/**
 * 🚀 CLEAN ARCHITECTURE: Dashboard Metrics Hook
 *
 * Custom hook for managing dashboard metrics data with caching.
 */

import { useState, useEffect } from 'react';
import { DashboardMetrics } from '@/types';
import { DashboardService } from '@/services/dashboard.service';
import { useBackendUser } from '@/hooks/useBackendUser';

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useBackendUser();

  const fetchMetrics = async () => {
    if (!role || (role !== 'MANAGER' && role !== 'ADVISOR')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await DashboardService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [role]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};