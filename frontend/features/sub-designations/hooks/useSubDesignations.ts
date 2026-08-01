import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subDesignationService } from '../../../services/api/subDesignation.service';
import { showToast }          from '../../../utils/toast';
import type {
  CreateSubDesignationDto, UpdateSubDesignationDto, SubDesignationQueryParams,
} from '../types/subdesignation.types';

// ─── Query keys ───────────────────────────────────────────────────────────────
const KEYS = {
  all:    ['sub-designations']                                         as const,
  list:   (p?: SubDesignationQueryParams) => ['sub-designations', 'list', p]  as const,
  stats:  ['sub-designations', 'stats']                                as const,
  detail: (id: number)                    => ['sub-designations', id]         as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────
export function useSubDesignations(params?: SubDesignationQueryParams) {
  return useQuery({
    queryKey:  KEYS.list(params),
    queryFn:   () => subDesignationService.getAll(params),
    staleTime: 2 * 60_000,
    select:    (res) => {
      return res.data
    },
  });
}

// Convenience: dropdown options array
export function useSubDesignationOptions() {
  const { data = [] } = useSubDesignations();
  return data.map((sd) => ({ value: sd.id, label: sd.name }));
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function useSubDesignationStats() {
  return useQuery({
    queryKey:  KEYS.stats,
    queryFn:   () => subDesignationService.getStats(),
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────
export function useSubDesignation(id: number) {
  return useQuery({
    queryKey:  KEYS.detail(id),
    queryFn:   () => subDesignationService.getById(id),
    enabled:   !!id && id > 0,
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function useCreateSubDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubDesignationDto) => subDesignationService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast(`✓ "${res.data.name}" sub-designation created`);
    },
    onError: (err: any) => showToast(err?.message || 'Failed to create sub-designation'),
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────
export function useUpdateSubDesignation(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubDesignationDto) => subDesignationService.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.setQueryData(KEYS.detail(id), res);
      showToast(`✓ "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.message || 'Update failed'),
  });
}

// ─── Toggle active/inactive ───────────────────────────────────────────────────
export function useToggleSubDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subDesignationService.toggle(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast(`Sub-Designation ${res.data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (err: any) => showToast(err?.message || 'Toggle failed'),
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export function useDeleteSubDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subDesignationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Sub-Designation deleted');
    },
    onError: (err: any) => showToast(err?.message || 'Delete failed'),
  });
}