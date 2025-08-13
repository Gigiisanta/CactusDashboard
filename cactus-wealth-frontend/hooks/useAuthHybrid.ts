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
  // No usar document.cookie para httpOnly; el layout se encarga del estado de cookie
  const hasAccessCookie = false;
  return {
    user: session?.user ?? null,
    session,
    status,
    isAuthenticated: status === 'authenticated' || hasAccessCookie,
    isLoading: status === 'loading',
  };
}