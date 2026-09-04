// // import { employeeTypeService } from '@/services/api/employeeTypeService';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   employeeTypeService,
//   EmployeeType,
//   CreateEmployeeTypePayload,
//   UpdateEmployeeTypePayload,
// } from '../../../services/api/employeeTypeService';

// export const EMPLOYEE_TYPES_QUERY_KEY = ['employee-types'];

// export const useEmployeeTypes = () => {
//   return useQuery({
//     queryKey: EMPLOYEE_TYPES_QUERY_KEY,
//     queryFn: employeeTypeService.getAll,
//   });
// };

// export const useEmployeeType = (id: number) => {
//   return useQuery({
//     queryKey: [...EMPLOYEE_TYPES_QUERY_KEY, id],
//     queryFn: () => employeeTypeService.getById(id),
//     enabled: !!id,
//   });
// };

// export const useCreateEmployeeType = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (nameOrPayload: string | CreateEmployeeTypePayload) => {
//       const payload =
//         typeof nameOrPayload === 'string'
//           ? { name: nameOrPayload }
//           : nameOrPayload;
//       return employeeTypeService.create(payload);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
//     },
//   });
// };

// export const useUpdateEmployeeType = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeTypePayload }) =>
//       employeeTypeService.update(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
//     },
//   });
// };

// export const useReorderEmployeeTypes = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (orderedIds: number[]) => employeeTypeService.updateOrder(orderedIds),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
//     },
//   });
// };

// export const useDeleteEmployeeType = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => employeeTypeService.delete(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
//     },
//   });
// };

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeTypeService,
  CreateEmployeeTypePayload,
  UpdateEmployeeTypePayload,
} from '../../../services/api/employeeTypeService';

export const EMPLOYEE_TYPES_QUERY_KEY = ['employee-types'];

export const useEmployeeTypes = () => {
  return useQuery({
    queryKey: EMPLOYEE_TYPES_QUERY_KEY,
    queryFn: employeeTypeService.getAll,
  });
};

export const useEmployeeType = (id: number) => {
  return useQuery({
    queryKey: [...EMPLOYEE_TYPES_QUERY_KEY, id],
    queryFn: () => employeeTypeService.getById(id),
    enabled: !!id,
  });
};

export const useCreateEmployeeType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nameOrPayload: string | CreateEmployeeTypePayload) => {
      const payload =
        typeof nameOrPayload === 'string'
          ? { name: nameOrPayload }
          : nameOrPayload;
      return employeeTypeService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
    },
  });
};

export const useUpdateEmployeeType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeTypePayload }) =>
      employeeTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
    },
  });
};

export const useReorderEmployeeTypes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) => employeeTypeService.updateOrder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
    },
  });
};

export const useDeleteEmployeeType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_TYPES_QUERY_KEY });
    },
  });
};