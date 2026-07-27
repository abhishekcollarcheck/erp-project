import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service';
import { sendResponse, sendPaginated } from '../../utils/response';

const leaveService = new LeaveService();

// GET /api/leaves
export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows, meta } = await leaveService.getAll(req.query as any, req.user!.employeeId, req.user!.companyId);
    sendPaginated(res, rows, meta, 'Leave requests fetched');
  } catch (e) { next(e); }
}

// GET /api/leaves/pending — pending approvals for current manager
export async function getPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hasOverride = (req.user!.permissions ?? []).includes('leaves:approve') || (req.user!.permissions ?? []).includes('*');
    const leaves = await leaveService.getPendingForManager(req.user!.employeeId, req.user!.companyId, hasOverride);
    sendResponse(res, { data: leaves, message: 'Pending leave requests' });
  } catch (e) { next(e); }
}

// GET /api/leaves/types
export async function getLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const types = await leaveService.getLeaveTypes(req.user!.companyId);
    sendResponse(res, { data: types, message: 'Leave types fetched' });
  } catch (e) { next(e); }
}

// GET /api/leaves/balance — self-service, current employee's balances across all leave types
export async function getMyLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const balances = await leaveService.getMyBalances(req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data: balances, message: 'Your leave balances' });
  } catch (e) { next(e); }
}

// POST /api/leaves — apply
export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // FIX: employee_id is ALWAYS taken from the authenticated token now, never
    // from req.body — previously any authenticated user could apply for
    // leave on behalf of an arbitrary employee_id, including employees at a
    // different company (no company-scoping check existed on it at all).
    // Fields are also explicitly whitelisted rather than spreading req.body.
    const leave = await leaveService.apply(
      {
        employee_id: req.user!.employeeId,
        leave_type_id: req.body.leave_type_id,
        from_date: req.body.from_date,
        to_date: req.body.to_date,
        days: req.body.days,
        half_day: req.body.half_day,
        reason: req.body.reason,
      },
      req.user!.companyId,
    );
    sendResponse(res, { data: leave, message: 'Leave request submitted', statusCode: 201 });
  } catch (e) { next(e); }
}

// PUT /api/leaves/:id/approve
export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leave = await leaveService.approve(
      parseInt(req.params.id, 10),
      req.user!.employeeId,
      req.user!.companyId,
      { permissions: req.user!.permissions ?? [] },
    );
    sendResponse(res, { data: leave, message: 'Leave approved' });
  } catch (e) { next(e); }
}

// PUT /api/leaves/:id/reject
export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leave = await leaveService.reject(
      parseInt(req.params.id, 10),
      req.user!.employeeId,
      req.user!.companyId,
      req.body.reason,
      { permissions: req.user!.permissions ?? [] },
    );
    sendResponse(res, { data: leave, message: 'Leave rejected' });
  } catch (e) { next(e); }
}

// PUT /api/leaves/:id/cancel
export async function cancelLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leave = await leaveService.cancel(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data: leave, message: 'Leave cancelled' });
  } catch (e) { next(e); }
}