import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import {
  getSubDesignations,
  getSubDesignationStats,
  getSubDesignation,
  createSubDesignation,
  updateSubDesignation,
  // toggleSubDesignation,
  deleteSubDesignation,
} from './subDesignation.controller';
import {
  createSubDesignationValidation,
  updateSubDesignationValidation,
  listSubDesignationValidation,
  idValidation,
} from './subDesignation.validation';

const router = Router();
router.use(authenticate);

// GET /api/sub-designations?is_active=true|false|all&search=eng
router.get('/', listSubDesignationValidation, validate, getSubDesignations);

// GET /api/sub-designations/stats  — MUST come before /:id
router.get('/stats', getSubDesignationStats);

// GET /api/sub-designations/:id
router.get('/:id', idValidation, validate, getSubDesignation);

// POST /api/sub-designations
router.post('/', createSubDesignationValidation, validate, createSubDesignation);

// PUT /api/sub-designations/:id
router.put('/:id', updateSubDesignationValidation, validate, updateSubDesignation);

// PATCH /api/sub-designations/:id/toggle — activate / deactivate
// router.patch('/:id/toggle', idValidation, validate, toggleSubDesignation);

// DELETE /api/sub-designations/:id
router.delete('/:id', idValidation, validate, deleteSubDesignation);

export default router;