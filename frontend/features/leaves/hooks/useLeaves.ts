// import { useMemo } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { leaveService, type LeaveQueryParams, type ApplyLeaveDto } from '../../../services/api/leave.service';
// import { showToast } from '../../../utils/toast';

// const KEYS = {
//   all:   ['leaves']                              as const,
//   list:  (p?: LeaveQueryParams) => ['leaves', 'list', p] as const,
//   types: ['leaves', 'types']                      as const,
//   pending: ['leaves', 'pending']                   as const,
//   balance: (employeeId?: number) => ['leaves', 'balance', employeeId] as const,
// };

// // ─── Leave types ────────────────────────────────────────────────────────────
// export function useLeaveTypes() {
//   return useQuery({
//     queryKey:  KEYS.types,
//     queryFn:   () => leaveService.getTypes(),
//     staleTime: 5 * 60_000,
//     select:    (res) => res.data,
//   });
// }

// // Display order requested for the Type of Leave dropdown: Short, Earned, Casual — not alphabetical.
// const LEAVE_TYPE_ORDER: Record<string, number> = { ShL: 0, EL: 1, CL: 2 };

// export function useLeaveTypeOptions() {
//   const query = useLeaveTypes();

//   // Memoized so the returned array keeps a stable reference across renders
//   // when the underlying data hasn't changed — safe to use as a useEffect dep.
//   const data = useMemo(
//     () => (query.data || [])
//       .map((t) => ({ value: t.id, label: t.name, code: t.code }))
//       .sort((a, b) => (LEAVE_TYPE_ORDER[a.code] ?? 99) - (LEAVE_TYPE_ORDER[b.code] ?? 99)),
//     [query.data],
//   );

//   return { ...query, data };
// }

// // ─── List ─────────────────────────────────────────────────────────────────────
// export function useLeaves(params?: LeaveQueryParams) {
//   return useQuery({
//     queryKey:  KEYS.list(params),
//     queryFn:   () => leaveService.getAll(params),
//     staleTime: 60_000,
//     select:    (res) => res.data,
//   });
// }

// // ─── My leave requests (any status) ────────────────────────────────────────
// // limit: 100 so the calendar (which needs the full history, not just the
// // latest page) and the "My Leave Requests" table both see everything.
// export function useMyLeaves(employeeId?: number) {
//   return useQuery({
//     queryKey:  KEYS.list({ employee_id: employeeId }),
//     queryFn:   () => leaveService.getAll({ employee_id: employeeId, limit: 100 }),
//     staleTime: 30_000,
//     enabled:   !!employeeId,
//     select:    (res) => res.data,
//   });
// }

// // ─── Leave balances ─────────────────────────────────────────────────────────
// // Pass an employeeId to check another employee's balance (requires leaves:approve
// // on the backend); omit to get the logged-in user's own balance.
// export function useLeaveBalances(employeeId?: number, enabled: boolean = true) {
//   return useQuery({
//     queryKey:  KEYS.balance(employeeId),
//     queryFn:   () => leaveService.getBalance(employeeId),
//     staleTime: 30_000,
//     enabled,
//     select:    (res) => res.data,
//   });
// }

// // ─── Pending approvals ──────────────────────────────────────────────────────
// export function usePendingLeaves(enabled: boolean = true) {
//   return useQuery({
//     queryKey:  KEYS.pending,
//     queryFn:   () => leaveService.getPending(),
//     staleTime: 30_000,
//     enabled,
//     select:    (res) => res.data,
//   });
// }

// // ─── Apply ────────────────────────────────────────────────────────────────────
// export function useApplyLeave() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: ApplyLeaveDto) => leaveService.apply(data),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('✓ Leave request submitted');
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to submit leave request'),
//   });
// }

// // ─── Approve ──────────────────────────────────────────────────────────────────
// export function useApproveLeave() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: number) => leaveService.approve(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('✓ Leave approved');
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to approve leave'),
//   });
// }

