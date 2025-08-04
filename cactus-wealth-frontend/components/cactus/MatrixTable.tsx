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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ExternalLink, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ContentMatrix {
  id: number;
  title: string;
  category: "EDUCATIVO" | "PROMOCIONAL" | "INFORMATIVO" | "ENTRETENIMIENTO";
  description?: string;
  target_audience?: string;
  keywords?: string;
  content_url?: string;
  is_published: boolean;
  publish_date?: string;
  created_at: string;
  creator: {
    id: number;
    name: string;
  };
}

const categoryLabels = {
  EDUCATIVO: "Educativo",
  PROMOCIONAL: "Promocional", 
  INFORMATIVO: "Informativo",
  ENTRETENIMIENTO: "Entretenimiento"
};

const categoryColors = {
  EDUCATIVO: "bg-blue-500",
  PROMOCIONAL: "bg-green-500",
  INFORMATIVO: "bg-yellow-500", 
  ENTRETENIMIENTO: "bg-purple-500"
};

export default function MatrixTable() {
  const [content, setContent] = useState<ContentMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentMatrix | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newContent, setNewContent] = useState({
    title: "",
    category: "EDUCATIVO" as "EDUCATIVO" | "PROMOCIONAL" | "INFORMATIVO" | "ENTRETENIMIENTO",
    description: "",
    target_audience: "",
    keywords: "",
    content_url: "",
    is_published: false,
    publish_date: ""
  });
  const { toast } = useToast();

  // Simular datos iniciales
  useEffect(() => {
    const mockContent: ContentMatrix[] = [
      {
        id: 1,
        title: "Guía de Inversiones para Principiantes",
        category: "EDUCATIVO",
        description: "Contenido educativo sobre conceptos básicos de inversión",
        target_audience: "Inversores novatos",
        keywords: "inversiones, principiantes, educación financiera",
        content_url: "https://example.com/guia-inversiones",
        is_published: true,
        publish_date: "2024-01-15",
        created_at: "2024-01-10T10:00:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 2,
        title: "Promoción Cartera Balanceada",
        category: "PROMOCIONAL",
        description: "Material promocional para cartera balanceada",
        target_audience: "Clientes potenciales",
        keywords: "cartera, balanceada, promoción",
        is_published: false,
        created_at: "2024-01-12T14:30:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 3,
        title: "Análisis Mercado Enero 2024",
        category: "INFORMATIVO",
        description: "Reporte mensual del estado del mercado",
        target_audience: "Clientes actuales",
        keywords: "mercado, análisis, enero, 2024",
        content_url: "https://example.com/analisis-enero",
        is_published: true,
        publish_date: "2024-01-31",
        created_at: "2024-01-25T09:15:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      }
    ];
    
    setTimeout(() => {
      setContent(mockContent);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateContent = () => {
    if (!newContent.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      });
      return;
    }

    const contentItem: ContentMatrix = {
      id: Date.now(),
      title: newContent.title,
      category: newContent.category,
      description: newContent.description,
      target_audience: newContent.target_audience,
      keywords: newContent.keywords,
      content_url: newContent.content_url,
      is_published: newContent.is_published,
      publish_date: newContent.publish_date || undefined,
      created_at: new Date().toISOString(),
      creator: { id: 1, name: "Usuario Actual" }
    };

    setContent(prev => [...prev, contentItem]);
    setNewContent({
      title: "",
      category: "EDUCATIVO",
      description: "",
      target_audience: "",
      keywords: "",
      content_url: "",
      is_published: false,
      publish_date: ""
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Contenido creado",
      description: "El nuevo contenido se agregó a la matriz",
    });
  };

  const handleEditContent = (contentItem: ContentMatrix) => {
    setEditingContent(contentItem);
    setNewContent({
      title: contentItem.title,
      category: contentItem.category,
      description: contentItem.description || "",
      target_audience: contentItem.target_audience || "",
      keywords: contentItem.keywords || "",
      content_url: contentItem.content_url || "",
      is_published: contentItem.is_published,
      publish_date: contentItem.publish_date || ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateContent = () => {
    if (!editingContent) return;

    setContent(prev => 
      prev.map(item => 
        item.id === editingContent.id 
          ? { ...item, ...newContent }
          : item
      )
    );

    setEditingContent(null);
    setIsCreateDialogOpen(false);
    setNewContent({
      title: "",
      category: "EDUCATIVO",
      description: "",
      target_audience: "",
      keywords: "",
      content_url: "",
      is_published: false,
      publish_date: ""
    });

    toast({
      title: "Contenido actualizado",
      description: "Los cambios se guardaron correctamente",
    });
  };

  const handleDeleteContent = (id: number) => {
    setContent(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Contenido eliminado",
      description: "El contenido se eliminó de la matriz",
    });
  };

  const filteredContent = content.filter(item => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.keywords?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
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
          <Input
            placeholder="Buscar contenido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="EDUCATIVO">Educativo</SelectItem>
              <SelectItem value="PROMOCIONAL">Promocional</SelectItem>
              <SelectItem value="INFORMATIVO">Informativo</SelectItem>
              <SelectItem value="ENTRETENIMIENTO">Entretenimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingContent(null);
            setNewContent({
              title: "",
              category: "EDUCATIVO",
              description: "",
              target_audience: "",
              keywords: "",
              content_url: "",
              is_published: false,
              publish_date: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contenido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? "Editar Contenido" : "Crear Nuevo Contenido"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newContent.title}
                    onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título del contenido"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={newContent.category} onValueChange={(value: any) => setNewContent(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDUCATIVO">Educativo</SelectItem>
                      <SelectItem value="PROMOCIONAL">Promocional</SelectItem>
                      <SelectItem value="INFORMATIVO">Informativo</SelectItem>
                      <SelectItem value="ENTRETENIMIENTO">Entretenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newContent.description}
                  onChange={(e) => setNewContent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del contenido"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_audience">Audiencia Objetivo</Label>
                  <Input
                    id="target_audience"
                    value={newContent.target_audience}
                    onChange={(e) => setNewContent(prev => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="Ej: Inversores novatos"
                  />
                </div>
                <div>
                  <Label htmlFor="keywords">Palabras Clave</Label>
                  <Input
                    id="keywords"
                    value={newContent.keywords}
                    onChange={(e) => setNewContent(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="Separadas por comas"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="content_url">URL del Contenido</Label>
                <Input
                  id="content_url"
                  value={newContent.content_url}
                  onChange={(e) => setNewContent(prev => ({ ...prev, content_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publish_date">Fecha de Publicación</Label>
                  <Input
                    id="publish_date"
                    type="date"
                    value={newContent.publish_date}
                    onChange={(e) => setNewContent(prev => ({ ...prev, publish_date: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={newContent.is_published}
                    onChange={(e) => setNewContent(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_published">Publicado</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingContent ? handleUpdateContent : handleCreateContent}>
                  {editingContent ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de contenido */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Contenido ({filteredContent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Audiencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Pub.</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${categoryColors[item.category]} text-white`}>
                      {categoryLabels[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{item.target_audience || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_published ? "default" : "secondary"}>
                      {item.is_published ? "Publicado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {item.publish_date 
                        ? new Date(item.publish_date).toLocaleDateString("es-ES")
                        : "-"
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.content_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.content_url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditContent(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContent(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredContent.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontró contenido que coincida con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}