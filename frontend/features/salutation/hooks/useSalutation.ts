import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salutationService } from '@/services/api/salutationService';

export const SALUTATION_QUERY_KEY = ['salutations-list'];

export const useSalutationData = () => {
  return useQuery({
    queryKey: SALUTATION_QUERY_KEY,
    queryFn: () => salutationService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSalutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => salutationService.createSalutation(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALUTATION_QUERY_KEY }),
  });
};

export const useUpdateSalutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      salutationService.updateSalutation(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALUTATION_QUERY_KEY }),
  });
};

export const useDeleteSalutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => salutationService.deleteSalutation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALUTATION_QUERY_KEY }),
  });
};