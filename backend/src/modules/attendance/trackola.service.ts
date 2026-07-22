/**
 * trakola.service.ts
 *
 * Parses Trakola's report format (columns[] + rows[][cell]) into
 * name-keyed objects, then into a normalized attendance row shape.
 *
 * IMPORTANT: Trakola's rows are POSITIONAL, not keyed — row[i] corresponds
 * to columns[i]. This parser zips them by column NAME (not fixed index),
 * so if you reorder or add/remove columns in Trakola's report config,
 * this still works as long as the expected column names still exist.
 *
 * Place at: backend/src/modules/attendance/trakola.service.ts
 */

import { fetchTrakolaReport, TrackolaReportResponse, TrackolaReportCell } from '../../config/trackolap.config';
import { AppError } from '../../middleware/errorHandler.middleware';

const TRAKOLA_REPORT_ID = process.env.TRAKOLA_REPORT_ID || '6a5b6fa46a50d271360c88ca';

// Column names as they appeared in your sample response. If you rename any
// of these when adding the Employee ID column, update the matching constant
// below — everything else in this file references these constants, not
// hardcoded strings.
const COLUMN = {
  employeeName: 'Employee',
  employeeId: 'Identifier', // NOT YET IN YOUR REPORT — add this column, then confirm the exact label here
  date: 'Date',
  punchIn: 'Punch In Date Time',
  punchOut: 'Punch Out Date Time',
  workingTime: 'Working Time',
  punchInLocation: 'Punch In Location',
  punchOutLocation: 'Punch Out Location',
};

export interface TrakolaAttendanceRow {
  employee_name: string;
  employee_id: string | null; // will hold Employee ID once the column exists; null until then
  date: string;                // YYYY-MM-DD
  check_in: string | null;     // HH:MM:SS
  check_out: string | null;    // HH:MM:SS
  working_hours: number | null;
  punch_in_location: string | null;
  punch_out_location: string | null;
  source: 'Trakola';
}

export class TrakolaService {
  /**
   * Fetches and parses a Trakola report into name-keyed rows.
   * Exposed separately from getNormalizedAttendance() so we can inspect
   * the raw parsed shape while confirming column names during testing.
   */
  async getParsedReportRows(startDate: string, endDate: string, employeeId?: string): Promise<Record<string, string | number>[]> {
    if (!TRAKOLA_REPORT_ID) {
      throw new AppError('TRAKOLA_REPORT_ID is not configured', 500);
    }

    let response: TrackolaReportResponse;
    try {
      response = await fetchTrakolaReport(TRAKOLA_REPORT_ID, startDate, endDate);
    } catch (e: any) {
      throw new AppError(`Trakola API unavailable: ${e.message}`, 502);
    }
    const allRows = response.rows.map((row) => this.zipRowToObject(response.columns, row));
    if(employeeId){
      const filter = allRows.filter(row => {
        const empId = this.normalizeEmployeeId(row[COLUMN.employeeId]);
        return empId === employeeId;
      }) 
      return filter;
    }
    return allRows;
  }

  /**
   * Fetches, parses, AND normalizes into our common attendance row shape —
   * the same spirit as MSSQLAttendanceRow, so downstream merge logic can
   * treat both sources uniformly once employee_ref is reliably populated.
   */
  async getNormalizedAttendance(startDate: string, endDate: string, employeeId?: string): Promise<TrakolaAttendanceRow[]> {
    const parsedRows = await this.getParsedReportRows(startDate, endDate, employeeId);
    return parsedRows.map((row) => this.normalizeRow(row));
  }

  // ─── Zip columns[] + one row's cells into a { columnName: value } object ──
  private zipRowToObject(columns: string[], row: TrackolaReportCell[]): Record<string, string | number> {
    const obj: Record<string, string | number> = {};
    columns.forEach((colName, i) => {
      const cell = row[i];
      const values = cell?.data?.map((d) => d.value) ?? [];
      // Most columns have exactly one value. If a column ever has multiple
      // (columnsMulti in the raw response suggests this is possible for
      // some report types), join them rather than silently dropping data.
      obj[colName] = values.length <= 1 ? (values[0] ?? '') : values.join(', ');
    });
    return obj;
  }

  private normalizeRow(row: Record<string, string | number>): TrakolaAttendanceRow {
    const punchInRaw = String(row[COLUMN.punchIn] || '');
    const punchOutRaw = String(row[COLUMN.punchOut] || '');
    return {
      employee_name: String(row[COLUMN.employeeName] || '').trim(),
      employee_id: this.normalizeEmployeeId(row[COLUMN.employeeId]),
      date: String(row[COLUMN.date] || ''),
      check_in: this.extractTime(punchInRaw),
      check_out: this.extractTime(punchOutRaw),
      working_hours: this.parseWorkingTime(String(row[COLUMN.workingTime] || '')),
      punch_in_location: String(row[COLUMN.punchInLocation] || '') || null,
      punch_out_location: String(row[COLUMN.punchOutLocation] || '') || null,
      source: 'Trakola',
    };
  }

  // "2026-06-26 10:11:51 +0530" → "10:11:51"
  // NOTE: the +0530 offset is discarded here — this assumes Trakola always
  // reports in IST, matching our own server convention. Flag if Trakola
  // ever serves multi-timezone data (e.g. a distributed sales team).
  private extractTime(raw: string): string | null {
    const match = raw.match(/\d{4}-\d{2}-\d{2}\s(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : null;
  }

  // "09:02:50" → 9.05 (decimal hours)
  private parseWorkingTime(raw: string): number | null {
    const match = raw.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [, hh, mm, ss] = match;
    const hours = Number(hh) + Number(mm) / 60 + Number(ss) / 3600;
    return hours > 0 ? Math.round(hours * 100) / 100 : null;
  }

private normalizeEmployeeId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const id = String(value).trim();
  if (!id) {
    return null;
  }

  // Keep digits only in case the value comes from Excel or contains formatting.
  const numericId = id.replace(/\D/g, '');
  if (!numericId) {
    return null;
  }
  return numericId.padStart(8, '0');
}
}

export const trakolaService = new TrakolaService();