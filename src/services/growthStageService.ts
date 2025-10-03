// Define the GrowthStage type directly since we can't generate types right now
export interface GrowthStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  crop_type_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  // Add any additional fields that exist in your growth_stages table
}

export interface CreateGrowthStageDTO extends Omit<GrowthStage, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {
  // Additional fields for creation if needed
}

export interface UpdateGrowthStageDTO extends Partial<Omit<GrowthStage, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'created_by'>> {
  // Fields that can be updated
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to handle API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('supabase.auth.token');
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  if (token) {
    headers.set('Authorization', `Bearer ${JSON.parse(token).access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export const GrowthStageService = {
  /**
   * Get all growth stages, optionally filtered by crop type
   * @param options Optional parameters for filtering and pagination
   */
  async getStages(options?: {
    cropTypeId?: string;
    organizationId?: string;
  }): Promise<GrowthStage[]> {
    const params = new URLSearchParams();
    
    if (options?.cropTypeId) {
      params.append('cropTypeId', options.cropTypeId);
    }
    
    if (options?.organizationId) {
      params.append('organizationId', options.organizationId);
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    
    try {
      return await apiRequest<GrowthStage[]>(`/api/growth/stages${query}`);
    } catch (error) {
      console.error('Error fetching growth stages:', error);
      throw error;
    }
  },

  /**
   * Get a single growth stage by ID
   * @param stageId The ID of the growth stage to retrieve
   */
  async getStage(stageId: string): Promise<GrowthStage> {
    if (!stageId) {
      throw new Error('Stage ID is required');
    }
    
    try {
      return await apiRequest<GrowthStage>(`/api/growth/stages/${stageId}`);
    } catch (error) {
      console.error(`Error fetching growth stage ${stageId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new growth stage
   * @param data The growth stage data to create
   */
  async createStage(data: CreateGrowthStageDTO): Promise<GrowthStage> {
    if (!data.organization_id) {
      throw new Error('Organization ID is required');
    }
    
    try {
      return await apiRequest<GrowthStage>('/api/growth/stages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error creating growth stage:', error);
      throw error;
    }
  },

  /**
   * Update an existing growth stage
   * @param stageId The ID of the growth stage to update
   * @param updates The fields to update
   */
  async updateStage(
    stageId: string,
    updates: UpdateGrowthStageDTO
  ): Promise<GrowthStage> {
    if (!stageId) {
      throw new Error('Stage ID is required');
    }
    
    try {
      return await apiRequest<GrowthStage>(`/api/growth/stages/${stageId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          updated_by: 'current-user-id' // This should be set by the server based on auth
        }),
      });
    } catch (error) {
      console.error(`Error updating growth stage ${stageId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a growth stage
   * @param stageId The ID of the growth stage to delete
   */
  async deleteStage(stageId: string): Promise<void> {
    if (!stageId) {
      throw new Error('Stage ID is required');
    }
    
    try {
      await apiRequest<void>(`/api/growth/stages/${stageId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Error deleting growth stage ${stageId}:`, error);
      throw error;
    }
  },
};

export default GrowthStageService;
