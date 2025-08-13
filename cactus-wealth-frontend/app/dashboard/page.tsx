'use client';

import { Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardMetricsCard } from '@/components/dashboard/DashboardMetricsCard';
import { AdvisorManagement } from '@/components/dashboard/AdvisorManagement';
import { useAuthHybrid } from '@/hooks/useAuthHybrid';
import { useBackendUser } from '@/hooks/useBackendUser';

// Lazy load heavy components
const DashboardKPIs = lazy(() => import('./components/DashboardKPIs'));
const DashboardRecentActivity = lazy(
  () => import('./components/DashboardRecentActivity')
);
const DashboardActions = lazy(() => import('./components/DashboardActions'));

// Loading skeletons
const DashboardKPIsSkeleton = () => (
  <div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3'>
    {[...Array(3)].map((_, i) => (
      <Card key={i} className='card-hover'>
        <CardContent className='p-6'>
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const DashboardRecentActivitySkeleton = () => (
  <Card className='card-hover'>
    <CardContent className='p-6'>
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-48' />
        {[...Array(3)].map((_, i) => (
          <div key={i} className='flex items-center space-x-3'>
            <Skeleton className='h-2 w-2 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const DashboardActionsSkeleton = () => (
  <Card className='card-hover'>
    <CardContent className='p-6'>
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-48' />
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthHybrid();
  const { role, error: roleError } = useBackendUser();
  const isManagerOrAdvisor = role === 'MANAGER' || role === 'ADVISOR';

  // If not authenticated and no cookie, do not block rendering here; layout already shows the banner.

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-slate-900'>Dashboard</h1>
        <p className='text-slate-600'>
          {isManagerOrAdvisor 
            ? `Resumen de ${role === 'MANAGER' ? 'tu equipo' : 'tu cartera'} y métricas clave`
            : 'Resumen de tu cartera de clientes y métricas clave'
          }
        </p>
      </div>

      {/* Métricas específicas para Manager/Advisor */}
      {isManagerOrAdvisor ? (
        <DashboardMetricsCard />
      ) : (
        /* KPIs tradicionales con lazy loading */
        <Suspense fallback={<DashboardKPIsSkeleton />}>
          <DashboardKPIs />
        </Suspense>
      )}

      {/* Gestión de asesores para managers */}
      {role === 'MANAGER' && (
        <AdvisorManagement />
      )}

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Recent Activity con lazy loading */}
        <Suspense fallback={<DashboardRecentActivitySkeleton />}>
          <DashboardRecentActivity />
        </Suspense>

        {/* Dashboard Actions con lazy loading */}
        <Suspense fallback={<DashboardActionsSkeleton />}>
          <DashboardActions />
        </Suspense>
      </div>
    </div>
  );
}
