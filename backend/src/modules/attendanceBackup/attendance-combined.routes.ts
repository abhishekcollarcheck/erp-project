/**
 * attendance-combined.routes.ts
 *
 * Place at: backend/src/modules/attendance/attendance-combined.routes.ts
 * Register: app.use('/api/attendance/combined', attendanceCombinedRouter);
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import { attendanceCombinedService } from './attendance-combined.service';
import { sendResponse, sendError } from '../../utils/response';

const attendanceCombinedRouter = Router();
attendanceCombinedRouter.use(authenticate);

// ─── GET /api/attendance/combined/my?date_from=&date_to= ────────────────────
// Self-service combined view — same "resolve from token, never trust the
// request" pattern as /mssql/my.
attendanceCombinedRouter.get(
  '/my',
  [
    query('date_from').isISO8601().withMessage('date_from must be YYYY-MM-DD'),
    query('date_to').isISO8601().withMessage('date_to must be YYYY-MM-DD'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await attendanceCombinedService.getCombinedForEmployee(
        req.user!.employeeId,
        req.query.date_from as string,
        req.query.date_to as string,
        req.user!.companyId,
      );
      sendResponse(res, {
        data: rows,
        message: `Combined attendance — ${req.query.date_from} to ${req.query.date_to} (${rows.length} day(s))`,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);

export default attendanceCombinedRouter;