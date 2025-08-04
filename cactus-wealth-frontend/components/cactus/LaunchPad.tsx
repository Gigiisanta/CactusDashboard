"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ExternalLink, Settings, Grid3X3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ExternalLink {
  id: number;
  title: string;
  description?: string;
  url: string;
  icon?: string;
  color: string;
  category: "DESIGN" | "STORAGE" | "FORMS" | "ANALYTICS" | "SOCIAL" | "TOOLS" | "OTHER";
  is_active: boolean;
  order_index: number;
  created_at: string;
  creator: {
    id: number;
    name: string;
  };
}

const categoryLabels = {
  DESIGN: "Diseño",
  STORAGE: "Almacenamiento",
  FORMS: "Formularios",
  ANALYTICS: "Analytics",
  SOCIAL: "Redes Sociales",
  TOOLS: "Herramientas",
  OTHER: "Otros"
};

const categoryColors = {
  DESIGN: "bg-pink-500",
  STORAGE: "bg-blue-500",
  FORMS: "bg-green-500",
  ANALYTICS: "bg-purple-500",
  SOCIAL: "bg-orange-500",
  TOOLS: "bg-gray-500",
  OTHER: "bg-indigo-500"
};

const predefinedColors = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b"
];

export default function LaunchPad() {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ExternalLink | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newLink, setNewLink] = useState({
    title: "",
    description: "",
    url: "",
    icon: "",
    color: predefinedColors[0],
    category: "TOOLS" as const,
    is_active: true
  });
  const { toast } = useToast();

  // Simular datos iniciales
  useEffect(() => {
    const mockLinks: ExternalLink[] = [
      {
        id: 1,
        title: "Canva",
        description: "Herramienta de diseño gráfico para crear contenido visual",
        url: "https://canva.com",
        icon: "🎨",
        color: "#00c4cc",
        category: "DESIGN",
        is_active: true,
        order_index: 1,
        created_at: "2024-01-15T10:00:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 2,
        title: "Google Drive",
        description: "Almacenamiento en la nube y colaboración",
        url: "https://drive.google.com",
        icon: "📁",
        color: "#4285f4",
        category: "STORAGE",
        is_active: true,
        order_index: 2,
        created_at: "2024-01-16T11:30:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 3,
        title: "Google Forms",
        description: "Crear formularios y encuestas",
        url: "https://forms.google.com",
        icon: "📝",
        color: "#673ab7",
        category: "FORMS",
        is_active: true,
        order_index: 3,
        created_at: "2024-01-17T14:15:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 4,
        title: "Google Analytics",
        description: "Análisis de tráfico web y métricas",
        url: "https://analytics.google.com",
        icon: "📊",
        color: "#ff9800",
        category: "ANALYTICS",
        is_active: true,
        order_index: 4,
        created_at: "2024-01-18T09:45:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 5,
        title: "Figma",
        description: "Diseño de interfaces y prototipado",
        url: "https://figma.com",
        icon: "🎯",
        color: "#f24e1e",
        category: "DESIGN",
        is_active: true,
        order_index: 5,
        created_at: "2024-01-19T16:20:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 6,
        title: "Notion",
        description: "Workspace todo-en-uno para notas y proyectos",
        url: "https://notion.so",
        icon: "📋",
        color: "#000000",
        category: "TOOLS",
        is_active: true,
        order_index: 6,
        created_at: "2024-01-20T12:10:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 7,
        title: "Buffer",
        description: "Programación de contenido en redes sociales",
        url: "https://buffer.com",
        icon: "📱",
        color: "#168eea",
        category: "SOCIAL",
        is_active: false,
        order_index: 7,
        created_at: "2024-01-21T15:30:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 8,
        title: "Typeform",
        description: "Formularios interactivos y encuestas",
        url: "https://typeform.com",
        icon: "💬",
        color: "#262627",
        category: "FORMS",
        is_active: true,
        order_index: 8,
        created_at: "2024-01-22T10:45:00Z",
        creator: { id: 2, name: "María García" }
      }
    ];
    
    setTimeout(() => {
      setLinks(mockLinks.sort((a, b) => a.order_index - b.order_index));
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast({
        title: "Error",
        description: "El título y la URL son requeridos",
        variant: "destructive"
      });
      return;
    }

    const link: ExternalLink = {
      id: Date.now(),
      title: newLink.title,
      description: newLink.description,
      url: newLink.url,
      icon: newLink.icon,
      color: newLink.color,
      category: newLink.category,
      is_active: newLink.is_active,
      order_index: links.length + 1,
      created_at: new Date().toISOString(),
      creator: { id: 1, name: "Usuario Actual" }
    };

    setLinks(prev => [...prev, link]);
    setNewLink({
      title: "",
      description: "",
      url: "",
      icon: "",
      color: predefinedColors[0],
      category: "TOOLS",
      is_active: true
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Enlace agregado",
      description: "El nuevo enlace se agregó al Launch-pad",
    });
  };

  const handleEditLink = (link: ExternalLink) => {
    setEditingLink(link);
    setNewLink({
      title: link.title,
      description: link.description || "",
      url: link.url,
      icon: link.icon || "",
      color: link.color,
      category: link.category as "TOOLS",
      is_active: link.is_active
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateLink = () => {
    if (!editingLink) return;

    setLinks(prev => 
      prev.map(link => 
        link.id === editingLink.id 
          ? { ...link, ...newLink }
          : link
      )
    );

    setEditingLink(null);
    setIsCreateDialogOpen(false);
    setNewLink({
      title: "",
      description: "",
      url: "",
      icon: "",
      color: predefinedColors[0],
      category: "TOOLS",
      is_active: true
    });

    toast({
      title: "Enlace actualizado",
      description: "Los cambios se guardaron correctamente",
    });
  };

  const handleDeleteLink = (id: number) => {
    setLinks(prev => prev.filter(link => link.id !== id));
    toast({
      title: "Enlace eliminado",
      description: "El enlace se eliminó del Launch-pad",
    });
  };

  const toggleActive = (id: number) => {
    setLinks(prev => 
      prev.map(link => 
        link.id === id 
          ? { ...link, is_active: !link.is_active }
          : link
      )
    );
  };

  const filteredLinks = links.filter(link => {
    const matchesCategory = filterCategory === "all" || link.category === filterCategory;
    return matchesCategory && link.is_active;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="DESIGN">🎨 Diseño</SelectItem>
              <SelectItem value="STORAGE">📁 Almacenamiento</SelectItem>
              <SelectItem value="FORMS">📝 Formularios</SelectItem>
              <SelectItem value="ANALYTICS">📊 Analytics</SelectItem>
              <SelectItem value="SOCIAL">📱 Redes Sociales</SelectItem>
              <SelectItem value="TOOLS">🛠️ Herramientas</SelectItem>
              <SelectItem value="OTHER">📦 Otros</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingLink(null);
            setNewLink({
              title: "",
              description: "",
              url: "",
              icon: "",
              color: predefinedColors[0],
              category: "TOOLS",
              is_active: true
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Enlace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? "Editar Enlace" : "Agregar Nuevo Enlace"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nombre de la herramienta"
                />
              </div>
              
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://ejemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newLink.description}
                  onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descripción de la herramienta"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icono (emoji)</Label>
                  <Input
                    id="icon"
                    value={newLink.icon}
                    onChange={(e) => setNewLink(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="🛠️"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={newLink.category} onValueChange={(value: any) => setNewLink(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESIGN">🎨 Diseño</SelectItem>
                      <SelectItem value="STORAGE">📁 Almacenamiento</SelectItem>
                      <SelectItem value="FORMS">📝 Formularios</SelectItem>
                      <SelectItem value="ANALYTICS">📊 Analytics</SelectItem>
                      <SelectItem value="SOCIAL">📱 Redes Sociales</SelectItem>
                      <SelectItem value="TOOLS">🛠️ Herramientas</SelectItem>
                      <SelectItem value="OTHER">📦 Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-9 gap-2 mt-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        newLink.color === color ? "border-gray-900 dark:border-gray-100" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewLink(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newLink.is_active}
                  onChange={(e) => setNewLink(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingLink ? handleUpdateLink : handleCreateLink}>
                  {editingLink ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vista de enlaces */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: link.color }}
                  >
                    {link.icon || link.title.charAt(0)}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditLink(link);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLink(link.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div 
                  className="space-y-2"
                  onClick={() => window.open(link.url, "_blank")}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{link.title}</h3>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                  
                  {link.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                  
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${categoryColors[link.category]} text-white`}
                  >
                    {categoryLabels[link.category]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Enlaces del Launch-pad ({filteredLinks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: link.color }}
                    >
                      {link.icon || link.title.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{link.title}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${categoryColors[link.category]} text-white`}
                        >
                          {categoryLabels[link.category]}
                        </Badge>
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {link.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLink(link)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredLinks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay enlaces activos en esta categoría
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}