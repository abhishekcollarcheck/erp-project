// 'use client';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   subDepartmentService,
//   type SubDepartmentQueryParams,
//   type CreateSubDepartmentDto,
//   type UpdateSubDepartmentDto,
// } from '../../../services/api/subDepartment.service';
// import { showToast } from '../../../utils/toast';

// const KEYS = {
//   all: ['sub-departments'] as const,
//   list: (p?: SubDepartmentQueryParams) => ['sub-departments', 'list', p] as const,
//   stats: ['sub-departments', 'stats'] as const,
//   detail: (id: number) => ['sub-departments', id] as const,
//   byDepartment: (deptId: number) => ['sub-departments', 'by-department', deptId] as const,
// };

// // ─── List ─────────────────────────────────────────────────────────────────────
// export function useSubDepartments(params?: SubDepartmentQueryParams) {
//   return useQuery({
//     queryKey: KEYS.list(params),
//     queryFn: () => subDepartmentService.getAll(params),
//     staleTime: 2 * 60_000,
//     select: (res) => res.data,
//   });
// }

// // ─── Single ───────────────────────────────────────────────────────────────────
// export function useSubDepartment(id: number) {
//   return useQuery({
//     queryKey: KEYS.detail(id),
//     queryFn: () => subDepartmentService.getById(id),
//     enabled: !!id && id > 0,
//     staleTime: 60_000,
//     select: (res) => res.data,
//   });
// }

// // ─── Create ───────────────────────────────────────────────────────────────────
// export function useCreateSubDepartment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: CreateSubDepartmentDto) =>
//       subDepartmentService.create(data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast(`✓ Sub-Department "${res.data.name}" created`);
//     },
//     onError: (err: any) =>
//       showToast(err?.message || 'Failed to create sub-department'),
//   });
// }

// // ─── Update ───────────────────────────────────────────────────────────────────
// export function useUpdateSubDepartment(id: number) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: UpdateSubDepartmentDto) =>
//       subDepartmentService.update(id, data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       qc.setQueryData(KEYS.detail(id), res);
//       showToast(`✓ "${res.data.name}" updated`);
//     },
//     onError: (err: any) => showToast(err?.message || 'Update failed'),
//   });
// }

// // ─── Delete ───────────────────────────────────────────────────────────────────
// export function useDeleteSubDepartment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: number) => subDepartmentService.delete(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('Sub-Department deleted');
//     },
//     onError: (err: any) => showToast(err?.message || 'Delete failed'),
//   });
// }



// 'use client';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   subDepartmentService,
//   type SubDepartmentQueryParams,
//   type CreateSubDepartmentDto,
//   type UpdateSubDepartmentDto,
// } from '../../../services/api/subDepartment.service';
// import { showToast } from '../../../utils/toast';

// const KEYS = {
//   all: ['sub-departments'] as const,
//   list: (p?: SubDepartmentQueryParams) => ['sub-departments', 'list', p] as const,
//   detail: (id: number) => ['sub-departments', id] as const,
// };

// // ─── List (optionally scoped to a department via params.department_id) ───────
// export function useSubDepartments(params?: SubDepartmentQueryParams) {
//   return useQuery({
//     queryKey: KEYS.list(params),
//     queryFn: () => subDepartmentService.getAll(params),
//     staleTime: 2 * 60_000,
//     select: (res) => res.data,
//   });
// }

// // ─── Single ───────────────────────────────────────────────────────────────────
// export function useSubDepartment(id: number | null) {
//   return useQuery({
//     queryKey: KEYS.detail(id ?? 0),
//     queryFn: () => subDepartmentService.getById(id as number),
//     enabled: !!id && id > 0,
//     staleTime: 60_000,
//     select: (res) => res.data,
//   });
// }

// // ─── Create ───────────────────────────────────────────────────────────────────
// export function useCreateSubDepartment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: CreateSubDepartmentDto) => subDepartmentService.create(data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast(`✓ Sub-Department "${res.data.name}" created`);
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to create sub-department'),
//   });
// }

// // ─── Update ───────────────────────────────────────────────────────────────────
// export function useUpdateSubDepartment(id: number) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: UpdateSubDepartmentDto) => subDepartmentService.update(id, data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       qc.setQueryData(KEYS.detail(id), res);
//       showToast(`✓ "${res.data.name}" updated`);
//     },
//     onError: (err: any) => showToast(err?.message || 'Update failed'),
//   });
// }

// // ─── Delete ───────────────────────────────────────────────────────────────────
// export function useDeleteSubDepartment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: number) => subDepartmentService.delete(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('Sub-Department deleted');
//     },
//     onError: (err: any) => showToast(err?.message || 'Delete failed'),
//   });
// }