// // ─── Reject ───────────────────────────────────────────────────────────────────
// export function useRejectLeave() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, reason }: { id: number; reason?: string }) => leaveService.reject(id, reason),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('Leave rejected');
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to reject leave'),
//   });
// }



// import { useMemo } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { leaveService, type LeaveQueryParams, type ApplyLeaveDto } from '../../../services/api/leave.service';
// import { showToast } from '../../../utils/toast';

// const KEYS = {
//   all:   ['leaves']                              as const,
//   list:  (p?: LeaveQueryParams) => ['leaves', 'list', p] as const,
//   types: ['leaves', 'types']                      as const,
//   pending: ['leaves', 'pending']                   as const,
//   balance: (employeeId?: number) => ['leaves', 'balance', employeeId] as const,
// };

// // ─── Leave types ────────────────────────────────────────────────────────────
// export function useLeaveTypes() {
//   return useQuery({
//     queryKey:  KEYS.types,
//     queryFn:   () => leaveService.getTypes(),
//     staleTime: 5 * 60_000,
//     select:    (res) => res.data,
//   });
// }

// // Display order requested for the Type of Leave dropdown: Short, Earned, Casual — not alphabetical.
// const LEAVE_TYPE_ORDER: Record<string, number> = { ShL: 0, EL: 1, CL: 2 };

// export function useLeaveTypeOptions() {
//   const query = useLeaveTypes();

//   // Memoized so the returned array keeps a stable reference across renders
//   // when the underlying data hasn't changed — safe to use as a useEffect dep.
//   const data = useMemo(
//     () => (query.data || [])
//       .map((t) => ({ value: t.id, label: t.name, code: t.code }))
//       .sort((a, b) => (LEAVE_TYPE_ORDER[a.code] ?? 99) - (LEAVE_TYPE_ORDER[b.code] ?? 99)),
//     [query.data],
//   );

//   return { ...query, data };
// }

// // ─── List ─────────────────────────────────────────────────────────────────────
// export function useLeaves(params?: LeaveQueryParams) {
//   return useQuery({
//     queryKey:  KEYS.list(params),
//     queryFn:   () => leaveService.getAll(params),
//     staleTime: 60_000,
//     select:    (res) => res.data,
//   });
// }

// // ─── My leave requests (any status) ────────────────────────────────────────
// // limit: 100 so the calendar (which needs the full history, not just the
// // latest page) and the "My Leave Requests" table both see everything.
// export function useMyLeaves(employeeId?: number) {
//   return useQuery({
//     queryKey:  KEYS.list({ employee_id: employeeId }),
//     queryFn:   () => leaveService.getAll({ employee_id: employeeId, limit: 100 }),
//     staleTime: 30_000,
//     enabled:   !!employeeId,
//     select:    (res) => res.data,
//   });
// }

// // ─── Leave balances ─────────────────────────────────────────────────────────
// // Pass an employeeId to check another employee's balance (requires leaves:approve
// // on the backend); omit to get the logged-in user's own balance.
// export function useLeaveBalances(employeeId?: number, enabled: boolean = true) {
//   return useQuery({
//     queryKey:  KEYS.balance(employeeId),
//     queryFn:   () => leaveService.getBalance(employeeId),
//     staleTime: 30_000,
//     enabled,
//     select:    (res) => res.data,
//   });
// }

// // ─── Pending approvals ──────────────────────────────────────────────────────
// export function usePendingLeaves(enabled: boolean = true) {
//   return useQuery({
//     queryKey:  KEYS.pending,
//     queryFn:   () => leaveService.getPending(),
//     staleTime: 30_000,
//     enabled,
//     select:    (res) => res.data,
//   });
// }

// // ─── Apply ────────────────────────────────────────────────────────────────────
// export function useApplyLeave() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: ApplyLeaveDto) => leaveService.apply(data),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('✓ Leave request submitted');
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to submit leave request'),
//   });
// }

