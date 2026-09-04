import { body, param, query, ValidationChain } from 'express-validator';

export const listDepartmentValidation: ValidationChain[] = [
  query('search').optional().isString().trim(),
  query('is_active').optional().isIn(['true', 'false', 'all']),
  // query('parent_id').optional().isInt({ min: 1 }),
];

export const createDepartmentValidation: ValidationChain[] = [
  body('department_name')
    .trim().notEmpty().withMessage('Department name is required')
    .isLength({ max: 200 }).withMessage('Name max 200 characters'),
  body('department_code')
    .optional({ nullable: true }).trim()
    .isLength({ max: 20 }).withMessage('Code max 20 characters'),
  body('head_id')
    .optional({ nullable: true }).isInt({ min: 1 })
    .withMessage('head_id must be a positive integer'),
];

export const updateDepartmentValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid department ID'),
  body('department_name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('department_code').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('head_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
];

export const idValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid department ID'),
];
