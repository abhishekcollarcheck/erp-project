import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service';
import { sendResponse, sendPaginated, sendError } from '../../utils/response';
import { calculateMonthlyLeave } from './leaveRuleEngine.service';
import { processMonthlyLeave } from './monthlyLeave.service';

const leaveService = new LeaveService();

// GET /api/leaves
export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permissions = req.user!.permissions ?? [];
    const canViewCompanyWide = req.user!.isSuperAdmin || permissions.includes('*') || permissions.includes('leaves:approve');

    const query: Record<string, unknown> = { ...req.query };
    const requestedEmployeeId = query.employee_id ? Number(query.employee_id) : undefined;

    if (!canViewCompanyWide) {
      // Without the broad approve permission you can only ever see your own requests —
      // force-scope rather than trust whatever employee_id was passed in.
      if (requestedEmployeeId && requestedEmployeeId !== req.user!.employeeId) {
        sendError(res, "Forbidden: cannot view another employee's leave requests", 403);
        return;
      }
      query.employee_id = req.user!.employeeId;
    }

    const { rows, meta } = await leaveService.getAll(query as any, req.user!.companyId);
    sendPaginated(res, rows, meta, 'Leave requests fetched');
  } catch (e) { next(e); }
}

// GET /api/leaves/pending — pending approvals for current manager
export async function getPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leaves = await leaveService.getPendingForManager(req.user!.employeeId, req.user!.companyId);
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

// GET /api/leaves/balance — current employee's balance, or ?employee_id=X for
// anyone with leaves:approve (e.g. HR picking a target employee to apply for)
// export async function getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;

//     if (requestedEmployeeId !== req.user!.employeeId) {
//       const permissions = req.user!.permissions ?? [];
//       const canViewOthers = req.user!.isSuperAdmin || permissions.includes('*') || permissions.includes('leaves:approve');
//       if (!canViewOthers) {
//         sendError(res, "Forbidden: cannot view another employee's leave balance", 403);
//         return;
//       }
//     }

//     const balances = await leaveService.getBalances(requestedEmployeeId, req.user!.companyId);
//     sendResponse(res, { data: balances, message: 'Leave balances fetched' });
//   } catch (e) { next(e); }
// }


export async function getLeaveBalances(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestedEmployeeId = req.query.employee_id
      ? Number(req.query.employee_id)
      : req.user!.employeeId;


    // Validate employee_id if provided
    if (
      req.query.employee_id &&
      (!Number.isInteger(requestedEmployeeId) || requestedEmployeeId <= 0)
    ) {
      sendError(res, 'Invalid employee_id', 400);
      return;
    }

    // Employee can only view their own balance
    // unless they have permission to view/manage others.
    if (requestedEmployeeId !== req.user!.employeeId) {
      const permissions = req.user!.permissions ?? [];

      const canViewOthers =
        req.user!.isSuperAdmin ||
        permissions.includes('*') ||
        permissions.includes('leaves:approve');

      if (!canViewOthers) {
        sendError(
          res,
          "Forbidden: cannot view another employee's leave balance",
          403
        );
        return;
      }
    }

    const balances = await leaveService.getBalances(
      requestedEmployeeId,
    );

    sendResponse(res, {
      data: balances,
      message: 'Leave balances fetched',
    });
  } catch (e) {
    next(e);
  }
}

// POST /api/leaves — apply
export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdminSubmission = Number(req.body.employee_id) !== req.user!.employeeId;
    if (isAdminSubmission) {
      const permissions = req.user!.permissions ?? [];
      const canActOnBehalf = req.user!.isSuperAdmin || permissions.includes('*') || permissions.includes('leaves:approve');
      if (!canActOnBehalf) {
        sendError(res, 'Forbidden: cannot apply leave on behalf of another employee', 403);
        return;
      }
    }

    const leave = await leaveService.apply(
      { ...req.body, applied_by: req.user!.employeeId, submission_type: isAdminSubmission ? 'admin' : 'self' },
      req.user!.companyId,
    );
    sendResponse(res, { data: leave, message: 'Leave request submitted', statusCode: 201 });
  } catch (e) { next(e); }
}

// PUT /api/leaves/:id/approve
export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leave = await leaveService.approve(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
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







// export async function calculateMonthlyLeaveController(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const employeeId = Number(req.query.employee_id);
//     const year = req.query.year
//       ? Number(req.query.year)
//       : new Date().getFullYear();

//     const month = req.query.month
//       ? Number(req.query.month)
//       : new Date().getMonth() + 1;

//     // Validation
//     if (!employeeId || employeeId <= 0) {
//       res.status(400).json({
//         success: false,
//         message: 'Valid employee_id is required',
//       });
//       return;
//     }

//     if (!year || year < 2000) {
//       res.status(400).json({
//         success: false,
//         message: 'Valid year is required',
//       });
//       return;
//     }

//     if (!month || month < 1 || month > 12) {
//       res.status(400).json({
//         success: false,
//         message: 'Month must be between 1 and 12',
//       });
//       return;
//     }

//     const result = await calculateMonthlyLeave(
//       employeeId,
//       year,
//       month
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Monthly leave calculation completed',
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// }



export const processMonthlyLeaveController = async (
  req: Request,
  res: Response
) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!employeeId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, year and month are required',
      });
    }

    const result = await processMonthlyLeave(
      employeeId,
      year,
      month
    );

    return res.status(200).json({
      success: true,
      message: 'Monthly leave processed successfully',
      data: result,
    });

  } catch (error: any) {
    console.error(
      '[MONTHLY LEAVE CONTROLLER ERROR]',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || 'Monthly leave processing failed',
    });
  }
};