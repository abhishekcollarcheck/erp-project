import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '@/services/api/bankService';

export const BANK_QUERY_KEY = ['banks-list'];

export const useBankData = () => {
  return useQuery({
    queryKey: BANK_QUERY_KEY,
    queryFn: () => bankService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => bankService.createBank(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: BANK_QUERY_KEY }),
  });
};

export const useUpdateBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => bankService.updateBank(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: BANK_QUERY_KEY }),
  });
};

export const useDeleteBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankService.deleteBank(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BANK_QUERY_KEY }),
  });
};
