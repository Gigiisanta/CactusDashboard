'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
      setOriginalUsername(user.username);
    }
  }, [user]);

  const hasChanges = username !== originalUsername;

  const handleSave = async () => {
    if (!hasChanges || !user || !token) return;

    try {
      setIsSaving(true);
      
      // Llamar al endpoint para actualizar el perfil
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-8 w-8" />
          Mi Perfil
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu información personal y configuración de cuenta
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
    </div>
  );
}