import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationService } from '@/services/api/qualificationService';

export const QUALIFICATION_QUERY_KEY = ['qualifications-list'];

export const useQualificationData = () => {
  return useQuery({
    queryKey: QUALIFICATION_QUERY_KEY,
    queryFn: () => qualificationService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateQualification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => qualificationService.createQualification(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUALIFICATION_QUERY_KEY }),
  });
};

export const useUpdateQualification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => qualificationService.updateQualification(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUALIFICATION_QUERY_KEY }),
  });
};

export const useDeleteQualification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => qualificationService.deleteQualification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUALIFICATION_QUERY_KEY }),
  });
};