import { apiClient } from '@/lib/apiClient';

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  user: GoogleUser;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private isInitialized: boolean = false;

  constructor() {
    console.log('🔧 GoogleAuthService constructor called');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET');
    console.log('  - NEXT_PUBLIC_FRONTEND_URL:', process.env.NEXT_PUBLIC_FRONTEND_URL);
    console.log('  - NEXT_PUBLIC_GOOGLE_REDIRECT_URI:', process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI);
    
    // Use environment variables properly
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    this.redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/auth/google/callback`;
    
    console.log('  - this.clientId:', this.clientId ? `${this.clientId.substring(0, 10)}...` : 'NOT_SET');
    console.log('  - this.redirectUri:', this.redirectUri);
  }

  /**
   * Check if Google OAuth is properly configured
   */
  isConfigured(): boolean {
    return !!(this.clientId);
  }

  /**
   * Get Google OAuth configuration from backend
   */
  async getConfig(): Promise<GoogleAuthConfig> {
    try {
      const response = await apiClient.get('/auth/google/config');
      return response.data;
    } catch (error) {
      console.error('Error getting Google OAuth config:', error);
      throw error;
    }
  }

  /**
   * Generate Google OAuth URL for authentication
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GoogleAuthResponse> {
    try {
      const response = await apiClient.post('/auth/google/verify', {
        code,
        redirect_uri: this.redirectUri,
      });
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Verify Google ID token with backend
   */
  async verifyToken(idToken: string): Promise<GoogleAuthResponse> {
    try {
      const response = await apiClient.post('/auth/google/verify', {
        id_token: idToken,
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      throw error;
    }
  }

  /**
   * Initialize Google Sign-In
   */
  async initializeGoogleSignIn(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Google Sign-In can only be initialized in the browser');
    }

    if (this.isInitialized) {
      return;
    }

    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not properly configured');
    }

    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      const config = {
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      };
      
      window.google.accounts.id.initialize(config);
      this.isInitialized = true;
      return;
    }

    // Load Google Identity Services script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google?.accounts?.id) {
          const config = {
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
          };
          
          window.google.accounts.id.initialize(config);
          this.isInitialized = true;
          resolve();
        } else {
          reject(new Error('Google Identity Services API not available'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services script'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Render Google Sign-In button
   */
  renderSignInButton(elementId: string): boolean {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      console.error('Google Identity Services not available');
      return false;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id '${elementId}' not found`);
      return false;
    }

    try {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
      return true;
    } catch (error) {
      console.error('Error rendering Google Sign-In button:', error);
      return false;
    }
  }

  /**
   * Prompt Google One Tap
   */
  promptOneTap(): void {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      console.error('Google Identity Services not available');
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap not displayed or skipped');
        }
      });
    } catch (error) {
      console.error('Error prompting Google One Tap:', error);
    }
  }

  /**
   * Handle credential response from Google
   */
  private async handleCredentialResponse(response: any) {
    try {
      console.log('🔐 Received Google credential response');
      
      if (!response || !response.credential) {
        throw new Error('Invalid credential response from Google');
      }
      
      const result = await this.verifyToken(response.credential);
      window.dispatchEvent(new CustomEvent('googleAuthSuccess', { detail: result }));
    } catch (error) {
      console.error('❌ Error handling Google credential response:', error);
      window.dispatchEvent(new CustomEvent('googleAuthError', { detail: error }));
    }
  }

  /**
   * Sign out from Google
   */
  signOut(): void {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  /**
   * Get current configuration for debugging
   */
  getDebugInfo(): any {
    return {
      clientId: this.clientId ? `${this.clientId.substring(0, 10)}...` : 'NOT_SET',
      redirectUri: this.redirectUri,
      frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL,
      isConfigured: this.isConfigured(),
      isInitialized: this.isInitialized,
      hasGoogleScript: typeof window !== 'undefined' && !!window.google?.accounts?.id,
    };
  }
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          disableAutoSelect: () => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export const googleAuthService = new GoogleAuthService();