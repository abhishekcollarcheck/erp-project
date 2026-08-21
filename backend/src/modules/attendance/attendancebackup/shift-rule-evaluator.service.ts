// /**
//  * shift-rule-evaluator.service.ts
//  *
//  * Layer 2 of the attendance architecture: takes one day's merged
//  * check-in/check-out (from attendance-combined.service.ts) plus the
//  * employee's shift + grace period, and computes the final attendance
//  * status per the business rules you provided.
//  *
//  * ═══════════════════════════════════════════════════════════════════════
//  * ASSUMPTIONS BAKED INTO THIS FILE — NOT YET CONFIRMED BY YOU:
//  * ═══════════════════════════════════════════════════════════════════════
//  *
//  * 1. PRECEDENCE ORDER: No punches → Full Day Absent (immediate).
//  *    Otherwise: check Full Day Present first: if any rule matches, done.
//  *    Else check Half-Day (First Half / Second Half): if either matches, done.
//  *    Else check Full Day Absent's punch-based rules (A/B/C).
//  *    Else: 'Unclassified' — punches exist but nothing matched. This should
//  *    not normally happen if the rule sets are truly complete/disjoint by
//  *    design; treat any 'Unclassified' result in production as a signal
//  *    the rules need a gap filled, not as a silent default.
//  *
//  * 2. "Late Coming Minute" = the employee's ACTUAL lateness that day
//  *    (In Time − Shift Start, floored at 0), not a fixed config value.
//  *    Confirmed consistent across every rule row you've given so far.
//  *
//  * 3. "Half Shift" = Shift Start + (Shift Duration / 2) — derived at
//  *    runtime, not a separately stored config value. Verified against
//  *    your example (10:00 AM shift start + 4.5h = 2:30 PM, matching the
//  *    "2:30 PM" column exactly for a 9-hour shift).
//  *
//  * 4. Second Half Present's duration-only rule as literally given —
//  *    (Out Time − In Time) >= (Half Shift − Shift End) — computes to a
//  *    NEGATIVE required duration (2:30 PM − 7:00 PM = −4.5h), which would
//  *    make the rule trivially true. Implemented here as the corrected
//  *    mirror of First Half Present's version instead:
//  *    (Out Time − In Time) >= (Shift End − Half Shift). FLAG THIS — if the
//  *    original was not a typo, this function needs to change back.
//  *
//  * 5. The "1 day" payroll-weightage column is NOT used anywhere in this
//  *    file. It showed the same value across Present, both Half-Day
//  *    variants, and Absent, which can't all mean "1 full paid day" — not
//  *    implementing any payroll math against it until its real meaning is
//  *    confirmed.
//  * ═══════════════════════════════════════════════════════════════════════
//  */

// import { Shift } from '../../database/models/Shift';
// import { CombinedAttendanceRow } from './attendance-combined.service';

// export type FinalAttendanceStatus =
//   | 'Full Day Present'
//   | 'First Half Present'
//   | 'Second Half Present'
//   | 'Full Day Absent'
//   | 'Holiday'
//   | 'Weekly Off'
//   | 'Unclassified';

// export interface RuleEvaluationResult {
//   status: FinalAttendanceStatus;
//   matchedRule: string | null; // e.g. 'PRESENT_STRICT', 'ABSENT_NO_PUNCH' — for audit/debugging
//   lateMinutes: number;        // actual lateness that day, floored at 0 (the "Late Coming Minute" value)
// }

// interface ShiftBoundariesSeconds {
//   start: number;
//   end: number;       // already adjusted +86400 if the shift crosses midnight
//   halfShift: number;
//   durationSec: number;
//   graceSec: number;
// }

// function parseTimeToSeconds(time: string): number {
//   const [h, m, s] = time.split(':').map(Number);
//   return h * 3600 + m * 60 + (s || 0);
// }

// function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesSeconds {
//   const start = parseTimeToSeconds(shift.start_time);
//   const durationSec = shift.duration_minutes * 60;
//   const end = shift.crosses_midnight ? start + durationSec : parseTimeToSeconds(shift.end_time);
//   const halfShift = start + durationSec / 2;
//   const graceSec = graceMinutes * 60;
//   return { start, end, halfShift, durationSec, graceSec };
// }

