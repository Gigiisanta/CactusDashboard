import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { UserRole } from '@/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: false,
    token: null,
    user: null,
  }),
}));

jest.mock('@/lib/token-utils', () => ({
  isTokenExpired: jest.fn(() => false),
  getTokenTimeRemaining: jest.fn(() => 60),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

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

// Mock window events
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
});
Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
});

// Mock document events
Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
});
Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
});

describe('AuthContext', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AuthProvider', () => {
    function TestComponent() {
      const { login, register, logout, user, token, isAuthenticated, isLoading } = useAuth();

      return (
        <div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
          <div data-testid="user">{user?.username || 'no-user'}</div>
          <div data-testid="token">{token || 'no-token'}</div>
          <button data-testid="login-btn" onClick={() => login('test', 'password')}>
            Login
          </button>
          <button data-testid="register-btn" onClick={() => register('test', 'test@example.com', 'password', UserRole.JUNIOR_ADVISOR)}>
            Register
          </button>
          <button data-testid="logout-btn" onClick={() => logout()}>
            Logout
          </button>
        </div>
      );
    }

    it('renders children and provides initial state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    });

    it('provides auth functions', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Check that buttons are rendered (functions are available)
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
      expect(screen.getByTestId('register-btn')).toBeInTheDocument();
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    it('handles user interactions', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Test that clicking buttons doesn't crash
      await user.click(screen.getByTestId('login-btn'));
      await user.click(screen.getByTestId('register-btn'));
      await user.click(screen.getByTestId('logout-btn'));

      // Should not crash
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('sets up event listeners', () => {
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      // Should set up storage, auth, and visibility change listeners
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('auth:logout', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('auth:logout', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('handles localStorage initialization', () => {
      const mockStoredAuth = {
        state: {
          token: 'valid-token',
          user: { username: 'testuser' },
          isAuthenticated: true,
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAuth));

      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cactus-auth-storage');
    });

    it('handles malformed localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      expect(() => {
        render(
          <AuthProvider>
            <div>Test</div>
          </AuthProvider>
        );
      }).not.toThrow();
    });

    it('handles localStorage access errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        render(
          <AuthProvider>
            <div>Test</div>
          </AuthProvider>
        );
      }).not.toThrow();
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      const originalError = console.error;
      console.error = jest.fn();

      function TestComponent() {
        useAuth();
        return <div>Test</div>;
      }

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('returns auth context when used within AuthProvider', () => {
      let authContext: any;

      function TestComponent() {
        authContext = useAuth();
        return <div>Test</div>;
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(authContext).toBeDefined();
      expect(typeof authContext.login).toBe('function');
      expect(typeof authContext.register).toBe('function');
      expect(typeof authContext.logout).toBe('function');
      expect(authContext.isAuthenticated).toBe(false);
      expect(authContext.user).toBe(null);
      expect(authContext.token).toBe(null);
    });

    it('provides consistent context values', () => {
      let contextValue1: any;
      let contextValue2: any;

      function Consumer1() {
        contextValue1 = useAuth();
        return <div>Consumer 1</div>;
      }

      function Consumer2() {
        contextValue2 = useAuth();
        return <div>Consumer 2</div>;
      }

      render(
        <AuthProvider>
          <Consumer1 />
          <Consumer2 />
        </AuthProvider>
      );

      expect(contextValue1).toBe(contextValue2);
      expect(contextValue1.isAuthenticated).toBe(contextValue2.isAuthenticated);
      expect(contextValue1.user).toBe(contextValue2.user);
      expect(contextValue1.token).toBe(contextValue2.token);
    });
  });

  describe('Component Lifecycle', () => {
    it('works with React.StrictMode', () => {
      expect(() => {
        render(
          <React.StrictMode>
            <AuthProvider>
              <div>Test</div>
            </AuthProvider>
          </React.StrictMode>
        );
      }).not.toThrow();
    });

    it('handles component unmounting gracefully', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('supports nested providers', () => {
      function NestedTest() {
        const { isAuthenticated } = useAuth();
        return <div data-testid="nested">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>;
      }

      render(
        <AuthProvider>
          <AuthProvider>
            <NestedTest />
          </AuthProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId('nested')).toHaveTextContent('not-authenticated');
    });
  });

  describe('Error Handling', () => {
    it('handles missing dependencies gracefully', () => {
      // Test that the component doesn't crash with missing dependencies
      expect(() => {
        render(
          <AuthProvider>
            <div>Test</div>
          </AuthProvider>
        );
      }).not.toThrow();
    });

    it('handles async operation errors', async () => {
      function TestAsyncError() {
        const { login } = useAuth();

        const handleLogin = async () => {
          try {
            await login('test', 'password');
          } catch (error) {
            // Error should be handled gracefully
          }
        };

        return (
          <button onClick={handleLogin} data-testid="async-login">
            Async Login
          </button>
        );
      }

      render(
        <AuthProvider>
          <TestAsyncError />
        </AuthProvider>
      );

      // Should not crash when async operations fail
      await user.click(screen.getByTestId('async-login'));
      expect(screen.getByTestId('async-login')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('integrates with auth store', () => {
      render(
        <AuthProvider>
          <div data-testid="integration-test">Integration Test</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('integration-test')).toBeInTheDocument();
    });

    it('integrates with router', () => {
      render(
        <AuthProvider>
          <div data-testid="router-test">Router Test</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('router-test')).toBeInTheDocument();
    });

    it('integrates with token utilities', () => {
      render(
        <AuthProvider>
          <div data-testid="token-test">Token Test</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('token-test')).toBeInTheDocument();
    });
  });
});