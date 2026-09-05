// // import { Router } from 'express';
// // import { validate } from '../../middleware/validate.middleware';
// // import { authenticate, authorize} from '../auth/auth.middleware';
// // import {
// //   listLeaveValidation,
// //   applyLeaveValidation,
// //   rejectLeaveValidation,
// //   idValidation,
// // } from './leave.validation';
// // import {
// //   getLeaves,
// //   getPendingLeaves,
// //   getLeaveTypes,
// //   getLeaveBalances,
// //   applyLeave,
// //   approveLeave,
// //   rejectLeave,
// //   cancelLeave,
// //   processMonthlyLeaveController,
// //   // calculateMonthlyLeaveController,
// // } from './leave.controller';

// // const router = Router();

// // router.use(authenticate);

// // // GET /api/leaves/types
// // router.get('/types', getLeaveTypes);

// // // GET /api/leaves/balance
// // router.get('/balance', getLeaveBalances);

// // // GET /api/leaves/pending — for managers
// // router.get('/pending', authorize('leaves:approve'), getPendingLeaves);

// // // GET /api/leaves
// // router.get('/', listLeaveValidation, validate, getLeaves);

// // // POST /api/leaves — apply for leave
// // router.post('/', applyLeaveValidation, validate, applyLeave);

// // // PUT /api/leaves/:id/approve
// // router.put('/:id/approve', authorize('leaves:approve'), idValidation, validate, approveLeave);

// // // PUT /api/leaves/:id/reject
// // router.put('/:id/reject', authorize('leaves:approve'), rejectLeaveValidation, validate, rejectLeave);

// // // PUT /api/leaves/:id/cancel
// // router.put('/:id/cancel', idValidation, validate, cancelLeave);

// // router.post('/monthly/:employeeId', processMonthlyLeaveController);

// // export default router;



// import { Router } from 'express';
// import {
//   // Leave requests
//   getLeaves,
//   getPendingLeaves,
//   getLeaveById,
//   getLeaveRequestBreakdown,
//   applyLeave,
//   approveLeave,
//   rejectLeave,
//   cancelLeave,
//   // Leave types
//   getLeaveTypes,
//   getLeaveTypeById,
//   createLeaveType,
//   updateLeaveType,
//   setLeaveTypeActive,
//   // Leave policy
//   getLeavePolicy,
//   updateLeavePolicy,
//   // Weekly-off assignment
//   getEmployeeWeeklyOff,
//   assignEmployeeWeeklyOff,
//   // Balances
//   getLeaveBalances,
//   getShortLeaveBalance,
//   // Accruals
//   getLeaveAccruals,
//   // Special leave credits
//   creditSpecialLeave,
//   getLeaveCredits,
//   // Monthly processing
//   processMonthlyLeaveController,
// } from './leave.controller';
// import { authenticate, authorize } from '../auth/auth.middleware';

// const router = Router();

// // Every route below requires an authenticated user (req.user!.employeeId /
// // companyId / permissions are read throughout the controller). Adjust the
// // import path/name if your auth middleware is called something else —
// // I'm guessing 'authenticate' from '../../middleware/auth.middleware' to
// // match the '../../middleware/errorHandler.middleware' path already used
// // in leave.service.ts.
// router.use(authenticate);

// /* ============================================================================
//  * ROUTE ORDER MATTERS
//  * ----------------------------------------------------------------------------
//  * Express matches routes top-to-bottom. Every literal-segment path below
//  * (/types, /policy, /weekly-off, /balance, /short-balance, /accruals,
//  * /credits, /pending, /monthly-process/:employeeId) MUST be registered
//  * before the numeric /:id and /:id/breakdown routes at the bottom — otherwise
//  * a request to e.g. GET /types would get captured by GET /:id first, with
//  * Express trying to parseInt("types") as a leave request id.
//  * ==========================================================================*/

// // ─── Leave Types ────────────────────────────────────────────────────────────
// router.get('/types', getLeaveTypes);
// router.get('/types/:id', getLeaveTypeById);
// router.post('/types', createLeaveType);
// router.put('/types/:id', updateLeaveType);
// router.put('/types/:id/active', setLeaveTypeActive);

// // ─── Leave Policy (sandwich settings) ──────────────────────────────────────
// router.get('/policy', getLeavePolicy);
// router.put('/policy', updateLeavePolicy);

// // ─── Weekly-Off Assignment ──────────────────────────────────────────────────
// router.get('/weekly-off', getEmployeeWeeklyOff);
// router.put('/weekly-off', assignEmployeeWeeklyOff);

