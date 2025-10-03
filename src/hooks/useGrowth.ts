// src/hooks/useGrowth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GrowthRecord, CreateGrowthRecordInput } from '@/types/growth';

export function useGrowthRecords(cropId: string) {
  return useQuery({
    queryKey: ['growth-records', cropId],
    queryFn: async () => {
      const res = await fetch(`/api/growth/records?cropId=${cropId}`);
      if (!res.ok) throw new Error('Failed to fetch growth records');
      return res.json() as Promise<GrowthRecord[]>;
    },
    enabled: !!cropId,
  });
}

export function useCreateGrowthRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { cropId: string; data: CreateGrowthRecordInput }) => {
      const formData = new FormData();
      Object.entries(data.data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          value.forEach(file => formData.append('images', file));
        } else if (value !== undefined) {
          formData.append(key, value as string);
        }
      });

      const res = await fetch(`/api/growth/records?cropId=${data.cropId}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create growth record');
      }

      return res.json() as Promise<GrowthRecord>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['growth-records', variables.cropId]
      });
    },
  });
}