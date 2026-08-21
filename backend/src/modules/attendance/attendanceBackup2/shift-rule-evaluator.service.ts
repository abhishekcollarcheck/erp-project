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







// import { Shift } from '../../database/models/Shift';
// import { CombinedAttendanceRow } from './attendance-combined.service';

// export type FinalAttendanceStatus =
//   | 'PRESENT'                      // P
//   | 'ABSENT'                       // A
//   | 'PRESENT_MISS_PUNCH'           // P:MP
//   | 'MISS_PUNCH_PRESENT'           // MP:P
//   | 'FIRST_HALF_PRESENT'           // P:A
//   | 'SECOND_HALF_PRESENT'          // A:P
//   | 'WEEK_OFF'                     // WO
//   | 'HOLIDAY'                      // HO
//   | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // MP:POW
//   | 'MISS_PUNCH_PRESENT_HOLIDAY'   // MP:POH
//   | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // P:MPOW
//   | 'PRESENT_MISS_PUNCH_HOLIDAY'   // P:MPOH
//   | 'PRESENT_ON_WEEK_OFF'          // POW
//   | 'PRESENT_ON_HOLIDAY'           // POH
//   | 'ABSENT_ON_WEEK_OFF'           // AOW
//   | 'ABSENT_ON_HOLIDAY'            // AOH
//   | 'FIRST_HALF_PRESENT_WEEK_OFF'  // P:AOW
//   | 'FIRST_HALF_PRESENT_HOLIDAY'   // P:AOH
//   | 'SECOND_HALF_PRESENT_WEEK_OFF' // A:POW
//   | 'SECOND_HALF_PRESENT_HOLIDAY'  // A:POH
//   | 'SHORT_LEAVE_HALF_PRESENT'     // SL(h):P
//   | 'PRESENT_SHORT_LEAVE_HALF'     // P:SL(h)
//   | 'SHORT_LEAVE_FULL_PRESENT'     // SL(f):P
//   | 'PRESENT_SHORT_LEAVE_FULL'     // P:SL(f)
//   | 'CASUAL_LEAVE_PRESENT'         // CL:P
//   | 'EARNED_LEAVE_PRESENT'         // EL:P
//   | 'PRESENT_CASUAL_LEAVE'         // P:CL
//   | 'PRESENT_EARNED_LEAVE'         // P:EL
//   | 'CASUAL_LEAVE_ABSENT'          // CL(A)
//   | 'EARNED_LEAVE_ABSENT'          // EL(A)
//   | 'CASUAL_LEAVE'                 // CL
//   | 'EARNED_LEAVE'                 // EL
//   | 'Unclassified';

// export interface AppliedLeaveDetails {
//   type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
//   position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
//   approved: boolean;
// }

// export interface RuleEvaluationResult {
//   status: FinalAttendanceStatus;
//   matchedRule: string | null;
//   lateMinutes: number;
// }

// interface ShiftBoundariesSeconds {
//   start: number;
//   end: number;
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
// // EVALUATION ENGINE
// // ═══════════════════════════════════════════════════════════════════════
// export function evaluateAttendanceStatus(
//   row: CombinedAttendanceRow,
//   shift: Shift,
//   graceMinutes: number,
//   isWeekOff = false,
//   isHoliday = false,
//   appliedLeave?: AppliedLeaveDetails,
// ): RuleEvaluationResult {
//   // ── 1. LEAVE RULES OVERRIDES (CL / EL) ─────────────────────────────
//   if (appliedLeave && appliedLeave.approved) {
//     if (appliedLeave.type === 'CL') {
//       if (appliedLeave.position === 'FULL_DAY') return { status: 'CASUAL_LEAVE', matchedRule: 'LEAVE_FULL_CL', lateMinutes: 0 };
//       if (appliedLeave.position === 'FIRST_HALF') return { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'LEAVE_HALF_CL_1', lateMinutes: 0 };
//       if (appliedLeave.position === 'SECOND_HALF') return { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'LEAVE_HALF_CL_2', lateMinutes: 0 };
//     }
//     if (appliedLeave.type === 'EL') {
//       if (appliedLeave.position === 'FULL_DAY') return { status: 'EARNED_LEAVE', matchedRule: 'LEAVE_FULL_EL', lateMinutes: 0 };
//       if (appliedLeave.position === 'FIRST_HALF') return { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'LEAVE_HALF_EL_1', lateMinutes: 0 };
//       if (appliedLeave.position === 'SECOND_HALF') return { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'LEAVE_HALF_EL_2', lateMinutes: 0 };
//     }
//   }

//   // ── 2. MISSING PUNCHES (P:MP / MP:P) ─────────────────────────────────
//   if (!row.check_in && !row.check_out) {
//     if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'WO_NO_PUNCH', lateMinutes: 0 };
//     if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'HO_NO_PUNCH', lateMinutes: 0 };
//     return { status: 'ABSENT', matchedRule: 'ABSENT_NO_PUNCH', lateMinutes: 0 };
//   }

//   if (!row.check_in || !row.check_out) {
//     const isOutMissing = !!row.check_in && !row.check_out;
//     if (isWeekOff) {
//       return { status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF', matchedRule: 'MISSING_PUNCH_WO', lateMinutes: 0 };
//     }
//     if (isHoliday) {
//       return { status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY', matchedRule: 'MISSING_PUNCH_HO', lateMinutes: 0 };
//     }
//     return { status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT', matchedRule: 'MISSING_SINGLE_PUNCH', lateMinutes: 0 };
//   }

//   // ── 3. DURATION & BOUNDARY CALCULATION ──────────────────────────────
//   const b = computeShiftBoundaries(shift, graceMinutes);
//   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

//   if (outSec < inSec) {
//     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
//   }

//   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));
//   const lateSec = lateMinutes * 60;
//   const workedSec = outSec - inSec;

//   // ── 4. SHORT LEAVE RULES (SL) ─────────────────────────────────────────
//   if (appliedLeave && appliedLeave.approved) {
//     // 30 Mins Short Leave Morning: SL(h):P
//     if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
//       if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end) {
//         return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'SL_HALF_MORNING', lateMinutes };
//       }
//     }
//     // 30 Mins Short Leave Evening: P:SL(h)
//     if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
//       if (inSec <= b.start + b.graceSec && outSec >= b.end - 1800 && outSec < b.end + lateSec) {
//         return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'SL_HALF_EVENING', lateMinutes };
//       }
//     }
//     // 60 Mins Short Leave Morning: SL(f):P
//     if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
//       if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end) {
//         return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'SL_FULL_MORNING', lateMinutes };
//       }
//     }
//     // 60 Mins Short Leave Evening: P:SL(f)
//     if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
//       if (inSec <= b.start + b.graceSec && outSec >= b.end - 3600 && outSec < b.end + lateSec) {
//         return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'SL_FULL_EVENING', lateMinutes };
//       }
//     }
//   }

//   // ── 5. EVALUATE BASE ATTENDANCE (Present / Half Day / Absent) ───────
//   let baseStatus: 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT' = 'ABSENT';
//   let matchedRule: string | null = null;

//   // Full Day Present Logic
//   if (inSec <= b.start && outSec >= b.end) {
//     baseStatus = 'PRESENT'; matchedRule = 'LOGIC_1_PRESENT_STRICT';
//   } else if (inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
//     baseStatus = 'PRESENT'; matchedRule = 'LOGIC_3_PRESENT_GRACE_MAKEUP';
//   } else if (workedSec >= b.durationSec) {
//     baseStatus = 'PRESENT'; matchedRule = 'LOGIC_4_PRESENT_DURATION';
//   }
//   // First Half Present Logic
//   else if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
//     baseStatus = 'FIRST_HALF_PRESENT'; matchedRule = 'LOGIC_1_FIRST_HALF';
//   } else if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
//     baseStatus = 'FIRST_HALF_PRESENT'; matchedRule = 'LOGIC_2_FIRST_HALF_MAKEUP';
//   } else if (workedSec >= b.halfShift - b.start) {
//     baseStatus = 'FIRST_HALF_PRESENT'; matchedRule = 'LOGIC_3_FIRST_HALF_DURATION';
//   }
//   // Second Half Present Logic
//   else if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
//     baseStatus = 'SECOND_HALF_PRESENT'; matchedRule = 'LOGIC_1_SECOND_HALF';
//   } else if (inSec <= b.halfShift + b.graceSec && inSec > b.start + b.graceSec && outSec >= b.end + lateSec) {
//     baseStatus = 'SECOND_HALF_PRESENT'; matchedRule = 'LOGIC_2_SECOND_HALF_MAKEUP';
//   } else if (workedSec >= b.end - b.halfShift) {
//     baseStatus = 'SECOND_HALF_PRESENT'; matchedRule = 'LOGIC_4_SECOND_HALF_DURATION';
//   }
//   // Absent Logic Fallthrough
//   else {
//     baseStatus = 'ABSENT'; matchedRule = 'ABSENT_FALLTHROUGH';
//   }

//   // ── 6. OVERTIME / WEEK OFF / HOLIDAY MAPPING ─────────────────────────
//   if (isWeekOff) {
//     switch (baseStatus) {
//       case 'PRESENT': return { status: 'PRESENT_ON_WEEK_OFF', matchedRule, lateMinutes };
//       case 'FIRST_HALF_PRESENT': return { status: 'FIRST_HALF_PRESENT_WEEK_OFF', matchedRule, lateMinutes };
//       case 'SECOND_HALF_PRESENT': return { status: 'SECOND_HALF_PRESENT_WEEK_OFF', matchedRule, lateMinutes };
//       case 'ABSENT': default: return { status: 'ABSENT_ON_WEEK_OFF', matchedRule, lateMinutes };
//     }
//   }

//   if (isHoliday) {
//     switch (baseStatus) {
//       case 'PRESENT': return { status: 'PRESENT_ON_HOLIDAY', matchedRule, lateMinutes };
//       case 'FIRST_HALF_PRESENT': return { status: 'FIRST_HALF_PRESENT_HOLIDAY', matchedRule, lateMinutes };
//       case 'SECOND_HALF_PRESENT': return { status: 'SECOND_HALF_PRESENT_HOLIDAY', matchedRule, lateMinutes };
//       case 'ABSENT': default: return { status: 'ABSENT_ON_HOLIDAY', matchedRule, lateMinutes };
//     }
//   }

//   return { status: baseStatus, matchedRule, lateMinutes };
// }




























// import { Shift } from '../../database/models/Shift';
// import { CombinedAttendanceRow } from './attendance-combined.service';

// export type FinalAttendanceStatus =
//   | 'PRESENT'                      // P
//   | 'ABSENT'                       // A
//   | 'PRESENT_MISS_PUNCH'           // P:MP
//   | 'MISS_PUNCH_PRESENT'           // MP:P
//   | 'FIRST_HALF_PRESENT'           // P:A
//   | 'SECOND_HALF_PRESENT'          // A:P
//   | 'WEEK_OFF'                     // WO
//   | 'HOLIDAY'                      // HO
//   | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // MP:POW
//   | 'MISS_PUNCH_PRESENT_HOLIDAY'   // MP:POH
//   | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // P:MPOW
//   | 'PRESENT_MISS_PUNCH_HOLIDAY'   // P:MPOH
//   | 'PRESENT_ON_WEEK_OFF'          // POW
//   | 'PRESENT_ON_HOLIDAY'           // POH
//   | 'ABSENT_ON_WEEK_OFF'           // AOW
//   | 'ABSENT_ON_HOLIDAY'            // AOH
//   | 'FIRST_HALF_PRESENT_WEEK_OFF'  // P:AOW
//   | 'FIRST_HALF_PRESENT_HOLIDAY'   // P:AOH
//   | 'SECOND_HALF_PRESENT_WEEK_OFF' // A:POW
//   | 'SECOND_HALF_PRESENT_HOLIDAY'  // A:POH
//   | 'SHORT_LEAVE_HALF_PRESENT'     // SL(h):P
//   | 'PRESENT_SHORT_LEAVE_HALF'     // P:SL(h)
//   | 'SHORT_LEAVE_FULL_PRESENT'     // SL(f):P
//   | 'PRESENT_SHORT_LEAVE_FULL'     // P:SL(f)
//   | 'CASUAL_LEAVE_PRESENT'         // CL:P
//   | 'EARNED_LEAVE_PRESENT'         // EL:P
//   | 'PRESENT_CASUAL_LEAVE'         // P:CL
//   | 'PRESENT_EARNED_LEAVE'         // P:EL
//   | 'CASUAL_LEAVE_ABSENT'          // CL(A)
//   | 'EARNED_LEAVE_ABSENT'          // EL(A)
//   | 'CASUAL_LEAVE'                 // CL
//   | 'EARNED_LEAVE'                 // EL
//   | 'Unclassified';

