import { Request, Response, NextFunction } from 'express';
import { RolesService }       from '../roles/roles.service';
import { FormBuilderService } from './formBuilder.service';
import { sendResponse, sendError } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler.middleware';

const rolesSvc = new RolesService();
const fbSvc    = new FormBuilderService();

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────

export async function getGroupCompanyScope(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await fbSvc.resolveGroupCompanyScope(
      +req.params.groupId, req.user!.employeeId, req.user!.isSuperAdmin,
    );
    sendResponse(res, { data });
  } catch (e) { next(e); }
}

export async function listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.list(req.user!.companyId) }); } catch(e){ next(e); }
}

export async function createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.create(req.user!.companyId, req.body, req.user!.employeeId), statusCode: 201 }); } catch(e){ next(e); }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.update(+req.params.id, req.user!.companyId, req.body, req.user!.employeeId) }); } catch(e){ next(e); }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.delete(+req.params.id, req.user!.companyId, req.user!.employeeId) }); } catch(e){ next(e); }
}

export async function getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.getPermissions(+req.params.id, req.user!.companyId) }); } catch(e){ next(e); }
}

export async function setRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.setPermissions(+req.params.id, req.user!.companyId, req.body.slugs, req.user!.employeeId) }); } catch(e){ next(e); }
}

export async function getRoleMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.getMembers(+req.params.id, req.user!.companyId) }); } catch(e){ next(e); }
}

export async function assignMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.assignMember(+req.params.id, req.user!.companyId, req.body.user_id, req.user!.employeeId), statusCode: 201 }); } catch(e){ next(e); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.removeMember(+req.params.id, req.user!.companyId, +req.params.employeeId) }); } catch(e){ next(e); }
}

export async function listAllPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await rolesSvc.listAllPermissions() }); } catch(e){ next(e); }
}

export async function getGroupFieldPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.query.company_id ? +req.query.company_id : req.user!.companyId;
    const data = await fbSvc.getGroupFieldPermissionsForCompany(companyId, +req.params.groupId, +req.params.formId);
    sendResponse(res, { data });
  } catch (e) { next(e); }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────────────────────────────────────

export async function listAllModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.listAllModules() }); } catch(e){ next(e); }
}

export async function listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.query.company_id ? +req.query.company_id : req.user!.companyId;
    sendResponse(res, { data: await fbSvc.listModules(companyId) });
  } catch(e){ next(e); }
}

export async function createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let companyIds: number[] = [];
    if (req.body.company_ids !== undefined) {
      if (!Array.isArray(req.body.company_ids)) throw new AppError('company_ids must be an array', 400);
      companyIds = req.body.company_ids.map((id: any) => +id);
    }
    if (companyIds.length) {
      await fbSvc.assertCompaniesManaged(companyIds, req.user!.employeeId, req.user!.isSuperAdmin);
    }
    const data = await fbSvc.createModule({ ...req.body, company_ids: companyIds }, req.user!.employeeId);
    sendResponse(res, { data, statusCode: 201 });
  } catch(e){ next(e); }
}

export async function updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.updateModule(+req.params.id, req.body, req.user!.employeeId) }); } catch(e){ next(e); }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.deleteModule(+req.params.id, req.user!.employeeId) }); } catch(e){ next(e); }
}

// One-time (but safe to re-run) backfill — seeds Permission rows for every
// catalog module that predates ensureModulePermissions. Not called
// automatically; an admin triggers it explicitly, same shape as
// POST /permission-groups/seed.
export async function backfillModulePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.backfillModulePermissions() }); } catch(e){ next(e); }
}

// "Company A selects Employee, Payroll, Sales, Assets" — the actual
// module-subscription endpoint. company_id defaults to the caller's own
// company; a super admin managing another company should pass company_id
// explicitly (validated via assertCompaniesManaged, same guard used
// elsewhere for cross-company writes).
export async function setCompanyModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.body.company_id ? +req.body.company_id : req.user!.companyId;
    if (companyId !== req.user!.companyId) {
      await fbSvc.assertCompaniesManaged([companyId], req.user!.employeeId, req.user!.isSuperAdmin);
    }
    if (!Array.isArray(req.body.module_ids)) throw new AppError('module_ids must be an array', 400);
    const moduleIds = req.body.module_ids.map((id: any) => +id);
    const data = await fbSvc.setCompanyModules(companyId, moduleIds, req.user!.employeeId);
    sendResponse(res, { data });
  } catch(e){ next(e); }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMS
// ─────────────────────────────────────────────────────────────────────────────

export async function listForms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.listForms(+req.params.moduleId) }); } catch(e){ next(e); }
}

export async function getForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.getFormWithFields(+req.params.formId) }); } catch(e){ next(e); }
}

export async function createForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.createForm(+req.params.moduleId, req.body, req.user!.employeeId), statusCode: 201 }); } catch(e){ next(e); }
}

export async function updateForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.updateForm(+req.params.formId, req.body, req.user!.employeeId) }); } catch(e){ next(e); }
}

export async function deleteForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.deleteForm(+req.params.formId) }); } catch(e){ next(e); }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELDS
// ─────────────────────────────────────────────────────────────────────────────

export async function createField(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.createField(+req.params.formId, req.body, req.user!.employeeId), statusCode: 201 }); } catch(e){ next(e); }
}

export async function updateField(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.updateField(+req.params.fieldId, req.body, req.user!.employeeId) }); } catch(e){ next(e); }
}

export async function deleteField(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.deleteField(+req.params.fieldId) }); } catch(e){ next(e); }
}

export async function reorderFields(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendResponse(res, { data: await fbSvc.reorderFields(+req.params.formId, req.body.order) }); } catch(e){ next(e); }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPermissionMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.query.company_id ? +req.query.company_id : req.user!.companyId;
    const data = await fbSvc.getPermissionMatrix(companyId, +req.params.formId);
    sendResponse(res, { data });
  } catch (e) { next(e); }
}

export async function setFieldPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyIds = req.body.company_ids.map((id: any) => +id);
    await fbSvc.assertCompaniesManaged(companyIds, req.user!.employeeId, req.user!.isSuperAdmin);
    const data = await fbSvc.bulkSetFieldPermissions(companyIds, +req.body.group_id, req.body.permissions, req.user!.employeeId);
    sendResponse(res, { data });
  } catch(e){ next(e); }
}

export async function bulkSetPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!Array.isArray(req.body.company_ids) || !req.body.company_ids.length) {
      throw new AppError('company_ids is required', 400);
    }
    const companyIds = req.body.company_ids.map((id: any) => +id);
    await fbSvc.assertCompaniesManaged(companyIds, req.user!.employeeId, req.user!.isSuperAdmin);
    const data = await fbSvc.bulkSetFieldPermissions(companyIds, +req.body.group_id, req.body.permissions, req.user!.employeeId);
    sendResponse(res, { data, message: `${data.updated} permissions updated` });
  } catch(e){ next(e); }
}

export async function resolveFormPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await fbSvc.resolveFormPermissions(+req.params.formId, req.user!.employeeId, req.user!.companyId);
    sendResponse(res, { data });
  } catch(e){ next(e); }
}