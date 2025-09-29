// Types for crop-related data

export interface CurrentConditions {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  light_intensity: number;
  last_updated: string;
  source: 'sensor' | 'weather_api' | 'manual';
  location?: string;
  weather_condition?: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  wind_speed?: number;
  wind_direction?: number;
  precipitation?: number;
  pressure?: number;
}

export interface CropGrowthStage {
  id: string;
  crop_id: string;
  stage_name: string;
  stage_order: number;
  duration_days: number;
  description?: string;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  optimal_humidity_min?: number;
  optimal_humidity_max?: number;
  optimal_soil_moisture_min?: number;
  optimal_soil_moisture_max?: number;
  water_needs?: string;
  nutrient_needs?: string;
  common_issues?: string[];
  key_actions?: string[];
  growth_indicators?: string[];
}

export interface RiskFactor {
  factor: string;
  risk: 'low' | 'medium' | 'high';
  details: string;
  impact?: string;
  mitigation?: string[];
  confidence?: number;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  humidity: number;
  precipitation: number;
  condition: string;
  wind_speed: number;
  wind_direction: number;
}

export interface HistoricalYieldData {
  year: number;
  yield_amount: number;
  yield_unit: string;
  conditions: {
    avg_temperature: number;
    total_rainfall: number;
    [key: string]: any;
  };
  notes?: string;
}

export interface CropInsightData {
  // Basic crop information
  id: string;
  crop_id: string;
  location: string;
  last_updated: string;
  
  // Growth stage information
  current_stage: string;
  stage_progress: number;
  days_in_current_stage: number;
  days_until_next_stage: number;
  
  // Health and status
  health_score: number;
  health_assessment: string;
  growth_analysis: string;
  
  // AI Analysis
  ai_recommendations: string[];
  risk_factors: RiskFactor[];
  growth_projection: string;
  comparison_to_average: string;
  
  // Detailed data
  growth_stages: CropGrowthStage[];
  current_conditions: CurrentConditions;
  weather_forecast?: WeatherForecast[];
  historical_yield?: HistoricalYieldData[];
  
  // Issues and alerts
  issues: Array<{
    id: string;
    type: 'pest' | 'disease' | 'nutrient' | 'environmental' | 'equipment' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'in_progress' | 'resolved' | 'false_alarm';
    description: string;
    detected_at: string;
    updated_at?: string;
    recommendations: string[];
    affected_area?: string;
    confidence?: number;
    metadata?: Record<string, any>;
  }>;
  
  // Performance metrics
  metrics?: {
    growth_rate?: number;
    water_use_efficiency?: number;
    nutrient_uptake?: Record<string, number>;
    stress_level?: number;
  };
  
  // Additional metadata
  metadata?: {
    last_ai_analysis?: string;
    last_manual_review?: string;
    data_sources?: string[];
    confidence_scores?: {
      overall: number;
      weather: number;
      growth_stage: number;
      health: number;
    };
  };
}
