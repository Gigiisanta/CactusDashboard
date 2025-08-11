/**
 * 🚀 LIVE-OPS: WebSocket Service para notificaciones en tiempo real
 *
 * Gestiona la conexión WebSocket con el backend para:
 * - Notificaciones push en tiempo real
 * - Actualizaciones de KPIs automáticas
 * - Comunicación bidireccional
 * - Reconnexión automática
 */

// Gate debug logs in browser to avoid noise in production. Enable with NEXT_PUBLIC_DEBUG_WS=true
const DEBUG_WS: boolean = process.env.NODE_ENV !== 'production' && (
  process.env.NEXT_PUBLIC_DEBUG_WS === 'true' || process.env.NODE_ENV === 'development'
);

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  target_user_id?: number;
  broadcast?: boolean;
}

interface NotificationData {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ConnectionStats {
  total_connections: number;
  active_users: number;
  user_connection_counts: { [key: string]: number };
  average_connections_per_user: number;
}

type WebSocketEventCallback = (data: any) => void;

class WebSocketService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Aumentar intentos
  private reconnectDelay = 1000; // Empezar con 1 segundo
  private maxReconnectDelay = 30000; // Máximo 30 segundos
  private isConnecting = false;
  private token: string | null = null;
  private listeners: Map<string, WebSocketEventCallback[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionEstablished = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private pongReceived = true;
  private connectionHealthy = true;

  private debugLog(message: string): void {
    if (DEBUG_WS) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  private debugWarn(message: string): void {
    if (DEBUG_WS) {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  }

  // URLs del WebSocket
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // WebSockets no pueden usar el proxy de Next.js, necesitamos conectar directamente al backend
    // En desarrollo: conectar directamente a localhost:8000
    // En producción: usar la variable de entorno o el host actual
    const backendHost = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';

    return `${protocol}//${backendHost}/api/v1/ws/notifications`;
  }

  /**
   * Establece conexión WebSocket con el backend
   */
  async connect(authToken: string): Promise<boolean> {
    if (this.isConnecting || this.websocket?.readyState === WebSocket.OPEN) {
      this.debugLog('🔗 WebSocket: Already connected or connecting');
      return true;
    }

    this.token = authToken;
    this.isConnecting = true;
    this.connectionHealthy = true;

    try {
      const wsUrl = `${this.getWebSocketUrl()}?token=${authToken}`;
      this.debugLog(`🔗 WebSocket: Connecting to ${wsUrl}`);

      this.websocket = new WebSocket(wsUrl);

      // Configurar event listeners
      this.websocket.onopen = this.handleOpen.bind(this);
      this.websocket.onmessage = this.handleMessage.bind(this);
      this.websocket.onclose = this.handleClose.bind(this);
      this.websocket.onerror = this.handleError.bind(this);

      return new Promise((resolve) => {
        let resolved = false;
        
        const resolveOnce = (value: boolean) => {
          if (!resolved) {
            resolved = true;
            resolve(value);
          }
        };

        // Resolver cuando la conexión se establezca o falle
        const checkConnection = () => {
          if (this.connectionEstablished) {
            resolveOnce(true);
          } else if (this.websocket?.readyState === WebSocket.CLOSED) {
            resolveOnce(false);
          } else if (!resolved) {
            // Seguir esperando
            setTimeout(checkConnection, 100);
          }
        };

        // Timeout de 15 segundos
        setTimeout(() => {
          if (!resolved) {
            console.error('🔗 WebSocket: Timeout de conexión (15s)');
            this.isConnecting = false;
            if (this.websocket) {
              this.websocket.close();
            }
            resolveOnce(false);
          }
        }, 15000);

        checkConnection();
      });
    } catch (error) {
      console.error('🔗 WebSocket: Error en connect:', error);
      this.isConnecting = false;
      this.connectionHealthy = false;
      return false;
    }
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect(): void {
    this.debugLog('🔗 WebSocket: Disconnecting...');
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.connectionHealthy = false;

    // Limpiar todos los timeouts e intervalos
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Cerrar conexión
    if (this.websocket) {
      this.websocket.close(1000, 'Desconexión manual');
      this.websocket = null;
    }
    
    this.connectionEstablished = false;
  }

  /**
   * Registra un listener para un tipo de mensaje específico
   */
  on(eventType: string, callback: WebSocketEventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(callback);
    // WebSocket: Listener registered for '${eventType}'
  }

  /**
   * Remueve un listener
   */
  off(eventType: string, callback: WebSocketEventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        // WebSocket: Listener removed for '${eventType}'
      }
    }
  }

  /**
   * Envía un mensaje al servidor
   */
  send(message: WebSocketMessage): boolean {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      // WebSocket: Message sent: ${message.type}
      return true;
    } else {
    console.error('🔗 WebSocket: No se puede enviar, conexión no disponible');
      return false;
    }
  }

