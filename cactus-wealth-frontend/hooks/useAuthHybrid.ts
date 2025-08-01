'use client';

import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';
import { User, UserRole } from '@/types';

/**
 * Hook híbrido que combina NextAuth con el store de Zustand
 * Sincroniza la sesión de NextAuth con el estado local de Zustand
 */
export function useAuthHybrid() {
  const { data: session, status } = useSession();
  const { user: zustandUser, setUser, logout } = useAuthStore();

  // Sincronizar NextAuth session con Zustand store
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Crear un usuario mock basado en la sesión de NextAuth
      const mockUser: User = {
        id: 1,
        username: session.user.name || 'Usuario',
        email: session.user.email || '',
        is_active: true,
        role: UserRole.JUNIOR_ADVISOR, // Rol por defecto
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clients: [],
      };

      // Solo actualizar si el usuario ha cambiado
      if (!zustandUser || zustandUser.email !== mockUser.email) {
        setUser(mockUser);
      }
    } else if (status === 'unauthenticated') {
      // Limpiar el store si NextAuth dice que no está autenticado
      if (zustandUser) {
        logout();
      }
    }
  }, [session, status, zustandUser, setUser, logout]);

  return {
    user: zustandUser,
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}