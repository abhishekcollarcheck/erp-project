import { Request, Response, NextFunction } from 'express';
import { SubDesignationService } from './subDesignation.service';
import { sendResponse } from '../../utils/response';

const subDesignationService = new SubDesignationService();

// GET /api/sub-designations
export async function getSubDesignations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subDesignationService.getAll(req.query as any);
    sendResponse(res, { data, message: 'Sub-Designations fetched' });
  } catch (e) { next(e); }
}

// GET /api/sub-designations/stats
export async function getSubDesignationStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subDesignationService.getStats();
    sendResponse(res, { data, message: 'Sub-Designation stats' });
  } catch (e) { next(e); }
}

// GET /api/sub-designations/:id
export async function getSubDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subDesignationService.getById(parseInt(req.params.id, 10));
    sendResponse(res, { data, message: 'Sub-Designation fetched' });
  } catch (e) { next(e); }
}

// POST /api/sub-designations
export async function createSubDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subDesignationService.create(req.user!.companyId, req.body, req.user!.employeeId);
    sendResponse(res, { data, message: 'Sub-Designation created', statusCode: 201 });
  } catch (e) { next(e); }
}

// PUT /api/sub-designations/:id
export async function updateSubDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subDesignationService.update(
      req.user!.companyId,
      parseInt(req.params.id, 10),
      req.body,
      req.user!.employeeId,
    );
    sendResponse(res, { data, message: 'Sub-Designation updated' });
  } catch (e) { next(e); }
}

// PATCH /api/sub-designations/:id/toggle
// export async function toggleSubDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subDesignationService.toggleActive(
//       parseInt(req.params.id, 10),
//       req.user!.employeeId,
//     );
//     sendResponse(res, { data, message: `Sub-Designation ${data.is_active ? 'activated' : 'deactivated'}` });
//   } catch (e) { next(e); }
// }

// DELETE /api/sub-designations/:id
export async function deleteSubDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await subDesignationService.delete(req.user!.companyId, parseInt(req.params.id, 10), req.user!.employeeId);
    sendResponse(res, { data: null, message: 'Sub-Designation deleted' });
  } catch (e) { next(e); }
}