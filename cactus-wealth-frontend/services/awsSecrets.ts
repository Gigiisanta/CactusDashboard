import { apiClient } from '@/lib/api';

export interface SecureCredential {
  id: string;
  name: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCredentialRequest {
  name: string;
  description?: string;
  category: string;
  username: string;
  password: string;
  additional_data?: Record<string, any>;
}

export interface UpdateCredentialRequest {
  name?: string;
  description?: string;
  category?: string;
  username?: string;
  password?: string;
  additional_data?: Record<string, any>;
}

export interface CredentialValue {
  username: string;
  password: string;
  additional_data?: Record<string, any>;
}

class AwsSecretsService {
  private baseUrl = '/api/v1/cactus/secure-credentials';

  async getCredentials(): Promise<SecureCredential[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error fetching credentials: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching credentials:', error);
      throw error;
    }
  }

  async getCredentialValue(id: string): Promise<CredentialValue> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/value`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error fetching credential value: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching credential value:', error);
      throw error;
    }
  }

  async createCredential(data: CreateCredentialRequest): Promise<SecureCredential> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error creating credential: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  async updateCredential(id: string, data: UpdateCredentialRequest): Promise<SecureCredential> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error updating credential: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  }

  async deleteCredential(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error deleting credential: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  }
}

export const awsSecretsService = new AwsSecretsService();