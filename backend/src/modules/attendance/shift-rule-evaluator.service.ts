/**
 * shift-rule-evaluator.service.ts
 *
 * Layer 2 of the attendance architecture: takes one day's merged
 * check-in/check-out (from attendance-combined.service.ts) plus the
 * employee's shift + grace period, and computes the final attendance
 * status per the business rules you provided.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ASSUMPTIONS BAKED INTO THIS FILE — NOT YET CONFIRMED BY YOU:
 * ═══════════════════════════════════════════════════════════════════════
 *
 * 1. PRECEDENCE ORDER: No punches → Full Day Absent (immediate).
 *    Otherwise: check Full Day Present first: if any rule matches, done.
 *    Else check Half-Day (First Half / Second Half): if either matches, done.
 *    Else check Full Day Absent's punch-based rules (A/B/C).
 *    Else: 'Unclassified' — punches exist but nothing matched. This should
 *    not normally happen if the rule sets are truly complete/disjoint by
 *    design; treat any 'Unclassified' result in production as a signal
 *    the rules need a gap filled, not as a silent default.
 *
 * 2. "Late Coming Minute" = the employee's ACTUAL lateness that day
 *    (In Time − Shift Start, floored at 0), not a fixed config value.
 *    Confirmed consistent across every rule row you've given so far.
 *
 * 3. "Half Shift" = Shift Start + (Shift Duration / 2) — derived at
 *    runtime, not a separately stored config value. Verified against
 *    your example (10:00 AM shift start + 4.5h = 2:30 PM, matching the
 *    "2:30 PM" column exactly for a 9-hour shift).
 *
 * 4. Second Half Present's duration-only rule as literally given —
 *    (Out Time − In Time) >= (Half Shift − Shift End) — computes to a
 *    NEGATIVE required duration (2:30 PM − 7:00 PM = −4.5h), which would
 *    make the rule trivially true. Implemented here as the corrected
 *    mirror of First Half Present's version instead:
 *    (Out Time − In Time) >= (Shift End − Half Shift). FLAG THIS — if the
 *    original was not a typo, this function needs to change back.
 *
 * 5. The "1 day" payroll-weightage column is NOT used anywhere in this
 *    file. It showed the same value across Present, both Half-Day
 *    variants, and Absent, which can't all mean "1 full paid day" — not
 *    implementing any payroll math against it until its real meaning is
 *    confirmed.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { Shift } from '../../database/models/Shift';
import { CombinedAttendanceRow } from './attendance-combined.service';

export type FinalAttendanceStatus =
  | 'Full Day Present'
  | 'First Half Present'
  | 'Second Half Present'
  | 'Full Day Absent'
  | 'Unclassified';

export interface RuleEvaluationResult {
  status: FinalAttendanceStatus;
  matchedRule: string | null; // e.g. 'PRESENT_STRICT', 'ABSENT_NO_PUNCH' — for audit/debugging
  lateMinutes: number;        // actual lateness that day, floored at 0 (the "Late Coming Minute" value)
}

interface ShiftBoundariesSeconds {
  start: number;
  end: number;       // already adjusted +86400 if the shift crosses midnight
  halfShift: number;
  durationSec: number;
  graceSec: number;
}

function parseTimeToSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesSeconds {
  const start = parseTimeToSeconds(shift.start_time);
  const durationSec = shift.duration_minutes * 60;
  const end = shift.crosses_midnight ? start + durationSec : parseTimeToSeconds(shift.end_time);
  const halfShift = start + durationSec / 2;
  const graceSec = graceMinutes * 60;
  return { start, end, halfShift, durationSec, graceSec };
}

/**
 * Normalizes raw check_in/check_out (HH:MM:SS, no date) into seconds
 * comparable against shift boundaries — using the shift's OWN
 * crosses_midnight flag as ground truth, not a per-punch guess.
 */
