'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';


export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleGoogleSignIn = () => {
    setError(null);
    setIsLoading(true);
    
    // Redirigir directamente a Google OAuth
    const clientId = '1019817697031-9r8asaktdl106l4nt0a15v9k5l1vi6ek.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:3000/auth/google/callback';
    const scope = 'openid email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cactus-50 to-sage-100 p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-4xl font-bold text-cactus-700'>🌵</h1>
          <h2 className='text-3xl font-bold text-cactus-700'>Cactus Wealth</h2>
          <p className='mt-2 text-sage-600'>Financial Advisory Dashboard</p>
        </div>

        <Card className='brand-shadow'>
          <CardHeader>
            <CardTitle className='text-center text-2xl text-cactus-700'>
              Iniciar Sesión
            </CardTitle>
            <CardDescription className='text-center'>
              Inicia sesión con tu cuenta de Google
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <div className='rounded-md bg-red-50 p-3 text-center text-sm text-red-600'>
                {error}
              </div>
            )}

            {/* Authentication Options */}
            <div className="space-y-3">
              {/* Google Sign-In Button */}
              <Button
                onClick={handleGoogleSignIn}
                variant='outline'
                className='w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                disabled={isLoading}
              >
                <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
                  <path
                    fill='#4285F4'
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  />
                  <path
                    fill='#34A853'
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  />
                  <path
                    fill='#EA4335'
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  />
                </svg>
                {isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
              </Button>
            </div>

            <div className='mt-6 text-center'>
              <p className='text-xs text-sage-500'>
                Solo se permite el acceso con cuentas autorizadas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
