/**
 * useEmployees.ts
 * All TanStack Query hooks for the employee wizard module.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../../services/api/employee.service';
import { showToast } from '../../../utils/toast';
import { useCompany } from '../../../features/company/hooks/useCompany';
import { selectActiveCompanyId } from '../../../store/slices/authSlice';
import { useAppSelector } from '../../../store';
import { StepSchemaKey } from '../validations/employee.schema';

// const DENY_ALL = { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };

const FULL_ACCESS = {
  can_view: true,
  can_edit: true,
  can_copy: true,
  can_download: true,
  is_masked: false,
};

const DENY_ALL = {
  can_view: false,
  can_edit: false,
  can_copy: false,
  can_download: false,
  is_masked: false,
};




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

export function resolveFieldPerm(
  fp: Record<string, {
    can_view: boolean;
    can_edit: boolean;
    can_copy: boolean;
    can_download: boolean;
    is_masked: boolean;
  }> | undefined,
  fieldName: string,
) {
  const TEMP_FULL_ACCESS = true;

  if (TEMP_FULL_ACCESS) {
    return FULL_ACCESS;
  }

  return fp?.[fieldName] ?? DENY_ALL;
}
