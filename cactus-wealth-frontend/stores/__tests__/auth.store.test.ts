import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../auth.store';
import { UserRole } from '@/types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods
const consoleMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('Auth Store', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    is_active: true,
    role: UserRole.JUNIOR_ADVISOR,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    clients: [],
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(consoleMock.log);
    jest.spyOn(console, 'error').mockImplementation(consoleMock.error);
    jest.spyOn(console, 'warn').mockImplementation(consoleMock.warn);

    // Reset store state
    act(() => {
      useAuthStore.getState().clearStorage();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('provides all required actions', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.setUser).toBe('function');
      expect(typeof result.current.clearStorage).toBe('function');
    });
  });

  describe('Login Action', () => {
    it('sets user and token on login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('logs successful login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(consoleMock.log).toHaveBeenCalledWith('🔒 Auth store: Login successful');
    });

    it('persists user and token to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      // Zustand persist middleware should call setItem
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('handles multiple login calls correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      const secondUser = { ...mockUser, id: 2, username: 'seconduser' };
      const secondToken = 'second-token';

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      act(() => {
        result.current.login(secondUser, secondToken);
      });

      expect(result.current.user).toEqual(secondUser);
      expect(result.current.token).toBe(secondToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Logout Action', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.login(mockUser, mockToken);
      });
    });

    it('clears user and token on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('logs logout action', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(consoleMock.log).toHaveBeenCalledWith('🔒 Auth store: Logout - clearing state');
    });

    it('removes data from localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cactus-auth-storage');
      expect(consoleMock.log).toHaveBeenCalledWith('🔒 Auth store: localStorage cleared');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(consoleMock.error).toHaveBeenCalledWith('Error clearing localStorage:', expect.any(Error));
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('works when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() => useAuthStore());

      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('SetUser Action', () => {
    it('updates user while preserving other state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      const updatedUser = { ...mockUser, username: 'UpdatedUser' };

      act(() => {
        result.current.setUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('can set user when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('persists updated user to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      const updatedUser = { ...mockUser, username: 'UpdatedUser' };

      act(() => {
        result.current.setUser(updatedUser);
      });

      // Should trigger persistence
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('ClearStorage Action', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.login(mockUser, mockToken);
      });
    });

    it('clears all state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearStorage();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('logs clear storage action', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearStorage();
      });

      expect(consoleMock.log).toHaveBeenCalledWith('🔒 Auth store: Manually clearing storage');
    });

    it('removes data from localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearStorage();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cactus-auth-storage');
    });

    it('works when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() => useAuthStore());

      expect(() => {
        act(() => {
          result.current.clearStorage();
        });
      }).not.toThrow();

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('Persistence', () => {
    it('only persists user and token (not isAuthenticated)', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      // Check that setItem was called with the correct structure
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      
      if (lastCall) {
        const [key, value] = lastCall;
        expect(key).toBe('cactus-auth-storage');
        
        const parsedValue = JSON.parse(value);
        expect(parsedValue.state).toHaveProperty('user');
        expect(parsedValue.state).toHaveProperty('token');
        expect(parsedValue.state).not.toHaveProperty('isAuthenticated');
      }
    });

    it('rehydrates isAuthenticated based on token existence', () => {
      // Mock stored data
      const storedData = {
        state: {
          user: mockUser,
          token: mockToken,
        },
        version: 0,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

      // Create a new store instance to trigger rehydration
      const { result } = renderHook(() => useAuthStore());

      // The store should rehydrate and set isAuthenticated to true
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('logs token rehydration', () => {
      const storedData = {
        state: {
          user: mockUser,
          token: mockToken,
        },
        version: 0,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

      renderHook(() => useAuthStore());

      expect(consoleMock.log).toHaveBeenCalledWith('🔒 Auth store: Token rehydrated from storage');
    });

    it('handles rehydration without token', () => {
      const storedData = {
        state: {
          user: mockUser,
          token: null,
        },
        version: 0,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles malformed localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      expect(() => {
        renderHook(() => useAuthStore());
      }).not.toThrow();

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles localStorage access errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        renderHook(() => useAuthStore());
      }).not.toThrow();

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Store Integration', () => {
    it('maintains state consistency across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      act(() => {
        result1.current.login(mockUser, mockToken);
      });

      expect(result2.current.user).toEqual(mockUser);
      expect(result2.current.token).toBe(mockToken);
      expect(result2.current.isAuthenticated).toBe(true);
    });

    it('updates all subscribers when state changes', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      act(() => {
        result1.current.login(mockUser, mockToken);
      });

      act(() => {
        result2.current.logout();
      });

      expect(result1.current.user).toBeNull();
      expect(result1.current.token).toBeNull();
      expect(result1.current.isAuthenticated).toBe(false);
    });

    it('provides direct store access via getState', () => {
      act(() => {
        useAuthStore.getState().login(mockUser, mockToken);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('allows direct state updates via setState', () => {
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        });
      });

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles null user in setUser', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      act(() => {
        // @ts-ignore - testing edge case
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles empty string token', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, '');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles undefined values gracefully', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        // @ts-ignore - testing edge case
        result.current.login(undefined, undefined);
      });

      expect(result.current.user).toBeUndefined();
      expect(result.current.token).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useAuthStore();
      });

      const initialRenderCount = renderCount;

      // Multiple calls to the same action should not cause re-renders
      act(() => {
        result.current.login(mockUser, mockToken);
        result.current.login(mockUser, mockToken);
        result.current.login(mockUser, mockToken);
      });

      // Should only re-render once for the state change
      expect(renderCount).toBe(initialRenderCount + 1);
    });

    it('handles rapid state changes', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.login({ ...mockUser, id: i }, `token-${i}`);
        }
      });

      expect(result.current.user?.id).toBe(99);
      expect(result.current.token).toBe('token-99');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});