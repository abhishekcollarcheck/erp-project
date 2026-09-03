import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bondService } from '@/services/api/bondService';

export const BOND_QUERY_KEY = ['bonds'];

export const useBondList = () => {
  return useQuery({
    queryKey: BOND_QUERY_KEY,
    queryFn: () => bondService.getAll(),
  });
};

export const useCreateBond = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, code }: { name: string; code?: string }) =>
      bondService.create(name, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOND_QUERY_KEY });
    },
  });
};

export const useUpdateBond = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; code?: string; is_active?: boolean };
    }) => bondService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOND_QUERY_KEY });
    },
  });
};

export const useReorderBond = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => bondService.updateOrder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOND_QUERY_KEY });
    },
  });
};

export const useDeleteBond = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bondService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOND_QUERY_KEY });
    },
  });
};