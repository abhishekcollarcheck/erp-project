import { body, param, query, ValidationChain } from 'express-validator';

export const listLeaveValidation: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Pending', 'Approved', 'Rejected', 'Cancelled']),
  query('employee_id').optional().isInt({ min: 1 }),
];

export const applyLeaveValidation: ValidationChain[] = [
  body('employee_id').isInt({ min: 1 }).withMessage('employee_id required'),
  body('leave_type_id').isInt({ min: 1 }).withMessage('leave_type_id required'),
  body('leave_application_type')
    .isIn(['arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'])
    .withMessage('leave_application_type is required'),
  body('from_date').isISO8601().withMessage('from_date must be a valid date'),
  body('to_date').isISO8601().withMessage('to_date must be a valid date'),
  body('from_time').optional({ nullable: true }).matches(/^\d{2}:\d{2}$/).withMessage('from_time must be HH:mm'),
  body('to_time').optional({ nullable: true }).matches(/^\d{2}:\d{2}$/).withMessage('to_time must be HH:mm'),
  body('days').isFloat({ min: 0.5 }).withMessage('days must be at least 0.5'),
  body('half_day').optional().isBoolean(),
  body('reason').notEmpty().withMessage('reason is required').isLength({ max: 500 }),
  body('submission_type').optional().isIn(['self', 'admin']),
  body('hod_name').notEmpty().withMessage('Please select Management/HOD').isLength({ max: 200 }),
  body('coordinator_name').notEmpty().withMessage('Please select coordinator').isLength({ max: 200 }),
  body('undertaking_accepted').isBoolean().custom(v => v === true).withMessage('You must accept the undertaking'),
];

export const rejectLeaveValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }),
  body('reason').notEmpty().withMessage('Rejection reason is required').isLength({ max: 500 }),
];

export const idValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }),
];
