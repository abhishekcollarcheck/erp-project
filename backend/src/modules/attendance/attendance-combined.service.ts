// /**
//  * attendance-combined.service.ts
//  *
//  * Merges Biometric (MSSQL), Trakola, AND approved Regularizations into a
//  * single per-day row:
//  *   check_in  = the approved regularization's check-in if one was approved
//  *               for this date, otherwise the earliest of Biometric/Trakola
//  *   check_out = the approved regularization's check-out if approved,
//  *               otherwise the latest of Biometric/Trakola
//  *   a source with no punch that day contributes null (rendered as a dash) —
//  *   we never invent a value for a missing punch.
//  *
//  * Regularization is treated as AUTHORITATIVE for whichever field it
//  * corrected (a manager approved it specifically to fix a wrong/missing
//  * punch), not as just another data point folded into the min/max merge —
//  * but only for the field it actually provided. If a regularization only
//  * corrected check_out, check_in still comes from Biometric/Trakola as usual.
//  *
//  * Place at: backend/src/modules/attendance/attendance-combined.service.ts
//  */

// import { Op } from 'sequelize';
// import { Employee } from '../../database/models/Employee';
// import { Shift } from '../../database/models/Shift';
// import { AttendanceRegularization } from '../../database/models/AttendanceRegularization';
// import { attendanceMSSQLService, MSSQLAttendanceRow } from './attendance.mssql.service';
// import { trakolaService, TrakolaAttendanceRow } from './trackola.service';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { evaluateAttendanceStatus, FinalAttendanceStatus } from './shift-rule-evaluator.service';
// import { holidayService } from './holiday.service';
// import { isWeeklyOff } from './weekly-off.util';

// export type CombinedDayStatus = 'Present' | 'Incomplete' | 'No Punches';
// export type AttendanceSourceTag = 'Biometric' | 'Trakola' | 'Regularized';

// interface ApprovedRegularizationRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
// }

// export interface CombinedAttendanceRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
//   working_hours: number | null;
//   sources: AttendanceSourceTag[]; // which source(s) contributed that day — includes 'Regularized' if applicable
//   isRegularized: boolean;         // explicit flag for the frontend badge, same info as sources but easier to check
//   status: CombinedDayStatus;      // raw merge status (punches exist or not) — kept for debugging/backward compat
//   finalStatus: FinalAttendanceStatus | null; // rule-evaluated status; null if employee has no shift assigned
//   matchedRule: string | null;                // which rule fired, e.g. 'PRESENT_STRICT' — for audit
//   lateMinutes: number | null;
//   punch_count: number;
// }

// export class AttendanceCombinedService {
//   /**
//    * Combined attendance for ONE employee over a date range — used by the
//    * self-service "/combined/my" endpoint.
//    */
//   async getCombinedForEmployee(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//     companyId: number,
//   ): Promise<CombinedAttendanceRow[]> {
//     const employee = await Employee.findOne({
//       where: { id: employeeId },
//       attributes: ['employee_code', 'first_name', 'last_name', 'shift_id', 'grace_minutes', 'saturday_off'],
//     });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const [bioRows, trakRows, holidayMap, regRows] = await Promise.all([
//       attendanceMSSQLService.getAttendanceByDate(startDate, endDate, employee.employee_code),
//       // FIX: Trakola is a third-party dependency outside our control — a
//       // failure/outage on their end should degrade gracefully (fall back to
//       // Biometric-only data for the affected days), not 502 the entire
//       // Combined endpoint. This was the root cause of the reported 502:
//       // Promise.all rejects the whole batch the moment any one promise
//       // rejects, so a single Trakola error was taking Biometric data down
//       // with it even though Biometric had nothing wrong.
//       trakolaService.getNormalizedAttendance(startDate, endDate, employee.employee_code).catch((e: any) => {
//         console.error(
//           `[attendance-combined] Trakola fetch failed for employee ${employeeId} (${startDate} to ${endDate}) — ` +
//           `continuing with Biometric-only data. Error: ${e.message}`,
//         );
//         return [];
//       }),
//       holidayService.getHolidaysInRange(startDate, endDate, companyId),
//       this.getApprovedRegularizations(employeeId, startDate, endDate),
//     ]);

//     const merged = this.mergeByDate(bioRows, trakRows, regRows);

//     // Holiday and Weekly Off apply BEFORE any punch-based rule, and apply
//     // uniformly regardless of source — a row merged from Biometric,
//     // Trakola, Regularized, any combination, or neither all get the same
//     // override here.
//     const withDayTypeOverrides = merged.map((row) => {
//       const holidayName = holidayMap.get(row.date);
//       if (holidayName) {
//         return { ...row, finalStatus: 'Holiday' as FinalAttendanceStatus, matchedRule: `HOLIDAY:${holidayName}`, lateMinutes: 0 };
//       }

//       const weeklyOff = isWeeklyOff(row.date, employee.saturday_off);
//       if (weeklyOff.isOff) {
//         return { ...row, finalStatus: 'Weekly Off' as FinalAttendanceStatus, matchedRule: weeklyOff.reason, lateMinutes: 0 };
//       }

//       return row; // untouched — still needs shift-rule evaluation below
//     });

//     // No shift assigned → can't evaluate punch-based rules for the
//     // remaining working days. Holiday/Weekly Off rows above are already
//     // finalized regardless; only the working-day rows are left unevaluated.
//     if (!employee.shift_id) {
//       return withDayTypeOverrides;
//     }

//     const shift = await Shift.findByPk(employee.shift_id);
//     if (!shift) {
//       // Data integrity issue — employee points at a shift_id that doesn't
//       // exist. Same treatment: don't guess, surface it as unevaluated.
//       return withDayTypeOverrides;
//     }

//     return withDayTypeOverrides.map((row) => {
//       if (row.finalStatus === 'Holiday' || row.finalStatus === 'Weekly Off') {
//         return row; // already finalized, skip punch-based evaluation entirely
//       }
//       // Re-evaluates from scratch every request, using whatever check_in/
//       // check_out ended up in `row` — including any regularization override
//       // applied during the merge. This IS the "recalculate on approval"
//       // behavior: there's no separate cached status to go stale, because
//       // the status is always derived fresh from current punch data.
//       const result = evaluateAttendanceStatus(row, shift, employee.grace_minutes);
//       return {
//         ...row,
//         finalStatus: result.status,
//         matchedRule: result.matchedRule,
//         lateMinutes: result.lateMinutes,
//       };
//     });
//   }

//   // ─── Fetch approved regularizations for this employee/range ────────────
//   private async getApprovedRegularizations(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//   ): Promise<ApprovedRegularizationRow[]> {
//     const rows = await AttendanceRegularization.findAll({
//       where: {
//         employee_id: employeeId,
//         status: 'Approved',
//         date: { [Op.between]: [startDate, endDate] },
//       },
//       attributes: ['date', 'requested_check_in', 'requested_check_out'],
//     });

//     return rows.map((r: any) => ({
//       date: r.date,
//       check_in: r.requested_check_in,
//       check_out: r.requested_check_out,
//     }));
//   }

//   // ─── Merge one employee's rows from all three sources, keyed by date ────
//   private mergeByDate(
//     bioRows: MSSQLAttendanceRow[],
//     trakRows: TrakolaAttendanceRow[],
//     regRows: ApprovedRegularizationRow[],
//   ): CombinedAttendanceRow[] {
//     const byDate = new Map<string, { bio?: MSSQLAttendanceRow; trak?: TrakolaAttendanceRow; reg?: ApprovedRegularizationRow }>();

//     for (const r of bioRows) {
//       byDate.set(r.date, { ...byDate.get(r.date), bio: r });
//     }
//     for (const r of trakRows) {
//       byDate.set(r.date, { ...byDate.get(r.date), trak: r });
//     }
//     for (const r of regRows) {
//       byDate.set(r.date, { ...byDate.get(r.date), reg: r });
//     }

//     const result: CombinedAttendanceRow[] = [];

//     for (const [date, { bio, trak, reg }] of byDate.entries()) {

//       const punch_count =
//         (bio?.punch_count ?? 0) +
//         (trak?.punch_count ?? 0);
//       const checkIns = [bio?.check_in, trak?.check_in].filter((v): v is string => !!v);
//       const checkOuts = [bio?.check_out, trak?.check_out].filter((v): v is string => !!v);

//       // "HH:MM:SS" strings sort correctly lexicographically for same-day times
//       const mergedCheckIn = checkIns.length > 0 ? checkIns.sort()[0] : null;
//       const mergedCheckOut = checkOuts.length > 0 ? checkOuts.sort()[checkOuts.length - 1] : null;

//       // Regularization is authoritative for whichever field it actually
//       // provided — a manager approved this specific correction. If it only
//       // corrected one side, the other side still comes from the normal merge.
//       const check_in = reg?.check_in ?? mergedCheckIn;
//       const check_out = reg?.check_out ?? mergedCheckOut;

//       const sources: AttendanceSourceTag[] = [];
//       if (bio) sources.push('Biometric');
//       if (trak) sources.push('Trakola');
//       if (reg && (reg.check_in || reg.check_out)) sources.push('Regularized');

//       const working_hours = check_in && check_out ? this.diffHours(check_in, check_out) : null;

//       let status: CombinedDayStatus = 'No Punches';
//       if (check_in && check_out) status = 'Present';
//       else if (check_in || check_out) status = 'Incomplete';

//       result.push({
//         date, check_in, check_out, working_hours, sources,
//         isRegularized: sources.includes('Regularized'),
//         status,
//         finalStatus: null, matchedRule: null, lateMinutes: null,
//         punch_count
//       });
//     }

//     return result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first
//   }

//   private diffHours(checkIn: string, checkOut: string): number {
//     const [ih, im, is] = checkIn.split(':').map(Number);
//     const [oh, om, os] = checkOut.split(':').map(Number);
//     let inSec = ih * 3600 + im * 60 + (is || 0);
//     let outSec = oh * 3600 + om * 60 + (os || 0);
//     if (outSec < inSec) outSec += 24 * 3600; // overnight guard, same convention as the biometric service
//     return Math.round(((outSec - inSec) / 3600) * 100) / 100;
//   }
// }

// export const attendanceCombinedService = new AttendanceCombinedService();












/**
 * attendance-combined.service.ts
 *
 * Merges Biometric (MSSQL), Trakola, AND approved Regularizations into a
 * single per-day row:
 *   check_in  = the approved regularization's check-in if one was approved
 *               for this date, otherwise the earliest of Biometric/Trakola
 *   check_out = the approved regularization's check-out if approved,
 *               otherwise the latest of Biometric/Trakola
 *   a source with no punch that day contributes null (rendered as a dash) —
 *   we never invent a value for a missing punch.
 *
 * Regularization is treated as AUTHORITATIVE for whichever field it
 * corrected (a manager approved it specifically to fix a wrong/missing
 * punch), not as just another data point folded into the min/max merge —
 * but only for the field it actually provided. If a regularization only
 * corrected check_out, check_in still comes from Biometric/Trakola as usual.
 *
 * Place at: backend/src/modules/attendance/attendance-combined.service.ts
 */

