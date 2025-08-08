'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTraditionalAuth } from '@/hooks/useTraditionalAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const { 
    login: traditionalLogin, 
    isLoading: isTraditionalLoading, 
    error: traditionalError,
    clearError: clearTraditionalError 
  } = useTraditionalAuth();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Clear errors when switching between auth methods
  useEffect(() => {
    if (traditionalError) {
      setError(traditionalError);
    }
  }, [traditionalError]);

  const handleGoogleSignIn = async () => {
    setError(null);
    clearTraditionalError();
    setIsLoading(true);
    
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!credentials.username.trim()) {
      setError('Por favor, ingresa tu email o nombre de usuario');
      return;
    }
    
    if (!credentials.password.trim()) {
      setError('Por favor, ingresa tu contraseña');
      return;
    }

    if (credentials.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const success = await traditionalLogin(credentials);
    if (success && rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    }
  };

  const handleInputChange = (field: 'username' | 'password') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (traditionalError) clearTraditionalError();
  };

  const isAnyLoading = isLoading || isTraditionalLoading;

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cactus-50 to-sage-100 p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-4xl font-bold text-cactus-700'>🌵</h1>
          <h2 className='text-3xl font-bold text-cactus-700'>Cactus Wealth</h2>
          <p className='mt-2 text-sage-600'>Inicia sesión en tu cuenta</p>
        </div>

        <Card className='brand-shadow'>
          <CardHeader>
            <CardTitle className='text-center text-2xl text-cactus-700'>
              Autenticación
            </CardTitle>
            <CardDescription className='text-center'>
              Accede con tu cuenta de Google autorizada
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <div className='rounded-md bg-red-50 border border-red-200 p-4 text-center'>
                <p className='text-sm text-red-600 font-medium'>
                  Error de autenticación
                </p>
                <p className='text-xs text-red-500 mt-1'>
                  {error}
                </p>
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                variant='outline'
                className='w-full h-12 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
                disabled={isAnyLoading}
              >
                <svg className='mr-3 h-5 w-5' viewBox='0 0 24 24'>
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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Continuar con Google'
                )}
              </Button>

              <div className='text-center'>
                <p className='text-xs text-sage-500'>
                  O CONTINÚA CON
                </p>
              </div>

              {/* Traditional login form */}
              <form onSubmit={handleTraditionalLogin} className='space-y-4 pt-2'>
                <div>
                  <label htmlFor="username" className='block text-sm text-sage-600 mb-2'>
                    Email o Usuario
                  </label>
                  <input
                    id="username"
                    type='text'
                    placeholder='tu@email.com o usuario'
                    value={credentials.username}
                    onChange={handleInputChange('username')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cactus-500 focus:border-transparent transition-all duration-200'
                    disabled={isAnyLoading}
                    autoComplete="username"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className='block text-sm text-sage-600 mb-2'>
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Tu contraseña'
                      value={credentials.password}
                      onChange={handleInputChange('password')}
                      className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cactus-500 focus:border-transparent transition-all duration-200'
                      disabled={isAnyLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sage-400 hover:text-sage-600"
                      disabled={isAnyLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-cactus-600 focus:ring-cactus-500 border-gray-300 rounded"
                      disabled={isAnyLoading}
                    />
                    <span className="ml-2 text-sm text-sage-600">Recordarme</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant='default'
                  className='w-full bg-cactus-600 hover:bg-cactus-700 text-white transition-all duration-200'
                  disabled={isAnyLoading || !credentials.username.trim() || !credentials.password.trim()}
                >
                  {isTraditionalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>

                <div className='text-center space-y-1'>
                  <p className='text-xs text-sage-400'>
                    ¿No tienes una cuenta? <span className='text-cactus-600 cursor-pointer hover:underline'>Regístrate aquí</span>
                  </p>
                  <p className='text-xs text-sage-400'>
                    ¿Olvidaste tu contraseña? <span className='text-cactus-600 cursor-pointer hover:underline'>Recupérala</span>
                  </p>
                </div>
              </form>
            </div>

            <div className='mt-6 pt-4 border-t border-gray-200'>
              <p className='text-xs text-center text-sage-500'>
                Acceso seguro con múltiples métodos de autenticación
              </p>
              <p className='text-xs text-center text-sage-400 mt-1'>
                Google OAuth • Credenciales tradicionales • Autenticación mejorada
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}