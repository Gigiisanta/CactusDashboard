'use client';

import { useEffect, useState } from 'react';

export type BackendUserRole = 'GOD' | 'ADMIN' | 'MANAGER' | 'ADVISOR' | 'SENIOR_ADVISOR' | 'JUNIOR_ADVISOR' | null;

interface UseBackendUserReturn {
  role: BackendUserRole;
  loading: boolean;
  error: string | null;
}

export function useBackendUser(): UseBackendUserReturn {
  const [role, setRole] = useState<BackendUserRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/v1/users/me', { headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRole((data.role as BackendUserRole) ?? null);
      } catch (e) {
        if (!cancelled) {
          setRole(null);
          setError(e instanceof Error ? e.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { role, loading, error };
}


