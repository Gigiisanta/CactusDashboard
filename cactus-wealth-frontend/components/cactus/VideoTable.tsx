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
import { Calendar, Plus, Edit, Trash2, ExternalLink, Play, Eye, Heart, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VideoSlot {
  id: number;
  title: string;
  platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINKEDIN";
  scheduled_date: string;
  duration_minutes?: number;
  script?: string;
  hashtags?: string;
  video_url?: string;
  is_published: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  creator: {
    id: number;
    name: string;
  };
}

const platformLabels = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn"
};

const platformColors = {
  INSTAGRAM: "bg-gradient-to-r from-purple-500 to-pink-500",
  TIKTOK: "bg-black",
  YOUTUBE: "bg-red-500",
  LINKEDIN: "bg-blue-600"
};

const platformIcons = {
  INSTAGRAM: "📷",
  TIKTOK: "🎵",
  YOUTUBE: "📺",
  LINKEDIN: "💼"
};

export default function VideoTable() {
  const [videos, setVideos] = useState<VideoSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoSlot | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [newVideo, setNewVideo] = useState({
    title: "",
    platform: "INSTAGRAM" as "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINKEDIN",
    scheduled_date: "",
    duration_minutes: "",
    script: "",
    hashtags: "",
    video_url: ""
  });
  const { toast } = useToast();

  // Simular datos iniciales
  useEffect(() => {
    const mockVideos: VideoSlot[] = [
      {
        id: 1,
        title: "Tips de Inversión para Principiantes",
        platform: "INSTAGRAM",
        scheduled_date: "2024-02-15T10:00:00Z",
        duration_minutes: 60,
        script: "Hablar sobre diversificación, riesgo y retorno...",
        hashtags: "#inversiones #finanzas #tips #principiantes",
        video_url: "https://instagram.com/p/example1",
        is_published: true,
        views_count: 1250,
        likes_count: 89,
        comments_count: 23,
        created_at: "2024-01-15T10:00:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      },
      {
        id: 2,
        title: "Análisis Rápido del Mercado",
        platform: "TIKTOK",
        scheduled_date: "2024-02-16T15:30:00Z",
        duration_minutes: 30,
        script: "Análisis de tendencias del mercado en 30 segundos",
        hashtags: "#mercado #análisis #finanzas #trading",
        is_published: false,
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        created_at: "2024-01-20T14:30:00Z",
        creator: { id: 2, name: "María García" }
      },
      {
        id: 3,
        title: "Webinar: Estrategias de Inversión 2024",
        platform: "YOUTUBE",
        scheduled_date: "2024-02-20T19:00:00Z",
        duration_minutes: 3600,
        script: "Presentación completa sobre estrategias para el 2024",
        hashtags: "#webinar #estrategias #inversión #2024",
        video_url: "https://youtube.com/watch?v=example3",
        is_published: true,
        views_count: 3420,
        likes_count: 156,
        comments_count: 67,
        created_at: "2024-01-25T09:15:00Z",
        creator: { id: 1, name: "Juan Pérez" }
      }
    ];
    
    setTimeout(() => {
      setVideos(mockVideos);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateVideo = () => {
    if (!newVideo.title.trim() || !newVideo.scheduled_date) {
      toast({
        title: "Error",
        description: "El título y la fecha son requeridos",
        variant: "destructive"
      });
      return;
    }

    const video: VideoSlot = {
      id: Date.now(),
      title: newVideo.title,
      platform: newVideo.platform,
      scheduled_date: newVideo.scheduled_date,
      duration_minutes: newVideo.duration_minutes ? parseInt(newVideo.duration_minutes) : undefined,
      script: newVideo.script,
      hashtags: newVideo.hashtags,
      video_url: newVideo.video_url,
      is_published: false,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      creator: { id: 1, name: "Usuario Actual" }
    };

    setVideos(prev => [...prev, video]);
    setNewVideo({
      title: "",
      platform: "INSTAGRAM",
      scheduled_date: "",
      duration_minutes: "",
      script: "",
      hashtags: "",
      video_url: ""
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Video programado",
      description: "El nuevo video se agregó al calendario",
    });
  };

  const handleEditVideo = (video: VideoSlot) => {
    setEditingVideo(video);
    setNewVideo({
      title: video.title,
      platform: video.platform,
      scheduled_date: video.scheduled_date,
      duration_minutes: video.duration_minutes?.toString() || "",
      script: video.script || "",
      hashtags: video.hashtags || "",
      video_url: video.video_url || ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateVideo = () => {
    if (!editingVideo) return;

    setVideos(prev => 
      prev.map(video => 
        video.id === editingVideo.id 
          ? { 
              ...video, 
              ...newVideo,
              duration_minutes: newVideo.duration_minutes ? parseInt(newVideo.duration_minutes) : undefined
            }
          : video
      )
    );

    setEditingVideo(null);
    setIsCreateDialogOpen(false);
    setNewVideo({
      title: "",
      platform: "INSTAGRAM",
      scheduled_date: "",
      duration_minutes: "",
      script: "",
      hashtags: "",
      video_url: ""
    });

    toast({
      title: "Video actualizado",
      description: "Los cambios se guardaron correctamente",
    });
  };

  const handleDeleteVideo = (id: number) => {
    setVideos(prev => prev.filter(video => video.id !== id));
    toast({
      title: "Video eliminado",
      description: "El video se eliminó del calendario",
    });
  };

  const togglePublished = (id: number) => {
    setVideos(prev => 
      prev.map(video => 
        video.id === id 
          ? { ...video, is_published: !video.is_published }
          : video
      )
    );
  };

  const filteredVideos = videos.filter(video => {
    return filterPlatform === "all" || video.platform === filterPlatform;
  });

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            size="sm"
          >
            Tabla
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las plataformas</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="TIKTOK">TikTok</SelectItem>
              <SelectItem value="YOUTUBE">YouTube</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingVideo(null);
            setNewVideo({
              title: "",
              platform: "INSTAGRAM",
              scheduled_date: "",
              duration_minutes: "",
              script: "",
              hashtags: "",
              video_url: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Programar Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? "Editar Video" : "Programar Nuevo Video"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título del video"
                  />
                </div>
                <div>
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select value={newVideo.platform} onValueChange={(value: any) => setNewVideo(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTAGRAM">📷 Instagram</SelectItem>
                      <SelectItem value="TIKTOK">🎵 TikTok</SelectItem>
                      <SelectItem value="YOUTUBE">📺 YouTube</SelectItem>
                      <SelectItem value="LINKEDIN">💼 LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Fecha y Hora *</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={newVideo.scheduled_date ? new Date(newVideo.scheduled_date).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setNewVideo(prev => ({ ...prev, scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={newVideo.duration_minutes}
                    onChange={(e) => setNewVideo(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="script">Guión/Descripción</Label>
                <Textarea
                  id="script"
                  value={newVideo.script}
                  onChange={(e) => setNewVideo(prev => ({ ...prev, script: e.target.value }))}
                  placeholder="Descripción del contenido del video"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input
                  id="hashtags"
                  value={newVideo.hashtags}
                  onChange={(e) => setNewVideo(prev => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#finanzas #inversiones #tips"
                />
              </div>
              
              <div>
                <Label htmlFor="video_url">URL del Video (después de publicar)</Label>
                <Input
                  id="video_url"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingVideo ? handleUpdateVideo : handleCreateVideo}>
                  {editingVideo ? "Actualizar" : "Programar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vista de tabla */}
      {viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>Videos Programados ({filteredVideos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Métricas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="font-medium">{video.title}</div>
                      {video.hashtags && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                          {video.hashtags}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${platformColors[video.platform]} text-white`}>
                        {platformIcons[video.platform]} {platformLabels[video.platform]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(video.scheduled_date).toLocaleDateString("es-ES")}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(video.scheduled_date).toLocaleTimeString("es-ES", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDuration(video.duration_minutes)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(video.id)}
                      >
                        <Badge variant={video.is_published ? "default" : "secondary"}>
                          {video.is_published ? "Publicado" : "Programado"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      {video.is_published && (
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.views_count.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {video.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {video.comments_count}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {video.video_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(video.video_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVideo(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredVideos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay videos programados para esta plataforma
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vista de calendario (simplificada) */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .map((video) => (
                  <Card key={video.id} className="border-l-4" style={{ borderLeftColor: video.platform === "INSTAGRAM" ? "#E1306C" : video.platform === "TIKTOK" ? "#000000" : video.platform === "YOUTUBE" ? "#FF0000" : "#0077B5" }}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`${platformColors[video.platform]} text-white text-xs`}>
                            {platformIcons[video.platform]} {platformLabels[video.platform]}
                          </Badge>
                          <Badge variant={video.is_published ? "default" : "secondary"} className="text-xs">
                            {video.is_published ? "Publicado" : "Programado"}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                        
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          📅 {new Date(video.scheduled_date).toLocaleDateString("es-ES")}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ⏰ {new Date(video.scheduled_date).toLocaleTimeString("es-ES", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </div>
                        
                        {video.duration_minutes && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            ⏱️ {formatDuration(video.duration_minutes)}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-1 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVideo(video)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {video.video_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(video.video_url, "_blank")}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            
            {filteredVideos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay videos programados para esta plataforma
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}