// export interface AppliedLeaveDetails {
//   type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
//   position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
//   approved: boolean;
// }

// export interface RuleEvaluationResult {
//   status: FinalAttendanceStatus;
//   matchedRule: string | null;
//   lateMinutes: number;
// }

// interface ShiftBoundariesSeconds {
//   start: number;
//   end: number;
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

//   // Use explicit half-shift time if provided, otherwise compute standard midpoint
//   const halfShift = (shift as any).half_shift_time 
//     ? parseTimeToSeconds((shift as any).half_shift_time) 
//     : start + durationSec / 2;

//   const graceSec = graceMinutes * 60;
//   return { start, end, halfShift, durationSec, graceSec };
// }

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
// // EVALUATION ENGINE
// // ═══════════════════════════════════════════════════════════════════════
// export function evaluateAttendanceStatus(
//   row: CombinedAttendanceRow,
//   shift: Shift,
//   graceMinutes: number,
//   isWeekOff = false,
//   isHoliday = false,
//   appliedLeave?: AppliedLeaveDetails,
// ): RuleEvaluationResult {

//   // ── 1. APPROVED LEAVE OVERRIDES (CL / EL) ───────────────────────────
//   if (appliedLeave && appliedLeave.approved) {
//     if (appliedLeave.type === 'CL') {
//       if (appliedLeave.position === 'FULL_DAY') return { status: 'CASUAL_LEAVE', matchedRule: 'LEAVE_FULL_CL', lateMinutes: 0 };
//       if (appliedLeave.position === 'FIRST_HALF') return { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'LEAVE_HALF_CL_1', lateMinutes: 0 };
//       if (appliedLeave.position === 'SECOND_HALF') return { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'LEAVE_HALF_CL_2', lateMinutes: 0 };
//     }
//     if (appliedLeave.type === 'EL') {
//       if (appliedLeave.position === 'FULL_DAY') return { status: 'EARNED_LEAVE', matchedRule: 'LEAVE_FULL_EL', lateMinutes: 0 };
//       if (appliedLeave.position === 'FIRST_HALF') return { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'LEAVE_HALF_EL_1', lateMinutes: 0 };
//       if (appliedLeave.position === 'SECOND_HALF') return { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'LEAVE_HALF_EL_2', lateMinutes: 0 };
//     }
//   }

//   // ── 2. MISSING PUNCH HANDLING ─────────────────────────────────────────
//   if (!row.check_in && !row.check_out) {
//     if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'WO_NO_PUNCH', lateMinutes: 0 };
//     if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'HO_NO_PUNCH', lateMinutes: 0 };
//     return { status: 'ABSENT', matchedRule: 'ABSENT_NO_PUNCH', lateMinutes: 0 };
//   }

//   if (!row.check_in || !row.check_out) {
//     const isOutMissing = !!row.check_in && !row.check_out;
//     if (isWeekOff) {
//       return { status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF', matchedRule: 'MISSING_PUNCH_WO', lateMinutes: 0 };
//     }
//     if (isHoliday) {
//       return { status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY', matchedRule: 'MISSING_PUNCH_HO', lateMinutes: 0 };
//     }
//     return { status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT', matchedRule: 'MISSING_SINGLE_PUNCH', lateMinutes: 0 };
//   }

//   // ── 3. BOUNDARY CALCULATION ─────────────────────────────────────────
//   const b = computeShiftBoundaries(shift, graceMinutes);
//   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

//   if (outSec < inSec) {
//     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
//   }

//   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));
//   const lateSec = lateMinutes * 60;
//   const workedSec = outSec - inSec;

//   // ── 4. SHORT LEAVE RULES (SL) ─────────────────────────────────────────
//   if (appliedLeave && appliedLeave.approved) {
//     // 30 Mins Short Leave Morning: SL(h):P
//     if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
//       if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end) {
//         return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'SL_HALF_MORNING', lateMinutes };
//       }
//     }
//     // 30 Mins Short Leave Evening: P:SL(h)
//     if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
//       if (inSec <= b.start + b.graceSec && outSec >= b.end - 1800 && outSec < b.end + lateSec) {
//         return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'SL_HALF_EVENING', lateMinutes };
//       }
//     }
//     // 60 Mins Short Leave Morning: SL(f):P
//     if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
//       if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end) {
//         return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'SL_FULL_MORNING', lateMinutes };
//       }
//     }
//     // 60 Mins Short Leave Evening: P:SL(f)
//     if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
//       if (inSec <= b.start + b.graceSec && outSec >= b.end - 3600 && outSec < b.end + lateSec) {
//         return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'SL_FULL_EVENING', lateMinutes };
//       }
//     }
//   }

//   // ── 5. EVALUATE BASE ATTENDANCE ──────────────────────────────────────
//   let baseStatus: 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT' = 'ABSENT';
//   let matchedRule: string | null = null;

//   // ── A. FULL DAY PRESENT (P) ──
//   if (inSec <= b.start && outSec >= b.end) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_1_PRESENT_STRICT';
//   } else if (inSec <= b.start + b.graceSec && outSec >= b.end) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_2_PRESENT_GRACE';
//   } else if (inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_3_PRESENT_GRACE_MAKEUP';
//   } else if (workedSec >= b.durationSec) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_4_PRESENT_DURATION';
//   }

//   // ── B. FIRST HALF PRESENT (P:A) ──
//   else if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
//     baseStatus = 'FIRST_HALF_PRESENT';
//     matchedRule = 'LOGIC_1_FIRST_HALF_STRICT';
//   } else if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
//     baseStatus = 'FIRST_HALF_PRESENT';
//     matchedRule = 'LOGIC_2_FIRST_HALF_GRACE_MAKEUP';
//   } else if (workedSec >= (b.halfShift - b.start)) {
//     baseStatus = 'FIRST_HALF_PRESENT';
//     matchedRule = 'LOGIC_3_FIRST_HALF_DURATION';
//   }

//   // ── C. SECOND HALF PRESENT (A:P) ──
//   else if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
//     baseStatus = 'SECOND_HALF_PRESENT';
//     matchedRule = 'LOGIC_1_SECOND_HALF_STRICT';
//   } else if (inSec <= b.halfShift + b.graceSec && inSec > b.start + b.graceSec && outSec >= b.end + lateSec) {
//     baseStatus = 'SECOND_HALF_PRESENT';
//     matchedRule = 'LOGIC_2_SECOND_HALF_GRACE_MAKEUP';
//   } else if (inSec <= b.halfShift + b.graceSec && outSec < b.end) {
//     baseStatus = 'SECOND_HALF_PRESENT';
//     matchedRule = 'LOGIC_3_SECOND_HALF_EARLY_OUT';
//   } else if (workedSec >= (b.end - b.halfShift)) {
//     baseStatus = 'SECOND_HALF_PRESENT';
//     matchedRule = 'LOGIC_4_SECOND_HALF_DURATION';
//   }

//   // ── D. ABSENT (A) ──
//   else if (inSec > b.start + b.graceSec && outSec < b.end + lateSec) {
//     baseStatus = 'ABSENT';
//     matchedRule = 'LOGIC_1_ABSENT_LATE_NO_MAKEUP';
//   } else if (inSec <= b.start + b.graceSec && outSec < b.halfShift + lateSec) {
//     baseStatus = 'ABSENT';
//     matchedRule = 'LOGIC_2_ABSENT_LEFT_BEFORE_HALF';
//   } else if (inSec > b.halfShift && outSec < b.end + lateSec) {
//     baseStatus = 'ABSENT';
//     matchedRule = 'LOGIC_3_ABSENT_ARRIVED_TOO_LATE';
//   } else {
//     baseStatus = 'ABSENT';
//     matchedRule = 'LOGIC_4_ABSENT_FALLTHROUGH';
//   }

//   // ── 6. OFF-DAY / OVERTIME CONVERSIONS ────────────────────────────────
//   if (isWeekOff) {
//     switch (baseStatus) {
//       case 'PRESENT': return { status: 'PRESENT_ON_WEEK_OFF', matchedRule, lateMinutes };
//       case 'FIRST_HALF_PRESENT': return { status: 'FIRST_HALF_PRESENT_WEEK_OFF', matchedRule, lateMinutes };
//       case 'SECOND_HALF_PRESENT': return { status: 'SECOND_HALF_PRESENT_WEEK_OFF', matchedRule, lateMinutes };
//       case 'ABSENT': default: return { status: 'ABSENT_ON_WEEK_OFF', matchedRule, lateMinutes };
//     }
//   }

//   if (isHoliday) {
//     switch (baseStatus) {
//       case 'PRESENT': return { status: 'PRESENT_ON_HOLIDAY', matchedRule, lateMinutes };
//       case 'FIRST_HALF_PRESENT': return { status: 'FIRST_HALF_PRESENT_HOLIDAY', matchedRule, lateMinutes };
//       case 'SECOND_HALF_PRESENT': return { status: 'SECOND_HALF_PRESENT_HOLIDAY', matchedRule, lateMinutes };
//       case 'ABSENT': default: return { status: 'ABSENT_ON_HOLIDAY', matchedRule, lateMinutes };
//     }
//   }

//   return { status: baseStatus, matchedRule, lateMinutes };
// }



// import { Shift } from '../../database/models/Shift';
// import { CombinedAttendanceRow } from './attendance-combined.service';

// export type FinalAttendanceStatus =
//   | 'PRESENT'                      // P
//   | 'ABSENT'                       // A
//   | 'PRESENT_MISS_PUNCH'           // P:MP
//   | 'MISS_PUNCH_PRESENT'           // MP:P
//   | 'FIRST_HALF_PRESENT'           // P:A
//   | 'SECOND_HALF_PRESENT'          // A:P
//   | 'WEEK_OFF'                     // WO
//   | 'HOLIDAY'                      // HO
//   | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // MP:POW
//   | 'MISS_PUNCH_PRESENT_HOLIDAY'   // MP:POH
//   | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // P:MPOW
//   | 'PRESENT_MISS_PUNCH_HOLIDAY'   // P:MPOH
//   | 'PRESENT_ON_WEEK_OFF'          // POW
//   | 'PRESENT_ON_HOLIDAY'           // POH
//   | 'ABSENT_ON_WEEK_OFF'           // AOW
//   | 'ABSENT_ON_HOLIDAY'            // AOH
//   | 'FIRST_HALF_PRESENT_WEEK_OFF'  // P:AOW
//   | 'FIRST_HALF_PRESENT_HOLIDAY'   // P:AOH
//   | 'SECOND_HALF_PRESENT_WEEK_OFF' // A:POW
//   | 'SECOND_HALF_PRESENT_HOLIDAY'  // A:POH
//   | 'SHORT_LEAVE_HALF_PRESENT'     // SL(h):P
//   | 'PRESENT_SHORT_LEAVE_HALF'     // P:SL(h)
//   | 'SHORT_LEAVE_FULL_PRESENT'     // SL(f):P
//   | 'PRESENT_SHORT_LEAVE_FULL'     // P:SL(f)
//   | 'CASUAL_LEAVE_PRESENT'         // CL:P
//   | 'EARNED_LEAVE_PRESENT'         // EL:P
//   | 'PRESENT_CASUAL_LEAVE'         // P:CL
//   | 'PRESENT_EARNED_LEAVE'         // P:EL
//   | 'CASUAL_LEAVE_ABSENT'          // CL(A)
//   | 'EARNED_LEAVE_ABSENT'          // EL(A)
//   | 'CASUAL_LEAVE'                 // CL
//   | 'EARNED_LEAVE'                 // EL
//   | 'Unclassified';

// export interface AppliedLeaveDetails {
//   type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
//   position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
//   approved: boolean;
// }

// export interface RuleEvaluationResult {
//   status: FinalAttendanceStatus;
//   matchedRule: string | null;
//   lateMinutes: number;
// }

// interface ShiftBoundariesSeconds {
//   start: number;
//   end: number;
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

//   const halfShift = (shift as any).half_shift_time 
//     ? parseTimeToSeconds((shift as any).half_shift_time) 
//     : start + durationSec / 2;

//   const graceSec = graceMinutes * 60;
//   return { start, end, halfShift, durationSec, graceSec };
// }

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
// // EVALUATION ENGINE
// // ═══════════════════════════════════════════════════════════════════════
// export function evaluateAttendanceStatus(
//   row: CombinedAttendanceRow,
//   shift: Shift,
//   graceMinutes: number = 15,
//   isWeekOff = false,
//   isHoliday = false,
//   appliedLeave?: AppliedLeaveDetails,
// ): RuleEvaluationResult {

