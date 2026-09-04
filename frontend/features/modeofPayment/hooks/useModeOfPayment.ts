import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modeOfPaymentService } from '@/services/api/modeOfPaymentService';

export const MODE_OF_PAYMENT_QUERY_KEY = ['modes-of-payment-list'];

export const useModeOfPaymentData = () => {
  return useQuery({
    queryKey: MODE_OF_PAYMENT_QUERY_KEY,
    queryFn: () => modeOfPaymentService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateModeOfPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => modeOfPaymentService.createModeOfPayment(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: MODE_OF_PAYMENT_QUERY_KEY }),
  });
};

export const useUpdateModeOfPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      modeOfPaymentService.updateModeOfPayment(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: MODE_OF_PAYMENT_QUERY_KEY }),
  });
};

export const useDeleteModeOfPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => modeOfPaymentService.deleteModeOfPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MODE_OF_PAYMENT_QUERY_KEY }),
  });
};