import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educationModeService } from '@/services/api/educationModeService';

export const EDUCATION_MODE_QUERY_KEY = ['education-modes-list'];

export const useEducationModeData = () => {
  return useQuery({
    queryKey: EDUCATION_MODE_QUERY_KEY,
    queryFn: () => educationModeService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateEducationMode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => educationModeService.createEducationMode(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: EDUCATION_MODE_QUERY_KEY }),
  });
};

export const useUpdateEducationMode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => educationModeService.updateEducationMode(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: EDUCATION_MODE_QUERY_KEY }),
  });
};

export const useDeleteEducationMode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => educationModeService.deleteEducationMode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EDUCATION_MODE_QUERY_KEY }),
  });
};