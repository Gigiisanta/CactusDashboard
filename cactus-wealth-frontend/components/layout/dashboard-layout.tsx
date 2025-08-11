'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ClientProvider } from '@/context/ClientContext';
import { Sidebar } from './sidebar';
import { Header } from './header';
// HealthMonitor removed during pruning

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasAccessCookie = typeof document !== 'undefined' && document.cookie.includes('access_token=');

  useEffect(() => {
    if (status === 'unauthenticated' && !hasAccessCookie) {
      router.replace('/auth/login');
    }
  }, [status, hasAccessCookie, router]);

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500'></div>
      </div>
    );
  }

  if (!session && !hasAccessCookie) return null;

  return (
    <ClientProvider>
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='flex'>
          <Sidebar />
          <main className='flex-1 p-6'>{children}</main>
        </div>
        {/* Health monitor removed */}
      </div>
    </ClientProvider>
  );
}
