/**
 * trakola.routes.ts
 *
 * Discovery/verification routes for the Trakola integration — same role
 * the /mssql/sample endpoints played for confirming the biometric schema.
 *
 * Place at: backend/src/modules/attendance/trakola.routes.ts
 * Register: app.use('/api/attendance/trakola', trakolaRouter);
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../auth/auth.middleware';
import { trakolaService } from './trackola.service';
import { sendResponse, sendError } from '../../utils/response';

const trackolaRouter = Router();
trackolaRouter.use(authenticate);
// trackolaRouter.use(authorize('hr', 'admin'));

const dateRangeValidators = [
  query('start_date').isISO8601().withMessage('start_date must be YYYY-MM-DD'),
  query('end_date').isISO8601().withMessage('end_date must be YYYY-MM-DD'),
];

// ─── GET /api/attendance/trakola/raw?start_date=&end_date= ───────────────────
// Step 1: see the parsed-but-not-yet-normalized rows — use this to confirm
// column names match what trakola.service.ts expects, especially once you
// add the Employee ID column.
trackolaRouter.get(
  '/raw',
  dateRangeValidators,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await trakolaService.getParsedReportRows(
        req.query.start_date as string,
        req.query.end_date as string,
      );
      console.log("req.query.start_date", req.query.start_date)
      console.log("req.query.end_date", req.query.end_date)
      sendResponse(res, {
        data: rows,
        message: `${rows.length} row(s) from Trakola report`,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);

// ─── GET /api/attendance/trakola/normalized?start_date=&end_date= ────────────
// Step 2: see the normalized shape (check_in/check_out/working_hours parsed
// out). employee_ref will be null until the Employee ID column is added.
trackolaRouter.get(
  '/normalized',
  dateRangeValidators,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await trakolaService.getNormalizedAttendance(
        req.query.start_date as string,
        req.query.end_date as string,
      );
      const unmatchedCount = rows.filter((r) => !r.employee_id).length;
      sendResponse(res, {
        data: rows,
        message: unmatchedCount > 0
          ? `${rows.length} row(s) parsed. ${unmatchedCount} have no employee_ref yet — add the Employee ID column in Trakola's report config.`
          : `${rows.length} row(s) parsed and matched.`,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);

export default trackolaRouter;