/**
 * shift-rule-evaluator.service.ts
 *
 * Layer 2 of the attendance architecture: takes one day's merged
 * check-in/check-out (from attendance-combined.service.ts) plus the
 * employee's shift + grace period, and computes the final attendance
 * status per the business rules you provided.
 *
 * All internal time math is done in MINUTES (converted from earlier
 * seconds-based version) — seconds in raw punch timestamps are truncated
 * (floored) down to the containing minute during parsing, so e.g.
 * "10:14:59" is treated as minute 10:14, never rounded up to 10:15. This
 * is a deliberate choice: never let a stray second push someone past a
 * grace/threshold boundary in their disfavor.
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

export interface ShiftInfo {
  start_time: string;
  end_time: string;
}

export type FinalAttendanceStatus =
  | 'Full Day Present'
  | 'First Half Present'
  | 'Second Half Present'
  | 'Full Day Absent'
  | 'Holiday'
  | 'Weekly Off'
  | 'Incomplete'    
  | 'Missing Punch'    
  | 'Unclassified';

export interface RuleEvaluationResult {
  status: FinalAttendanceStatus;
  matchedRule: string | null; // e.g. 'PRESENT_STRICT', 'ABSENT_NO_PUNCH' — for audit/debugging
  lateMinutes: number;
  shift: ShiftInfo | null;
}

interface ShiftBoundariesMinutes {
  start: number;
  end: number;       // already adjusted +1440 if the shift crosses midnight
  halfShift: number;
  durationMin: number;
  graceMin: number;
}


function isShiftClosed(
  attendanceDate: string,
  shift: Shift,
  currentDate: string = new Date().toISOString().split('T')[0],
  currentTime: string = new Date().toTimeString().slice(0, 8),
): boolean {
  // If attendance date is before today, shift has definitely closed
  if (attendanceDate < currentDate) {
    return true;
  }

  // If attendance date is in the future, shift hasn't closed yet
  if (attendanceDate > currentDate) {
    return false;
  }

  // Same day: compare current time with shift end time
  const currentMinutes = parseTimeToMinutes(currentTime);
  const shiftEndMinutes = parseTimeToMinutes(shift.end_time);
  const adjustedShiftEnd = shift.crosses_midnight 
    ? shiftEndMinutes 
    : shiftEndMinutes;

  return currentMinutes >= adjustedShiftEnd;
}

/**
 * Parses "HH:MM:SS" into total minutes since midnight. Seconds are
 * truncated (floored), not rounded — see file header note.
 */
function parseTimeToMinutes(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  const totalSeconds = h * 3600 + m * 60 + (s || 0);
  return Math.floor(totalSeconds / 60);
}

function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesMinutes {
  const start = parseTimeToMinutes(shift.start_time);
  const durationMin = shift.duration_minutes; // already stored in minutes — no conversion needed
  const end = shift.crosses_midnight ? start + durationMin : parseTimeToMinutes(shift.end_time);
  const halfShift = start + durationMin / 2;
  return { start, end, halfShift, durationMin, graceMin: graceMinutes };
}

/**
 * Normalizes raw check_in/check_out (HH:MM:SS, no date) into minutes
 * comparable against shift boundaries — using the shift's OWN
 * crosses_midnight flag as ground truth, not a per-punch guess.
 */
