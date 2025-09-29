import { supabase } from '@/integrations/supabase/client';

export interface FarmLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export const getFarmLocation = async (organizationId: string): Promise<FarmLocation | null> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('latitude, longitude, address')
      .eq('id', organizationId)
      .single();

    if (error || !data) {
      console.error('Error fetching farm location:', error);
      return null;
    }

    if (!data.latitude || !data.longitude) {
      console.warn('Farm location not set in organization settings');
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || undefined
    };
  } catch (error) {
    console.error('Error in getFarmLocation:', error);
    return null;
  }
};

export const isLocationSet = (location: FarmLocation | null): boolean => {
  return location !== null && 
         location.latitude !== null && 
         location.longitude !== null &&
         !isNaN(location.latitude) && 
         !isNaN(location.longitude);
};
