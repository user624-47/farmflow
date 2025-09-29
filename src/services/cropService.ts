import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase-custom';
import OpenAI from 'openai';
import type { CropInsightData, CropGrowthStage, CurrentConditions, RiskFactor } from './types/crop';
import { format, subDays } from 'date-fns';

// Initialize Supabase client with our custom types
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only if running in browser
});

// AI Model Configuration
const AI_MODEL = 'gpt-4-turbo-preview';
const AI_TEMPERATURE = 0.7;

// Cache for storing AI responses to reduce API calls
const aiResponseCache = new Map<string, any>();

// Type for the growth stages table row
type GrowthStageRow = Database['public']['Tables']['crop_growth_stages']['Row'];
type CropYieldHistoryRow = Database['public']['Tables']['crop_yield_history']['Row'];
type CropInsightsRow = Database['public']['Tables']['crop_insights']['Row'];

// Type for the Supabase client
type SupabaseClient = typeof supabase;

// Type for the crop data from the database
interface CropData {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
}

// Cache for storing crop insights
const cropInsightsCache = new Map<string, { data: CropInsightData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetches crop insights for a given crop name and location
export async function fetchCropInsights(cropName: string, location: string = 'default-location'): Promise<CropInsightData> {
  const cacheKey = `insights_${cropName}_${location}`;
  
  // Check cache first
  const cached = cropInsightsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    // First, get the crop ID from the crop name
    const { data: cropData, error: cropError } = await supabase
      .from('crops')
      .select('id')
      .ilike('name', `%${cropName}%`)
      .single<{ id: string }>();

    if (cropError || !cropData) {
      console.warn(`Crop not found: ${cropName}, using default insights`);
      return getDefaultInsights(cropName, location);
    }

    // Now fetch insights using the crop ID
    const { data, error } = await supabase
      .from('crop_insights')
      .select('*')
      .eq('crop_id', cropData.id)
      .eq('location', location)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return getDefaultInsights(cropName, location);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    // If we have data, validate and return it
    if (data) {
      const validatedData = validateAndNormalizeInsights(data);
      // Update cache
      cropInsightsCache.set(cacheKey, { data: validatedData, timestamp: Date.now() });
      return validatedData;
    }

    // If no data, return default insights
    return getDefaultInsights(cropName, location);
  } catch (error) {
    console.error('Error in fetchCropInsights:', error);
    // Return default insights on error
    return getDefaultInsights(cropName, location);
  }
}

// Helper function to validate and normalize insights data
function validateAndNormalizeInsights(data: any): CropInsightData {
  const now = new Date().toISOString();
  return {
    id: data.id || '',
    crop_id: data.crop_id || '',
    location: data.location || 'default-location',
    last_updated: data.last_updated || now,
    current_stage: data.current_stage || 'seedling',
    stage_progress: Number(data.stage_progress) || 0,
    days_in_current_stage: Number(data.days_in_current_stage) || 0,
    days_until_next_stage: Number(data.days_until_next_stage) || 0,
    health_score: Number(data.health_score) || 0,
    health_assessment: data.health_assessment || 'No health assessment available',
    growth_analysis: data.growth_analysis || 'No growth analysis available',
    ai_recommendations: Array.isArray(data.ai_recommendations) ? data.ai_recommendations : [],
    risk_factors: Array.isArray(data.risk_factors) ? data.risk_factors : [],
    growth_projection: data.growth_projection || 'No growth projection available',
    comparison_to_average: data.comparison_to_average || 'No comparison data available',
    growth_stages: Array.isArray(data.growth_stages) ? data.growth_stages : [],
    current_conditions: data.current_conditions || {
      temperature: 0,
      humidity: 0,
      soil_moisture: 0,
      light_intensity: 0,
      last_updated: now,
      source: 'manual' as const
    },
    issues: Array.isArray(data.issues) ? data.issues : []
  };
}

// Helper function to get default insights
function getDefaultInsights(cropName: string, location: string): CropInsightData {
  const now = new Date().toISOString();
  return {
    id: '',
    crop_id: cropName,
    location,
    last_updated: now,
    current_stage: 'seedling',
    stage_progress: 0,
    days_in_current_stage: 0,
    days_until_next_stage: 0,
    health_score: 0,
    health_assessment: 'Initializing health assessment...',
    growth_analysis: 'Analyzing growth patterns...',
    ai_recommendations: [],
    risk_factors: [],
    growth_projection: 'Calculating growth projection...',
    comparison_to_average: 'No historical data available',
    growth_stages: [],
    current_conditions: {
      temperature: 0,
      humidity: 0,
      soil_moisture: 0,
      light_intensity: 0,
      last_updated: now,
      source: 'manual' as const
    },
    issues: []
  };
}

/**
 * Updates crop insights with the latest data and AI analysis
 */
async function updateCropInsights(cropId: string, location: string): Promise<CropInsightData> {
  try {
    // Get the crop data
    const { data: cropData, error: cropError } = await supabase
      .from('crops')
      .select('*')
      .eq('id', cropId)
      .single();

    if (cropError || !cropData) {
      throw new Error('Crop not found');
    }

    // Get crop name with type safety
    const cropName = (cropData as any).name;
    if (!cropName) {
      throw new Error('Crop name not found');
    }

    // Get the latest insights
    const insights = await fetchCropInsights(cropName, location);

    // Prepare the data for upsert
    const now = new Date().toISOString();
    const insightData = {
      id: `${cropId}-${location}`, // Generate a unique ID
      crop_id: cropId,
      location,
      last_updated: now,
      health_score: insights.health_score || 0,
      current_stage: insights.current_stage || '',
      stage_progress: insights.stage_progress || 0,
      recommendations: insights.ai_recommendations || [],
      risk_factors: insights.risk_factors || [],
      growth_projection: insights.growth_projection || '',
      comparison_to_average: insights.comparison_to_average || ''
    } as const;

    // Upsert the insights data with proper type assertion
    const { error: upsertError } = await (supabase
      .from('crop_insights') as any)
      .upsert([insightData], { 
        onConflict: 'crop_id,location',
        returning: 'minimal' // We don't need the returned data
      });

    if (upsertError) {
      console.error('Error upserting crop insights:', upsertError);
      throw upsertError;
    }

    return insights;
  } catch (error) {
    console.error('Error in updateCropInsights:', error);
    throw error;
  }
}

// Create the service object
const cropService = {
  fetchCropInsights,
  updateCropInsights,
  // Add other functions as needed
} as const;

// Export the service as default
export default cropService;

// Export types for direct imports
export type {
  CropInsightData,
  CropGrowthStage,
  CurrentConditions,
  RiskFactor
} from './types/crop';
