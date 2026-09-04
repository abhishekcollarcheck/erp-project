import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { probationService, ProbationType } from '@/services/api/probationService';

export const PROBATION_QUERY_KEY = (type: ProbationType) => ['probation', type];

export const useProbationList = (type: ProbationType) => {
  return useQuery({
    queryKey: PROBATION_QUERY_KEY(type),
    queryFn: () => probationService.getAll(type),
  });
};

export const useCreateProbation = (type: ProbationType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, code }: { name: string; code?: string }) =>
      probationService.create(type, name, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBATION_QUERY_KEY(type) });
    },
  });
};

export const useUpdateProbation = (type: ProbationType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; code?: string; is_active?: boolean };
    }) => probationService.update(type, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBATION_QUERY_KEY(type) });
    },
  });
};

export const useReorderProbation = (type: ProbationType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => probationService.updateOrder(type, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBATION_QUERY_KEY(type) });
    },
  });
};

export const useDeleteProbation = (type: ProbationType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => probationService.delete(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBATION_QUERY_KEY(type) });
    },
  });
};