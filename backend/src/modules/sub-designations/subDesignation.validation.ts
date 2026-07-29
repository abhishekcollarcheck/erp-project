import { body, param, query, ValidationChain } from 'express-validator';

export const listSubDesignationValidation: ValidationChain[] = [
  query('is_active').optional().isIn(['true', 'false', 'all']),
  query('search').optional().isString().trim().isLength({ max: 100 }),
];

export const createSubDesignationValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage('Sub-Designation name is required')
    .isLength({ max: 200 }).withMessage('Name must be 200 characters or less'),
];

export const updateSubDesignationValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid sub-designation ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 200 }).withMessage('Name must be 200 characters or less'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be true or false'),
];

export const idValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid sub-designation ID'),
];