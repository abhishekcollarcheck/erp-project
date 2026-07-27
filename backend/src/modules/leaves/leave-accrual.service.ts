/**
 * leave-accrual.service.ts
 *
 * Replaces the old single-formula computeAccrued() — that only worked for
 * an ungated, automatic monthly advance. This system credits IN ARREARS:
 * a month's CL/EL only gets credited once that month is COMPLETE and its
 * actual working-days count is known, per the "Regular"/"Contractual"
 * scheme rules from your leave policy sheet.
 *
 * SCOPE: Regular and Contractual schemes only (they share identical
 * ongoing-month logic: >=20 working days -> full credit, <20 -> zero).
 * RD scheme and Probation's holding-account/one-time-release mechanic are
 * NOT implemented yet — deferred per your instruction.
 *
 * ASSUMPTIONS FLAGGED:
 *   - The current, in-progress month never contributes to accrued balance
 *     (can't know its working-days count until it's over). Implied by
 *     "arrears", not independently re-confirmed by you — flag if wrong.
 *   - Join-month tiers are judged PURELY by join date (day 1 / 2-15 /
 *     16-20 / 21-31), with no additional working-days sub-check — per
 *     your simplified restatement of the matrix. The original sheet's
 *     "Working Days >= 15" note on the 2-15 tier is NOT enforced here.
 *
 * Place at: backend/src/modules/leaves/leave-accrual.service.ts
 */

import { LeaveType } from '../../database/models/LeaveModels';
import { getWorkingDaysInMonth } from '../../utils/working-days.util';

const WORKING_DAYS_THRESHOLD = 20;

export interface MonthCredit {
  year: number;
  month: number; // 1-indexed
  workingDays: number | null; // null for the join month (judged by date, not working days)
  clCredit: number;
  elCredit: number;
  shlCredit: number;
  isJoinMonth: boolean;
}

/**
 * Applies the join-date tiers for CL/EL and ShL — these are two SEPARATE
 * cutoffs (15 for CL/EL, 20 for ShL), confirmed distinct by you even
 * though it produces a real gap (e.g. joining day 18 gets full ShL but
 * zero CL/EL for that month).
 */
function computeJoinMonthCredit(joinDay: number): { cl: number; el: number; shl: number } {
  if (joinDay === 1) return { cl: 1, el: 1.25, shl: 1 };
  if (joinDay >= 2 && joinDay <= 15) return { cl: 0.5, el: 0, shl: 1 };
  if (joinDay >= 16 && joinDay <= 20) return { cl: 0, el: 0, shl: 1 };
  return { cl: 0, el: 0, shl: 0 }; // 21-31
}

/**
 * Walks every completed month from the join month through the month
 * before `asOfDate`'s month, crediting CL/EL/ShL per month according to
 * the Regular/Contractual scheme rules. Returns one entry per month plus
 * the running totals.
 */
export async function computeMonthlyAccrualHistory(
  employeeId: number,
  companyId: number,
  joinDate: Date,
  leaveYearStart: Date, // Jan 1 of the relevant leave year
  asOfDate: Date = new Date(),
): Promise<{ months: MonthCredit[]; totalCL: number; totalEL: number; totalSHL: number }> {
  const months: MonthCredit[] = [];

  const effectiveStart = joinDate > leaveYearStart ? joinDate : leaveYearStart;
  const isActualJoinMonth = (y: number, m: number) =>
    y === joinDate.getFullYear() && m === joinDate.getMonth() + 1;

  let year = effectiveStart.getFullYear();
  let month = effectiveStart.getMonth() + 1;

  const lastCompletedYear = asOfDate.getMonth() === 0 ? asOfDate.getFullYear() - 1 : asOfDate.getFullYear();
  const lastCompletedMonth = asOfDate.getMonth() === 0 ? 12 : asOfDate.getMonth(); // asOfDate.getMonth() is 0-indexed; previous month = current index

  while (year < lastCompletedYear || (year === lastCompletedYear && month <= lastCompletedMonth)) {
    const isJoinMonth = isActualJoinMonth(year, month);

    if (isJoinMonth) {
      const { cl, el, shl } = computeJoinMonthCredit(joinDate.getDate());
      months.push({ year, month, workingDays: null, clCredit: cl, elCredit: el, shlCredit: shl, isJoinMonth: true });
    } else {
      const workingDays = await getWorkingDaysInMonth(employeeId, companyId, year, month);
      const meetsThreshold = workingDays >= WORKING_DAYS_THRESHOLD;
      months.push({
        year,
        month,
        workingDays,
        clCredit: meetsThreshold ? 1 : 0,
        elCredit: meetsThreshold ? 1.25 : 0,
        shlCredit: 1, // ShL steady-state is NOT gated by working days per the sheet — flat monthly allowance
        isJoinMonth: false,
      });
    }

    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }

  const totalCL  = months.reduce((s, m) => s + m.clCredit, 0);
  const totalEL  = months.reduce((s, m) => s + m.elCredit, 0);
  const totalSHL = months.reduce((s, m) => s + m.shlCredit, 0); // NOTE: ShL doesn't carry forward — this total isn't meaningful as a "balance", see leave.service.ts

  return { months, totalCL: Math.round(totalCL * 100) / 100, totalEL: Math.round(totalEL * 100) / 100, totalSHL };
}

/**
 * Convenience wrapper for a single leave type — used by leave.service.ts
 * so it doesn't need to know CL vs EL vs ShL internals, just which total
 * to read off the shared month-by-month walk.
 */
export async function computeAccruedForType(
  leaveType: Pick<LeaveType, 'code'>,
  employeeId: number,
  companyId: number,
  joinDate: Date,
  leaveYearStart: Date,
  asOfDate: Date = new Date(),
): Promise<number> {
  const { totalCL, totalEL } = await computeMonthlyAccrualHistory(employeeId, companyId, joinDate, leaveYearStart, asOfDate);
  if (leaveType.code === 'CL') return totalCL;
  if (leaveType.code === 'EL') return totalEL;
  throw new Error(`computeAccruedForType does not handle leave type code "${leaveType.code}" — Short Leave uses its own monthly-reset logic in leave.service.ts, not this arrears history.`);
}