// import { Op } from "sequelize";
// import { Employee } from "../../database/models/Employee";
// import { Shift } from "../../database/models/Shift";
// import { AttendanceRegularization } from "../../database/models/AttendanceRegularization";
// import {
//   attendanceMSSQLService,
//   MSSQLAttendanceRow,
// } from "./attendance.mssql.service";
// import { trakolaService, TrakolaAttendanceRow } from "./trackola.service";
// import { AppError } from "../../middleware/errorHandler.middleware";
// import {
//   evaluateAttendanceStatus,
//   FinalAttendanceStatus,
// } from "./shift-rule-evaluator.service";
// import { holidayService } from "./holiday.service";
// import { isWeeklyOff } from "./weekly-off.util";

// export type CombinedDayStatus = "Present" | "Incomplete" | "No Punches";
// export type AttendanceSourceTag = "Biometric" | "Trakola" | "Regularized";

// interface ApprovedRegularizationRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
// }

// export interface CombinedAttendanceRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
//   working_hours: number | null;
//   sources: AttendanceSourceTag[]; // which source(s) contributed that day — includes 'Regularized' if applicable
//   isRegularized: boolean; // explicit flag for the frontend badge, same info as sources but easier to check
//   status: CombinedDayStatus; // raw merge status (punches exist or not) — kept for debugging/backward compat
//   finalStatus: FinalAttendanceStatus | null; // rule-evaluated status; null if employee has no shift assigned
//   matchedRule: string | null; // which rule fired, e.g. 'PRESENT_STRICT' — for audit
//   lateMinutes: number | null;
//   punch_count: number;
// }

// export class AttendanceCombinedService {
//   /**
//    * Combined attendance for ONE employee over a date range — used by the
//    * self-service "/combined/my" endpoint.
//    */
//   async getCombinedForEmployee(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//     companyId: number,
//   ): Promise<CombinedAttendanceRow[]> {
//     const employee = await Employee.findOne({
//       where: { id: employeeId },
//       attributes: [
//         "employee_code",
//         "first_name",
//         "last_name",
//         "shift_id",
//         "grace_minutes",
//         "saturday_off",
//       ],
//     });
//     if (!employee) throw new AppError("Employee not found", 404);

//     const [bioRows, trakRows, holidayMap, regRows] = await Promise.all([
//       attendanceMSSQLService.getAttendanceByDate(
//         startDate,
//         endDate,
//         employee.employee_code,
//       ),
//       // FIX: Trakola is a third-party dependency outside our control — a
//       // failure/outage on their end should degrade gracefully (fall back to
//       // Biometric-only data for the affected days), not 502 the entire
//       // Combined endpoint. This was the root cause of the reported 502:
//       // Promise.all rejects the whole batch the moment any one promise
//       // rejects, so a single Trakola error was taking Biometric data down
//       // with it even though Biometric had nothing wrong.
//       trakolaService
//         .getNormalizedAttendance(startDate, endDate, employee.employee_code)
//         .catch((e: any) => {
//           console.error(
//             `[attendance-combined] Trakola fetch failed for employee ${employeeId} (${startDate} to ${endDate}) — ` +
//               `continuing with Biometric-only data. Error: ${e.message}`,
//           );
//           return [];
//         }),
//       holidayService.getHolidaysInRange(startDate, endDate, companyId),
//       this.getApprovedRegularizations(employeeId, startDate, endDate),
//     ]);

//     const merged = this.mergeByDate(bioRows, trakRows, regRows);

//     // Holiday and Weekly Off apply BEFORE any punch-based rule, and apply
//     // uniformly regardless of source — a row merged from Biometric,
//     // Trakola, Regularized, any combination, or neither all get the same
//     // override here.
//     const withDayTypeOverrides = merged.map((row) => {
//       const holidayName = holidayMap.get(row.date);
//       if (holidayName) {
//         return {
//           ...row,
//           finalStatus: "Holiday" as FinalAttendanceStatus,
//           matchedRule: `HOLIDAY:${holidayName}`,
//           lateMinutes: 0,
//         };
//       }

//       const weeklyOff = isWeeklyOff(row.date, employee.saturday_off);
//       if (weeklyOff.isOff) {
//         return {
//           ...row,
//           finalStatus: "Weekly Off" as FinalAttendanceStatus,
//           matchedRule: weeklyOff.reason,
//           lateMinutes: 0,
//         };
//       }

//       return row; // untouched — still needs shift-rule evaluation below
//     });

//     // No shift assigned → can't evaluate punch-based rules for the
//     // remaining working days. Holiday/Weekly Off rows above are already
//     // finalized regardless; only the working-day rows are left unevaluated.
//     if (!employee.shift_id) {
//       return withDayTypeOverrides;
//     }

//     const shift = await Shift.findByPk(employee.shift_id);
//     if (!shift) {
//       // Data integrity issue — employee points at a shift_id that doesn't
//       // exist. Same treatment: don't guess, surface it as unevaluated.
//       return withDayTypeOverrides;
//     }

//     return withDayTypeOverrides.map((row) => {
//       if (row.finalStatus === "Holiday" || row.finalStatus === "Weekly Off") {
//         return row; // already finalized, skip punch-based evaluation entirely
//       }
//       // Re-evaluates from scratch every request, using whatever check_in/
//       // check_out ended up in `row` — including any regularization override
//       // applied during the merge. This IS the "recalculate on approval"
//       // behavior: there's no separate cached status to go stale, because
//       // the status is always derived fresh from current punch data.

//       console.log("========== ATTENDANCE DEBUG ==========");
//       console.log({
//         date: row.date,
//         check_in: row.check_in,
//         check_out: row.check_out,
//         employeeId,
//         shiftId: employee.shift_id,
//         shiftStart: shift.start_time,
//         shiftEnd: shift.end_time,
//         shiftDuration: shift.duration_minutes,
//         crossesMidnight: shift.crosses_midnight,
//         graceMinutes: 15,
//       });

//       const result = evaluateAttendanceStatus(
//         row,
//         shift,
//         employee.grace_minutes ?? 15,
//       );
//       console.log("========== EVALUATOR RESULT ==========");
//       console.log(result);
//       return {
//         ...row,
//         finalStatus: result.status,
//         matchedRule: result.matchedRule,
//         lateMinutes: result.lateMinutes,
//       };
//     });
//   }

//   // ─── Fetch approved regularizations for this employee/range ────────────
//   private async getApprovedRegularizations(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//   ): Promise<ApprovedRegularizationRow[]> {
//     const rows = await AttendanceRegularization.findAll({
//       where: {
//         employee_id: employeeId,
//         status: "Approved",
//         date: { [Op.between]: [startDate, endDate] },
//       },
//       attributes: ["date", "requested_check_in", "requested_check_out"],
//     });

//     return rows.map((r: any) => ({
//       date: r.date,
//       check_in: r.requested_check_in,
//       check_out: r.requested_check_out,
//     }));
//   }

//   // ─── Merge one employee's rows from all three sources, keyed by date ────
//   // private mergeByDate(
//   //   bioRows: MSSQLAttendanceRow[],
//   //   trakRows: TrakolaAttendanceRow[],
//   //   regRows: ApprovedRegularizationRow[],
//   // ): CombinedAttendanceRow[] {
//   //   const byDate = new Map<
//   //     string,
//   //     {
//   //       bio?: MSSQLAttendanceRow;
//   //       trak?: TrakolaAttendanceRow;
//   //       reg?: ApprovedRegularizationRow;
//   //     }
//   //   >();

//   //   for (const r of bioRows) {
//   //     byDate.set(r.date, { ...byDate.get(r.date), bio: r });
//   //   }
//   //   for (const r of trakRows) {
//   //     byDate.set(r.date, { ...byDate.get(r.date), trak: r });
//   //   }
//   //   for (const r of regRows) {
//   //     byDate.set(r.date, { ...byDate.get(r.date), reg: r });
//   //   }

//   //   const result: CombinedAttendanceRow[] = [];

//   //   for (const [date, { bio, trak, reg }] of byDate.entries()) {
//   //     const punch_count = (bio?.punch_count ?? 0) + (trak?.punch_count ?? 0);
//   //     const checkIns = [bio?.check_in, trak?.check_in].filter(
//   //       (v): v is string => !!v,
//   //     );
//   //     const checkOuts = [bio?.check_out, trak?.check_out].filter(
//   //       (v): v is string => !!v,
//   //     );

//   //     // "HH:MM:SS" strings sort correctly lexicographically for same-day times
//   //     const mergedCheckIn = checkIns.length > 0 ? checkIns.sort()[0] : null;
//   //     const mergedCheckOut =
//   //       checkOuts.length > 0 ? checkOuts.sort()[checkOuts.length - 1] : null;

//   //     // Regularization is authoritative for whichever field it actually
//   //     // provided — a manager approved this specific correction. If it only
//   //     // corrected one side, the other side still comes from the normal merge.
//   //     const check_in = reg?.check_in ?? mergedCheckIn;
//   //     const check_out = reg?.check_out ?? mergedCheckOut;

//   //     const sources: AttendanceSourceTag[] = [];

//   //     if (bio) {
//   //       sources.push("Biometric");
//   //     }

//   //     if (trak) {
//   //       sources.push("Trakola");
//   //     }

//   //     const hasRegularization =
//   //       !!reg && (reg.check_in !== null || reg.check_out !== null);

//   //     if (hasRegularization) {
//   //       sources.push("Regularized");
//   //     }

//   //     const working_hours =
//   //       check_in && check_out ? this.diffHours(check_in, check_out) : null;

//   //     let status: CombinedDayStatus = "No Punches";
//   //     if (check_in && check_out) status = "Present";
//   //     else if (check_in || check_out) status = "Incomplete";

//   //     result.push({
//   //       date,
//   //       check_in,
//   //       check_out,
//   //       working_hours,
//   //       sources,
//   //       isRegularized: sources.includes("Regularized"),
//   //       status,
//   //       finalStatus: null,
//   //       matchedRule: null,
//   //       lateMinutes: null,
//   //       punch_count,
//   //     });
//   //   }

//   //   return result.sort((a, b) =>
//   //     a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
//   //   ); // newest first
//   // }

