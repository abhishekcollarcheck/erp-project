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

import { Op } from 'sequelize';
import { Employee } from '../../database/models/Employee';
import { Shift } from '../../database/models/Shift';
import { AttendanceRegularization } from '../../database/models/AttendanceRegularization';
import { attendanceMSSQLService, MSSQLAttendanceRow } from './attendance.mssql.service';
import { trakolaService, TrakolaAttendanceRow } from './trackola.service';
import { AppError } from '../../middleware/errorHandler.middleware';
import { evaluateAttendanceStatus, FinalAttendanceStatus } from './shift-rule-evaluator.service';
import { holidayService } from './holiday.service';
import { isWeeklyOff } from './weekly-off.util';

export type CombinedDayStatus = 'Present' | 'Incomplete' | 'No Punches';
export type AttendanceSourceTag = 'Biometric' | 'Trakola' | 'Regularized';

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
  sources: AttendanceSourceTag[]; // which source(s) contributed that day — includes 'Regularized' if applicable
  isRegularized: boolean;         // explicit flag for the frontend badge, same info as sources but easier to check
  status: CombinedDayStatus;      // raw merge status (punches exist or not) — kept for debugging/backward compat
  finalStatus: FinalAttendanceStatus | null; // rule-evaluated status; null if employee has no shift assigned
  matchedRule: string | null;                // which rule fired, e.g. 'PRESENT_STRICT' — for audit
  lateMinutes: number | null;                 // actual lateness that day, null if not evaluated
}

export class AttendanceCombinedService {
  /**
   * Combined attendance for ONE employee over a date range — used by the
   * self-service "/combined/my" endpoint.
   */
  async getCombinedForEmployee(
    employeeId: number,
    startDate: string,
    endDate: string,
    companyId: number,
  ): Promise<CombinedAttendanceRow[]> {
    const employee = await Employee.findOne({
      where: { id: employeeId },
      attributes: ['employee_code', 'first_name', 'last_name', 'shift_id', 'grace_minutes', 'saturday_off'],
    });
    if (!employee) throw new AppError('Employee not found', 404);

    const [bioRows, trakRows, holidayMap, regRows] = await Promise.all([
      attendanceMSSQLService.getAttendanceByDate(startDate, endDate, employee.employee_code),
      // FIX: Trakola is a third-party dependency outside our control — a
      // failure/outage on their end should degrade gracefully (fall back to
      // Biometric-only data for the affected days), not 502 the entire
      // Combined endpoint. This was the root cause of the reported 502:
      // Promise.all rejects the whole batch the moment any one promise
      // rejects, so a single Trakola error was taking Biometric data down
      // with it even though Biometric had nothing wrong.
      trakolaService.getNormalizedAttendance(startDate, endDate, employee.employee_code).catch((e: any) => {
        console.error(
          `[attendance-combined] Trakola fetch failed for employee ${employeeId} (${startDate} to ${endDate}) — ` +
          `continuing with Biometric-only data. Error: ${e.message}`,
        );
        return [];
      }),
      holidayService.getHolidaysInRange(startDate, endDate, companyId),
      this.getApprovedRegularizations(employeeId, startDate, endDate),
    ]);

    const merged = this.mergeByDate(bioRows, trakRows, regRows);

    // Holiday and Weekly Off apply BEFORE any punch-based rule, and apply
    // uniformly regardless of source — a row merged from Biometric,
    // Trakola, Regularized, any combination, or neither all get the same
    // override here.
    const withDayTypeOverrides = merged.map((row) => {
      const holidayName = holidayMap.get(row.date);
      if (holidayName) {
        return { ...row, finalStatus: 'Holiday' as FinalAttendanceStatus, matchedRule: `HOLIDAY:${holidayName}`, lateMinutes: 0 };
      }

      const weeklyOff = isWeeklyOff(row.date, employee.weekly_off);
      if (weeklyOff.isOff) {
        return { ...row, finalStatus: 'Weekly Off' as FinalAttendanceStatus, matchedRule: weeklyOff.reason, lateMinutes: 0 };
      }

      return row; // untouched — still needs shift-rule evaluation below
    });

    // No shift assigned → can't evaluate punch-based rules for the
    // remaining working days. Holiday/Weekly Off rows above are already
    // finalized regardless; only the working-day rows are left unevaluated.
    if (!employee.shift_id) {
      return withDayTypeOverrides;
    }

    const shift = await Shift.findByPk(employee.shift_id);
    if (!shift) {
      // Data integrity issue — employee points at a shift_id that doesn't
      // exist. Same treatment: don't guess, surface it as unevaluated.
      return withDayTypeOverrides;
    }

    return withDayTypeOverrides.map((row) => {
      if (row.finalStatus === 'Holiday' || row.finalStatus === 'Weekly Off') {
        return row; // already finalized, skip punch-based evaluation entirely
      }
      // Re-evaluates from scratch every request, using whatever check_in/
      // check_out ended up in `row` — including any regularization override
      // applied during the merge. This IS the "recalculate on approval"
      // behavior: there's no separate cached status to go stale, because
      // the status is always derived fresh from current punch data.
      const result = evaluateAttendanceStatus(row, shift, employee.grace_minutes);
      return {
        ...row,
        finalStatus: result.status,
        matchedRule: result.matchedRule,
        lateMinutes: result.lateMinutes,
      };
    });
  }

