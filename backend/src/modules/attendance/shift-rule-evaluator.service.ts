import { Shift } from '../../database/models/Shift';
import { CombinedAttendanceRow } from './attendance-combined.service';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Every code below is annotated with the row number of the source rules
 * sheet ("Abbreviations" tab) so the mapping between spec <-> code is
 * always traceable.
 */
export type FinalAttendanceStatus =
  | 'PRESENT'                      // Row 4  - P
  | 'ABSENT'                       // Row 5  - A
  | 'PRESENT_MISS_PUNCH'           // Row 2  - P:MP
  | 'MISS_PUNCH_PRESENT'           // Row 3  - MP:P
  | 'FIRST_HALF_PRESENT'           // Row 6  - P:A
  | 'SECOND_HALF_PRESENT'          // Row 7  - A:P
  | 'WEEK_OFF'                     // Row 8  - WO
  | 'HOLIDAY'                      // Row 9  - HO
  | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // Row 10 - MP:POW
  | 'MISS_PUNCH_PRESENT_HOLIDAY'   // Row 11 - MP:POH
  | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // Row 12 - P:MPOW
  | 'PRESENT_MISS_PUNCH_HOLIDAY'   // Row 13 - P:MPOH
  | 'PRESENT_ON_WEEK_OFF'          // Row 14 - POW
  | 'PRESENT_ON_HOLIDAY'           // Row 15 - POH
  | 'ABSENT_ON_WEEK_OFF'           // Row 16 - AOW
  | 'ABSENT_ON_HOLIDAY'            // Row 17 - AOH
  | 'FIRST_HALF_PRESENT_WEEK_OFF'  // Row 18 - P:AOW
  | 'FIRST_HALF_PRESENT_HOLIDAY'   // Row 19 - P:AOH
  | 'SECOND_HALF_PRESENT_WEEK_OFF' // Row 20 - A:POW
  | 'SECOND_HALF_PRESENT_HOLIDAY'  // Row 21 - A:POH
  | 'SHORT_LEAVE_HALF_PRESENT'     // Row 22 - SL(h):P
  | 'PRESENT_SHORT_LEAVE_HALF'     // Row 23 - P:SL(h)
  | 'SHORT_LEAVE_FULL_PRESENT'     // Row 24 - SL(f):P
  | 'PRESENT_SHORT_LEAVE_FULL'     // Row 25 - P:SL(f)
  | 'CASUAL_LEAVE_PRESENT'         // Row 26 - CL:P
  | 'EARNED_LEAVE_PRESENT'         // Row 27 - EL:P
  | 'PRESENT_CASUAL_LEAVE'         // Row 28 - P:CL
  | 'PRESENT_EARNED_LEAVE'         // Row 29 - P:EL
  | 'CASUAL_LEAVE_ABSENT'          // Row 30 - CL(A)
  | 'EARNED_LEAVE_ABSENT'          // Row 31 - EL(A)
  | 'CASUAL_LEAVE'                 // Row 32 - CL
  | 'EARNED_LEAVE'                 // Row 33 - EL
  | 'Unclassified';

/** The subset of statuses that can come purely out of punch data, before any leave is layered on top. */
type BaseAttendanceStatus = 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT';

export interface AppliedLeaveDetails {
  type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
  position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
  approved: boolean;
}

export interface RuleEvaluationResult {
  status: FinalAttendanceStatus;
  matchedRule: string | null;
  lateMinutes: number;
}

export interface AttendanceEvaluationOptions {
  /** Minutes an employee may check in after shift start without being marked late. Default 15. */
  graceMinutes?: number;
  isWeekOff?: boolean;
  isHoliday?: boolean;
  /**
   * Approved leave (short leave / CL / EL) applicable to this employee on this date, if any.
   *
   * NOTE: balance is intentionally NOT consulted here. CL/EL requests can only be
   * created/approved when the employee already has sufficient balance (enforced at
   * leave-request approval time), so by the time a leave reaches this engine as
   * `approved: true`, the balance check has already happened upstream. This engine
   * only asks "was it approved?" — never "do they still have days left?".
   */
  appliedLeave?: AppliedLeaveDetails;
}