function normalizePunchSeconds(
  checkIn: string,
  checkOut: string,
  shift: Shift,
): { inSec: number; outSec: number } {
  const inSec = parseTimeToSeconds(checkIn);
  let outSec = parseTimeToSeconds(checkOut);
  if (shift.crosses_midnight && outSec < inSec) {
    outSec += 86400;
  }
  return { inSec, outSec };
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 1: Full Day Present
// ═══════════════════════════════════════════════════════════════════════
function evaluatePresent(
  inSec: number,
  outSec: number,
  b: ShiftBoundariesSeconds,
  lateMinutes: number,
): string | null {
  // Rule A (+ old Rule B merged in via crosses_midnight normalization above):
  // arrived at/before shift start, stayed through to shift end.
  if (inSec <= b.start && outSec >= b.end) {
    return 'PRESENT_STRICT';
  }

  // Rule C: arrived within grace, but only counts if they stayed late
  // enough to cover their own lateness.
  const lateSec = lateMinutes * 60;
  if (inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
    return 'PRESENT_GRACE_WITH_MAKEUP';
  }

  // Rule D: duration-only fallback, ignores clock alignment entirely.
  if (outSec - inSec >= b.durationSec) {
    return 'PRESENT_DURATION_ONLY';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 2: Half Day (First Half Present / Second Half Present)
// ═══════════════════════════════════════════════════════════════════════
function evaluateHalfDay(
  inSec: number,
  outSec: number,
  b: ShiftBoundariesSeconds,
  lateMinutes: number,
): { status: 'First Half Present' | 'Second Half Present'; rule: string } | null {
  const lateSec = lateMinutes * 60;

  // ── First Half Present: on time, left somewhere in the back half ──────
  if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
    return { status: 'First Half Present', rule: 'FIRST_HALF_STRICT' };
  }
  if (
    inSec <= b.start + b.graceSec &&
    outSec >= b.halfShift + lateSec &&
    outSec < b.end
  ) {
    return { status: 'First Half Present', rule: 'FIRST_HALF_GRACE_WITH_MAKEUP' };
  }
  if (outSec - inSec >= b.halfShift - b.start) {
    return { status: 'First Half Present', rule: 'FIRST_HALF_DURATION_ONLY' };
  }

  // ── Second Half Present: arrived late, stayed through to shift end ────
  if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
    return { status: 'Second Half Present', rule: 'SECOND_HALF_STRICT' };
  }
  if (
    inSec <= b.halfShift + b.graceSec &&
    inSec > b.start + b.graceSec &&
    outSec >= b.end + lateSec
  ) {
    return { status: 'Second Half Present', rule: 'SECOND_HALF_GRACE_WITH_MAKEUP' };
  }
  // ASSUMPTION #4 applied here — see file header. Using (end - halfShift),
  // the corrected mirror of First Half's duration rule, not the literal
  // (halfShift - end) from the source table.
  if (outSec - inSec >= b.end - b.halfShift) {
    return { status: 'Second Half Present', rule: 'SECOND_HALF_DURATION_ONLY' };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 3: Full Day Absent (punch-based rules — "no punch" handled earlier)
// ═══════════════════════════════════════════════════════════════════════
function evaluateAbsent(
  inSec: number,
  outSec: number,
  b: ShiftBoundariesSeconds,
  lateMinutes: number,
): string | null {
  const lateSec = lateMinutes * 60;

  // Rule A: arrived beyond grace, and didn't stay late enough to compensate.
  if (inSec > b.start + b.graceSec && outSec < b.end + lateSec) {
    return 'ABSENT_LATE_NO_MAKEUP';
  }

  // Rule B: arrived at/before shift start OR within grace, but left before
  // even reaching the half-shift mark.
  // FIX APPLIED: the original condition also required `inSec > b.start`
  // (i.e. only covered "slightly late but within grace" arrivals). That
  // left a real gap — an employee arriving exactly on time or early, then
  // leaving after only an hour or two, matched NONE of the rules and fell
  // through to 'Unclassified'. Dropping the lower bound so this rule
  // covers "arrived on time or within grace, left too early" as one
  // continuous case — lateMinutes is already floored at 0 for on-time/early
  // arrivals, so the outSec comparison degrades correctly to
  // "left before halfShift" with no special-casing needed.
  if (inSec <= b.start + b.graceSec && outSec < b.halfShift + lateSec) {
    return 'ABSENT_LEFT_TOO_EARLY';
  }

  // Rule C: arrived very late (past half-shift, within grace of it), and
  // still didn't stay late enough to compensate.
  if (
    inSec <= b.halfShift + b.graceSec &&
    inSec > b.halfShift &&
    outSec < b.end + lateSec
  ) {
    return 'ABSENT_ARRIVED_TOO_LATE';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// Top-level combinator — applies the precedence order from ASSUMPTION #1
// ═══════════════════════════════════════════════════════════════════════
export function evaluateAttendanceStatus(
  row: CombinedAttendanceRow,
  shift: Shift,
  graceMinutes: number,
): RuleEvaluationResult {
  // No punches at all → immediate Full Day Absent, nothing else to evaluate.
  if (!row.check_in && !row.check_out) {
    return { status: 'Full Day Absent', matchedRule: 'ABSENT_NO_PUNCH', lateMinutes: 0 };
  }

  // Any other incomplete case (only one of check_in/check_out present) —
  // none of the rule sets above are defined for a single missing punch.
  // Treating as Unclassified rather than guessing; worth a policy decision.
  if (!row.check_in || !row.check_out) {
    return { status: 'Unclassified', matchedRule: 'MISSING_ONE_PUNCH', lateMinutes: 0 };
  }

  const b = computeShiftBoundaries(shift, graceMinutes);
  const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);
  const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));

  const presentRule = evaluatePresent(inSec, outSec, b, lateMinutes);
  if (presentRule) {
    return { status: 'Full Day Present', matchedRule: presentRule, lateMinutes };
  }

  const halfDayResult = evaluateHalfDay(inSec, outSec, b, lateMinutes);
  if (halfDayResult) {
    return { status: halfDayResult.status, matchedRule: halfDayResult.rule, lateMinutes };
  }

  const absentRule = evaluateAbsent(inSec, outSec, b, lateMinutes);
  if (absentRule) {
    return { status: 'Full Day Absent', matchedRule: absentRule, lateMinutes };
  }

  return { status: 'Unclassified', matchedRule: null, lateMinutes };
}