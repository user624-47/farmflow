// src/types/growthStage.ts

export interface GrowthStage {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  crop_type_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  icon?: string;
  color?: string;
  order: number;
  is_active: boolean;
  min_temp?: number;
  max_temp?: number;
  ideal_soil_moisture?: number;
  ideal_light_hours?: number;
  fertilizer_needs?: string;
  water_needs?: string;
  notes?: string;
}

export interface CreateGrowthStageDTO
  extends Omit<GrowthStage, 'id' | 'created_at' | 'updated_at' | 'organization_id'> {}

export interface UpdateGrowthStageDTO extends Partial<CreateGrowthStageDTO> {}
