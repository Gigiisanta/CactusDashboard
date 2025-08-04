// Interfaces para Ideas Manager
export interface Idea {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateIdeaRequest {
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
}

// Interfaces para Content Matrix
export interface ContentMatrix {
  id: string;
  title: string;
  category: 'educational' | 'market_analysis' | 'product_review' | 'news' | 'tutorial';
  content_type: 'video' | 'article' | 'infographic' | 'podcast';
  target_audience: string;
  keywords?: string[];
  status: 'draft' | 'review' | 'approved' | 'published';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateContentMatrixRequest {
  title: string;
  category: 'educational' | 'market_analysis' | 'product_review' | 'news' | 'tutorial';
  content_type: 'video' | 'article' | 'infographic' | 'podcast';
  target_audience: string;
  keywords?: string[];
  status: 'draft' | 'review' | 'approved' | 'published';
}

// Interfaces para Video Slots
export interface VideoSlot {
  id: string;
  title: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin';
  scheduled_date: string;
  duration_minutes?: number;
  description?: string;
  tags?: string[];
  status: 'planned' | 'recorded' | 'edited' | 'published';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateVideoSlotRequest {
  title: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin';
  scheduled_date: string;
  duration_minutes?: number;
  description?: string;
  tags?: string[];
  status: 'planned' | 'recorded' | 'edited' | 'published';
}

// Interfaces para Library
export interface LibraryItem {
  id: string;
  title: string;
  type: 'book' | 'podcast' | 'video' | 'course' | 'article';
  author?: string;
  url?: string;
  description?: string;
  tags?: string[];
  rating?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateLibraryItemRequest {
  title: string;
  type: 'book' | 'podcast' | 'video' | 'course' | 'article';
  author?: string;
  url?: string;
  description?: string;
  tags?: string[];
  rating?: number;
}

// Interfaces para External Links
export interface ExternalLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  category: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateExternalLinkRequest {
  name: string;
  url: string;
  description?: string;
  category: string;
  icon?: string;
}

class CactusService {
  private baseUrl = '/api/v1/cactus';

  // Ideas Manager Methods
  async getIdeas(): Promise<Idea[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ideas`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Error fetching ideas: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching ideas:', error);
      throw error;
    }
  }

  async createIdea(data: CreateIdeaRequest): Promise<Idea> {
    try {
      const response = await fetch(`${this.baseUrl}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Error creating idea: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating idea:', error);
      throw error;
    }
  }

  async updateIdea(id: string, data: Partial<CreateIdeaRequest>): Promise<Idea> {
    try {
      const response = await fetch(`${this.baseUrl}/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Error updating idea: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating idea:', error);
      throw error;
    }
  }

  async deleteIdea(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/ideas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Error deleting idea: ${response.statusText}`);
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  }

  // Content Matrix Methods
  async getContentMatrix(): Promise<ContentMatrix[]> {
    try {
      const response = await fetch(`${this.baseUrl}/content-matrix`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Error fetching content matrix: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching content matrix:', error);
      throw error;
    }
  }

  async createContentMatrix(data: CreateContentMatrixRequest): Promise<ContentMatrix> {
    try {
      const response = await fetch(`${this.baseUrl}/content-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Error creating content matrix: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating content matrix:', error);
      throw error;
    }
  }

  // Video Slots Methods
  async getVideoSlots(): Promise<VideoSlot[]> {
    try {
      const response = await fetch(`${this.baseUrl}/video-slots`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Error fetching video slots: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching video slots:', error);
      throw error;
    }
  }

  async createVideoSlot(data: CreateVideoSlotRequest): Promise<VideoSlot> {
    try {
      const response = await fetch(`${this.baseUrl}/video-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Error creating video slot: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating video slot:', error);
      throw error;
    }
  }

  // Library Methods
  async getLibraryItems(): Promise<LibraryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/library`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Error fetching library items: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching library items:', error);
      throw error;
    }
  }

  async createLibraryItem(data: CreateLibraryItemRequest): Promise<LibraryItem> {
    try {
      const response = await fetch(`${this.baseUrl}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Error creating library item: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating library item:', error);
      throw error;
    }
  }

  // External Links Methods
  async getExternalLinks(): Promise<ExternalLink[]> {
    try {
      const response = await fetch(`${this.baseUrl}/external-links`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Error fetching external links: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching external links:', error);
      throw error;
    }
  }

  async createExternalLink(data: CreateExternalLinkRequest): Promise<ExternalLink> {
    try {
      const response = await fetch(`${this.baseUrl}/external-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Error creating external link: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating external link:', error);
      throw error;
    }
  }
}

export const cactusService = new CactusService();