//   // ── 1. APPROVED LEAVE OVERRIDES (CL / EL) ───────────────────────────
//   if (appliedLeave && appliedLeave.approved) {
//     if (appliedLeave.type === 'CL') {
//       if (appliedLeave.position === 'FULL_DAY') return { status: 'CASUAL_LEAVE', matchedRule: 'LEAVE_FULL_CL', lateMinutes: 0 };
//       if (appliedLeave.position === 'FIRST_HALF') return { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'LEAVE_HALF_CL_1', lateMinutes: 0 };
//       if (appliedLeave.position === 'SECOND_HALF') return { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'LEAVE_HALF_CL_2', lateMinutes: 0 };
//     }
//     if (appliedLeave.type === 'EL') {
//       if (appliedLeave.position === 'FULL_DAY') return { status: 'EARNED_LEAVE', matchedRule: 'LEAVE_FULL_EL', lateMinutes: 0 };
//       if (appliedLeave.position === 'FIRST_HALF') return { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'LEAVE_HALF_EL_1', lateMinutes: 0 };
//       if (appliedLeave.position === 'SECOND_HALF') return { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'LEAVE_HALF_EL_2', lateMinutes: 0 };
//     }
//   }

//   // ── 2. MISSING PUNCH HANDLING ─────────────────────────────────────────
//   if (!row.check_in && !row.check_out) {
//     if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'WO_NO_PUNCH', lateMinutes: 0 };
//     if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'HO_NO_PUNCH', lateMinutes: 0 };
//     return { status: 'ABSENT', matchedRule: 'ABSENT_NO_PUNCH', lateMinutes: 0 };
//   }

//   if (!row.check_in || !row.check_out) {
//     const isOutMissing = !!row.check_in && !row.check_out;
//     if (isWeekOff) {
//       return { status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF', matchedRule: 'MISSING_PUNCH_WO', lateMinutes: 0 };
//     }
//     if (isHoliday) {
//       return { status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY', matchedRule: 'MISSING_PUNCH_HO', lateMinutes: 0 };
//     }
//     return { status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT', matchedRule: 'MISSING_SINGLE_PUNCH', lateMinutes: 0 };
//   }

//   // ── 3. BOUNDARY CALCULATION ─────────────────────────────────────────
//   const b = computeShiftBoundaries(shift, graceMinutes);
//   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

//   if (outSec < inSec) {
//     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
//   }

//   // Late minutes measured against standard shift start (e.g., 10:00 AM)
//   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));
//   const lateSec = lateMinutes * 60;
//   const workedSec = outSec - inSec;

//   // ── 4. SHORT LEAVE RULES (SL) ─────────────────────────────────────────
//   if (appliedLeave && appliedLeave.approved) {
//     if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
//       if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end + lateSec) {
//         return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'SL_HALF_MORNING', lateMinutes };
//       }
//     }
//     if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
//       if (inSec <= b.start + b.graceSec && outSec >= b.end - 1800) {
//         return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'SL_HALF_EVENING', lateMinutes };
//       }
//     }
//     if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
//       if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end + lateSec) {
//         return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'SL_FULL_MORNING', lateMinutes };
//       }
//     }
//     if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
//       if (inSec <= b.start + b.graceSec && outSec >= b.end - 3600) {
//         return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'SL_FULL_EVENING', lateMinutes };
//       }
//     }
//   }

//   // ── 5. EVALUATE BASE ATTENDANCE ──────────────────────────────────────
//   let baseStatus: 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT' = 'ABSENT';
//   let matchedRule: string | null = null;

//   // ── A. FULL DAY PRESENT (P) ──
//   // Rule 1: On-time check in (<= 10:00) and stayed till shift end (>= 19:00)
//   if (inSec <= b.start && outSec >= b.end) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_1_PRESENT_STRICT';
//   } 
//   // Rule 2: Checked in within grace window (10:00 - 10:15) AND made up late time at checkout (e.g., 10:10 -> stayed till >= 19:10)
//   else if (inSec > b.start && inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_2_PRESENT_GRACE_MAKEUP';
//   } 
//   // Rule 3: Any check-in time as long as total shift duration requirement is satisfied
//   else if (workedSec >= b.durationSec) {
//     baseStatus = 'PRESENT';
//     matchedRule = 'LOGIC_3_PRESENT_DURATION';
//   }

//   // ── B. FIRST HALF PRESENT (P:A) ──
//   else if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
//     baseStatus = 'FIRST_HALF_PRESENT';
//     matchedRule = 'LOGIC_1_FIRST_HALF_STRICT';
//   } else if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
//     baseStatus = 'FIRST_HALF_PRESENT';
//     matchedRule = 'LOGIC_2_FIRST_HALF_GRACE_MAKEUP';
//   }

//   // ── C. SECOND HALF PRESENT (A:P) ──
//   else if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end + lateSec) {
//     baseStatus = 'SECOND_HALF_PRESENT';
//     matchedRule = 'LOGIC_1_SECOND_HALF_MAKEUP';
//   }

//   // ── D. ABSENT (A) ──
//   // Rule: Entered within grace period or late, but left early before making up the late time -> FULL ABSENT
//   else if (inSec > b.start && outSec < b.end + lateSec) {
//     baseStatus = 'ABSENT';
//     matchedRule = 'LOGIC_ABSENT_LATE_NO_MAKEUP';
//   } else {
//     baseStatus = 'ABSENT';
//     matchedRule = 'LOGIC_ABSENT_FALLTHROUGH';
//   }

//   // ── 6. OFF-DAY / OVERTIME CONVERSIONS ────────────────────────────────
//   if (isWeekOff) {
//     switch (baseStatus) {
//       case 'PRESENT': return { status: 'PRESENT_ON_WEEK_OFF', matchedRule, lateMinutes };
//       case 'FIRST_HALF_PRESENT': return { status: 'FIRST_HALF_PRESENT_WEEK_OFF', matchedRule, lateMinutes };
//       case 'SECOND_HALF_PRESENT': return { status: 'SECOND_HALF_PRESENT_WEEK_OFF', matchedRule, lateMinutes };
//       case 'ABSENT': default: return { status: 'ABSENT_ON_WEEK_OFF', matchedRule, lateMinutes };
//     }
//   }

//   if (isHoliday) {
//     switch (baseStatus) {
//       case 'PRESENT': return { status: 'PRESENT_ON_HOLIDAY', matchedRule, lateMinutes };
//       case 'FIRST_HALF_PRESENT': return { status: 'FIRST_HALF_PRESENT_HOLIDAY', matchedRule, lateMinutes };
//       case 'SECOND_HALF_PRESENT': return { status: 'SECOND_HALF_PRESENT_HOLIDAY', matchedRule, lateMinutes };
//       case 'ABSENT': default: return { status: 'ABSENT_ON_HOLIDAY', matchedRule, lateMinutes };
//     }
//   }

//   return { status: baseStatus, matchedRule, lateMinutes };
// }















// ********************************* last most Updated Backup *******************************



// // import { Shift } from '../database/models/Shift';
// import { Shift } from '../../database/models/Shift';
// import { CombinedAttendanceRow } from './attendance-combined.service';

// // ═══════════════════════════════════════════════════════════════════════
// // TYPES
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Every code below is annotated with the row number of the source rules
//  * sheet ("Abbreviations" tab) so the mapping between spec <-> code is
//  * always traceable.
//  */
// export type FinalAttendanceStatus =
//   | 'PRESENT'                      // Row 4  - P
//   | 'ABSENT'                       // Row 5  - A
//   | 'PRESENT_MISS_PUNCH'           // Row 2  - P:MP
//   | 'MISS_PUNCH_PRESENT'           // Row 3  - MP:P
//   | 'FIRST_HALF_PRESENT'           // Row 6  - P:A
//   | 'SECOND_HALF_PRESENT'          // Row 7  - A:P
//   | 'WEEK_OFF'                     // Row 8  - WO
//   | 'HOLIDAY'                      // Row 9  - HO
//   | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // Row 10 - MP:POW
//   | 'MISS_PUNCH_PRESENT_HOLIDAY'   // Row 11 - MP:POH
//   | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // Row 12 - P:MPOW
//   | 'PRESENT_MISS_PUNCH_HOLIDAY'   // Row 13 - P:MPOH
//   | 'PRESENT_ON_WEEK_OFF'          // Row 14 - POW
//   | 'PRESENT_ON_HOLIDAY'           // Row 15 - POH
//   | 'ABSENT_ON_WEEK_OFF'           // Row 16 - AOW
//   | 'ABSENT_ON_HOLIDAY'            // Row 17 - AOH
//   | 'FIRST_HALF_PRESENT_WEEK_OFF'  // Row 18 - P:AOW
//   | 'FIRST_HALF_PRESENT_HOLIDAY'   // Row 19 - P:AOH
//   | 'SECOND_HALF_PRESENT_WEEK_OFF' // Row 20 - A:POW
//   | 'SECOND_HALF_PRESENT_HOLIDAY'  // Row 21 - A:POH
//   | 'SHORT_LEAVE_HALF_PRESENT'     // Row 22 - SL(h):P
//   | 'PRESENT_SHORT_LEAVE_HALF'     // Row 23 - P:SL(h)
//   | 'SHORT_LEAVE_FULL_PRESENT'     // Row 24 - SL(f):P
//   | 'PRESENT_SHORT_LEAVE_FULL'     // Row 25 - P:SL(f)
//   | 'CASUAL_LEAVE_PRESENT'         // Row 26 - CL:P
//   | 'EARNED_LEAVE_PRESENT'         // Row 27 - EL:P
//   | 'PRESENT_CASUAL_LEAVE'         // Row 28 - P:CL
//   | 'PRESENT_EARNED_LEAVE'         // Row 29 - P:EL
//   | 'CASUAL_LEAVE_ABSENT'          // Row 30 - CL(A)
//   | 'EARNED_LEAVE_ABSENT'          // Row 31 - EL(A)
//   | 'CASUAL_LEAVE'                 // Row 32 - CL
//   | 'EARNED_LEAVE'                 // Row 33 - EL
//   | 'Unclassified';

// /** The subset of statuses that can come purely out of punch data, before any leave is layered on top. */
// type BaseAttendanceStatus = 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT';

// export interface AppliedLeaveDetails {
//   type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
//   position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
//   approved: boolean;
// }

// export interface RuleEvaluationResult {
//   status: FinalAttendanceStatus;
//   matchedRule: string | null;
//   lateMinutes: number;
// }

// export interface AttendanceEvaluationOptions {
//   /** Minutes an employee may check in after shift start without being marked late. Default 15. */
//   graceMinutes?: number;
//   isWeekOff?: boolean;
//   isHoliday?: boolean;
//   /** Approved leave (short leave / CL / EL) applicable to this employee on this date, if any. */
//   appliedLeave?: AppliedLeaveDetails;
//   /**
//    * Remaining CL/EL balance (in days) available to the employee for appliedLeave.type,
//    * AFTER subtracting already-used and already-pending leave for the year.
//    * Only consulted when appliedLeave.type is 'CL' or 'EL'. Ignored otherwise.
//    */
//   availableLeaveDays?: number;
// }

// interface ShiftBoundariesSeconds {
//   start: number;
//   end: number;
//   halfShift: number;
//   durationSec: number;
//   graceSec: number;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // TIME HELPERS
// // ═══════════════════════════════════════════════════════════════════════

// function parseTimeToSeconds(time: string): number {
//   const [h, m, s] = time.split(':').map(Number);
//   return h * 3600 + m * 60 + (s || 0);
// }

// function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesSeconds {
//   const start = parseTimeToSeconds(shift.start_time);
//   const durationSec = shift.duration_minutes * 60;
//   const end = shift.crosses_midnight ? start + durationSec : parseTimeToSeconds(shift.end_time);

//   // NOTE: `half_shift_time` is not yet a first-class column on the Shift model.
//   // Until it is added, we derive the midpoint automatically so the engine still
//   // works for any shift length/duration, not just the 9-hour example in the sheet.
//   const halfShift = (shift as any).half_shift_time
//     ? parseTimeToSeconds((shift as any).half_shift_time)
//     : start + durationSec / 2;

//   const graceSec = graceMinutes * 60;
//   return { start, end, halfShift, durationSec, graceSec };
// }

// function normalizePunchSeconds(checkIn: string, checkOut: string, shift: Shift): { inSec: number; outSec: number } {
//   const inSec = parseTimeToSeconds(checkIn);
//   let outSec = parseTimeToSeconds(checkOut);
//   if (shift.crosses_midnight && outSec < inSec) {
//     outSec += 86400;
//   }
//   return { inSec, outSec };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION A — BASE (PUNCH-ONLY) ATTENDANCE
// // Rows 4-7: P, A, P:A, A:P
// // This must be computed BEFORE any leave is considered, because several
// // leave conversions (rows 26-31) are only valid if the underlying punch
// // pattern already matches a specific base status.
// // ═══════════════════════════════════════════════════════════════════════