// 'use client';

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   subDepartmentService,
//   type SubDepartmentQueryParams,
//   type CreateSubDepartmentDto,
//   type UpdateSubDepartmentDto,
// } from '../../../services/api/subDepartment.service';
// import { showToast } from '../../../utils/toast';

// const KEYS = {
//   all: ['sub-departments'] as const,
//   list: (p?: SubDepartmentQueryParams) => ['sub-departments', 'list', p] as const,
//   detail: (id: number) => ['sub-departments', id] as const,
// };

// // ─── List Query ───────────────────────────────────────────────────────────────
// export function useSubDepartments(params?: SubDepartmentQueryParams) {
//   return useQuery({
//     queryKey: KEYS.list(params),
//     queryFn: () => subDepartmentService.getAll(params),
//     staleTime: 2 * 60_000,
//     select: (res) => res.data,
//   });
// }

// // ─── Single Detail Query ──────────────────────────────────────────────────────
// export function useSubDepartment(id: number | null) {
//   return useQuery({
//     queryKey: KEYS.detail(id ?? 0),
//     queryFn: () => subDepartmentService.getById(id as number),
//     enabled: !!id && id > 0,
//     staleTime: 60_000,
//     select: (res) => res.data,
//   });
// }

// // ─── Create Mutation ──────────────────────────────────────────────────────────
// export function useCreateSubDepartment() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateSubDepartmentDto) => subDepartmentService.create(data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       qc.invalidateQueries({ queryKey: ['departments'] });
//       showToast(`✓ Sub-Department "${res.data.name}" created`);
//     },
//     onError: (err: any) => {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to create sub-department');
//     },
//   });
// }

// // ─── Update Mutation ──────────────────────────────────────────────────────────
// export function useUpdateSubDepartment() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: UpdateSubDepartmentDto }) =>
//       subDepartmentService.update(id, data),
//     onSuccess: (res, variables) => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       qc.invalidateQueries({ queryKey: ['departments'] });
//       qc.setQueryData(KEYS.detail(variables.id), res);
//       showToast(`✓ "${res.data.name}" updated`);
//     },
//     onError: (err: any) => {
//       showToast(err?.response?.data?.message || err?.message || 'Update failed');
//     },
//   });
// }

// // ─── Delete Mutation ──────────────────────────────────────────────────────────
// export function useDeleteSubDepartment() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => subDepartmentService.delete(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       qc.invalidateQueries({ queryKey: ['departments'] });
//       showToast('Sub-Department deleted');
//     },
//     onError: (err: any) => {
//       showToast(err?.response?.data?.message || err?.message || 'Delete failed');
//     },
//   });
// }



'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  subDepartmentService,
  type SubDepartmentQueryParams,
  type CreateSubDepartmentDto,
  type UpdateSubDepartmentDto,
} from '@/services/api/subDepartment.service';
import { showToast } from '../../../utils/toast';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS FACTORY
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  all: ['sub-departments'] as const,
  lists: () => ['sub-departments', 'list'] as const,
  list: (params?: SubDepartmentQueryParams) => ['sub-departments', 'list', params] as const,
  detail: (id: number) => ['sub-departments', 'detail', id] as const,
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const res = (err as any).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useSubDepartments(params?: SubDepartmentQueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await subDepartmentService.getAll(params);
      return res.data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useSubDepartment(id: number | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? 0),
    queryFn: async () => {
      const res = await subDepartmentService.getById(id as number);
      return res.data;
    },
    enabled: Boolean(id && id > 0),
    staleTime: 60_000,
  });
}

export function useCreateSubDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubDepartmentDto) => subDepartmentService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      // A sub-department's department links can change what shows under a
      // given department, so keep the Department views fresh too.
      qc.invalidateQueries({ queryKey: ['departments'] });
      const name = res.data?.name || 'Sub-Department';
      showToast(`✓ "${name}" created successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Failed to create sub-department')),
  });
}

export function useUpdateSubDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubDepartmentDto }) =>
      subDepartmentService.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['departments'] });

      if (res.data?.id) {
        qc.setQueryData(KEYS.detail(res.data.id), res.data);
      }

      const name = res.data?.name || 'Sub-Department';
      showToast(`✓ "${name}" updated successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Update failed')),
  });
}

export function useDeleteSubDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => subDepartmentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['departments'] });
      showToast('Sub-department deleted');
    },
    onError: (err) => showToast(getErrorMessage(err, 'Delete failed')),
  });
}


