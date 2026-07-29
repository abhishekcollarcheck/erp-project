import { body, param, query, ValidationChain } from 'express-validator';

export const listSubDepartmentValidation: ValidationChain[] = [
  query('search').optional().isString().trim(),
  query('is_active').optional().isIn(['true', 'false', 'all']),
];

export const createSubDepartmentValidation: ValidationChain[] = [
  body('name')
    .trim().notEmpty().withMessage('Department name is required')
    .isLength({ max: 200 }).withMessage('Name max 200 characters'),
];

export const updateSubDepartmentValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid department ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
];

export const idValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid department ID'),
];
