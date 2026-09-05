/**
 * trackola.routes.ts
 *
 * Employee-wise Trackola daily-productivity report endpoints. All of these
 * resolve to ONE employee and call the `DAILY_PRODUCTIVITY_BY_DAY` template
 * API (Trackola filters server-side by `employeeIden`).
 *
 * Employee resolution (same precedence as the MSSQL routes):
 *   1. ?employee_code=<code>          — explicit Trackola employeeIden
 *   2. ?employee_id=<our employee PK> — looked up → employee_code
 *   3. neither                        — the logged-in user (self-service)
 *
 * Mounted at /api/attendance/trackola (see routes/index.ts).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import { Employee } from '../../database/models/Employee';
import { trakolaService } from './trackola.service';
import { sendResponse, sendError } from '../../utils/response';

const trackolaRouter = Router();
trackolaRouter.use(authenticate);

const rangeAndEmployeeValidators = [
  query('start_date').isISO8601().withMessage('start_date must be YYYY-MM-DD'),
  query('end_date').isISO8601().withMessage('end_date must be YYYY-MM-DD'),
  query('employee_code').optional().isString().trim().notEmpty(),
  query('employee_id').optional().isInt({ min: 1 }).withMessage('employee_id must be a positive integer'),
];

/** Resolve the request to a single Trackola employeeIden (our employee_code). */
async function resolveEmployeeIden(req: Request): Promise<string> {
  const explicitCode = (req.query.employee_code as string | undefined)?.trim();
  if (explicitCode) return explicitCode;

  const targetId = req.query.employee_id
    ? Number(req.query.employee_id)
    : req.user!.employeeId;

  const employee = await Employee.findOne({
    where: { id: targetId },
    attributes: ['id', 'employee_code'],
  });
  if (!employee) {
    const err: any = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  if (!employee.employee_code) {
    const err: any = new Error(
      'Employee has no employee code yet — Trackola attendance is keyed by employee code and is unavailable until onboarding is complete',
    );
    err.statusCode = 409;
    throw err;
  }
  return employee.employee_code;
}

// ─── GET /api/attendance/trackola/daily ─────────────────────────────────────
// Primary endpoint: one employee's DAILY_PRODUCTIVITY_BY_DAY rows, normalized
// into { date, check_in, check_out, working_hours, ... }.
trackolaRouter.get(
  '/daily',
  rangeAndEmployeeValidators,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeIden = await resolveEmployeeIden(req);
      const rows = await trakolaService.getNormalizedAttendance(
        req.query.start_date as string,
        req.query.end_date as string,
        employeeIden,
      );
      sendResponse(res, {
        data: rows,
        message: `Trackola daily productivity for ${employeeIden} — ${req.query.start_date} to ${req.query.end_date} (${rows.length} day(s))`,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);

// ─── GET /api/attendance/trackola/raw ──────────────────────────────────────
// The raw column-keyed rows straight from the template API — for verifying
// column names / debugging.
trackolaRouter.get(
  '/raw',
  rangeAndEmployeeValidators,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeIden = await resolveEmployeeIden(req);
      const rows = await trakolaService.getParsedReportRows(
        req.query.start_date as string,
        req.query.end_date as string,
        employeeIden,
      );
      sendResponse(res, {
        data: rows,
        message: `${rows.length} row(s) from Trackola DAILY_PRODUCTIVITY_BY_DAY for ${employeeIden}`,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);

// ─── GET /api/attendance/trackola/normalized ───────────────────────────────
// Kept as an alias of /daily for backward compatibility with existing callers.
trackolaRouter.get(
  '/normalized',
  rangeAndEmployeeValidators,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeIden = await resolveEmployeeIden(req);
      const rows = await trakolaService.getNormalizedAttendance(
        req.query.start_date as string,
        req.query.end_date as string,
        employeeIden,
      );
      sendResponse(res, {
        data: rows,
        message: `${rows.length} row(s) parsed for ${employeeIden}`,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);

export default trackolaRouter;
