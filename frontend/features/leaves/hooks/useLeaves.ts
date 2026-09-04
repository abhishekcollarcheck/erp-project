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



import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, type LeaveQueryParams, type ApplyLeaveDto } from '../../../services/api/leave.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  all:   ['leaves']                              as const,
  list:  (p?: LeaveQueryParams) => ['leaves', 'list', p] as const,
  types: ['leaves', 'types']                      as const,
  pending: ['leaves', 'pending']                   as const,
  balance: (employeeId?: number) => ['leaves', 'balance', employeeId] as const,
};

// ─── Leave types ────────────────────────────────────────────────────────────
export function useLeaveTypes() {
  return useQuery({
    queryKey:  KEYS.types,
    queryFn:   () => leaveService.getTypes(),
    staleTime: 5 * 60_000,
    select:    (res) => res.data,
  });
}

// Display order requested for the Type of Leave dropdown: Short, Earned, Casual — not alphabetical.
const LEAVE_TYPE_ORDER: Record<string, number> = { ShL: 0, EL: 1, CL: 2 };

export function useLeaveTypeOptions() {
  const query = useLeaveTypes();

  // Memoized so the returned array keeps a stable reference across renders
  // when the underlying data hasn't changed — safe to use as a useEffect dep.
  const data = useMemo(
    () => (query.data || [])
      .map((t) => ({ value: t.id, label: t.name, code: t.code }))
      .sort((a, b) => (LEAVE_TYPE_ORDER[a.code] ?? 99) - (LEAVE_TYPE_ORDER[b.code] ?? 99)),
    [query.data],
  );

  return { ...query, data };
}

// ─── List ─────────────────────────────────────────────────────────────────────
export function useLeaves(params?: LeaveQueryParams) {
  return useQuery({
    queryKey:  KEYS.list(params),
    queryFn:   () => leaveService.getAll(params),
    staleTime: 60_000,
    select:    (res) => res.data,
  });
}

// ─── My leave requests (any status) ────────────────────────────────────────
// limit: 100 so the calendar (which needs the full history, not just the
// latest page) and the "My Leave Requests" table both see everything.
export function useMyLeaves(employeeId?: number) {
  return useQuery({
    queryKey:  KEYS.list({ employee_id: employeeId }),
    queryFn:   () => leaveService.getAll({ employee_id: employeeId, limit: 100 }),
    staleTime: 30_000,
    enabled:   !!employeeId,
    select:    (res) => res.data,
  });
}

// ─── Leave balances ─────────────────────────────────────────────────────────
// Pass an employeeId to check another employee's balance (requires leaves:approve
// on the backend); omit to get the logged-in user's own balance.
export function useLeaveBalances(employeeId?: number, enabled: boolean = true) {
  return useQuery({
    queryKey:  KEYS.balance(employeeId),
    queryFn:   () => leaveService.getBalance(employeeId),
    staleTime: 30_000,
    enabled,
    select:    (res) => res.data,
  });
}

// ─── Pending approvals ──────────────────────────────────────────────────────
export function usePendingLeaves(enabled: boolean = true) {
  return useQuery({
    queryKey:  KEYS.pending,
    queryFn:   () => leaveService.getPending(),
    staleTime: 30_000,
    enabled,
    select:    (res) => res.data,
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

// ─── Test monthly credit run (manual trigger, same job the cron runs) ─────────
// Hits POST /leaves/monthly/:employeeId?year&month via the existing apiClient,
// so the Bearer token is attached the same way it is for every other call here.
export function useTestMonthlyLeaveCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, year, month }: { employeeId: number; year: number; month: number }) =>
      leaveService.testMonthlyCredit(employeeId, year, month),
    onSuccess: (res) => {
      // Balances and requests may have shifted — refresh everything leave-related.
      qc.invalidateQueries({ queryKey: KEYS.all });

      // The posting results (what actually changed) are nested under
      // postingResults — res.data itself is { calculation, postingResults }.
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