import { Database } from './database.types';

type Tables = Database['public']['Tables'];

export type GrowthRecord = Tables['growth_records']['Row'] & {
  stage?: Tables['growth_stages']['Row'];
};

export type GrowthRecordInsert = Omit<Tables['growth_records']['Insert'], 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type GrowthRecordUpdate = Omit<Tables['growth_records']['Update'], 'updated_at'> & {
  updated_at?: string;
};

export type GrowthStage = Tables['growth_stages']['Row'];

export interface GrowthRecordWithStage extends GrowthRecord {
  stage?: GrowthStage;
}

export interface GrowthRecordsResponse {
  data: GrowthRecordWithStage[];
  error?: string;
}

export interface GrowthRecordResponse {
  data: GrowthRecordWithStage | null;
  error?: string;
}