  // ─── Fetch approved regularizations for this employee/range ────────────
  private async getApprovedRegularizations(
    employeeId: number,
    startDate: string,
    endDate: string,
  ): Promise<ApprovedRegularizationRow[]> {
    const rows = await AttendanceRegularization.findAll({
      where: {
        employee_id: employeeId,
        status: 'Approved',
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['date', 'requested_check_in', 'requested_check_out'],
    });

    return rows.map((r: any) => ({
      date: r.date,
      check_in: r.requested_check_in,
      check_out: r.requested_check_out,
    }));
  }

  // ─── Merge one employee's rows from all three sources, keyed by date ────
  private mergeByDate(
    bioRows: MSSQLAttendanceRow[],
    trakRows: TrakolaAttendanceRow[],
    regRows: ApprovedRegularizationRow[],
  ): CombinedAttendanceRow[] {
    const byDate = new Map<string, { bio?: MSSQLAttendanceRow; trak?: TrakolaAttendanceRow; reg?: ApprovedRegularizationRow }>();

    for (const r of bioRows) {
      byDate.set(r.date, { ...byDate.get(r.date), bio: r });
    }
    for (const r of trakRows) {
      byDate.set(r.date, { ...byDate.get(r.date), trak: r });
    }
    for (const r of regRows) {
      byDate.set(r.date, { ...byDate.get(r.date), reg: r });
    }

    const result: CombinedAttendanceRow[] = [];

    for (const [date, { bio, trak, reg }] of byDate.entries()) {
      const checkIns = [bio?.check_in, trak?.check_in].filter((v): v is string => !!v);
      const checkOuts = [bio?.check_out, trak?.check_out].filter((v): v is string => !!v);

      // "HH:MM:SS" strings sort correctly lexicographically for same-day times
      const mergedCheckIn = checkIns.length > 0 ? checkIns.sort()[0] : null;
      const mergedCheckOut = checkOuts.length > 0 ? checkOuts.sort()[checkOuts.length - 1] : null;

      // Regularization is authoritative for whichever field it actually
      // provided — a manager approved this specific correction. If it only
      // corrected one side, the other side still comes from the normal merge.
      const check_in = reg?.check_in ?? mergedCheckIn;
      const check_out = reg?.check_out ?? mergedCheckOut;

      const sources: AttendanceSourceTag[] = [];
      if (bio) sources.push('Biometric');
      if (trak) sources.push('Trakola');
      if (reg && (reg.check_in || reg.check_out)) sources.push('Regularized');

      const working_hours = check_in && check_out ? this.diffHours(check_in, check_out) : null;

      let status: CombinedDayStatus = 'No Punches';
      if (check_in && check_out) status = 'Present';
      else if (check_in || check_out) status = 'Incomplete';

      result.push({
        date, check_in, check_out, working_hours, sources,
        isRegularized: sources.includes('Regularized'),
        status,
        finalStatus: null, matchedRule: null, lateMinutes: null,
      });
    }

    return result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first
  }

  private diffHours(checkIn: string, checkOut: string): number {
    const [ih, im, is] = checkIn.split(':').map(Number);
    const [oh, om, os] = checkOut.split(':').map(Number);
    let inSec = ih * 3600 + im * 60 + (is || 0);
    let outSec = oh * 3600 + om * 60 + (os || 0);
    if (outSec < inSec) outSec += 24 * 3600; // overnight guard, same convention as the biometric service
    return Math.round(((outSec - inSec) / 3600) * 100) / 100;
  }
}

export const attendanceCombinedService = new AttendanceCombinedService();