import { body, param, query } from 'express-validator';

/**
 * PHASE 2: Draft Validation Schemas
 * Validate incoming requests for draft endpoints
 */

// POST /api/drafts/save - Save draft
export const saveDraftValidation = [
  body('form_id')
    .isInt({ min: 1 })
    .withMessage('form_id must be a positive integer'),

  body('session_id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('session_id is required')
    .matches(/^w_\d+_[a-z0-9]{6}$/)
    .withMessage('session_id must match format: w_{timestamp}_{random}'),

  body('step')
    .isInt({ min: 0 })
    .withMessage('step must be a non-negative integer'),

  body('form_data')
    .isObject()
    .withMessage('form_data must be an object'),

  body('record_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('record_id must be a positive integer if provided'),
];

// PUT /api/drafts/:id - Update draft
export const updateDraftValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Draft ID must be a positive integer'),

  body('step')
    .optional()
    .isInt({ min: 0 })
    .withMessage('step must be a non-negative integer'),

  body('current_step')
    .optional()
    .isInt({ min: 0 })
    .withMessage('current_step must be a non-negative integer'),

  body('form_data')
    .optional()
    .isObject()
    .withMessage('form_data must be an object'),
];

// GET /api/drafts?form_id=1&completed=true
export const listDraftsValidation = [
  query('form_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('form_id must be a positive integer'),

  query('completed')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('completed must be "true" or "false"'),

  query('session_id')
    .optional()
    .isString()
    .trim()
    .withMessage('session_id must be a string'),
];

// GET /api/drafts/:id
export const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Draft ID must be a positive integer'),
];

// GET /api/drafts/form/:formId/session/:sessionId
export const draftBySessionValidation = [
  param('formId')
    .isInt({ min: 1 })
    .withMessage('Form ID must be a positive integer'),

  param('sessionId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('session_id is required')
    .matches(/^w_\d+_[a-z0-9]{6}$/)
    .withMessage('session_id must match format: w_{timestamp}_{random}'),
];