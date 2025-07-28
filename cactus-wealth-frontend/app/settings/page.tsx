'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { User, Settings, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('security');

  const sections = [
    {
      id: 'security',
      label: 'Seguridad',
      icon: Shield,
      description: 'Información de tu cuenta y configuraciones de seguridad'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      description: 'Información personal y preferencias de cuenta'
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: Bell,
      description: 'Configura cómo y cuándo recibir notificaciones'
    }
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-cactus-600" />
          <h1 className="text-3xl font-bold text-cactus-700">Configuración</h1>
        </div>
        <p className="text-sage-600">
          Gestiona tu cuenta, seguridad y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-cactus-50 text-cactus-700 border-r-2 border-cactus-600'
                          : 'text-sage-600 hover:bg-sage-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeSection === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configuración de Seguridad
                  </CardTitle>
                  <p className="text-sm text-sage-600">
                    Información de tu cuenta y configuraciones de seguridad
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* User Info */}
                    {user && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Información de la cuenta</h3>
                        <div className="bg-sage-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cactus-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-cactus-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sage-900">{user.username}</p>
                              <p className="text-sm text-sage-600">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Perfil
                </CardTitle>
                <p className="text-sm text-sage-600">
                  Gestiona tu información personal y preferencias de cuenta
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-sage-400 mx-auto mb-4" />
                    <p className="text-sage-600">
                      La configuración del perfil estará disponible próximamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configuración de Notificaciones
                </CardTitle>
                <p className="text-sm text-sage-600">
                  Configura cómo y cuándo recibir notificaciones
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-sage-400 mx-auto mb-4" />
                    <p className="text-sage-600">
                      La configuración de notificaciones estará disponible próximamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}