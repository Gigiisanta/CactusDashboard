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
import { Plus, Edit, Trash2, ExternalLink, Filter, Star, BookOpen, Headphones, Video, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LibraryItem {
  id: number;
  title: string;
  author?: string;
  content_type: "LIBRO" | "PODCAST" | "VIDEO" | "ARTICULO";
  description?: string;
  url?: string;
  isbn?: string;
  duration_minutes?: number;
  rating?: number;
  tags?: string;
  is_recommended: boolean;
  completion_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
  created_at: string;
  creator: {
    id: number;
    name: string;
  };
}

const contentTypeLabels = {
  LIBRO: "Libro",
  PODCAST: "Podcast",
  VIDEO: "Video",
  ARTICULO: "Artículo"
};

const contentTypeIcons = {
  LIBRO: BookOpen,
  PODCAST: Headphones,
  VIDEO: Video,
  ARTICULO: FileText
};

const contentTypeColors = {
  LIBRO: "bg-blue-500",
  PODCAST: "bg-purple-500",
  VIDEO: "bg-red-500",
  ARTICULO: "bg-green-500"
};

const statusLabels = {
  NOT_STARTED: "No iniciado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado"
};

const statusColors = {
  NOT_STARTED: "bg-gray-500",
  IN_PROGRESS: "bg-yellow-500",
  COMPLETED: "bg-green-500"
};

export default function LibraryTable() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newItem, setNewItem] = useState({
    title: "",
    author: "",
    content_type: "LIBRO" as const,
    description: "",
    url: "",
    isbn: "",
    duration_minutes: "",
    rating: "",
    tags: "",
    is_recommended: false,
    completion_status: "NOT_STARTED" as const,
    notes: ""
  });
  const { toast } = useToast();

  // Simular datos iniciales
  useEffect(() => {
    const mockLibrary: LibraryItem[] = [
      {
        id: 1,
        title: "El Inversor Inteligente",
        author: "Benjamin Graham",
        content_type: "LIBRO",
        description: "Libro clásico sobre inversión en valor y análisis fundamental",
        isbn: "978-0060555665",
        rating: 5,
        tags: "inversión, valor, análisis fundamental",
        is_recommended: true,
        completion_status: "COMPLETED",
        notes: "Excelente libro base para entender inversión en valor",
        created_at: "2024-01-15T10:00:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 2,
        title: "Chat with Traders Podcast",
        author: "Aaron Fifield",
        content_type: "PODCAST",
        description: "Entrevistas con traders profesionales y gestores de fondos",
        url: "https://chatwithtraders.com",
        duration_minutes: 60,
        rating: 4,
        tags: "trading, entrevistas, estrategias",
        is_recommended: true,
        completion_status: "IN_PROGRESS",
        created_at: "2024-01-20T14:30:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 3,
        title: "Curso de Análisis Técnico",
        author: "TradingView",
        content_type: "VIDEO",
        description: "Serie de videos sobre análisis técnico y chartismo",
        url: "https://tradingview.com/education",
        duration_minutes: 480,
        rating: 4,
        tags: "análisis técnico, chartismo, educación",
        is_recommended: false,
        completion_status: "NOT_STARTED",
        created_at: "2024-01-25T09:15:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 4,
        title: "Diversificación de Carteras en Mercados Emergentes",
        author: "Financial Times",
        content_type: "ARTICULO",
        description: "Artículo sobre estrategias de diversificación en mercados emergentes",
        url: "https://ft.com/content/example",
        rating: 3,
        tags: "diversificación, mercados emergentes, estrategia",
        is_recommended: false,
        completion_status: "COMPLETED",
        notes: "Buenas ideas pero muy específico para mercados desarrollados",
        created_at: "2024-01-30T16:45:00Z",
        creator: { id: 2, name: "María García" }
      }
    ];
    
    setTimeout(() => {
      setLibrary(mockLibrary);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateItem = () => {
    if (!newItem.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      });
      return;
    }

    const item: LibraryItem = {
      id: Date.now(),
      title: newItem.title,
      author: newItem.author,
      content_type: newItem.content_type,
      description: newItem.description,
      url: newItem.url,
      isbn: newItem.isbn,
      duration_minutes: newItem.duration_minutes ? parseInt(newItem.duration_minutes) : undefined,
      rating: newItem.rating ? parseInt(newItem.rating) : undefined,
      tags: newItem.tags,
      is_recommended: newItem.is_recommended,
      completion_status: newItem.completion_status,
      notes: newItem.notes,
      created_at: new Date().toISOString(),
      creator: { id: 1, name: "Usuario Actual" }
    };

    setLibrary(prev => [...prev, item]);
    setNewItem({
      title: "",
      author: "",
      content_type: "LIBRO",
      description: "",
      url: "",
      isbn: "",
      duration_minutes: "",
      rating: "",
      tags: "",
      is_recommended: false,
      completion_status: "NOT_STARTED",
      notes: ""
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Recurso agregado",
      description: "El nuevo recurso se agregó a la biblioteca",
    });
  };

  const handleEditItem = (item: LibraryItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      author: item.author || "",
      content_type: item.content_type as "LIBRO",
      description: item.description || "",
      url: item.url || "",
      isbn: item.isbn || "",
      duration_minutes: item.duration_minutes?.toString() || "",
      rating: item.rating?.toString() || "",
      tags: item.tags || "",
      is_recommended: item.is_recommended,
      completion_status: item.completion_status as "NOT_STARTED",
      notes: item.notes || ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    setLibrary(prev => 
      prev.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              ...newItem,
              duration_minutes: newItem.duration_minutes ? parseInt(newItem.duration_minutes) : undefined,
              rating: newItem.rating ? parseInt(newItem.rating) : undefined
            }
          : item
      )
    );

    setEditingItem(null);
    setIsCreateDialogOpen(false);
    setNewItem({
      title: "",
      author: "",
      content_type: "LIBRO",
      description: "",
      url: "",
      isbn: "",
      duration_minutes: "",
      rating: "",
      tags: "",
      is_recommended: false,
      completion_status: "NOT_STARTED",
      notes: ""
    });

    toast({
      title: "Recurso actualizado",
      description: "Los cambios se guardaron correctamente",
    });
  };

  const handleDeleteItem = (id: number) => {
    setLibrary(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Recurso eliminado",
      description: "El recurso se eliminó de la biblioteca",
    });
  };

  const toggleRecommended = (id: number) => {
    setLibrary(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, is_recommended: !item.is_recommended }
          : item
      )
    );
  };

  const updateStatus = (id: number, status: LibraryItem["completion_status"]) => {
    setLibrary(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, completion_status: status }
          : item
      )
    );
  };

  const filteredLibrary = library.filter(item => {
    const matchesType = filterType === "all" || item.content_type === filterType;
    const matchesStatus = filterStatus === "all" || item.completion_status === filterStatus;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return "-";
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
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
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="LIBRO">📚 Libros</SelectItem>
              <SelectItem value="PODCAST">🎧 Podcasts</SelectItem>
              <SelectItem value="VIDEO">📺 Videos</SelectItem>
              <SelectItem value="ARTICULO">📄 Artículos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="NOT_STARTED">No iniciado</SelectItem>
              <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setNewItem({
              title: "",
              author: "",
              content_type: "LIBRO",
              description: "",
              url: "",
              isbn: "",
              duration_minutes: "",
              rating: "",
              tags: "",
              is_recommended: false,
              completion_status: "NOT_STARTED",
              notes: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Recurso" : "Agregar Nuevo Recurso"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título del recurso"
                  />
                </div>
                <div>
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={newItem.author}
                    onChange={(e) => setNewItem(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Nombre del autor"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content_type">Tipo de Contenido</Label>
                  <Select value={newItem.content_type} onValueChange={(value: any) => setNewItem(prev => ({ ...prev, content_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIBRO">📚 Libro</SelectItem>
                      <SelectItem value="PODCAST">🎧 Podcast</SelectItem>
                      <SelectItem value="VIDEO">📺 Video</SelectItem>
                      <SelectItem value="ARTICULO">📄 Artículo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="completion_status">Estado</Label>
                  <Select value={newItem.completion_status} onValueChange={(value: any) => setNewItem(prev => ({ ...prev, completion_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">No iniciado</SelectItem>
                      <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del contenido"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newItem.url}
                    onChange={(e) => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="isbn">ISBN (solo libros)</Label>
                  <Input
                    id="isbn"
                    value={newItem.isbn}
                    onChange={(e) => setNewItem(prev => ({ ...prev, isbn: e.target.value }))}
                    placeholder="978-0000000000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duración (min)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={newItem.duration_minutes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Calificación (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={newItem.rating}
                    onChange={(e) => setNewItem(prev => ({ ...prev, rating: e.target.value }))}
                    placeholder="5"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_recommended"
                    checked={newItem.is_recommended}
                    onChange={(e) => setNewItem(prev => ({ ...prev, is_recommended: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_recommended">Recomendado</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  value={newItem.tags}
                  onChange={(e) => setNewItem(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="inversión, análisis, estrategia"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas personales sobre el recurso"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingItem ? handleUpdateItem : handleCreateItem}>
                  {editingItem ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de biblioteca */}
      <Card>
        <CardHeader>
          <CardTitle>Biblioteca Cactus University ({filteredLibrary.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recurso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLibrary.map((item) => {
                const IconComponent = contentTypeIcons[item.content_type];
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{item.title}</div>
                          {item.is_recommended && (
                            <Badge variant="secondary" className="text-xs">
                              ⭐ Recomendado
                            </Badge>
                          )}
                        </div>
                        {item.author && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            por {item.author}
                          </div>
                        )}
                        {item.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${contentTypeColors[item.content_type]} text-white`}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {contentTypeLabels[item.content_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDuration(item.duration_minutes)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(item.rating)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.completion_status}
                        onValueChange={(value: any) => updateStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOT_STARTED">No iniciado</SelectItem>
                          <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                          <SelectItem value="COMPLETED">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRecommended(item.id)}
                        >
                          <Star className={`h-4 w-4 ${item.is_recommended ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
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
          
          {filteredLibrary.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron recursos que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}