import React, { useState, useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket.service';
import { robustErrorHandler } from '../lib/robust-error-handler';

interface HealthStatus {
  backend: 'healthy' | 'unhealthy' | 'checking';
  websocket: 'connected' | 'disconnected' | 'reconnecting';
  lastCheck: Date;
  errors: string[];
}

interface HealthMonitorProps {
  onHealthChange?: (status: HealthStatus) => void;
  checkInterval?: number; // en milisegundos
}

export const HealthMonitor: React.FC<HealthMonitorProps> = ({
  onHealthChange,
  checkInterval = 30000 // 30 segundos por defecto
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    backend: 'checking',
    websocket: 'disconnected',
    lastCheck: new Date(),
    errors: []
  });

  const [isVisible, setIsVisible] = useState(false);

  // Función para verificar la salud del backend
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });

      if (response.ok) {
        const data = await response.json();
        return data.backend_healthy === true;
      }
      return false;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }, []);

  // Función para verificar la salud del WebSocket
  const checkWebSocketHealth = useCallback((): 'connected' | 'disconnected' | 'reconnecting' => {
    const stats = websocketService.getConnectionStats();
    
    if (stats.isConnected && stats.isHealthy) {
      return 'connected';
    } else if (stats.reconnectAttempts > 0 && stats.reconnectAttempts < stats.maxReconnectAttempts) {
      return 'reconnecting';
    } else {
      return 'disconnected';
    }
  }, []);

  // Función principal de verificación de salud
  const performHealthCheck = useCallback(async () => {
    const errors: string[] = [];
    
    // Verificar backend
    const backendHealthy = await checkBackendHealth();
    if (!backendHealthy) {
      errors.push('Backend no responde o no está saludable');
    }

    // Verificar WebSocket
    const wsStatus = checkWebSocketHealth();
    if (wsStatus === 'disconnected') {
      errors.push('WebSocket desconectado');
    } else if (wsStatus === 'reconnecting') {
      errors.push('WebSocket reconectando...');
    }

    const newStatus: HealthStatus = {
      backend: backendHealthy ? 'healthy' : 'unhealthy',
      websocket: wsStatus,
      lastCheck: new Date(),
      errors
    };

    setHealthStatus(newStatus);
    onHealthChange?.(newStatus);

    // Mostrar indicador si hay problemas
    setIsVisible(errors.length > 0);

    return newStatus;
  }, [checkBackendHealth, checkWebSocketHealth, onHealthChange]);

  // Configurar verificaciones periódicas
  useEffect(() => {
    // Verificación inicial
    performHealthCheck();

    // Configurar intervalo
    const interval = setInterval(performHealthCheck, checkInterval);

    return () => clearInterval(interval);
  }, [performHealthCheck, checkInterval]);

  // Escuchar eventos del WebSocket
  useEffect(() => {
    const handleWebSocketEvent = () => {
      // Actualizar estado cuando hay cambios en WebSocket
      setTimeout(performHealthCheck, 1000);
    };

    websocketService.on('connected', handleWebSocketEvent);
    websocketService.on('disconnected', handleWebSocketEvent);
    websocketService.on('reconnecting', handleWebSocketEvent);
    websocketService.on('max_reconnects_reached', handleWebSocketEvent);

    return () => {
      websocketService.off('connected', handleWebSocketEvent);
      websocketService.off('disconnected', handleWebSocketEvent);
      websocketService.off('reconnecting', handleWebSocketEvent);
      websocketService.off('max_reconnects_reached', handleWebSocketEvent);
    };
  }, [performHealthCheck]);

  // Función para forzar reconexión
  const forceReconnect = useCallback(() => {
    websocketService.forceReconnect();
    robustErrorHandler.forceHealthCheck();
    setTimeout(performHealthCheck, 2000);
  }, [performHealthCheck]);

  // Función para refrescar la página
  const refreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Problemas de Conectividad
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                {healthStatus.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={forceReconnect}
                className="bg-red-100 hover:bg-red-200 text-red-800 text-xs px-3 py-1 rounded-md transition-colors"
              >
                Reconectar
              </button>
              <button
                onClick={refreshPage}
                className="bg-red-100 hover:bg-red-200 text-red-800 text-xs px-3 py-1 rounded-md transition-colors"
              >
                Refrescar
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="bg-red-100 hover:bg-red-200 text-red-800 text-xs px-3 py-1 rounded-md transition-colors"
              >
                Ocultar
              </button>
            </div>
            <div className="mt-2 text-xs text-red-600">
              Última verificación: {healthStatus.lastCheck.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook personalizado para usar el monitor de salud
export const useHealthMonitor = (checkInterval?: number) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    backend: 'checking',
    websocket: 'disconnected',
    lastCheck: new Date(),
    errors: []
  });

  const handleHealthChange = useCallback((status: HealthStatus) => {
    setHealthStatus(status);
  }, []);

  return {
    healthStatus,
    HealthMonitorComponent: () => (
      <HealthMonitor 
        onHealthChange={handleHealthChange} 
        checkInterval={checkInterval}
      />
    )
  };
};

export default HealthMonitor;