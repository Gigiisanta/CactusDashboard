'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Shield, UserCog } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api';

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Manager change request
  const [managers, setManagers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [managerId, setManagerId] = useState('');
  const [isRequestingManagerChange, setIsRequestingManagerChange] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
      setOriginalUsername(user.username);
    }
  }, [user]);

  const hasChanges = username !== originalUsername;

  const handleSave = async () => {
    if (!hasChanges || !user) return;

    try {
      setIsSaving(true);
      
      // Llamar al endpoint para actualizar el perfil
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Auth header is read from cookie by proxy
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        setOriginalUsername(username);
        // Aquí podrías actualizar el store si es necesario
        alert('Perfil actualizado exitosamente');
      } else {
        throw new Error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      setIsChangingPassword(true);
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         // Auth header is read from cookie by proxy
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!response.ok) throw new Error('Error al cambiar contraseña');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Contraseña actualizada correctamente');
    } catch (e) {
      console.error(e);
      alert('No se pudo actualizar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await fetch('/api/managers');
        if (res.ok) setManagers(await res.json());
      } catch (e) {
        console.error('Error cargando managers', e);
      }
    };
    loadManagers();
  }, []);

  const handleRequestManagerChange = async () => {
    if (!user || !managerId) return;
    try {
      setIsRequestingManagerChange(true);
      const res = await fetch('/api/profile/request-manager-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Auth header is read from cookie by proxy
        },
        body: JSON.stringify({ desired_manager_id: Number(managerId) }),
      });
      if (!res.ok) throw new Error('Solicitud fallida');
      alert('Solicitud enviada al administrador');
      setManagerId('');
    } catch (e) {
      console.error(e);
      alert('No se pudo enviar la solicitud');
    } finally {
      setIsRequestingManagerChange(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog className="h-8 w-8" />
          Perfil y Configuración
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu información personal, seguridad y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email - Solo lectura */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
              placeholder="Email no disponible"
            />
            <p className="text-sm text-gray-500">
              El email no se puede modificar
            </p>
          </div>

          {/* Username - Editable */}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu nombre de usuario"
              className="transition-colors focus:ring-2 focus:ring-cactus-500"
            />
            <p className="text-sm text-gray-500">
              Este nombre se mostrará en tu perfil
            </p>
          </div>

          {/* Botón Guardar */}
          {hasChanges && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto bg-cactus-600 hover:bg-cactus-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Seguridad: Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Cambiar de manager (solicitud)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Selecciona un manager</Label>
            <select
              id="manager"
              className="w-full border rounded-md px-3 py-2"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
            >
              <option value="">-- Elegir --</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.email}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleRequestManagerChange} disabled={!managerId || isRequestingManagerChange}>
            {isRequestingManagerChange ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar solicitud al administrador
          </Button>
          <p className="text-sm text-gray-500">Recibirás una notificación cuando tu solicitud sea revisada.</p>
        </CardContent>
      </Card>
    </div>
  );
}