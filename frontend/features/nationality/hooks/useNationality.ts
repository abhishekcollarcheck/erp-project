import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nationalityService } from '@/services/api/nationalityService';

export const NATIONALITY_QUERY_KEY = ['nationalities-list'];

export const useNationalityData = () => {
  return useQuery({
    queryKey: NATIONALITY_QUERY_KEY,
    queryFn: () => nationalityService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateNationality = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => nationalityService.createNationality(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: NATIONALITY_QUERY_KEY }),
  });
};

export const useUpdateNationality = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => nationalityService.updateNationality(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: NATIONALITY_QUERY_KEY }),
  });
};

export const useDeleteNationality = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nationalityService.deleteNationality(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NATIONALITY_QUERY_KEY }),
  });
};