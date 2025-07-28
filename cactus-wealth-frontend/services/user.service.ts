/**
 * 🚀 CLEAN ARCHITECTURE: User Service
 *
 * Centralized service for all user-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { UserWithStats, LinkAdvisorRequest, UnlinkAdvisorRequest } from '@/types';
import { apiClient } from '@/lib/api';

export class UserService {
  /**
   * Get advisors with their statistics for a manager
   */
  static async getAdvisorsWithStats(): Promise<UserWithStats[]> {
    const response = await fetch('/api/v1/users/advisors', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch advisors');
    }

    return response.json();
  }

  /**
   * Link an advisor to the current manager
   */
  static async linkAdvisor(advisorId: number): Promise<void> {
    const response = await fetch('/api/v1/users/advisors/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ advisor_id: advisorId }),
    });

    if (!response.ok) {
      throw new Error('Failed to link advisor');
    }
  }

  /**
   * Unlink an advisor from the current manager
   */
  static async unlinkAdvisor(advisorId: number): Promise<void> {
    const response = await fetch('/api/v1/users/advisors/unlink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ advisor_id: advisorId }),
    });

    if (!response.ok) {
      throw new Error('Failed to unlink advisor');
    }
  }

  /**
   * Get unassigned advisors
   */
  static async getUnassignedAdvisors(): Promise<UserWithStats[]> {
    const response = await fetch('/api/v1/users/advisors/unassigned', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unassigned advisors');
    }

    return response.json();
  }
}