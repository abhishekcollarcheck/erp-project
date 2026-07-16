/**
 * attendance.mssql.service.ts
 *
 * Reads attendance data from the local MSSQL Realtime database.
 *
 * SCHEMA CONFIRMED (via /mssql/sample/Tran_MachineRawPunch):
 *   This table stores RAW PUNCH EVENTS, not one row per employee per day.
 *   Each row is a single IN or OUT event:
 *     CardNo         - employee identifier, e.g. "00002229" (empid/id columns are always NULL — unused)
 *     PunchDatetime   - the actual punch timestamp (USE THIS for filtering/ordering)
 *     Dateime1        - when the row was synced into this table (often hours/days
 *                       AFTER PunchDatetime for offline devices — never use this for date filtering)
 *     inout           - 'IN' or 'OUT'
 *     senddata        - verification method, e.g. "Face" or "FP" (fingerprint)
 *
 * A single employee can have 2+ punches a day (IN + OUT), sometimes with
 * duplicate/extra punches (device retries). We aggregate per (CardNo, day):
 *   check_in  = earliest punch tagged IN that day
 *   check_out = latest punch tagged OUT that day
 *
 * Place at: backend/src/modules/attendance/attendance.mssql.service.ts
 */

import { queryMSSQL, sql } from '../../config/mssql.config';

// Confirmed via schema discovery — update if your instance differs
const MSSQL_TABLE_NAME = 'Tran_MachineRawPunch';

const COL = {
  cardNo: 'CardNo',
  punchDatetime: 'PunchDatetime',
  inout: 'inout',
  verifyMode: 'senddata', // holds "Face" / "FP" despite the column name
};

export type MSSQLDayStatus = 'Present' | 'Incomplete' | 'No Punches';

export interface MSSQLAttendanceRow {
  employee_code: string;
  date: string;               // YYYY-MM-DD
  check_in: string | null;    // HH:MM:SS (local, derived from PunchDatetime)
  check_out: string | null;   // HH:MM:SS
  status: MSSQLDayStatus;
  working_hours: number | null;
  punch_count: number;
  source: 'Biometric';
}

interface RawAggregatedRow {
  card_no: string;
  punch_date: string;       // e.g. "2026-07-15"
  first_in: Date | string | null;
  last_out: Date | string | null;
  punch_count: number;
}

