import { Database } from '../types/database.types';

export type GrowthRecord = Database['public']['Tables']['growth_records']['Row'] & {
  stage?: Database['public']['Tables']['growth_stages']['Row'];
};

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

export const GrowthRecordService = {
  async getRecords(cropId: string): Promise<GrowthRecord[]> {
    return apiRequest<GrowthRecord[]>(`/api/growth/records?cropId=${cropId}`);
  },

  async getRecord(recordId: string): Promise<GrowthRecord> {
    return apiRequest<GrowthRecord>(`/api/growth/records?id=${recordId}`);
  },

  async createRecord(record: Omit<GrowthRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>, userId: string): Promise<GrowthRecord> {
    return apiRequest<GrowthRecord>('/api/growth/records', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  },

  async updateRecord(recordId: string, updates: Partial<GrowthRecord>, userId: string): Promise<GrowthRecord> {
    return apiRequest<GrowthRecord>(`/api/growth/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteRecord(recordId: string): Promise<void> {
    await apiRequest<void>(`/api/growth/records/${recordId}`, {
      method: 'DELETE'
    });
  },

  async uploadImage(file: File, path: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch(`${API_BASE_URL}/api/upload/growth-records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') ? JSON.parse(localStorage.getItem('supabase.auth.token')!).access_token : ''}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to upload image');
    }

    const { url } = await response.json();
    return url;
  },
};

export default GrowthRecordService;
