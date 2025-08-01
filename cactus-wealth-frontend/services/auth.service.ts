/**
 * 🚀 CLEAN ARCHITECTURE: Auth Service
 *
 * Centralized service for all authentication-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { Token, LoginCredentials, UserCreate } from '@/types';
import { apiClient } from '@/lib/api';

export class AuthService {
  /**
   * User login
   */
  static async login(credentials: LoginCredentials): Promise<Token> {
    return apiClient.login(credentials);
  }

  /**
   * Google OAuth token verification
   */
  static async verifyGoogleToken(accessToken: string): Promise<Token> {
    return apiClient.verifyGoogleToken(accessToken);
  }

  /**
   * User registration
   */
  static async register(userCreate: UserCreate): Promise<any> {
    return apiClient.register(userCreate);
  }
}
