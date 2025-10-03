// src/types/growth.ts
export interface GrowthStage {
    id: string;
    name: string;
    description?: string;
    duration_days: number;
    conditions?: Record<string, any>;
    organization_id: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface GrowthRecord {
    id: string;
    crop_id: string;
    stage_id: string;
    stage: GrowthStage;
    start_date: string;
    end_date?: string;
    notes?: string;
    images: string[];
    health_score?: number;
    created_by: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface CreateGrowthRecordInput {
    stage_id: string;
    start_date: string;
    end_date?: string;
    notes?: string;
    health_score?: number;
    images?: File[];
  }