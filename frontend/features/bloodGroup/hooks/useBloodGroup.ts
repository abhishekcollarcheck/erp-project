import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodGroupService } from '@/services/api/bloodGroupService';

export const BLOOD_GROUP_QUERY_KEY = ['blood-groups-list'];

export const useBloodGroupData = () => {
  return useQuery({
    queryKey: BLOOD_GROUP_QUERY_KEY,
    queryFn: () => bloodGroupService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateBloodGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => bloodGroupService.createBloodGroup(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOOD_GROUP_QUERY_KEY }),
  });
};

export const useUpdateBloodGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => bloodGroupService.updateBloodGroup(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOOD_GROUP_QUERY_KEY }),
  });
};

export const useDeleteBloodGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bloodGroupService.deleteBloodGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOOD_GROUP_QUERY_KEY }),
  });
};