/**
 * attendance.mssql.service.ts
 *
 * Reads attendance data from the local MSSQL Realtime database.
 * Maps MSSQL columns to NexHR attendance format.
 *
 * Place at: backend/src/modules/attendance/attendance.mssql.service.ts
 *
 * IMPORTANT: We need to know the actual MSSQL table/column names.
 * Run the test endpoint first to discover the schema:
 *   GET /api/attendance/mssql/tables
 *
 * Then update MSSQL_TABLE_NAME and column mapping below.
 */

import { queryMSSQL, sql } from '../../config/mssql.config';

// ─── UPDATE THESE after running schema discovery ──────────────────────────────
// These are common column names in biometric/attendance systems.
// Change them to match your actual MSSQL table structure.
const MSSQL_TABLE_NAME = 'Att_Log';  // common name — update after discovery

// Column name mapping: MSSQL column → our format
// Update after running GET /api/attendance/mssql/tables
const COL = {
  employeeCode: 'EmpCode',       // or 'EmployeeCode', 'emp_code', 'PunchID'
  date:         'PunchDate',     // or 'AttDate', 'Date', 'LogDate'
  checkIn:      'InTime',        // or 'CheckIn', 'PunchIn', 'TimeIn'
  checkOut:     'OutTime',       // or 'CheckOut', 'PunchOut', 'TimeOut'
  status:       'Status',        // or 'AttStatus', 'Remark'
  shift:        'Shift',         // optional
};
// ─────────────────────────────────────────────────────────────────────────────

export interface MSSQLAttendanceRow {
  employee_code: string;
  date:          string;
  check_in:      string | null;
  check_out:     string | null;
  status:        string;
  working_hours: number | null;
  source:        'Biometric';
}

export class AttendanceMSSQLService {

  // ── Schema discovery — call this first to know table/column names ───────────
  async discoverSchema(): Promise<{
    tables: string[];
    sampleColumns?: string[];
  }> {
    // List all tables in the Realtime database
    const tables = await queryMSSQL<{ TableName: string }>(`
      SELECT TABLE_NAME AS TableName
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    const tableNames = tables.map(t => t.TableName);

    // If the expected table exists, get its columns
    let sampleColumns: string[] | undefined;
    if (tableNames.includes(MSSQL_TABLE_NAME)) {
      const cols = await queryMSSQL<{ ColumnName: string }>(`
        SELECT COLUMN_NAME AS ColumnName
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${MSSQL_TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      sampleColumns = cols.map(c => c.ColumnName);
    }

    return { tables: tableNames, sampleColumns };
  }

  // ── Get sample rows (first 5) to see raw data ─────────────────────────────
  async getSampleRows(): Promise<any[]> {
    return queryMSSQL(`SELECT TOP 5 * FROM ${MSSQL_TABLE_NAME}`);
  }

  // ── Today's attendance from MSSQL ─────────────────────────────────────────
  async getTodayAttendance(): Promise<MSSQLAttendanceRow[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceByDate(today, today);
  }

  // ── Attendance by date range ───────────────────────────────────────────────
  async getAttendanceByDate(
    dateFrom: string,
    dateTo:   string,
    employeeCode?: string,
  ): Promise<MSSQLAttendanceRow[]> {
    const params: Record<string, { value: any; type?: sql.ISqlType }> = {
      dateFrom: { value: dateFrom, type: sql.VarChar(20) },
      dateTo:   { value: dateTo,   type: sql.VarChar(20) },
    };

    let empFilter = '';
    if (employeeCode) {
      params.empCode = { value: employeeCode, type: sql.VarChar(50) };
      empFilter = `AND ${COL.employeeCode} = @empCode`;
    }

    const rows = await queryMSSQL<any>(`
      SELECT
        ${COL.employeeCode}  AS emp_code,
        CONVERT(VARCHAR(10), ${COL.date}, 23) AS att_date,
        ${COL.checkIn}       AS check_in,
        ${COL.checkOut}      AS check_out,
        ${COL.status}        AS status
      FROM ${MSSQL_TABLE_NAME}
      WHERE CONVERT(VARCHAR(10), ${COL.date}, 23) BETWEEN @dateFrom AND @dateTo
      ${empFilter}
      ORDER BY ${COL.date} DESC, ${COL.employeeCode}
    `, params);

    return rows.map(r => this.mapRow(r));
  }

  // ── Monthly attendance for one employee ────────────────────────────────────
  async getByEmployeeCode(
    employeeCode: string,
    month:        number,
    year:         number,
  ): Promise<MSSQLAttendanceRow[]> {
    const dateFrom = `${year}-${String(month).padStart(2,'0')}-01`;
    const dateTo   = `${year}-${String(month).padStart(2,'0')}-31`;
    return this.getAttendanceByDate(dateFrom, dateTo, employeeCode);
  }

  // ── Map raw MSSQL row to our format ───────────────────────────────────────
  private mapRow(r: any): MSSQLAttendanceRow {
    // Calculate working hours from check_in and check_out
    let working_hours: number | null = null;
    if (r.check_in && r.check_out) {
      try {
        const inParts  = String(r.check_in).split(':').map(Number);
        const outParts = String(r.check_out).split(':').map(Number);
        const inMins   = inParts[0] * 60  + (inParts[1] || 0);
        const outMins  = outParts[0] * 60 + (outParts[1] || 0);
        const diff     = outMins - inMins;
        if (diff > 0) working_hours = Math.round((diff / 60) * 100) / 100;
      } catch { /* ignore calculation errors */ }
    }

    // Map status to our format
    const rawStatus = String(r.status || '').trim();
    const status    = this.mapStatus(rawStatus);

    return {
      employee_code: String(r.emp_code || '').trim(),
      date:          String(r.att_date || '').substring(0, 10),
      check_in:      r.check_in  ? String(r.check_in).substring(0, 8)  : null,
      check_out:     r.check_out ? String(r.check_out).substring(0, 8) : null,
      status,
      working_hours,
      source: 'Biometric',
    };
  }

  // Map your MSSQL status values to NexHR status
  private mapStatus(raw: string): string {
    const s = raw.toLowerCase();
    if (s.includes('present') || s === 'p')  return 'Present';
    if (s.includes('absent')  || s === 'a')  return 'Absent';
    if (s.includes('wfh'))                    return 'WFH';
    if (s.includes('half'))                   return 'Half-Day';
    if (s.includes('leave')   || s === 'l')  return 'Leave';
    if (s.includes('holiday') || s === 'h')  return 'Holiday';
    // Default — keep original or mark as Present if check_in exists
    return raw || 'Present';
  }
}

export const attendanceMSSQLService = new AttendanceMSSQLService();