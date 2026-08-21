// // import { EmployeeLeaveBalance, LeaveRequest, LeaveType } from '../database/models/Leave';
// // import { AppliedLeaveDetails } from './attendance-rules.engine';

// import { LeaveRequest, LeaveType } from "@/database/models";
// import { AppliedLeaveDetails } from "./shift-rule-evaluator.service";
// import { EmployeeLeaveBalance } from "@/database/models/LeaveModels";

// // ═══════════════════════════════════════════════════════════════════════
// // Bridges the LeaveRequest / EmployeeLeaveBalance / LeaveType models to
// // the pure attendance-rules engine (AppliedLeaveDetails + availableLeaveDays).
// // Keeping this separate from the engine keeps the engine a pure function
// // (easy to unit-test) while all DB-shape assumptions live here.
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Minutes between two "HH:MM" strings. Falls back to 30 (half-hour short
//  * leave) if either time is missing, since that's the more common case.
//  *
//  * ASSUMPTION: short leave (arrival_late / leaving_early) duration is not a
//  * separate column on LeaveRequest today — it is derived from the existing
//  * from_time/to_time fields. If a dedicated `duration_minutes` field is
//  * ever added to LeaveRequest, prefer that over this derivation.
//  */
// function computeMinutesBetween(from?: string | null, to?: string | null): number {
//   if (!from || !to) return 30;
//   const [fh, fm] = from.split(':').map(Number);
//   const [th, tm] = to.split(':').map(Number);
//   return Math.abs(th * 60 + tm - (fh * 60 + fm));
// }

// /**
//  * Finds the LeaveRequest (if any) that covers the given date for this employee.
//  * Only 'Approved' requests count — unapproved requests must never affect attendance.
//  */
// export function findApplicableLeaveRequest(
//   requests: LeaveRequest[],
//   date: string, // 'YYYY-MM-DD'
// ): LeaveRequest | undefined {
//   return requests.find((r) => r.status === 'Approved' && date >= r.from_date && date <= r.to_date);
// }

// /**
//  * Converts an approved LeaveRequest + its LeaveType into the AppliedLeaveDetails
//  * shape the rules engine expects. Returns undefined if the request/type doesn't
//  * map to anything the engine understands (e.g. unpaid/other leave types).
//  */
// export function resolveAppliedLeave(request: LeaveRequest, leaveType: LeaveType): AppliedLeaveDetails | undefined {
//   if (request.status !== 'Approved') return undefined;

//   const code = leaveType.code.toUpperCase();

//   // Short leave: arrival_late (morning) / leaving_early (evening).
//   if (request.leave_application_type === 'arrival_late' || request.leave_application_type === 'leaving_early') {
//     const minutes = computeMinutesBetween(request.from_time, request.to_time);
//     return {
//       type: minutes <= 30 ? 'SL_HALF' : 'SL_FULL',
//       position: request.leave_application_type === 'arrival_late' ? 'MORNING' : 'EVENING',
//       approved: true,
//     };
//   }

//   // Casual / Earned leave: full day or half day.
//   if (code === 'CL' || code === 'EL') {
//     const type = code as 'CL' | 'EL';
//     if (request.leave_application_type === 'full_day') {
//       return { type, position: 'FULL_DAY', approved: true };
//     }
//     if (request.leave_application_type === 'first_half') {
//       return { type, position: 'FIRST_HALF', approved: true };
//     }
//     if (request.leave_application_type === 'second_half') {
//       return { type, position: 'SECOND_HALF', approved: true };
//     }
//   }

//   return undefined;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // LEAVE BALANCE
// // ═══════════════════════════════════════════════════════════════════════

// export interface LeaveBalanceSummary {
//   leaveTypeCode: string;
//   leaveTypeName: string;
//   allocated: number;
//   used: number;
//   pending: number;
//   carriedForward: number;
//   /** allocated + carriedForward - used - pending */
//   available: number;
// }

// /** Days available for a single balance row, after used + pending are deducted. */
// export function computeAvailableDays(balance: EmployeeLeaveBalance): number {
//   return Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);
// }

// /**
//  * Returns how many CL/EL days the employee currently has available (already
//  * accounting for what's used/pending). Pass this straight into
//  * evaluateAttendanceStatus's `availableLeaveDays` option.
//  */
// export function getAvailableDaysForCode(
//   balances: EmployeeLeaveBalance[],
//   leaveTypesById: Map<number, LeaveType>,
//   code: 'CL' | 'EL',
// ): number {
//   const row = balances.find((b) => leaveTypesById.get(b.leave_type_id)?.code.toUpperCase() === code);
//   return row ? computeAvailableDays(row) : 0;
// }

// /**
//  * Full balance report for an employee across every leave type — this is what
//  * answers "how much casual leave has this person used".
//  */
// export function getEmployeeLeaveUsageReport(
//   balances: EmployeeLeaveBalance[],
//   leaveTypesById: Map<number, LeaveType>,
// ): LeaveBalanceSummary[] {
//   return balances.map((balance) => {
//     const leaveType = leaveTypesById.get(balance.leave_type_id);
//     return {
//       leaveTypeCode: leaveType?.code ?? 'UNKNOWN',
//       leaveTypeName: leaveType?.name ?? 'Unknown',
//       allocated: Number(balance.allocated),
//       used: Number(balance.used),
//       pending: Number(balance.pending),
//       carriedForward: Number(balance.carried_forward),
//       available: computeAvailableDays(balance),
//     };
//   });
// }

// // ═══════════════════════════════════════════════════════════════════════
// // ONE-SHOT CONVENIENCE: resolve everything needed for a single day's
// // evaluateAttendanceStatus() call, given raw model rows.
// // ═══════════════════════════════════════════════════════════════════════

// export interface ResolvedLeaveContext {
//   appliedLeave?: AppliedLeaveDetails;
//   availableLeaveDays: number;
// }

// export function resolveLeaveContextForDate(
//   date: string,
//   leaveRequests: LeaveRequest[],
//   leaveTypesById: Map<number, LeaveType>,
//   balances: EmployeeLeaveBalance[],
// ): ResolvedLeaveContext {
//   const request = findApplicableLeaveRequest(leaveRequests, date);
//   if (!request) return { availableLeaveDays: 0 };

//   const leaveType = leaveTypesById.get(request.leave_type_id);
//   if (!leaveType) return { availableLeaveDays: 0 };

//   const appliedLeave = resolveAppliedLeave(request, leaveType);
//   if (!appliedLeave) return { availableLeaveDays: 0 };

//   const availableLeaveDays =
//     appliedLeave.type === 'CL' || appliedLeave.type === 'EL'
//       ? getAvailableDaysForCode(balances, leaveTypesById, appliedLeave.type)
//       : 0;

//   return { appliedLeave, availableLeaveDays };
// }



// import { LeaveRequest, LeaveType } from "@/database/models";
// import { AppliedLeaveDetails } from "./shift-rule-evaluator.service";
// import { EmployeeLeaveBalance } from "@/database/models/LeaveModels";

// // ═══════════════════════════════════════════════════════════════════════
// // Bridges the LeaveRequest / EmployeeLeaveBalance / LeaveType models to
// // the pure attendance-rules engine (AppliedLeaveDetails + availableLeaveDays).
// // Keeping this separate from the engine keeps the engine a pure function
// // (easy to unit-test) while all DB-shape assumptions live here.
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Minutes between two "HH:MM" strings. Falls back to 30 (half-hour short
//  * leave) if either time is missing, since that's the more common case.
//  *
//  * ASSUMPTION: short leave (arrival_late / leaving_early) duration is not a
//  * separate column on LeaveRequest today — it is derived from the existing
//  * from_time/to_time fields. If a dedicated `duration_minutes` field is
//  * ever added to LeaveRequest, prefer that over this derivation.
//  */
// function computeMinutesBetween(from?: string | null, to?: string | null): number {
//   if (!from || !to) return 30;
//   const [fh, fm] = from.split(':').map(Number);
//   const [th, tm] = to.split(':').map(Number);
//   return Math.abs(th * 60 + tm - (fh * 60 + fm));
// }

// /**
//  * Finds the LeaveRequest (if any) that covers the given date for this employee.
//  * Only 'Approved' requests count — unapproved requests must never affect attendance.
//  */
// export function findApplicableLeaveRequest(
//   requests: LeaveRequest[],
//   date: string, // 'YYYY-MM-DD'
// ): LeaveRequest | undefined {
//   return requests.find((r) => r.status === 'Approved' && date >= r.from_date && date <= r.to_date);
// }

// /**
//  * Converts an approved LeaveRequest + its LeaveType into the AppliedLeaveDetails
//  * shape the rules engine expects. Returns undefined if the request/type doesn't
//  * map to anything the engine understands (e.g. unpaid/other leave types, or a
//  * LeaveType row with no usable `code`).
//  */
// export function resolveAppliedLeave(request: LeaveRequest, leaveType: LeaveType): AppliedLeaveDetails | undefined {
//   if (request.status !== 'Approved') return undefined;

//   const rawCode = (leaveType as any)?.code;
//   if (!rawCode || typeof rawCode !== 'string') {
//     console.warn(
//       `[leave-resolver] LeaveRequest ${request.id} (employee ${request.employee_id}) ` +
//         `references LeaveType ${request.leave_type_id}, which has no usable 'code'. Skipping — ` +
//         `this leave will NOT be applied to attendance.`,
//     );
//     return undefined;
//   }
//   const code = rawCode.toUpperCase();

//   // Short leave: arrival_late (morning) / leaving_early (evening).
//   if (request.leave_application_type === 'arrival_late' || request.leave_application_type === 'leaving_early') {
//     const minutes = computeMinutesBetween(request.from_time, request.to_time);
//     return {
//       type: minutes <= 30 ? 'SL_HALF' : 'SL_FULL',
//       position: request.leave_application_type === 'arrival_late' ? 'MORNING' : 'EVENING',
//       approved: true,
//     };
//   }

//   // Casual / Earned leave: full day or half day.
//   if (code === 'CL' || code === 'EL') {
//     const type = code as 'CL' | 'EL';
//     if (request.leave_application_type === 'full_day') {
//       return { type, position: 'FULL_DAY', approved: true };
//     }
//     if (request.leave_application_type === 'first_half') {
//       return { type, position: 'FIRST_HALF', approved: true };
//     }
//     if (request.leave_application_type === 'second_half') {
//       return { type, position: 'SECOND_HALF', approved: true };
//     }
//     console.warn(
//       `[leave-resolver] LeaveRequest ${request.id} is ${code} but leave_application_type=` +
//         `"${request.leave_application_type}" doesn't match full_day/first_half/second_half. Skipping.`,
//     );
//     return undefined;
//   }

//   console.warn(
//     `[leave-resolver] LeaveRequest ${request.id} has LeaveType code "${code}", which the attendance ` +
//       `engine doesn't recognize (expected CL/EL, or arrival_late/leaving_early application type). Skipping.`,
//   );
//   return undefined;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // LEAVE BALANCE
// // ═══════════════════════════════════════════════════════════════════════

// export interface LeaveBalanceSummary {
//   leaveTypeCode: string;
//   leaveTypeName: string;
//   allocated: number;
//   used: number;
//   pending: number;
//   carriedForward: number;
//   /** allocated + carriedForward - used - pending */
//   available: number;
// }

// /** Days available for a single balance row, after used + pending are deducted. */
// export function computeAvailableDays(balance: EmployeeLeaveBalance): number {
//   return Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);
// }

// /**
//  * Returns how many CL/EL days the employee currently has available (already
//  * accounting for what's used/pending). Pass this straight into
//  * evaluateAttendanceStatus's `availableLeaveDays` option.
//  */
// export function getAvailableDaysForCode(
//   balances: EmployeeLeaveBalance[],
//   leaveTypesById: Map<number, LeaveType>,
//   code: 'CL' | 'EL',
// ): number {
//   const row = balances.find((b) => {
//     const rowCode = (leaveTypesById.get(b.leave_type_id) as any)?.code;
//     return typeof rowCode === 'string' && rowCode.toUpperCase() === code;
//   });

//   if (!row) {
//     console.warn(
//       `[leave-resolver] No EmployeeLeaveBalance row found matching leave type code "${code}" ` +
//         `for this employee. Treating available balance as 0 — any ${code} request will fall back to ABSENT.`,
//     );
//     return 0;
//   }

//   return computeAvailableDays(row);
// }

// /**
//  * Full balance report for an employee across every leave type — this is what
//  * answers "how much casual leave has this person used".
//  */
// export function getEmployeeLeaveUsageReport(
//   balances: EmployeeLeaveBalance[],
//   leaveTypesById: Map<number, LeaveType>,
// ): LeaveBalanceSummary[] {
//   return balances.map((balance) => {
//     const leaveType = leaveTypesById.get(balance.leave_type_id);
//     return {
//       leaveTypeCode: (leaveType as any)?.code ?? 'UNKNOWN',
//       leaveTypeName: (leaveType as any)?.name ?? 'Unknown',
//       allocated: Number(balance.allocated),
//       used: Number(balance.used),
//       pending: Number(balance.pending),
//       carriedForward: Number(balance.carried_forward),
//       available: computeAvailableDays(balance),
//     };
//   });
// }

// // ═══════════════════════════════════════════════════════════════════════
// // ONE-SHOT CONVENIENCE: resolve everything needed for a single day's
// // evaluateAttendanceStatus() call, given raw model rows.
// // ═══════════════════════════════════════════════════════════════════════

// export interface ResolvedLeaveContext {
//   appliedLeave?: AppliedLeaveDetails;
//   availableLeaveDays: number;
// }

// export function resolveLeaveContextForDate(
//   date: string,
//   leaveRequests: LeaveRequest[],
//   leaveTypesById: Map<number, LeaveType>,
//   balances: EmployeeLeaveBalance[],
// ): ResolvedLeaveContext {
//   const request = findApplicableLeaveRequest(leaveRequests, date);
//   if (!request) return { availableLeaveDays: 0 };

//   const leaveType = leaveTypesById.get(request.leave_type_id);
//   if (!leaveType) {
//     console.warn(
//       `[leave-resolver] Approved LeaveRequest ${request.id} covers ${date} but leave_type_id=` +
//         `${request.leave_type_id} was not found in leaveTypesById. This leave will NOT be applied — ` +
//         `the day will fall back through to normal punch-based evaluation.`,
//     );
//     return { availableLeaveDays: 0 };
//   }

//   const appliedLeave = resolveAppliedLeave(request, leaveType);
//   if (!appliedLeave) return { availableLeaveDays: 0 };

//   const availableLeaveDays =
//     appliedLeave.type === 'CL' || appliedLeave.type === 'EL'
//       ? getAvailableDaysForCode(balances, leaveTypesById, appliedLeave.type)
//       : 0;

//   return { appliedLeave, availableLeaveDays };
// }





import { LeaveRequest, LeaveType } from "@/database/models";
import { AppliedLeaveDetails } from "./shift-rule-evaluator.service";
import { EmployeeLeaveBalance } from "@/database/models/LeaveModels";

// ═══════════════════════════════════════════════════════════════════════
// Bridges the LeaveRequest / EmployeeLeaveBalance / LeaveType models to
// the pure attendance-rules engine (AppliedLeaveDetails).
// Keeping this separate from the engine keeps the engine a pure function
// (easy to unit-test) while all DB-shape assumptions live here.
//
// IMPORTANT: this file (and the attendance engine it feeds) does NOT
// check leave balance. Balance is enforced when a LeaveRequest is created
// / approved (a request can't be approved in the first place unless the
// employee has enough balance) — so by the time attendance evaluation
// runs, `status === 'Approved'` already implies the balance was valid.
// Re-checking balance here would be redundant and can only produce wrong
// results if balances have since been recalculated for other reasons.
//
// getAvailableDaysForCode / getEmployeeLeaveUsageReport are still exported
// below for wherever you actually DO need a balance number — e.g. the
// leave-request approval screen, or an employee-facing "leave remaining"
// report. They're just no longer part of the attendance-evaluation path.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Minutes between two "HH:MM" strings. Falls back to 30 (half-hour short
 * leave) if either time is missing, since that's the more common case.
 *
 * ASSUMPTION: short leave (arrival_late / leaving_early) duration is not a
 * separate column on LeaveRequest today — it is derived from the existing
 * from_time/to_time fields. If a dedicated `duration_minutes` field is
 * ever added to LeaveRequest, prefer that over this derivation.
 */
function computeMinutesBetween(from?: string | null, to?: string | null): number {
  if (!from || !to) return 30;
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return Math.abs(th * 60 + tm - (fh * 60 + fm));
}

/**
 * Finds the LeaveRequest (if any) that covers the given date for this employee.
 * Only 'Approved' requests count — unapproved requests must never affect attendance.
 */
export function findApplicableLeaveRequest(
  requests: LeaveRequest[],
  date: string, // 'YYYY-MM-DD'
): LeaveRequest | undefined {
  return requests.find((r) => r.status === 'Approved' && date >= r.from_date && date <= r.to_date);
}

/**
 * Converts an approved LeaveRequest + its LeaveType into the AppliedLeaveDetails
 * shape the rules engine expects. Returns undefined if the request/type doesn't
 * map to anything the engine understands (e.g. unpaid/other leave types, or a
 * LeaveType row with no usable `code`).
 */
export function resolveAppliedLeave(request: LeaveRequest, leaveType: LeaveType): AppliedLeaveDetails | undefined {
  if (request.status !== 'Approved') return undefined;

  const rawCode = (leaveType as any)?.code;
  if (!rawCode || typeof rawCode !== 'string') {
    console.warn(
      `[leave-resolver] LeaveRequest ${request.id} (employee ${request.employee_id}) ` +
        `references LeaveType ${request.leave_type_id}, which has no usable 'code'. Skipping — ` +
        `this leave will NOT be applied to attendance.`,
    );
    return undefined;
  }
  const code = rawCode.toUpperCase();

  // Short leave: arrival_late (morning) / leaving_early (evening).
  if (request.leave_application_type === 'arrival_late' || request.leave_application_type === 'leaving_early') {
    const minutes = computeMinutesBetween(request.from_time, request.to_time);
    return {
      type: minutes <= 30 ? 'SL_HALF' : 'SL_FULL',
      position: request.leave_application_type === 'arrival_late' ? 'MORNING' : 'EVENING',
      approved: true,
    };
  }

  // Casual / Earned leave: full day or half day.
  if (code === 'CL' || code === 'EL') {
    const type = code as 'CL' | 'EL';
    if (request.leave_application_type === 'full_day') {
      return { type, position: 'FULL_DAY', approved: true };
    }
    if (request.leave_application_type === 'first_half') {
      return { type, position: 'FIRST_HALF', approved: true };
    }
    if (request.leave_application_type === 'second_half') {
      return { type, position: 'SECOND_HALF', approved: true };
    }
    console.warn(
      `[leave-resolver] LeaveRequest ${request.id} is ${code} but leave_application_type=` +
        `"${request.leave_application_type}" doesn't match full_day/first_half/second_half. Skipping.`,
    );
    return undefined;
  }

  console.warn(
    `[leave-resolver] LeaveRequest ${request.id} has LeaveType code "${code}", which the attendance ` +
      `engine doesn't recognize (expected CL/EL, or arrival_late/leaving_early application type). Skipping.`,
  );
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════
// LEAVE BALANCE (reporting only — NOT used by the attendance engine)
// ═══════════════════════════════════════════════════════════════════════

export interface LeaveBalanceSummary {
  leaveTypeCode: string;
  leaveTypeName: string;
  allocated: number;
  used: number;
  pending: number;
  carriedForward: number;
  /** allocated + carriedForward - used - pending */
  available: number;
}

/** Days available for a single balance row, after used + pending are deducted. */
export function computeAvailableDays(balance: EmployeeLeaveBalance): number {
  return Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);
}

/**
 * Returns how many CL/EL days the employee currently has available for the given
 * year (already accounting for what's used/pending).
 *
 * NOT used for attendance evaluation — see file header. Use this for balance
 * displays / the leave-request approval flow, where the balance check belongs.
 */
export function getAvailableDaysForCode(
  balances: EmployeeLeaveBalance[],
  leaveTypesById: Map<number, LeaveType>,
  code: 'CL' | 'EL',
  year: number,
): number {
  const row = balances.find((b) => {
    if (b.year !== year) return false;
    const rowCode = (leaveTypesById.get(b.leave_type_id) as any)?.code;
    return typeof rowCode === 'string' && rowCode.toUpperCase() === code;
  });

  if (!row) {
    console.warn(
      `[leave-resolver] No EmployeeLeaveBalance row found matching leave type code "${code}" ` +
        `for year ${year}. Treating available balance as 0.`,
    );
    return 0;
  }

  return computeAvailableDays(row);
}

/**
 * Full balance report for an employee across every leave type — this is what
 * answers "how much casual leave has this person used".
 */
export function getEmployeeLeaveUsageReport(
  balances: EmployeeLeaveBalance[],
  leaveTypesById: Map<number, LeaveType>,
): LeaveBalanceSummary[] {
  return balances.map((balance) => {
    const leaveType = leaveTypesById.get(balance.leave_type_id);
    return {
      leaveTypeCode: (leaveType as any)?.code ?? 'UNKNOWN',
      leaveTypeName: (leaveType as any)?.name ?? 'Unknown',
      allocated: Number(balance.allocated),
      used: Number(balance.used),
      pending: Number(balance.pending),
      carriedForward: Number(balance.carried_forward),
      available: computeAvailableDays(balance),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ONE-SHOT CONVENIENCE: resolve everything needed for a single day's
// evaluateAttendanceStatus() call, given raw model rows.
// ═══════════════════════════════════════════════════════════════════════

export interface ResolvedLeaveContext {
  appliedLeave?: AppliedLeaveDetails;
}

export function resolveLeaveContextForDate(
  date: string,
  leaveRequests: LeaveRequest[],
  leaveTypesById: Map<number, LeaveType>,
): ResolvedLeaveContext {
  const request = findApplicableLeaveRequest(leaveRequests, date);
  if (!request) return {};

  const leaveType = leaveTypesById.get(request.leave_type_id);
  if (!leaveType) {
    console.warn(
      `[leave-resolver] Approved LeaveRequest ${request.id} covers ${date} but leave_type_id=` +
        `${request.leave_type_id} was not found in leaveTypesById. This leave will NOT be applied — ` +
        `the day will fall back through to normal punch-based evaluation.`,
    );
    return {};
  }

  const appliedLeave = resolveAppliedLeave(request, leaveType);
  if (!appliedLeave) return {};

  return { appliedLeave };
}