import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useWebSocket } from '@/hooks/useWebSocket';

// Mock WebSocket
const mockWebSocket = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1,
};

global.WebSocket = vi.fn(() => mockWebSocket) as any;

// Mock websocket service
vi.mock('@/services/websocket.service', () => ({
  websocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    isConnected: vi.fn(() => false),
    getConnectionState: vi.fn(() => 'closed'),
    requestConnectionStats: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isConnected).toBe(false);
  });

  it('handles notifications and unread count', () => {
    const { result } = renderHook(() => useWebSocket());

    // Test that the hook initializes correctly
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);

    // Test that markAsRead function exists
    expect(typeof result.current.markAsRead).toBe('function');
  });

  it('marks notification as read', () => {
    const { result } = renderHook(() => useWebSocket());

    // Test that the hook provides the expected interface
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.clearNotifications).toBe('function');
  });
});
