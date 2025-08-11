'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardMetrics } from '@/types';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useBackendUser } from '@/hooks/useBackendUser';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  UserCheck, 
  Building2,
  Activity,
  Target
} from 'lucide-react';

interface DashboardMetricsCardProps {
  className?: string;
}

export function DashboardMetricsCard({ className }: DashboardMetricsCardProps) {
  const { role } = useBackendUser();
  const { metrics, loading, error } = useDashboardMetrics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!role || (role !== 'MANAGER' && role !== 'ADVISOR')) {
    return null;
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                </CardTitle>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>Error al cargar las métricas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const isManager = role === 'MANAGER';

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'Clientes del Equipo' : 'Mis Clientes'}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.n_clients}</div>
            <p className="text-xs text-muted-foreground">
              {isManager ? 'Clientes activos del equipo' : 'Clientes activos'}
            </p>
          </CardContent>
        </Card>

        {/* Prospectos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'Prospectos del Equipo' : 'Mis Prospectos'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.n_prospects}</div>
            <p className="text-xs text-muted-foreground">
              {isManager ? 'Prospectos del equipo' : 'Clientes potenciales'}
            </p>
          </CardContent>
        </Card>

        {/* AUM Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'AUM del Equipo' : 'Mi AUM'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.aum_total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isManager ? 'Activos bajo gestión del equipo' : 'Activos bajo gestión'}
            </p>
          </CardContent>
        </Card>

        {/* Asesores (solo para managers) */}
        {isManager && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asesores</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.advisors?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Asesores en el equipo
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Información adicional para managers */}
      {isManager && metrics.advisors && metrics.advisors.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Rendimiento del Equipo
            </CardTitle>
            <CardDescription>
              Resumen del rendimiento de tus asesores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.advisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{advisor.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {advisor.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{advisor.n_clients}</div>
                      <div className="text-muted-foreground">Clientes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{advisor.n_prospects}</div>
                      <div className="text-muted-foreground">Prospectos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {formatCurrency(advisor.aum_total)}
                      </div>
                      <div className="text-muted-foreground">AUM</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de rol */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Rol actual:
              </span>
              <Badge variant={isManager ? 'default' : 'secondary'}>
                {isManager ? 'Manager' : 'Asesor'}
              </Badge>
            </div>
            {isManager && (
              <div className="text-sm text-muted-foreground">
                Supervisando {metrics.advisors?.length || 0} asesor(es)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}