// // ─── Balances ────────────────────────────────────────────────────────────────
// router.get('/balance', getLeaveBalances);
// router.get('/short-balance', getShortLeaveBalance);

// // ─── Accruals ────────────────────────────────────────────────────────────────
// router.get('/accruals', getLeaveAccruals);

// // ─── Special Leave Credits ──────────────────────────────────────────────────
// router.get('/credits', getLeaveCredits);
// router.post('/credits', creditSpecialLeave);

// // ─── Pending approvals ──────────────────────────────────────────────────────
// router.get('/pending', getPendingLeaves);

// // ─── Monthly processing ─────────────────────────────────────────────────────
// router.post('/monthly-process/:employeeId', processMonthlyLeaveController);

// // ─── Leave Requests ─────────────────────────────────────────────────────────
// router.get('/', getLeaves);
// router.post('/', applyLeave);

// router.get('/:id', getLeaveById);
// router.get('/:id/breakdown', getLeaveRequestBreakdown);
// router.put('/:id/approve', authorize('leaves:approve'), approveLeave);
// router.put('/:id/reject', authorize('leaves:approve'),rejectLeave);
// router.put('/:id/cancel', cancelLeave);

// export default router;



// import { Router } from 'express';
// // import { authenticate } from '../../middleware/auth.middleware';
// import {
//   // Leave requests
//   getLeaves,
//   getPendingLeaves,
//   getLeaveById,
//   getLeaveRequestBreakdown,
//   applyLeave,
//   approveLeave,
//   rejectLeave,
//   cancelLeave,
//   // Leave types
//   getLeaveTypes,
//   getLeaveTypeById,
//   createLeaveType,
//   updateLeaveType,
//   setLeaveTypeActive,
//   // Leave policy
//   getLeavePolicy,
//   updateLeavePolicy,
//   // Weekly-off assignment
//   getEmployeeWeeklyOff,
//   assignEmployeeWeeklyOff,
//   // Balances
//   getLeaveBalances,
//   getCompanyLeaveBalances,
//   getShortLeaveBalance,
//   // Accruals
//   getLeaveAccruals,
//   // Special leave credits
//   creditSpecialLeave,
//   getLeaveCredits,
//   // Monthly processing
//   processMonthlyLeaveController,
// } from './leave.controller';
// import { authenticate } from '../auth/auth.middleware';

// const router = Router();

// // Every route below requires an authenticated user (req.user!.employeeId /
// // companyId / permissions are read throughout the controller). Adjust the
// // import path/name if your auth middleware is called something else —
// // I'm guessing 'authenticate' from '../../middleware/auth.middleware' to
// // match the '../../middleware/errorHandler.middleware' path already used
// // in leave.service.ts.
// router.use(authenticate);

// /* ============================================================================
//  * ROUTE ORDER MATTERS
//  * ----------------------------------------------------------------------------
//  * Express matches routes top-to-bottom. Every literal-segment path below
//  * (/types, /policy, /weekly-off, /balance, /short-balance, /accruals,
//  * /credits, /pending, /monthly-process/:employeeId) MUST be registered
//  * before the numeric /:id and /:id/breakdown routes at the bottom — otherwise
//  * a request to e.g. GET /types would get captured by GET /:id first, with
//  * Express trying to parseInt("types") as a leave request id.
//  * ==========================================================================*/

// // ─── Leave Types ────────────────────────────────────────────────────────────
// router.get('/types', getLeaveTypes);
// router.get('/types/:id', getLeaveTypeById);
// router.post('/types', createLeaveType);
// router.put('/types/:id', updateLeaveType);
// router.put('/types/:id/active', setLeaveTypeActive);

// // ─── Leave Policy (sandwich settings) ──────────────────────────────────────
// router.get('/policy', getLeavePolicy);
// router.put('/policy', updateLeavePolicy);

// // ─── Weekly-Off Assignment ──────────────────────────────────────────────────
// router.get('/weekly-off', getEmployeeWeeklyOff);
// router.put('/weekly-off', assignEmployeeWeeklyOff);

// // ─── Balances ────────────────────────────────────────────────────────────────
// router.get('/balance', getLeaveBalances);
// router.get('/balances/overview', getCompanyLeaveBalances);
// router.get('/short-balance', getShortLeaveBalance);

// // ─── Accruals ────────────────────────────────────────────────────────────────
// router.get('/accruals', getLeaveAccruals);

// // ─── Special Leave Credits ──────────────────────────────────────────────────
// router.get('/credits', getLeaveCredits);
// router.post('/credits', creditSpecialLeave);

// // ─── Pending approvals ──────────────────────────────────────────────────────
// router.get('/pending', getPendingLeaves);

