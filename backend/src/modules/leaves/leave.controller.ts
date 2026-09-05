// import { Request, Response, NextFunction } from 'express';
// import { LeaveService } from './leave.service';
// import { sendResponse, sendPaginated, sendError } from '../../utils/response';
// import { calculateMonthlyLeave } from './leaveRuleEngine.service';
// import { processMonthlyLeave } from './monthlyLeave.service';

// const leaveService = new LeaveService();

// // GET /api/leaves
// export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const permissions = req.user!.permissions ?? [];
//     const canViewCompanyWide = req.user!.isSuperAdmin || permissions.includes('*') || permissions.includes('leaves:approve');

//     const query: Record<string, unknown> = { ...req.query };
//     const requestedEmployeeId = query.employee_id ? Number(query.employee_id) : undefined;

//     if (!canViewCompanyWide) {
//       // Without the broad approve permission you can only ever see your own requests —
//       // force-scope rather than trust whatever employee_id was passed in.
//       if (requestedEmployeeId && requestedEmployeeId !== req.user!.employeeId) {
//         sendError(res, "Forbidden: cannot view another employee's leave requests", 403);
//         return;
//       }
//       query.employee_id = req.user!.employeeId;
//     }

//     const { rows, meta } = await leaveService.getAll(query as any, req.user!.companyId);
//     sendPaginated(res, rows, meta, 'Leave requests fetched');
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/pending — pending approvals for current manager
// export async function getPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const leaves = await leaveService.getPendingForManager(req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leaves, message: 'Pending leave requests' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/types
// export async function getLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const types = await leaveService.getLeaveTypes(req.user!.companyId);
//     sendResponse(res, { data: types, message: 'Leave types fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/balance — current employee's balance, or ?employee_id=X for
// // anyone with leaves:approve (e.g. HR picking a target employee to apply for)
// // export async function getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
// //   try {
// //     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;

// //     if (requestedEmployeeId !== req.user!.employeeId) {
// //       const permissions = req.user!.permissions ?? [];
// //       const canViewOthers = req.user!.isSuperAdmin || permissions.includes('*') || permissions.includes('leaves:approve');
// //       if (!canViewOthers) {
// //         sendError(res, "Forbidden: cannot view another employee's leave balance", 403);
// //         return;
// //       }
// //     }

// //     const balances = await leaveService.getBalances(requestedEmployeeId, req.user!.companyId);
// //     sendResponse(res, { data: balances, message: 'Leave balances fetched' });
// //   } catch (e) { next(e); }
// // }


// export async function getLeaveBalances(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id
//       ? Number(req.query.employee_id)
//       : req.user!.employeeId;


//     // Validate employee_id if provided
//     if (
//       req.query.employee_id &&
//       (!Number.isInteger(requestedEmployeeId) || requestedEmployeeId <= 0)
//     ) {
//       sendError(res, 'Invalid employee_id', 400);
//       return;
//     }

//     // Employee can only view their own balance
//     // unless they have permission to view/manage others.
//     if (requestedEmployeeId !== req.user!.employeeId) {
//       const permissions = req.user!.permissions ?? [];

//       const canViewOthers =
//         req.user!.isSuperAdmin ||
//         permissions.includes('*') ||
//         permissions.includes('leaves:approve');

//       if (!canViewOthers) {
//         sendError(
//           res,
//           "Forbidden: cannot view another employee's leave balance",
//           403
//         );
//         return;
//       }
//     }

//     const balances = await leaveService.getBalances(
//       requestedEmployeeId,
//     );

//     sendResponse(res, {
//       data: balances,
//       message: 'Leave balances fetched',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// // POST /api/leaves — apply
// export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const isAdminSubmission = Number(req.body.employee_id) !== req.user!.employeeId;
//     if (isAdminSubmission) {
//       const permissions = req.user!.permissions ?? [];
//       const canActOnBehalf = req.user!.isSuperAdmin || permissions.includes('*') || permissions.includes('leaves:approve');
//       if (!canActOnBehalf) {
//         sendError(res, 'Forbidden: cannot apply leave on behalf of another employee', 403);
//         return;
//       }
//     }

//     const leave = await leaveService.apply(
//       { ...req.body, applied_by: req.user!.employeeId, submission_type: isAdminSubmission ? 'admin' : 'self' },
//       req.user!.companyId,
//     );
//     sendResponse(res, { data: leave, message: 'Leave request submitted', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/approve
// export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const leave = await leaveService.approve(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leave, message: 'Leave approved' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/reject
// export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const leave = await leaveService.reject(
//       parseInt(req.params.id, 10),
//       req.user!.employeeId,
//       req.user!.companyId,
//       req.body.reason,
//     );
//     sendResponse(res, { data: leave, message: 'Leave rejected' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/cancel
// export async function cancelLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const leave = await leaveService.cancel(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leave, message: 'Leave cancelled' });
//   } catch (e) { next(e); }
// }







