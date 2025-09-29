import { supabase } from '@/integrations/supabase/client';
import { fetchWeatherData } from './weatherService';

export interface CropLocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  cropType: string;
  area?: number;
  soilQuality?: {
    ph: number;
    type: string;
    organicMatter: number;
  };
  weather?: {
    temperature: number;
    humidity: number;
    conditions: string;
    forecast: Array<{
      date: string;
      temp: number;
      conditions: string;
    }>;
  };
}

export const getCropLocations = async (organizationId: string): Promise<CropLocationData[]> => {
  const { data, error } = await supabase
    .from('crops')
    .select(`
      id,
      crop_name,
      latitude,
      longitude,
      status,
      farm_area,
      soil_ph,
      soil_type,
      organic_matter
    `)
    .eq('organization_id', organizationId)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    console.error('Error fetching crop locations:', error);
    throw error;
  }

  // Transform data to match our interface
  return data.map(crop => ({
    id: crop.id,
    name: crop.crop_name,
    latitude: crop.latitude,
    longitude: crop.longitude,
    status: crop.status,
    cropType: crop.crop_name, // This could be expanded to include variety
    area: crop.farm_area,
    soilQuality: crop.soil_ph ? {
      ph: crop.soil_ph,
      type: crop.soil_type || 'Unknown',
      organicMatter: crop.organic_matter || 0
    } : undefined
  }));
};

export const getSoilQuality = async (lat: number, lng: number) => {
  // In a real implementation, this would call a soil quality API
  // For now, we'll return mock data
  return {
    ph: 6.5 + (Math.random() * 2 - 1), // Random pH between 5.5 and 7.5
    type: ['Clay', 'Loam', 'Sandy', 'Silt'][Math.floor(Math.random() * 4)],
    organicMatter: 2.5 + (Math.random() * 3) // 2.5% to 5.5%
  };
};

export const getCropWithWeather = async (cropId: string): Promise<CropLocationData | null> => {
  const { data: crop, error } = await supabase
    .from('crops')
    .select('*')
    .eq('id', cropId)
    .single();

  if (error || !crop) {
    console.error('Error fetching crop:', error);
    return null;
  }

  if (!crop.latitude || !crop.longitude) {
    return {
      ...crop,
      id: crop.id,
      name: crop.crop_name,
      cropType: crop.crop_name,
      status: crop.status,
      area: crop.farm_area
    };
  }

  try {
    // Get weather data
    const weatherData = await fetchWeatherData(crop.organization_id);
    
    // Get soil quality
    const soilQuality = await getSoilQuality(crop.latitude, crop.longitude);

    return {
      id: crop.id,
      name: crop.crop_name,
      latitude: crop.latitude,
      longitude: crop.longitude,
      status: crop.status,
      cropType: crop.crop_name,
      area: crop.farm_area,
      soilQuality,
      weather: {
        temperature: weatherData.current.temperature,
        humidity: weatherData.current.humidity,
        conditions: weatherData.current.conditions,
        forecast: weatherData.forecast.map((f: any) => ({
          date: f.date,
          temp: f.temperature,
          conditions: f.conditions
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      id: crop.id,
      name: crop.crop_name,
      latitude: crop.latitude,
      longitude: crop.longitude,
      status: crop.status,
      cropType: crop.crop_name,
      area: crop.farm_area
    };
  }
};

export const updateCropLocation = async (
  cropId: string, 
  updates: {
    latitude?: number;
    longitude?: number;
    boundary_geojson?: any;
    soil_ph?: number;
    soil_type?: string;
    organic_matter?: number;
  }
) => {
  const { data, error } = await supabase
    .from('crops')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', cropId)
    .select()
    .single();

  if (error) {
    console.error('Error updating crop location:', error);
    throw error;
  }

  return data;
};
