import { Router, Request, Response, NextFunction } from 'express';
import { query, param }                             from 'express-validator';
import { validate }                                 from '../../middleware/validate.middleware';
import { authenticate }                             from '../auth/auth.middleware';
import { attendanceMSSQLService }                   from './attendance.mssql.service';
import { Employee }                                 from '../../database/models/Employee';
import { sendResponse, sendError }                  from '../../utils/response';

const mssqlAttendanceRouter = Router();
mssqlAttendanceRouter.use(authenticate);

// ─── GET /api/attendance/mssql/tables ────────────────────────────────────────
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

// ─── GET /api/attendance/mssql/my ────────────────────────────────────────────
// Self-service: the logged-in employee's OWN attendance only. Employee code
// is resolved server-side from req.user.employeeId — never taken from the
// request — so an employee can never view anyone else's data.
//
// Supports TWO mutually exclusive ways to specify the period:
//   - date_from & date_to  (used for Today/Yesterday/Last 7/14 days/Custom range)
//   - month & year         (kept for backward compatibility with the old picker)
// date_from/date_to takes priority if both styles are somehow sent together.
mssqlAttendanceRouter.get(
  '/my',
  [
    query('date_from').optional().isISO8601().withMessage('date_from must be a valid ISO date'),
    query('date_to').optional().isISO8601().withMessage('date_to must be a valid ISO date'),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employee = await Employee.findOne({
        where: { id: req.user!.employeeId },
        attributes: ['employee_code'],
      });

      if (!employee || !employee.employee_code) {
        return sendError(res, 'No employee code found for the logged-in user — cannot look up biometric attendance', 404);
      }

      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;

      // Both-or-neither: a lone date_from/date_to is almost certainly a
      // frontend bug, not an intentional open-ended range — reject early
      // rather than silently defaulting the missing side.
      if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
        return sendError(res, 'date_from and date_to must both be provided together', 400);
      }

      let rows;
      let periodLabel: string;

      if (dateFrom && dateTo) {
        rows = await attendanceMSSQLService.getAttendanceByDate(dateFrom, dateTo, employee.employee_code);
        periodLabel = `${dateFrom} to ${dateTo}`;
      } else {
        const month = Number(req.query.month ?? new Date().getMonth() + 1);
        const year = Number(req.query.year ?? new Date().getFullYear());
        rows = await attendanceMSSQLService.getByEmployeeCode(employee.employee_code, month, year);
        periodLabel = `${month}/${year}`;
      }

      sendResponse(res, {
        data: rows,
        message: `Your attendance — ${periodLabel} (${rows.length} record(s))`,
      });
    } catch (e: any) {
      sendError(res, `MSSQL query failed: ${e.message}`, 500);
    }
  },
);

// ─── GET /api/attendance/mssql?date_from=&date_to= ───────────────────────────
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

// ─── GET /api/attendance/mssql/employee/:code?month=6&year=2026 ─────────────
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