// // export async function calculateMonthlyLeaveController(
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ): Promise<void> {
// //   try {
// //     const employeeId = Number(req.query.employee_id);
// //     const year = req.query.year
// //       ? Number(req.query.year)
// //       : new Date().getFullYear();

// //     const month = req.query.month
// //       ? Number(req.query.month)
// //       : new Date().getMonth() + 1;

// //     // Validation
// //     if (!employeeId || employeeId <= 0) {
// //       res.status(400).json({
// //         success: false,
// //         message: 'Valid employee_id is required',
// //       });
// //       return;
// //     }

// //     if (!year || year < 2000) {
// //       res.status(400).json({
// //         success: false,
// //         message: 'Valid year is required',
// //       });
// //       return;
// //     }

// //     if (!month || month < 1 || month > 12) {
// //       res.status(400).json({
// //         success: false,
// //         message: 'Month must be between 1 and 12',
// //       });
// //       return;
// //     }

// //     const result = await calculateMonthlyLeave(
// //       employeeId,
// //       year,
// //       month
// //     );

// //     res.status(200).json({
// //       success: true,
// //       message: 'Monthly leave calculation completed',
// //       data: result,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // }



// export const processMonthlyLeaveController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const employeeId = Number(req.params.employeeId);
//     const year = Number(req.query.year);
//     const month = Number(req.query.month);

//     if (!employeeId || !year || !month) {
//       return res.status(400).json({
//         success: false,
//         message: 'employeeId, year and month are required',
//       });
//     }

//     const result = await processMonthlyLeave(
//       employeeId,
//       year,
//       month
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Monthly leave processed successfully',
//       data: result,
//     });

//   } catch (error: any) {
//     console.error(
//       '[MONTHLY LEAVE CONTROLLER ERROR]',
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Monthly leave processing failed',
//     });
//   }
// };






// import { Request, Response, NextFunction } from 'express';
// import { LeaveService } from './leave.service';
// import { sendResponse, sendPaginated, sendError } from '../../utils/response';

// const leaveService = new LeaveService();

// /* ============================================================================
//  * PERMISSION HELPERS
//  * ----------------------------------------------------------------------------
//  * Same pattern your existing controller already uses inline
//  * (isSuperAdmin || '*' || a specific permission string) — pulled into one
//  * place so every handler below checks the same way.
//  *
//  * 'leaves:approve' — already used by your old controller (approvals, viewing
//  *   company-wide requests/balances). Kept exactly as-is.
//  * 'leaves:manage'  — NEW, assumed. Used below for anything admin/HR-only that
//  *   your old controller never had to gate: leave-type CRUD, sandwich policy,
//  *   weekly-off assignment, special-leave crediting. Adjust the string to
//  *   match whatever this permission is actually called in your seed data.
//  * ==========================================================================*/

// const LEAVE_APPROVE_PERM = 'leaves:approve';
// const LEAVE_MANAGE_PERM = 'leaves:manage';

// function hasPerm(req: Request, perm: string): boolean {
//   const permissions = req.user!.permissions ?? [];
//   return Boolean(req.user!.isSuperAdmin) || permissions.includes('*') || permissions.includes(perm);
// }

// function canApprove(req: Request): boolean {
//   return hasPerm(req, LEAVE_APPROVE_PERM);
// }

// function canManage(req: Request): boolean {
//   return hasPerm(req, LEAVE_MANAGE_PERM);
// }

// function requireManage(req: Request, res: Response): boolean {
//   if (!canManage(req)) {
//     sendError(res, 'Forbidden: leave policy management permission required', 403);
//     return false;
//   }
//   return true;
// }

// /* ============================================================================
//  * LEAVE REQUESTS — LeaveRequest
//  * ==========================================================================*/

// // GET /api/leaves
// export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const query: Record<string, unknown> = { ...req.query };
//     const requestedEmployeeId = query.employee_id ? Number(query.employee_id) : undefined;

//     if (!canApprove(req)) {
//       // Without the broad approve permission you can only ever see your own requests —
//       // force-scope rather than trust whatever employee_id was passed in.
//       if (requestedEmployeeId && requestedEmployeeId !== req.user!.employeeId) {
//         sendError(res, "Forbidden: cannot view another employee's leave requests", 403);
//         return;
//       }
//       query.employee_id = req.user!.employeeId;
//     }

//     const { rows, meta } = await leaveService.getAll(query as any, req.user!.companyId);
//     sendPaginated(res, rows, meta, 'Leave requests fetched');
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/pending
// export async function getPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot view pending approvals', 403);
//       return;
//     }
//     const leaves = await leaveService.getPendingForManager(req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leaves, message: 'Pending leave requests' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/:id
// export async function getLeaveById(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const leave = await leaveService.getById(id, req.user!.companyId);

//     if (!canApprove(req) && leave.employee_id !== req.user!.employeeId) {
//       sendError(res, "Forbidden: cannot view another employee's leave request", 403);
//       return;
//     }
//     sendResponse(res, { data: leave, message: 'Leave request fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/:id/breakdown — per-day sandwich/charged audit trail (LeaveRequestDay)
// export async function getLeaveRequestBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const leave = await leaveService.getById(id, req.user!.companyId);

//     if (!canApprove(req) && leave.employee_id !== req.user!.employeeId) {
//       sendError(res, "Forbidden: cannot view another employee's leave breakdown", 403);
//       return;
//     }

//     const breakdown = await leaveService.getBreakdown(id);
//     sendResponse(res, { data: breakdown, message: 'Leave day breakdown fetched' });
//   } catch (e) { next(e); }
// }

// // POST /api/leaves — apply
// export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const isAdminSubmission = Number(req.body.employee_id) !== req.user!.employeeId;
//     if (isAdminSubmission && !canApprove(req)) {
//       sendError(res, 'Forbidden: cannot apply leave on behalf of another employee', 403);
//       return;
//     }

//     const leave = await leaveService.apply(
//       { ...req.body, applied_by: req.user!.employeeId, submission_type: isAdminSubmission ? 'admin' : 'self' },
//       req.user!.companyId,
//     );
//     sendResponse(res, { data: leave, message: 'Leave request submitted', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/approve
// export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot approve leave requests', 403);
//       return;
//     }
//     const leave = await leaveService.approve(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leave, message: 'Leave approved' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/reject
// export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot reject leave requests', 403);
//       return;
//     }
//     const leave = await leaveService.reject(
//       parseInt(req.params.id, 10),
//       req.user!.employeeId,
//       req.user!.companyId,
//       req.body.reason,
//     );
//     sendResponse(res, { data: leave, message: 'Leave rejected' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/cancel
// export async function cancelLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const leave = await leaveService.cancel(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leave, message: 'Leave cancelled' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * LEAVE TYPES — LeaveType (admin-configurable policy master)
//  * ==========================================================================*/

// // GET /api/leaves/types
// export async function getLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const types = await leaveService.getLeaveTypes(req.user!.companyId);
//     sendResponse(res, { data: types, message: 'Leave types fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/types/:id
// export async function getLeaveTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const type = await leaveService.getLeaveTypeById(id, req.user!.companyId);
//     sendResponse(res, { data: type, message: 'Leave type fetched' });
//   } catch (e) { next(e); }
// }

// // POST /api/leaves/types
// export async function createLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const type = await leaveService.createLeaveType(req.body, req.user!.companyId);
//     sendResponse(res, { data: type, message: 'Leave type created', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/types/:id
// export async function updateLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const id = parseInt(req.params.id, 10);
//     const type = await leaveService.updateLeaveType(id, req.body, req.user!.companyId);
//     sendResponse(res, { data: type, message: 'Leave type updated' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/types/:id/active — enable/disable (soft delete, is_active flag)
// export async function setLeaveTypeActive(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const id = parseInt(req.params.id, 10);
//     const isActive = Boolean(req.body.is_active);
//     const type = await leaveService.setLeaveTypeActive(id, isActive, req.user!.companyId);
//     sendResponse(res, { data: type, message: `Leave type ${isActive ? 'enabled' : 'disabled'}` });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * LEAVE POLICY — LeavePolicySetting (sandwich toggles, one row per company)
//  * ==========================================================================*/

// // GET /api/leaves/policy
// export async function getLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const policy = await leaveService.getLeavePolicy(req.user!.companyId);
//     sendResponse(res, { data: policy, message: 'Leave policy fetched' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/policy
// export async function updateLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const policy = await leaveService.updateLeavePolicy(req.user!.companyId, req.body);
//     sendResponse(res, { data: policy, message: 'Leave policy updated' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * WEEKLY OFF ASSIGNMENT — EmployeeWeeklyOffAssignment
//  * ==========================================================================*/

// // GET /api/leaves/weekly-off?employee_id=X (defaults to caller)
// export async function getEmployeeWeeklyOff(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's weekly-off assignment", 403);
//       return;
//     }
//     const assignment = await leaveService.getEmployeeWeeklyOff(requestedEmployeeId, req.user!.companyId);
//     sendResponse(res, { data: assignment, message: 'Weekly-off assignment fetched' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/weekly-off — { employee_id, weekly_off_preset_id }
// export async function assignEmployeeWeeklyOff(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const { employee_id, weekly_off_preset_id } = req.body;
//     const assignment = await leaveService.assignEmployeeWeeklyOff(
//       Number(employee_id),
//       Number(weekly_off_preset_id),
//       req.user!.companyId,
//     );
//     sendResponse(res, { data: assignment, message: 'Weekly-off assignment saved' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * BALANCES — EmployeeLeaveBalance (annual, day-based) &
//  *             EmployeeLeaveMinutesBalance (monthly, Short Leave)
//  * ==========================================================================*/

// // GET /api/leaves/balance — annual day-based balances (EL/CL/SPECIAL)
// export async function getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;

//     if (req.query.employee_id && (!Number.isInteger(requestedEmployeeId) || requestedEmployeeId <= 0)) {
//       sendError(res, 'Invalid employee_id', 400);
//       return;
//     }
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's leave balance", 403);
//       return;
//     }

//     const year = req.query.year ? Number(req.query.year) : undefined;
//     const balances = await leaveService.getBalances(requestedEmployeeId, year);
//     sendResponse(res, { data: balances, message: 'Leave balances fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/short-balance?employee_id=X&year=Y&month=M — Short Leave monthly minutes
// export async function getShortLeaveBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's short-leave balance", 403);
//       return;
//     }

//     const now = new Date();
//     const year = req.query.year ? Number(req.query.year) : now.getFullYear();
//     const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
//     if (month < 1 || month > 12) {
//       sendError(res, 'Month must be between 1 and 12', 400);
//       return;
//     }

//     const balance = await leaveService.getShortLeaveBalance(requestedEmployeeId, year, month);
//     sendResponse(res, { data: balance, message: 'Short leave balance fetched' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * ACCRUALS — EmployeeLeaveAccrual
//  * ==========================================================================*/

// // GET /api/leaves/accruals?employee_id=X&year=Y
// export async function getLeaveAccruals(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's leave accruals", 403);
//       return;
//     }
//     const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
//     const accruals = await leaveService.getLeaveAccruals(requestedEmployeeId, year);
//     sendResponse(res, { data: accruals, message: 'Leave accruals fetched' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * SPECIAL LEAVE CREDITS — LeaveCredit
//  * ==========================================================================*/

// // POST /api/leaves/credits — { employee_id, credit_date, days, holiday_name?, note? }
// export async function creditSpecialLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const credit = await leaveService.creditSpecialLeave(req.body, req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: credit, message: 'Special leave credited', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/credits?employee_id=X
// export async function getLeaveCredits(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's leave credits", 403);
//       return;
//     }
//     const credits = await leaveService.getLeaveCredits(requestedEmployeeId);
//     sendResponse(res, { data: credits, message: 'Leave credits fetched' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * MONTHLY PROCESSING (kept from your original controller, unchanged)
//  * ==========================================================================*/

// // POST /api/leaves/monthly-process/:employeeId?year=Y&month=M
// export const processMonthlyLeaveController = async (req: Request, res: Response) => {
//   try {
//     const employeeId = Number(req.params.employeeId);
//     const year = Number(req.query.year);
//     const month = Number(req.query.month);

//     if (!employeeId || !year || !month) {
//       return res.status(400).json({
//         success: false,
//         message: 'employeeId, year and month are required',
//       });
//     }

//     const result = await leaveService.processMonthlyLeave(employeeId, year, month);

//     return res.status(200).json({
//       success: true,
//       message: 'Monthly leave processed successfully',
//       data: result,
//     });
//   } catch (error: any) {
//     console.error('[MONTHLY LEAVE CONTROLLER ERROR]', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Monthly leave processing failed',
//     });
//   }
// };

// import { Request, Response, NextFunction } from 'express';
// import { LeaveService } from './leave.service';
// import { sendResponse, sendPaginated, sendError } from '../../utils/response';

// const leaveService = new LeaveService();
// /* ============================================================================
//  * PERMISSION HELPERS
//  * ----------------------------------------------------------------------------
//  * Same pattern your existing controller already uses inline
//  * (isSuperAdmin || '*' || a specific permission string) — pulled into one
//  * place so every handler below checks the same way.
//  *
//  * 'leaves:approve' — already used by your old controller (approvals, viewing
//  *   company-wide requests/balances). Kept exactly as-is.
//  * 'leaves:manage'  — NEW, assumed. Used below for anything admin/HR-only that
//  *   your old controller never had to gate: leave-type CRUD, sandwich policy,
//  *   weekly-off assignment, special-leave crediting. Adjust the string to
//  *   match whatever this permission is actually called in your seed data.
//  * ==========================================================================*/
// const LEAVE_APPROVE_PERM = 'leaves:approve';
// const LEAVE_MANAGE_PERM = 'leaves:manage';

// function hasPerm(req: Request, perm: string): boolean {
//   const permissions = req.user!.permissions ?? [];
//   return Boolean(req.user!.isSuperAdmin) || permissions.includes('*') || permissions.includes(perm);
// }

// function canApprove(req: Request): boolean {
//   return hasPerm(req, LEAVE_APPROVE_PERM);
// }

// function canManage(req: Request): boolean {
//   return hasPerm(req, LEAVE_MANAGE_PERM);
// }

// function requireManage(req: Request, res: Response): boolean {
//   if (!canManage(req)) {
//     sendError(res, 'Forbidden: leave policy management permission required', 403);
//     return false;
//   }
//   return true;
// }

// /* ============================================================================
//  * LEAVE REQUESTS — LeaveRequest
//  * ==========================================================================*/

// // GET /api/leaves
// export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const query: Record<string, unknown> = { ...req.query };
//     const requestedEmployeeId = query.employee_id ? Number(query.employee_id) : undefined;

//     if (!canApprove(req)) {
//       // Without the broad approve permission you can only ever see your own requests —
//       // force-scope rather than trust whatever employee_id was passed in.
//       if (requestedEmployeeId && requestedEmployeeId !== req.user!.employeeId) {
//         sendError(res, "Forbidden: cannot view another employee's leave requests", 403);
//         return;
//       }
//       query.employee_id = req.user!.employeeId;
//     }

//     const { rows, meta } = await leaveService.getAll(query as any, req.user!.companyId);
//     sendPaginated(res, rows, meta, 'Leave requests fetched');
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/pending
// export async function getPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot view pending approvals', 403);
//       return;
//     }
//     const leaves = await leaveService.getPendingForManager(req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leaves, message: 'Pending leave requests' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/:id
// export async function getLeaveById(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const leave = await leaveService.getById(id, req.user!.companyId);

//     if (!canApprove(req) && leave.employee_id !== req.user!.employeeId) {
//       sendError(res, "Forbidden: cannot view another employee's leave request", 403);
//       return;
//     }
//     sendResponse(res, { data: leave, message: 'Leave request fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/:id/breakdown — per-day sandwich/charged audit trail (LeaveRequestDay)
// export async function getLeaveRequestBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const leave = await leaveService.getById(id, req.user!.companyId);

//     if (!canApprove(req) && leave.employee_id !== req.user!.employeeId) {
//       sendError(res, "Forbidden: cannot view another employee's leave breakdown", 403);
//       return;
//     }

//     const breakdown = await leaveService.getBreakdown(id);
//     sendResponse(res, { data: breakdown, message: 'Leave day breakdown fetched' });
//   } catch (e) { next(e); }
// }

// // POST /api/leaves — apply
// export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const isAdminSubmission = Number(req.body.employee_id) !== req.user!.employeeId;
//     if (isAdminSubmission && !canApprove(req)) {
//       sendError(res, 'Forbidden: cannot apply leave on behalf of another employee', 403);
//       return;
//     }

//     const leave = await leaveService.apply(
//       { ...req.body, applied_by: req.user!.employeeId, submission_type: isAdminSubmission ? 'admin' : 'self' },
//       req.user!.companyId,
//     );
//     sendResponse(res, { data: leave, message: 'Leave request submitted', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/approve
// export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot approve leave requests', 403);
//       return;
//     }
//     const leave = await leaveService.approve(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leave, message: 'Leave approved' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/reject
// export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot reject leave requests', 403);
//       return;
//     }
//     const leave = await leaveService.reject(
//       parseInt(req.params.id, 10),
//       req.user!.employeeId,
//       req.user!.companyId,
//       req.body.reason,
//     );
//     sendResponse(res, { data: leave, message: 'Leave rejected' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/:id/cancel
// export async function cancelLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const leave = await leaveService.cancel(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: leave, message: 'Leave cancelled' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * LEAVE TYPES — LeaveType (admin-configurable policy master)
//  * ==========================================================================*/

// // GET /api/leaves/types
// export async function getLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const types = await leaveService.getLeaveTypes(req.user!.companyId);
//     sendResponse(res, { data: types, message: 'Leave types fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/types/:id
// export async function getLeaveTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const type = await leaveService.getLeaveTypeById(id, req.user!.companyId);
//     sendResponse(res, { data: type, message: 'Leave type fetched' });
//   } catch (e) { next(e); }
// }

// // POST /api/leaves/types
// export async function createLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const type = await leaveService.createLeaveType(req.body, req.user!.companyId);
//     sendResponse(res, { data: type, message: 'Leave type created', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/types/:id
// export async function updateLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const id = parseInt(req.params.id, 10);
//     const type = await leaveService.updateLeaveType(id, req.body, req.user!.companyId);
//     sendResponse(res, { data: type, message: 'Leave type updated' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/types/:id/active — enable/disable (soft delete, is_active flag)
// export async function setLeaveTypeActive(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const id = parseInt(req.params.id, 10);
//     const isActive = Boolean(req.body.is_active);
//     const type = await leaveService.setLeaveTypeActive(id, isActive, req.user!.companyId);
//     sendResponse(res, { data: type, message: `Leave type ${isActive ? 'enabled' : 'disabled'}` });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * LEAVE POLICY — LeavePolicySetting (sandwich toggles, one row per company)
//  * ==========================================================================*/

// // GET /api/leaves/policy
// export async function getLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const policy = await leaveService.getLeavePolicy(req.user!.companyId);
//     sendResponse(res, { data: policy, message: 'Leave policy fetched' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/policy
// export async function updateLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const policy = await leaveService.updateLeavePolicy(req.user!.companyId, req.body);
//     sendResponse(res, { data: policy, message: 'Leave policy updated' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * WEEKLY OFF ASSIGNMENT — EmployeeWeeklyOffAssignment
//  * ==========================================================================*/

// // GET /api/leaves/weekly-off?employee_id=X (defaults to caller)
// export async function getEmployeeWeeklyOff(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's weekly-off assignment", 403);
//       return;
//     }
//     const assignment = await leaveService.getEmployeeWeeklyOff(requestedEmployeeId, req.user!.companyId);
//     sendResponse(res, { data: assignment, message: 'Weekly-off assignment fetched' });
//   } catch (e) { next(e); }
// }

// // PUT /api/leaves/weekly-off — { employee_id, weekly_off_preset_id }
// export async function assignEmployeeWeeklyOff(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const { employee_id, weekly_off_preset_id } = req.body;
//     const assignment = await leaveService.assignEmployeeWeeklyOff(
//       Number(employee_id),
//       Number(weekly_off_preset_id),
//       req.user!.companyId,
//     );
//     sendResponse(res, { data: assignment, message: 'Weekly-off assignment saved' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * BALANCES — EmployeeLeaveBalance (annual, day-based) &
//  *             EmployeeLeaveMinutesBalance (monthly, Short Leave)
//  * ==========================================================================*/

// // GET /api/leaves/balance — annual day-based balances (EL/CL/SPECIAL)
// export async function getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;

//     if (req.query.employee_id && (!Number.isInteger(requestedEmployeeId) || requestedEmployeeId <= 0)) {
//       sendError(res, 'Invalid employee_id', 400);
//       return;
//     }
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's leave balance", 403);
//       return;
//     }

//     const year = req.query.year ? Number(req.query.year) : undefined;
//     const balances = await leaveService.getBalances(requestedEmployeeId, year);
//     sendResponse(res, { data: balances, message: 'Leave balances fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/balances/overview — every employee's balance, one row each (admin/HR)
// export async function getCompanyLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!canApprove(req)) {
//       sendError(res, 'Forbidden: cannot view company-wide leave balances', 403);
//       return;
//     }
//     const year = req.query.year ? Number(req.query.year) : undefined;
//     const overview = await leaveService.getCompanyBalancesOverview(req.user!.companyId, year);
//     sendResponse(res, { data: overview, message: 'Company leave balances fetched' });
//   } catch (e) { 
//     console.log(e);
//     next(e); }
// }

// // GET /api/leaves/short-balance?employee_id=X&year=Y&month=M — Short Leave monthly minutes
// export async function getShortLeaveBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's short-leave balance", 403);
//       return;
//     }

//     const now = new Date();
//     const year = req.query.year ? Number(req.query.year) : now.getFullYear();
//     const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
//     if (month < 1 || month > 12) {
//       sendError(res, 'Month must be between 1 and 12', 400);
//       return;
//     }

//     const balance = await leaveService.getShortLeaveBalance(requestedEmployeeId, year, month, req.user!.companyId);
//     sendResponse(res, { data: balance, message: 'Short leave balance fetched' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * ACCRUALS — EmployeeLeaveAccrual
//  * ==========================================================================*/

// // GET /api/leaves/accruals?employee_id=X&year=Y
// export async function getLeaveAccruals(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's leave accruals", 403);
//       return;
//     }
//     const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
//     const accruals = await leaveService.getLeaveAccruals(requestedEmployeeId, year, req.user!.companyId);
//     sendResponse(res, { data: accruals, message: 'Leave accruals fetched' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * SPECIAL LEAVE CREDITS — LeaveCredit
//  * ==========================================================================*/

// // POST /api/leaves/credits — { employee_id, credit_date, days, holiday_name?, note? }
// export async function creditSpecialLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     if (!requireManage(req, res)) return;
//     const credit = await leaveService.creditSpecialLeave(req.body, req.user!.employeeId, req.user!.companyId);
//     sendResponse(res, { data: credit, message: 'Special leave credited', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // GET /api/leaves/credits?employee_id=X
// export async function getLeaveCredits(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
//     if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
//       sendError(res, "Forbidden: cannot view another employee's leave credits", 403);
//       return;
//     }
//     const credits = await leaveService.getLeaveCredits(requestedEmployeeId, req.user!.companyId);
//     sendResponse(res, { data: credits, message: 'Leave credits fetched' });
//   } catch (e) { next(e); }
// }

// /* ============================================================================
//  * MONTHLY PROCESSING (kept from your original controller, unchanged)
//  * ==========================================================================*/

// // POST /api/leaves/monthly-process/:employeeId?year=Y&month=M
// export const processMonthlyLeaveController = async (req: Request, res: Response) => {
//   try {
//     const employeeId = Number(req.params.employeeId);
//     const year = Number(req.query.year);
//     const month = Number(req.query.month);

//     if (!employeeId || !year || !month) {
//       return res.status(400).json({
//         success: false,
//         message: 'employeeId, year and month are required',
//       });
//     }

//     const result = await leaveService.processMonthlyLeave(employeeId, year, month);

//     return res.status(200).json({
//       success: true,
//       message: 'Monthly leave processed successfully',
//       data: result,
//     });
//   } catch (error: any) {
//     console.error('[MONTHLY LEAVE CONTROLLER ERROR]', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Monthly leave processing failed',
//     });
//   }
// };




// export async function getMyManagedEmployees(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const managerEmployeeId = req.user!.employeeId;
//     const companyId = req.user!.companyId;

//     const employees = await leaveService.getMyManagedEmployees(
//       managerEmployeeId,
//       companyId,
//     );

//     sendResponse(res, {
//       data: employees,
//       message: 'Managed employees fetched',
//     });
//   } catch (e) {
//     next(e);
//   }
// }


// // GET /api/leaves/my-managers
// export async function getMyManagers(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const employeeId = req.user!.employeeId;
//     const companyId = req.user!.companyId;

//     const managers = await leaveService.getMyManagers(
//       employeeId,
//       companyId,
//     );

//     sendResponse(res, {
//       data: managers,
//       message: 'Managers fetched',
//     });
//   } catch (e) {
//     next(e);
//   }
// }




import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service';
import { sendResponse, sendPaginated, sendError } from '../../utils/response';

const leaveService = new LeaveService();
/* ============================================================================
 * PERMISSION HELPERS
 * ----------------------------------------------------------------------------
 * Same pattern your existing controller already uses inline
 * (isSuperAdmin || '*' || a specific permission string) — pulled into one
 * place so every handler below checks the same way.
 *
 * 'leaves:approve' — already used by your old controller (approvals, viewing
 *   company-wide requests/balances). Kept exactly as-is.
 * 'leaves:manage'  — NEW, assumed. Used below for anything admin/HR-only that
 *   your old controller never had to gate: leave-type CRUD, sandwich policy,
 *   weekly-off assignment, special-leave crediting. Adjust the string to
 *   match whatever this permission is actually called in your seed data.
 * ==========================================================================*/
const LEAVE_APPROVE_PERM = 'leaves:approve';
const LEAVE_MANAGE_PERM = 'leaves:manage';

function hasPerm(req: Request, perm: string): boolean {
  const permissions = req.user!.permissions ?? [];
  return Boolean(req.user!.isSuperAdmin) || permissions.includes('*') || permissions.includes(perm);
}

function canApprove(req: Request): boolean {
  return hasPerm(req, LEAVE_APPROVE_PERM);
}

function canManage(req: Request): boolean {
  return hasPerm(req, LEAVE_MANAGE_PERM);
}

function requireManage(req: Request, res: Response): boolean {
  if (!canManage(req)) {
    sendError(res, 'Forbidden: leave policy management permission required', 403);
    return false;
  }
  return true;
}

/* ============================================================================
 * LEAVE REQUESTS — LeaveRequest
 * ==========================================================================*/

// GET /api/leaves
export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query: Record<string, unknown> = { ...req.query };
    const requestedEmployeeId = query.employee_id ? Number(query.employee_id) : undefined;

    if (!canApprove(req)) {
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

// GET /api/leaves/pending
export async function getPendingLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canApprove(req)) {
      sendError(res, 'Forbidden: cannot view pending approvals', 403);
      return;
    }
    const leaves = await leaveService.getPendingForManager(req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data: leaves, message: 'Pending leave requests' });
  } catch (e) { next(e); }
}