// // ─── Approve ──────────────────────────────────────────────────────────────────
// export function useApproveLeave() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: number) => leaveService.approve(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('✓ Leave approved');
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to approve leave'),
//   });
// }

// // ─── Reject ───────────────────────────────────────────────────────────────────
// export function useRejectLeave() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, reason }: { id: number; reason?: string }) => leaveService.reject(id, reason),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.all });
//       showToast('Leave rejected');
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to reject leave'),
//   });
// }

// // ─── Test monthly credit run (manual trigger, same job the cron runs) ─────────
// // Hits POST /leaves/monthly/:employeeId?year&month via the existing apiClient,
// // so the Bearer token is attached the same way it is for every other call here.
// export function useTestMonthlyLeaveCredit() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ employeeId, year, month }: { employeeId: number; year: number; month: number }) =>
//       leaveService.testMonthlyCredit(employeeId, year, month),
//     onSuccess: (res) => {
//       // Balances and requests may have shifted — refresh everything leave-related.
//       qc.invalidateQueries({ queryKey: KEYS.all });

//       // The posting results (what actually changed) are nested under
//       // postingResults — res.data itself is { calculation, postingResults }.
//       const results = res.data?.postingResults ?? [];
//       const credited = results.filter((r) => r.balance_updated);
//       showToast(
//         credited.length
//           ? `✓ Credited ${credited.map((r) => `${r.leave_type_code} +${r.days_added}`).join(', ')}`
//           : (results[0]?.remarks || 'No credit posted — already run for this month'),
//       );
//     },
//     onError: (err: any) => showToast(err?.message || 'Failed to run monthly leave credit'),
//   });
// }


import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  leaveService,
  holidayService,
  type LeaveQueryParams,
  type ApplyLeaveDto,
  type LeaveTypeUpsertDto,
  type LeavePolicyUpdateDto,
  type CreditSpecialLeaveDto,
  type HolidayQueryParams,
  type CreateHolidayDto,
  type UpdateHolidayDto,
} from '../../../services/api/leave.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  all: ['leaves'] as const,
  list: (p?: LeaveQueryParams) => ['leaves', 'list', p] as const,
  byId: (id: number) => ['leaves', 'detail', id] as const,
  breakdown: (id: number) => ['leaves', 'breakdown', id] as const,
  types: ['leaves', 'types'] as const,
  type: (id: number) => ['leaves', 'types', id] as const,
  pending: ['leaves', 'pending'] as const,
  managedEmployees: ['leaves', 'my-managed-employees'] as const,
  myManagers: ['leaves', 'my-managers'] as const,
  balance: (employeeId?: number, year?: number) => ['leaves', 'balance', employeeId, year] as const,
  companyBalances: (year?: number) => ['leaves', 'balances', 'overview', year] as const,
  shortBalance: (employeeId?: number, year?: number, month?: number) =>
    ['leaves', 'short-balance', employeeId, year, month] as const,
  accruals: (employeeId?: number, year?: number) => ['leaves', 'accruals', employeeId, year] as const,
  policy: ['leaves', 'policy'] as const,
  weeklyOff: (employeeId?: number) => ['leaves', 'weekly-off', employeeId] as const,
  credits: (employeeId?: number) => ['leaves', 'credits', employeeId] as const,
};

// ─── Leave types ────────────────────────────────────────────────────────────
export function useLeaveTypes() {
  return useQuery({
    queryKey: KEYS.types,
    queryFn: () => leaveService.getTypes(),
    staleTime: 5 * 60_000,
    select: (res) => res.data,
  });
}

// Display order requested for the Type of Leave dropdown: Short, Earned, Casual — not alphabetical.
const LEAVE_TYPE_ORDER: Record<string, number> = { SHORT: 0, EL: 1, CL: 2 };