// /**
//  * Normalizes raw check_in/check_out (HH:MM:SS, no date) into seconds
//  * comparable against shift boundaries — using the shift's OWN
//  * crosses_midnight flag as ground truth, not a per-punch guess.
//  */
// function normalizePunchSeconds(
//   checkIn: string,
//   checkOut: string,
//   shift: Shift,
// ): { inSec: number; outSec: number } {
//   const inSec = parseTimeToSeconds(checkIn);
//   let outSec = parseTimeToSeconds(checkOut);
//   if (shift.crosses_midnight && outSec < inSec) {
//     outSec += 86400;
//   }
//   return { inSec, outSec };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // STEP 1: Full Day Present
// // ═══════════════════════════════════════════════════════════════════════
// function evaluatePresent(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
// ): string | null {
//   // Rule A (+ old Rule B merged in via crosses_midnight normalization above):
//   // arrived at/before shift start, stayed through to shift end.
//   if (inSec <= b.start && outSec >= b.end) {
//     return 'PRESENT_STRICT';
//   }

//   // Rule C: arrived within grace, but only counts if they stayed late
//   // enough to cover their own lateness.
//   const lateSec = lateMinutes * 60;
//   if (inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
//     return 'PRESENT_GRACE_WITH_MAKEUP';
//   }

//   // Rule D: duration-only fallback, ignores clock alignment entirely.
//   if (outSec - inSec >= b.durationSec) {
//     return 'PRESENT_DURATION_ONLY';
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // STEP 2: Half Day (First Half Present / Second Half Present)
// // ═══════════════════════════════════════════════════════════════════════
// function evaluateHalfDay(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
// ): { status: 'First Half Present' | 'Second Half Present'; rule: string } | null {
//   const lateSec = lateMinutes * 60;

//   // ── First Half Present: on time, left somewhere in the back half ──────
//   if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
//     return { status: 'First Half Present', rule: 'FIRST_HALF_STRICT' };
//   }
//   if (
//     inSec <= b.start + b.graceSec &&
//     outSec >= b.halfShift + lateSec &&
//     outSec < b.end
//   ) {
//     return { status: 'First Half Present', rule: 'FIRST_HALF_GRACE_WITH_MAKEUP' };
//   }
//   if (outSec - inSec >= b.halfShift - b.start) {
//     return { status: 'First Half Present', rule: 'FIRST_HALF_DURATION_ONLY' };
//   }

//   // ── Second Half Present: arrived late, stayed through to shift end ────
//   if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
//     return { status: 'Second Half Present', rule: 'SECOND_HALF_STRICT' };
//   }
//   if (
//     inSec <= b.halfShift + b.graceSec &&
//     inSec > b.start + b.graceSec &&
//     outSec >= b.end + lateSec
//   ) {
//     return { status: 'Second Half Present', rule: 'SECOND_HALF_GRACE_WITH_MAKEUP' };
//   }
//   // ASSUMPTION #4 applied here — see file header. Using (end - halfShift),
//   // the corrected mirror of First Half's duration rule, not the literal
//   // (halfShift - end) from the source table.
//   if (outSec - inSec >= b.end - b.halfShift) {
//     return { status: 'Second Half Present', rule: 'SECOND_HALF_DURATION_ONLY' };
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // STEP 3: Full Day Absent (punch-based rules — "no punch" handled earlier)
// // ═══════════════════════════════════════════════════════════════════════
// function evaluateAbsent(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
// ): string | null {
//   const lateSec = lateMinutes * 60;

//   // Rule A: arrived beyond grace, and didn't stay late enough to compensate.
//   if (inSec > b.start + b.graceSec && outSec < b.end + lateSec) {
//     return 'ABSENT_LATE_NO_MAKEUP';
//   }

//   // Rule B: arrived at/before shift start OR within grace, but left before
//   // even reaching the half-shift mark.
//   // FIX APPLIED: the original condition also required `inSec > b.start`
//   // (i.e. only covered "slightly late but within grace" arrivals). That
//   // left a real gap — an employee arriving exactly on time or early, then
//   // leaving after only an hour or two, matched NONE of the rules and fell
//   // through to 'Unclassified'. Dropping the lower bound so this rule
//   // covers "arrived on time or within grace, left too early" as one
//   // continuous case — lateMinutes is already floored at 0 for on-time/early
//   // arrivals, so the outSec comparison degrades correctly to
//   // "left before halfShift" with no special-casing needed.
//   if (inSec <= b.start + b.graceSec && outSec < b.halfShift + lateSec) {
//     return 'ABSENT_LEFT_TOO_EARLY';
//   }

