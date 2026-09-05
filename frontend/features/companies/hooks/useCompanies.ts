import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, type Company, type CompanyFormDto, type CompanyQueryParams } from '../../../services/api/company.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  all:  ['companies']                                as const,
  list: (p?: CompanyQueryParams) => ['companies', 'list', p] as const,
  one:  (id?: number) => ['companies', 'detail', id]  as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────
export function useCompanies(params?: CompanyQueryParams) {
  return useQuery({
    queryKey:  KEYS.list(params),
    queryFn:   () => companyService.getAll(params),
    staleTime: 30_000,
    select:    (res) => res.data,
  });
}

// ─── Single (for the edit form) ────────────────────────────────────────────
export function useCompany(id?: number | null) {
  return useQuery({
    queryKey:  KEYS.one(id ?? undefined),
    queryFn:   () => companyService.getById(id as number),
    enabled:   !!id,
    staleTime: 30_000,
    select:    (res) => res.data,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompanyFormDto) => companyService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('✓ Company created');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to create company'),
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────
export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanyFormDto> }) =>
      companyService.update(id, data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.one(variables.id) });
      showToast('✓ Company updated');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to update company'),
  });
}

// ─── Suspend / Activate (drives the "Status" dropdown) ───────────────────────
export function useSuspendCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companyService.suspend(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.one(id) });
      showToast('Company suspended');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to suspend company'),
  });
}

export function useActivateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companyService.activate(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.one(id) });
      showToast('✓ Company activated');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to activate company'),
  });
}

// ─── Logo upload ──────────────────────────────────────────────────────────────
export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => companyService.uploadLogo(id, file),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.one(variables.id) });
      showToast('✓ Logo updated');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to upload logo'),
  });
}