  /**
   * Solicita estadísticas de conexión
   */
  requestConnectionStats(): void {
    this.send({ type: 'request_connection_stats' });
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.websocket) return 'closed';

    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return (
      this.connectionEstablished &&
      this.websocket?.readyState === WebSocket.OPEN
    );
  }

  /**
   * Verifica si la conexión está saludable
   */
  isHealthy(): boolean {
    return this.isConnected() && this.connectionHealthy;
  }

  /**
   * Obtiene estadísticas de la conexión
   */
  getConnectionStats(): {
    isConnected: boolean;
    isHealthy: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    lastPingTime: number;
    connectionState: string;
  } {
    return {
      isConnected: this.isConnected(),
      isHealthy: this.isHealthy(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastPingTime: this.lastPingTime,
      connectionState: this.getConnectionState()
    };
  }

  /**
   * Fuerza una reconexión inmediata
   */
  forceReconnect(): void {
    this.debugLog('🔗 WebSocket: Forcing reconnection...');
    if (this.websocket) {
      this.websocket.close(1000, 'Forced reconnection');
    }
    
    if (this.token) {
      setTimeout(() => {
        this.connect(this.token!);
      }, 1000);
    }
  }

  // Event Handlers Internos

  private handleOpen(event: Event): void {
    // WebSocket: Connection established
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Iniciar ping interval para keep-alive
    this.startPingInterval();

    // Emitir evento de conexión
    this.emit('connected', { timestamp: new Date().toISOString() });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.debugLog(`🔗 WebSocket: Message received: ${message.type}`);

      // Manejar tipos especiales de mensajes
      switch (message.type) {
        case 'connection_established':
          this.connectionEstablished = true;
          this.connectionHealthy = true;
          this.debugLog('🔗 WebSocket: Connection confirmed by server');
          break;

        case 'pong':
          // Respuesta a ping - mantener conexión viva
          this.pongReceived = true;
          this.connectionHealthy = true;
          break;

        case 'notification':
          this.debugLog('🔔 WebSocket: New notification received');
          this.emit('notification', message.data);
          break;

        case 'kpi_update':
          this.debugLog('📊 WebSocket: KPI update');
          this.emit('kpi_update', message.data);
          break;

        case 'connection_stats':
          this.debugLog('📈 WebSocket: Connection statistics');
          this.emit('connection_stats', message.data);
          break;

        case 'error':
          console.error('❌ WebSocket: Error del servidor:', message);
          this.connectionHealthy = false;
          this.emit('error', message);
          break;

        default:
          // Emitir evento genérico
          this.emit(message.type, message.data);
      }
    } catch (error) {
      console.error('🔗 WebSocket: Error parseando mensaje:', error);
      this.connectionHealthy = false;
    }
  }

  private handleClose(event: CloseEvent): void {
    // WebSocket: Connection closed ${event.code} ${event.reason}

    this.connectionEstablished = false;
    this.isConnecting = false;

    // Limpiar ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Emitir evento de desconexión
    this.emit('disconnected', {
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString(),
    });

    // Intentar reconexión automática si no fue manual
    if (event.code !== 1000 && this.token) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('🔗 WebSocket: Error de conexión:', event);
    this.emit('error', {
      message: 'Error de conexión WebSocket',
      timestamp: new Date().toISOString(),
    });
  }

  private startPingInterval(): void {
    // Enviar ping cada 30 segundos para mantener conexión viva
    this.pingInterval = setInterval(() => {
      if (!this.pongReceived) {
        // No recibimos pong del ping anterior - conexión puede estar perdida
        console.warn('🔗 WebSocket: No pong received, connection may be lost');
        this.connectionHealthy = false;
        
        // Forzar reconexión
        if (this.websocket) {
          this.websocket.close(1006, 'Ping timeout');
        }
        return;
      }

      // Marcar que esperamos un pong
      this.pongReceived = false;
      this.lastPingTime = Date.now();

      const pingSuccess = this.send({
        type: 'ping',
        timestamp: new Date().toISOString(),
      });

      if (!pingSuccess) {
        console.warn('🔗 WebSocket: Failed to send ping');
        this.connectionHealthy = false;
      }
    }, 30000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`🔗 WebSocket: Máximo de intentos de reconexión alcanzado (${this.maxReconnectAttempts})`);
      this.emit('max_reconnects_reached', { 
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts 
      });
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff con límite máximo
    const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const delay = Math.min(baseDelay, this.maxReconnectDelay);
    
    // Añadir jitter para evitar thundering herd
    const jitter = Math.random() * 1000;
    const finalDelay = delay + jitter;

    this.debugLog(`🔗 WebSocket: Retrying connection in ${Math.round(finalDelay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: finalDelay
    });

    this.reconnectTimeout = setTimeout(() => {
      if (this.token && !this.isConnected()) {
        this.debugLog(`🔗 WebSocket: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(this.token).then(success => {
          if (success) {
            this.debugLog('🔗 WebSocket: Reconnection successful');
            this.emit('reconnected', { attempt: this.reconnectAttempts });
          } else {
            this.debugWarn('🔗 WebSocket: Reconnection failed');
          }
        });
      }
    }, finalDelay);
  }

  private emit(eventType: string, data: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `🔗 WebSocket: Error en callback para '${eventType}':`,
            error
          );
        }
      });
    }
  }
}

// Instancia singleton del servicio WebSocket
export const websocketService = new WebSocketService();

// Types para export
export type {
  WebSocketMessage,
  NotificationData,
  ConnectionStats,
  WebSocketEventCallback,
};
