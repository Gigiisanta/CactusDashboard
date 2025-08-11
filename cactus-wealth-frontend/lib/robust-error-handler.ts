/**
 * 🚀 ROBUST ERROR HANDLING & RECOVERY SYSTEM
 * 
 * Sistema robusto de manejo de errores con reconexión automática,
 * retry logic, y notificaciones de estado para el usuario.
 */

import React from 'react';
import { toast } from 'sonner';

export interface ConnectionState {
  isOnline: boolean;
  backendConnected: boolean;
  lastError: string | null;
  retryCount: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class RobustErrorHandler {
  private connectionState: ConnectionState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    backendConnected: false,
    lastError: null,
    retryCount: 0,
    maxRetries: 5,
  };

  private retryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Array<(state: ConnectionState) => void> = [];

  constructor() {
    this.setupNetworkListeners();
    this.startHealthCheck();
  }

  /**
   * Configurar listeners para cambios de conectividad
   */
  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.connectionState.isOnline = true;
        this.notifyListeners();
        this.checkBackendHealth();
        toast.success('Conexión a internet restaurada');
      });

      window.addEventListener('offline', () => {
        this.connectionState.isOnline = false;
        this.connectionState.backendConnected = false;
        this.notifyListeners();
        toast.error('Sin conexión a internet');
      });
    }
  }

  /**
   * Iniciar health check periódico
   */
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      if (this.connectionState.isOnline) {
        this.checkBackendHealth();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Verificar salud del backend
   */
  private async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        if (!this.connectionState.backendConnected) {
          this.connectionState.backendConnected = true;
          this.connectionState.retryCount = 0;
          this.connectionState.lastError = null;
          this.notifyListeners();
          toast.success('Conexión al servidor restaurada');
        }
        return true;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      if (!this.connectionState.backendConnected) {
        // Ya sabíamos que estaba desconectado
        return false;
      }

      this.connectionState.backendConnected = false;
      this.connectionState.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.notifyListeners();
      
      if (this.connectionState.isOnline) {
        toast.error('Perdida conexión con el servidor');
        this.scheduleReconnect();
      }
      
      return false;
    }
  }

  /**
   * Programar intento de reconexión con backoff exponencial
   */
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, this.connectionState.retryCount),
      this.retryConfig.maxDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      if (this.connectionState.retryCount < this.retryConfig.maxRetries) {
        this.connectionState.retryCount++;
        this.checkBackendHealth();
      } else {
        toast.error('No se pudo reconectar al servidor. Recarga la página.');
      }
    }, delay);
  }

  /**
   * Manejar errores de API con retry automático
   */
  async handleApiError<T>(
    apiCall: () => Promise<T>,
    options: {
      showToast?: boolean;
      retryOnFailure?: boolean;
      customErrorMessage?: string;
    } = {}
  ): Promise<T> {
    const { showToast = true, retryOnFailure = true, customErrorMessage } = options;

    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      
      // Si es un error de conexión y tenemos retry habilitado
      if (retryOnFailure && this.isConnectionError(error)) {
        if (showToast) {
          toast.error('Error de conexión. Reintentando...');
        }
        
        // Intentar reconectar
        const isHealthy = await this.checkBackendHealth();
        if (isHealthy) {
          // Reintentar la llamada original
          return await apiCall();
        }
      }

      // Mostrar error al usuario
      if (showToast) {
        const displayMessage = customErrorMessage || errorMessage;
        toast.error(displayMessage);
      }

      throw error;
    }
  }

  /**
   * Determinar si es un error de conexión
   */
  private isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('refused') ||
      errorMessage.includes('timeout') ||
      errorCode.includes('network_error') ||
      errorCode.includes('connection_error') ||
      error.name === 'AbortError'
    );
  }

  /**
   * Extraer mensaje de error legible
   */
  private getErrorMessage(error: any): string {
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Ha ocurrido un error inesperado';
  }

  /**
   * Suscribirse a cambios de estado de conexión
   */
  subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.push(listener);
    
    // Enviar estado actual inmediatamente
    listener(this.connectionState);
    
    // Retornar función de cleanup
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    });
  }

  /**
   * Obtener estado actual de conexión
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Forzar verificación de salud
   */
  async forceHealthCheck(): Promise<boolean> {
    return await this.checkBackendHealth();
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.listeners = [];
  }
}

// Singleton instance
export const robustErrorHandler = new RobustErrorHandler();

/**
 * Hook para usar el estado de conexión en componentes React
 */
export function useConnectionState() {
  const [connectionState, setConnectionState] = React.useState<ConnectionState>(
    robustErrorHandler.getConnectionState()
  );

  React.useEffect(() => {
    const unsubscribe = robustErrorHandler.subscribe(setConnectionState);
    return unsubscribe;
  }, []);

  return {
    ...connectionState,
    forceHealthCheck: () => robustErrorHandler.forceHealthCheck(),
  };
}

/**
 * Wrapper para llamadas de API con manejo robusto de errores
 */
export function withRobustErrorHandling<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  options?: {
    showToast?: boolean;
    retryOnFailure?: boolean;
    customErrorMessage?: string;
  }
) {
  return async (...args: T): Promise<R> => {
    return robustErrorHandler.handleApiError(
      () => apiFunction(...args),
      options
    );
  };
}

export default robustErrorHandler;