import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noticePeriodService } from '@/services/api/noticePeriodService';

export const NOTICE_PERIOD_QUERY_KEY = ['notice-periods'];

export const useNoticePeriodList = () => {
  return useQuery({
    queryKey: NOTICE_PERIOD_QUERY_KEY,
    queryFn: () => noticePeriodService.getAll(),
  });
};

export const useCreateNoticePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, code }: { name: string; code?: string }) =>
      noticePeriodService.create(name, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_PERIOD_QUERY_KEY });
    },
  });
};

export const useUpdateNoticePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; code?: string; is_active?: boolean };
    }) => noticePeriodService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_PERIOD_QUERY_KEY });
    },
  });
};

export const useReorderNoticePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => noticePeriodService.updateOrder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_PERIOD_QUERY_KEY });
    },
  });
};

export const useDeleteNoticePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noticePeriodService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICE_PERIOD_QUERY_KEY });
    },
  });
};