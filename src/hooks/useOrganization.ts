import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  subscription_plan: string;
  subscription_status: string;
  subscription_end: string;
  created_at: string;
  updated_at: string;
}

export const useOrganization = () => {
  const { organizationId } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (fetchError) throw fetchError;
        if (data) setOrganization(data);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('Failed to load organization data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId]);

  return { organization, isLoading, error };
};
