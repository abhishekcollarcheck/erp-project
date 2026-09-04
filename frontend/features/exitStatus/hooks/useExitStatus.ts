import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exitStatusService } from '@/services/api/exitStatusService';

export const EXIT_STATUS_QUERY_KEY = ['exit-statuses'];

export const useExitStatusList = () => {
  return useQuery({
    queryKey: EXIT_STATUS_QUERY_KEY,
    queryFn: () => exitStatusService.getAll(),
  });
};

export const useCreateExitStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, code }: { name: string; code?: string }) =>
      exitStatusService.create(name, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXIT_STATUS_QUERY_KEY });
    },
  });
};

export const useUpdateExitStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; code?: string; is_active?: boolean };
    }) => exitStatusService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXIT_STATUS_QUERY_KEY });
    },
  });
};

export const useReorderExitStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => exitStatusService.updateOrder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXIT_STATUS_QUERY_KEY });
    },
  });
};

export const useDeleteExitStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => exitStatusService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXIT_STATUS_QUERY_KEY });
    },
  });
};