function normalizePunchMinutes(
  checkIn: string,
  checkOut: string,
  shift: Shift,
): { inMin: number; outMin: number } {
  const inMin = parseTimeToMinutes(checkIn);
  let outMin = parseTimeToMinutes(checkOut);
  if (shift.crosses_midnight && outMin < inMin) {
    outMin += 1440; // minutes in a day (was +86400 seconds)
  }
  return { inMin, outMin };
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 1: Full Day Present
// ═══════════════════════════════════════════════════════════════════════
function evaluatePresent(
  inMin: number,
  outMin: number,
  b: ShiftBoundariesMinutes,
  lateMinutes: number,
): string | null {
  // Rule A (+ old Rule B merged in via crosses_midnight normalization above):
  // arrived at/before shift start, stayed through to shift end.
  if (inMin <= b.start && outMin >= b.end) {
    return 'PRESENT_STRICT';
  }

  if (inMin <= b.start && outMin < inMin) {
    return 'PRESENT_STRICT';
  }

  // Rule C: arrived within grace, but only counts if they stayed late
  // enough to cover their own lateness.
  if (inMin <= b.start + b.graceMin && outMin >= b.end + lateMinutes) {
    return 'PRESENT_GRACE_WITH_MAKEUP';
  }

  // Rule D: duration-only fallback, ignores clock alignment entirely.
  if (outMin - inMin >= b.durationMin) {
    return 'PRESENT_DURATION_ONLY';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 2: Half Day (First Half Present / Second Half Present)
// ═══════════════════════════════════════════════════════════════════════
function evaluateHalfDay(
  inMin: number,
  outMin: number,
  b: ShiftBoundariesMinutes,
  lateMinutes: number,
): { status: 'First Half Present' | 'Second Half Present'; rule: string } | null {
  // ── First Half Present: on time, left somewhere in the back half ──────
  if (inMin <= b.start && outMin >= b.halfShift && outMin < b.end) {
    return { status: 'First Half Present', rule: 'FIRST_HALF_STRICT' };
  }
  if (
    inMin <= b.start + b.graceMin &&
    outMin >= b.halfShift + lateMinutes &&
    outMin < b.end
  ) {
    return { status: 'First Half Present', rule: 'FIRST_HALF_GRACE_WITH_MAKEUP' };
  }
  if (outMin - inMin >= b.halfShift - b.start) {
    return { status: 'First Half Present', rule: 'FIRST_HALF_DURATION_ONLY' };
  }

  // ── Second Half Present: arrived late, stayed through to shift end ────
  if (inMin <= b.halfShift && inMin > b.start + b.graceMin && outMin >= b.end) {
    return { status: 'Second Half Present', rule: 'SECOND_HALF_STRICT' };
  }
  if (
    inMin <= b.halfShift + b.graceMin &&
    inMin > b.start + b.graceMin &&
    outMin >= b.end + lateMinutes
  ) {
    return { status: 'Second Half Present', rule: 'SECOND_HALF_GRACE_WITH_MAKEUP' };
  }
  // ASSUMPTION #4 applied here — see file header. Using (end - halfShift),
  // the corrected mirror of First Half's duration rule, not the literal
  // (halfShift - end) from the source table.
  if (outMin - inMin >= b.end - b.halfShift) {
    return { status: 'Second Half Present', rule: 'SECOND_HALF_DURATION_ONLY' };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// STEP 3: Full Day Absent (punch-based rules — "no punch" handled earlier)
// ═══════════════════════════════════════════════════════════════════════
function evaluateAbsent(
  inMin: number,
  outMin: number,
  b: ShiftBoundariesMinutes,
  lateMinutes: number,
): string | null {
  // Rule A: arrived beyond grace, and didn't stay late enough to compensate.
  if (inMin > b.start + b.graceMin && outMin < b.end + lateMinutes) {
    return 'ABSENT_LATE_NO_MAKEUP';
  }

  // Rule B: arrived at/before shift start OR within grace, but left before
  // even reaching the half-shift mark.
  // FIX APPLIED (carried over from the seconds-based version): the
  // original condition also required `inMin > b.start` (i.e. only covered
  // "slightly late but within grace" arrivals). That left a real gap — an
  // employee arriving exactly on time or early, then leaving after only an
  // hour or two, matched NONE of the rules and fell through to
  // 'Unclassified'. Dropping the lower bound so this rule covers "arrived
  // on time or within grace, left too early" as one continuous case —
  // lateMinutes is already floored at 0 for on-time/early arrivals, so the
  // outMin comparison degrades correctly to "left before halfShift" with
  // no special-casing needed.
  if (inMin <= b.start + b.graceMin && outMin < b.halfShift + lateMinutes) {
    return 'ABSENT_LEFT_TOO_EARLY';
  }

  // Rule C: arrived very late (past half-shift, within grace of it), and
  // still didn't stay late enough to compensate.
  if (
    inMin <= b.halfShift + b.graceMin &&
    inMin > b.halfShift &&
    outMin < b.end + lateMinutes
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
  currentDate: string = new Date().toISOString().split('T')[0],
  currentTime: string = new Date().toTimeString().slice(0, 8),  
): RuleEvaluationResult {
  
  const shiftInfo = shift ? {start_time: shift.start_time, end_time: shift.end_time,} : null;
  // No punches at all → immediate Full Day Absent, nothing else to evaluate.
  if (!row.check_in && !row.check_out) {
    return { status: 'Full Day Absent', matchedRule: 'ABSENT_NO_PUNCH', lateMinutes: 0, shift: shiftInfo };
  }

  // Any other incomplete case (only one of check_in/check_out present) —
  // none of the rule sets above are defined for a single missing punch.
  // Treating as Unclassified rather than guessing; worth a policy decision.
// Any other incomplete case (only one of check_in/check_out present) —
// Determine if shift has closed to decide between 'Incomplete' vs 'Missing Punch'
if (!row.check_in || !row.check_out) {
  if (isShiftClosed(row.date, shift, currentDate, currentTime)) {
    // Shift ended but only 1 punch recorded
    return { 
      status: 'Missing Punch', 
      matchedRule: 'MISSING_PUNCH_SHIFT_CLOSED', 
      lateMinutes: 0,
      shift: shiftInfo 
    };
  } else {
    // Shift still ongoing, only 1 punch so far
    return { 
      status: 'Incomplete', 
      matchedRule: 'INCOMPLETE_SINGLE_PUNCH', 
      lateMinutes: 0,
      shift: shiftInfo 
    };
  }
}

if (row.check_in === row.check_out) {
  // Handle duplicate punch
  return { 
    status: 'Incomplete', 
    matchedRule: 'DUPLICATE_PUNCH_DETECTED', 
    lateMinutes: 0,
    shift: shiftInfo, 
  };
}

  const b = computeShiftBoundaries(shift, graceMinutes);
  const { inMin, outMin } = normalizePunchMinutes(row.check_in, row.check_out, shift);

  // ANOMALY GUARD: if check_out is still before check_in after the
  // crosses_midnight adjustment, the data itself is broken — e.g. a bad
  // regularization time, a stray/erroneous punch, or a shift misconfigured
  // as not-crossing-midnight when it should. Evaluating the rules against
  // this would silently produce a confidently WRONG answer (a huge
  // negative-looking gap between in/out reads as "left almost immediately",
  // which the Absent rules then confirm as a real absence). Surface it
  // instead of guessing.
  if (outMin < inMin) {
    return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0, shift: shiftInfo };
  }

  const lateMinutes = Math.max(0, inMin - b.start);

  const presentRule = evaluatePresent(inMin, outMin, b, lateMinutes);
  if (presentRule) {
    return { status: 'Full Day Present', matchedRule: presentRule, lateMinutes, shift: shiftInfo };
  }

  const halfDayResult = evaluateHalfDay(inMin, outMin, b, lateMinutes);
  if (halfDayResult) {
    return { status: halfDayResult.status, matchedRule: halfDayResult.rule, lateMinutes, shift: shiftInfo };
  }

  const absentRule = evaluateAbsent(inMin, outMin, b, lateMinutes);
  if (absentRule) {
    return { status: 'Full Day Absent', matchedRule: absentRule, lateMinutes, shift: shiftInfo };
  }

  return { status: 'Unclassified', matchedRule: null, lateMinutes, shift: shiftInfo };
}