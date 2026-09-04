import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
// import { validate } from '../../middleware/validate.middleware';
// import { authenticate } from '../auth/auth.middleware';
import { attendanceCombinedService } from './attendance-combined.service';
// import { sendResponse, sendError } from '../../utils/response';
import { runMonthlyAttendanceForAllEmployees } from './attendance.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import { sendError, sendResponse } from './response';

// import {
//   resolveLeaveContextForDate,
// } from "./leave-attendance-bridge.service";

const attendanceCombinedRouter = Router();
attendanceCombinedRouter.use(authenticate);

// ─── GET /api/attendance/combined/my?date_from=&date_to=&demo=true ───────────
// Self-service combined view — same "resolve from token, never trust the
// request" pattern as /mssql/my. Supports ?demo=true to retrieve test scenarios.
attendanceCombinedRouter.get(
  '/my',
  [
    query('date_from').isISO8601().withMessage('date_from must be YYYY-MM-DD'),
    query('date_to').isISO8601().withMessage('date_to must be YYYY-MM-DD'),
    query('demo').optional().isBoolean().withMessage('demo must be a boolean (true/false)'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isDemo = req.query.demo === 'true';

      const rows = await attendanceCombinedService.getCombinedForEmployee(
        req.user!.employeeId,
        req.query.date_from as string,
        req.query.date_to as string,
        req.user!.companyId,
      );

      const responseMessage = isDemo
        ? `Demo/Scenario evaluation list loaded (${rows.length} test scenario(s))`
        : `Combined attendance — ${req.query.date_from} to ${req.query.date_to} (${rows.length} day(s))`;

      sendResponse(res, {
        data: rows,
        message: responseMessage,
      });
    } catch (e: any) {
      sendError(res, e.message, e.statusCode || 500);
    }
  },
);


attendanceCombinedRouter.post(
  "/monthly/run",
  // requireAuth,
  // requireSuperAdmin,
  runMonthlyAttendanceForAllEmployees,
);
// router.post(
//   "/monthly/run",
//   // requireAuth,
//   // requireSuperAdmin,
//   runMonthlyAttendanceForAllEmployees,
// );

export default attendanceCombinedRouter;