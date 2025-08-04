"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Grid3X3, 
  Video, 
  GraduationCap, 
  Wrench, 
  FileText, 
  Shield 
} from "lucide-react";

// Importar componentes de cada sección
import IdeasBoard from "@/components/cactus/IdeasBoard";
import MatrixTable from "@/components/cactus/MatrixTable";
import VideoTable from "@/components/cactus/VideoTable";
import LibraryTable from "@/components/cactus/LibraryTable";
import LaunchPad from "@/components/cactus/LaunchPad";
import AfipGuide from "@/components/cactus/AfipGuide";
import CredencialesSeguras from "@/components/cactus/CredencialesSeguras";

export default function CactusPage() {
  const [activeTab, setActiveTab] = useState("ideas");

  const tabs = [
    {
      id: "ideas",
      label: "Ideas 💡",
      icon: Lightbulb,
      component: IdeasBoard,
      description: "Gestión de ideas con tablero Kanban"
    },
    {
      id: "matrix",
      label: "Matrix 📊",
      icon: Grid3X3,
      component: MatrixTable,
      description: "Matriz de categorías de contenido"
    },
    {
      id: "video",
      label: "Video 🎥",
      icon: Video,
      component: VideoTable,
      description: "Calendario de videos IG-TikTok"
    },
    {
      id: "university",
      label: "University 🎓",
      icon: GraduationCap,
      component: LibraryTable,
      description: "Biblioteca de recursos educativos"
    },
    {
      id: "tools",
      label: "Herramientas 🛠️",
      icon: Wrench,
      component: LaunchPad,
      description: "Enlaces y herramientas externas"
    },
    {
      id: "afip",
      label: "AFIP 📑",
      icon: FileText,
      component: AfipGuide,
      description: "Guía paso a paso AFIP"
    },
    {
      id: "credentials",
      label: "Credenciales 🔐",
      icon: Shield,
      component: CredencialesSeguras,
      description: "Credenciales seguras (Solo Advisor+)"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🌵 Cactus
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Centro de gestión de contenido y herramientas
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </Badge>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1 text-xs lg:text-sm"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Contents */}
        {tabs.map((tab) => {
          const ComponentToRender = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>
                    {tab.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ComponentToRender />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}