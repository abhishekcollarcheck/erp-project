/**
 * attendance.mssql.routes.ts
 *
 * Routes for reading attendance from local MSSQL Realtime database.
 *
 * Place at: backend/src/modules/attendance/attendance.mssql.routes.ts
 *
 * Register in main routes (src/routes/index.ts):
 *   import mssqlAttendanceRouter from '../modules/attendance/attendance.mssql.routes';
 *   app.use('/api/attendance/mssql', mssqlAttendanceRouter);
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, param }                             from 'express-validator';
import { validate }                                 from '../../middleware/validate.middleware';
import { authenticate }                             from '../auth/auth.middleware';
import { attendanceMSSQLService }                   from './attendance.mssql.service';
import { sendResponse, sendError }                  from '../../utils/response';

const mssqlAttendanceRouter = Router();
mssqlAttendanceRouter.use(authenticate);

// ─── GET /api/attendance/mssql/tables ────────────────────────────────────────
// Step 1: Run this to discover MSSQL schema — find table + column names
mssqlAttendanceRouter.get('/tables', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = await attendanceMSSQLService.discoverSchema();
    sendResponse(res, {
      data: schema,
      message: 'MSSQL schema discovered. Update MSSQL_TABLE_NAME and COL in attendance.mssql.service.ts',
    });
  } catch (e: any) {
    sendError(res, `MSSQL connection failed: ${e.message}`, 500);
  }
});

// ─── GET /api/attendance/mssql/sample ────────────────────────────────────────
// Step 2: See raw data to understand column names
mssqlAttendanceRouter.get('/sample', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await attendanceMSSQLService.getSampleRows();
    sendResponse(res, {
      data: rows,
      message: `Sample rows from MSSQL. Use these column names to update the service.`,
    });
  } catch (e: any) {
    sendError(res, `MSSQL query failed: ${e.message}`, 500);
  }
});

// ─── GET /api/attendance/mssql/sample/:table ─────────────────────────────────
// Step 2b: Sample ANY table by name (row count + columns + top 5 rows).
// Use this to check candidates like All_In_Out_Table, ActivityList,
// Api_TableName, etc. without editing MSSQL_TABLE_NAME and redeploying.
mssqlAttendanceRouter.get(
  '/sample/:table',
  [param('table').notEmpty().isString()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceMSSQLService.getSampleFromTable(req.params.table);
      sendResponse(res, {
        data: result,
        message: `${result.rowCount} row(s) in "${result.table}"`,
      });
    } catch (e: any) {
      sendError(res, `MSSQL query failed: ${e.message}`, 500);
    }
  }
);

// ─── GET /api/attendance/mssql/today ─────────────────────────────────────────
// Today's attendance from MSSQL (biometric data)
mssqlAttendanceRouter.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await attendanceMSSQLService.getTodayAttendance();
    sendResponse(res, {
      data:    rows,
      message: `Today's attendance from Realtime DB (${rows.length} records)`,
    });
  } catch (e: any) {
    sendError(res, `MSSQL query failed: ${e.message}`, 500);
  }
});

// ─── GET /api/attendance/mssql?date_from=2026-06-01&date_to=2026-06-30 ───────
// Date range attendance
mssqlAttendanceRouter.get(
  '/',
  [
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('employee_code').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today    = new Date().toISOString().split('T')[0];
      const dateFrom = (req.query.date_from as string) || today;
      const dateTo   = (req.query.date_to   as string) || today;
      const empCode  = req.query.employee_code as string | undefined;

      const rows = await attendanceMSSQLService.getAttendanceByDate(dateFrom, dateTo, empCode);
      sendResponse(res, {
        data:    rows,
        message: `Attendance from ${dateFrom} to ${dateTo} (${rows.length} records)`,
      });
    } catch (e: any) {
      sendError(res, `MSSQL query failed: ${e.message}`, 500);
    }
  }
);

// ─── GET /api/attendance/mssql/employee/:code?month=6&year=2026 ───────────────
// Monthly attendance for one employee by their code
mssqlAttendanceRouter.get(
  '/employee/:code',
  [
    param('code').notEmpty(),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code  = req.params.code;
      const month = Number(req.query.month ?? new Date().getMonth() + 1);
      const year  = Number(req.query.year  ?? new Date().getFullYear());

      const rows = await attendanceMSSQLService.getByEmployeeCode(code, month, year);
      sendResponse(res, {
        data:    rows,
        message: `Attendance for ${code} — ${month}/${year} (${rows.length} records)`,
      });
    } catch (e: any) {
      sendError(res, `MSSQL query failed: ${e.message}`, 500);
    }
  }
);

export default mssqlAttendanceRouter;