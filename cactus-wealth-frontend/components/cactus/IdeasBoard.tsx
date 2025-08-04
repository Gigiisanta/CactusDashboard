"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Idea {
  id: number;
  title: string;
  description?: string;
  status: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  due_date?: string;
  created_at: string;
  creator: {
    id: number;
    name: string;
  };
}

const statusColumns = {
  BACKLOG: { title: "Backlog", color: "bg-gray-100 dark:bg-gray-800" },
  IN_PROGRESS: { title: "En Progreso", color: "bg-blue-100 dark:bg-blue-900" },
  REVIEW: { title: "Revisión", color: "bg-yellow-100 dark:bg-yellow-900" },
  DONE: { title: "Completado", color: "bg-green-100 dark:bg-green-900" }
};

const priorityColors = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500"
};

const priorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente"
};

export default function IdeasBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as const,
    due_date: ""
  });
  const { toast } = useToast();

  // Simular datos iniciales
  useEffect(() => {
    const mockIdeas: Idea[] = [
      {
        id: 1,
        title: "Crear video sobre inversiones ESG",
        description: "Video explicativo sobre inversiones sostenibles y criterios ESG",
        status: "BACKLOG",
        priority: "HIGH",
        due_date: "2024-02-15",
        created_at: "2024-01-15T10:00:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 2,
        title: "Actualizar matriz de contenido Q1",
        description: "Revisar y actualizar la matriz de contenido para el primer trimestre",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        created_at: "2024-01-10T14:30:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 3,
        title: "Guía AFIP para monotributistas",
        description: "Crear guía paso a paso para monotributistas",
        status: "REVIEW",
        priority: "HIGH",
        due_date: "2024-02-01",
        created_at: "2024-01-05T09:15:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      }
    ];
    
    setTimeout(() => {
      setIdeas(mockIdeas);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const ideaId = parseInt(draggableId);
    const newStatus = destination.droppableId as Idea["status"];

    setIdeas(prev => 
      prev.map(idea => 
        idea.id === ideaId 
          ? { ...idea, status: newStatus }
          : idea
      )
    );

    toast({
      title: "Idea movida",
      description: `La idea se movió a ${statusColumns[newStatus].title}`,
    });
  };

  const handleCreateIdea = () => {
    if (!newIdea.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      });
      return;
    }

    const idea: Idea = {
      id: Date.now(),
      title: newIdea.title,
      description: newIdea.description,
      status: "BACKLOG",
      priority: newIdea.priority,
      due_date: newIdea.due_date || undefined,
      created_at: new Date().toISOString(),
      creator: { id: 1, name: "Usuario Actual" }
    };

    setIdeas(prev => [...prev, idea]);
    setNewIdea({ title: "", description: "", priority: "MEDIUM", due_date: "" });
    setIsCreateDialogOpen(false);

    toast({
      title: "Idea creada",
      description: "La nueva idea se agregó al backlog",
    });
  };

  const getIdeasByStatus = (status: Idea["status"]) => {
    return ideas.filter(idea => idea.status === status);
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
      {/* Header con botón de crear */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tablero de Ideas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Arrastra las ideas entre columnas para cambiar su estado
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Idea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Idea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la idea"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newIdea.description}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción detallada"
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={newIdea.priority} onValueChange={(value: any) => setNewIdea(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Fecha límite</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newIdea.due_date}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateIdea}>
                  Crear Idea
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tablero Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(statusColumns).map(([status, config]) => (
            <div key={status} className={`rounded-lg p-4 ${config.color}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm">{config.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {getIdeasByStatus(status as Idea["status"]).length}
                </Badge>
              </div>
              
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] ${
                      snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    {getIdeasByStatus(status as Idea["status"]).map((idea, index) => (
                      <Draggable key={idea.id} draggableId={idea.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move ${
                              snapshot.isDragging ? "shadow-lg rotate-2" : ""
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h5 className="font-medium text-sm line-clamp-2">
                                    {idea.title}
                                  </h5>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                {idea.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {idea.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <Badge 
                                    className={`text-xs ${priorityColors[idea.priority]} text-white`}
                                  >
                                    {priorityLabels[idea.priority]}
                                  </Badge>
                                  
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <User className="h-3 w-3" />
                                    {idea.creator.name.split(" ")[0]}
                                  </div>
                                </div>
                                
                                {idea.due_date && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(idea.due_date).toLocaleDateString("es-ES")}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}