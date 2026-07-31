import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import {
  getDrafts,
  getDraftStats,
  getDraft,
  saveDraft,
  getDraftBySession,
  updateDraft,
  completeDraft,
  deleteDraft,
  deleteFormDrafts,
} from './draft.controller';
import {
  saveDraftValidation,
  updateDraftValidation,
  listDraftsValidation,
  idValidation,
  draftBySessionValidation,
} from './draft.validation';

const router = Router();
router.use(authenticate);

// GET /api/drafts?form_id=1&completed=true|false
router.get('/', listDraftsValidation, validate, getDrafts);

// GET /api/drafts/stats — MUST come before /:id
router.get('/stats', getDraftStats);

// GET /api/drafts/form/:formId/session/:sessionId
router.get('/form/:formId/session/:sessionId', draftBySessionValidation, validate, getDraftBySession);

// GET /api/drafts/:id
router.get('/:id', idValidation, validate, getDraft);

// POST /api/drafts/save
router.post('/save', saveDraftValidation, validate, saveDraft);

// PUT /api/drafts/:id
router.put('/:id', updateDraftValidation, validate, updateDraft);

// PATCH /api/drafts/:id/complete
router.patch('/:id/complete', idValidation, validate, completeDraft);

// DELETE /api/drafts/:id
router.delete('/:id', idValidation, validate, deleteDraft);

// DELETE /api/drafts/form/:formId
router.delete('/form/:formId', idValidation, validate, deleteFormDrafts);

export default router;