// function computeBaseAttendance(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
// ): { baseStatus: BaseAttendanceStatus; matchedRule: string } {
//   const lateSec = lateMinutes * 60;
//   const workedSec = outSec - inSec;

//   // ── P — FULL DAY PRESENT (Row 4) ──
//   // Logic 1: on-time in, stayed till shift end.
//   if (inSec <= b.start && outSec >= b.end) {
//     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC1_STRICT' };
//   }
//   // Logic 2/3: checked in inside the grace window AND made up the late
//   // minutes on checkout (e.g. in at 10:07 -> must stay till >= 19:07).
//   if (inSec > b.start && inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
//     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC2_GRACE_MAKEUP' };
//   }
//   // Logic 4: pure duration fallback, regardless of exact in/out alignment.
//   if (workedSec >= b.durationSec) {
//     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC4_DURATION' };
//   }

//   // ── P:A — FIRST HALF PRESENT (Row 6) ──
//   if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
//     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC1_STRICT' };
//   }
//   if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
//     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC2_GRACE_MAKEUP' };
//   }
//   if (inSec <= b.start + b.graceSec && outSec < b.end && workedSec >= b.halfShift - b.start) {
//     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC3_DURATION' };
//   }

//   // ── A:P — SECOND HALF PRESENT (Row 7) ──
//   if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end + lateSec) {
//     return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC1_2_MAKEUP' };
//   }
//   if (inSec > b.start + b.graceSec && workedSec >= b.end - b.halfShift) {
//     // Duration fallback: worked at least "second half"'s worth of hours,
//     // even if the exact clock alignment didn't satisfy Logic 1/2.
//     return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC4_DURATION' };
//   }

//   // ── A — ABSENT (Row 5) — fallthrough for every other pattern ──
//   return { baseStatus: 'ABSENT', matchedRule: 'ROW5_ABSENT_FALLTHROUGH' };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION B — OFF-DAY ATTENDANCE (employee punched in on a Week Off / Holiday)
// // Rows 14-21: POW, POH, AOW, AOH, P:AOW, P:AOH, A:POW, A:POH
// // These are evaluated purely on hours worked, NOT on shift-start lateness,
// // because nobody is "late" on a day they weren't scheduled to work.
// // ═══════════════════════════════════════════════════════════════════════

// function evaluateOffDayAttendance(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   kind: 'WEEK_OFF' | 'HOLIDAY',
// ): RuleEvaluationResult {
//   const workedSec = outSec - inSec;
//   const fullThreshold = b.durationSec;     // e.g. 9h for a 9h shift
//   const halfThreshold = b.durationSec / 2; // e.g. 4.5h

//   if (workedSec >= fullThreshold) {
//     return {
//       status: kind === 'WEEK_OFF' ? 'PRESENT_ON_WEEK_OFF' : 'PRESENT_ON_HOLIDAY',
//       matchedRule: kind === 'WEEK_OFF' ? 'ROW14_POW_FULL_DURATION' : 'ROW15_POH_FULL_DURATION',
//       lateMinutes: 0,
//     };
//   }
//   if (workedSec < halfThreshold) {
//     return {
//       status: kind === 'WEEK_OFF' ? 'ABSENT_ON_WEEK_OFF' : 'ABSENT_ON_HOLIDAY',
//       matchedRule: kind === 'WEEK_OFF' ? 'ROW16_AOW_SHORT_DURATION' : 'ROW17_AOH_SHORT_DURATION',
//       lateMinutes: 0,
//     };
//   }
//   // Between half and full duration: which half did they cover?
//   if (inSec < b.halfShift) {
//     return {
//       status: kind === 'WEEK_OFF' ? 'FIRST_HALF_PRESENT_WEEK_OFF' : 'FIRST_HALF_PRESENT_HOLIDAY',
//       matchedRule: kind === 'WEEK_OFF' ? 'ROW18_P_AOW' : 'ROW19_P_AOH',
//       lateMinutes: 0,
//     };
//   }
//   return {
//     status: kind === 'WEEK_OFF' ? 'SECOND_HALF_PRESENT_WEEK_OFF' : 'SECOND_HALF_PRESENT_HOLIDAY',
//     matchedRule: kind === 'WEEK_OFF' ? 'ROW20_A_POW' : 'ROW21_A_POH',
//     lateMinutes: 0,
//   };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION C — SHORT LEAVE OVERRIDES
// // Rows 22-25: SL(h):P, P:SL(h), SL(f):P, P:SL(f)
// // A short leave "buys back" 30 or 60 minutes of lateness/early-departure.
// // ═══════════════════════════════════════════════════════════════════════

// function evaluateShortLeaveOverride(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
//   appliedLeave: AppliedLeaveDetails,
// ): { status: FinalAttendanceStatus; matchedRule: string } | null {
//   const lateSec = lateMinutes * 60;

//   // ── SL(h):P — 30-min short leave covering a LATE ARRIVAL (Row 22) ──
//   if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
//     if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end) {
//       return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'ROW22_SL_HALF_MORNING' };
//     }
//   }

//   // ── P:SL(h) — 30-min short leave covering an EARLY DEPARTURE (Row 23) ──
//   if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
//     // On-time arrival, left up to 30 minutes early.
//     if (inSec <= b.start && outSec >= b.end - 1800 && outSec < b.end) {
//       return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_ONTIME' };
//     }
//     // Arrived within grace: the 30-minute window shifts by the late minutes too.
//     if (
//       inSec > b.start &&
//       inSec <= b.start + b.graceSec &&
//       outSec >= b.end - 1800 + lateSec &&
//       outSec < b.end + lateSec
//     ) {
//       return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_GRACE' };
//     }
//   }

//   // ── SL(f):P — 60-min short leave covering a LATE ARRIVAL (Row 24) ──
//   if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
//     if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end) {
//       return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'ROW24_SL_FULL_MORNING' };
//     }
//   }

//   // ── P:SL(f) — 60-min short leave covering an EARLY DEPARTURE (Row 25) ──
//   if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
//     if (inSec <= b.start && outSec >= b.end - 3600 && outSec < b.end) {
//       return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_ONTIME' };
//     }
//     if (
//       inSec > b.start &&
//       inSec <= b.start + b.graceSec &&
//       outSec >= b.end - 3600 + lateSec &&
//       outSec < b.end + lateSec
//     ) {
//       return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_GRACE' };
//     }
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION D — CASUAL / EARNED LEAVE CONVERSIONS
// // Rows 26-33: CL:P, EL:P, P:CL, P:EL, CL(A), EL(A), CL, EL
// //
// // Half-day conversions (rows 26-29) REQUIRE the punch-only base status to
// // already show the matching half present — leave cannot manufacture a
// // punch that was never recorded:
// //   CL:P / EL:P  -> base status must be A:P (SECOND_HALF_PRESENT), leave covers 1st half
// //   P:CL / P:EL  -> base status must be P:A (FIRST_HALF_PRESENT), leave covers 2nd half
// //
// // Full-day conversions (rows 30-33) apply on top of a fully ABSENT day:
// //   balance >= 1 day   -> CL / EL   (full day covered)
// //   0.5 <= balance < 1  -> CL(A) / EL(A) (only a half day's worth of balance available)
// //   balance < 0.5       -> leave cannot be granted, day remains ABSENT
// // ═══════════════════════════════════════════════════════════════════════

// function evaluateLeaveConversion(
//   baseStatus: BaseAttendanceStatus,
//   appliedLeave: AppliedLeaveDetails,
//   availableLeaveDays: number,
// ): { status: FinalAttendanceStatus; matchedRule: string } | null {
//   const isCL = appliedLeave.type === 'CL';
//   const isEL = appliedLeave.type === 'EL';
//   if (!isCL && !isEL) return null;

//   // ── Row 26 / 27 — CL:P / EL:P ──
//   if (appliedLeave.position === 'FIRST_HALF' && baseStatus === 'SECOND_HALF_PRESENT' && availableLeaveDays >= 0.5) {
//     return isCL
//       ? { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'ROW26_CL_P_ORIGINAL_AP' }
//       : { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'ROW27_EL_P_ORIGINAL_AP' };
//   }

//   // ── Row 28 / 29 — P:CL / P:EL ──
//   if (appliedLeave.position === 'SECOND_HALF' && baseStatus === 'FIRST_HALF_PRESENT' && availableLeaveDays >= 0.5) {
//     return isCL
//       ? { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'ROW28_P_CL_ORIGINAL_PA' }
//       : { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'ROW29_P_EL_ORIGINAL_PA' };
//   }

//   if (baseStatus !== 'ABSENT') return null;

//   // ── Row 32 / 33 — CL / EL (full day, sufficient balance) ──
//   if (appliedLeave.position === 'FULL_DAY') {
//     if (availableLeaveDays >= 1) {
//       return isCL
//         ? { status: 'CASUAL_LEAVE', matchedRule: 'ROW32_CL_FULL_SUFFICIENT_BALANCE' }
//         : { status: 'EARNED_LEAVE', matchedRule: 'ROW33_EL_FULL_SUFFICIENT_BALANCE' };
//     }
//     // ── Row 30 / 31 — CL(A) / EL(A) (full day requested, only half-day balance left) ──
//     if (availableLeaveDays >= 0.5) {
//       return isCL
//         ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_DOWNGRADED_HALF_BALANCE' }
//         : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_DOWNGRADED_HALF_BALANCE' };
//     }
//     return null; // balance < 0.5 -> cannot grant, stays ABSENT
//   }

//   // ── Row 30 / 31 — CL(A) / EL(A) (explicitly applied for only one half of a fully-absent day) ──
//   if ((appliedLeave.position === 'FIRST_HALF' || appliedLeave.position === 'SECOND_HALF') && availableLeaveDays >= 0.5) {
//     return isCL
//       ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_HALF_ON_FULL_ABSENT' }
//       : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_HALF_ON_FULL_ABSENT' };
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // MAIN EVALUATION ENGINE
// // ═══════════════════════════════════════════════════════════════════════

// export function evaluateAttendanceStatus(
//   row: CombinedAttendanceRow,
//   shift: Shift,
//   options: AttendanceEvaluationOptions = {},
// ): RuleEvaluationResult {
//   const {
//     graceMinutes = 15,
//     isWeekOff = false,
//     isHoliday = false,
//     appliedLeave,
//     availableLeaveDays = 0,
//   } = options;

//   // ── 1. MISSING BOTH PUNCHES ──
//   // if (!row.check_in && !row.check_out) {
//   //   if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'ROW8_WO_NO_PUNCH', lateMinutes: 0 };
//   //   if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'ROW9_HO_NO_PUNCH', lateMinutes: 0 };
//   //   return { status: 'ABSENT', matchedRule: 'ROW5_ABSENT_NO_PUNCH', lateMinutes: 0 };
//   // }


//   // ── 1. MISSING BOTH PUNCHES ──
//   if (!row.check_in && !row.check_out) {
//     if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'ROW8_WO_NO_PUNCH', lateMinutes: 0 };
//     if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'ROW9_HO_NO_PUNCH', lateMinutes: 0 };

//     // An employee with zero punches and an approved full-day (or
//     // half-day-on-a-fully-absent-day) CL/EL leave should NOT be
//     // reported as ABSENT — check the leave first. This reuses the
//     // same balance logic as the punched-day leave conversion
//     // (Rows 30-33), just fed baseStatus='ABSENT' directly since
//     // there's no punch data to derive a base status from.
//     if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
//       const leaveResult = evaluateLeaveConversion('ABSENT', appliedLeave, availableLeaveDays);
//       if (leaveResult) {
//         return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes: 0 };
//       }
//     }

//     return { status: 'ABSENT', matchedRule: 'ROW5_ABSENT_NO_PUNCH', lateMinutes: 0 };
//   }

//   // ── 2. MISSING A SINGLE PUNCH (Rows 2, 3, 10-13) ──
//   if (!row.check_in || !row.check_out) {
//     const isOutMissing = !!row.check_in && !row.check_out;
//     if (isWeekOff) {
//       return {
//         status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF',
//         matchedRule: isOutMissing ? 'ROW12_P_MPOW' : 'ROW10_MP_POW',
//         lateMinutes: 0,
//       };
//     }
//     if (isHoliday) {
//       return {
//         status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY',
//         matchedRule: isOutMissing ? 'ROW13_P_MPOH' : 'ROW11_MP_POH',
//         lateMinutes: 0,
//       };
//     }
//     return {
//       status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT',
//       matchedRule: isOutMissing ? 'ROW2_P_MP' : 'ROW3_MP_P',
//       lateMinutes: 0,
//     };
//   }