export class AttendanceMSSQLService {
  // ── Schema discovery — call this first to know table/column names ───────────
  async discoverSchema(): Promise<{ tables: string[]; sampleColumns?: string[] }> {
    const tables = await queryMSSQL<{ TableName: string }>(`
      SELECT TABLE_NAME AS TableName
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    const tableNames = tables.map((t) => t.TableName);

    let sampleColumns: string[] | undefined;
    if (tableNames.includes(MSSQL_TABLE_NAME)) {
      const cols = await queryMSSQL<{ ColumnName: string }>(`
        SELECT COLUMN_NAME AS ColumnName
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${MSSQL_TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      sampleColumns = cols.map((c) => c.ColumnName);
    }
    return { tables: tableNames, sampleColumns };
  }

  // ── Get sample rows (first 5) to see raw data ─────────────────────────────
  async getSampleRows(): Promise<any[]> {
    return queryMSSQL(`SELECT TOP 5 * FROM ${MSSQL_TABLE_NAME}`);
  }

  // ── Sample ANY table by name, with columns + row count ─────────────────────
  // Table name is validated against INFORMATION_SCHEMA.TABLES before use —
  // never interpolated raw, so this stays injection-safe even though it
  // takes a caller-supplied string.
  async getSampleFromTable(tableName: string): Promise<{
    table: string;
    rowCount: number;
    columns: string[];
    rows: any[];
  }> {
    const validTables = await queryMSSQL<{ TableName: string }>(`
      SELECT TABLE_NAME AS TableName
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    const match = validTables.find((t) => t.TableName.toLowerCase() === tableName.toLowerCase());
    if (!match) throw new Error(`Table "${tableName}" not found in Realtime database`);
    const realName = match.TableName;

    const [columns, countResult, rows] = await Promise.all([
      queryMSSQL<{ ColumnName: string }>(`
        SELECT COLUMN_NAME AS ColumnName
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${realName}'
        ORDER BY ORDINAL_POSITION
      `),
      queryMSSQL<{ Total: number }>(`SELECT COUNT(*) AS Total FROM [${realName}]`),
      queryMSSQL<any>(`SELECT TOP 5 * FROM [${realName}]`),
    ]);

    return {
      table: realName,
      rowCount: countResult[0]?.Total ?? 0,
      columns: columns.map((c) => c.ColumnName),
      rows,
    };
  }

  // ── Today's attendance from MSSQL ─────────────────────────────────────────
  async getTodayAttendance(): Promise<MSSQLAttendanceRow[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceByDate(today, today);
  }

  // ── Attendance by date range — aggregates raw punches into daily rows ──────
  async getAttendanceByDate(
    dateFrom: string,
    dateTo: string,
    employeeCode?: string,
  ): Promise<MSSQLAttendanceRow[]> {
    const params: Record<string, { value: any; type?: sql.ISqlType }> = {
      dateFrom: { value: dateFrom, type: sql.VarChar(20) },
      dateTo: { value: dateTo, type: sql.VarChar(20) },
    };

    let empFilter = '';
    if (employeeCode) {
      params.empCode = { value: employeeCode, type: sql.VarChar(50) };
      empFilter = `AND ${COL.cardNo} = @empCode`;
    }

    // Aggregate raw punches per (CardNo, calendar day):
    //   earliest IN punch  -> check-in
    //   latest  OUT punch  -> check-out
    const rows = await queryMSSQL<RawAggregatedRow>(`
      SELECT
        ${COL.cardNo} AS card_no,
        CONVERT(VARCHAR(10), ${COL.punchDatetime}, 23) AS punch_date,
        MIN(CASE WHEN ${COL.inout} = 'IN'  THEN ${COL.punchDatetime} END) AS first_in,
        MAX(CASE WHEN ${COL.inout} = 'OUT' THEN ${COL.punchDatetime} END) AS last_out,
        COUNT(*) AS punch_count
      FROM ${MSSQL_TABLE_NAME}
      WHERE CONVERT(VARCHAR(10), ${COL.punchDatetime}, 23) BETWEEN @dateFrom AND @dateTo
      ${empFilter}
      GROUP BY ${COL.cardNo}, CONVERT(VARCHAR(10), ${COL.punchDatetime}, 23)
      ORDER BY punch_date DESC, ${COL.cardNo}
    `, params);

    return rows.map((r) => this.mapAggregatedRow(r));
  }

  // ── Monthly attendance for one employee ────────────────────────────────────
  async getByEmployeeCode(
    employeeCode: string,
    month: number,
    year: number,
  ): Promise<MSSQLAttendanceRow[]> {
    const paddedMonth = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate(); // correct last day for the month
    const dateFrom = `${year}-${paddedMonth}-01`;
    const dateTo = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
    return this.getAttendanceByDate(dateFrom, dateTo, employeeCode);
  }

  // ── Map an aggregated (per-day) row to our output format ───────────────────
  private mapAggregatedRow(r: RawAggregatedRow): MSSQLAttendanceRow {
    const firstIn = r.first_in ? new Date(r.first_in) : null;
    const lastOut = r.last_out ? new Date(r.last_out) : null;

    let working_hours: number | null = null;
    if (firstIn && lastOut && lastOut.getTime() > firstIn.getTime()) {
      working_hours = Math.round(((lastOut.getTime() - firstIn.getTime()) / 3600000) * 100) / 100;
    }

    let status: MSSQLDayStatus = 'No Punches';
    if (firstIn && lastOut) status = 'Present';
    else if (firstIn || lastOut) status = 'Incomplete'; // missing punch (forgot to tap in/out, or device miss)

    return {
      employee_code: String(r.card_no || '').trim(),
      date: r.punch_date,
      check_in: firstIn ? this.toTimeString(firstIn) : null,
      check_out: lastOut ? this.toTimeString(lastOut) : null,
      status,
      working_hours,
      punch_count: r.punch_count,
      source: 'Biometric',
    };
  }

  private toTimeString(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}

export const attendanceMSSQLService = new AttendanceMSSQLService();