// // ─── Monthly processing ─────────────────────────────────────────────────────
// router.post('/monthly-process/:employeeId', processMonthlyLeaveController);

// // ─── Leave Requests ─────────────────────────────────────────────────────────
// router.get('/', getLeaves);
// router.post('/', applyLeave);

// router.get('/:id', getLeaveById);
// router.get('/:id/breakdown', getLeaveRequestBreakdown);
// router.put('/:id/approve', approveLeave);
// router.put('/:id/reject', rejectLeave);
// router.put('/:id/cancel', cancelLeave);

// export default router;




import { Router } from 'express';

// import { authenticate } from '../../middleware/auth.middleware';

import {
  // Leave requests
  getLeaves,
  getPendingLeaves,
  getLeaveById,
  getLeaveRequestBreakdown,
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,

  // Leave types
  getLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  setLeaveTypeActive,

  // Leave policy
  getLeavePolicy,
  updateLeavePolicy,

  // Weekly-off assignment
  getEmployeeWeeklyOff,
  assignEmployeeWeeklyOff,

  // Balances
  getLeaveBalances,
  getCompanyLeaveBalances,
  getShortLeaveBalance,

  // Accruals
  getLeaveAccruals,

  // Special leave credits
  creditSpecialLeave,
  getLeaveCredits,

  // Monthly processing
  processMonthlyLeaveController,

  // Manager / Reporting employees
  getMyManagedEmployees,
  getMyManagers,
} from './leave.controller';

import { authenticate } from '../auth/auth.middleware';

const router = Router();

/* ============================================================================
 * AUTHENTICATION
 * ==========================================================================*/

router.use(authenticate);

/* ============================================================================
 * ROUTE ORDER MATTERS
 *
 * Literal routes must come before /:id routes.
 * ==========================================================================*/


/* ============================================================================
 * MANAGER / REPORTING EMPLOYEES
 * ----------------------------------------------------------------------------
 * These MUST be before /:id because otherwise "my-managed-employees" and
 * "my-managers" could be captured by /:id.
 * ==========================================================================*/

// Get employees where logged-in employee is L1 or L2 manager
// GET /api/leaves/my-managed-employees
router.get('/my-managed-employees', getMyManagedEmployees);

// Get L1 and L2 managers of logged-in employee
// GET /api/leaves/my-managers
router.get('/my-managers', getMyManagers);


/* ============================================================================
 * LEAVE TYPES
 * ==========================================================================*/

router.get('/types', getLeaveTypes);
router.get('/types/:id', getLeaveTypeById);

router.post('/types', createLeaveType);

router.put('/types/:id', updateLeaveType);
router.put('/types/:id/active', setLeaveTypeActive);


/* ============================================================================
 * LEAVE POLICY
 * ==========================================================================*/

router.get('/policy', getLeavePolicy);
router.put('/policy', updateLeavePolicy);


/* ============================================================================
 * WEEKLY-OFF ASSIGNMENT
 * ==========================================================================*/

router.get('/weekly-off', getEmployeeWeeklyOff);
router.put('/weekly-off', assignEmployeeWeeklyOff);


/* ============================================================================
 * BALANCES
 * ==========================================================================*/

router.get('/balance', getLeaveBalances);
router.get('/balances/overview', getCompanyLeaveBalances);
router.get('/short-balance', getShortLeaveBalance);


/* ============================================================================
 * ACCRUALS
 * ==========================================================================*/

router.get('/accruals', getLeaveAccruals);


/* ============================================================================
 * SPECIAL LEAVE CREDITS
 * ==========================================================================*/

router.get('/credits', getLeaveCredits);
router.post('/credits', creditSpecialLeave);


/* ============================================================================
 * PENDING APPROVALS
 * ==========================================================================*/

router.get('/pending', getPendingLeaves);


/* ============================================================================
 * MONTHLY PROCESSING
 * ==========================================================================*/

router.post(
  '/monthly-process/:employeeId',
  processMonthlyLeaveController,
);


/* ============================================================================
 * LEAVE REQUESTS
 * ==========================================================================*/

// Get all leave requests
router.get('/', getLeaves);

// Apply leave
router.post('/', applyLeave);


/* ============================================================================
 * LEAVE REQUEST BY ID
 *
 * Keep these routes at the bottom because /:id is dynamic.
 * ==========================================================================*/

router.get('/:id', getLeaveById);

router.get(
  '/:id/breakdown',
  getLeaveRequestBreakdown,
);

router.put(
  '/:id/approve',
  approveLeave,
);

router.put(
  '/:id/reject',
  rejectLeave,
);

router.put(
  '/:id/cancel',
  cancelLeave,
);


export default router;