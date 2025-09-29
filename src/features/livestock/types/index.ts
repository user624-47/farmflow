import { Database } from '../../../types';

export type Livestock = Database['public']['Tables']['livestock']['Row'] & {
  health_records?: HealthRecord[];
  breeding_records?: BreedingRecord[];
  feeding_records?: FeedingRecord[];
};

export type LivestockInput = Omit<
  Database['public']['Tables']['livestock']['Insert'],
  'id' | 'created_at' | 'updated_at' | 'organization_id'
>;

export type LivestockUpdate = Partial<LivestockInput>;

export interface HealthRecord {
  id: string;
  livestock_id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  vet_notes?: string;
  medication?: string;
  next_checkup_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BreedingRecord {
  id: string;
  livestock_id: string;
  breeding_date: string;
  expected_birth_date: string;
  actual_birth_date?: string;
  status: 'pregnant' | 'delivered' | 'failed' | 'in_progress';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedingRecord {
  id: string;
  livestock_id: string;
  feed_type: string;
  quantity: number;
  unit: string;
  feeding_time: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LivestockStats {
  totalLivestock: number;
  totalRecords: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byBreeding: Record<string, number>;
  recentHealthRecords: HealthRecord[];
  upcomingBreeding: BreedingRecord[];
}

export interface LivestockFilter {
  status?: string;
  breed?: string;
  location?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface LivestockPagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface LivestockResponse {
  data: Livestock[];
  pagination: LivestockPagination;
  stats: LivestockStats;
}