//   // ── 3. BOUNDARY / PUNCH NORMALIZATION ──
//   const b = computeShiftBoundaries(shift, graceMinutes);
//   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

//   if (outSec < inSec) {
//     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
//   }

//   // Late minutes are always measured against the standard shift start time.
//   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));

//   // ── 4. OFF-DAY PATH (Week Off / Holiday with punches present) ──
//   // Evaluated purely on hours worked — lateness rules don't apply to a day
//   // the employee wasn't scheduled to work.
//   if (isWeekOff) return evaluateOffDayAttendance(inSec, outSec, b, 'WEEK_OFF');
//   if (isHoliday) return evaluateOffDayAttendance(inSec, outSec, b, 'HOLIDAY');

//   // ── 5. NORMAL WORKING DAY — SHORT LEAVE OVERRIDE FIRST (Rows 22-25) ──
//   if (appliedLeave?.approved && (appliedLeave.type === 'SL_HALF' || appliedLeave.type === 'SL_FULL')) {
//     const shortLeaveResult = evaluateShortLeaveOverride(inSec, outSec, b, lateMinutes, appliedLeave);
//     if (shortLeaveResult) {
//       return { status: shortLeaveResult.status, matchedRule: shortLeaveResult.matchedRule, lateMinutes };
//     }
//   }

//   // ── 6. BASE ATTENDANCE FROM PUNCHES (Rows 4-7) ──
//   const { baseStatus, matchedRule } = computeBaseAttendance(inSec, outSec, b, lateMinutes);

//   // ── 7. CASUAL / EARNED LEAVE CONVERSION (Rows 26-33) ──
//   if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
//     const leaveResult = evaluateLeaveConversion(baseStatus, appliedLeave, availableLeaveDays);
//     if (leaveResult) {
//       return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes };
//     }
//   }

//   // ── 8. NO OVERRIDE APPLIED — RETURN PUNCH-ONLY STATUS ──
//   return { status: baseStatus, matchedRule, lateMinutes };
// }


// import { Shift } from '../database/models/Shift';
// import { Shift } from '../../database/models/Shift';
// import { CombinedAttendanceRow } from './attendance-combined.service';

// // ═══════════════════════════════════════════════════════════════════════
// // TYPES
// // ═══════════════════════════════════════════════════════════════════════

// /**
//  * Every code below is annotated with the row number of the source rules
//  * sheet ("Abbreviations" tab) so the mapping between spec <-> code is
//  * always traceable.
//  */
// export type FinalAttendanceStatus =
//   | 'PRESENT'                      // Row 4  - P
//   | 'ABSENT'                       // Row 5  - A
//   | 'PRESENT_MISS_PUNCH'           // Row 2  - P:MP
//   | 'MISS_PUNCH_PRESENT'           // Row 3  - MP:P
//   | 'FIRST_HALF_PRESENT'           // Row 6  - P:A
//   | 'SECOND_HALF_PRESENT'          // Row 7  - A:P
//   | 'WEEK_OFF'                     // Row 8  - WO
//   | 'HOLIDAY'                      // Row 9  - HO
//   | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // Row 10 - MP:POW
//   | 'MISS_PUNCH_PRESENT_HOLIDAY'   // Row 11 - MP:POH
//   | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // Row 12 - P:MPOW
//   | 'PRESENT_MISS_PUNCH_HOLIDAY'   // Row 13 - P:MPOH
//   | 'PRESENT_ON_WEEK_OFF'          // Row 14 - POW
//   | 'PRESENT_ON_HOLIDAY'           // Row 15 - POH
//   | 'ABSENT_ON_WEEK_OFF'           // Row 16 - AOW
//   | 'ABSENT_ON_HOLIDAY'            // Row 17 - AOH
//   | 'FIRST_HALF_PRESENT_WEEK_OFF'  // Row 18 - P:AOW
//   | 'FIRST_HALF_PRESENT_HOLIDAY'   // Row 19 - P:AOH
//   | 'SECOND_HALF_PRESENT_WEEK_OFF' // Row 20 - A:POW
//   | 'SECOND_HALF_PRESENT_HOLIDAY'  // Row 21 - A:POH
//   | 'SHORT_LEAVE_HALF_PRESENT'     // Row 22 - SL(h):P
//   | 'PRESENT_SHORT_LEAVE_HALF'     // Row 23 - P:SL(h)
//   | 'SHORT_LEAVE_FULL_PRESENT'     // Row 24 - SL(f):P
//   | 'PRESENT_SHORT_LEAVE_FULL'     // Row 25 - P:SL(f)
//   | 'CASUAL_LEAVE_PRESENT'         // Row 26 - CL:P
//   | 'EARNED_LEAVE_PRESENT'         // Row 27 - EL:P
//   | 'PRESENT_CASUAL_LEAVE'         // Row 28 - P:CL
//   | 'PRESENT_EARNED_LEAVE'         // Row 29 - P:EL
//   | 'CASUAL_LEAVE_ABSENT'          // Row 30 - CL(A)
//   | 'EARNED_LEAVE_ABSENT'          // Row 31 - EL(A)
//   | 'CASUAL_LEAVE'                 // Row 32 - CL
//   | 'EARNED_LEAVE'                 // Row 33 - EL
//   | 'Unclassified';

// /** The subset of statuses that can come purely out of punch data, before any leave is layered on top. */
// type BaseAttendanceStatus = 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT';

// export interface AppliedLeaveDetails {
//   type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
//   position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
//   approved: boolean;
// }

// export interface RuleEvaluationResult {
//   status: FinalAttendanceStatus;
//   matchedRule: string | null;
//   lateMinutes: number;
// }

// export interface AttendanceEvaluationOptions {
//   /** Minutes an employee may check in after shift start without being marked late. Default 15. */
//   graceMinutes?: number;
//   isWeekOff?: boolean;
//   isHoliday?: boolean;
//   /** Approved leave (short leave / CL / EL) applicable to this employee on this date, if any. */
//   appliedLeave?: AppliedLeaveDetails;
//   /**
//    * Remaining CL/EL balance (in days) available to the employee for appliedLeave.type,
//    * AFTER subtracting already-used and already-pending leave for the year.
//    * Only consulted when appliedLeave.type is 'CL' or 'EL'. Ignored otherwise.
//    */
//   availableLeaveDays?: number;
// }

// interface ShiftBoundariesSeconds {
//   start: number;
//   end: number;
//   halfShift: number;
//   durationSec: number;
//   graceSec: number;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // TIME HELPERS
// // ═══════════════════════════════════════════════════════════════════════

// function parseTimeToSeconds(time: string): number {
//   const [h, m, s] = time.split(':').map(Number);
//   return h * 3600 + m * 60 + (s || 0);
// }

// function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesSeconds {
//   const start = parseTimeToSeconds(shift.start_time);
//   const durationSec = shift.duration_minutes * 60;
//   const end = shift.crosses_midnight ? start + durationSec : parseTimeToSeconds(shift.end_time);

//   // NOTE: `half_shift_time` is not yet a first-class column on the Shift model.
//   // Until it is added, we derive the midpoint automatically so the engine still
//   // works for any shift length/duration, not just the 9-hour example in the sheet.
//   const halfShift = (shift as any).half_shift_time
//     ? parseTimeToSeconds((shift as any).half_shift_time)
//     : start + durationSec / 2;

//   const graceSec = graceMinutes * 60;
//   return { start, end, halfShift, durationSec, graceSec };
// }

// function normalizePunchSeconds(checkIn: string, checkOut: string, shift: Shift): { inSec: number; outSec: number } {
//   const inSec = parseTimeToSeconds(checkIn);
//   let outSec = parseTimeToSeconds(checkOut);
//   if (shift.crosses_midnight && outSec < inSec) {
//     outSec += 86400;
//   }
//   return { inSec, outSec };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION A — BASE (PUNCH-ONLY) ATTENDANCE
// // Rows 4-7: P, A, P:A, A:P
// // This must be computed BEFORE any leave is considered, because several
// // leave conversions (rows 26-31) are only valid if the underlying punch
// // pattern already matches a specific base status.
// // ═══════════════════════════════════════════════════════════════════════

// function computeBaseAttendance(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
// ): { baseStatus: BaseAttendanceStatus; matchedRule: string } {
//   const lateSec = lateMinutes * 60;
//   const workedSec = outSec - inSec;

//   // ── P — FULL DAY PRESENT (Row 4) ──
//   // Sheet Logic 1: on-time in, stayed till shift end.
//   if (inSec <= b.start && outSec >= b.end) {
//     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC1_STRICT' };
//   }
//   // Sheet Logic 3: checked in inside the grace window AND made up the late
//   // minutes on checkout (e.g. in at 10:07 -> must stay till >= 19:07).
//   if (inSec > b.start && inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
//     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC3_GRACE_MAKEUP' };
//   }
//   // Sheet Logic 4: pure duration fallback, regardless of exact in/out alignment.
//   if (workedSec >= b.durationSec) {
//     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC4_DURATION' };
//   }

//   // ── P:A — FIRST HALF PRESENT (Row 6) ──
//   // Sheet Logic 1: on-time in, out covers at least the first half but not full day.
//   if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
//     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC1_STRICT' };
//   }
//   // Sheet Logic 2: within grace, made up half-shift + late minutes.
//   if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
//     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC2_GRACE_MAKEUP' };
//   }
//   // Sheet Logic 3 (duration fallback): worked at least the first-half's worth of hours.
//   if (inSec <= b.start + b.graceSec && outSec < b.end && workedSec >= b.halfShift - b.start) {
//     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC3_DURATION' };
//   }

//   // ── A:P — SECOND HALF PRESENT (Row 7) ──
//   // Sheet Logic 1: arrived after grace (but by half-shift), stayed through
//   // shift end. NOTE: earlier code required staying past (end + lateMinutes),
//   // which is Row 7's Logic 2 — but Logic 2 is a STRICT SUBSET of Logic 1
//   // (end + lateSec >= end always), so implementing only Logic 2 was
//   // silently rejecting people who left right at shift end without the
//   // extra late-minutes makeup. Fixed to the correct, broader Logic 1 check.
//   if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
//     return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC1_STRICT' };
//   }
//   // Sheet Logic 3 (duration fallback): worked at least "second half"'s worth of hours.
//   if (inSec > b.start + b.graceSec && workedSec >= b.end - b.halfShift) {
//     return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC3_DURATION' };
//   }

//   // ── A — ABSENT (Row 5) — fallthrough for every other pattern ──
//   // Sheet's own Logic 1-3 for Row 5 describe arrival/departure combinations
//   // that don't satisfy any P / P:A / A:P condition above — those are
//   // already excluded by the checks above, so no separate check is needed
//   // here; this fallthrough correctly catches all of them by exclusion.
//   return { baseStatus: 'ABSENT', matchedRule: 'ROW5_ABSENT_FALLTHROUGH' };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION B — OFF-DAY ATTENDANCE (employee punched in on a Week Off / Holiday)
// // Rows 14-21: POW, POH, AOW, AOH, P:AOW, P:AOH, A:POW, A:POH
// // These are evaluated purely on hours worked, NOT on shift-start lateness,
// // because nobody is "late" on a day they weren't scheduled to work.
// // ═══════════════════════════════════════════════════════════════════════

// function evaluateOffDayAttendance(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   kind: 'WEEK_OFF' | 'HOLIDAY',
// ): RuleEvaluationResult {
//   const workedSec = outSec - inSec;
//   const fullThreshold = b.durationSec;     // Row 14/15: "Out Time - In Time >= 9 Hours"
//   const halfThreshold = b.durationSec / 2; // Row 16/17: "Out Time - In Time < 4.5 Hours"

