import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maritalStatusService } from '@/services/api/maritalStatusService';

export const MARITAL_STATUS_QUERY_KEY = ['marital-statuses-list'];

export const useMaritalStatusData = () => {
  return useQuery({
    queryKey: MARITAL_STATUS_QUERY_KEY,
    queryFn: () => maritalStatusService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateMaritalStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => maritalStatusService.createMaritalStatus(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: MARITAL_STATUS_QUERY_KEY }),
  });
};

export const useUpdateMaritalStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => maritalStatusService.updateMaritalStatus(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: MARITAL_STATUS_QUERY_KEY }),
  });
};

export const useDeleteMaritalStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => maritalStatusService.deleteMaritalStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MARITAL_STATUS_QUERY_KEY }),
  });
};