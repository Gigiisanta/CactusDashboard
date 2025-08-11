'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Users,
  BarChart3,
  Home,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart,
  Loader2,
  UserCog,
} from 'lucide-react';
import DashboardRecentActivity from '@/app/dashboard/components/DashboardRecentActivity';
import { useClient } from '@/context/ClientContext';
import { apiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { useBackendUser } from '@/hooks/useBackendUser';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
  },
  {
    href: '/portfolios',
    label: 'Carteras',
    icon: PieChart,
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: UserCog,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const pathname = usePathname();
  const { activeClient } = useClient();
  const { role: backendRole } = useBackendUser();
  // Simple role-based admin visibility could be added by consulting auth store if needed.

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleGenerateReport = async () => {
    if (!activeClient) return;

    try {
      setIsGeneratingReport(true);
      const result = await apiClient.generateReport(activeClient.id);

      if (result.success) {
        alert('Reporte generado exitosamente');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <nav
      className={cn(
        'relative flex min-h-screen flex-col bg-white shadow-sm transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        variant='ghost'
        size='sm'
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-white shadow-md hover:shadow-lg',
          'flex items-center justify-center p-0'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className='h-3 w-3' />
        ) : (
          <ChevronLeft className='h-3 w-3' />
        )}
      </Button>

      {/* Navigation Content - Main Section */}
      <div className='flex-1 p-4'>
        <div className='space-y-2'>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full transition-all duration-200',
                    isCollapsed ? 'justify-center px-2' : 'justify-start',
                    isActive &&
                      'bg-cactus-50 text-cactus-700 hover:bg-cactus-100'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                  {!isCollapsed && (
                    <span className='truncate'>{item.label}</span>
                  )}
                </Button>
              </Link>
            );
          })}

          {/* Admin section (Admin/GOD) */}
          {(backendRole === 'ADMIN' || backendRole === 'GOD') && (
            <Link href='/admin/manager-requests'>
              <Button
                variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full transition-all duration-200',
                  isCollapsed ? 'justify-center px-2' : 'justify-start'
                )}
                title={isCollapsed ? 'Admin' : undefined}
              >
                <UserCog className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                {!isCollapsed && <span className='truncate'>Admin</span>}
              </Button>
            </Link>
          )}

          {/* Client Actions Section */}
          {activeClient && (
            <div className='border-t border-gray-100 pb-2 pt-2'>
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                variant='ghost'
                className={cn(
                  'w-full transition-all duration-200',
                  isCollapsed ? 'justify-center px-2' : 'justify-start'
                )}
                title={isCollapsed ? 'Generar Reporte' : undefined}
              >
                {isGeneratingReport ? (
                  <Loader2
                    className={cn(
                      'h-4 w-4 animate-spin',
                      !isCollapsed && 'mr-2'
                    )}
                  />
                ) : (
                  <FileText className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                )}
                {!isCollapsed && (
                  <span className='truncate'>
                    {isGeneratingReport ? 'Generando...' : 'Generar Reporte'}
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* External Links Section */}
          <div className='border-t border-gray-100 pt-2'>
            {/* Finviz Link */}
            <a
              href='https://finviz.com/'
              target='_blank'
              rel='noopener noreferrer'
              className='mb-2 block'
            >
              <Button
                variant='ghost'
                className={cn(
                  'w-full transition-all duration-200',
                  isCollapsed ? 'justify-center px-2' : 'justify-start'
                )}
                title={isCollapsed ? 'Finviz Market Analysis' : undefined}
              >
                <TrendingUp className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                {!isCollapsed && <span className='truncate'>Finviz</span>}
              </Button>
            </a>

            {/* Balanz Link */}
            <a
              href='https://productores.balanz.com/'
              target='_blank'
              rel='noopener noreferrer'
              className='mb-2 block'
            >
              <Button
                variant='ghost'
                className={cn(
                  'w-full transition-all duration-200',
                  isCollapsed ? 'justify-center px-2' : 'justify-start'
                )}
                title={isCollapsed ? 'Operar en Balanz' : undefined}
              >
                <ExternalLink
                  className={cn('h-4 w-4', !isCollapsed && 'mr-2')}
                />
                {!isCollapsed && (
                  <span className='truncate'>Operar en Balanz</span>
                )}
              </Button>
            </a>

            {/* Zurich Point Link */}
            <a
              href='https://agentes.zurich.com.ar'
              target='_blank'
              rel='noopener noreferrer'
              className='block'
            >
              <Button
                variant='ghost'
                className={cn(
                  'w-full transition-all duration-200',
                  isCollapsed ? 'justify-center px-2' : 'justify-start'
                )}
                title={isCollapsed ? 'Zurich Point' : undefined}
              >
                <ExternalLink
                  className={cn('h-4 w-4', !isCollapsed && 'mr-2')}
                />
                {!isCollapsed && (
                  <span className='truncate'>Zurich Point</span>
                )}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Admin link (visible by route checks elsewhere) - keep UX simple */}
      {/* Optionally render admin section if user has role ADMIN/GOD via page guard */}

      {/* Recent Activity - Bottom Section */}
      {!isCollapsed && (
        <div className='mt-auto border-t border-gray-100 p-4'>
          <div className='origin-top scale-90'>
            <DashboardRecentActivity />
          </div>
        </div>
      )}
    </nav>
  );
}
