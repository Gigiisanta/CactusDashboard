'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBackendUser } from '@/hooks/useBackendUser';
const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500"></div>
  </div>
);
const AccessDenied = () => (
  <div className="p-6 text-center text-red-600">Acceso denegado</div>
);
import { Button } from '@/components/ui/button';

interface ManagerRequest {
  id: number;
  advisor_id: number;
  desired_manager_id: number;
  status: string;
  created_at: string;
}

export default function ManagerRequestsPage() {
  const { role, loading: roleLoading } = useBackendUser();
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/users/manager-change/requests');
      if (!res.ok) throw new Error('Failed to load requests');
      setRequests(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (role === 'ADMIN' || role === 'GOD') load(); }, [role]);

  const decide = async (id: number, approve: boolean) => {
    try {
      const res = await fetch('/api/v1/users/manager-change/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, approve }),
      });
      if (!res.ok) throw new Error('Failed to decide');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  if (roleLoading) return <LoadingScreen />;

  if (role !== 'ADMIN' && role !== 'GOD') return <AccessDenied />;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de cambio de manager</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && requests.length === 0 && <p>No hay solicitudes pendientes.</p>}
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">Req #{r.id}</div>
                  <div className="text-sm text-gray-600">Advisor ID: {r.advisor_id} → Manager ID solicitado: {r.desired_manager_id}</div>
                  <div className="text-xs text-gray-500">Estado: {r.status}</div>
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => decide(r.id, false)}>Rechazar</Button>
                    <Button onClick={() => decide(r.id, true)}>Aprobar</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


