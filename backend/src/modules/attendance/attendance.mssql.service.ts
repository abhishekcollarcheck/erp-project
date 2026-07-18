import { queryMSSQL, sql } from '../../config/mssql.config';

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
  first_in: string | null;
  last_out: string | null;
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
    const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Kolkata',
});
    return this.getAttendanceByDate(today, today);
  }

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

    const rows = await queryMSSQL<RawAggregatedRow>(`
      SELECT
        ${COL.cardNo} AS card_no,
        CONVERT(VARCHAR(10), ${COL.punchDatetime}, 23) AS punch_date,
        CONVERT(
        VARCHAR(8),
        MIN(${COL.punchDatetime}),
        108
    ) AS first_in,

CONVERT(
        VARCHAR(8),
        MAX(${COL.punchDatetime}),
        108
    ) AS last_out,        
        COUNT(*) AS punch_count
      FROM ${MSSQL_TABLE_NAME}
      WHERE CONVERT(VARCHAR(10), ${COL.punchDatetime}, 23) BETWEEN @dateFrom AND @dateTo
      ${empFilter}
      GROUP BY ${COL.cardNo}, CONVERT(VARCHAR(10), ${COL.punchDatetime}, 23)
      ORDER BY punch_date DESC, ${COL.cardNo}
    `, params);

    console.log("rows", rows) 
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

  let working_hours: number | null = null;

  if (r.first_in && r.last_out) {
    working_hours = this.calculateWorkingHours(
      r.first_in,
      r.last_out,
    );
  }

  let status: MSSQLDayStatus = 'No Punches';

  if (r.first_in && r.last_out) {
    status = 'Present';
  } else if (r.first_in || r.last_out) {
    status = 'Incomplete';
  }

  return {
    employee_code: String(r.card_no || '').trim(),
    date: r.punch_date,
    check_in: r.first_in,
    check_out: r.last_out,
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

private calculateWorkingHours(
    checkIn: string,
    checkOut: string,
): number {

    const [ih, im, is] = checkIn.split(':').map(Number);
    const [oh, om, os] = checkOut.split(':').map(Number);

    let inSeconds =
        ih * 3600 +
        im * 60 +
        is;

    let outSeconds =
        oh * 3600 +
        om * 60 +
        os;

    if (outSeconds < inSeconds) {
        outSeconds += 24 * 3600;
    }

    return Math.round(((outSeconds - inSeconds) / 3600) * 100) / 100;
}  
}

export const attendanceMSSQLService = new AttendanceMSSQLService();