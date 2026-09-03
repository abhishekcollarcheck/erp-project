import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { religionService } from '@/services/api/religionService';

export const RELIGION_QUERY_KEY = ['religions-list'];

export const useReligionData = () => {
  return useQuery({
    queryKey: RELIGION_QUERY_KEY,
    queryFn: () => religionService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateReligion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => religionService.createReligion(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELIGION_QUERY_KEY }),
  });
};

export const useUpdateReligion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => religionService.updateReligion(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELIGION_QUERY_KEY }),
  });
};

export const useDeleteReligion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => religionService.deleteReligion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RELIGION_QUERY_KEY }),
  });
};