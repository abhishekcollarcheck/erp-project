/**
 * leave-balance.util.ts
 *
 * Computes an employee's CURRENT available balance for a leave type, on
 * demand — no cron job, no stored "current balance" column to go stale.
 *
 * ASSUMPTIONS FLAGGED — confirm or correct:
 *   1. Leave year = calendar year (Jan 1 – Dec 31).
 *   2. Accrual is a MONTHLY ADVANCE: one full month's credit on the 1st of
 *      every month, counting the join month itself as fully credited
 *      regardless of which day within that month the employee joined
 *      (i.e. joining May 15 is treated the same as joining May 1 for
 *      accrual purposes — CONFIRM this for mid-month joins specifically;
 *      the only example given so far was an exact May 1 join, which
 *      doesn't distinguish "credit the partial join month" from "start
 *      accruing the following month" for someone joining mid-month).
 *
 * Place at: backend/src/modules/leaves/leave-balance.util.ts
 */

import { LeaveType } from '../database/models/LeaveModels';

export interface LeaveBalanceResult {
  leaveTypeId: number;
  leaveTypeName: string;
  unit: 'days' | 'hours';
  accrued: number;   // total earned so far this period, before deductions
  used: number;       // already consumed (approved + pending, per usedDays param)
  available: number;  // accrued − used, floored at 0
}

/**
 * For annual_progressive types (EL, CL): accrued = min(annualTotal,
 * monthsElapsed × (annualTotal / 12)), where monthsElapsed counts whole
 * calendar months as a monthly ADVANCE — the join month itself counts as
 * fully credited, then +1 for every subsequent calendar month reached, up
 * to and including the current month.
 *
 * Example: joined May 1 2026, today July 27 2026 → May, June, July = 3
 * months credited → CL: 3×1.0=3, EL: 3×1.25=3.75 (verified against real
 * numbers, not elapsed-day division — a monthly advance isn't prorated by
 * days within a month).
 *
 * For monthly_reset types (Short Leave): accrued = the flat per-month
 * allowance, full amount available every month, never accumulates across
 * months (no carry-forward by definition).
 */
export function computeAccrued(
  leaveType: LeaveType,
  joinDate: Date,
  asOfDate: Date = new Date(),
): number {
  if (leaveType.accrual_period === 'monthly_reset') {
    return Number(leaveType.days_per_year); // flat monthly allowance, always fully available each month
  }

  const currentYear = asOfDate.getFullYear();
  const currentMonth = asOfDate.getMonth(); // 0-indexed
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth();

  // Effective start = the later of (join month, January of current year) —
  // if the employee joined in a prior year, THIS leave year starts the
  // count from January, not their original join date.
  const startYear  = joinYear < currentYear ? currentYear : joinYear;
  const startMonth = joinYear < currentYear ? 0 : joinMonth; // ASSUMPTION #1 (Jan start)

  // +1 makes this INCLUSIVE of the start month itself — a monthly advance
  // credits the whole month regardless of which day within it service began.
  const monthsElapsed = (currentYear * 12 + currentMonth) - (startYear * 12 + startMonth) + 1;

  if (monthsElapsed <= 0) return 0; // joined in the future relative to asOfDate — no accrual yet

  const monthlyRate = Number(leaveType.days_per_year) / 12;
  const accrued = monthsElapsed * monthlyRate;

  return Math.min(Number(leaveType.days_per_year), Math.round(accrued * 100) / 100);
}

/**
 * Full balance result: accrued minus already-used (you supply `usedSoFar`
 * — typically SUM(days) of Approved + Pending LeaveRequest rows for this
 * employee/type/leave-year — this function doesn't query anything itself,
 * kept pure so it's easy to test independently of the DB).
 */
export function computeBalance(
  leaveType: LeaveType,
  joinDate: Date,
  usedSoFar: number,
  asOfDate: Date = new Date(),
): LeaveBalanceResult {
  const accrued = computeAccrued(leaveType, joinDate, asOfDate);
  const available = Math.max(0, Math.round((accrued - usedSoFar) * 100) / 100);

  return {
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.name,
    unit: leaveType.accrual_unit,
    accrued,
    used: usedSoFar,
    available,
  };
}