//   private mergeByDate(
//     bioRows: MSSQLAttendanceRow[],
//     trakRows: TrakolaAttendanceRow[],
//     regRows: ApprovedRegularizationRow[],
//   ): CombinedAttendanceRow[] {
//     const byDate = new Map<
//       string,
//       {
//         bio?: MSSQLAttendanceRow;
//         trak?: TrakolaAttendanceRow;
//         reg?: ApprovedRegularizationRow;
//       }
//     >();

//     // ------------------------------------------------------------
//     // BIOMETRIC
//     // ------------------------------------------------------------

//     for (const r of bioRows) {
//       const existing = byDate.get(r.date);

//       byDate.set(r.date, {
//         ...existing,
//         bio: r,
//       });
//     }

//     // ------------------------------------------------------------
//     // TRAKOLA
//     // ------------------------------------------------------------

//     for (const r of trakRows) {
//       const existing = byDate.get(r.date);

//       byDate.set(r.date, {
//         ...existing,
//         trak: r,
//       });
//     }

//     // ------------------------------------------------------------
//     // REGULARIZATION
//     // ------------------------------------------------------------

//     for (const r of regRows) {
//       const existing = byDate.get(r.date);

//       byDate.set(r.date, {
//         ...existing,
//         reg: r,
//       });
//     }

//     const result: CombinedAttendanceRow[] = [];

//     // ------------------------------------------------------------
//     // BUILD ONE ROW PER DATE
//     // ------------------------------------------------------------

//     for (const [date, { bio, trak, reg }] of byDate.entries()) {
//       // ----------------------------------------------------------
//       // PUNCH COUNT
//       // ----------------------------------------------------------

//       const punch_count = (bio?.punch_count ?? 0) + (trak?.punch_count ?? 0);

//       // ----------------------------------------------------------
//       // NORMAL CHECK-IN SOURCES
//       // ----------------------------------------------------------

//       const checkIns = [bio?.check_in, trak?.check_in].filter(
//         (value): value is string => Boolean(value),
//       );

//       // ----------------------------------------------------------
//       // NORMAL CHECK-OUT SOURCES
//       // ----------------------------------------------------------

//       const checkOuts = [bio?.check_out, trak?.check_out].filter(
//         (value): value is string => Boolean(value),
//       );

//       // ----------------------------------------------------------
//       // EARLIEST CHECK-IN
//       // ----------------------------------------------------------

//       const mergedCheckIn =
//         checkIns.length > 0 ? [...checkIns].sort()[0] : null;

//       // ----------------------------------------------------------
//       // LATEST CHECK-OUT
//       // ----------------------------------------------------------

//       const mergedCheckOut =
//         checkOuts.length > 0
//           ? [...checkOuts].sort()[checkOuts.length - 1]
//           : null;

//       // ----------------------------------------------------------
//       // REGULARIZATION
//       //
//       // Regularization overrides ONLY the field it provides.
//       // ----------------------------------------------------------

//       const check_in = reg?.check_in ?? mergedCheckIn;

//       const check_out = reg?.check_out ?? mergedCheckOut;

//       // ----------------------------------------------------------
//       // SOURCES
//       //
//       // IMPORTANT:
//       // Each source is pushed ONLY ONCE.
//       // ----------------------------------------------------------

//       const sources: AttendanceSourceTag[] = [];

//       if (bio) {
//         sources.push("Biometric");
//       }

//       if (trak) {
//         sources.push("Trakola");
//       }

//       const hasRegularization =
//         !!reg && (reg.check_in !== null || reg.check_out !== null);

//       if (hasRegularization) {
//         sources.push("Regularized");
//       }

//       // ----------------------------------------------------------
//       // WORKING HOURS
//       // ----------------------------------------------------------

//       const working_hours =
//         check_in && check_out ? this.diffHours(check_in, check_out) : null;

//       // ----------------------------------------------------------
//       // RAW STATUS
//       // ----------------------------------------------------------

//       let status: CombinedDayStatus = "No Punches";

//       if (check_in && check_out) {
//         status = "Present";
//       } else if (check_in || check_out) {
//         status = "Incomplete";
//       }

//       // ----------------------------------------------------------
//       // RESULT
//       // ----------------------------------------------------------

//       result.push({
//         date,
//         check_in,
//         check_out,
//         working_hours,
//         sources,
//         isRegularized: hasRegularization,
//         status,
//         finalStatus: null,
//         matchedRule: null,
//         lateMinutes: null,
//         punch_count,
//       });
//     }

//     // newest first
//     return result.sort((a, b) =>
//       a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
//     );
//   }

//   private diffHours(checkIn: string, checkOut: string): number {
//     const [ih, im, is] = checkIn.split(":").map(Number);
//     const [oh, om, os] = checkOut.split(":").map(Number);
//     let inSec = ih * 3600 + im * 60 + (is || 0);
//     let outSec = oh * 3600 + om * 60 + (os || 0);
//     if (outSec < inSec) outSec += 24 * 3600; // overnight guard, same convention as the biometric service
//     return Math.round(((outSec - inSec) / 3600) * 100) / 100;
//   }
// }

// export const attendanceCombinedService = new AttendanceCombinedService();


// import { Op } from "sequelize";
// import { Employee } from "../../database/models/Employee";
// import { Shift } from "../../database/models/Shift";
// import { AttendanceRegularization } from "../../database/models/AttendanceRegularization";
// import {
//   attendanceMSSQLService,
//   MSSQLAttendanceRow,
// } from "./attendance.mssql.service";
// import { trakolaService, TrakolaAttendanceRow } from "./trackola.service";
// import { AppError } from "../../middleware/errorHandler.middleware";
// import {
//   evaluateAttendanceStatus,
//   FinalAttendanceStatus,
//   AppliedLeaveDetails,
// } from "./shift-rule-evaluator.service";
// import { holidayService } from "./holiday.service";
// import { isWeeklyOff } from "./weekly-off.util";
// import { LeaveRequest, LeaveType } from "@/database/models";
// import { EmployeeLeaveBalance } from "@/database/models/LeaveModels";
// import { resolveLeaveContextForDate } from "./leaveResolver.services";

// export type CombinedDayStatus = "Present" | "Incomplete" | "No Punches";
// export type AttendanceSourceTag = "Biometric" | "Trakola" | "Regularized";

// interface ApprovedRegularizationRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
// }

// export interface CombinedAttendanceRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
//   working_hours: number | null;
//   sources: AttendanceSourceTag[];
//   isRegularized: boolean;
//   status: CombinedDayStatus;
//   finalStatus: FinalAttendanceStatus | null;
//   matchedRule: string | null;
//   lateMinutes: number | null;
//   punch_count: number;
//   scenarioDescription?: string;
//   leaveType?: string | null;
//   leavePosition?: string | null;
//   leaveApproved?: boolean;
//   availableLeaveDays?: number;
// }

// export class AttendanceCombinedService {
//   /**
//    * Combined attendance for ONE employee over a date range.
//    * Pass `useDemoData = true` or request a test range to explicitly receive the full demo list.
//    */
//   async getCombinedForEmployee(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//     companyId: number,
//     useDemoData: boolean = false, // <-- Added optional toggle flag
//   ): Promise<CombinedAttendanceRow[]> {

//     // ── 1. DEMO DATA OVERRIDE / LAST MONTH TESTING FALLBACK ──────────────────
//     if (useDemoData) {
//       return this.getDemoScenarios();
//     }

//     const employee = await Employee.findOne({
//       where: { id: employeeId },
//       attributes: [
//         "employee_code",
//         "first_name",
//         "last_name",
//         "shift_id",
//         "grace_minutes",
//         "saturday_off",
//       ],
//     });
//     if (!employee) throw new AppError("Employee not found", 404);

//     const [bioRows, trakRows, holidayMap, regRows, leaveRequests] = await Promise.all([
//       attendanceMSSQLService.getAttendanceByDate(
//         startDate,
//         endDate,
//         employee.employee_code,
//       ),
//       trakolaService
//         .getNormalizedAttendance(startDate, endDate, employee.employee_code)
//         .catch((e: any) => {
//           console.error(
//             `[attendance-combined] Trakola fetch failed for employee ${employeeId} (${startDate} to ${endDate}) — ` +
//             `continuing with Biometric-only data. Error: ${e.message}`,
//           );
//           return [];
//         }),
//       holidayService.getHolidaysInRange(startDate, endDate, companyId),
//       this.getApprovedRegularizations(employeeId, startDate, endDate),
//       LeaveRequest.findAll({
//         where: {
//           employee_id: employeeId,
//           status: "Approved",
//           from_date: { [Op.lte]: endDate },
//           to_date: { [Op.gte]: startDate },
//         },
//       }),
//     ]);

//     const leaveTypeIds = [
//       ...new Set(
//         leaveRequests.map((request) => request.leave_type_id),
//       ),
//     ];

//     const leaveTypes = await LeaveType.findAll({
//       where: {
//         id: {
//           [Op.in]: leaveTypeIds,
//         },
//       },
//     });

//     const leaveTypesById = new Map(
//       leaveTypes.map((leaveType) => [
//         leaveType.id,
//         leaveType,
//       ]),
//     );

//     const leaveBalances = await EmployeeLeaveBalance.findAll({
//       where: {
//         employee_id: employeeId,
//       },
//     });

//     // const merged = this.mergeByDate(
//     //   bioRows,
//     //   trakRows,
//     //   regRows
//     // );

//     const merged = this.mergeByDate(bioRows, trakRows, regRows);


//     // If query returns empty records for the requested range, fallback to demo scenarios
//     if (merged.length === 0) {
//       return this.getDemoScenarios();
//     }

//     // const withDayTypeOverrides = merged.map((row) => {
//     //   const leaveContext = resolveLeaveContextForDate(
//     //     row.date,
//     //     leaveRequests,
//     //     leaveTypesById,
//     //     leaveBalances,
//     //   );

//     //   const holidayName = holidayMap.get(row.date);
//     //   if (holidayName) {
//     //     return {
//     //       ...row,
//     //       finalStatus: "HOLIDAY" as FinalAttendanceStatus,
//     //       matchedRule: `HOLIDAY:${holidayName}`,
//     //       lateMinutes: 0,
//     //     };
//     //   }

//     //   const weeklyOff = isWeeklyOff(row.date, employee.saturday_off);
//     //   if (weeklyOff.isOff) {
//     //     return {
//     //       ...row,
//     //       finalStatus: "WEEK_OFF" as FinalAttendanceStatus,
//     //       matchedRule: weeklyOff.reason,
//     //       lateMinutes: 0,
//     //     };
//     //   }

//     //   return row;
//     // });

//     const withDayTypeOverrides = merged.map((row) => {
//       const leaveContext = resolveLeaveContextForDate(
//         row.date,
//         leaveRequests,
//         leaveTypesById,
//         leaveBalances,
//       );

//       const holidayName = holidayMap.get(row.date);
//       const weeklyOff = isWeeklyOff(row.date, employee.saturday_off);