export function useLeaveTypeOptions() {
  const query = useLeaveTypes();
  const data = useMemo(
    () => (query.data || [])
      .map((t) => ({ value: t.id, label: t.name, code: t.code }))
      .sort((a, b) => (LEAVE_TYPE_ORDER[a.code] ?? 99) - (LEAVE_TYPE_ORDER[b.code] ?? 99)),
    [query.data],
  );
  return { ...query, data };
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveTypeUpsertDto) => leaveService.createType(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.types });
      showToast('✓ Leave type created');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to create leave type'),
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveTypeUpsertDto }) => leaveService.updateType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.types });
      showToast('✓ Leave type updated');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to update leave type'),
  });
}

export function useSetLeaveTypeActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => leaveService.setTypeActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.types }),
    onError: (err: any) => showToast(err?.message || 'Failed to update leave type'),
  });
}

// ─── List / detail ────────────────────────────────────────────────────────────
export function useLeaves(params?: LeaveQueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => leaveService.getAll(params),
    staleTime: 60_000,
    select: (res) => res.data,
  });
}

// My leave requests (any status). limit: 100 so the calendar (which needs the
// full history, not just the latest page) and "My Leave Requests" both see everything.
export function useMyLeaves(employeeId?: number) {
  return useQuery({
    queryKey: KEYS.list({ employee_id: employeeId }),
    queryFn: () => leaveService.getAll({ employee_id: employeeId, limit: 100 }),
    staleTime: 30_000,
    enabled: !!employeeId,
    select: (res) => res.data,
  });
}

export function useLeaveById(id?: number) {
  return useQuery({
    queryKey: KEYS.byId(id ?? -1),
    queryFn: () => leaveService.getById(id!),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useLeaveBreakdown(id?: number) {
  return useQuery({
    queryKey: KEYS.breakdown(id ?? -1),
    queryFn: () => leaveService.getBreakdown(id!),
    enabled: !!id,
    select: (res) => res.data,
  });
}

// ─── Leave balances ─────────────────────────────────────────────────────────
// Pass an employeeId to check another employee's balance (requires leaves:approve
// on the backend); omit to get the logged-in user's own balance.
export function useLeaveBalances(employeeId?: number, year?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.balance(employeeId, year),
    queryFn: () => leaveService.getBalance(employeeId, year),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}

// Admin/HR — every employee's balances in one table (backs the Balances tab).
export function useCompanyLeaveBalances(year?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.companyBalances(year),
    queryFn: () => leaveService.getCompanyBalances(year),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}

export function useShortLeaveBalance(employeeId?: number, year?: number, month?: number, enabled: boolean = true) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return useQuery({
    queryKey: KEYS.shortBalance(employeeId, y, m),
    queryFn: () => leaveService.getShortBalance(employeeId, y, m),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}

// ─── Accruals ────────────────────────────────────────────────────────────────
export function useLeaveAccruals(employeeId?: number, year?: number, enabled: boolean = true) {
  const y = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: KEYS.accruals(employeeId, y),
    queryFn: () => leaveService.getAccruals(employeeId, y),
    staleTime: 60_000,
    enabled,
    select: (res) => res.data,
  });
}

// ─── Pending approvals ──────────────────────────────────────────────────────
export function usePendingLeaves(enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.pending,
    queryFn: () => leaveService.getPending(),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}

// ─── Policy ──────────────────────────────────────────────────────────────────
export function useLeavePolicy(enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.policy,
    queryFn: () => leaveService.getPolicy(),
    staleTime: 60_000,
    enabled,
    select: (res) => res.data,
  });
}

export function useUpdateLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeavePolicyUpdateDto) => leaveService.updatePolicy(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.policy });
      showToast('✓ Leave policy saved');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to save leave policy'),
  });
}

// ─── Weekly-off assignment ──────────────────────────────────────────────────
export function useEmployeeWeeklyOff(employeeId?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.weeklyOff(employeeId),
    queryFn: () => leaveService.getWeeklyOff(employeeId),
    staleTime: 60_000,
    enabled,
    select: (res) => res.data,
  });
}

export function useAssignEmployeeWeeklyOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, weeklyOffPresetId }: { employeeId: number; weeklyOffPresetId: number }) =>
      leaveService.assignWeeklyOff(employeeId, weeklyOffPresetId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.weeklyOff(vars.employeeId) });
      showToast('✓ Weekly-off assignment saved');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to save weekly-off assignment'),
  });
}

// ─── Special leave credits ──────────────────────────────────────────────────
export function useLeaveCredits(employeeId?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.credits(employeeId),
    queryFn: () => leaveService.getCredits(employeeId),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}

export function useCreditSpecialLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreditSpecialLeaveDto) => leaveService.creditSpecialLeave(data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.credits(vars.employee_id) });
      qc.invalidateQueries({ queryKey: KEYS.credits(undefined) });
      qc.invalidateQueries({ queryKey: KEYS.balance(vars.employee_id) });
      qc.invalidateQueries({ queryKey: KEYS.companyBalances() });
      showToast('✓ Special leave credited');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to credit special leave'),
  });
}

// ─── Apply ────────────────────────────────────────────────────────────────────
export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyLeaveDto) => leaveService.apply(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('✓ Leave request submitted');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to submit leave request'),
  });
}

// ─── Approve ──────────────────────────────────────────────────────────────────
export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('✓ Leave approved');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to approve leave'),
  });
}

// ─── Reject ───────────────────────────────────────────────────────────────────
export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => leaveService.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Leave rejected');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to reject leave'),
  });
}

// ─── Cancel ───────────────────────────────────────────────────────────────────
export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Leave cancelled');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to cancel leave'),
  });
}

// ─── Test monthly credit run (manual trigger, same job the cron runs) ─────────
export function useTestMonthlyLeaveCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, year, month }: { employeeId: number; year: number; month: number }) =>
      leaveService.testMonthlyCredit(employeeId, year, month),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      const results = res.data?.postingResults ?? [];
      const credited = results.filter((r) => r.balance_updated);
      showToast(
        credited.length
          ? `✓ Credited ${credited.map((r) => `${r.leave_type_code} +${r.days_added}`).join(', ')}`
          : (results[0]?.remarks || 'No credit posted — already run for this month'),
      );
    },
    onError: (err: any) => showToast(err?.message || 'Failed to run monthly leave credit'),
  });
}

// ============================================================================
// Holidays — separate backend module, but lives on this same page, so the
// hooks sit here too. Same react-query + toast + invalidate pattern as
// every mutation above: onSuccess invalidates the cache and toasts, onError
// toasts the failure. Sourced from holidayService, consolidated into the
// same leave.service.ts file per your request.
// ============================================================================

const HOLIDAY_KEYS = {
  all: ['holidays'] as const,
  list: (params?: HolidayQueryParams) => ['holidays', 'list', params] as const,
};

export function useHolidayList(params?: HolidayQueryParams, enabled: boolean = true) {
  return useQuery({
    queryKey: HOLIDAY_KEYS.list(params),
    queryFn: () => holidayService.getAll(params),
    staleTime: 60_000,
    enabled,
    select: (res) => res.data,
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHolidayDto) => holidayService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOLIDAY_KEYS.all });
      showToast('✓ Holiday added');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to add holiday'),
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHolidayDto }) => holidayService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOLIDAY_KEYS.all });
      showToast('✓ Holiday updated');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to update holiday'),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => holidayService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOLIDAY_KEYS.all });
      showToast('Holiday removed');
    },
    onError: (err: any) => showToast(err?.message || 'Failed to remove holiday'),
  });
}



export function useMyManagedEmployees(enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.managedEmployees,
    queryFn: () => leaveService.getMyManagedEmployees(),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}

// L1 and L2 managers of the logged-in employee.
export function useMyManagers(enabled: boolean = true) {
  return useQuery({
    queryKey: KEYS.myManagers,
    queryFn: () => leaveService.getMyManagers(),
    staleTime: 30_000,
    enabled,
    select: (res) => res.data,
  });
}