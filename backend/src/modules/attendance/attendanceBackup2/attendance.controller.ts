import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { sendResponse, sendPaginated } from '../../utils/response';
import { AppError } from '@/middleware/errorHandler.middleware';
import { runMonthlyAttendanceJob } from './attendance-monthly.cron';

const attendanceService = new AttendanceService();

/**
 * GET /api/attendance/today-summary
 */
export async function getTodaySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await attendanceService.getTodaySummary(req.user!.companyId);
    sendResponse(res, { data, message: 'Today attendance summary' });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/attendance/employee/:employeeId
 */
export async function getByEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const month = Number(req.query.month ?? new Date().getMonth() + 1);
    const year = Number(req.query.year ?? new Date().getFullYear());
    const data = await attendanceService.getByEmployee(employeeId, month, year, req.user!.companyId);
    sendResponse(res, { data, message: 'Attendance records fetched' });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/attendance
 * Supports: page, limit, employee_id, search, status, source,
 *           date_from, date_to, month, year, sort
 */
export async function getAllAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, meta } = await attendanceService.getAll(req.query as any, req.user!.companyId);
    sendPaginated(res, data, meta, 'Attendance records fetched');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/attendance
 */
export async function markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { record, created } = await attendanceService.mark({
      company_id: req.user!.companyId,
      employee_id: req.body.employee_id,
      date: req.body.date,
      status: req.body.status,
      check_in: req.body.check_in,
      check_out: req.body.check_out,
      remarks: req.body.remarks,
      created_by: req.user!.employeeId,
    });
    sendResponse(res, {
      data: record,
      message: created ? 'Attendance marked' : 'Attendance updated',
      statusCode: created ? 201 : 200,
    });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/attendance/bulk
 */
export async function bulkMarkAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await attendanceService.bulkMark(req.body.records, req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data: result, message: `Bulk mark: ${result.success} succeeded, ${result.failed} failed` });
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/attendance/:id
 */
export async function updateAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await attendanceService.update(
      parseInt(req.params.id, 10),
      { status: req.body.status, check_in: req.body.check_in, check_out: req.body.check_out, remarks: req.body.remarks },
      req.user!.companyId,
    );
    sendResponse(res, { data: record, message: 'Attendance updated' });
  } catch (e) {
    next(e);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Regularization
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/attendance/regularization
 */
export async function createRegularization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await attendanceService.createRegularization({
      company_id: req.user!.companyId,
      employee_id: req.user!.employeeId,
      date: req.body.date,
      requested_check_in: req.body.requested_check_in,
      requested_check_out: req.body.requested_check_out,
      reason: req.body.reason,
      created_by: req.user!.employeeId,
    });
    sendResponse(res, { data: record, message: 'Regularization request submitted', statusCode: 201 });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/attendance/regularization/my
 */
export async function getMyRegularizations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await attendanceService.listMyRegularizations(req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data, message: 'Your regularization requests' });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/attendance/regularization/pending
 */
export async function getPendingRegularizations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await attendanceService.listPendingRegularizations(req.user!.companyId);
    sendResponse(res, { data, message: `${data.length} pending request(s)` });
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/attendance/regularization/:id/review
 * body: { decision: 'Approved' | 'Rejected', remarks?: string }
 */
export async function reviewRegularization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await attendanceService.reviewRegularization(
      parseInt(req.params.id, 10),
      req.user!.companyId,
      req.body.decision,
      req.user!.employeeId,
      req.body.remarks,
    );
    sendResponse(res, { data: record, message: `Request ${req.body.decision.toLowerCase()}` });
  } catch (e) {
    next(e);
  }
}



export async function runMonthlyAttendanceForAllEmployees(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { date } = req.body as { date?: string };
 
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("date must be in YYYY-MM-DD format", 400);
    }
 
    // FIX: `date` was validated above but never actually passed to
    // runMonthlyAttendanceJob(), so a caller-supplied date silently
    // had no effect — the job always ran for "yesterday" regardless.
    const summary = await runMonthlyAttendanceJob(date);
 
    res.status(200).json({
      success: true,
      // FIX: `summary` is an object, not a string — interpolating it
      // directly produced "[object Object]" in the response message.
      message: `Monthly attendance recalculated for ${summary.endDate}`,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