//       return {
//         ...row,

//         leaveType: leaveContext.appliedLeave?.type ?? null,
//         leavePosition: leaveContext.appliedLeave?.position ?? null,
//         leaveApproved: leaveContext.appliedLeave?.approved ?? false,
//         availableLeaveDays: leaveContext.availableLeaveDays,

//         // temporary metadata — we can clean this later
//         _isHoliday: !!holidayName,
//         _holidayName: holidayName ?? null,
//         _isWeekOff: weeklyOff.isOff,
//         _weekOffReason: weeklyOff.reason ?? null,
//       };
//     });

//     if (!employee.shift_id) {
//       return withDayTypeOverrides;
//     }

//     const shift = await Shift.findByPk(employee.shift_id);
//     if (!shift) {
//       return withDayTypeOverrides;
//     }

//     return withDayTypeOverrides.map((row) => {
//       if (row.finalStatus === "HOLIDAY" || row.finalStatus === "WEEK_OFF") {
//         return row;
//       }

//       // const result = evaluateAttendanceStatus(
//       //   row,
//       //   shift,
//       //   employee.grace_minutes ?? 15,
//       // );

//       const result = evaluateAttendanceStatus(
//         row,
//         shift,
//         {
//           graceMinutes: employee.grace_minutes ?? 15,
//           isWeekOff: false,
//           isHoliday: false,
//           appliedLeave: leaveContext.appliedLeave,
//           availableLeaveDays: leaveContext.availableLeaveDays,
//         },
//       );

//       return {
//         ...row,
//         finalStatus: result.status,
//         matchedRule: result.matchedRule,
//         lateMinutes: result.lateMinutes,
//       };
//     });
//   }

//   // ─── DEMO LIST / SCENARIO TEST GENERATOR ─────────────────────────────────
//   public getDemoScenarios(): CombinedAttendanceRow[] {
//     const defaultShift: Shift = {
//       id: 1,
//       start_time: "09:00:00",
//       end_time: "18:00:00",
//       duration_minutes: 540,
//       crosses_midnight: false,
//     } as Shift;

//     const graceMinutes = 15;

//     const scenarios: Array<{
//       date: string;
//       check_in: string | null;
//       check_out: string | null;
//       sources: AttendanceSourceTag[];
//       isWeekOff?: boolean;
//       isHoliday?: boolean;
//       appliedLeave?: AppliedLeaveDetails;
//       shiftOverride?: Shift;
//       description: string;
//     }> = [
//         // 1. FULL DAY PRESENT SCENARIOS
//         {
//           date: "2026-03-01",
//           check_in: "08:55:00",
//           check_out: "18:05:00",
//           sources: ["Biometric"],
//           description: "Exact/Punctual full day attendance",
//         },
//         {
//           date: "2026-03-02",
//           check_in: "09:10:00",
//           check_out: "18:00:00",
//           sources: ["Biometric", "Trakola"],
//           description: "In grace period arrival (10 mins late)",
//         },
//         {
//           date: "2026-03-03",
//           check_in: "09:25:00",
//           check_out: "18:25:00",
//           sources: ["Biometric"],
//           description: "Late arrival made up at end of shift (25 mins late -> stay till 18:25)",
//         },

//         // 2. ABSENT SCENARIOS
//         {
//           date: "2026-03-04",
//           check_in: "10:24:38",
//           check_out: "19:07:32",
//           sources: ["Biometric"],
//           description: "Late arrival without complete 9-hr makeup duration -> Full Absent",
//         },
//         {
//           date: "2026-03-05",
//           check_in: "09:00:00",
//           check_out: "12:00:00",
//           sources: ["Biometric"],
//           description: "Left before half-shift -> Full Absent",
//         },

//         // 3. HALF DAY PRESENT SCENARIOS
//         {
//           date: "2026-03-06",
//           check_in: "08:58:00",
//           check_out: "13:30:00",
//           sources: ["Biometric"],
//           description: "Worked strict first-half only",
//         },
//         {
//           date: "2026-03-07",
//           check_in: "13:30:00",
//           check_out: "18:00:00",
//           sources: ["Trakola"],
//           description: "Worked second-half only",
//         },

//         // 4. LEAVE OVERRIDES (CL / EL)
//         {
//           date: "2026-03-08",
//           check_in: null,
//           check_out: null,
//           sources: [],
//           appliedLeave: { type: "CL", position: "FULL_DAY", approved: true },
//           description: "Full Day Casual Leave",
//         },
//         {
//           date: "2026-03-09",
//           check_in: "13:30:00",
//           check_out: "18:00:00",
//           sources: ["Biometric"],
//           appliedLeave: { type: "CL", position: "FIRST_HALF", approved: true },
//           description: "First Half CL + Second Half Present",
//         },
//         {
//           date: "2026-03-10",
//           check_in: null,
//           check_out: null,
//           sources: [],
//           appliedLeave: { type: "EL", position: "FULL_DAY", approved: true },
//           description: "Full Day Earned Leave",
//         },

//         // 5. SHORT LEAVES (SL)
//         {
//           date: "2026-03-11",
//           check_in: "09:25:00",
//           check_out: "18:00:00",
//           sources: ["Biometric"],
//           appliedLeave: { type: "SL_HALF", position: "MORNING", approved: true },
//           description: "30-min Morning Short Leave approved + Present",
//         },
//         {
//           date: "2026-03-12",
//           check_in: "09:00:00",
//           check_out: "17:00:00",
//           sources: ["Biometric"],
//           appliedLeave: { type: "SL_FULL", position: "EVENING", approved: true },
//           description: "60-min Evening Short Leave approved + Present",
//         },

//         // 6. MISSING PUNCHES
//         {
//           date: "2026-03-13",
//           check_in: "08:58:00",
//           check_out: null,
//           sources: ["Biometric"],
//           description: "Missing Check-out Punch",
//         },
//         {
//           date: "2026-03-14",
//           check_in: null,
//           check_out: "18:02:00",
//           sources: ["Trakola"],
//           description: "Missing Check-in Punch",
//         },

//         // 7. WEEK OFF & HOLIDAY OVERRIDES
//         {
//           date: "2026-03-15",
//           check_in: null,
//           check_out: null,
//           sources: [],
//           isWeekOff: true,
//           description: "Standard Weekly Off",
//         },
//         {
//           date: "2026-03-16",
//           check_in: "09:00:00",
//           check_out: "18:00:00",
//           sources: ["Biometric"],
//           isWeekOff: true,
//           description: "Present on Weekly Off (Overtime)",
//         },
//         {
//           date: "2026-03-17",
//           check_in: null,
//           check_out: null,
//           sources: [],
//           isHoliday: true,
//           description: "Public Holiday",
//         },
//         {
//           date: "2026-03-18",
//           check_in: "09:00:00",
//           check_out: "18:00:00",
//           sources: ["Biometric"],
//           isHoliday: true,
//           description: "Present on Public Holiday",
//         },

//         // 8. REGULARIZED PUNCHES
//         {
//           date: "2026-03-19",
//           check_in: "09:00:00",
//           check_out: "18:00:00",
//           sources: ["Biometric", "Regularized"],
//           description: "Punch regularized by Manager",
//         },

//         // 9. OVERNIGHT / MIDNIGHT CROSSING SHIFT
//         {
//           date: "2026-03-20",
//           check_in: "22:00:00",
//           check_out: "06:00:00",
//           sources: ["Biometric"],
//           shiftOverride: {
//             id: 2,
//             start_time: "22:00:00",
//             end_time: "06:00:00",
//             duration_minutes: 480,
//             crosses_midnight: true,
//           } as Shift,
//           description: "Night Shift crossing midnight successfully worked",
//         },
//       ];

//     return scenarios.map((sc) => {
//       const activeShift = sc.shiftOverride || defaultShift;
//       const row: CombinedAttendanceRow = {
//         working_hours:
//           sc.check_in && sc.check_out
//             ? this.diffHours(sc.check_in, sc.check_out)
//             : null,
//         sources: sc.sources,
//         isRegularized: sc.sources.includes("Regularized"),
//         status:
//           sc.check_in && sc.check_out
//             ? "Present"
//             : sc.check_in || sc.check_out
//               ? "Incomplete"
//               : "No Punches",
//         finalStatus: null,
//         matchedRule: null,
//         lateMinutes: null,
//         punch_count: sc.sources.length,
//         scenarioDescription: sc.description,
//       };

//       const result = evaluateAttendanceStatus(
//         row,
//         activeShift,
//         graceMinutes,
//         sc.isWeekOff ?? false,
//         sc.isHoliday ?? false,
//         sc.appliedLeave,
//       );

//       return {
//         ...row,
//         finalStatus: result.status,
//         matchedRule: result.matchedRule,
//         lateMinutes: result.lateMinutes,
//       };
//     });
//   }

//   private async getApprovedRegularizations(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//   ): Promise<ApprovedRegularizationRow[]> {
//     const rows = await AttendanceRegularization.findAll({
//       where: {
//         employee_id: employeeId,
//         status: "Approved",
//         date: { [Op.between]: [startDate, endDate] },
//       },
//       attributes: ["date", "requested_check_in", "requested_check_out"],
//     });

//     return rows.map((r: any) => ({
//       date: r.date,
//       check_in: r.requested_check_in,
//       check_out: r.requested_check_out,
//     }));
//   }

//   private mergeByDate(
//     bioRows: MSSQLAttendanceRow[],
//     trakRows: TrakolaAttendanceRow[],
//     regRows: ApprovedRegularizationRow[],
//   ): CombinedAttendanceRow[] {
//     const byDate = new Map<
//       string,
//       {
//         bio?: MSSQLAttendanceRow;
//         trak?: TrakolaAttendanceRow;
//         reg?: ApprovedRegularizationRow;
//       }
//     >();

//     for (const r of bioRows) {
//       const existing = byDate.get(r.date);
//       byDate.set(r.date, { ...existing, bio: r });
//     }

//     for (const r of trakRows) {
//       const existing = byDate.get(r.date);
//       byDate.set(r.date, { ...existing, trak: r });
//     }

//     for (const r of regRows) {
//       const existing = byDate.get(r.date);
//       byDate.set(r.date, { ...existing, reg: r });
//     }

//     const result: CombinedAttendanceRow[] = [];

//     for (const [date, { bio, trak, reg }] of byDate.entries()) {
//       const punch_count = (bio?.punch_count ?? 0) + (trak?.punch_count ?? 0);

//       const checkIns = [bio?.check_in, trak?.check_in].filter(
//         (value): value is string => Boolean(value),
//       );

//       const checkOuts = [bio?.check_out, trak?.check_out].filter(
//         (value): value is string => Boolean(value),
//       );

