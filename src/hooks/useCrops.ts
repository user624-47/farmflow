import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Crop } from '@/types/crop';

interface UseCropsProps {
  pageSize?: number;
  organizationId: string | null;
}

export const useCrops = ({ pageSize = 10, organizationId }: UseCropsProps) => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchCrops = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('crops')
        .select('*, farmers(first_name, last_name, farmer_id)', { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply search
      if (searchQuery) {
        query = query.ilike('crop_name', `%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Map the data to the Crop type with proper typing
      const typedCrops: Crop[] = (data || []).map((cropData: any) => {
        // Ensure the status is one of the allowed values
        const validStatuses = ['planted', 'growing', 'harvested', 'failed'] as const;
        type StatusType = typeof validStatuses[number];
        const status: StatusType = validStatuses.includes(cropData.status as StatusType) 
          ? cropData.status as StatusType 
          : 'planted';

        // Safely access the farmer data
        const farmerData = cropData.farmers || {};
        const farmer = farmerData ? {
          first_name: farmerData.first_name || '',
          last_name: farmerData.last_name || '',
          farmer_id: farmerData.farmer_id || ''
        } : undefined;
          
        return {
          id: cropData.id,
          crop_name: cropData.crop_name,
          status,
          variety: cropData.variety,
          planting_date: cropData.planting_date,
          expected_harvest_date: cropData.expected_harvest_date,
          actual_harvest_date: cropData.actual_harvest_date,
          farm_area: cropData.farm_area,
          quantity_planted: cropData.quantity_planted,
          quantity_harvested: cropData.quantity_harvested,
          unit: cropData.unit,
          season: cropData.season,
          notes: cropData.notes,
          farmer_id: cropData.farmer_id,
          organization_id: cropData.organization_id,
          created_at: cropData.created_at,
          updated_at: cropData.updated_at,
          image_url: cropData.image_url,
          farmer
        };
      });

      setCrops(typedCrops);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching crops:', error);
      toast({
        title: 'Error',
        description: 'Failed to load crops. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const createCrop = async (cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .insert([cropData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Crop created successfully',
      });

      await fetchCrops();
      return data;
    } catch (error) {
      console.error('Error creating crop:', error);
      toast({
        title: 'Error',
        description: 'Failed to create crop. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCrop = async (id: string, updates: Partial<Crop>) => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Crop updated successfully',
      });

      await fetchCrops();
      return data;
    } catch (error) {
      console.error('Error updating crop:', error);
      toast({
        title: 'Error',
        description: 'Failed to update crop. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCrop = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Crop deleted successfully',
      });

      await fetchCrops();
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete crop. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    crops,
    loading,
    page,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    searchQuery,
    statusFilter,
    setPage,
    setSearchQuery,
    setStatusFilter,
    createCrop,
    updateCrop,
    deleteCrop,
    refresh: fetchCrops,
  };
};
