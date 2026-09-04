/**
 * trackola.service.ts
 *
 * Fetches a single employee's DAILY_PRODUCTIVITY_BY_DAY report from Trackola's
 * employee-wise template API and parses it into a normalized attendance row
 * shape (the same spirit as MSSQLAttendanceRow, so the combined-attendance
 * merge can treat both sources uniformly).
 *
 * Trackola's rows are POSITIONAL — row[i] ↔ columns[i]. This parser zips them
 * by column NAME, so adding/reordering columns in Trackola's template is safe
 * as long as the column names we read still exist.
 *
 * ID mapping:
 *   - our employee  → `employee_code` → Trackola `employeeIden` (body filter)
 *   - Trackola admin → `TC_ADMIN_ID`  → `employee_id` (query param, in config)
 */

import {
  runTrackolaTemplate,
  TrackolaApiError,
  TrackolaTemplateRunResponse,
  TrackolaReportCell,
} from '../../config/trackolap.config';
import { AppError } from '../../middleware/errorHandler.middleware';

// Column labels as returned by the DAILY_PRODUCTIVITY_BY_DAY template. Update
// here (nowhere else references raw strings) if Trackola renames a column.
const COLUMN = {
  employeeName: 'Employee',
  date: 'Date',
  punchIn: 'Punch In Date Time',
  punchOut: 'Punch Out Date Time',
  workingTime: 'Working Time',
  punchInLocation: 'Punch In Location',
  punchOutLocation: 'Punch Out Location',
  customerVisits: 'Number of Customer Visits',
  distanceKm: 'Total Distance Travelled (KM)',
};

export interface TrakolaAttendanceRow {
  employee_name: string;
  employee_id: string | null;   // the Trackola employeeIden this report was filtered by
  date: string;                 // YYYY-MM-DD
  check_in: string | null;      // HH:MM:SS
  check_out: string | null;     // HH:MM:SS
  working_hours: number | null;
  punch_in_location: string | null;
  punch_out_location: string | null;
  customer_visits: number | null;
  distance_km: number | null;
  source: 'Trakola';
}

/**
 * Trackola's `employeeIden` filter is strict — it only accepts the exact
 * unpadded integer string it stores (e.g. "2654"). Our `employee_code` may be
 * zero-padded ("00002654"), spaced, or carry a prefix — all of which Trackola
 * rejects as "Please enter valid values in filter". Normalise to the bare
 * digits, leading zeros removed. Returns '' if there are no digits.
 */
export function toTrackolaEmployeeIden(employeeCode: unknown): string {
  const digits = String(employeeCode ?? '').replace(/\D/g, '').replace(/^0+/, '');
  return digits;
}

export class TrakolaService {
  /**
   * Fetch + parse one employee's DAILY_PRODUCTIVITY_BY_DAY rows (column-keyed,
   * not yet normalized). Filtering is done server-side by Trackola via the
   * `employeeIden` filter, so every returned row belongs to that employee.
   *
   * @param employeeCode our employee's `employee_code`; normalised to Trackola's
   *   `employeeIden` (bare digits) before the request.
   */
  async getParsedReportRows(
    startDate: string,
    endDate: string,
    employeeCode: string,
  ): Promise<Record<string, string | number>[]> {
    const iden = toTrackolaEmployeeIden(employeeCode);
    if (!iden) {
      throw new AppError(
        `Cannot map employee code "${employeeCode}" to a Trackola employee identifier`,
        400,
      );
    }

    let response: TrackolaTemplateRunResponse;
    try {
      response = await runTrackolaTemplate({
        templateType: 'DAILY_PRODUCTIVITY_BY_DAY',
        filters: [{ filter: 'employeeIden', condition: 'in', values: [iden] }],
        startDate,
        endDate,
      });
    } catch (e: any) {
      if (e instanceof TrackolaApiError) {
        // Bad employeeIden / bad filter → the caller's input is wrong (422);
        // missing admin id / other → config or upstream problem (502).
        throw new AppError(
          `Trackola: ${e.message}`,
          e.invalidInput ? 422 : 502,
        );
      }
      throw new AppError(`Trackola API unavailable: ${e.message}`, 502);
    }

    return response.rows.map((row) => this.zipRowToObject(response.columns, row));
  }

  /**
   * Fetch, parse AND normalize one employee's daily report into
   * TrakolaAttendanceRow[] — the shape the combined-attendance merge consumes.
   *
   * @param employeeCode our employee's `employee_code`
   */
  async getNormalizedAttendance(
    startDate: string,
    endDate: string,
    employeeCode: string,
  ): Promise<TrakolaAttendanceRow[]> {
    const iden = toTrackolaEmployeeIden(employeeCode);
    const parsedRows = await this.getParsedReportRows(startDate, endDate, employeeCode);
    return parsedRows.map((row) => this.normalizeRow(row, iden));
  }

  // ─── Zip columns[] + one row's cells into { columnName: value } ─────────────
  private zipRowToObject(
    columns: string[],
    row: TrackolaReportCell[],
  ): Record<string, string | number> {
    const obj: Record<string, string | number> = {};
    columns.forEach((colName, i) => {
      const cell = row[i];
      const values = cell?.data?.map((d) => d.value) ?? [];
      obj[colName] = values.length <= 1 ? (values[0] ?? '') : values.join(', ');
    });
    return obj;
  }

  private normalizeRow(
    row: Record<string, string | number>,
    employeeIden: string,
  ): TrakolaAttendanceRow {
    const punchInRaw = String(row[COLUMN.punchIn] || '');
    const punchOutRaw = String(row[COLUMN.punchOut] || '');
    return {
      employee_name: String(row[COLUMN.employeeName] || '').trim(),
      employee_id: employeeIden || null,
      date: String(row[COLUMN.date] || ''),
      check_in: this.extractTime(punchInRaw),
      check_out: this.extractTime(punchOutRaw),
      working_hours: this.parseWorkingTime(String(row[COLUMN.workingTime] || '')),
      punch_in_location: String(row[COLUMN.punchInLocation] || '') || null,
      punch_out_location: String(row[COLUMN.punchOutLocation] || '') || null,
      customer_visits: this.parseNumber(row[COLUMN.customerVisits]),
      distance_km: this.parseNumber(row[COLUMN.distanceKm]),
      source: 'Trakola',
    };
  }

  // "2026-06-26 10:11:51 +0530" → "10:11:51"  (offset discarded — assumes IST)
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

  private parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
}

export const trakolaService = new TrakolaService();