// GET /api/leaves/:id
export async function getLeaveById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const leave = await leaveService.getById(id, req.user!.companyId);

    if (!canApprove(req) && leave.employee_id !== req.user!.employeeId) {
      sendError(res, "Forbidden: cannot view another employee's leave request", 403);
      return;
    }
    sendResponse(res, { data: leave, message: 'Leave request fetched' });
  } catch (e) { next(e); }
}

// GET /api/leaves/:id/breakdown — per-day sandwich/charged audit trail (LeaveRequestDay)
export async function getLeaveRequestBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const leave = await leaveService.getById(id, req.user!.companyId);

    if (!canApprove(req) && leave.employee_id !== req.user!.employeeId) {
      sendError(res, "Forbidden: cannot view another employee's leave breakdown", 403);
      return;
    }

    const breakdown = await leaveService.getBreakdown(id);
    sendResponse(res, { data: breakdown, message: 'Leave day breakdown fetched' });
  } catch (e) { next(e); }
}

// POST /api/leaves — apply
export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdminSubmission = Number(req.body.employee_id) !== req.user!.employeeId;
    if (isAdminSubmission && !canApprove(req)) {
      sendError(res, 'Forbidden: cannot apply leave on behalf of another employee', 403);
      return;
    }

    const leave = await leaveService.apply(
      {
        ...req.body,
        l1_manager_id:
          req.body.l1_manager_id === null || req.body.l1_manager_id === undefined
            ? null
            : Number(req.body.l1_manager_id),
        l2_manager_id:
          req.body.l2_manager_id === null || req.body.l2_manager_id === undefined
            ? null
            : Number(req.body.l2_manager_id),
        applied_by: req.user!.employeeId,
        submission_type: isAdminSubmission ? 'admin' : 'self',
      },
      req.user!.companyId,
    );
    sendResponse(res, { data: leave, message: 'Leave request submitted', statusCode: 201 });
  } catch (e) { next(e); }
}

