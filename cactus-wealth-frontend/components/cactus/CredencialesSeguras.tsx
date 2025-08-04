"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Shield, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SecureCredential {
  id: number;
  service_name: string;
  username?: string;
  description?: string;
  url?: string;
  secret_arn: string;
  category: "BROKER" | "BANK" | "PLATFORM" | "API" | "OTHER";
  is_active: boolean;
  last_updated: string;
  created_by: {
    id: number;
    name: string;
  };
}

const categoryLabels = {
  BROKER: "Broker",
  BANK: "Banco",
  PLATFORM: "Plataforma",
  API: "API",
  OTHER: "Otros"
};

const categoryColors = {
  BROKER: "bg-blue-500",
  BANK: "bg-green-500",
  PLATFORM: "bg-purple-500",
  API: "bg-orange-500",
  OTHER: "bg-gray-500"
};

export default function CredencialesSeguras() {
  const [credentials, setCredentials] = useState<SecureCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<SecureCredential | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [revealedCredentials, setRevealedCredentials] = useState<Map<number, { username: string; password: string }>>(new Map());
  const [newCredential, setNewCredential] = useState({
    service_name: "",
    username: "",
    password: "",
    description: "",
    url: "",
    category: "PLATFORM" as const
  });
  const { toast } = useToast();

  // Simular datos iniciales
  useEffect(() => {
    const mockCredentials: SecureCredential[] = [
      {
        id: 1,
        service_name: "Balanz",
        username: "usuario@email.com",
        description: "Cuenta principal de trading en Balanz",
        url: "https://balanz.com",
        secret_arn: "arn:aws:secretsmanager:us-east-1:123456789:secret:balanz-creds-abc123",
        category: "BROKER",
        is_active: true,
        last_updated: "2024-01-15T10:00:00Z",
        created_by: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 2,
        service_name: "Zurich Point",
        username: "advisor001",
        description: "Portal de seguros Zurich para asesores",
        url: "https://zurichpoint.com.ar",
        secret_arn: "arn:aws:secretsmanager:us-east-1:123456789:secret:zurich-creds-def456",
        category: "PLATFORM",
        is_active: true,
        last_updated: "2024-01-20T14:30:00Z",
        created_by: { id: 2, name: "María García" }
      },
      {
        id: 3,
        service_name: "Banco Galicia Online",
        username: "12345678",
        description: "Homebanking corporativo",
        url: "https://bancogalicia.com",
        secret_arn: "arn:aws:secretsmanager:us-east-1:123456789:secret:galicia-creds-ghi789",
        category: "BANK",
        is_active: true,
        last_updated: "2024-01-25T09:15:00Z",
        created_by: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 4,
        service_name: "Alpha Vantage API",
        username: "api_user",
        description: "API key para datos de mercado",
        secret_arn: "arn:aws:secretsmanager:us-east-1:123456789:secret:alphavantage-api-jkl012",
        category: "API",
        is_active: false,
        last_updated: "2024-01-10T16:45:00Z",
        created_by: { id: 2, name: "María García" }
      }
    ];
    
    setTimeout(() => {
      setCredentials(mockCredentials);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateCredential = async () => {
    if (!newCredential.service_name.trim() || !newCredential.username.trim() || !newCredential.password.trim()) {
      toast({
        title: "Error",
        description: "El nombre del servicio, usuario y contraseña son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simular llamada a AWS Secrets Manager
      const mockSecretArn = `arn:aws:secretsmanager:us-east-1:123456789:secret:${newCredential.service_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      const credential: SecureCredential = {
        id: Date.now(),
        service_name: newCredential.service_name,
        username: newCredential.username,
        description: newCredential.description,
        url: newCredential.url,
        secret_arn: mockSecretArn,
        category: newCredential.category,
        is_active: true,
        last_updated: new Date().toISOString(),
        created_by: { id: 1, name: "Usuario Actual" }
      };

      setCredentials(prev => [...prev, credential]);
      setNewCredential({
        service_name: "",
        username: "",
        password: "",
        description: "",
        url: "",
        category: "PLATFORM"
      });
      setIsCreateDialogOpen(false);

      toast({
        title: "Credencial guardada",
        description: "La credencial se almacenó de forma segura en AWS Secrets Manager",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la credencial. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditCredential = (credential: SecureCredential) => {
    setEditingCredential(credential);
    setNewCredential({
      service_name: credential.service_name,
      username: credential.username || "",
      password: "", // No mostrar contraseña actual
      description: credential.description || "",
      url: credential.url || "",
      category: credential.category as "PLATFORM"
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateCredential = async () => {
    if (!editingCredential) return;

    try {
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === editingCredential.id 
            ? { 
                ...cred, 
                service_name: newCredential.service_name,
                username: newCredential.username,
                description: newCredential.description,
                url: newCredential.url,
                category: newCredential.category,
                last_updated: new Date().toISOString()
              }
            : cred
        )
      );

      setEditingCredential(null);
      setIsCreateDialogOpen(false);
      setNewCredential({
        service_name: "",
        username: "",
        password: "",
        description: "",
        url: "",
        category: "PLATFORM"
      });

      toast({
        title: "Credencial actualizada",
        description: "Los cambios se guardaron en AWS Secrets Manager",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la credencial",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCredential = async (id: number) => {
    try {
      setCredentials(prev => prev.filter(cred => cred.id !== id));
      toast({
        title: "Credencial eliminada",
        description: "La credencial se eliminó de AWS Secrets Manager",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la credencial",
        variant: "destructive"
      });
    }
  };

  const handleRevealCredential = async (id: number) => {
    try {
      // Simular obtención de credencial desde AWS Secrets Manager
      const mockCredentialData = {
        username: credentials.find(c => c.id === id)?.username || "usuario@ejemplo.com",
        password: "••••••••••••" // En realidad vendría de AWS
      };
      
      setRevealedCredentials(prev => new Map(prev.set(id, mockCredentialData)));
      setVisiblePasswords(prev => new Set(prev.add(id)));
      
      // Auto-ocultar después de 30 segundos por seguridad
      setTimeout(() => {
        setVisiblePasswords(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setRevealedCredentials(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }, 30000);

      toast({
        title: "Credencial revelada",
        description: "Se ocultará automáticamente en 30 segundos",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener la credencial",
        variant: "destructive"
      });
    }
  };

  const handleHideCredential = (id: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setRevealedCredentials(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${type} copiado al portapapeles`,
    });
  };

  const toggleActive = (id: number) => {
    setCredentials(prev => 
      prev.map(cred => 
        cred.id === id 
          ? { ...cred, is_active: !cred.is_active }
          : cred
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert de seguridad */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Seguridad:</strong> Todas las credenciales están cifradas y almacenadas en AWS Secrets Manager. 
          Solo usuarios con permisos de Advisor o superior pueden acceder a esta sección.
        </AlertDescription>
      </Alert>

      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Credenciales Seguras
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión segura de credenciales con AWS Secrets Manager
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingCredential(null);
            setNewCredential({
              service_name: "",
              username: "",
              password: "",
              description: "",
              url: "",
              category: "PLATFORM"
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCredential ? "Editar Credencial" : "Agregar Nueva Credencial"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service_name">Nombre del Servicio *</Label>
                <Input
                  id="service_name"
                  value={newCredential.service_name}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, service_name: e.target.value }))}
                  placeholder="Ej: Balanz, Zurich Point"
                />
              </div>
              
              <div>
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={newCredential.username}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Usuario o email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newCredential.password}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Contraseña segura"
                />
              </div>
              
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newCredential.url}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://ejemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={newCredential.category}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="BROKER">Broker</option>
                  <option value="BANK">Banco</option>
                  <option value="PLATFORM">Plataforma</option>
                  <option value="API">API</option>
                  <option value="OTHER">Otros</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newCredential.description}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional"
                  rows={2}
                />
              </div>
              
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Las credenciales se cifrarán y almacenarán en AWS Secrets Manager. 
                  Asegúrate de que la información sea correcta antes de guardar.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingCredential ? handleUpdateCredential : handleCreateCredential}>
                  {editingCredential ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de credenciales */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciales Almacenadas ({credentials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Contraseña</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((credential) => {
                const isVisible = visiblePasswords.has(credential.id);
                const revealedData = revealedCredentials.get(credential.id);
                
                return (
                  <TableRow key={credential.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{credential.service_name}</div>
                          <Badge 
                            className={`${categoryColors[credential.category]} text-white text-xs`}
                          >
                            {categoryLabels[credential.category]}
                          </Badge>
                        </div>
                        {credential.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {credential.description}
                          </div>
                        )}
                        {credential.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(credential.url, "_blank")}
                            className="h-6 p-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {isVisible && revealedData ? revealedData.username : credential.username}
                        </span>
                        {isVisible && revealedData && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(revealedData.username, "Usuario")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {isVisible && revealedData ? revealedData.password : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => isVisible ? handleHideCredential(credential.id) : handleRevealCredential(credential.id)}
                        >
                          {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {isVisible && revealedData && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(revealedData.password, "Contraseña")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(credential.id)}
                      >
                        {credential.is_active ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactivo
                          </Badge>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(credential.last_updated).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCredential(credential)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCredential(credential.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {credentials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay credenciales almacenadas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Información de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🔐 Cifrado</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Todas las credenciales están cifradas con AES-256 en AWS Secrets Manager.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">👥 Control de Acceso</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Solo usuarios con rol Advisor o Admin pueden acceder a las credenciales.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📝 Auditoría</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Todos los accesos y modificaciones quedan registrados en CloudTrail.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">⏰ Auto-ocultado</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Las contraseñas reveladas se ocultan automáticamente después de 30 segundos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}