import { Request, Response, NextFunction } from 'express';
import { DraftService } from './draft.service'
import { sendResponse } from '../../utils/response';

const draftService = new DraftService();

// GET /api/drafts
export async function getDrafts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.getAll(req.user!.employeeId, req.query as any);
    sendResponse(res, { data, message: 'Drafts fetched' });
  } catch (e) { next(e); }
}

// GET /api/drafts/stats
export async function getDraftStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.getStats(req.user!.employeeId);
    sendResponse(res, { data, message: 'Draft stats' });
  } catch (e) { next(e); }
}

// GET /api/drafts/:id
export async function getDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.getById(parseInt(req.params.id, 10), req.user!.employeeId);
    sendResponse(res, { data, message: 'Draft fetched' });
  } catch (e) { next(e); }
}

// POST /api/drafts/save
export async function saveDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.saveDraft(req.user!.companyId, req.user!.employeeId, req.body);
    sendResponse(res, { data, message: 'Draft saved', statusCode: 201 });
  } catch (e) { next(e); }
}

// GET /api/drafts/form/:formId/session/:sessionId
export async function getDraftBySession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.getBySession(
      parseInt(req.params.formId, 10),
      req.params.sessionId,
      req.user!.employeeId,
    );
    sendResponse(res, { data, message: 'Draft fetched' });
  } catch (e) { next(e); }
}

// PUT /api/drafts/:id
export async function updateDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.update(
      req.user!.companyId,
      parseInt(req.params.id, 10),
      req.user!.employeeId,
      req.body,
    );
    sendResponse(res, { data, message: 'Draft updated' });
  } catch (e) { next(e); }
}

// PATCH /api/drafts/:id/complete
export async function completeDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await draftService.markComplete(req.user!.companyId, parseInt(req.params.id, 10), req.user!.employeeId);
    sendResponse(res, { data, message: 'Draft marked as complete' });
  } catch (e) { next(e); }
}

// DELETE /api/drafts/:id
export async function deleteDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await draftService.delete(req.user!.companyId, parseInt(req.params.id, 10), req.user!.employeeId);
    sendResponse(res, { data: null, message: 'Draft deleted' });
  } catch (e) { next(e); }
}

// DELETE /api/drafts/form/:formId (Delete all drafts for a form)
export async function deleteFormDrafts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await draftService.deleteByForm(req.user!.companyId, parseInt(req.params.formId, 10), req.user!.employeeId);
    sendResponse(res, { data: null, message: 'Form drafts deleted' });
  } catch (e) { next(e); }
}