'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ClientProvider } from '@/context/ClientContext';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { HealthMonitor } from '@/components/HealthMonitor';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500'></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ClientProvider>
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='flex'>
          <Sidebar />
          <main className='flex-1 p-6'>{children}</main>
        </div>
        <HealthMonitor />
      </div>
    </ClientProvider>
  );
}