interface ShiftBoundariesSeconds {
  start: number;
  end: number;
  halfShift: number;
  durationSec: number;
  graceSec: number;
}

// ═══════════════════════════════════════════════════════════════════════
// TIME HELPERS
// ═══════════════════════════════════════════════════════════════════════

function parseTimeToSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesSeconds {
  const start = parseTimeToSeconds(shift.start_time);
  const durationSec = shift.duration_minutes * 60;
  const end = shift.crosses_midnight ? start + durationSec : parseTimeToSeconds(shift.end_time);

  // NOTE: `half_shift_time` is not yet a first-class column on the Shift model.
  // Until it is added, we derive the midpoint automatically so the engine still
  // works for any shift length/duration, not just the 9-hour example in the sheet.
  const halfShift = (shift as any).half_shift_time
    ? parseTimeToSeconds((shift as any).half_shift_time)
    : start + durationSec / 2;

  const graceSec = graceMinutes * 60;
  return { start, end, halfShift, durationSec, graceSec };
}

function normalizePunchSeconds(checkIn: string, checkOut: string, shift: Shift): { inSec: number; outSec: number } {
  const inSec = parseTimeToSeconds(checkIn);
  let outSec = parseTimeToSeconds(checkOut);
  if (shift.crosses_midnight && outSec < inSec) {
    outSec += 86400;
  }
  return { inSec, outSec };
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION A — BASE (PUNCH-ONLY) ATTENDANCE
// Rows 4-7: P, A, P:A, A:P
// This must be computed BEFORE any leave is considered, because several
// leave conversions (rows 26-31) are only valid if the underlying punch
// pattern already matches a specific base status.
// ═══════════════════════════════════════════════════════════════════════

function computeBaseAttendance(
  inSec: number,
  outSec: number,
  b: ShiftBoundariesSeconds,
  lateMinutes: number,
): { baseStatus: BaseAttendanceStatus; matchedRule: string } {
  const lateSec = lateMinutes * 60;
  const workedSec = outSec - inSec;

  // ── P — FULL DAY PRESENT (Row 4) ──
  // Sheet Logic 1: on-time in, stayed till shift end.
  if (inSec <= b.start && outSec >= b.end) {
    return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC1_STRICT' };
  }
  // Sheet Logic 3: checked in inside the grace window AND made up the late
  // minutes on checkout (e.g. in at 10:07 -> must stay till >= 19:07).
  if (inSec > b.start && inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
    return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC3_GRACE_MAKEUP' };
  }
  // Sheet Logic 4: pure duration fallback, regardless of exact in/out alignment.
  if (workedSec >= b.durationSec) {
    return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC4_DURATION' };
  }

  // ── P:A — FIRST HALF PRESENT (Row 6) ──
  // Sheet Logic 1: on-time in, out covers at least the first half but not full day.
  if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
    return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC1_STRICT' };
  }
  // Sheet Logic 2: within grace, made up half-shift + late minutes.
  if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
    return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC2_GRACE_MAKEUP' };
  }
  // Sheet Logic 3 (duration fallback): worked at least the first-half's worth of hours.
  if (inSec <= b.start + b.graceSec && outSec < b.end && workedSec >= b.halfShift - b.start) {
    return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC3_DURATION' };
  }

  // ── A:P — SECOND HALF PRESENT (Row 7) ──
  // Sheet Logic 1: arrived after grace (but by half-shift), stayed through
  // shift end. NOTE: earlier code required staying past (end + lateMinutes),
  // which is Row 7's Logic 2 — but Logic 2 is a STRICT SUBSET of Logic 1
  // (end + lateSec >= end always), so implementing only Logic 2 was
  // silently rejecting people who left right at shift end without the
  // extra late-minutes makeup. Fixed to the correct, broader Logic 1 check.
  if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
    return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC1_STRICT' };
  }
  // Sheet Logic 3 (duration fallback): worked at least "second half"'s worth of hours.
  if (inSec > b.start + b.graceSec && workedSec >= b.end - b.halfShift) {
    return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC3_DURATION' };
  }

  // ── A — ABSENT (Row 5) — fallthrough for every other pattern ──
  // Sheet's own Logic 1-3 for Row 5 describe arrival/departure combinations
  // that don't satisfy any P / P:A / A:P condition above — those are
  // already excluded by the checks above, so no separate check is needed
  // here; this fallthrough correctly catches all of them by exclusion.
  return { baseStatus: 'ABSENT', matchedRule: 'ROW5_ABSENT_FALLTHROUGH' };
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION B — OFF-DAY ATTENDANCE (employee punched in on a Week Off / Holiday)
// Rows 14-21: POW, POH, AOW, AOH, P:AOW, P:AOH, A:POW, A:POH
// These are evaluated purely on hours worked, NOT on shift-start lateness,
// because nobody is "late" on a day they weren't scheduled to work.
// ═══════════════════════════════════════════════════════════════════════