// PUT /api/leaves/:id/approve
export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canApprove(req)) {
      sendError(res, 'Forbidden: cannot approve leave requests', 403);
      return;
    }
    const leave = await leaveService.approve(parseInt(req.params.id, 10), req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data: leave, message: 'Leave approved' });
  } catch (e) { next(e); }
}

// PUT /api/leaves/:id/reject
export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canApprove(req)) {
      sendError(res, 'Forbidden: cannot reject leave requests', 403);
      return;
    }
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

/* ============================================================================
 * LEAVE TYPES — LeaveType (admin-configurable policy master)
 * ==========================================================================*/

// GET /api/leaves/types
export async function getLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const types = await leaveService.getLeaveTypes(req.user!.companyId);
    sendResponse(res, { data: types, message: 'Leave types fetched' });
  } catch (e) { next(e); }
}

// GET /api/leaves/types/:id
export async function getLeaveTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const type = await leaveService.getLeaveTypeById(id, req.user!.companyId);
    sendResponse(res, { data: type, message: 'Leave type fetched' });
  } catch (e) { next(e); }
}

// POST /api/leaves/types
export async function createLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const type = await leaveService.createLeaveType(req.body, req.user!.companyId);
    sendResponse(res, { data: type, message: 'Leave type created', statusCode: 201 });
  } catch (e) { next(e); }
}

