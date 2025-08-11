import { renderHook, act } from '@testing-library/react';
import { useWebSocket, useNotifications } from '../useWebSocket';
import { websocketService } from '../../services/websocket.service';

// Mock the websocket service
jest.mock('../../services/websocket.service', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(),
    getConnectionState: jest.fn(),
    requestConnectionStats: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock browser Notification API
const mockNotification = jest.fn();
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  configurable: true,
});

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  configurable: true,
});

Object.defineProperty(Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
  configurable: true,
});

const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Default mock implementations
    mockWebsocketService.isConnected.mockReturnValue(false);
    mockWebsocketService.getConnectionState.mockReturnValue('closed');
    mockWebsocketService.connect.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('closed');
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.connectionStats).toBeNull();
    });

    it('should sync with websocket service initial state', () => {
      mockWebsocketService.isConnected.mockReturnValue(true);
      mockWebsocketService.getConnectionState.mockReturnValue('open');

      const { result } = renderHook(() => useWebSocket());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('open');
    });
  });

  describe('Event Listeners Registration', () => {
    it('should register all event listeners on mount', () => {
      renderHook(() => useWebSocket());

      expect(mockWebsocketService.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWebsocketService.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWebsocketService.on).toHaveBeenCalledWith('notification', expect.any(Function));
      expect(mockWebsocketService.on).toHaveBeenCalledWith('connection_stats', expect.any(Function));
      expect(mockWebsocketService.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should unregister all event listeners on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket());

      unmount();

      expect(mockWebsocketService.off).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWebsocketService.off).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWebsocketService.off).toHaveBeenCalledWith('notification', expect.any(Function));
      expect(mockWebsocketService.off).toHaveBeenCalledWith('connection_stats', expect.any(Function));
      expect(mockWebsocketService.off).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      mockWebsocketService.connect.mockResolvedValue(true);
      const { result } = renderHook(() => useWebSocket());

      let connectResult: boolean;
      await act(async () => {
        connectResult = await result.current.connect('test-token');
      });

      expect(connectResult!).toBe(true);
      expect(mockWebsocketService.connect).toHaveBeenCalledWith('test-token');
    });

    it('should handle connection failure', async () => {
      mockWebsocketService.connect.mockResolvedValue(false);
      const { result } = renderHook(() => useWebSocket());

      let connectResult: boolean;
      await act(async () => {
        connectResult = await result.current.connect('test-token');
      });

      expect(connectResult!).toBe(false);
      expect(result.current.connectionState).toBe('closed');
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle connection error', async () => {
      const error = new Error('Connection failed');
      mockWebsocketService.connect.mockRejectedValue(error);
      const { result } = renderHook(() => useWebSocket());

      let connectResult: boolean;
      await act(async () => {
        connectResult = await result.current.connect('test-token');
      });

      expect(connectResult!).toBe(false);
      expect(result.current.connectionState).toBe('closed');
      expect(result.current.isConnected).toBe(false);
    });

    it('should disconnect successfully', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.disconnect();
      });

      expect(mockWebsocketService.disconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('closed');
    });

    it('should handle disconnect error gracefully', () => {
      mockWebsocketService.disconnect.mockImplementation(() => {
        throw new Error('Disconnect failed');
      });
      const { result } = renderHook(() => useWebSocket());

      expect(() => {
        act(() => {
          result.current.disconnect();
        });
      }).not.toThrow();
    });
  });

  describe('Event Handlers', () => {
    it('should handle connected event', () => {
      let connectedHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'connected') {
          connectedHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        connectedHandler!();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('open');
    });

    it('should handle disconnected event', () => {
      let disconnectedHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'disconnected') {
          disconnectedHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        disconnectedHandler!({});
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('closed');
    });

    it('should handle error event', () => {
      let errorHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        errorHandler!(new Error('Test error'));
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('closed');
    });

    it('should handle connection stats event', () => {
      let statsHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'connection_stats') {
          statsHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());
      const mockStats = {
        connected_at: '2024-01-01T00:00:00Z',
        messages_sent: 10,
        messages_received: 15,
        reconnections: 2,
      };

      act(() => {
        statsHandler!(mockStats);
      });

      expect(result.current.connectionStats).toEqual(mockStats);
    });
  });

  describe('Notification Handling', () => {
    it('should handle new notifications with debouncing', () => {
      let notificationHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'notification') {
          notificationHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());
      const mockNotification = {
        id: 1,
        message: 'Test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      act(() => {
        notificationHandler!(mockNotification);
        jest.advanceTimersByTime(100); // Advance debounce timer
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toEqual(mockNotification);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should prevent duplicate notifications', () => {
      let notificationHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'notification') {
          notificationHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());
      const mockNotification = {
        id: 1,
        message: 'Test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      act(() => {
        notificationHandler!(mockNotification);
        jest.advanceTimersByTime(100);
      });

      act(() => {
        notificationHandler!(mockNotification); // Same notification
        jest.advanceTimersByTime(100);
      });

      expect(result.current.notifications).toHaveLength(1);
    });

    it('should limit notifications to 50', () => {
      let notificationHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'notification') {
          notificationHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());

      // Add 60 notifications one by one to respect debouncing
      // Feed notifications sequentially respecting debounce window
      for (let i = 1; i <= 60; i++) {
        act(() => {
          notificationHandler!({
            id: i,
            message: `Notification ${i}`,
            is_read: false,
            created_at: '2024-01-01T00:00:00Z',
          });
          jest.advanceTimersByTime(120);
        });
      }

      expect(result.current.notifications).toHaveLength(50);
      expect(result.current.notifications[0].id).toBe(60); // Most recent first
    });

    it('should mark notification as read', () => {
      let notificationHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'notification') {
          notificationHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());

      // Add a notification first
      act(() => {
        notificationHandler!({
          id: 1,
          message: 'Test notification',
          is_read: false,
          created_at: '2024-01-01T00:00:00Z',
        });
        jest.advanceTimersByTime(100);
      });

      // Mark as read
      act(() => {
        result.current.markAsRead(1);
      });

      expect(result.current.notifications[0].is_read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should clear all notifications', () => {
      let notificationHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'notification') {
          notificationHandler = handler;
        }
      });

      const { result } = renderHook(() => useWebSocket());

      // Add notifications first
      act(() => {
        notificationHandler!({
          id: 1,
          message: 'Test 1',
          is_read: false,
          created_at: '2024-01-01T00:00:00Z',
        });
        notificationHandler!({
          id: 2,
          message: 'Test 2',
          is_read: true,
          created_at: '2024-01-01T00:00:00Z',
        });
        jest.advanceTimersByTime(100);
      });

      // Clear notifications
      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Stats Request', () => {
    it('should request stats when connected', () => {
      mockWebsocketService.isConnected.mockReturnValue(true);
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.requestStats();
      });

      expect(mockWebsocketService.requestConnectionStats).toHaveBeenCalled();
    });

    it('should not request stats when disconnected', () => {
      mockWebsocketService.isConnected.mockReturnValue(false);
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.requestStats();
      });

      expect(mockWebsocketService.requestConnectionStats).not.toHaveBeenCalled();
    });
  });

  describe('Browser Notifications', () => {
    it('should show browser notification when permission granted', () => {
      let notificationHandler: Function;
      mockWebsocketService.on.mockImplementation((event, handler) => {
        if (event === 'notification') {
          notificationHandler = handler;
        }
      });

      renderHook(() => useWebSocket());
      const mockNotificationData = {
        id: 1,
        message: 'Test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      act(() => {
        notificationHandler!(mockNotificationData);
        jest.advanceTimersByTime(100);
      });

      expect(mockNotification).toHaveBeenCalledWith(
        'Nueva notificación - Cactus Wealth',
        {
          body: 'Test notification',
          icon: '/favicon.ico',
          tag: 'notification-1',
        }
      );
    });
  });
});

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebsocketService.on.mockClear();
    mockWebsocketService.off.mockClear();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should register and unregister notification listener', () => {
    const { unmount } = renderHook(() => useNotifications());

    expect(mockWebsocketService.on).toHaveBeenCalledWith('notification', expect.any(Function));

    unmount();

    expect(mockWebsocketService.off).toHaveBeenCalledWith('notification', expect.any(Function));
  });

  it('should handle notifications and limit to 20', () => {
    let notificationHandler: Function;
    mockWebsocketService.on.mockImplementation((event, handler) => {
      if (event === 'notification') {
        notificationHandler = handler;
      }
    });

    const { result } = renderHook(() => useNotifications());

    // Add 25 notifications
    act(() => {
      for (let i = 1; i <= 25; i++) {
        notificationHandler!({
          id: i,
          message: `Notification ${i}`,
          is_read: false,
          created_at: '2024-01-01T00:00:00Z',
        });
      }
    });

    expect(result.current.notifications).toHaveLength(20);
    expect(result.current.notifications[0].id).toBe(25); // Most recent first
  });

  it('should mark notification as read', () => {
    let notificationHandler: Function;
    mockWebsocketService.on.mockImplementation((event, handler) => {
      if (event === 'notification') {
        notificationHandler = handler;
      }
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      notificationHandler!({
        id: 1,
        message: 'Test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    expect(result.current.unreadCount).toBe(1);

    act(() => {
      result.current.markAsRead(1);
    });

    expect(result.current.notifications[0].is_read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should clear all notifications', () => {
    let notificationHandler: Function;
    mockWebsocketService.on.mockImplementation((event, handler) => {
      if (event === 'notification') {
        notificationHandler = handler;
      }
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      notificationHandler!({
        id: 1,
        message: 'Test notification',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});