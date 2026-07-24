import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  getTodaySummary,
  getByEmployee,
  getAllAttendance,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  createRegularization,
  getMyRegularizations,
  getPendingRegularizations,
  reviewRegularization,
} from './attendance.controller';

const router = Router();
router.use(authenticate);

// GET /api/attendance/today-summary
router.get('/today-summary', getTodaySummary);

// GET /api/attendance/employee/:employeeId?month=5&year=2026
router.get(
  '/employee/:employeeId',
  [
    param('employeeId').isInt({ min: 1 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000 }),
  ],
  validate,
  getByEmployee,
);

// GET /api/attendance — full filter set
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('employee_id').optional().isInt({ min: 1 }),
    query('search').optional().isString().isLength({ max: 100 }),
    query('status').optional().isIn(['Present', 'Absent', 'WFH', 'Half-Day', 'Holiday', 'Leave']),
    query('source').optional().isIn(['Biometric', 'Manual', 'Mobile', 'System']),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000 }),
    query('sort').optional().isIn(['date_asc', 'date_desc']),
  ],
  validate,
  getAllAttendance,
);

// ─── Regularization — registered before '/:id' so these paths aren't
// swallowed by the '/:id' route further down ───────────────────────────────
router.post(
  '/regularization',
  [
    body('date').isISO8601().withMessage('date must be a valid ISO date (YYYY-MM-DD)'),
    body('reason').isString().isLength({ min: 3, max: 500 }),
    body('requested_check_in').optional({ nullable: true }).matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('requested_check_out').optional({ nullable: true }).matches(/^\d{2}:\d{2}(:\d{2})?$/),
  ],
  validate,
  createRegularization,
);

router.get('/regularization/my', getMyRegularizations);

router.get('/regularization/pending',  getPendingRegularizations);

router.put(
  '/regularization/:id/review',
  [
    param('id').isInt({ min: 1 }),
    body('decision').isIn(['Approved', 'Rejected']),
    body('remarks').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  reviewRegularization,
);

// POST /api/attendance — mark single
router.post(
  '/',
  [
    body('employee_id').isInt({ min: 1 }).withMessage('employee_id must be a positive integer'),
    body('date').isISO8601().withMessage('date must be a valid ISO date (YYYY-MM-DD)'),
    body('status').isIn(['Present', 'Absent', 'WFH', 'Half-Day', 'Holiday', 'Leave']).withMessage('Invalid status value'),
    body('check_in').optional({ nullable: true }).matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('check_in must be HH:MM'),
    body('check_out').optional({ nullable: true }).matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('check_out must be HH:MM'),
  ],
  validate,
  markAttendance,
);

// POST /api/attendance/bulk
router.post(
  '/bulk',
  [body('records').isArray({ min: 1, max: 200 }).withMessage('records must be a non-empty array of at most 200')],
  validate,
  bulkMarkAttendance,
);

// PUT /api/attendance/:id
router.put(
  '/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  updateAttendance,
);

export default router;