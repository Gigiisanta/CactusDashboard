'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { User, UserRole } from '@/types';

/**
 * Hook híbrido que combina NextAuth con el store de Zustand
 * Sincroniza la sesión de NextAuth con el estado local de Zustand
 */
export function useAuthHybrid() {
  const { data: session, status } = useSession();
  const hasAccessCookie = typeof document !== 'undefined' && document.cookie.includes('access_token=');
  return {
    user: session?.user ?? null,
    session,
    status,
    isAuthenticated: status === 'authenticated' || hasAccessCookie,
    isLoading: status === 'loading',
  };
}