//   // Rule C: arrived very late (past half-shift, within grace of it), and
//   // still didn't stay late enough to compensate.
//   if (
//     inSec <= b.halfShift + b.graceSec &&
//     inSec > b.halfShift &&
//     outSec < b.end + lateSec
//   ) {
//     return 'ABSENT_ARRIVED_TOO_LATE';
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // Top-level combinator — applies the precedence order from ASSUMPTION #1
// // ═══════════════════════════════════════════════════════════════════════
// export function evaluateAttendanceStatus(
//   row: CombinedAttendanceRow,
//   shift: Shift,
//   graceMinutes: number,
// ): RuleEvaluationResult {
//   // No punches at all → immediate Full Day Absent, nothing else to evaluate.
//   if (!row.check_in && !row.check_out) {
//     return { status: 'Full Day Absent', matchedRule: 'ABSENT_NO_PUNCH', lateMinutes: 0 };
//   }

//   // Any other incomplete case (only one of check_in/check_out present) —
//   // none of the rule sets above are defined for a single missing punch.
//   // Treating as Unclassified rather than guessing; worth a policy decision.
//   if (!row.check_in || !row.check_out) {
//     return { status: 'Unclassified', matchedRule: 'MISSING_ONE_PUNCH', lateMinutes: 0 };
//   }

//   const b = computeShiftBoundaries(shift, graceMinutes);
//   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

//   // ANOMALY GUARD: if check_out is still before check_in after the
//   // crosses_midnight adjustment, the data itself is broken — e.g. a bad
//   // regularization time, a stray/erroneous punch, or a shift misconfigured
//   // as not-crossing-midnight when it should. Evaluating the rules against
//   // this would silently produce a confidently WRONG answer (a huge
//   // negative-looking gap between in/out reads as "left almost immediately",
//   // which the Absent rules then confirm as a real absence). Surface it
//   // instead of guessing — this is exactly the bug that made a 09:38 AM
//   // check-in with a check-out that ended up earlier than check-in
//   // (e.g. "00:11:15") show as 'Full Day Absent' instead of flagging that
//   // the underlying punch/regularization data needs review.
//   if (outSec < inSec) {
//     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
//   }

//   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));

//   const presentRule = evaluatePresent(inSec, outSec, b, lateMinutes);
//   if (presentRule) {
//     return { status: 'Full Day Present', matchedRule: presentRule, lateMinutes };
//   }

//   const halfDayResult = evaluateHalfDay(inSec, outSec, b, lateMinutes);
//   if (halfDayResult) {
//     return { status: halfDayResult.status, matchedRule: halfDayResult.rule, lateMinutes };
//   }

//   const absentRule = evaluateAbsent(inSec, outSec, b, lateMinutes);
//   if (absentRule) {
//     return { status: 'Full Day Absent', matchedRule: absentRule, lateMinutes };
//   }

//   return { status: 'Unclassified', matchedRule: null, lateMinutes };
// }




import { Shift } from "../../database/models/Shift";
import { CombinedAttendanceRow } from "./attendance-combined.service";

/**
 * ============================================================
 * SHIFT CATEGORY
 * ============================================================
 *
 * TEMPORARY:
 * Current employee is TIME based.
 *
 * TIME     = Office employee
 * DURATION = Site employee
 *
 * For the employee currently being tested, keep this as TIME.
 */
const SHIFT_CATEGORY = "TIME" as const;

export type FinalAttendanceStatus =
  | "Full Day Present"
  | "First Half Present"
  | "Second Half Present"
  | "Full Day Absent"
  | "Holiday"
  | "Weekly Off"
  | "Unclassified"
  | "In Punch Missing"
  | "Out Punch Missing";

export interface RuleEvaluationResult {
  status: FinalAttendanceStatus;
  matchedRule: string | null;
  lateMinutes: number;
}

interface ShiftBoundaries {
  start: number;
  end: number;
  half: number;
  grace: number;
  duration: number;
}

/**
 * ============================================================
 * TIME HELPERS
 * ============================================================
 */

