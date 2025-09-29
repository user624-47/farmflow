import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';
import type { Database as GeneratedDatabase } from './types';

// Define the base interface for crop growth stages
export interface CropGrowthStage {
  id: string;
  crop_id: string;
  stage_name: string;
  stage_order: number;
  duration_days: number;
  description: string | null;
  optimal_temp_min: number | null;
  optimal_temp_max: number | null;
  water_needs: string | null;
  nutrient_needs: string | null;
  common_issues: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export type CropGrowthStageInsert = Omit<CropGrowthStage, 'id' | 'created_at' | 'updated_at'>;
export type CropGrowthStageUpdate = Partial<Omit<CropGrowthStage, 'id' | 'created_at' | 'updated_at'>>;

// Extend the generated database types with our custom tables
export type Database = {
  public: {
    Tables: {
      crop_growth_stages: {
        Row: CropGrowthStage;
        Insert: CropGrowthStageInsert;
        Update: CropGrowthStageUpdate;
      };
    } & GeneratedDatabase['public']['Tables'];
    Views: GeneratedDatabase['public']['Views'];
    Functions: GeneratedDatabase['public']['Functions'];
    Enums: GeneratedDatabase['public']['Enums'];
    CompositeTypes: GeneratedDatabase['public']['CompositeTypes'];
  };
  __InternalSupabase: GeneratedDatabase['__InternalSupabase'];
};

export class SupabaseService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getCropGrowthStages(cropId: string): Promise<CropGrowthStage[]> {
    try {
      const { data, error } = await this.supabase
        .from('crop_growth_stages')
        .select('*')
        .eq('crop_id', cropId)
        .order('stage_order', { ascending: true });

      if (error) {
        console.error('Error fetching growth stages:', error);
        throw error;
      }

      // Type assertion to handle the response data
      const stages = (data || []) as Array<Record<string, any>>;
      
      return stages.map((stage): CropGrowthStage => ({
        id: String(stage.id),
        crop_id: String(stage.crop_id),
        stage_name: String(stage.stage_name),
        stage_order: Number(stage.stage_order),
        duration_days: Number(stage.duration_days),
        description: stage.description ? String(stage.description) : null,
        optimal_temp_min: stage.optimal_temp_min ? Number(stage.optimal_temp_min) : null,
        optimal_temp_max: stage.optimal_temp_max ? Number(stage.optimal_temp_max) : null,
        water_needs: stage.water_needs ? String(stage.water_needs) : null,
        nutrient_needs: stage.nutrient_needs ? String(stage.nutrient_needs) : null,
        common_issues: stage.common_issues 
          ? (Array.isArray(stage.common_issues) 
              ? stage.common_issues.map(String) 
              : [String(stage.common_issues)])
          : [],
        created_at: String(stage.created_at),
        updated_at: stage.updated_at ? String(stage.updated_at) : null
      }));
    } catch (error) {
      console.error('Error in getCropGrowthStages:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const supabaseService = new SupabaseService(supabase);
