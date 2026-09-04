'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  departmentService,
  type DepartmentQueryParams,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
} from '../../../services/api/department.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  all: ['departments'] as const,
  lists: () => ['departments', 'list'] as const,
  list: (params?: DepartmentQueryParams) => ['departments', 'list', params] as const,
  stats: (params?: Pick<DepartmentQueryParams, 'company_id' | 'company_ids'>) =>
    ['departments', 'stats', params] as const,
  detail: (id: number) => ['departments', 'detail', id] as const,
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

export function useDepartments(params?: DepartmentQueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await departmentService.getAll(params);
      return res.data; // Extract array data
    },
    staleTime: 2 * 60_000,
  });
}

export function useDepartmentStats(
  params?: Pick<DepartmentQueryParams, 'company_id' | 'company_ids'>,
) {
  return useQuery({
    queryKey: KEYS.stats(params),
    queryFn: async () => {
      const res = await departmentService.getStats(params);
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useDepartment(id: number | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? 0),
    queryFn: async () => {
      const res = await departmentService.getById(id as number);
      return res.data;
    },
    enabled: Boolean(id && id > 0),
    staleTime: 60_000,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentDto) => departmentService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      const deptName = res.data?.department_name || 'Department';
      showToast(`✓ "${deptName}" created successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Failed to create department')),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDepartmentDto }) =>
      departmentService.update(id, data),
    onSuccess: (res) => {
      // Invalidate all department query caches to force dynamic useQueries to refetch updated company associations
      qc.invalidateQueries({ queryKey: KEYS.all });
      
      if (res.data?.id) {
        qc.setQueryData(KEYS.detail(res.data.id), res.data);
      }
      
      const name = res.data?.department_name || 'Department';
      showToast(`✓ "${name}" updated successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Update failed')),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Department deleted');
    },
    onError: (err) => showToast(getErrorMessage(err, 'Delete failed')),
  });
}