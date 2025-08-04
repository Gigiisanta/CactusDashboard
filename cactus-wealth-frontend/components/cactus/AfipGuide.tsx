"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Circle, 
  Play, 
  ExternalLink, 
  FileText, 
  HelpCircle, 
  AlertTriangle,
  Clock,
  Building
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  requirements?: string[];
  actions: string[];
  tips?: string[];
  warnings?: string[];
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: "GENERAL" | "INSCRIPCION" | "DECLARACIONES" | "PAGOS" | "PROBLEMAS";
}

const difficultyColors = {
  FACIL: "bg-green-500",
  MEDIO: "bg-yellow-500",
  DIFICIL: "bg-red-500"
};

const difficultyLabels = {
  FACIL: "Fácil",
  MEDIO: "Medio",
  DIFICIL: "Difícil"
};

const categoryLabels = {
  GENERAL: "General",
  INSCRIPCION: "Inscripción",
  DECLARACIONES: "Declaraciones",
  PAGOS: "Pagos",
  PROBLEMAS: "Problemas"
};

export default function AfipGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("GENERAL");

  const steps: Step[] = [
    {
      id: 1,
      title: "Obtener CUIT/CUIL",
      description: "Registro en AFIP para obtener tu número de identificación tributaria",
      duration: "30-45 min",
      difficulty: "FACIL",
      requirements: [
        "DNI argentino",
        "Dirección de residencia",
        "Email válido"
      ],
      actions: [
        "Ingresar a www.afip.gob.ar",
        "Hacer clic en 'Obtener CUIT'",
        "Completar formulario con datos personales",
        "Validar identidad con DNI",
        "Confirmar dirección de residencia",
        "Recibir CUIT por email"
      ],
      tips: [
        "Tener el DNI a mano antes de comenzar",
        "Usar un email que revises frecuentemente",
        "Verificar que la dirección sea correcta"
      ]
    },
    {
      id: 2,
      title: "Crear Clave Fiscal",
      description: "Generar tu clave de acceso a los servicios de AFIP",
      duration: "15-20 min",
      difficulty: "FACIL",
      requirements: [
        "CUIT/CUIL obtenido",
        "Email registrado en AFIP",
        "Teléfono móvil"
      ],
      actions: [
        "Ir a 'Clave Fiscal' en afip.gob.ar",
        "Seleccionar 'Generar Clave Fiscal'",
        "Ingresar CUIT y datos personales",
        "Crear pregunta de seguridad",
        "Validar con código SMS",
        "Configurar clave de 8 dígitos"
      ],
      tips: [
        "Elegir una pregunta de seguridad que recuerdes",
        "Anotar la clave en lugar seguro",
        "Activar autenticación de dos factores"
      ],
      warnings: [
        "No compartir la clave con terceros",
        "Cambiar la clave cada 6 meses"
      ]
    },
    {
      id: 3,
      title: "Inscripción en Monotributo",
      description: "Registrarse en el régimen simplificado para pequeños contribuyentes",
      duration: "45-60 min",
      difficulty: "MEDIO",
      requirements: [
        "Clave Fiscal activa",
        "Actividad económica definida",
        "Ingresos anuales estimados"
      ],
      actions: [
        "Ingresar con Clave Fiscal",
        "Ir a 'Monotributo' > 'Inscripción'",
        "Seleccionar actividad económica",
        "Declarar ingresos estimados",
        "Elegir categoría correspondiente",
        "Confirmar inscripción",
        "Imprimir constancia"
      ],
      tips: [
        "Consultar tabla de categorías actualizada",
        "Considerar crecimiento futuro al elegir categoría",
        "Guardar constancia de inscripción"
      ]
    },
    {
      id: 4,
      title: "Primera Declaración Jurada",
      description: "Completar y presentar tu primera declaración mensual",
      duration: "30-40 min",
      difficulty: "MEDIO",
      requirements: [
        "Inscripción en Monotributo",
        "Facturación del mes",
        "Comprobantes de gastos"
      ],
      actions: [
        "Acceder a 'Mis Aplicaciones'",
        "Seleccionar 'Monotributo'",
        "Ir a 'Declaraciones Juradas'",
        "Completar ingresos del mes",
        "Verificar categoría",
        "Presentar declaración",
        "Generar volante de pago"
      ],
      tips: [
        "Presentar antes del día 20 de cada mes",
        "Mantener respaldos de facturación",
        "Revisar categoría mensualmente"
      ]
    },
    {
      id: 5,
      title: "Configurar Facturación Electrónica",
      description: "Habilitar el sistema de facturación electrónica de AFIP",
      duration: "60-90 min",
      difficulty: "DIFICIL",
      requirements: [
        "Monotributo activo",
        "Certificado digital (opcional)",
        "Software de facturación"
      ],
      actions: [
        "Solicitar autorización para facturar",
        "Configurar puntos de venta",
        "Obtener CAE (Código de Autorización)",
        "Configurar software de facturación",
        "Realizar factura de prueba",
        "Validar con AFIP"
      ],
      tips: [
        "Usar software homologado por AFIP",
        "Hacer backup de configuración",
        "Probar antes de facturar clientes"
      ],
      warnings: [
        "Todas las facturas deben tener CAE",
        "Respetar numeración consecutiva"
      ]
    }
  ];

  const faqs: FAQ[] = [
    {
      id: 1,
      question: "¿Cuánto tiempo demora obtener el CUIT?",
      answer: "El CUIT se obtiene inmediatamente al completar el formulario online. Recibirás la constancia por email en pocos minutos.",
      category: "INSCRIPCION"
    },
    {
      id: 2,
      question: "¿Puedo cambiar de categoría de Monotributo?",
      answer: "Sí, puedes recategorizar hasta 3 veces por año calendario. El cambio se hace online y tiene efecto desde el mes siguiente.",
      category: "GENERAL"
    },
    {
      id: 3,
      question: "¿Qué pasa si no presento la declaración a tiempo?",
      answer: "Se aplican multas e intereses. La multa mínima es de $1,000 y aumenta según el tiempo de atraso. Es importante regularizar cuanto antes.",
      category: "DECLARACIONES"
    },
    {
      id: 4,
      question: "¿Cómo pago el Monotributo?",
      answer: "Puedes pagar por débito automático, transferencia bancaria, tarjeta de crédito o en efectivo en bancos adheridos. El débito automático tiene descuentos.",
      category: "PAGOS"
    },
    {
      id: 5,
      question: "¿Qué hago si olvidé mi Clave Fiscal?",
      answer: "Puedes recuperarla en afip.gob.ar con tu CUIT y respondiendo la pregunta de seguridad. También puedes generar una nueva con validación por SMS.",
      category: "PROBLEMAS"
    },
    {
      id: 6,
      question: "¿Necesito contador para el Monotributo?",
      answer: "No es obligatorio, pero es recomendable para evitar errores. Para actividades simples puedes manejarlo solo siguiendo las guías de AFIP.",
      category: "GENERAL"
    },
    {
      id: 7,
      question: "¿Puedo facturar sin sistema electrónico?",
      answer: "Depende de tu actividad y categoría. Muchas actividades requieren facturación electrónica obligatoria. Consulta en AFIP tu situación específica.",
      category: "DECLARACIONES"
    },
    {
      id: 8,
      question: "¿Cómo doy de baja el Monotributo?",
      answer: "Puedes darte de baja online en cualquier momento. La baja tiene efecto desde el mes siguiente y debes presentar la última declaración jurada.",
      category: "GENERAL"
    }
  ];

  const toggleStepCompletion = (stepId: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const filteredFAQs = faqs.filter(faq => 
    selectedCategory === "GENERAL" || faq.category === selectedCategory
  );

  const completionPercentage = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Guía AFIP Paso a Paso
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Todo lo que necesitas saber para gestionar tus obligaciones fiscales
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completado</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guide">📋 Guía Paso a Paso</TabsTrigger>
          <TabsTrigger value="video">🎥 Video Tutorial</TabsTrigger>
          <TabsTrigger value="faq">❓ Preguntas Frecuentes</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <Card key={step.id} className={`${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStepCompletion(step.id)}
                        className="mt-1"
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="text-lg">
                          Paso {step.id}: {step.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${difficultyColors[step.difficulty]} text-white`}>
                            {difficultyLabels[step.difficulty]}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {step.duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details">
                      <AccordionTrigger>Ver detalles del paso</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {step.requirements && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Requisitos
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {step.requirements.map((req, index) => (
                                  <li key={index}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Acciones a realizar
                            </h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                              {step.actions.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ol>
                          </div>
                          
                          {step.tips && (
                            <Alert>
                              <HelpCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Tips útiles:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {step.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {step.warnings && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Importante:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {step.warnings.map((warning, index) => (
                                    <li key={index}>{warning}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Videos Tutoriales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-medium mb-1">Cómo obtener CUIT paso a paso</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Tutorial completo para registrarse en AFIP
                    </p>
                    <Badge variant="outline">15 min</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-medium mb-1">Inscripción en Monotributo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Guía para elegir categoría e inscribirse
                    </p>
                    <Badge variant="outline">22 min</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-medium mb-1">Primera Declaración Jurada</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Cómo completar tu primera declaración
                    </p>
                    <Badge variant="outline">18 min</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-medium mb-1">Facturación Electrónica</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Configuración y uso del sistema
                    </p>
                    <Badge variant="outline">35 min</Badge>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-medium">Canal Oficial AFIP</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Para más videos oficiales, visita el canal de YouTube de AFIP con tutoriales actualizados.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ir al Canal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Preguntas Frecuentes
              </CardTitle>
              <div className="flex gap-2 mt-4">
                <Button
                  variant={selectedCategory === "GENERAL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("GENERAL")}
                >
                  Todas
                </Button>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {filteredFAQs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay preguntas en esta categoría
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}