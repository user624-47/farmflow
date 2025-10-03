import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GrowthStage, GrowthStageService, CreateGrowthStageDTO, UpdateGrowthStageDTO } from '../services/growthStageService';

export function useGrowthStages(options?: {
  cropTypeId?: string;
  organizationId?: string;
}) {
  return useQuery<GrowthStage[], Error>({
    queryKey: ['growthStages', options],
    queryFn: () => GrowthStageService.getStages({
      cropTypeId: options?.cropTypeId,
      organizationId: options?.organizationId,
    }),
    enabled: !!options?.organizationId, // Only fetch when organizationId is available
  });
}

export function useGrowthStage(stageId?: string) {
  return useQuery<GrowthStage, Error>({
    queryKey: ['growthStage', stageId],
    queryFn: () => {
      if (!stageId) {
        throw new Error('Stage ID is required');
      }
      return GrowthStageService.getStage(stageId);
    },
    enabled: !!stageId,
  });
}

export function useCreateGrowthStage() {
  const queryClient = useQueryClient();
  
  return useMutation<GrowthStage, Error, CreateGrowthStageDTO>({
    mutationFn: (data) => GrowthStageService.createStage(data),
    onSuccess: () => {
      // Invalidate and refetch growth stages query
      queryClient.invalidateQueries({ queryKey: ['growthStages'] });
    },
  });
}

export function useUpdateGrowthStage() {
  const queryClient = useQueryClient();
  
  return useMutation<GrowthStage, Error, { id: string; data: UpdateGrowthStageDTO }>({
    mutationFn: ({ id, data }) => GrowthStageService.updateStage(id, data),
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific item
      queryClient.invalidateQueries({ queryKey: ['growthStages'] });
      queryClient.invalidateQueries({ queryKey: ['growthStage', variables.id] });
    },
  });
}

export function useDeleteGrowthStage() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: (stageId) => GrowthStageService.deleteStage(stageId),
    onSuccess: (_, stageId) => {
      // Invalidate the list and remove the specific item from cache
      queryClient.invalidateQueries({ queryKey: ['growthStages'] });
      queryClient.removeQueries({ queryKey: ['growthStage', stageId] });
    },
  });
}
