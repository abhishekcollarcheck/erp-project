import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../../utils/jwt";
import { sendError } from "../../utils/response";
import { CompanyManager } from "../../database/models";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      sendError(res, "Unauthorized: No token provided", 401);
      return;
    }
    req.user = verifyAccessToken(header.split(" ")[1]);
    next();
  } catch {
    sendError(res, "Unauthorized: Invalid or expired token", 401);
  }
}

export function authorize(...slugs: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }
    if (slugs.length === 0) {
      throw new Error("authorize() requires at least one permission slug");
    }
    const perms = req.user.permissions ?? [];
    if (perms.includes("*")) {
      next();
      return;
    }
    if (slugs.some((s) => perms.includes(s) || perms.includes("*"))) {
      next();
      return;
    }
    sendError(
      res,
      `Forbidden: Missing permission (${slugs.join(" or ")})`,
      403,
    );
  };
}

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendError(res, "Unauthorized", 401);
    return;
  }
  if (!req.user.isSuperAdmin) {
    sendError(res, "Forbidden: Super admin only", 403);
    return;
  }
  next();
}

// selfOrAdmin: employeeId replaces userId
export function selfOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendError(res, "Unauthorized", 401);
    return;
  }
  const { roleSlug, employeeId, isSuperAdmin } = req.user;
  if (
    isSuperAdmin ||
    roleSlug === "hr_manager" ||
    roleSlug === "admin" ||
    roleSlug === "mgr"
  ) {
    next();
    return;
  }
  const resourceId = parseInt(req.params.employeeId || req.params.id, 10);
  if (!isNaN(resourceId) && employeeId === resourceId) {
    next();
    return;
  }
  sendError(res, "Forbidden: You cannot access this resource", 403);
}


export async function resolveCompanyContext(
  req: Request,
  res: Response,
  next: NextFunction
) {

  if (req.path === "/mine") {
    return next();
  }
  const companyId = Number(req.headers["x-company-id"]);
  
  if (!companyId) {
    return next();
  }

  // validate user has access to this company

  const access = await CompanyManager.findOne({
    where: {
      company_id: companyId,
      employee_id: req.user!.employeeId,
    },
  });

  if (!access && !req.user!.isSuperAdmin) {
    sendError(res, "Company access denied", 403);
    return;
  }

  // Switching company context mid-request must also refresh permissions.
  // req.user.permissions comes from the JWT, computed for the token's
  // ORIGINAL company at login time. Without recomputing here, authorize()
  // further down the chain would keep checking that stale, wrong-company
  // permission set even though req.user.companyId (and every DB write in
  // this request) now targets a different company.
  //
  // Dynamic import here on purpose: a top-level import of auth.service.ts
  // would create a circular dependency (auth.service -> permission-groups/
  // permissionGroupOverrides -> auth.middleware).
  if (companyId !== req.user!.companyId) {
    const { loadPermissions } = await import("./auth.service");
    const { permissions, isSuperAdmin } = await loadPermissions(
      req.user!.employeeId,
      companyId,
    );
    req.user!.permissions = permissions;
    req.user!.isSuperAdmin = isSuperAdmin;
  }

  req.user!.companyId = companyId;
  next();
}