//       const mergedCheckIn =
//         checkIns.length > 0 ? [...checkIns].sort()[0] : null;

//       const mergedCheckOut =
//         checkOuts.length > 0
//           ? [...checkOuts].sort()[checkOuts.length - 1]
//           : null;

//       const check_in = reg?.check_in ?? mergedCheckIn;
//       const check_out = reg?.check_out ?? mergedCheckOut;

//       const sources: AttendanceSourceTag[] = [];

//       if (bio) sources.push("Biometric");
//       if (trak) sources.push("Trakola");

//       const hasRegularization =
//         !!reg && (reg.check_in !== null || reg.check_out !== null);

//       if (hasRegularization) sources.push("Regularized");

//       const working_hours =
//         check_in && check_out ? this.diffHours(check_in, check_out) : null;

//       let status: CombinedDayStatus = "No Punches";
//       if (check_in && check_out) status = "Present";
//       else if (check_in || check_out) status = "Incomplete";

//       result.push({
//         date,
//         check_in,
//         check_out,
//         working_hours,
//         sources,
//         isRegularized: hasRegularization,
//         status,
//         finalStatus: null,
//         matchedRule: null,
//         lateMinutes: null,
//         punch_count,
//       });
//     }

//     return result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
//   }

//   private diffHours(checkIn: string, checkOut: string): number {
//     const [ih, im, is] = checkIn.split(":").map(Number);
//     const [oh, om, os] = checkOut.split(":").map(Number);
//     let inSec = ih * 3600 + im * 60 + (is || 0);
//     let outSec = oh * 3600 + om * 60 + (os || 0);
//     if (outSec < inSec) outSec += 24 * 3600;
//     return Math.round(((outSec - inSec) / 3600) * 100) / 100;
//   }
// }

// export const attendanceCombinedService = new AttendanceCombinedService();

// import { Op } from "sequelize";
// import { Employee } from "../../database/models/Employee";
// import { Shift } from "../../database/models/Shift";
// import { AttendanceRegularization } from "../../database/models/AttendanceRegularization";
// import {
//   attendanceMSSQLService,
//   MSSQLAttendanceRow,
// } from "./attendance.mssql.service";
// import {
//   trakolaService,
//   TrakolaAttendanceRow,
// } from "./trackola.service";
// import { AppError } from "../../middleware/errorHandler.middleware";
// import {
//   evaluateAttendanceStatus,
//   FinalAttendanceStatus,
//   AppliedLeaveDetails,
// } from "./shift-rule-evaluator.service";
// import { holidayService } from "./holiday.service";
// import { isWeeklyOff } from "./weekly-off.util";
// import { LeaveRequest, LeaveType } from "@/database/models";
// import { EmployeeLeaveBalance } from "@/database/models/LeaveModels";
// import { resolveLeaveContextForDate } from "./leaveResolver.services";
// export type CombinedDayStatus =
//   | "Present"
//   | "Incomplete"
//   | "No Punches";
// export type AttendanceSourceTag =
//   | "Biometric"
//   | "Trakola"
//   | "Regularized";
// interface ApprovedRegularizationRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
// }
// export interface CombinedAttendanceRow {
//   date: string;
//   check_in: string | null;
//   check_out: string | null;
//   working_hours: number | null;
//   sources: AttendanceSourceTag[];
//   isRegularized: boolean;
//   status: CombinedDayStatus;
//   finalStatus: FinalAttendanceStatus | null;
//   matchedRule: string | null;
//   lateMinutes: number | null;
//   punch_count: number;
//   scenarioDescription?: string;
//   leaveType?: string | null;
//   leavePosition?: string | null;
//   leaveApproved?: boolean;
//   availableLeaveDays?: number;
// }

// export class AttendanceCombinedService {
//   /**
//    * Combined attendance for ONE employee over a date range.
//    */
//   async getCombinedForEmployee(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//     companyId: number,
//     useDemoData: boolean = false,
//   ): Promise<CombinedAttendanceRow[]> {
//     // ============================================================
//     // 1. DEMO DATA
//     // ============================================================

//     if (useDemoData) {
//       return this.getDemoScenarios();
//     }

//     // ============================================================
//     // 2. GET EMPLOYEE
//     // ============================================================

//     const employee = await Employee.findOne({
//       where: {
//         id: employeeId,
//       },
//       attributes: [
//         "employee_code",
//         "first_name",
//         "last_name",
//         "shift_id",
//         "grace_minutes",
//         "saturday_off",
//       ],
//     });

//     if (!employee) {
//       throw new AppError("Employee not found", 404);
//     }

//     // ============================================================
//     // 3. FETCH ALL ATTENDANCE-RELATED DATA
//     // ============================================================

//     const [
//       bioRows,
//       trakRows,
//       holidayMap,
//       regRows,
//       leaveRequests,
//     ] = await Promise.all([
//       // ----------------------------------------------------------
//       // Biometric
//       // ----------------------------------------------------------

//       attendanceMSSQLService.getAttendanceByDate(
//         startDate,
//         endDate,
//         employee.employee_code,
//       ),

//       // ----------------------------------------------------------
//       // Trakola
//       // ----------------------------------------------------------

//       trakolaService
//         .getNormalizedAttendance(
//           startDate,
//           endDate,
//           employee.employee_code,
//         )
//         .catch((error: any) => {
//           console.error(
//             `[attendance-combined] Trakola fetch failed for employee ${employeeId} ` +
//               `(${startDate} to ${endDate}). ` +
//               `Continuing with Biometric-only data.`,
//             error?.message,
//           );

//           return [];
//         }),

//       // ----------------------------------------------------------
//       // Holidays
//       // ----------------------------------------------------------

//       holidayService.getHolidaysInRange(
//         startDate,
//         endDate,
//         companyId,
//       ),

//       // ----------------------------------------------------------
//       // Approved regularizations
//       // ----------------------------------------------------------

//       this.getApprovedRegularizations(
//         employeeId,
//         startDate,
//         endDate,
//       ),

//       // ----------------------------------------------------------
//       // Approved leaves
//       // ----------------------------------------------------------

//       LeaveRequest.findAll({
//         where: {
//           employee_id: employeeId,
//           status: "Approved",

//           from_date: {
//             [Op.lte]: endDate,
//           },

//           to_date: {
//             [Op.gte]: startDate,
//           },
//         },
//       }),
//     ]);


//     console.log(bioRows)
//     console.log(trakRows);

//     // ============================================================
//     // 4. GET LEAVE TYPES
//     // ============================================================

//     const leaveTypeIds = [
//       ...new Set(
//         leaveRequests
//           .map((request: any) => request.leave_type_id)
//           .filter((id) => id !== null && id !== undefined),
//       ),
//     ];

//     const leaveTypes =
//       leaveTypeIds.length > 0
//         ? await LeaveType.findAll({
//             where: {
//               id: {
//                 [Op.in]: leaveTypeIds,
//               },
//             },
//           })
//         : [];

//     const leaveTypesById = new Map(
//       leaveTypes.map((leaveType: any) => [
//         leaveType.id,
//         leaveType,
//       ]),
//     );

//     // ============================================================
//     // 5. GET EMPLOYEE LEAVE BALANCES
//     // ============================================================

//     const leaveBalances = await EmployeeLeaveBalance.findAll({
//       where: {
//         employee_id: employeeId,
//       },
//     });

//     // ============================================================
//     // 6. MERGE BIOMETRIC + TRAKOLA + REGULARIZATION
//     // ============================================================

//     const merged = this.mergeByDate(
//       bioRows,
//       trakRows,
//       regRows,
//     );

//     // ============================================================
//     // 7. NO DATA
//     // ============================================================

//     if (merged.length === 0) {
//       return this.getDemoScenarios();
//     }

//     // ============================================================
//     // 8. GET SHIFT
//     // ============================================================

//     let shift: Shift | null = null;

//     if (employee.shift_id) {
//       shift = await Shift.findByPk(employee.shift_id);
//     }

//     // ============================================================
//     // 9. APPLY DAY TYPE + LEAVE + ATTENDANCE RULES
//     // ============================================================

//     return merged.map((row) => {
//       // ----------------------------------------------------------
//       // Resolve leave for THIS particular date
//       // ----------------------------------------------------------

//       const leaveContext = resolveLeaveContextForDate(
//         row.date,
//         leaveRequests,
//         leaveTypesById,
//         leaveBalances,
//       );

//       // ----------------------------------------------------------
//       // Check holiday
//       // ----------------------------------------------------------

//       const holidayName = holidayMap.get(row.date);
//       const isHoliday = Boolean(holidayName);

//       // ----------------------------------------------------------
//       // Check weekly off
//       // ----------------------------------------------------------

//       const weeklyOff = isWeeklyOff(
//         row.date,
//         employee.saturday_off,
//       );

//       const isWeekOff = weeklyOff.isOff;

//       // ----------------------------------------------------------
//       // Common leave information
//       // ----------------------------------------------------------

//       const leaveType =
//         leaveContext.appliedLeave?.type ?? null;

//       const leavePosition =
//         leaveContext.appliedLeave?.position ?? null;

//       const leaveApproved =
//         leaveContext.appliedLeave?.approved ?? false;

//       const availableLeaveDays =
//         leaveContext.availableLeaveDays;

//       // ==========================================================
//       // HOLIDAY
//       // ==========================================================

//       if (isHoliday) {
//         return {
//           ...row,

//           finalStatus:
//             "HOLIDAY" as FinalAttendanceStatus,

//           matchedRule: holidayName
//             ? `HOLIDAY:${holidayName}`
//             : "HOLIDAY",

//           lateMinutes: 0,

//           leaveType,
//           leavePosition,
//           leaveApproved,
//           availableLeaveDays,
//         };
//       }

//       // ==========================================================
//       // WEEKLY OFF
//       // ==========================================================

//       if (isWeekOff) {
//         return {
//           ...row,

//           finalStatus:
//             "WEEK_OFF" as FinalAttendanceStatus,

//           matchedRule:
//             weeklyOff.reason ?? "WEEKLY_OFF",

//           lateMinutes: 0,

//           leaveType,
//           leavePosition,
//           leaveApproved,
//           availableLeaveDays,
//         };
//       }

//       // ==========================================================
//       // NO SHIFT
//       // ==========================================================

//       if (!shift) {
//         return {
//           ...row,

//           finalStatus: null,
//           matchedRule: null,
//           lateMinutes: null,

//           leaveType,
//           leavePosition,
//           leaveApproved,
//           availableLeaveDays,
//         };
//       }

//       // ==========================================================
//       // NORMAL ATTENDANCE EVALUATION
//       // ==========================================================

//       const result = evaluateAttendanceStatus(
//         row,
//         shift,
//         {
//           graceMinutes:
//             employee.grace_minutes ?? 15,

//           isWeekOff: false,

