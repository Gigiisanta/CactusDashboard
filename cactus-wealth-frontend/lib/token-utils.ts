/**
 * Token utilities for JWT handling and validation
 */

interface JWTPayload {
  sub: string; // subject (email)
  exp: number; // expiration timestamp
  iat?: number; // issued at
}

/**
 * Decode JWT token without verification (for expiry check only)
 */
export function decodeJWT(token: string | null | undefined): JWTPayload | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired or will expire soon
 * @param token JWT token
 * @param bufferMinutes Minutes before expiry to consider "expired" (default: 5)
 */
export function isTokenExpired(
  token: string,
  bufferMinutes: number = 5
): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiryWithBuffer = payload.exp - bufferMinutes * 60;

  return now >= expiryWithBuffer;
}

/**
 * Get token expiry date
 */
export function getTokenExpiry(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Get time remaining until token expires (in minutes)
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;

  return Math.max(0, Math.floor(remaining / 60));
}

export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('auth_token');
}

export function saveTokenToStorage(token: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem('auth_token', token);
}

export function removeTokenFromStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem('auth_token');
}
