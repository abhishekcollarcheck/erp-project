/**
 * attendance-combined.service.ts
 *
 * Merges Biometric (MSSQL) and Trakola attendance into a single per-day row:
 *   check_in  = earliest of the two sources' check-in (whichever exists)
 *   check_out = latest of the two sources' check-out (whichever exists)
 *   a source with no punch that day contributes null (rendered as a dash) —
 *   we never invent a value for a missing punch.
 *
 * Place at: backend/src/modules/attendance/attendance-combined.service.ts
 */

import { Employee } from '../../database/models/Employee';
import { Shift } from '../../database/models';
import { attendanceMSSQLService, MSSQLAttendanceRow } from './attendance.mssql.service';
import { trakolaService, TrakolaAttendanceRow } from './trackola.service';
import { AppError } from '../../middleware/errorHandler.middleware';
import { evaluateAttendanceStatus, FinalAttendanceStatus } from './shift-rule-evaluator.service';

export type CombinedDayStatus = 'Present' | 'Incomplete' | 'No Punches';
export type AttendanceSourceTag = 'Biometric' | 'Trakola';

export interface CombinedAttendanceRow {
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  sources: AttendanceSourceTag[]; // which source(s) had a punch that day
  status: CombinedDayStatus;
  finalStatus: FinalAttendanceStatus | null;
  matchedRule: string | null;
  lateMinutes: number | null;
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
  ): Promise<CombinedAttendanceRow[]> {
    const employee = await Employee.findOne({
      where: { id: employeeId },
      attributes: ['employee_code', 'first_name', 'last_name'],
    });
    if (!employee) throw new AppError('Employee not found', 404);

    const [bioRows, trakRows] = await Promise.all([
      attendanceMSSQLService.getAttendanceByDate(startDate, endDate, employee.employee_code),
      trakolaService.getNormalizedAttendance(startDate, endDate, employee.employee_code),
    ]);

    const merged = this.mergeByDate(bioRows, trakRows);
    if (!employee.shift_id) {
      return merged;
    }
    const shift = await Shift.findByPk(employee.shift_id);
    if (!shift) {
      return merged;
    }
    return merged.map((row) => {
      const result = evaluateAttendanceStatus(row, shift, employee.grace_minutes);
      return {
        ...row,
        finalStatus: result.status,
        matchedRule: result.matchedRule,
        lateMinutes: result.lateMinutes,
      };
    });
  }

  // ─── Merge one employee's rows from both sources, keyed by date ─────────
  private mergeByDate(
    bioRows: MSSQLAttendanceRow[],
    trakRows: TrakolaAttendanceRow[],
  ): CombinedAttendanceRow[] {
    const byDate = new Map<string, { bio?: MSSQLAttendanceRow; trak?: TrakolaAttendanceRow }>();

    for (const r of bioRows) {
      byDate.set(r.date, { ...byDate.get(r.date), bio: r });
    }
    for (const r of trakRows) {
      byDate.set(r.date, { ...byDate.get(r.date), trak: r });
    }

    const result: CombinedAttendanceRow[] = [];

    for (const [date, { bio, trak }] of byDate.entries()) {
      const checkIns = [bio?.check_in, trak?.check_in].filter((v): v is string => !!v);
      const checkOuts = [bio?.check_out, trak?.check_out].filter((v): v is string => !!v);

      // "HH:MM:SS" strings sort correctly lexicographically for same-day times
      const check_in = checkIns.length > 0 ? checkIns.sort()[0] : null;
      const check_out = checkOuts.length > 0 ? checkOuts.sort()[checkOuts.length - 1] : null;

      const sources: AttendanceSourceTag[] = [];
      if (bio) sources.push('Biometric');
      if (trak) sources.push('Trakola');

      const working_hours = check_in && check_out ? this.diffHours(check_in, check_out) : null;

      let status: CombinedDayStatus = 'No Punches';
      if (check_in && check_out) status = 'Present';
      else if (check_in || check_out) status = 'Incomplete';

      result.push({ date, check_in, check_out, working_hours, sources, status, finalStatus: null, matchedRule: null, lateMinutes: null });
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