//           isHoliday: false,

//           appliedLeave:
//             leaveContext.appliedLeave,

//           availableLeaveDays:
//             leaveContext.availableLeaveDays,
//         },
//       );

//       // ==========================================================
//       // FINAL RESPONSE
//       // ==========================================================

//       return {
//         ...row,

//         finalStatus: result.status,

//         matchedRule: result.matchedRule,

//         lateMinutes: result.lateMinutes,

//         leaveType,
//         leavePosition,
//         leaveApproved,
//         availableLeaveDays,
//       };
//     });
//   }

//   // =====================================================================
//   // DEMO SCENARIOS
//   // =====================================================================

//   public getDemoScenarios(): CombinedAttendanceRow[] {
//     const defaultShift: Shift = {
//       id: 1,

//       start_time: "09:00:00",

//       end_time: "18:00:00",

//       duration_minutes: 540,

//       crosses_midnight: false,
//     } as Shift;

//     const graceMinutes = 15;

//     const scenarios: Array<{
//       date: string;

//       check_in: string | null;

//       check_out: string | null;

//       sources: AttendanceSourceTag[];

//       isWeekOff?: boolean;

//       isHoliday?: boolean;

//       appliedLeave?: AppliedLeaveDetails;

//       shiftOverride?: Shift;

//       description: string;
//     }> = [
//       // ============================================================
//       // 1. FULL DAY PRESENT
//       // ============================================================

//       {
//         date: "2026-03-01",

//         check_in: "08:55:00",

//         check_out: "18:05:00",

//         sources: ["Biometric"],

//         description:
//           "Exact/Punctual full day attendance",
//       },

//       {
//         date: "2026-03-02",

//         check_in: "09:10:00",

//         check_out: "18:00:00",

//         sources: ["Biometric", "Trakola"],

//         description:
//           "In grace period arrival (10 mins late)",
//       },

//       {
//         date: "2026-03-03",

//         check_in: "09:25:00",

//         check_out: "18:25:00",

//         sources: ["Biometric"],

//         description:
//           "Late arrival made up at end of shift",
//       },

//       // ============================================================
//       // 2. ABSENT
//       // ============================================================

//       {
//         date: "2026-03-04",

//         check_in: "10:24:38",

//         check_out: "19:07:32",

//         sources: ["Biometric"],

//         description:
//           "Late arrival without complete 9-hour makeup duration",
//       },

//       {
//         date: "2026-03-05",

//         check_in: "09:00:00",

//         check_out: "12:00:00",

//         sources: ["Biometric"],

//         description:
//           "Left before half-shift",
//       },

//       // ============================================================
//       // 3. HALF DAY
//       // ============================================================

//       {
//         date: "2026-03-06",

//         check_in: "08:58:00",

//         check_out: "13:30:00",

//         sources: ["Biometric"],

//         description:
//           "Worked strict first-half only",
//       },

//       {
//         date: "2026-03-07",

//         check_in: "13:30:00",

//         check_out: "18:00:00",

//         sources: ["Trakola"],

//         description:
//           "Worked second-half only",
//       },

//       // ============================================================
//       // 4. CL / EL
//       // ============================================================

//       {
//         date: "2026-03-08",

//         check_in: null,

//         check_out: null,

//         sources: [],

//         appliedLeave: {
//           type: "CL",
//           position: "FULL_DAY",
//           approved: true,
//         },

//         description:
//           "Full Day Casual Leave",
//       },

//       {
//         date: "2026-03-09",

//         check_in: "13:30:00",

//         check_out: "18:00:00",

//         sources: ["Biometric"],

//         appliedLeave: {
//           type: "CL",
//           position: "FIRST_HALF",
//           approved: true,
//         },

//         description:
//           "First Half CL + Second Half Present",
//       },

//       {
//         date: "2026-03-10",

//         check_in: null,

//         check_out: null,

//         sources: [],

//         appliedLeave: {
//           type: "EL",
//           position: "FULL_DAY",
//           approved: true,
//         },

//         description:
//           "Full Day Earned Leave",
//       },

//       // ============================================================
//       // 5. SHORT LEAVE
//       // ============================================================

//       {
//         date: "2026-03-11",

//         check_in: "09:25:00",

//         check_out: "18:00:00",

//         sources: ["Biometric"],

//         appliedLeave: {
//           type: "SL_HALF",
//           position: "MORNING",
//           approved: true,
//         },

//         description:
//           "Morning short leave approved + Present",
//       },

//       {
//         date: "2026-03-12",

//         check_in: "09:00:00",

//         check_out: "17:00:00",

//         sources: ["Biometric"],

//         appliedLeave: {
//           type: "SL_FULL",
//           position: "EVENING",
//           approved: true,
//         },

//         description:
//           "Evening short leave approved + Present",
//       },

//       // ============================================================
//       // 6. MISSING PUNCHES
//       // ============================================================

//       {
//         date: "2026-03-13",

//         check_in: "08:58:00",

//         check_out: null,

//         sources: ["Biometric"],

//         description:
//           "Missing Check-out Punch",
//       },

//       {
//         date: "2026-03-14",

//         check_in: null,

//         check_out: "18:02:00",

//         sources: ["Trakola"],

//         description:
//           "Missing Check-in Punch",
//       },

//       // ============================================================
//       // 7. WEEK OFF / HOLIDAY
//       // ============================================================

//       {
//         date: "2026-03-15",

//         check_in: null,

//         check_out: null,

//         sources: [],

//         isWeekOff: true,

//         description:
//           "Standard Weekly Off",
//       },

//       {
//         date: "2026-03-16",

//         check_in: "09:00:00",

//         check_out: "18:00:00",

//         sources: ["Biometric"],

//         isWeekOff: true,

//         description:
//           "Present on Weekly Off",
//       },

//       {
//         date: "2026-03-17",

//         check_in: null,

//         check_out: null,

//         sources: [],

//         isHoliday: true,

//         description:
//           "Public Holiday",
//       },

//       {
//         date: "2026-03-18",

//         check_in: "09:00:00",

//         check_out: "18:00:00",

//         sources: ["Biometric"],

//         isHoliday: true,

//         description:
//           "Present on Public Holiday",
//       },

//       // ============================================================
//       // 8. REGULARIZATION
//       // ============================================================

//       {
//         date: "2026-03-19",

//         check_in: "09:00:00",

//         check_out: "18:00:00",

//         sources: ["Biometric", "Regularized"],

//         description:
//           "Punch regularized by Manager",
//       },

//       // ============================================================
//       // 9. OVERNIGHT SHIFT
//       // ============================================================

//       {
//         date: "2026-03-20",

//         check_in: "22:00:00",

//         check_out: "06:00:00",

//         sources: ["Biometric"],

//         shiftOverride: {
//           id: 2,

//           start_time: "22:00:00",

//           end_time: "06:00:00",

//           duration_minutes: 480,

//           crosses_midnight: true,
//         } as Shift,

//         description:
//           "Night Shift crossing midnight successfully worked",
//       },
//     ];

//     return scenarios.map((scenario) => {
//       const activeShift =
//         scenario.shiftOverride || defaultShift;

//       // ------------------------------------------------------------
//       // Calculate working hours
//       // ------------------------------------------------------------

//       const working_hours =
//         scenario.check_in &&
//         scenario.check_out
//           ? this.diffHours(
//               scenario.check_in,
//               scenario.check_out,
//             )
//           : null;

//       // ------------------------------------------------------------
//       // Day status
//       // ------------------------------------------------------------

//       let status: CombinedDayStatus = "No Punches";

//       if (
//         scenario.check_in &&
//         scenario.check_out
//       ) {
//         status = "Present";
//       } else if (
//         scenario.check_in ||
//         scenario.check_out
//       ) {
//         status = "Incomplete";
//       }

//       // ------------------------------------------------------------
//       // Build row
//       // ------------------------------------------------------------

//       const row: CombinedAttendanceRow = {
//         date: scenario.date,
//         check_in: scenario.check_in,
//         check_out: scenario.check_out,
//         working_hours,
//         sources: scenario.sources,
//         isRegularized:
//           scenario.sources.includes("Regularized"),
//         status,
//         finalStatus: null,
//         matchedRule: null,
//         lateMinutes: null,
//         punch_count:
//           scenario.sources.length,
//         scenarioDescription:
//           scenario.description,
//         leaveType:
//           scenario.appliedLeave?.type ?? null,
//         leavePosition:
//           scenario.appliedLeave?.position ?? null,
//         leaveApproved:
//           scenario.appliedLeave?.approved ?? false,
//       };
//       // ==========================================================
//       // HOLIDAY
//       // ==========================================================
//       if (scenario.isHoliday) {
//         return {
//           ...row,
//           finalStatus:
//             "HOLIDAY" as FinalAttendanceStatus,
//           matchedRule: "HOLIDAY",
//           lateMinutes: 0,
//         };
//       }
//       // ==========================================================
//       // WEEK OFF
//       // ==========================================================
//       if (scenario.isWeekOff) {
//         return {
//           ...row,
//           finalStatus:
//             "WEEK_OFF" as FinalAttendanceStatus,
//           matchedRule: "WEEKLY_OFF",
//           lateMinutes: 0,
//         };
//       }
//       // ==========================================================
//       // NORMAL EVALUATION
//       // ==========================================================
//       const result = evaluateAttendanceStatus(
//         row,
//         activeShift,
//         {
//           graceMinutes,
//           isWeekOff: false,
//           isHoliday: false,
//           appliedLeave:
//             scenario.appliedLeave,
//           availableLeaveDays:
//             undefined,
//         },
//       );

//       return {
//         ...row,

//         finalStatus: result.status,

//         matchedRule: result.matchedRule,

//         lateMinutes: result.lateMinutes,
//       };
//     });
//   }

//   // =====================================================================
//   // GET APPROVED REGULARIZATIONS
//   // =====================================================================

//   private async getApprovedRegularizations(
//     employeeId: number,
//     startDate: string,
//     endDate: string,
//   ): Promise<ApprovedRegularizationRow[]> {
//     const rows =
//       await AttendanceRegularization.findAll({
//         where: {
//           employee_id: employeeId,

//           status: "Approved",

//           date: {
//             [Op.between]: [
//               startDate,
//               endDate,
//             ],
//           },
//         },

//         attributes: [
//           "date",
//           "requested_check_in",
//           "requested_check_out",
//         ],
//       });

//     return rows.map((row: any) => ({
//       date: row.date,

//       check_in:
//         row.requested_check_in ?? null,

//       check_out:
//         row.requested_check_out ?? null,
//     }));
//   }

//   // =====================================================================
//   // MERGE BIOMETRIC + TRAKOLA + REGULARIZATION
//   // =====================================================================

