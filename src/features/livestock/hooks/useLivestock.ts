import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLivestock,
  getLivestockById,
  createLivestock,
  updateLivestock,
  deleteLivestock,
  addHealthRecord,
  addBreedingRecord,
  addFeedingRecord,
  subscribeToLivestockUpdates,
  Livestock,
  LivestockInput,
  LivestockUpdate,
  HealthRecord,
  BreedingRecord,
  FeedingRecord,
  LivestockFilter,
  LivestockResponse
} from '../api/livestockService';

export const useLivestock = (filters: LivestockFilter = {}, page = 1, pageSize = 10) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch livestock with pagination and filters
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<LivestockResponse>({
    queryKey: ['livestock', { ...filters, page, pageSize, search: searchTerm }],
    queryFn: () => getLivestock({ ...filters, search: searchTerm }, page, pageSize),
    keepPreviousData: true,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToLivestockUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // Create a new livestock
  const createMutation = useMutation({
    mutationFn: createLivestock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    },
  });

  // Update an existing livestock
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LivestockUpdate }) => 
      updateLivestock(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    },
  });

  // Delete a livestock
  const deleteMutation = useMutation({
    mutationFn: deleteLivestock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    },
  });

  // Add health record
  const addHealthRecordMutation = useMutation({
    mutationFn: addHealthRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    },
  });

  // Add breeding record
  const addBreedingRecordMutation = useMutation({
    mutationFn: addBreedingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    },
  });

  // Add feeding record
  const addFeedingRecordMutation = useMutation({
    mutationFn: addFeedingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
    },
  });

  // Get livestock by ID
  const getLivestockByIdQuery = (id: string) => 
    useQuery<Livestock | null>({
      queryKey: ['livestock', id],
      queryFn: () => getLivestockById(id),
      enabled: !!id,
    });

  // Search livestock
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return {
    // Data
    livestock: data?.data || [],
    pagination: data?.pagination || { page, pageSize, total: 0 },
    stats: data?.stats,
    isLoading,
    error,
    
    // Actions
    refetch,
    createLivestock: createMutation.mutateAsync,
    updateLivestock: updateMutation.mutateAsync,
    deleteLivestock: deleteMutation.mutateAsync,
    addHealthRecord: addHealthRecordMutation.mutateAsync,
    addBreedingRecord: addBreedingRecordMutation.mutateAsync,
    addFeedingRecord: addFeedingRecordMutation.mutateAsync,
    getLivestockById: getLivestockByIdQuery,
    searchLivestock: handleSearch,
  };
};

// Hook for a single livestock
export const useSingleLivestock = (id: string) => {
  return useQuery<Livestock | null>({
    queryKey: ['livestock', id],
    queryFn: () => getLivestockById(id),
    enabled: !!id,
  });
};

// Hook for livestock stats
export const useLivestockStats = () => {
  return useQuery({
    queryKey: ['livestock', 'stats'],
    queryFn: () => getLivestock(),
    select: (data) => data.stats,
  });
};
