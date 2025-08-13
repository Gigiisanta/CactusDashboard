'use client';

import { useEffect, useState } from 'react';
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
  const [cookieStatus, setCookieStatus] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [autoLoginTried, setAutoLoginTried] = useState(false);

  // Check httpOnly cookie via API (document.cookie cannot read httpOnly cookies)
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('/api/auth/session/status', { cache: 'no-store' });
        const { authenticated } = await res.json();
        if (mounted) setCookieStatus(authenticated ? 'yes' : 'no');
      } catch {
        if (mounted) setCookieStatus('no');
      }
    };
    check();

    const onVisibility = () => { if (document.visibilityState === 'visible') check(); };
    const onLogin = () => setCookieStatus('yes');
    const onLogout = () => setCookieStatus('no');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('auth:login', onLogin as EventListener);
    window.addEventListener('auth:logout', onLogout as EventListener);
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('auth:login', onLogin as EventListener);
      window.removeEventListener('auth:logout', onLogout as EventListener);
    };
  }, []);

  // Do not redirect in render path; only optional auto-login below. Keep rendering something meaningful.

  // Dev auto-login (optional): set NEXT_PUBLIC_AUTO_LOGIN=1 to enable
  useEffect(() => {
    const shouldAutoLogin =
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_AUTO_LOGIN === '1' &&
      status !== 'loading' &&
      !session &&
      cookieStatus === 'no' &&
      !autoLoginTried;

    if (!shouldAutoLogin) return;
    setAutoLoginTried(true);

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('username', 'gio');
        params.set('password', 'gigi123');
        const resp = await fetch('/api/v1/login/access-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        if (!resp.ok) {
          router.replace('/auth/login');
          return;
        }
        const data = await resp.json();
        await fetch('/api/auth/session/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: data.access_token, expires_in: 86400 }),
        });
        router.replace('/dashboard');
      } catch (_) {
        router.replace('/auth/login');
      }
    })();
  }, [status, session, cookieStatus, autoLoginTried, router]);

  // Si hay cookie de acceso pero no sesión de NextAuth, seguimos adelante para evitar bloqueo

  // Do not block render on NextAuth loading; let useEffect handle redirects

  const hasCookie = cookieStatus === 'yes';
  const cookieCheckDone = cookieStatus !== 'unknown';
  const unauthenticatedBanner = (!session && cookieCheckDone && !hasCookie) ? (
    <div className='w-full bg-yellow-50 text-yellow-800 px-4 py-2 text-sm text-center'>
      Necesitas iniciar sesión para ver el contenido.{' '}
      <a href='/auth/login' className='underline'>Ir al login</a>
    </div>
  ) : null;

  return (
    <ClientProvider>
      <div className='min-h-screen bg-gray-50'>
        {unauthenticatedBanner}
        {(session || hasCookie) && <Header />}
        <div className='flex'>
          {(session || hasCookie) && <Sidebar />}
          <main className='flex-1 p-6'>{children}</main>
        </div>
      </div>
    </ClientProvider>
  );
}
