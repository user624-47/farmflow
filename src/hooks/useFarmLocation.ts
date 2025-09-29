import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFarmLocation, isLocationSet } from '@/utils/locationUtils';

export const useFarmLocation = () => {
  const { organizationId } = useAuth();
  const [farmLocation, setFarmLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      if (!organizationId) {
        setError('No organization ID found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const location = await getFarmLocation(organizationId);
        
        if (isLocationSet(location)) {
          setFarmLocation(location);
          setError(null);
        } else {
          setError('Farm location not set. Please update your organization settings.');
        }
      } catch (err) {
        console.error('Error fetching farm location:', err);
        setError('Failed to load farm location');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, [organizationId]);

  return { farmLocation, isLoading, error };
};