function parseTimeToSeconds(time: string): number {
  const [h, m, s = 0] = time.split(":").map(Number);

  return h * 3600 + m * 60 + s;
}

/**
 * ============================================================
 * SHIFT BOUNDARIES
 * ============================================================
 *
 * Example:
 *
 * Shift:
 *   10:00 -> 19:00
 *
 * Duration:
 *   540 minutes = 9 hours
 *
 * Half:
 *   14:30
 *
 * Grace:
 *   15 minutes
 */
function getShiftBoundaries(
  shift: Shift,
  graceMinutes: number,
): ShiftBoundaries {
  const start = parseTimeToSeconds(shift.start_time);

  const duration = Number(shift.duration_minutes) * 60;

  let end: number;

  if (shift.crosses_midnight) {
    end = start + duration;
  } else {
    end = parseTimeToSeconds(shift.end_time);
  }

  /**
   * IMPORTANT:
   *
   * Half is based on the actual shift clock,
   * not on employee working duration.
   *
   * 10:00 + 4.5 hours = 14:30
   */
  const half = start + duration / 2;

  const grace = graceMinutes * 60;

  return {
    start,
    end,
    half,
    grace,
    duration,
  };
}

/**
 * ============================================================
 * NORMALIZE PUNCHES
 * ============================================================
 *
 * Handles overnight shifts.
 */
function normalizePunches(
  checkIn: string,
  checkOut: string,
  shift: Shift,
): {
  inSec: number;
  outSec: number;
} {
  const inSec = parseTimeToSeconds(checkIn);

  let outSec = parseTimeToSeconds(checkOut);

  if (shift.crosses_midnight && outSec < inSec) {
    outSec += 24 * 60 * 60;
  }

  return {
    inSec,
    outSec,
  };
}

/**
 * ============================================================
 * LATE MINUTES
 * ============================================================
 *
 * Example:
 *
 * Shift = 10:00
 * IN    = 10:07
 *
 * lateMinutes = 7
 *
 * Shift = 10:00
 * IN    = 09:55
 *
 * lateMinutes = 0
 */
function calculateLateMinutes(
  inSec: number,
  shiftStartSec: number,
): number {
  if (inSec <= shiftStartSec) {
    return 0;
  }

  return Math.floor((inSec - shiftStartSec) / 60);
}

/**
 * ============================================================
 * DURATION CATEGORY
 * ============================================================
 *
 * This is ONLY used when:
 *
 * SHIFT_CATEGORY = DURATION
 *
 * Your current employee is TIME, so this function will NOT
 * affect the current employee.
 */
function evaluateDurationAttendance(
  inSec: number,
  outSec: number,
  boundaries: ShiftBoundaries,
): RuleEvaluationResult {
  const workedSeconds = outSec - inSec;

  if (workedSeconds >= boundaries.duration) {
    return {
      status: "Full Day Present",
      matchedRule: "DURATION_FULL_DAY_PRESENT",
      lateMinutes: 0,
    };
  }

  return {
    status: "Full Day Absent",
    matchedRule: "DURATION_FULL_DAY_ABSENT",
    lateMinutes: 0,
  };
}

/**
 * ============================================================
 * MAIN EVALUATOR
 * ============================================================
 */
