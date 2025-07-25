import { isTokenExpired, getTokenFromStorage, saveTokenToStorage, removeTokenFromStorage } from '@/lib/token-utils';

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

describe('Token Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MzQ1Njc4OTl9.signature';
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('returns false for valid token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      // Construir un JWT válido con exp futuro
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ exp: futureTime }));
      const validToken = `${header}.${payload}.signature`;
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('returns true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
      expect(isTokenExpired('')).toBe(true);
      expect(isTokenExpired(null as any)).toBe(true);
      expect(isTokenExpired(undefined as any)).toBe(true);
    });
  });

  describe('getTokenFromStorage', () => {
    it('retrieves token from localStorage', () => {
      const mockToken = 'test-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      expect(getTokenFromStorage()).toBe(mockToken);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('returns null when no token in storage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(getTokenFromStorage()).toBeNull();
    });
  });

  describe('saveTokenToStorage', () => {
    it('saves token to localStorage', () => {
      const mockToken = 'test-token';

      saveTokenToStorage(mockToken);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_token',
        mockToken
      );
    });
  });

  describe('removeTokenFromStorage', () => {
    it('removes token from localStorage', () => {
      removeTokenFromStorage();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });
});