// PUT /api/leaves/types/:id
export async function updateLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const type = await leaveService.updateLeaveType(id, req.body, req.user!.companyId);
    sendResponse(res, { data: type, message: 'Leave type updated' });
  } catch (e) { next(e); }
}

// PUT /api/leaves/types/:id/active — enable/disable (soft delete, is_active flag)
export async function setLeaveTypeActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const isActive = Boolean(req.body.is_active);
    const type = await leaveService.setLeaveTypeActive(id, isActive, req.user!.companyId);
    sendResponse(res, { data: type, message: `Leave type ${isActive ? 'enabled' : 'disabled'}` });
  } catch (e) { next(e); }
}

/* ============================================================================
 * LEAVE POLICY — LeavePolicySetting (sandwich toggles, one row per company)
 * ==========================================================================*/

// GET /api/leaves/policy
export async function getLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const policy = await leaveService.getLeavePolicy(req.user!.companyId);
    sendResponse(res, { data: policy, message: 'Leave policy fetched' });
  } catch (e) { next(e); }
}

// PUT /api/leaves/policy
export async function updateLeavePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const policy = await leaveService.updateLeavePolicy(req.user!.companyId, req.body);
    sendResponse(res, { data: policy, message: 'Leave policy updated' });
  } catch (e) { next(e); }
}

