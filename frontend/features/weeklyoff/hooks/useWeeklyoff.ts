// import { weeklyOffService } from '@/services/api/weeklyOffService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  weeklyOffService,
  CreateWeeklyOffPayload,
  UpdateWeeklyOffPayload,
} from '../../../services/api/weeklyOffService';

export const WEEKLY_OFFS_QUERY_KEY = ['weekly-off-preset'];

export const useWeeklyOffs = () => {
  return useQuery({
    queryKey: WEEKLY_OFFS_QUERY_KEY,
    queryFn: weeklyOffService.getAll,
  });
};

export const useCreateWeeklyOff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWeeklyOffPayload) => weeklyOffService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEEKLY_OFFS_QUERY_KEY });
    },
  });
};

export const useUpdateWeeklyOff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWeeklyOffPayload }) =>
      weeklyOffService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEEKLY_OFFS_QUERY_KEY });
    },
  });
};

export const useDeleteWeeklyOff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => weeklyOffService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEEKLY_OFFS_QUERY_KEY });
    },
  });
};