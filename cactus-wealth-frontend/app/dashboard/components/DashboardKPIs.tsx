'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Target,
} from 'lucide-react';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardKPIsSkeleton } from './DashboardKPIs.Skeleton';
import { DashboardSummaryResponse, DashboardMetrics } from '@/types';

interface DashboardData {
  total_clients: number;
  assets_under_management: number;
  monthly_growth_percentage: number | null;
  reports_generated_this_quarter: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(percentage: number | null | undefined) {
  if (percentage === null || percentage === undefined) return 'N/A';
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

export default React.memo(function DashboardKPIs() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new getDashboardData method that handles both response types
      const rawData = await DashboardService.getDashboardData();
      
      // Convert to the expected DashboardData format
      let dashboardData: DashboardData;
      
      if (DashboardService.isDashboardMetrics(rawData)) {
        // Handle DashboardMetrics (Manager/Advisor roles)
        dashboardData = {
          total_clients: rawData.n_clients,
          assets_under_management: rawData.aum_total,
          monthly_growth_percentage: null, // Not available in DashboardMetrics
          reports_generated_this_quarter: 0, // Not available in DashboardMetrics
        };
      } else {
        // Handle DashboardSummaryResponse (other roles)
        dashboardData = {
          total_clients: rawData.total_clients,
          assets_under_management: rawData.assets_under_management,
          monthly_growth_percentage: rawData.monthly_growth_percentage,
          reports_generated_this_quarter: rawData.reports_generated_this_quarter,
        };
      }
      
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoize KPIs calculation to avoid unnecessary recalculations
  const kpis = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        title: 'AUM Total',
        value: `$${(dashboardData?.assets_under_management ?? 0).toLocaleString()}`,
        icon: DollarSign,
        color: 'bg-green-600',
        description: 'Assets under management',
      },
      {
        title: 'Total Clients',
        value: (dashboardData?.total_clients ?? 0).toString(),
        icon: Users,
        color: 'bg-blue-500',
        description: 'Active clients under management',
      },
      {
        title: 'Monthly Growth',
        value: formatPercentage(dashboardData?.monthly_growth_percentage),
        icon:
          (dashboardData?.monthly_growth_percentage ?? 0) >= 0
            ? TrendingUp
            : TrendingDown,
        color:
          (dashboardData?.monthly_growth_percentage ?? 0) >= 0
            ? 'bg-green-500'
            : 'bg-red-500',
        description: 'Portfolio performance this month',
      },
      {
        title: 'Reports Generated',
        value: (dashboardData?.reports_generated_this_quarter ?? 0).toString(),
        icon: FileText,
        color: 'bg-purple-500',
        description: 'This quarter',
      },
    ];
  }, [dashboardData]);

  if (loading) {
    return <DashboardKPIsSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className='mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
        {error || 'Failed to load KPI data'}
      </div>
    );
  }

  // Additional safety: gracefully fallback to zero values if any field is missing
  const normalized = {
    total_clients: dashboardData.total_clients ?? 0,
    assets_under_management: dashboardData.assets_under_management ?? 0,
    monthly_growth_percentage: dashboardData.monthly_growth_percentage ?? null,
    reports_generated_this_quarter: dashboardData.reports_generated_this_quarter ?? 0,
  };

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
      {kpis.map((kpi) => (
        <Card key={kpi.title} className='card-hover'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              {kpi.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${kpi.color}`}>
              <kpi.icon className='h-4 w-4 text-white' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-cactus-700'>
              {kpi.value}
            </div>
            <CardDescription className='text-xs text-gray-500'>
              {kpi.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
