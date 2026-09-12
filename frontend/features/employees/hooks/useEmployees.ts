/**
 * useEmployees.ts
 * All TanStack Query hooks for the employee wizard module.
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../../services/api/employee.service';
import { showToast } from '../../../utils/toast';
import { useCompany } from '../../../features/company/hooks/useCompany';
import { selectActiveCompanyId, selectIsSuperAdmin } from '../../../store/slices/authSlice';
import { useAppSelector } from '../../../store';
import { StepSchemaKey } from '../validations/employee.schema';
import { resolveFieldPerm } from './useFieldPerm';
import type { FieldPermissionEntry } from '../../rbac/types/rbac.types';
import { maskValue, maskPartial } from '../../../utils/validationEngine';

// Field-permission resolution now lives in ./useFieldPerm. Re-exported here so
// existing `import { resolveFieldPerm } from '../../hooks/useEmployees'` keep
// working; new code should pull useFieldPerm() from ./useFieldPerm directly.
export { resolveFieldPerm, useFieldPerm, useStepFieldPerms, FieldPermProvider } from './useFieldPerm';

/**
 * Provider-free field-permission resolver for the Employee module's READ
 * surfaces (list, detail, modals) — mirrors the wizard's `useFieldPerm()` but
 * pulls the active-company map from TanStack Query directly instead of a React
 * context. `completionPct` is irrelevant for read views (nothing is editable)
 * so it's fixed at 100.
 */
export function useEmployeeFieldPerm(module: string = 'employees') {
  const { data: fp } = useFieldPermissions(module);
  const bypass = useAppSelector(selectIsSuperAdmin);
  return useMemo(
    () => (fieldKey: string): FieldPermissionEntry => resolveFieldPerm(fp, fieldKey, { bypass, completionPct: 100 }),
    [fp, bypass],
  );
}

/**
 * Given a resolved permission and a raw value, returns how to render it:
 * `{ hide }` when not viewable, otherwise `{ text }` (masked when the field is
 * masked, else the raw string). Non-string values pass through untouched unless
 * masked.
 */
export function maskEmployeeValue(
  perm: FieldPermissionEntry | undefined,
  raw: unknown,
  fieldKey: string,
): { hide: boolean; text: any } {
  if (perm && perm.can_view === false) return { hide: true, text: undefined };
  if (raw == null || raw === '') return { hide: false, text: raw };
  // The API already masks masked fields server-side — don't re-mask an
  // already-masked string (would garble it).
  const looksMasked = typeof raw === 'string' && /[•*]/.test(raw);
  if (perm?.is_masked)         return { hide: false, text: looksMasked ? raw : maskValue(String(raw), fieldKey) };
  if (perm?.is_partial_masked) return { hide: false, text: looksMasked ? raw : maskPartial(String(raw)) };
  return { hide: false, text: raw };
}


// ─── Query key factory ────────────────────────────────────────────────────────
export const EMP_KEYS = {
  all:           ['employees'] as const,
  lists:         () => [...EMP_KEYS.all, 'list'] as const,
  list:          (p: object) => [...EMP_KEYS.lists(), p] as const,
  detail:        (id: number) => [...EMP_KEYS.all, id] as const,
  summary:       ['employees', 'summary'] as const,
  fieldPerms:    ['employees', 'field-permissions'] as const,
  draft:         (sid: string) => ['employees', 'draft', sid] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────
export function useEmployees(params?: object) {
  const {companyId} = useCompany()
  return useQuery({
    queryKey: EMP_KEYS.list({
      ...params,
      companyId,
    }),
    queryFn: () => employeeService.getAll(params),
    // staleTime: 30_000,
    select: (res) => {
     return {rows: res.data,meta: res.meta,data: res.data,}
  } ,
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────
export function useEmployee(id: number) {
  return useQuery({
    queryKey: EMP_KEYS.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: id > 0,
    staleTime: 0,
    select: (res) => res.data,
  });
}

// ─── Summary stats ────────────────────────────────────────────────────────────
export function useEmployeeSummary() {
  return useQuery({
    queryKey: EMP_KEYS.summary,
    queryFn: () => employeeService.summary(),
    staleTime: 0,
    select: (res: any) => res.data,
  });
}

export function useFieldPermissions(module: string = 'employees') {
  const activeCompanyId = useAppSelector(selectActiveCompanyId);
  return useQuery({
    queryKey: [...EMP_KEYS.fieldPerms, module],
    queryFn: () => employeeService.fieldPermissions(module),
    enabled: activeCompanyId != null,
    select: (res: any) => (activeCompanyId != null ? res.data?.[activeCompanyId] : {}) ?? {},
    staleTime: 0,
  });
}

// ─── Manager lookup by code ───────────────────────────────────────────────────
// Resolve a single manager by employee_id (integer FK — not employee_code)
export function useManagerById(managerId: number | null | undefined) {
  return useQuery({
    queryKey: ['employees', 'manager', managerId ?? 0],
    queryFn: () => employeeService.managerById(managerId!),
    enabled: !!managerId && managerId > 0,
    staleTime: 0,
    select: (res: any) => res.data as { id: number; employee_code: string | null; first_name: string; last_name: string; },
  });
}

// ─── Draft ────────────────────────────────────────────────────────────────────
export function useDraft(sessionId: string | null) {
  return useQuery({
    queryKey: EMP_KEYS.draft(sessionId ?? ''),
    queryFn: () => employeeService.getDraft(sessionId!),
    enabled: !!sessionId,
    staleTime: 0,
    select: (res: any) => res.data,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => employeeService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMP_KEYS.lists() }),
    onError: (err: any) => showToast(err?.message || 'Failed to create employee'),
  });
}

// ─── Step update ─────────────────────────────────────────────────────────────
export function useUpdateStep(employeeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ step, data }: { step: StepSchemaKey; data: object }) =>
      employeeService.updateStep(employeeId, step, data),
    onSuccess: (res: any) => {
      qc.setQueryData(EMP_KEYS.detail(employeeId), (old: any) =>
        old ? { ...old, data: { ...old.data, ...res.data } } : old
      );
    },
    onError: (err: any) => showToast(err?.message || 'Save failed'),
  });
}

