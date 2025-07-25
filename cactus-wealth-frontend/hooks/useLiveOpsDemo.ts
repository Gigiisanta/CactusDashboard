import { useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface DemoLog {
  id: string;
  message: string;
  timestamp: Date;
}

export function useLiveOpsDemo() {
  const {
    isConnected,
    connectionState,
    notifications,
    unreadCount,
    connectionStats,
    connect,
    disconnect,
    requestStats,
    markAsRead,
    clearNotifications,
  } = useWebSocket();

  const [customMessage, setCustomMessage] = useState('');
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [demoLogs, setDemoLogs] = useState<DemoLog[]>([]);

  const addLog = useCallback((message: string) => {
    const newLog: DemoLog = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
    };
    setDemoLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep only last 50 logs
  }, []);

  const handleToggleConnection = useCallback((token?: string) => {
    if (isConnected) {
      disconnect();
    } else if (token) {
      connect(token);
    }
  }, [isConnected, connect, disconnect]);

  return {
    isConnected,
    connectionState,
    notifications,
    unreadCount,
    connectionStats,
    connect,
    disconnect,
    requestStats,
    markAsRead,
    clearNotifications,
    customMessage,
    setCustomMessage,
    isCreatingNotification,
    setIsCreatingNotification,
    demoLogs,
    addLog,
    handleToggleConnection,
    setDemoLogs,
  };
}