import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

function setAuthCookie(token: string) {
  try {
    // Non-HTTPOnly cookie (frontend-controlled). For production, swap to API route that sets httpOnly.
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `access_token=${token}; Path=/; Expires=${expires}; SameSite=Lax`;
  } catch (_) {
    // ignore
  }
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UseTraditionalAuthReturn {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useTraditionalAuth(): UseTraditionalAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Send as application/x-www-form-urlencoded for OAuth2PasswordRequestForm compatibility
      const params = new URLSearchParams();
      params.set('username', credentials.username);
      params.set('password', credentials.password);
      params.set('grant_type', 'password');

      const response = await fetch('/api/v1/login/access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error de autenticación');
      }

      const data: LoginResponse = await response.json();

      // Persist HTTPOnly cookie via server API
      await fetch('/api/auth/session/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: data.access_token, expires_in: 60 * 60 * 24 }),
      });

      // Optionally keep a non-sensitive hint in localStorage for client UX
      try { localStorage.setItem('has_session', '1'); } catch (_) {}

      // Notify layout to recheck session, then redirect to dashboard
      try { window.dispatchEvent(new CustomEvent('auth:login')); } catch (_) {}
      // Small delay to ensure the browser commits the cookie before redirecting
      await new Promise((r) => setTimeout(r, 30));
      // Redirect to dashboard (replace to avoid back button returning to login)
      router.replace('/dashboard');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}