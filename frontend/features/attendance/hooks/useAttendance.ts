import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  attendanceService,
  type AttendanceQueryParams,
  type MarkAttendanceDto,
  type UpdateAttendanceDto,
  type CreateRegularizationDto,
  type ReviewRegularizationDto,
  type EmployeeAttendanceQueryParams,
} from '../../../services/api/attendance.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  all:                ['attendance']                                    as const,
  todaySummary:       ['attendance', 'today-summary']                   as const,
  list:               (p?: AttendanceQueryParams) => ['attendance', 'list', p] as const,
  byEmployee:         (id: number, p?: EmployeeAttendanceQueryParams) => ['attendance', 'employee', id, p] as const,
  myRegularizations:  ['attendance', 'regularization', 'my']             as const,
  pendingRegularizations: ['attendance', 'regularization', 'pending']    as const,
  myBiometric:        (p?: EmployeeAttendanceQueryParams) => ['attendance', 'biometric', 'my', p] as const,
  biometricByCode:    (code: string, p?: EmployeeAttendanceQueryParams) => ['attendance', 'biometric', 'employee', code, p] as const,
  biometricToday:     ['attendance', 'biometric', 'today']               as const,
};

// ─── Today's summary (dashboard stat cards) ─────────────────────────────────
export function useTodaySummary() {
  return useQuery({
    queryKey:  KEYS.todaySummary,
    queryFn:   () => attendanceService.getTodaySummary(),
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// ─── Filterable list (roster) ──────────────────────────────────────────────
export function useAttendanceList(params?: AttendanceQueryParams) {
  return useQuery({
    queryKey:  KEYS.list(params),
    queryFn:   () => attendanceService.getAll(params),
    staleTime: 30_000,
    select:    (res) => ({ data: res.data, meta: res.meta }),
  });
}

// ─── Monthly records for one employee ──────────────────────────────────────
export function useEmployeeAttendance(employeeId: number, params?: EmployeeAttendanceQueryParams) {
  return useQuery({
    queryKey:  KEYS.byEmployee(employeeId, params),
    queryFn:   () => attendanceService.getByEmployee(employeeId, params),
    enabled:   !!employeeId && employeeId > 0,
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// ─── Mark / correct attendance ──────────────────────────────────────────────
export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkAttendanceDto) => attendanceService.mark(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast(`✓ Attendance ${res.message.toLowerCase()}`);
    },
    onError: (err: any) => showToast(err?.message || 'Failed to mark attendance'),
  });
}

// ─── Bulk mark ──────────────────────────────────────────────────────────────
export function useBulkMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: MarkAttendanceDto[]) => attendanceService.bulkMark(records),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast(`✓ Bulk mark: ${res.data.success} succeeded, ${res.data.failed} failed`);
    },
    onError: (err: any) => showToast(err?.message || 'Bulk mark failed'),
  });
}

// ─── Update existing record ──────────────────────────────────────────────────
export function useUpdateAttendance(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAttendanceDto) => attendanceService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('✓ Attendance updated');
    },
    onError: (err: any) => showToast(err?.message || 'Update failed'),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Regularization
// ═══════════════════════════════════════════════════════════════════════

export function useMyRegularizations() {
  return useQuery({
    queryKey:  KEYS.myRegularizations,
    queryFn:   () => attendanceService.getMyRegularizations(),
    staleTime: 30_000,
    select:    (res) => res.data,
  });
}

export function usePendingRegularizations() {
  return useQuery({
    queryKey:  KEYS.pendingRegularizations,
    queryFn:   () => attendanceService.getPendingRegularizations(),
    staleTime: 30_000,
    retry:     false, // a 403 here just means "not a manager" — don't retry, let the component hide the panel
    select:    (res) => res.data,
  });
}

export function useCreateRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRegularizationDto) => attendanceService.createRegularization(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myRegularizations });
      showToast('✓ Correction request submitted');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to submit request'),
  });
}

export function useReviewRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewRegularizationDto }) =>
      attendanceService.reviewRegularization(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.pendingRegularizations });
      qc.invalidateQueries({ queryKey: KEYS.all }); // approval writes into finalized attendance too
      showToast(`✓ Request ${res.data.status.toLowerCase()}`);
    },
    onError: (err: any) => showToast(err?.message || 'Failed to review request'),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Biometric (MSSQL)
// ═══════════════════════════════════════════════════════════════════════

// Self-service — no employee code passed; backend resolves it from the token.
export function useMyBiometricAttendance(params?: EmployeeAttendanceQueryParams) {
  return useQuery({
    queryKey:  KEYS.myBiometric(params),
    queryFn:   () => attendanceService.getMyBiometricAttendance(params),
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// Admin/HR lookup tool — any employee by code
export function useBiometricByEmployeeCode(code: string, params?: EmployeeAttendanceQueryParams) {
  return useQuery({
    queryKey:  KEYS.biometricByCode(code, params),
    queryFn:   () => attendanceService.getBiometricByEmployeeCode(code, params),
    enabled:   !!code,
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

export function useBiometricToday() {
  return useQuery({
    queryKey:  KEYS.biometricToday,
    queryFn:   () => attendanceService.getBiometricToday(),
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// ─── Combined — Biometric + Trakola merged per day ─────────────────────────
export function useMyCombinedAttendance(params: { date_from: string; date_to: string }) {
  return useQuery({
    queryKey:  ['attendance', 'combined', 'my', params],
    queryFn:   () => attendanceService.getMyCombinedAttendance(params),
    staleTime: 60_000,
    select:    (res) => {
      console.log("res.data", res.data)
      return res.data
    },
  });
}