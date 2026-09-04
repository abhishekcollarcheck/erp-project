import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { houseTypeService } from '@/services/api/houseTypeService';

export const HOUSE_TYPE_QUERY_KEY = ['house-types-list'];

export const useHouseTypeData = () => {
  return useQuery({
    queryKey: HOUSE_TYPE_QUERY_KEY,
    queryFn: () => houseTypeService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateHouseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => houseTypeService.createHouseType(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSE_TYPE_QUERY_KEY }),
  });
};

export const useUpdateHouseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => houseTypeService.updateHouseType(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSE_TYPE_QUERY_KEY }),
  });
};

export const useDeleteHouseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => houseTypeService.deleteHouseType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSE_TYPE_QUERY_KEY }),
  });
};