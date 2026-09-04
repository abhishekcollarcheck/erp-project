
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeStatusService,
  CreateEmployeeStatusPayload,
  UpdateEmployeeStatusPayload,
} from '../../../services/api/employeeStatusService';


export const EMPLOYEE_STATUSES_QUERY_KEY = ['employee-statuses'];

export const useEmployeeStatuses = () => {
  return useQuery({
    queryKey: EMPLOYEE_STATUSES_QUERY_KEY,
    queryFn: employeeStatusService.getAll,
  });
};

export const useEmployeeStatus = (id: number) => {
  return useQuery({
    queryKey: [...EMPLOYEE_STATUSES_QUERY_KEY, id],
    queryFn: () => employeeStatusService.getById(id),
    enabled: !!id,
  });
};

export const useCreateEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nameOrPayload: string | CreateEmployeeStatusPayload) => {
      const payload =
        typeof nameOrPayload === 'string'
          ? { name: nameOrPayload }
          : nameOrPayload;
      return employeeStatusService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_STATUSES_QUERY_KEY });
    },
  });
};

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeStatusPayload }) =>
      employeeStatusService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_STATUSES_QUERY_KEY });
    },
  });
};

export const useReorderEmployeeStatuses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) => employeeStatusService.updateOrder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_STATUSES_QUERY_KEY });
    },
  });
};

export const useDeleteEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeStatusService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_STATUSES_QUERY_KEY });
    },
  });
};