/* ============================================================================
 * WEEKLY OFF ASSIGNMENT — EmployeeWeeklyOffAssignment
 * ==========================================================================*/

// GET /api/leaves/weekly-off?employee_id=X (defaults to caller)
export async function getEmployeeWeeklyOff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
    if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
      sendError(res, "Forbidden: cannot view another employee's weekly-off assignment", 403);
      return;
    }
    const assignment = await leaveService.getEmployeeWeeklyOff(requestedEmployeeId, req.user!.companyId);
    sendResponse(res, { data: assignment, message: 'Weekly-off assignment fetched' });
  } catch (e) { next(e); }
}

// PUT /api/leaves/weekly-off — { employee_id, weekly_off_preset_id }
export async function assignEmployeeWeeklyOff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const { employee_id, weekly_off_preset_id } = req.body;
    const assignment = await leaveService.assignEmployeeWeeklyOff(
      Number(employee_id),
      Number(weekly_off_preset_id),
      req.user!.companyId,
    );
    sendResponse(res, { data: assignment, message: 'Weekly-off assignment saved' });
  } catch (e) { next(e); }
}

/* ============================================================================
 * BALANCES — EmployeeLeaveBalance (annual, day-based) &
 *             EmployeeLeaveMinutesBalance (monthly, Short Leave)
 * ==========================================================================*/