export function evaluateAttendanceStatus(
  row: CombinedAttendanceRow,
  shift: Shift,
  graceMinutes: number,
): RuleEvaluationResult {
  /**
   * ==========================================================
   * STEP 1
   * NO PUNCHES
   * ==========================================================
   */

  if (!row.check_in && !row.check_out) {
    return {
      status: "Full Day Absent",
      matchedRule: "ABSENT_NO_PUNCH",
      lateMinutes: 0,
    };
  }

  /**
   * ==========================================================
   * STEP 2
   * ONLY OUT PUNCH
   * ==========================================================
   */

  if (!row.check_in && row.check_out) {
    return {
      status: "In Punch Missing",
      matchedRule: "MISSING_IN_PUNCH",
      lateMinutes: 0,
    };
  }

  /**
   * ==========================================================
   * STEP 3
   * ONLY IN PUNCH
   * ==========================================================
   */

  if (row.check_in && !row.check_out) {
    return {
      status: "Out Punch Missing",
      matchedRule: "MISSING_OUT_PUNCH",
      lateMinutes: 0,
    };
  }

  /**
   * Safety fallback.
   */
  if (!row.check_in || !row.check_out) {
    return {
      status: "Unclassified",
      matchedRule: "INVALID_PUNCH_STATE",
      lateMinutes: 0,
    };
  }

  /**
   * ==========================================================
   * STEP 4
   * SHIFT BOUNDARIES
   * ==========================================================
   */

  const boundaries = getShiftBoundaries(
    shift,
    graceMinutes,
  );

  /**
   * ==========================================================
   * STEP 5
   * NORMALIZE PUNCHES
   * ==========================================================
   */

  const { inSec, outSec } = normalizePunches(
    row.check_in,
    row.check_out,
    shift,
  );

  /**
   * ==========================================================
   * STEP 6
   * INVALID CHECKOUT
   * ==========================================================
   */

  if (outSec < inSec) {
    return {
      status: "Unclassified",
      matchedRule: "ANOMALY_CHECKOUT_BEFORE_CHECKIN",
      lateMinutes: 0,
    };
  }

  /**
   * ==========================================================
   * STEP 7
   * LATE MINUTES
   * ==========================================================
   */

  const lateMinutes = calculateLateMinutes(
    inSec,
    boundaries.start,
  );

  /**
   * ==========================================================
   * STEP 8
   * SHIFT CATEGORY
   * ==========================================================
   */

  // if (SHIFT_CATEGORY === "DURATION") {
  //   return evaluateDurationAttendance(
  //     inSec,
  //     outSec,
  //     boundaries,
  //   );
  // }

  /**
   * ==========================================================
   * FROM HERE:
   *
   * TIME BASED EMPLOYEE
   *
   * Current shift:
   *
   * 10:00 -> 19:00
   *
   * Half:
   *
   * 14:30
   *
   * Grace:
   *
   * 15 minutes
   * ==========================================================
   */

  const start = boundaries.start;
  const end = boundaries.end;
  const half = boundaries.half;
  const grace = boundaries.grace;

  /**
   * ==========================================================
   * RULE 1
   * FULL DAY PRESENT - STRICT
   * ==========================================================
   *
   * Employee arrives at/before 10:00
   * AND
   * leaves at/after 19:00.
   *
   * Example:
   *
   * 09:55 -> 19:00
   * 10:00 -> 19:05
   */
  if (
    inSec <= start &&
    outSec >= end
  ) {
    return {
      status: "Full Day Present",
      matchedRule: "PRESENT_STRICT",
      lateMinutes,
    };
  }

  /**
   * ==========================================================
   * RULE 2
   * FULL DAY PRESENT - WITHIN GRACE + MAKEUP
   * ==========================================================
   *
   * Employee arrives after 10:00,
   * but within 15-minute grace.
   *
   * Their late minutes must be compensated.
   *
   * Example:
   *
   * IN  = 10:05
   * Late = 5
   *
   * Required OUT:
   *
   * 19:00 + 5 = 19:05
   *
   * If OUT = 19:11
   *
   * => Full Day Present
   *
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * This rule MUST happen BEFORE Second Half.
   *
   * Otherwise a normal 10:07 -> 19:10 punch could
   * incorrectly fall into a half-day rule.
   */
  if (
    inSec > start &&
    inSec <= start + grace
  ) {
    const requiredCheckout =
      end + lateMinutes * 60;

    if (outSec >= requiredCheckout) {
      return {
        status: "Full Day Present",
        matchedRule: "PRESENT_GRACE_WITH_MAKEUP",
        lateMinutes,
      };
    }

    /**
     * Employee came within grace but did not compensate.
     *
     * If they did not reach the half boundary,
     * this is absent.
     *
     * Example:
     *
     * 10:10 -> 14:20
     */
    if (outSec < half) {
      return {
        status: "Full Day Absent",
        matchedRule: "ABSENT_LEFT_BEFORE_HALF",
        lateMinutes,
      };
    }
  }

  /**
   * ==========================================================
   * RULE 3
   * FULL DAY ABSENT - LATE ARRIVAL WITHOUT MAKEUP
   * ==========================================================
   *
   * IMPORTANT:
   *
   * This rule applies to employees arriving AFTER GRACE
   * but BEFORE HALF.
   *
   * Example:
   *
   * IN  = 10:49
   * OUT = 19:17
   *
   * Late = 49
   *
   * Required checkout:
   *
   * 19:00 + 49 = 19:49
   *
   * Actual:
   *
   * 19:17
   *
   * => Full Day Absent
   *
   * We deliberately do NOT use worked duration here.
   */
  if (
    inSec > start + grace &&
    inSec < half
  ) {
    const requiredCheckout =
      end + lateMinutes * 60;

    if (outSec >= requiredCheckout) {
      /**
       * If late arrival is compensated completely,
       * employee gets full day.
       */
      return {
        status: "Full Day Present",
        matchedRule: "PRESENT_LATE_WITH_FULL_MAKEUP",
        lateMinutes,
      };
    }

    /**
     * Not compensated.
     *
     * DO NOT classify as First Half merely because
     * worked duration happens to be >= 4.5 hours.
     */
    return {
      status: "Full Day Absent",
      matchedRule: "ABSENT_LATE_NO_MAKEUP",
      lateMinutes,
    };
  }

  /**
   * ==========================================================
   * RULE 4
   * FIRST HALF PRESENT
   * ==========================================================
   *
   * Employee starts in the first half and leaves
   * around/after the half boundary but before shift end.
   *
   * IMPORTANT:
   *
   * We only reach this point after Full Day rules.
   *
   * Example:
   *
   * 10:00 -> 14:30
   * 10:05 -> 14:40
   *
   * => First Half Present
   *
   * But:
   *
   * 10:07 -> 19:10
   *
   * never reaches here because Rule 2 already returns
   * Full Day Present.
   */
  if (
    inSec <= start + grace &&
    outSec >= half &&
    outSec < end
  ) {
    return {
      status: "First Half Present",
      matchedRule: "FIRST_HALF_TIME_BASED",
      lateMinutes,
    };
  }

  /**
   * ==========================================================
   * RULE 5
   * SECOND HALF PRESENT
   * ==========================================================
   *
   * Employee arrives AFTER grace,
   * but BEFORE or AT half shift,
   * and stays until shift end.
   *
   * Example:
   *
   * Shift = 10:00 -> 19:00
   * Half  = 14:30
   *
   * IN  = 13:45
   * OUT = 19:15
   *
   * => Second Half Present
   *
   * Why?
   *
   * They missed the first-half attendance window,
   * but completed the second-half requirement.
   *
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * 10:07 does NOT satisfy this rule because:
   *
   * 10:07 <= 10:15
   *
   * Therefore it belongs to the grace/full-day evaluation.
   *
   * This prevents:
   *
   * 10:07 -> 19:10
   *
   * from becoming Second Half Present.
   */
  if (
    inSec > start + grace &&
    inSec <= half &&
    outSec >= end
  ) {
    return {
      status: "Second Half Present",
      matchedRule: "SECOND_HALF_TIME_BASED",
      lateMinutes,
    };
  }

  /**
   * ==========================================================
   * RULE 6
   * SECOND HALF ARRIVAL
   * ==========================================================
   *
   * Employee arrives after half shift.
   *
   * Example:
   *
   * IN = 14:40
   *
   * Half = 14:30
   *
   * They can be Second Half Present if they stay
   * enough to compensate the second-half lateness.
   */
  if (
    inSec > half
  ) {
    const secondHalfLateSeconds =
      inSec - half;

    const requiredCheckout =
      end + secondHalfLateSeconds;

    /**
     * Within half-shift grace.
     *
     * Example:
     *
     * IN = 14:40
     * OUT = 19:10
     *
     * => Second Half Present
     */
    if (
      inSec <= half + grace &&
      outSec >= requiredCheckout
    ) {
      return {
        status: "Second Half Present",
        matchedRule: "SECOND_HALF_GRACE_WITH_MAKEUP",
        lateMinutes,
      };
    }

    /**
     * Arrived after half and did not compensate.
     */
    return {
      status: "Full Day Absent",
      matchedRule: "ABSENT_SECOND_HALF_LATE_NO_MAKEUP",
      lateMinutes,
    };
  }

  /**
   * ==========================================================
   * FALLBACK
   * ==========================================================
   */

  return {
    status: "Full Day Absent",
    matchedRule: "ABSENT_TIME_RULES_NOT_MET",
    lateMinutes,
  };
}