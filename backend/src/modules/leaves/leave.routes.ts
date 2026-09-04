import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize} from '../auth/auth.middleware';
import {
  listLeaveValidation,
  applyLeaveValidation,
  rejectLeaveValidation,
  idValidation,
} from './leave.validation';
import {
  getLeaves,
  getPendingLeaves,
  getLeaveTypes,
  getLeaveBalances,
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  processMonthlyLeaveController,
  // calculateMonthlyLeaveController,
} from './leave.controller';

const router = Router();

router.use(authenticate);

// GET /api/leaves/types
router.get('/types', getLeaveTypes);

// GET /api/leaves/balance
router.get('/balance', getLeaveBalances);

// GET /api/leaves/pending — for managers
router.get('/pending', authorize('leaves:approve'), getPendingLeaves);

// GET /api/leaves
router.get('/', listLeaveValidation, validate, getLeaves);

// POST /api/leaves — apply for leave
router.post('/', applyLeaveValidation, validate, applyLeave);

// PUT /api/leaves/:id/approve
router.put('/:id/approve', authorize('leaves:approve'), idValidation, validate, approveLeave);

// PUT /api/leaves/:id/reject
router.put('/:id/reject', authorize('leaves:approve'), rejectLeaveValidation, validate, rejectLeave);

// PUT /api/leaves/:id/cancel
router.put('/:id/cancel', idValidation, validate, cancelLeave);

router.post('/monthly/:employeeId', processMonthlyLeaveController);

export default router;