// GET /api/leaves/balance — annual day-based balances (EL/CL/SPECIAL)
export async function getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;

    if (req.query.employee_id && (!Number.isInteger(requestedEmployeeId) || requestedEmployeeId <= 0)) {
      sendError(res, 'Invalid employee_id', 400);
      return;
    }
    if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
      sendError(res, "Forbidden: cannot view another employee's leave balance", 403);
      return;
    }

    const year = req.query.year ? Number(req.query.year) : undefined;
    const balances = await leaveService.getBalances(requestedEmployeeId, year);
    sendResponse(res, { data: balances, message: 'Leave balances fetched' });
  } catch (e) { next(e); }
}

// GET /api/leaves/balances/overview — every employee's balance, one row each (admin/HR)
export async function getCompanyLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canApprove(req)) {
      sendError(res, 'Forbidden: cannot view company-wide leave balances', 403);
      return;
    }
    const year = req.query.year ? Number(req.query.year) : undefined;
    const overview = await leaveService.getCompanyBalancesOverview(req.user!.companyId, year);
    sendResponse(res, { data: overview, message: 'Company leave balances fetched' });
  } catch (e) { 
    console.log(e);
    next(e); }
}

// GET /api/leaves/short-balance?employee_id=X&year=Y&month=M — Short Leave monthly minutes
export async function getShortLeaveBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
    if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
      sendError(res, "Forbidden: cannot view another employee's short-leave balance", 403);
      return;
    }

    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    if (month < 1 || month > 12) {
      sendError(res, 'Month must be between 1 and 12', 400);
      return;
    }

    const balance = await leaveService.getShortLeaveBalance(requestedEmployeeId, year, month, req.user!.companyId);
    sendResponse(res, { data: balance, message: 'Short leave balance fetched' });
  } catch (e) { next(e); }
}