//   private mergeByDate(
//     bioRows: MSSQLAttendanceRow[],
//     trakRows: TrakolaAttendanceRow[],
//     regRows: ApprovedRegularizationRow[],
//   ): CombinedAttendanceRow[] {
//     const byDate = new Map<
//       string,
//       {
//         bio?: MSSQLAttendanceRow;

//         trak?: TrakolaAttendanceRow;

//         reg?: ApprovedRegularizationRow;
//       }
//     >();

//     // ============================================================
//     // BIOMETRIC
//     // ============================================================

//     for (const row of bioRows) {
//       const existing =
//         byDate.get(row.date);

//       byDate.set(row.date, {
//         ...existing,

//         bio: row,
//       });
//     }

//     // ============================================================
//     // TRAKOLA
//     // ============================================================

//     for (const row of trakRows) {
//       const existing =
//         byDate.get(row.date);

//       byDate.set(row.date, {
//         ...existing,

//         trak: row,
//       });
//     }

//     // ============================================================
//     // REGULARIZATION
//     // ============================================================

//     for (const row of regRows) {
//       const existing =
//         byDate.get(row.date);

//       byDate.set(row.date, {
//         ...existing,

//         reg: row,
//       });
//     }

//     // ============================================================
//     // BUILD RESULT
//     // ============================================================

//     const result: CombinedAttendanceRow[] = [];

//     for (const [
//       date,
//       { bio, trak, reg },
//     ] of byDate.entries()) {
//       // ----------------------------------------------------------
//       // Punch count
//       // ----------------------------------------------------------

//       const punch_count =
//         (bio?.punch_count ?? 0) +
//         (trak?.punch_count ?? 0);

//       // ----------------------------------------------------------
//       // Check-ins
//       // ----------------------------------------------------------

//       const checkIns = [
//         bio?.check_in,
//         trak?.check_in,
//       ].filter(
//         (
//           value,
//         ): value is string =>
//           Boolean(value),
//       );

//       // ----------------------------------------------------------
//       // Check-outs
//       // ----------------------------------------------------------

//       const checkOuts = [
//         bio?.check_out,
//         trak?.check_out,
//       ].filter(
//         (
//           value,
//         ): value is string =>
//           Boolean(value),
//       );

//       // ----------------------------------------------------------
//       // Earliest check-in
//       // ----------------------------------------------------------

//       const mergedCheckIn =
//         checkIns.length > 0
//           ? [...checkIns].sort()[0]
//           : null;

//       // ----------------------------------------------------------
//       // Latest check-out
//       // ----------------------------------------------------------

//       const mergedCheckOut =
//         checkOuts.length > 0
//           ? [...checkOuts].sort()[
//               checkOuts.length - 1
//             ]
//           : null;

//       // ----------------------------------------------------------
//       // Regularization has highest priority
//       // ----------------------------------------------------------

//       const check_in =
//         reg?.check_in ??
//         mergedCheckIn;

//       const check_out =
//         reg?.check_out ??
//         mergedCheckOut;

//       // ----------------------------------------------------------
//       // Sources
//       // ----------------------------------------------------------

//       const sources: AttendanceSourceTag[] =
//         [];

//       if (bio) {
//         sources.push("Biometric");
//       }

//       if (trak) {
//         sources.push("Trakola");
//       }

//       const hasRegularization =
//         Boolean(reg) &&
//         (
//           reg?.check_in !== null ||
//           reg?.check_out !== null
//         );

//       if (hasRegularization) {
//         sources.push("Regularized");
//       }

//       // ----------------------------------------------------------
//       // Working hours
//       // ----------------------------------------------------------

//       const working_hours =
//         check_in && check_out
//           ? this.diffHours(
//               check_in,
//               check_out,
//             )
//           : null;

//       // ----------------------------------------------------------
//       // Basic day status
//       // ----------------------------------------------------------

//       let status: CombinedDayStatus =
//         "No Punches";

//       if (
//         check_in &&
//         check_out
//       ) {
//         status = "Present";
//       } else if (
//         check_in ||
//         check_out
//       ) {
//         status = "Incomplete";
//       }

//       // ----------------------------------------------------------
//       // Push
//       // ----------------------------------------------------------

//       result.push({
//         date,

//         check_in,

//         check_out,

//         working_hours,

//         sources,

//         isRegularized:
//           hasRegularization,

//         status,

//         finalStatus: null,

//         matchedRule: null,

//         lateMinutes: null,

//         punch_count,
//       });
//     }

//     // ============================================================
//     // SORT DESCENDING
//     // ============================================================

//     return result.sort((a, b) =>
//       a.date < b.date
//         ? 1
//         : a.date > b.date
//           ? -1
//           : 0,
//     );
//   }

//   // =====================================================================
//   // TIME DIFFERENCE
//   // =====================================================================

//   private diffHours(
//     checkIn: string,
//     checkOut: string,
//   ): number {
//     const [
//       inHour,
//       inMinute,
//       inSecond = 0,
//     ] = checkIn
//       .split(":")
//       .map(Number);

//     const [
//       outHour,
//       outMinute,
//       outSecond = 0,
//     ] = checkOut
//       .split(":")
//       .map(Number);

//     let inSeconds =
//       inHour * 3600 +
//       inMinute * 60 +
//       inSecond;

//     let outSeconds =
//       outHour * 3600 +
//       outMinute * 60 +
//       outSecond;

//     // ------------------------------------------------------------
//     // Overnight shift
//     // ------------------------------------------------------------

//     if (outSeconds < inSeconds) {
//       outSeconds += 24 * 60 * 60;
//     }

//     const differenceSeconds =
//       outSeconds - inSeconds;

//     return Math.round(
//       (differenceSeconds / 3600) * 100,
//     ) / 100;
//   }
// }

// export const attendanceCombinedService =
//   new AttendanceCombinedService();













import { Op } from "sequelize";
// import { Shift } from "../../database/models/Shift";
// import { AttendanceRegularization } from "../../database/models/AttendanceRegularization";
import {
  attendanceMSSQLService,
  MSSQLAttendanceRow,
} from "./attendance.mssql.service";
import {
  trakolaService,
  TrakolaAttendanceRow,
} from "./trackola.service";
// import { AppError } from "../../middleware/errorHandler.middleware";
import {
  evaluateAttendanceStatus,
  FinalAttendanceStatus,
  AppliedLeaveDetails,
} from "./shift-rule-evaluator.service";
import { holidayService } from "./holiday.service";
import { isWeeklyOff } from "./weekly-off.util";
import { AttendanceRegularization, Employee, LeaveRequest, LeaveType, Shift } from "../../database/models";
import { resolveLeaveContextForDate } from "./leaveResolver.services";
import { AppError } from "../../middleware/errorHandler.middleware";

export type CombinedDayStatus =
  | "Present"
  | "Incomplete"
  | "No Punches";

export type AttendanceSourceTag =
  | "Biometric"
  | "Trakola"
  | "Regularized";

interface ApprovedRegularizationRow {
  date: string;
  check_in: string | null;
  check_out: string | null;
}

export interface CombinedAttendanceRow {
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  sources: AttendanceSourceTag[];
  isRegularized: boolean;
  status: CombinedDayStatus;
  finalStatus: FinalAttendanceStatus | null;
  matchedRule: string | null;
  lateMinutes: number | null;
  punch_count: number;
  scenarioDescription?: string;
  leaveType?: string | null;
  leavePosition?: string | null;
  leaveApproved?: boolean;
  availableLeaveDays?: number;
}

