import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insuredAmountService } from '@/services/api/insuredAmountService';

export const INSURED_QUERY_KEY = ['insured-amounts'];

export const useInsuredData = () => {
  return useQuery({
    queryKey: INSURED_QUERY_KEY,
    queryFn: () => insuredAmountService.getAll(),
  });
};

export const useCreateInsuredMaster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => insuredAmountService.createMaster(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURED_QUERY_KEY }),
  });
};

export const useUpdateInsuredMaster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => insuredAmountService.updateMaster(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURED_QUERY_KEY }),
  });
};

export const useDeleteInsuredMaster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => insuredAmountService.deleteMaster(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURED_QUERY_KEY }),
  });
};

export const useCreateBracket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { min_salary: number; max_salary: number | null; insured_amount_id: number }) =>
      insuredAmountService.createBracket(params.min_salary, params.max_salary, params.insured_amount_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURED_QUERY_KEY }),
  });
};

export const useUpdateBracket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => insuredAmountService.updateBracket(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURED_QUERY_KEY }),
  });
};

export const useDeleteBracket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => insuredAmountService.deleteBracket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURED_QUERY_KEY }),
  });
};