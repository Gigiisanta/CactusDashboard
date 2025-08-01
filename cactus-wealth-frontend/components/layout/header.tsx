'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { LiveNotifications } from '@/components/realtime/LiveNotifications';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useRef, useState } from 'react';
import { AuthService } from '@/services/auth.service';

export function Header() {
  const { data: session } = useSession();
  const { connect, disconnect, isConnected } = useWebSocket();
  const hasConnected = useRef(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  useEffect(() => {
    const exchangeTokenAndConnect = async () => {
      // Para NextAuth, el token está disponible en session
      const googleAccessToken = (session as any)?.accessToken;
      
      if (googleAccessToken && !isConnected && !hasConnected.current) {
        try {
          hasConnected.current = true;
          
          // Intercambiar token de Google por JWT del backend
          const tokenResponse = await AuthService.verifyGoogleToken(googleAccessToken);
          const backendJWT = tokenResponse.access_token;
          
          setJwtToken(backendJWT);
          
          // Conectar WebSocket con el JWT del backend
          await connect(backendJWT);
        } catch (error) {
          console.error('Error exchanging Google token for JWT:', error);
          hasConnected.current = false;
        }
      }

      if (!googleAccessToken && isConnected) {
        disconnect();
        hasConnected.current = false;
        setJwtToken(null);
      }
    };

    exchangeTokenAndConnect();
  }, [session, isConnected, connect, disconnect]);

  const handleLogout = async () => {
    try {
      disconnect();
      setJwtToken(null);
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className='brand-shadow border-b border-gray-200 bg-white'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <span className='mr-2 text-2xl'>🌵</span>
            <h1 className='text-xl font-bold text-cactus-700'>Cactus Wealth</h1>
          </div>
          <div className='flex items-center space-x-4'>
            <span className='text-sm text-gray-600'>
              Welcome, {session?.user?.email}
            </span>
            <LiveNotifications />
            <Button
              onClick={handleLogout}
              variant='outline'
              size='sm'
              className='gap-2'
            >
              <LogOut className='h-4 w-4' />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
