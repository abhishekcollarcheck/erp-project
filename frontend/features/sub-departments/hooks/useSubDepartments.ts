'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subDepartmentService,
  type SubDepartmentQueryParams,
  type CreateSubDepartmentDto,
  type UpdateSubDepartmentDto,
} from '../../../services/api/subDepartment.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  all: ['sub-departments'] as const,
  list: (p?: SubDepartmentQueryParams) => ['sub-departments', 'list', p] as const,
  stats: ['sub-departments', 'stats'] as const,
  detail: (id: number) => ['sub-departments', id] as const,
  byDepartment: (deptId: number) => ['sub-departments', 'by-department', deptId] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────
export function useSubDepartments(params?: SubDepartmentQueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => subDepartmentService.getAll(params),
    staleTime: 2 * 60_000,
    select: (res) => res.data,
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────
export function useSubDepartment(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => subDepartmentService.getById(id),
    enabled: !!id && id > 0,
    staleTime: 60_000,
    select: (res) => res.data,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function useCreateSubDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubDepartmentDto) =>
      subDepartmentService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast(`✓ Sub-Department "${res.data.name}" created`);
    },
    onError: (err: any) =>
      showToast(err?.message || 'Failed to create sub-department'),
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────
export function useUpdateSubDepartment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubDepartmentDto) =>
      subDepartmentService.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.setQueryData(KEYS.detail(id), res);
      showToast(`✓ "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.message || 'Update failed'),
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export function useDeleteSubDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subDepartmentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Sub-Department deleted');
    },
    onError: (err: any) => showToast(err?.message || 'Delete failed'),
  });
}