//   if (workedSec >= fullThreshold) {
//     return {
//       status: kind === 'WEEK_OFF' ? 'PRESENT_ON_WEEK_OFF' : 'PRESENT_ON_HOLIDAY',
//       matchedRule: kind === 'WEEK_OFF' ? 'ROW14_POW_FULL_DURATION' : 'ROW15_POH_FULL_DURATION',
//       lateMinutes: 0,
//     };
//   }
//   if (workedSec < halfThreshold) {
//     return {
//       status: kind === 'WEEK_OFF' ? 'ABSENT_ON_WEEK_OFF' : 'ABSENT_ON_HOLIDAY',
//       matchedRule: kind === 'WEEK_OFF' ? 'ROW16_AOW_SHORT_DURATION' : 'ROW17_AOH_SHORT_DURATION',
//       lateMinutes: 0,
//     };
//   }
//   // Between half and full duration (Row 18-21): which half did they cover?
//   if (inSec < b.halfShift) {
//     return {
//       status: kind === 'WEEK_OFF' ? 'FIRST_HALF_PRESENT_WEEK_OFF' : 'FIRST_HALF_PRESENT_HOLIDAY',
//       matchedRule: kind === 'WEEK_OFF' ? 'ROW18_P_AOW' : 'ROW19_P_AOH',
//       lateMinutes: 0,
//     };
//   }
//   return {
//     status: kind === 'WEEK_OFF' ? 'SECOND_HALF_PRESENT_WEEK_OFF' : 'SECOND_HALF_PRESENT_HOLIDAY',
//     matchedRule: kind === 'WEEK_OFF' ? 'ROW20_A_POW' : 'ROW21_A_POH',
//     lateMinutes: 0,
//   };
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION C — SHORT LEAVE OVERRIDES
// // Rows 22-25: SL(h):P, P:SL(h), SL(f):P, P:SL(f)
// // A short leave "buys back" 30 or 60 minutes of lateness/early-departure.
// // ═══════════════════════════════════════════════════════════════════════

// function evaluateShortLeaveOverride(
//   inSec: number,
//   outSec: number,
//   b: ShiftBoundariesSeconds,
//   lateMinutes: number,
//   appliedLeave: AppliedLeaveDetails,
// ): { status: FinalAttendanceStatus; matchedRule: string } | null {
//   const lateSec = lateMinutes * 60;

//   // ── SL(h):P — 30-min short leave covering a LATE ARRIVAL (Row 22) ──
//   if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
//     if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end) {
//       return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'ROW22_SL_HALF_MORNING' };
//     }
//   }

//   // ── P:SL(h) — 30-min short leave covering an EARLY DEPARTURE (Row 23) ──
//   if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
//     // On-time arrival, left up to 30 minutes early.
//     if (inSec <= b.start && outSec >= b.end - 1800 && outSec < b.end) {
//       return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_ONTIME' };
//     }
//     // Arrived within grace: the 30-minute window shifts by the late minutes too.
//     if (
//       inSec > b.start &&
//       inSec <= b.start + b.graceSec &&
//       outSec >= b.end - 1800 + lateSec &&
//       outSec < b.end + lateSec
//     ) {
//       return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_GRACE' };
//     }
//   }

//   // ── SL(f):P — 60-min short leave covering a LATE ARRIVAL (Row 24) ──
//   if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
//     if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end) {
//       return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'ROW24_SL_FULL_MORNING' };
//     }
//   }

//   // ── P:SL(f) — 60-min short leave covering an EARLY DEPARTURE (Row 25) ──
//   if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
//     if (inSec <= b.start && outSec >= b.end - 3600 && outSec < b.end) {
//       return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_ONTIME' };
//     }
//     if (
//       inSec > b.start &&
//       inSec <= b.start + b.graceSec &&
//       outSec >= b.end - 3600 + lateSec &&
//       outSec < b.end + lateSec
//     ) {
//       return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_GRACE' };
//     }
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // SECTION D — CASUAL / EARNED LEAVE CONVERSIONS
// // Rows 26-33: CL:P, EL:P, P:CL, P:EL, CL(A), EL(A), CL, EL
// //
// // Half-day conversions (rows 26-29) REQUIRE the punch-only base status to
// // already show the matching half present — leave cannot manufacture a
// // punch that was never recorded:
// //   CL:P / EL:P  -> base status must be A:P (SECOND_HALF_PRESENT), leave covers 1st half
// //   P:CL / P:EL  -> base status must be P:A (FIRST_HALF_PRESENT), leave covers 2nd half
// //
// // Full-day conversions (rows 30-33) apply on top of a fully ABSENT day:
// //   balance >= 1 day   -> CL / EL   (full day covered)
// //   0.5 <= balance < 1  -> CL(A) / EL(A) (only a half day's worth of balance available)
// //   balance < 0.5       -> leave cannot be granted, day remains ABSENT
// //
// // NOTE: the sheet's text for rows 26-29 doesn't state a balance floor
// // explicitly (it only says "original attendance + half applied + approved
// // as CL/EL"), but requiring >= 0.5 balance before granting half a day of
// // leave is standard business logic — you can't spend leave you don't
// // have. Flagging this in case you want it removed.
// // ═══════════════════════════════════════════════════════════════════════

// function evaluateLeaveConversion(
//   baseStatus: BaseAttendanceStatus,
//   appliedLeave: AppliedLeaveDetails,
//   availableLeaveDays: number,
// ): { status: FinalAttendanceStatus; matchedRule: string } | null {
//   const isCL = appliedLeave.type === 'CL';
//   const isEL = appliedLeave.type === 'EL';
//   if (!isCL && !isEL) return null;

//   // ── Row 26 / 27 — CL:P / EL:P (original attendance must be A:P) ──
//   if (appliedLeave.position === 'FIRST_HALF' && baseStatus === 'SECOND_HALF_PRESENT' && availableLeaveDays >= 0.5) {
//     return isCL
//       ? { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'ROW26_CL_P_ORIGINAL_AP' }
//       : { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'ROW27_EL_P_ORIGINAL_AP' };
//   }

//   // ── Row 28 / 29 — P:CL / P:EL (original attendance must be P:A) ──
//   if (appliedLeave.position === 'SECOND_HALF' && baseStatus === 'FIRST_HALF_PRESENT' && availableLeaveDays >= 0.5) {
//     return isCL
//       ? { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'ROW28_P_CL_ORIGINAL_PA' }
//       : { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'ROW29_P_EL_ORIGINAL_PA' };
//   }

//   if (baseStatus !== 'ABSENT') return null;

//   // ── Row 32 / 33 — CL / EL (full day, sufficient balance) ──
//   if (appliedLeave.position === 'FULL_DAY') {
//     if (availableLeaveDays >= 1) {
//       return isCL
//         ? { status: 'CASUAL_LEAVE', matchedRule: 'ROW32_CL_FULL_SUFFICIENT_BALANCE' }
//         : { status: 'EARNED_LEAVE', matchedRule: 'ROW33_EL_FULL_SUFFICIENT_BALANCE' };
//     }
//     // ── Row 30 / 31 — CL(A) / EL(A) (full day requested, only half-day balance left) ──
//     if (availableLeaveDays >= 0.5) {
//       return isCL
//         ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_DOWNGRADED_HALF_BALANCE' }
//         : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_DOWNGRADED_HALF_BALANCE' };
//     }
//     return null; // balance < 0.5 -> cannot grant, stays ABSENT
//   }

//   // ── Row 30 / 31 — CL(A) / EL(A) ("OR Apply First Or Second Half" on a fully-absent day) ──
//   if ((appliedLeave.position === 'FIRST_HALF' || appliedLeave.position === 'SECOND_HALF') && availableLeaveDays >= 0.5) {
//     return isCL
//       ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_HALF_ON_FULL_ABSENT' }
//       : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_HALF_ON_FULL_ABSENT' };
//   }

//   return null;
// }

// // ═══════════════════════════════════════════════════════════════════════
// // MAIN EVALUATION ENGINE
// // ═══════════════════════════════════════════════════════════════════════

// export function evaluateAttendanceStatus(
//   row: CombinedAttendanceRow,
//   shift: Shift,
//   options: AttendanceEvaluationOptions = {},
// ): RuleEvaluationResult {
//   const {
//     graceMinutes = 15,
//     isWeekOff = false,
//     isHoliday = false,
//     appliedLeave,
//     availableLeaveDays = 0,
//   } = options;

//   // ── 1. MISSING BOTH PUNCHES ──
//   if (!row.check_in && !row.check_out) {
//     if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'ROW8_WO_NO_PUNCH', lateMinutes: 0 };
//     if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'ROW9_HO_NO_PUNCH', lateMinutes: 0 };

//     // An employee with zero punches and an approved full-day (or
//     // half-day-on-a-fully-absent-day) CL/EL leave should NOT be
//     // reported as ABSENT — check the leave first. This reuses the
//     // same balance logic as the punched-day leave conversion
//     // (Rows 30-33), just fed baseStatus='ABSENT' directly since
//     // there's no punch data to derive a base status from.
//     if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
//       const leaveResult = evaluateLeaveConversion('ABSENT', appliedLeave, availableLeaveDays);
//       if (leaveResult) {
//         return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes: 0 };
//       }
//     }

//     return { status: 'ABSENT', matchedRule: 'ROW5_ABSENT_NO_PUNCH', lateMinutes: 0 };
//   }

//   // ── 2. MISSING A SINGLE PUNCH (Rows 2, 3, 10-13) ──
//   if (!row.check_in || !row.check_out) {
//     const isOutMissing = !!row.check_in && !row.check_out;
//     if (isWeekOff) {
//       return {
//         status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF',
//         matchedRule: isOutMissing ? 'ROW12_P_MPOW' : 'ROW10_MP_POW',
//         lateMinutes: 0,
//       };
//     }
//     if (isHoliday) {
//       return {
//         status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY',
//         matchedRule: isOutMissing ? 'ROW13_P_MPOH' : 'ROW11_MP_POH',
//         lateMinutes: 0,
//       };
//     }
//     return {
//       status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT',
//       matchedRule: isOutMissing ? 'ROW2_P_MP' : 'ROW3_MP_P',
//       lateMinutes: 0,
//     };
//   }

//   // ── 3. BOUNDARY / PUNCH NORMALIZATION ──
//   const b = computeShiftBoundaries(shift, graceMinutes);
//   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

//   if (outSec < inSec) {
//     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
//   }

//   // Late minutes are always measured against the standard shift start time.
//   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));

//   // ── 4. OFF-DAY PATH (Week Off / Holiday with punches present) ──
//   // Evaluated purely on hours worked — lateness rules don't apply to a day
//   // the employee wasn't scheduled to work.
//   if (isWeekOff) return evaluateOffDayAttendance(inSec, outSec, b, 'WEEK_OFF');
//   if (isHoliday) return evaluateOffDayAttendance(inSec, outSec, b, 'HOLIDAY');

//   // ── 5. NORMAL WORKING DAY — SHORT LEAVE OVERRIDE FIRST (Rows 22-25) ──
//   if (appliedLeave?.approved && (appliedLeave.type === 'SL_HALF' || appliedLeave.type === 'SL_FULL')) {
//     const shortLeaveResult = evaluateShortLeaveOverride(inSec, outSec, b, lateMinutes, appliedLeave);
//     if (shortLeaveResult) {
//       return { status: shortLeaveResult.status, matchedRule: shortLeaveResult.matchedRule, lateMinutes };
//     }
//   }

//   // ── 6. BASE ATTENDANCE FROM PUNCHES (Rows 4-7) ──
//   const { baseStatus, matchedRule } = computeBaseAttendance(inSec, outSec, b, lateMinutes);

//   // ── 7. CASUAL / EARNED LEAVE CONVERSION (Rows 26-33) ──
//   if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
//     const leaveResult = evaluateLeaveConversion(baseStatus, appliedLeave, availableLeaveDays);
//     if (leaveResult) {
//       return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes };
//     }
//   }

//   // ── 8. NO OVERRIDE APPLIED — RETURN PUNCH-ONLY STATUS ──
//   return { status: baseStatus, matchedRule, lateMinutes };
// }




























