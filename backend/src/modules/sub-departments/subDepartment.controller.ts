import { Request, Response, NextFunction } from 'express';
import { SubDepartmentService } from './subDepartment.service';
import { sendResponse } from '../../utils/response';

const subdepartmentService = new SubDepartmentService();

export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subdepartmentService.getAll(req.query as any);
    sendResponse(res, { data, message: 'Departments fetched' });
  } catch (e) { next(e); }
}

export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subdepartmentService.getById(parseInt(req.params.id, 10));
    sendResponse(res, { data, message: 'Department fetched' });
  } catch (e) { next(e); }
}

export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subdepartmentService.create(req.body, req.user!.employeeId);
    sendResponse(res, { data, message: 'Department created successfully', statusCode: 201 });
  } catch (e) { next(e); }
}

export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subdepartmentService.update(
      parseInt(req.params.id, 10),
      req.user!.companyId,
      req.body,
      req.user!.employeeId,
    );
    sendResponse(res, { data, message: 'Department updated' });
  } catch (e) { next(e); }
}

export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await subdepartmentService.delete(parseInt(req.params.id, 10), req.user!.companyId, req.user!.employeeId);
    sendResponse(res, { data: null, message: 'Department deleted' });
  } catch (e) { next(e); }
}
