import type { WeatherForecast } from "@/types/weather";
import type { Database } from '@/types/supabase';

// Define the AIInsight type based on the database schema
type AIInsight = Database['public']['Tables']['ai_insights']['Insert'] & { 
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// API endpoint for AI insights
const API_BASE_URL = '/api/ai/insights';

// Define types for our data
interface FarmData {
  id: string;
  organization_id: string;
  name?: string | null;
  location?: string | null;
  size?: number | null;
  soil_type?: string | null;
  // Add other fields as needed
}

interface CropData {
  id: string;
  farm_id: string;
  // Add other fields as needed
}

interface AnalysisData {
  farm: FarmData;
  crops: CropData[];
  weather: WeatherForecast[];
}


export const AIService = {
  async generateFarmInsights(farmId: string): Promise<AIInsight[]> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ farmId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate insights');
      }

      const { insights } = await response.json();
      return insights;

    } catch (error) {
      console.error('Error in generateFarmInsights:', error);
      return this.getMockInsights(farmId);
    }
  },

  // Fallback mock insights in case of errors
  getMockInsights: async (farmId: string): Promise<AIInsight[]> => {
    const now = new Date().toISOString();
    return [
      {
        id: `mock-${Date.now()}`,
        farm_id: farmId,
        organization_id: `org-${farmId}`,
        insight_type: 'system_alert',
        title: 'AI Service Unavailable',
        description: 'We\'re having trouble connecting to our AI service. Showing cached insights.',
        severity: 'medium',
        recommended_actions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the issue persists'
        ],
        confidence: 0.9,
        metadata: { isFallback: true },
        created_at: now,
        updated_at: now
      }
    ];
  },
};