/* ============================================================================
 * ACCRUALS — EmployeeLeaveAccrual
 * ==========================================================================*/

// GET /api/leaves/accruals?employee_id=X&year=Y
export async function getLeaveAccruals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
    if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
      sendError(res, "Forbidden: cannot view another employee's leave accruals", 403);
      return;
    }
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const accruals = await leaveService.getLeaveAccruals(requestedEmployeeId, year, req.user!.companyId);
    sendResponse(res, { data: accruals, message: 'Leave accruals fetched' });
  } catch (e) { next(e); }
}

/* ============================================================================
 * SPECIAL LEAVE CREDITS — LeaveCredit
 * ==========================================================================*/

// POST /api/leaves/credits — { employee_id, credit_date, days, holiday_name?, note? }
export async function creditSpecialLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const credit = await leaveService.creditSpecialLeave(req.body, req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data: credit, message: 'Special leave credited', statusCode: 201 });
  } catch (e) { next(e); }
}

// GET /api/leaves/credits?employee_id=X
export async function getLeaveCredits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestedEmployeeId = req.query.employee_id ? Number(req.query.employee_id) : req.user!.employeeId;
    if (requestedEmployeeId !== req.user!.employeeId && !canApprove(req)) {
      sendError(res, "Forbidden: cannot view another employee's leave credits", 403);
      return;
    }
    const credits = await leaveService.getLeaveCredits(requestedEmployeeId, req.user!.companyId);
    sendResponse(res, { data: credits, message: 'Leave credits fetched' });
  } catch (e) { next(e); }
}

/* ============================================================================
 * MONTHLY PROCESSING (kept from your original controller, unchanged)
 * ==========================================================================*/

// POST /api/leaves/monthly-process/:employeeId?year=Y&month=M
export const processMonthlyLeaveController = async (req: Request, res: Response) => {
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

    const result = await leaveService.processMonthlyLeave(employeeId, year, month);

    return res.status(200).json({
      success: true,
      message: 'Monthly leave processed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('[MONTHLY LEAVE CONTROLLER ERROR]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Monthly leave processing failed',
    });
  }
};




export async function getMyManagedEmployees(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const managerEmployeeId = req.user!.employeeId;
    const companyId = req.user!.companyId;

    const employees = await leaveService.getMyManagedEmployees(
      managerEmployeeId,
      companyId,
    );

    sendResponse(res, {
      data: employees,
      message: 'Managed employees fetched',
    });
  } catch (e) {
    next(e);
  }
}


// GET /api/leaves/my-managers
export async function getMyManagers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employeeId = req.user!.employeeId;
    const companyId = req.user!.companyId;

    const managers = await leaveService.getMyManagers(
      employeeId,
      companyId,
    );

    sendResponse(res, {
      data: managers,
      message: 'Managers fetched',
    });
  } catch (e) {
    next(e);
  }
}