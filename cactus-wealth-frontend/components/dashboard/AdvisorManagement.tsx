'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserWithStats } from '@/types';
import { UserService } from '@/services/user.service';
import { useBackendUser } from '@/hooks/useBackendUser';
import { Users, UserPlus, UserMinus, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AdvisorManagementProps {
  className?: string;
}

export function AdvisorManagement({ className }: AdvisorManagementProps) {
  const [advisors, setAdvisors] = useState<UserWithStats[]>([]);
  const [unassignedAdvisors, setUnassignedAdvisors] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const { role } = useBackendUser();

  const fetchData = useCallback(async () => {
    if (role !== 'MANAGER') return;

    try {
      setLoading(true);
      const [advisorsData, unassignedData] = await Promise.all([
        UserService.getAdvisorsWithStats(),
        UserService.getUnassignedAdvisors(),
      ]);
      setAdvisors(advisorsData);
      setUnassignedAdvisors(unassignedData);
    } catch (error) {
      toast.error('Error al cargar los datos de asesores');
      console.error('Error fetching advisor data:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLinkAdvisor = async () => {
    if (!selectedAdvisor) return;

    try {
      await UserService.linkAdvisor(selectedAdvisor);
      toast.success('Asesor asignado exitosamente');
      setIsLinkDialogOpen(false);
      setSelectedAdvisor(null);
      await fetchData();
    } catch (error) {
      toast.error('Error al asignar el asesor');
      console.error('Error linking advisor:', error);
    }
  };

  const handleUnlinkAdvisor = async (advisorId: number) => {
    try {
      await UserService.unlinkAdvisor(advisorId);
      toast.success('Asesor desasignado exitosamente');
      await fetchData();
    } catch (error) {
      toast.error('Error al desasignar el asesor');
      console.error('Error unlinking advisor:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (role !== 'MANAGER') {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Asesores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Asesores
              </CardTitle>
              <CardDescription>
                Administra tu equipo de asesores y supervisa su rendimiento
              </CardDescription>
            </div>
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Asignar Asesor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Nuevo Asesor</DialogTitle>
                  <DialogDescription>
                    Selecciona un asesor para asignar a tu equipo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select
                    value={selectedAdvisor?.toString() || ''}
                    onValueChange={(value) => setSelectedAdvisor(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asesor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedAdvisors.map((advisor) => (
                        <SelectItem key={advisor.id} value={advisor.id.toString()}>
                          {advisor.username} ({advisor.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsLinkDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleLinkAdvisor}
                      disabled={!selectedAdvisor}
                    >
                      Asignar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {advisors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay asesores asignados</h3>
              <p className="text-muted-foreground mb-4">
                Comienza asignando asesores a tu equipo para supervisar su rendimiento
              </p>
              <Button onClick={() => setIsLinkDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Asignar Primer Asesor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-center">Prospectos</TableHead>
                  <TableHead className="text-right">AUM Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisors.map((advisor) => (
                  <TableRow key={advisor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{advisor.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {advisor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={advisor.is_active ? 'default' : 'secondary'}>
                        {advisor.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {advisor.n_clients}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        {advisor.n_prospects}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(advisor.aum_total)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkAdvisor(advisor.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}