export class AttendanceCombinedService {
  /**
   * Combined attendance for ONE employee over a date range.
   *
   * IMPORTANT:
   * Every date between startDate and endDate is included,
   * even when there is no biometric, Trakola, or regularization data.
   */
  async getCombinedForEmployee(
    employeeId: number,
    startDate: string,
    endDate: string,
    companyId: number,
  ): Promise<CombinedAttendanceRow[]> {
    // ============================================================
    // 1. GET EMPLOYEE
    // ============================================================

    const employee = await Employee.findOne({
      where: {
        id: employeeId,
      },
      attributes: [
        "employee_code",
        "first_name",
        "last_name",
        "shift_id",
        "grace_minutes",
        "saturday_off",
      ],
    });

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    // ============================================================
    // 2. FETCH ALL ATTENDANCE-RELATED DATA
    // ============================================================

    const [
      bioRows,
      trakRows,
      holidayMap,
      regRows,
      leaveRequests,
    ] = await Promise.all([
      // ----------------------------------------------------------
      // Biometric
      // ----------------------------------------------------------

      attendanceMSSQLService.getAttendanceByDate(
        startDate,
        endDate,
        employee.employee_code,
      ),

      // ----------------------------------------------------------
      // Trakola
      // ----------------------------------------------------------

      trakolaService
        .getNormalizedAttendance(
          startDate,
          endDate,
          employee.employee_code,
        )
        .catch((error: any) => {
          console.error(
            `[attendance-combined] Trakola fetch failed for employee ${employeeId} ` +
            `(${startDate} to ${endDate}). ` +
            `Continuing with Biometric-only data.`,
            error?.message,
          );

          return [];
        }),

      // ----------------------------------------------------------
      // Holidays
      // ----------------------------------------------------------

      holidayService.getHolidaysInRange(
        startDate,
        endDate,
        companyId,
      ),

      // ----------------------------------------------------------
      // Approved regularizations
      // ----------------------------------------------------------

      this.getApprovedRegularizations(
        employeeId,
        startDate,
        endDate,
      ),

      // ----------------------------------------------------------
      // Approved leaves
      // ----------------------------------------------------------

      LeaveRequest.findAll({
        where: {
          employee_id: employeeId,
          status: "Approved",

          from_date: {
            [Op.lte]: endDate,
          },

          to_date: {
            [Op.gte]: startDate,
          },
        },
      }),
    ]);


    // ============================================================
    // 3. GET LEAVE TYPES
    // ============================================================

    const leaveTypeIds = [
      ...new Set(
        leaveRequests
          .map((request: any) => request.leave_type_id)
          .filter(
            (id) => id !== null && id !== undefined,
          ),
      ),
    ];

    const leaveTypes =
      leaveTypeIds.length > 0
        ? await LeaveType.findAll({
          where: {
            id: {
              [Op.in]: leaveTypeIds,
            },
          },
        })
        : [];

    const leaveTypesById = new Map(
      leaveTypes.map((leaveType: any) => [
        leaveType.id,
        leaveType,
      ]),
    );

    // ============================================================
    // 4. GET EMPLOYEE LEAVE BALANCES
    // ============================================================

    // const leaveBalances = await EmployeeLeaveBalance.findAll({
    //   where: {
    //     employee_id: employeeId,
    //   },
    // });

    // ============================================================
    // 5. MERGE BIOMETRIC + TRAKOLA + REGULARIZATION
    //
    // IMPORTANT:
    // mergeByDate() creates ALL dates between startDate/endDate.
    // Therefore a completely missing attendance day is preserved.
    // ============================================================

    const merged = this.mergeByDate(
      bioRows,
      trakRows,
      regRows,
      startDate,
      endDate,
    );

    // ============================================================
    // 6. GET SHIFT
    // ============================================================

    let shift: Shift | null = null;

    if (employee.shift_id) {
      shift = await Shift.findByPk(employee.shift_id);
    }

    // ============================================================
    // 7. APPLY DAY TYPE + LEAVE + ATTENDANCE RULES
    // ============================================================

    return merged.map((row) => {
      // ----------------------------------------------------------
      // Resolve leave for THIS particular date
      // ----------------------------------------------------------

      const leaveContext = resolveLeaveContextForDate(
        row.date,
        leaveRequests,
        leaveTypesById,
        // leaveBalances,
      );

      // ----------------------------------------------------------
      // Check holiday
      // ----------------------------------------------------------

      const holidayName = holidayMap.get(row.date);
      const isHoliday = Boolean(holidayName);

      // ----------------------------------------------------------
      // Check weekly off
      // ----------------------------------------------------------

      const weeklyOff = isWeeklyOff(
        row.date,
        employee.saturday_off,
      );

      const isWeekOff = weeklyOff.isOff;

      // ----------------------------------------------------------
      // Common leave information
      // ----------------------------------------------------------

      const leaveType =
        leaveContext.appliedLeave?.type ?? null;

      const leavePosition =
        leaveContext.appliedLeave?.position ?? null;

      const leaveApproved =
        leaveContext.appliedLeave?.approved ?? false;

      // const availableLeaveDays =
      //   leaveContext.availableLeaveDays;

      // ==========================================================
      // HOLIDAY
      // ==========================================================

      if (isHoliday) {
        return {
          ...row,

          finalStatus:
            "HOLIDAY" as FinalAttendanceStatus,

          matchedRule: holidayName
            ? `HOLIDAY:${holidayName}`
            : "HOLIDAY",

          lateMinutes: 0,

          leaveType,
          leavePosition,
          leaveApproved,
          // availableLeaveDays,
        };
      }

      // ==========================================================
      // WEEKLY OFF
      // ==========================================================

      if (isWeekOff) {
        return {
          ...row,

          finalStatus:
            "WEEK_OFF" as FinalAttendanceStatus,

          matchedRule:
            weeklyOff.reason ?? "WEEKLY_OFF",

          lateMinutes: 0,

          leaveType,
          leavePosition,
          leaveApproved,
          // availableLeaveDays,
        };
      }

      // ==========================================================
      // NO SHIFT
      // ==========================================================

      if (!shift) {
        return {
          ...row,

          finalStatus: null,
          matchedRule: null,
          lateMinutes: null,

          leaveType,
          leavePosition,
          leaveApproved,
          // availableLeaveDays,
        };
      }

      // ==========================================================
      // NORMAL ATTENDANCE EVALUATION
      // ==========================================================

      const result = evaluateAttendanceStatus(
        row,
        shift,
        {
          graceMinutes:
            employee.grace_minutes ?? 15,

          isWeekOff: false,

          isHoliday: false,

          appliedLeave:
            leaveContext.appliedLeave,

          // availableLeaveDays:
          //   leaveContext.availableLeaveDays,
        },
      );

      // ==========================================================
      // FINAL RESPONSE
      // ==========================================================

      return {
        ...row,

        finalStatus: result.status,

        matchedRule: result.matchedRule,

        lateMinutes: result.lateMinutes,

        leaveType,
        leavePosition,
        leaveApproved,
        // availableLeaveDays,
      };
    });
  }

  // =====================================================================
  // GET APPROVED REGULARIZATIONS
  // =====================================================================

  private async getApprovedRegularizations(
    employeeId: number,
    startDate: string,
    endDate: string,
  ): Promise<ApprovedRegularizationRow[]> {
    const rows =
      await AttendanceRegularization.findAll({
        where: {
          employee_id: employeeId,

          status: "Approved",

          date: {
            [Op.between]: [
              startDate,
              endDate,
            ],
          },
        },

        attributes: [
          "date",
          "requested_check_in",
          "requested_check_out",
        ],
      });

    return rows.map((row: any) => ({
      date: row.date,

      check_in:
        row.requested_check_in ?? null,

      check_out:
        row.requested_check_out ?? null,
    }));
  }

  // =====================================================================
  // GENERATE EVERY DATE IN RANGE
  // =====================================================================

  private generateDateRange(
    startDate: string,
    endDate: string,
  ): string[] {
    const dates: string[] = [];

    const current = new Date(
      `${startDate}T00:00:00`,
    );

    const end = new Date(
      `${endDate}T00:00:00`,
    );

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(
        current.getMonth() + 1,
      ).padStart(2, "0");

      const day = String(
        current.getDate(),
      ).padStart(2, "0");

      dates.push(
        `${year}-${month}-${day}`,
      );

      current.setDate(
        current.getDate() + 1,
      );
    }

    return dates;
  }

  // =====================================================================
  // MERGE BIOMETRIC + TRAKOLA + REGULARIZATION
  // =====================================================================

  private mergeByDate(
    bioRows: MSSQLAttendanceRow[],
    trakRows: TrakolaAttendanceRow[],
    regRows: ApprovedRegularizationRow[],
    startDate: string,
    endDate: string,
  ): CombinedAttendanceRow[] {
    const byDate = new Map<
      string,
      {
        bio?: MSSQLAttendanceRow;
        trak?: TrakolaAttendanceRow;
        reg?: ApprovedRegularizationRow;
      }
    >();

    // ============================================================
    // IMPORTANT:
    // Initialize ALL dates first.
    //
    // This is the main fix for missing absent dates.
    // ============================================================

    const allDates = this.generateDateRange(
      startDate,
      endDate,
    );

    for (const date of allDates) {
      byDate.set(date, {});
    }

    // ============================================================
    // BIOMETRIC
    // ============================================================

    for (const row of bioRows) {
      const existing = byDate.get(row.date);

      byDate.set(row.date, {
        ...existing,
        bio: row,
      });
    }

    // ============================================================
    // TRAKOLA
    // ============================================================

    for (const row of trakRows) {
      const existing = byDate.get(row.date);

      byDate.set(row.date, {
        ...existing,
        trak: row,
      });
    }

    // ============================================================
    // REGULARIZATION
    // ============================================================

    for (const row of regRows) {
      const existing = byDate.get(row.date);

      byDate.set(row.date, {
        ...existing,
        reg: row,
      });
    }

    // ============================================================
    // BUILD RESULT
    // ============================================================

    const result: CombinedAttendanceRow[] = [];

    for (const [
      date,
      { bio, trak, reg },
    ] of byDate.entries()) {
      // ----------------------------------------------------------
      // Punch count
      // ----------------------------------------------------------

      // const punch_count =
      //   (bio?.punch_count ?? 0) +
      //   (trak?.punch_count ?? 0);

      const punch_count =
        (bio?.punch_count ?? 0) +
        (trak
          ? (trak.check_in ? 1 : 0) +
          (trak.check_out ? 1 : 0)
          : 0);

      // ----------------------------------------------------------
      // Check-ins
      // ----------------------------------------------------------

      const checkIns = [
        bio?.check_in,
        trak?.check_in,
      ].filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

      // ----------------------------------------------------------
      // Check-outs
      // ----------------------------------------------------------

      const checkOuts = [
        bio?.check_out,
        trak?.check_out,
      ].filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

      // ----------------------------------------------------------
      // Earliest check-in
      // ----------------------------------------------------------

      const mergedCheckIn =
        checkIns.length > 0
          ? [...checkIns].sort()[0]
          : null;

      // ----------------------------------------------------------
      // Latest check-out
      // ----------------------------------------------------------

      const mergedCheckOut =
        checkOuts.length > 0
          ? [...checkOuts].sort()[
          checkOuts.length - 1
          ]
          : null;

      // ----------------------------------------------------------
      // Regularization has highest priority
      // ----------------------------------------------------------

      const check_in =
        reg?.check_in ??
        mergedCheckIn;

      const check_out =
        reg?.check_out ??
        mergedCheckOut;

      // ----------------------------------------------------------
      // Sources
      // ----------------------------------------------------------

      const sources: AttendanceSourceTag[] =
        [];

      if (bio) {
        sources.push("Biometric");
      }

      if (trak) {
        sources.push("Trakola");
      }

      const hasRegularization =
        Boolean(reg) &&
        (
          reg?.check_in !== null ||
          reg?.check_out !== null
        );

      if (hasRegularization) {
        sources.push("Regularized");
      }

      // ----------------------------------------------------------
      // Working hours
      // ----------------------------------------------------------
      const working_hours =
        check_in && check_out
          ? this.diffHours(
            check_in,
            check_out,
          )
          : null;
      // ----------------------------------------------------------
      // Basic day status
      // ----------------------------------------------------------
      let status: CombinedDayStatus =
        "No Punches";
      if (
        check_in &&
        check_out
      ) {
        status = "Present";
      } else if (
        check_in ||
        check_out
      ) {
        status = "Incomplete";
      }
      // ----------------------------------------------------------
      // Push
      // ----------------------------------------------------------
      result.push({
        date,
        check_in,
        check_out,
        working_hours,
        sources,
        isRegularized:
          hasRegularization,
        status,
        finalStatus: null,
        matchedRule: null,
        lateMinutes: null,
        punch_count,
      });
    }
    // ============================================================
    // SORT DESCENDING
    // ============================================================

    return result.sort((a, b) =>
      a.date < b.date
        ? 1
        : a.date > b.date
          ? -1
          : 0,
    );
  }

  // =====================================================================
  // TIME DIFFERENCE
  // =====================================================================

  private diffHours(
    checkIn: string,
    checkOut: string,
  ): number {
    const [
      inHour,
      inMinute,
      inSecond = 0,
    ] = checkIn
      .split(":")
      .map(Number);

    const [
      outHour,
      outMinute,
      outSecond = 0,
    ] = checkOut
      .split(":")
      .map(Number);

    let inSeconds =
      inHour * 3600 +
      inMinute * 60 +
      inSecond;

    let outSeconds =
      outHour * 3600 +
      outMinute * 60 +
      outSecond;

    // ------------------------------------------------------------
    // Overnight shift
    // ------------------------------------------------------------

    if (outSeconds < inSeconds) {
      outSeconds += 24 * 60 * 60;
    }

    const differenceSeconds =
      outSeconds - inSeconds;

    return Math.round(
      (differenceSeconds / 3600) * 100,
    ) / 100;
  }
}

export const attendanceCombinedService =
  new AttendanceCombinedService();