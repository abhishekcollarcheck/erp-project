import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { genderService } from '@/services/api/genderService';

export const GENDER_QUERY_KEY = ['genders-list'];

export const useGenderData = () => {
  return useQuery({
    queryKey: GENDER_QUERY_KEY,
    queryFn: () => genderService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateGender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => genderService.createGender(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: GENDER_QUERY_KEY }),
  });
};

export const useUpdateGender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => genderService.updateGender(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: GENDER_QUERY_KEY }),
  });
};

export const useDeleteGender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => genderService.deleteGender(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: GENDER_QUERY_KEY }),
  });
};