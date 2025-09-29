import { supabase } from '../../../lib/supabaseClient';
import { Livestock, LivestockInput, LivestockUpdate, HealthRecord, BreedingRecord, FeedingRecord, LivestockFilter, LivestockResponse, LivestockStats } from '../types';

export const LIVESTOCK_TABLE = 'livestock';

// Helper function to get the current organization ID
const getOrganizationId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
    
  return userRole?.organization_id || null;
};

// Livestock CRUD Operations
export const getLivestock = async (filters: LivestockFilter = {}, page = 1, pageSize = 10): Promise<LivestockResponse> => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }

    // Base query with organization filter
    let query = supabase
      .from(LIVESTOCK_TABLE)
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('health_status', filters.status);
    }
    if (filters.breed) {
      query = query.ilike('breed', `%${filters.breed}%`);
    }
    if (filters.search) {
      query = query.or(
        `livestock_type.ilike.%${filters.search}%,breed.ilike.%${filters.search}%`
      );
    }
    if (filters.start_date && filters.end_date) {
      query = query
        .gte('created_at', filters.start_date)
        .lte('created_at', filters.end_date);
    }

    // Apply pagination
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    // Get stats
    const stats = await getLivestockStats();

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
      },
      stats,
    };
  } catch (error) {
    console.error('Error fetching livestock:', error);
    throw error;
  }
};

export const getLivestockById = async (id: string): Promise<Livestock | null> => {
  try {
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('*, health_records(*), breeding_records(*), feeding_records(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching livestock with id ${id}:`, error);
    return null;
  }
};

export const createLivestock = async (livestock: LivestockInput): Promise<Livestock> => {
  try {
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .insert(livestock)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating livestock:', error);
    throw error;
  }
};

export const updateLivestock = async (id: string, updates: LivestockUpdate): Promise<Livestock> => {
  try {
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating livestock with id ${id}:`, error);
    throw error;
  }
};

export const deleteLivestock = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(LIVESTOCK_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting livestock with id ${id}:`, error);
    throw error;
  }
};

// Health Records Operations
export const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }
    
    // Get the current livestock record
    const { data: livestock, error: fetchError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('health_records')
      .eq('id', record.livestock_id)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Create a new health record
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Update the health records array
    const updatedHealthRecords = [
      ...(livestock.health_records || []),
      newRecord
    ];
    
    // Update the livestock record with the new health record
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ 
        health_records: updatedHealthRecords,
        updated_at: new Date().toISOString() 
      })
      .eq('id', record.livestock_id)
      .select()
      .single();
      
    if (error) throw error;
    return newRecord;
  } catch (error) {
    console.error('Error adding health record:', error);
    throw error;
  }
};

// Stats and Analytics
export const getLivestockStats = async (): Promise<LivestockStats> => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }

    // Get all livestock for the organization
    const { data: livestockData, count: totalLivestock, error: countError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (countError) throw countError;

    // Calculate total quantity
    const totalQuantity = livestockData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    // Initialize stats
    const stats: LivestockStats = {
      totalLivestock: totalQuantity,
      totalRecords: totalLivestock || 0,
      byType: {},
      byStatus: {},
      byBreeding: {},
      recentHealthRecords: [],
      upcomingBreeding: []
    };

    // Group by type, status, and breeding status
    if (livestockData) {
      livestockData.forEach(animal => {
        // Group by type
        const type = animal.livestock_type || 'Unknown';
        stats.byType[type] = (stats.byType[type] || 0) + (animal.quantity || 0);

        // Group by health status
        const status = animal.health_status || 'Unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + (animal.quantity || 0);

        // Group by breeding status
        const breedingStatus = animal.breeding_status || 'not_breeding';
        stats.byBreeding[breedingStatus] = (stats.byBreeding[breedingStatus] || 0) + (animal.quantity || 0);
      });
    }

    return stats;
  } catch (error) {
    console.error('Error fetching livestock stats:', error);
    throw error;
  }
};

export const addBreedingRecord = async (record: Omit<BreedingRecord, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('breeding_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding breeding record:', error);
    throw error;
  }
};

// Breeding Records Operations
export const getBreedingRecord = async (livestockId: string, recordId: string) => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }

    const { data: livestock, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('breeding_records')
      .eq('id', livestockId)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
    
    if (!livestock.breeding_records) {
      throw new Error('No breeding records found');
    }
    
    const record = livestock.breeding_records.find((r: any) => r.id === recordId);
    if (!record) {
      throw new Error('Breeding record not found');
    }
    
    return record;
  } catch (error) {
    console.error(`Error fetching breeding record with id ${recordId}:`, error);
    throw error;
  }
};

