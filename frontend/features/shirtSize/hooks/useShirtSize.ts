import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shirtSizeService } from '@/services/api/shirtSizeService';

export const SHIRT_SIZE_QUERY_KEY = ['shirt-sizes-list'];

export const useShirtSizeData = () => {
  return useQuery({
    queryKey: SHIRT_SIZE_QUERY_KEY,
    queryFn: () => shirtSizeService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateShirtSize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => shirtSizeService.createShirtSize(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIRT_SIZE_QUERY_KEY }),
  });
};

export const useUpdateShirtSize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => shirtSizeService.updateShirtSize(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIRT_SIZE_QUERY_KEY }),
  });
};

export const useDeleteShirtSize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shirtSizeService.deleteShirtSize(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIRT_SIZE_QUERY_KEY }),
  });
};