// ─── Save draft ───────────────────────────────────────────────────────────────
// IMPORTANT: a draft save can silently create/update the underlying employees
// row (see backend saveDraft — first_name + phone present ⇒ persisted:true).
// Without invalidating the list/summary/detail queries here, a Draft employee
// created via autosave never appears in the Employee List until an unrelated
// full remount happens to refetch it. This is the fix for that bug.
export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { employee_id?: number | null; step: string; form_data: object; session_id: string }) =>
      employeeService.saveDraft(payload),
    onSuccess: (res: any, variables) => {
      const employeeId: number | undefined = res?.data?.employeeId;
      if (res?.data?.persisted) {
        qc.invalidateQueries({ queryKey: EMP_KEYS.lists() });
        qc.invalidateQueries({ queryKey: EMP_KEYS.summary });
        if (employeeId) qc.invalidateQueries({ queryKey: EMP_KEYS.detail(employeeId) });
      }
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: EMP_KEYS.lists() }); showToast('Employee removed'); },
    onError: (err: any) => showToast(err?.message || 'Delete failed'),
  });
}

// ─── Inter-company transfer ───────────────────────────────────────────────────
export function useTransferEmployee(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => employeeService.transfer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMP_KEYS.lists() });
      qc.invalidateQueries({ queryKey: EMP_KEYS.detail(id) });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || err?.message || 'Transfer failed'),
  });
}

// ─── Bulk upload ──────────────────────────────────────────────────────────────
export function useBulkUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeeService.bulkUpload(file),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: EMP_KEYS.lists() });
      showToast(`${res.data?.success || 0} employees imported`);
    },
    onError: (err: any) => showToast(err?.message || 'Upload failed'),
  });
}

// ─── Full-field bulk import ───────────────────────────────────────────────────
export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeeService.bulkImport(file),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: EMP_KEYS.lists() });
      const d = res.data || {};
      showToast(`${d.imported || 0} imported, ${d.failed || 0} failed`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || err?.message || 'Import failed'),
  });
}

// ─── Role & Identity: profile photo upload ─────────────────────────────────
export function useUploadAvatar(employeeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeeService.uploadAvatar(employeeId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMP_KEYS.detail(employeeId) }),
    onError: (err: any) => showToast(err?.message || 'Photo upload failed'),
  });
}

// ─── IDs & Bank: document uploads ──────────────────────────────────────────────
export function useUploadIdDocument(employeeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docType, file }: { docType: 'aadhaar' | 'pan' | 'passport' | 'drivingLicense'; file: File }) =>
      employeeService.uploadIdDocument(employeeId, docType, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMP_KEYS.detail(employeeId) }),
    onError: (err: any) => showToast(err?.message || 'Upload failed'),
  });
}

export function useUploadExtraDocument(employeeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docType, docTypeOther, file }: { docType: string; docTypeOther?: string; file: File }) =>
      employeeService.uploadExtraDocument(employeeId, docType, docTypeOther, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMP_KEYS.detail(employeeId) }),
    onError: (err: any) => showToast(err?.message || 'Upload failed'),
  });
}