export const updateBreedingRecord = async (livestockId: string, recordId: string, updates: Partial<BreedingRecord>) => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }

    // Get the current livestock record
    const { data: livestock, error: fetchError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('breeding_records')
      .eq('id', livestockId)
      .eq('organization_id', organizationId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!livestock.breeding_records) {
      throw new Error('No breeding records found');
    }
    
    // Update the specific breeding record
    const updatedRecords = livestock.breeding_records.map((record: any) => {
      if (record.id === recordId) {
        return {
          ...record,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return record;
    });
    
    // Update the livestock record with the updated breeding records
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ 
        breeding_records: updatedRecords,
        updated_at: new Date().toISOString() 
      })
      .eq('id', livestockId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Return the updated record
    return updatedRecords.find((r: any) => r.id === recordId);
  } catch (error) {
    console.error(`Error updating breeding record with id ${recordId}:`, error);
    throw error;
  }
};

export const deleteBreedingRecord = async (livestockId: string, recordId: string) => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }

    // Get the current livestock record
    const { data: livestock, error: fetchError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('breeding_records')
      .eq('id', livestockId)
      .eq('organization_id', organizationId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!livestock?.breeding_records) {
      throw new Error('No breeding records found');
    }
    
    // Filter out the record to delete
    const updatedRecords = livestock.breeding_records.filter((record: any) => record.id !== recordId);
    
    // Update the livestock record with the filtered breeding records
    const { error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ 
        breeding_records: updatedRecords,
        updated_at: new Date().toISOString() 
      })
      .eq('id', livestockId);
      
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting breeding record with id ${recordId}:`, error);
    throw error;
  }
};

// Feeding Records Operations
export const getFeedingRecord = async (livestockId: string, recordId: string) => {
  try {
    const { data: livestock, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('feeding_records')
      .eq('id', livestockId)
      .single();
      
    if (error) throw error;
    
    if (!livestock.feeding_records) {
      throw new Error('No feeding records found');
    }
    
    const record = livestock.feeding_records.find((r: any) => r.id === recordId);
    if (!record) {
      throw new Error('Feeding record not found');
    }
    
    return record;
  } catch (error) {
    console.error(`Error fetching feeding record with id ${recordId}:`, error);
    throw error;
  }
};

export const addFeedingRecord = async (record: Omit<FeedingRecord, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('User is not part of any organization');
    }
    
    // Get the current livestock record
    const { data: livestock, error: fetchError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('feeding_records')
      .eq('id', record.livestock_id)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Create a new feeding record
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Update the feeding records array
    const updatedFeedingRecords = [
      ...(livestock.feeding_records || []),
      newRecord
    ];
    
    // Update the livestock record with the new feeding record
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ 
        feeding_records: updatedFeedingRecords,
        updated_at: new Date().toISOString() 
      })
      .eq('id', record.livestock_id)
      .select()
      .single();
      
    if (error) throw error;
    return newRecord;
  } catch (error) {
    console.error('Error adding feeding record:', error);
    throw error;
  }
};

export const updateFeedingRecord = async (livestockId: string, recordId: string, updates: Partial<FeedingRecord>) => {
  try {
    // Get the current livestock record
    const { data: livestock, error: fetchError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('feeding_records')
      .eq('id', livestockId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!livestock.feeding_records) {
      throw new Error('No feeding records found');
    }
    
    // Update the specific feeding record
    const updatedRecords = livestock.feeding_records.map((record: any) => {
      if (record.id === recordId) {
        return {
          ...record,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return record;
    });
    
    // Update the livestock record with the updated feeding records
    const { data, error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ 
        feeding_records: updatedRecords,
        updated_at: new Date().toISOString() 
      })
      .eq('id', livestockId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Return the updated record
    return updatedRecords.find((r: any) => r.id === recordId);
  } catch (error) {
    console.error(`Error updating feeding record with id ${recordId}:`, error);
    throw error;
  }
};

export const deleteFeedingRecord = async (livestockId: string, recordId: string) => {
  try {
    // Get the current livestock record
    const { data: livestock, error: fetchError } = await supabase
      .from(LIVESTOCK_TABLE)
      .select('feeding_records')
      .eq('id', livestockId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!livestock.feeding_records) {
      throw new Error('No feeding records found');
    }
    
    // Filter out the record to delete
    const updatedRecords = livestock.feeding_records.filter((record: any) => record.id !== recordId);
    
    // Update the livestock record with the filtered feeding records
    const { error } = await supabase
      .from(LIVESTOCK_TABLE)
      .update({ 
        feeding_records: updatedRecords,
        updated_at: new Date().toISOString() 
      })
      .eq('id', livestockId);
      
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting feeding record with id ${recordId}:`, error);
    throw error;
  }
};

// Real-time Subscriptions
export const subscribeToLivestockUpdates = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('livestock-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: LIVESTOCK_TABLE 
      },
      (payload) => {
        console.log('Livestock change received!', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
};