// import { Shift } from '../database/models/Shift';
  // import { Shift } from '../../database/models/Shift';
  // import { CombinedAttendanceRow } from './attendance-combined.service';

  // // ═══════════════════════════════════════════════════════════════════════
  // // TYPES
  // // ═══════════════════════════════════════════════════════════════════════

  // /**
  //  * Every code below is annotated with the row number of the source rules
  //  * sheet ("Abbreviations" tab) so the mapping between spec <-> code is
  //  * always traceable.
  //  */
  // export type FinalAttendanceStatus =
  //   | 'PRESENT'                      // Row 4  - P
  //   | 'ABSENT'                       // Row 5  - A
  //   | 'PRESENT_MISS_PUNCH'           // Row 2  - P:MP
  //   | 'MISS_PUNCH_PRESENT'           // Row 3  - MP:P
  //   | 'FIRST_HALF_PRESENT'           // Row 6  - P:A
  //   | 'SECOND_HALF_PRESENT'          // Row 7  - A:P
  //   | 'WEEK_OFF'                     // Row 8  - WO
  //   | 'HOLIDAY'                      // Row 9  - HO
  //   | 'MISS_PUNCH_PRESENT_WEEK_OFF'  // Row 10 - MP:POW
  //   | 'MISS_PUNCH_PRESENT_HOLIDAY'   // Row 11 - MP:POH
  //   | 'PRESENT_MISS_PUNCH_WEEK_OFF'  // Row 12 - P:MPOW
  //   | 'PRESENT_MISS_PUNCH_HOLIDAY'   // Row 13 - P:MPOH
  //   | 'PRESENT_ON_WEEK_OFF'          // Row 14 - POW
  //   | 'PRESENT_ON_HOLIDAY'           // Row 15 - POH
  //   | 'ABSENT_ON_WEEK_OFF'           // Row 16 - AOW
  //   | 'ABSENT_ON_HOLIDAY'            // Row 17 - AOH
  //   | 'FIRST_HALF_PRESENT_WEEK_OFF'  // Row 18 - P:AOW
  //   | 'FIRST_HALF_PRESENT_HOLIDAY'   // Row 19 - P:AOH
  //   | 'SECOND_HALF_PRESENT_WEEK_OFF' // Row 20 - A:POW
  //   | 'SECOND_HALF_PRESENT_HOLIDAY'  // Row 21 - A:POH
  //   | 'SHORT_LEAVE_HALF_PRESENT'     // Row 22 - SL(h):P
  //   | 'PRESENT_SHORT_LEAVE_HALF'     // Row 23 - P:SL(h)
  //   | 'SHORT_LEAVE_FULL_PRESENT'     // Row 24 - SL(f):P
  //   | 'PRESENT_SHORT_LEAVE_FULL'     // Row 25 - P:SL(f)
  //   | 'CASUAL_LEAVE_PRESENT'         // Row 26 - CL:P
  //   | 'EARNED_LEAVE_PRESENT'         // Row 27 - EL:P
  //   | 'PRESENT_CASUAL_LEAVE'         // Row 28 - P:CL
  //   | 'PRESENT_EARNED_LEAVE'         // Row 29 - P:EL
  //   | 'CASUAL_LEAVE_ABSENT'          // Row 30 - CL(A)
  //   | 'EARNED_LEAVE_ABSENT'          // Row 31 - EL(A)
  //   | 'CASUAL_LEAVE'                 // Row 32 - CL
  //   | 'EARNED_LEAVE'                 // Row 33 - EL
  //   | 'Unclassified';

  // /** The subset of statuses that can come purely out of punch data, before any leave is layered on top. */
  // type BaseAttendanceStatus = 'PRESENT' | 'FIRST_HALF_PRESENT' | 'SECOND_HALF_PRESENT' | 'ABSENT';

  // export interface AppliedLeaveDetails {
  //   type: 'SL_HALF' | 'SL_FULL' | 'CL' | 'EL';
  //   position?: 'MORNING' | 'EVENING' | 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';
  //   approved: boolean;
  // }

  // export interface RuleEvaluationResult {
  //   status: FinalAttendanceStatus;
  //   matchedRule: string | null;
  //   lateMinutes: number;
  // }

  // export interface AttendanceEvaluationOptions {
  //   /** Minutes an employee may check in after shift start without being marked late. Default 15. */
  //   graceMinutes?: number;
  //   isWeekOff?: boolean;
  //   isHoliday?: boolean;
  //   /** Approved leave (short leave / CL / EL) applicable to this employee on this date, if any. */
  //   appliedLeave?: AppliedLeaveDetails;
  //   /**
  //    * Remaining CL/EL balance (in days) available to the employee for appliedLeave.type,
  //    * AFTER subtracting already-used and already-pending leave for the year.
  //    * Only consulted when appliedLeave.type is 'CL' or 'EL'. Ignored otherwise.
  //    */
  //   availableLeaveDays?: number;
  // }

  // interface ShiftBoundariesSeconds {
  //   start: number;
  //   end: number;
  //   halfShift: number;
  //   durationSec: number;
  //   graceSec: number;
  // }

  // // ═══════════════════════════════════════════════════════════════════════
  // // TIME HELPERS
  // // ═══════════════════════════════════════════════════════════════════════

  // function parseTimeToSeconds(time: string): number {
  //   const [h, m, s] = time.split(':').map(Number);
  //   return h * 3600 + m * 60 + (s || 0);
  // }

  // function computeShiftBoundaries(shift: Shift, graceMinutes: number): ShiftBoundariesSeconds {
  //   const start = parseTimeToSeconds(shift.start_time);
  //   const durationSec = shift.duration_minutes * 60;
  //   const end = shift.crosses_midnight ? start + durationSec : parseTimeToSeconds(shift.end_time);

  //   // NOTE: `half_shift_time` is not yet a first-class column on the Shift model.
  //   // Until it is added, we derive the midpoint automatically so the engine still
  //   // works for any shift length/duration, not just the 9-hour example in the sheet.
  //   const halfShift = (shift as any).half_shift_time
  //     ? parseTimeToSeconds((shift as any).half_shift_time)
  //     : start + durationSec / 2;

  //   const graceSec = graceMinutes * 60;
  //   return { start, end, halfShift, durationSec, graceSec };
  // }

  // function normalizePunchSeconds(checkIn: string, checkOut: string, shift: Shift): { inSec: number; outSec: number } {
  //   const inSec = parseTimeToSeconds(checkIn);
  //   let outSec = parseTimeToSeconds(checkOut);
  //   if (shift.crosses_midnight && outSec < inSec) {
  //     outSec += 86400;
  //   }
  //   return { inSec, outSec };
  // }

  // // ═══════════════════════════════════════════════════════════════════════
  // // SECTION A — BASE (PUNCH-ONLY) ATTENDANCE
  // // Rows 4-7: P, A, P:A, A:P
  // // This must be computed BEFORE any leave is considered, because several
  // // leave conversions (rows 26-31) are only valid if the underlying punch
  // // pattern already matches a specific base status.
  // // ═══════════════════════════════════════════════════════════════════════

  // function computeBaseAttendance(
  //   inSec: number,
  //   outSec: number,
  //   b: ShiftBoundariesSeconds,
  //   lateMinutes: number,
  // ): { baseStatus: BaseAttendanceStatus; matchedRule: string } {
  //   const lateSec = lateMinutes * 60;
  //   const workedSec = outSec - inSec;

  //   // ── P — FULL DAY PRESENT (Row 4) ──
  //   // Sheet Logic 1: on-time in, stayed till shift end.
  //   if (inSec <= b.start && outSec >= b.end) {
  //     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC1_STRICT' };
  //   }
  //   // Sheet Logic 3: checked in inside the grace window AND made up the late
  //   // minutes on checkout (e.g. in at 10:07 -> must stay till >= 19:07).
  //   if (inSec > b.start && inSec <= b.start + b.graceSec && outSec >= b.end + lateSec) {
  //     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC3_GRACE_MAKEUP' };
  //   }
  //   // Sheet Logic 4: pure duration fallback, regardless of exact in/out alignment.
  //   if (workedSec >= b.durationSec) {
  //     return { baseStatus: 'PRESENT', matchedRule: 'ROW4_LOGIC4_DURATION' };
  //   }

  //   // ── P:A — FIRST HALF PRESENT (Row 6) ──
  //   // Sheet Logic 1: on-time in, out covers at least the first half but not full day.
  //   if (inSec <= b.start && outSec >= b.halfShift && outSec < b.end) {
  //     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC1_STRICT' };
  //   }
  //   // Sheet Logic 2: within grace, made up half-shift + late minutes.
  //   if (inSec <= b.start + b.graceSec && outSec >= b.halfShift + lateSec && outSec < b.end) {
  //     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC2_GRACE_MAKEUP' };
  //   }
  //   // Sheet Logic 3 (duration fallback): worked at least the first-half's worth of hours.
  //   if (inSec <= b.start + b.graceSec && outSec < b.end && workedSec >= b.halfShift - b.start) {
  //     return { baseStatus: 'FIRST_HALF_PRESENT', matchedRule: 'ROW6_LOGIC3_DURATION' };
  //   }

  //   // ── A:P — SECOND HALF PRESENT (Row 7) ──
  //   // Sheet Logic 1: arrived after grace (but by half-shift), stayed through
  //   // shift end. NOTE: earlier code required staying past (end + lateMinutes),
  //   // which is Row 7's Logic 2 — but Logic 2 is a STRICT SUBSET of Logic 1
  //   // (end + lateSec >= end always), so implementing only Logic 2 was
  //   // silently rejecting people who left right at shift end without the
  //   // extra late-minutes makeup. Fixed to the correct, broader Logic 1 check.
  //   if (inSec <= b.halfShift && inSec > b.start + b.graceSec && outSec >= b.end) {
  //     return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC1_STRICT' };
  //   }
  //   // Sheet Logic 3 (duration fallback): worked at least "second half"'s worth of hours.
  //   if (inSec > b.start + b.graceSec && workedSec >= b.end - b.halfShift) {
  //     return { baseStatus: 'SECOND_HALF_PRESENT', matchedRule: 'ROW7_LOGIC3_DURATION' };
  //   }

  //   // ── A — ABSENT (Row 5) — fallthrough for every other pattern ──
  //   // Sheet's own Logic 1-3 for Row 5 describe arrival/departure combinations
  //   // that don't satisfy any P / P:A / A:P condition above — those are
  //   // already excluded by the checks above, so no separate check is needed
  //   // here; this fallthrough correctly catches all of them by exclusion.
  //   return { baseStatus: 'ABSENT', matchedRule: 'ROW5_ABSENT_FALLTHROUGH' };
  // }

  // // ═══════════════════════════════════════════════════════════════════════
  // // SECTION B — OFF-DAY ATTENDANCE (employee punched in on a Week Off / Holiday)
  // // Rows 14-21: POW, POH, AOW, AOH, P:AOW, P:AOH, A:POW, A:POH
  // // These are evaluated purely on hours worked, NOT on shift-start lateness,
  // // because nobody is "late" on a day they weren't scheduled to work.
  // // ═══════════════════════════════════════════════════════════════════════

  // function evaluateOffDayAttendance(
  //   inSec: number,
  //   outSec: number,
  //   b: ShiftBoundariesSeconds,
  //   kind: 'WEEK_OFF' | 'HOLIDAY',
  // ): RuleEvaluationResult {
  //   const workedSec = outSec - inSec;
  //   const fullThreshold = b.durationSec;     // Row 14/15: "Out Time - In Time >= 9 Hours"
  //   const halfThreshold = b.durationSec / 2; // Row 16/17: "Out Time - In Time < 4.5 Hours"

  //   if (workedSec >= fullThreshold) {
  //     return {
  //       status: kind === 'WEEK_OFF' ? 'PRESENT_ON_WEEK_OFF' : 'PRESENT_ON_HOLIDAY',
  //       matchedRule: kind === 'WEEK_OFF' ? 'ROW14_POW_FULL_DURATION' : 'ROW15_POH_FULL_DURATION',
  //       lateMinutes: 0,
  //     };
  //   }
  //   if (workedSec < halfThreshold) {
  //     return {
  //       status: kind === 'WEEK_OFF' ? 'ABSENT_ON_WEEK_OFF' : 'ABSENT_ON_HOLIDAY',
  //       matchedRule: kind === 'WEEK_OFF' ? 'ROW16_AOW_SHORT_DURATION' : 'ROW17_AOH_SHORT_DURATION',
  //       lateMinutes: 0,
  //     };
  //   }
  //   // Between half and full duration (Row 18-21): which half did they cover?
  //   if (inSec < b.halfShift) {
  //     return {
  //       status: kind === 'WEEK_OFF' ? 'FIRST_HALF_PRESENT_WEEK_OFF' : 'FIRST_HALF_PRESENT_HOLIDAY',
  //       matchedRule: kind === 'WEEK_OFF' ? 'ROW18_P_AOW' : 'ROW19_P_AOH',
  //       lateMinutes: 0,
  //     };
  //   }
  //   return {
  //     status: kind === 'WEEK_OFF' ? 'SECOND_HALF_PRESENT_WEEK_OFF' : 'SECOND_HALF_PRESENT_HOLIDAY',
  //     matchedRule: kind === 'WEEK_OFF' ? 'ROW20_A_POW' : 'ROW21_A_POH',
  //     lateMinutes: 0,
  //   };
  // }

  // // ═══════════════════════════════════════════════════════════════════════
  // // SECTION C — SHORT LEAVE OVERRIDES
  // // Rows 22-25: SL(h):P, P:SL(h), SL(f):P, P:SL(f)
  // // A short leave "buys back" 30 or 60 minutes of lateness/early-departure.
  // // ═══════════════════════════════════════════════════════════════════════

  // function evaluateShortLeaveOverride(
  //   inSec: number,
  //   outSec: number,
  //   b: ShiftBoundariesSeconds,
  //   lateMinutes: number,
  //   appliedLeave: AppliedLeaveDetails,
  // ): { status: FinalAttendanceStatus; matchedRule: string } | null {
  //   const lateSec = lateMinutes * 60;

  //   // ── SL(h):P — 30-min short leave covering a LATE ARRIVAL (Row 22) ──
  //   if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'MORNING') {
  //     if (inSec > b.start + b.graceSec && inSec <= b.start + 1800 && outSec >= b.end) {
  //       return { status: 'SHORT_LEAVE_HALF_PRESENT', matchedRule: 'ROW22_SL_HALF_MORNING' };
  //     }
  //   }

  //   // ── P:SL(h) — 30-min short leave covering an EARLY DEPARTURE (Row 23) ──
  //   if (appliedLeave.type === 'SL_HALF' && appliedLeave.position === 'EVENING') {
  //     // On-time arrival, left up to 30 minutes early.
  //     if (inSec <= b.start && outSec >= b.end - 1800 && outSec < b.end) {
  //       return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_ONTIME' };
  //     }
  //     // Arrived within grace: the 30-minute window shifts by the late minutes too.
  //     if (
  //       inSec > b.start &&
  //       inSec <= b.start + b.graceSec &&
  //       outSec >= b.end - 1800 + lateSec &&
  //       outSec < b.end + lateSec
  //     ) {
  //       return { status: 'PRESENT_SHORT_LEAVE_HALF', matchedRule: 'ROW23_SL_HALF_EVENING_GRACE' };
  //     }
  //   }

  //   // ── SL(f):P — 60-min short leave covering a LATE ARRIVAL (Row 24) ──
  //   if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'MORNING') {
  //     if (inSec > b.start + b.graceSec && inSec <= b.start + 3600 && outSec >= b.end) {
  //       return { status: 'SHORT_LEAVE_FULL_PRESENT', matchedRule: 'ROW24_SL_FULL_MORNING' };
  //     }
  //   }

  //   // ── P:SL(f) — 60-min short leave covering an EARLY DEPARTURE (Row 25) ──
  //   if (appliedLeave.type === 'SL_FULL' && appliedLeave.position === 'EVENING') {
  //     if (inSec <= b.start && outSec >= b.end - 3600 && outSec < b.end) {
  //       return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_ONTIME' };
  //     }
  //     if (
  //       inSec > b.start &&
  //       inSec <= b.start + b.graceSec &&
  //       outSec >= b.end - 3600 + lateSec &&
  //       outSec < b.end + lateSec
  //     ) {
  //       return { status: 'PRESENT_SHORT_LEAVE_FULL', matchedRule: 'ROW25_SL_FULL_EVENING_GRACE' };
  //     }
  //   }

  //   return null;
  // }

  // // ═══════════════════════════════════════════════════════════════════════
  // // SECTION D — CASUAL / EARNED LEAVE CONVERSIONS
  // // Rows 26-33: CL:P, EL:P, P:CL, P:EL, CL(A), EL(A), CL, EL
  // //
  // // Half-day conversions (rows 26-29) REQUIRE the punch-only base status to
  // // already show the matching half present — leave cannot manufacture a
  // // punch that was never recorded:
  // //   CL:P / EL:P  -> base status must be A:P (SECOND_HALF_PRESENT), leave covers 1st half
  // //   P:CL / P:EL  -> base status must be P:A (FIRST_HALF_PRESENT), leave covers 2nd half
  // //
  // // Full-day conversions (rows 30-33) apply on top of a fully ABSENT day:
  // //   balance >= 1 day   -> CL / EL   (full day covered)
  // //   0.5 <= balance < 1  -> CL(A) / EL(A) (only a half day's worth of balance available)
  // //   balance < 0.5       -> leave cannot be granted, day remains ABSENT
  // //
  // // NOTE: the sheet's text for rows 26-29 doesn't state a balance floor
  // // explicitly (it only says "original attendance + half applied + approved
  // // as CL/EL"), but requiring >= 0.5 balance before granting half a day of
  // // leave is standard business logic — you can't spend leave you don't
  // // have. Flagging this in case you want it removed.
  // // ═══════════════════════════════════════════════════════════════════════

  // function evaluateLeaveConversion(
  //   baseStatus: BaseAttendanceStatus,
  //   appliedLeave: AppliedLeaveDetails,
  //   availableLeaveDays: number,
  // ): { status: FinalAttendanceStatus; matchedRule: string } | null {
  //   const isCL = appliedLeave.type === 'CL';
  //   const isEL = appliedLeave.type === 'EL';
  //   if (!isCL && !isEL) return null;

  //   // ── Row 26 / 27 — CL:P / EL:P (original attendance must be A:P) ──
  //   if (appliedLeave.position === 'FIRST_HALF' && baseStatus === 'SECOND_HALF_PRESENT' && availableLeaveDays >= 0.5) {
  //     return isCL
  //       ? { status: 'CASUAL_LEAVE_PRESENT', matchedRule: 'ROW26_CL_P_ORIGINAL_AP' }
  //       : { status: 'EARNED_LEAVE_PRESENT', matchedRule: 'ROW27_EL_P_ORIGINAL_AP' };
  //   }

  //   // ── Row 28 / 29 — P:CL / P:EL (original attendance must be P:A) ──
  //   if (appliedLeave.position === 'SECOND_HALF' && baseStatus === 'FIRST_HALF_PRESENT' && availableLeaveDays >= 0.5) {
  //     return isCL
  //       ? { status: 'PRESENT_CASUAL_LEAVE', matchedRule: 'ROW28_P_CL_ORIGINAL_PA' }
  //       : { status: 'PRESENT_EARNED_LEAVE', matchedRule: 'ROW29_P_EL_ORIGINAL_PA' };
  //   }

  //   if (baseStatus !== 'ABSENT') return null;

  //   // ── Row 32 / 33 — CL / EL (full day, sufficient balance) ──
  //   if (appliedLeave.position === 'FULL_DAY') {
  //     if (availableLeaveDays >= 1) {
  //       return isCL
  //         ? { status: 'CASUAL_LEAVE', matchedRule: 'ROW32_CL_FULL_SUFFICIENT_BALANCE' }
  //         : { status: 'EARNED_LEAVE', matchedRule: 'ROW33_EL_FULL_SUFFICIENT_BALANCE' };
  //     }
  //     // ── Row 30 / 31 — CL(A) / EL(A) (full day requested, only half-day balance left) ──
  //     if (availableLeaveDays >= 0.5) {
  //       return isCL
  //         ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_DOWNGRADED_HALF_BALANCE' }
  //         : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_DOWNGRADED_HALF_BALANCE' };
  //     }
  //     return null; // balance < 0.5 -> cannot grant, stays ABSENT
  //   }

  //   // ── Row 30 / 31 — CL(A) / EL(A) ("OR Apply First Or Second Half" on a fully-absent day) ──
  //   if ((appliedLeave.position === 'FIRST_HALF' || appliedLeave.position === 'SECOND_HALF') && availableLeaveDays >= 0.5) {
  //     return isCL
  //       ? { status: 'CASUAL_LEAVE_ABSENT', matchedRule: 'ROW30_CL_A_HALF_ON_FULL_ABSENT' }
  //       : { status: 'EARNED_LEAVE_ABSENT', matchedRule: 'ROW31_EL_A_HALF_ON_FULL_ABSENT' };
  //   }

  //   return null;
  // }

  // // ═══════════════════════════════════════════════════════════════════════
  // // MAIN EVALUATION ENGINE
  // // ═══════════════════════════════════════════════════════════════════════

  // export function evaluateAttendanceStatus(
  //   row: CombinedAttendanceRow,
  //   shift: Shift,
  //   options: AttendanceEvaluationOptions = {},
  // ): RuleEvaluationResult {
  //   const {
  //     graceMinutes = 15,
  //     isWeekOff = false,
  //     isHoliday = false,
  //     appliedLeave,
  //     availableLeaveDays = 0,
  //   } = options;

  //   // ── 1. MISSING BOTH PUNCHES ──
  //   if (!row.check_in && !row.check_out) {
  //     if (isWeekOff) return { status: 'WEEK_OFF', matchedRule: 'ROW8_WO_NO_PUNCH', lateMinutes: 0 };
  //     if (isHoliday) return { status: 'HOLIDAY', matchedRule: 'ROW9_HO_NO_PUNCH', lateMinutes: 0 };

  //     // An employee with zero punches and an approved full-day (or
  //     // half-day-on-a-fully-absent-day) CL/EL leave should NOT be
  //     // reported as ABSENT — check the leave first. This reuses the
  //     // same balance logic as the punched-day leave conversion
  //     // (Rows 30-33), just fed baseStatus='ABSENT' directly since
  //     // there's no punch data to derive a base status from.
  //     if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
  //       const leaveResult = evaluateLeaveConversion('ABSENT', appliedLeave, availableLeaveDays);
  //       if (leaveResult) {
  //         return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes: 0 };
  //       }
  //     }

  //     return { status: 'ABSENT', matchedRule: 'ROW5_ABSENT_NO_PUNCH', lateMinutes: 0 };
  //   }

  //   // ── 2. MISSING A SINGLE PUNCH (Rows 2, 3, 10-13) ──
  //   if (!row.check_in || !row.check_out) {
  //     const isOutMissing = !!row.check_in && !row.check_out;
  //     if (isWeekOff) {
  //       return {
  //         status: isOutMissing ? 'PRESENT_MISS_PUNCH_WEEK_OFF' : 'MISS_PUNCH_PRESENT_WEEK_OFF',
  //         matchedRule: isOutMissing ? 'ROW12_P_MPOW' : 'ROW10_MP_POW',
  //         lateMinutes: 0,
  //       };
  //     }
  //     if (isHoliday) {
  //       return {
  //         status: isOutMissing ? 'PRESENT_MISS_PUNCH_HOLIDAY' : 'MISS_PUNCH_PRESENT_HOLIDAY',
  //         matchedRule: isOutMissing ? 'ROW13_P_MPOH' : 'ROW11_MP_POH',
  //         lateMinutes: 0,
  //       };
  //     }
  //     return {
  //       status: isOutMissing ? 'PRESENT_MISS_PUNCH' : 'MISS_PUNCH_PRESENT',
  //       matchedRule: isOutMissing ? 'ROW2_P_MP' : 'ROW3_MP_P',
  //       lateMinutes: 0,
  //     };
  //   }

  //   // ── 3. BOUNDARY / PUNCH NORMALIZATION ──
  //   const b = computeShiftBoundaries(shift, graceMinutes);
  //   const { inSec, outSec } = normalizePunchSeconds(row.check_in, row.check_out, shift);

  //   if (outSec < inSec) {
  //     return { status: 'Unclassified', matchedRule: 'ANOMALY_CHECKOUT_BEFORE_CHECKIN', lateMinutes: 0 };
  //   }

  //   // Late minutes are always measured against the standard shift start time.
  //   const lateMinutes = Math.max(0, Math.round((inSec - b.start) / 60));

  //   // ── 4. OFF-DAY PATH (Week Off / Holiday with punches present) ──
  //   // Evaluated purely on hours worked — lateness rules don't apply to a day
  //   // the employee wasn't scheduled to work.
  //   if (isWeekOff) return evaluateOffDayAttendance(inSec, outSec, b, 'WEEK_OFF');
  //   if (isHoliday) return evaluateOffDayAttendance(inSec, outSec, b, 'HOLIDAY');

  //   // ── 5. NORMAL WORKING DAY — SHORT LEAVE OVERRIDE FIRST (Rows 22-25) ──
  //   if (appliedLeave?.approved && (appliedLeave.type === 'SL_HALF' || appliedLeave.type === 'SL_FULL')) {
  //     const shortLeaveResult = evaluateShortLeaveOverride(inSec, outSec, b, lateMinutes, appliedLeave);
  //     if (shortLeaveResult) {
  //       return { status: shortLeaveResult.status, matchedRule: shortLeaveResult.matchedRule, lateMinutes };
  //     }
  //   }

  //   // ── 6. BASE ATTENDANCE FROM PUNCHES (Rows 4-7) ──
  //   const { baseStatus, matchedRule } = computeBaseAttendance(inSec, outSec, b, lateMinutes);

  //   // ── 7. CASUAL / EARNED LEAVE CONVERSION (Rows 26-33) ──
  //   if (appliedLeave?.approved && (appliedLeave.type === 'CL' || appliedLeave.type === 'EL')) {
  //     const leaveResult = evaluateLeaveConversion(baseStatus, appliedLeave, availableLeaveDays);
  //     if (leaveResult) {
  //       return { status: leaveResult.status, matchedRule: leaveResult.matchedRule, lateMinutes };
  //     }
  //   }

  //   // ── 8. NO OVERRIDE APPLIED — RETURN PUNCH-ONLY STATUS ──
  //   return { status: baseStatus, matchedRule, lateMinutes };
  // }





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