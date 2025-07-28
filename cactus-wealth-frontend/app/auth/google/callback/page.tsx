'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { googleAuthService } from '@/services/google-auth.service';

function GoogleCallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogleCode } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setError(`Error de Google OAuth: ${error}`);
          setIsLoading(false);
          return;
        }

        if (!code) {
          setError('No se recibió el código de autorización de Google');
          setIsLoading(false);
          return;
        }

        console.log('🔐 Procesando código de autorización de Google...');
        
        // Usar el AuthContext para manejar el login
        // Esto asegura que el estado se sincronize correctamente
        await loginWithGoogleCode(code);
        
        console.log('✅ Autenticación exitosa, redirigiendo al dashboard...');
        // La redirección se maneja automáticamente en el AuthContext
      } catch (error) {
        console.error('❌ Error procesando callback:', error);
        setError('Error al procesar la autenticación. Por favor, inténtalo de nuevo.');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, loginWithGoogleCode]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cactus-50 to-sage-100'>
        <div className='text-center'>
          <div className='mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500 mx-auto'></div>
          <h2 className='text-2xl font-bold text-cactus-700 mb-2'>Procesando Autenticación</h2>
          <p className='text-sage-600'>Completando el inicio de sesión con Google...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cactus-50 to-sage-100'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mb-4 text-6xl'>❌</div>
          <h2 className='text-2xl font-bold text-red-700 mb-2'>Error de Autenticación</h2>
          <p className='text-sage-600 mb-6'>{error}</p>
          <button
            onClick={() => router.push('/login')}
            className='px-6 py-2 bg-cactus-600 text-white rounded-lg hover:bg-cactus-700 transition-colors'
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cactus-50 to-sage-100'>
        <div className='text-center'>
          <div className='mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500 mx-auto'></div>
          <h2 className='text-2xl font-bold text-cactus-700 mb-2'>Cargando...</h2>
          <p className='text-sage-600'>Inicializando autenticación...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}