function evaluateOffDayAttendance(
  inSec: number,
  outSec: number,
  b: ShiftBoundariesSeconds,
  kind: 'WEEK_OFF' | 'HOLIDAY',
): RuleEvaluationResult {
  const workedSec = outSec - inSec;
  const fullThreshold = b.durationSec;     // Row 14/15: "Out Time - In Time >= 9 Hours"
  const halfThreshold = b.durationSec / 2; // Row 16/17: "Out Time - In Time < 4.5 Hours"

  if (workedSec >= fullThreshold) {
    return {
      status: kind === 'WEEK_OFF' ? 'PRESENT_ON_WEEK_OFF' : 'PRESENT_ON_HOLIDAY',
      matchedRule: kind === 'WEEK_OFF' ? 'ROW14_POW_FULL_DURATION' : 'ROW15_POH_FULL_DURATION',
      lateMinutes: 0,
    };
  }
  if (workedSec < halfThreshold) {
    return {
      status: kind === 'WEEK_OFF' ? 'ABSENT_ON_WEEK_OFF' : 'ABSENT_ON_HOLIDAY',
      matchedRule: kind === 'WEEK_OFF' ? 'ROW16_AOW_SHORT_DURATION' : 'ROW17_AOH_SHORT_DURATION',
      lateMinutes: 0,
    };
  }
  // Between half and full duration (Row 18-21): which half did they cover?
  if (inSec < b.halfShift) {
    return {
      status: kind === 'WEEK_OFF' ? 'FIRST_HALF_PRESENT_WEEK_OFF' : 'FIRST_HALF_PRESENT_HOLIDAY',
      matchedRule: kind === 'WEEK_OFF' ? 'ROW18_P_AOW' : 'ROW19_P_AOH',
      lateMinutes: 0,
    };
  }
  return {
    status: kind === 'WEEK_OFF' ? 'SECOND_HALF_PRESENT_WEEK_OFF' : 'SECOND_HALF_PRESENT_HOLIDAY',
    matchedRule: kind === 'WEEK_OFF' ? 'ROW20_A_POW' : 'ROW21_A_POH',
    lateMinutes: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION C — SHORT LEAVE OVERRIDES
// Rows 22-25: SL(h):P, P:SL(h), SL(f):P, P:SL(f)
// A short leave "buys back" 30 or 60 minutes of lateness/early-departure.
// Balance is not checked here either — same reasoning as CL/EL below.
// ═══════════════════════════════════════════════════════════════════════

function evaluateShortLeaveOverride(
  inSec: number,
  outSec: number,
  b: ShiftBoundariesSeconds,
  lateMinutes: number,
  appliedLeave: AppliedLeaveDetails,
): { status: FinalAttendanceStatus; matchedRule: string } | null {
  const lateSec = lateMinutes * 60;

  // ── SL(h):P — 30-min short leave covering a LATE ARRIVAL (Row 22) ──
  if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
    if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end) {
      return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'ROW22_SL_HALF_MORNING' };
    }
  }

  // ── P:SL(h) — 30-min short leave covering an EARLY DEPARTURE (Row 23) ──
  if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
    // On-time arrival, left up to 30 minutes early.
    if (inSec <= b.start && outSec >= b.end - 1800 && outSec < b.end) {
      return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_ONTIME' };
    }
    // Arrived within grace: the 30-minute window shifts by the late minutes too.
    if (
      inSec > b.start &&
      inSec <= b.start + b.graceSec &&
      outSec >= b.end - 1800 + lateSec &&
      outSec < b.end + lateSec
    ) {
      return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_GRACE' };
    }
  }

  // ── SL(f):P — 60-min short leave covering a LATE ARRIVAL (Row 24) ──
  if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
    if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end) {
      return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'ROW24_SL_FULL_MORNING' };
    }
  }

  // ── P:SL(f) — 60-min short leave covering an EARLY DEPARTURE (Row 25) ──
  if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
    if (inSec <= b.start && outSec >= b.end - 3600 && outSec < b.end) {
      return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_ONTIME' };
    }
    if (
      inSec > b.start &&
      inSec <= b.start + b.graceSec &&
      outSec >= b.end - 3600 + lateSec &&
      outSec < b.end + lateSec
    ) {
      return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_GRACE' };
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION D — CASUAL / EARNED LEAVE CONVERSIONS
// Rows 26-33: CL:P, EL:P, P:CL, P:EL, CL(A), EL(A), CL, EL
//
// Half-day conversions (rows 26-29) REQUIRE the punch-only base status to
// already show the matching half present — leave cannot manufacture a
// punch that was never recorded:
//   CL:P / EL:P  -> base status must be A:P (SECOND_HALF_PRESENT), leave covers 1st half
//   P:CL / P:EL  -> base status must be P:A (FIRST_HALF_PRESENT), leave covers 2nd half
//
// Full-day conversions (rows 30-33) apply on top of a fully ABSENT day:
//   position FULL_DAY                    -> CL / EL          (Row 32/33)
//   position FIRST_HALF or SECOND_HALF   -> CL(A) / EL(A)    (Row 30/31,
//     "OR Apply First Or Second Half" per the sheet)
//
// BALANCE IS NOT CHECKED HERE. A LeaveRequest can only be created/approved
// when the employee has sufficient balance — that check happens upstream,
// at request-approval time. By the time this engine sees `approved: true`,
// balance is a solved problem. The only gate here is approval + which
// position was requested.
// ═══════════════════════════════════════════════════════════════════════

function evaluateLeaveConversion(
  baseStatus: BaseAttendanceStatus,
  appliedLeave: AppliedLeaveDetails,
): { status: FinalAttendanceStatus; matchedRule: string } | null {
  const isCL = appliedLeave.type === 'CL';
  const isEL = appliedLeave.type === 'EL';
  if (!isCL && !isEL) return null;
  if (!appliedLeave.approved) return null;

  // ── Row 26 / 27 — CL:P / EL:P (original attendance must be A:P) ──
  if (appliedLeave.position === 'FIRST_HALF' && baseStatus === 'SECOND_HALF_PRESENT') {
    return isCL
      ? { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'ROW26_CL_P_ORIGINAL_AP' }
      : { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'ROW27_EL_P_ORIGINAL_AP' };
  }

  // ── Row 28 / 29 — P:CL / P:EL (original attendance must be P:A) ──
  if (appliedLeave.position === 'SECOND_HALF' && baseStatus === 'FIRST_HALF_PRESENT') {
    return isCL
      ? { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'ROW28_P_CL_ORIGINAL_PA' }
      : { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'ROW29_P_EL_ORIGINAL_PA' };
  }

  // Rows 30-33 only apply on top of a fully absent (no valid punch pattern) day.
  if (baseStatus !== 'ABSENT') return null;

  // ── Row 32 / 33 — CL / EL (full day requested) ──
  if (appliedLeave.position === 'FULL_DAY') {
    return isCL
      ? { status: 'CASUAL_LEAVE', matchedRule: 'ROW32_CL_FULL_DAY' }
      : { status: 'EARNED_LEAVE', matchedRule: 'ROW33_EL_FULL_DAY' };
  }

  // ── Row 30 / 31 — CL(A) / EL(A) ("OR Apply First Or Second Half" on a fully-absent day) ──
  if (appliedLeave.position === 'FIRST_HALF' || appliedLeave.position === 'SECOND_HALF') {
    return isCL
      ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_HALF_ON_FULL_ABSENT' }
      : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_HALF_ON_FULL_ABSENT' };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EVALUATION ENGINE
// ═══════════════════════════════════════════════════════════════════════

export function evaluateAttendanceStatus(
  row: CombinedAttendanceRow,
  shift: Shift,
  options: AttendanceEvaluationOptions = {},
): RuleEvaluationResult {
  const {
    graceMinutes = 15,
    isWeekOff = false,
    isHoliday = false,
    appliedLeave,
  } = options;

  // ── 1. MISSING BOTH PUNCHES ──
  if (!row.check_in && !row.check_out) {
    if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'ROW8_WO_NO_PUNCH', lateMinutes: 0 };
    if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'ROW9_HO_NO_PUNCH', lateMinutes: 0 };

    // An employee with zero punches and an approved full-day (or
    // half-day-on-a-fully-absent-day) CL/EL leave should NOT be
    // reported as ABSENT — check the leave first. This reuses the
    // same conversion logic as the punched-day case (Rows 30-33),
    // just fed baseStatus='ABSENT' directly since there's no punch
    // data to derive a base status from.
    if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
      const leaveResult = evaluateLeaveConversion('ABSENT', appliedLeave);
      if (leaveResult) {
        return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes: 0 };
      }
    }

    return { status: 'ABSENT', matchedRule: 'ROW5_ABSENT_NO_PUNCH', lateMinutes: 0 };
  }

  // ── 2. MISSING A SINGLE PUNCH (Rows 2, 3, 10-13) ──
  if (!row.check_in || !row.check_out) {
    const isOutMissing = !!row.check_in && !row.check_out;
    if (isWeekOff) {
      return {
        status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF',
        matchedRule: isOutMissing ? 'ROW12_P_MPOW' : 'ROW10_MP_POW',
        lateMinutes: 0,
      };
    }
    if (isHoliday) {
      return {
        status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY',
        matchedRule: isOutMissing ? 'ROW13_P_MPOH' : 'ROW11_MP_POH',
        lateMinutes: 0,
      };
    }
    return {
      status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT',
      matchedRule: isOutMissing ? 'ROW2_P_MP' : 'ROW3_MP_P',
      lateMinutes: 0,
    };
  }

  // ── 3. BOUNDARY / PUNCH NORMALIZATION ──
  const b = computeShiftBoundaries(shift, graceMinutes);
  const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

  if (outSec < inSec) {
    return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
  }

  // Late minutes are always measured against the standard shift start time.
  const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));

  // ── 4. OFF-DAY PATH (Week Off / Holiday with punches present) ──
  // Evaluated purely on hours worked — lateness rules don't apply to a day
  // the employee wasn't scheduled to work.
  if (isWeekOff) return evaluateOffDayAttendance(inSec, outSec, b, 'WEEK_OFF');
  if (isHoliday) return evaluateOffDayAttendance(inSec, outSec, b, 'HOLIDAY');

  // ── 5. NORMAL WORKING DAY — SHORT LEAVE OVERRIDE FIRST (Rows 22-25) ──
  if (appliedLeave?.approved && (appliedLeave.type === 'SL_HALF' || appliedLeave.type === 'SL_FULL')) {
    const shortLeaveResult = evaluateShortLeaveOverride(inSec, outSec, b, lateMinutes, appliedLeave);
    if (shortLeaveResult) {
      return { status: shortLeaveResult.status, matchedRule: shortLeaveResult.matchedRule, lateMinutes };
    }
  }

  // ── 6. BASE ATTENDANCE FROM PUNCHES (Rows 4-7) ──
  const { baseStatus, matchedRule } = computeBaseAttendance(inSec, outSec, b, lateMinutes);

  // ── 7. CASUAL / EARNED LEAVE CONVERSION (Rows 26-33) ──
  if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
    const leaveResult = evaluateLeaveConversion(baseStatus, appliedLeave);
    if (leaveResult) {
      return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes };
    }
  }

  // ── 8. NO OVERRIDE APPLIED — RETURN PUNCH-ONLY STATUS ──
  return { status: baseStatus, matchedRule, lateMinutes };
}