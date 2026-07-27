import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import {
  getLeaves,
  getPendingLeaves,
  getLeaveTypes,
  getMyLeaveBalances,
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from './leave.controller';

const router = Router();

router.use(authenticate);

// NOTE: no route-level role gate on /pending, /:id/approve, /:id/reject —
// approval authority now depends on the SPECIFIC employee's L1/L2 manager
// (reporting_manager_id / level2_manager_id), which can only be known by
// loading that employee's record. That check happens inside the service
// (assertCanActOnLeave), not as route middleware. A plain employee calling
// these will get an empty pending list / a 403 on approve-reject for
// anyone who isn't their own report — not blocked at the route level.

// GET /api/leaves/types
router.get('/types', getLeaveTypes);

// GET /api/leaves/balance — self-service, no params needed
router.get('/balance', getMyLeaveBalances);

// GET /api/leaves/pending
router.get('/pending', getPendingLeaves);

// GET /api/leaves — self-scoped in the service regardless of query params
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['Pending', 'Approved', 'Rejected', 'Cancelled']),
    query('leave_type_id').optional().isInt({ min: 1 }),
  ],
  validate,
  getLeaves,
);

// POST /api/leaves — apply for leave
router.post(
  '/',
  [
    body('leave_type_id').isInt({ min: 1 }).withMessage('leave_type_id required'),
    body('from_date').isISO8601().withMessage('from_date must be a valid date'),
    body('to_date').isISO8601().withMessage('to_date must be a valid date'),
    body('days').isFloat({ min: 0.5 }).withMessage('days must be at least 0.5'),
    body('half_day').optional().isBoolean(),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  applyLeave,
);

// PUT /api/leaves/:id/approve — L1 manager, L2 manager, or 'leaves:approve'
// permission holder. Enforced in the service (assertCanActOnLeave).
router.put(
  '/:id/approve',
  [param('id').isInt({ min: 1 })],
  validate,
  approveLeave,
);

// PUT /api/leaves/:id/reject — same guard as approve
router.put(
  '/:id/reject',
  [
    param('id').isInt({ min: 1 }),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  rejectLeave,
);

// PUT /api/leaves/:id/cancel
router.put(
  '/:id/cancel',
  [param('id').isInt({ min: 1 })],
  validate,
  cancelLeave,
);

export default router;