import { Request, Response, NextFunction } from "express";
import { sendResponse, sendError } from "../../utils/response";
import { PermissionGroupService } from './permissionGroups.service';

const svc = new PermissionGroupService();

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function listGroups(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, { data: await svc.list(req.user!.companyId) });
  } catch (e) {
    next(e);
  }
}

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.create(
        req.body,
        req.user!.employeeId,
      ),
      statusCode: 201,
    });
  } catch (e) {
    next(e);
  }
}

export async function updateGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.update(
        +req.params.id,
        req.user!.companyId,
        req.body,
        req.user!.employeeId,
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.delete(
        +req.params.id,
        req.user!.companyId,
        req.user!.employeeId,
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function getGroupPermissions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = req.query.company_id ? +req.query.company_id : req.user!.companyId;
    const group = await svc.getById(+req.params.id, companyId);
    const slugs = (group.permissions ?? []).map(p => p.slug);
    sendResponse(res, { data: slugs });
  } catch (e) {
    next(e);
  }
}

export async function setGroupPermissions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.setPermissions(
        +req.params.id,
        req.user!.companyId,
        req.body.slugs,
        req.user!.employeeId,
        req.user!.isSuperAdmin,
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function getGroupMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.getMembers(
        +req.params.id,
        req.user!.employeeId,
        req.user!.isSuperAdmin,
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function addGroupMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.addMember(
        +req.params.id,
        req.user!.companyId,
        req.body.employee_id,
        req.user!.employeeId,
        req.body.company_ids,
      ),
      statusCode: 201,
    });
  } catch (e) {
    next(e);
  }
}

export async function removeGroupMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = req.query.company_id ? +req.query.company_id : req.user!.companyId;
    sendResponse(res, {
      data: await svc.removeMember(
        +req.params.id,
        companyId,
        +req.params.employeeId,
        req.user!.employeeId,
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function getMyGroups(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendResponse(res, {
      data: await svc.getUserGroups(req.user!.employeeId, req.user!.companyId),
    });
  } catch (e) {
    next(e);
  }
}

// Export service for use in seeder
export { PermissionGroupService, svc as permissionGroupService };

// ─── Router ───────────────────────────────────────────────────────────────────