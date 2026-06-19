/**
 * requireCompanyId.middleware.ts
 *
 * Validates that every mutating API request (POST/PUT/PATCH) carries
 * a company_id that the requesting employee actually has access to.
 *
 * This enforces the "Action-Level Company Selection Model":
 *   - The client sends company_id in the request body or query param
 *   - The middleware verifies the employee is assigned to that company
 *   - If company_id is absent, it defaults to the employee's home company
 *   - If company_id is provided but unauthorized, returns 403
 *
 * Apply to any route where company selection matters:
 *   router.post('/employees', requireCompanyAccess, createEmployee)
 *   router.post('/payroll',   requireCompanyAccess, createPayroll)
 *
 * For GET routes, company_id comes from query param (?company_id=2).
 * For POST/PUT, company_id comes from the request body.
 */

import { Request, Response, NextFunction } from 'express';
import { CompanyManager } from '../database/models/CompanyManager';
import { sendError }      from '../utils/response';

/**
 * requireCompanyAccess
 *
 * Resolves and validates company_id for the current request.
 * Sets req.resolvedCompanyId for use by downstream handlers.
 *
 * Sources checked in order:
 *   1. req.body.company_id      (POST/PUT form submissions)
 *   2. req.query.company_id     (GET requests with ?company_id=N)
 *   3. req.user!.companyId      (fallback: employee's home company)
 */
export async function requireCompanyAccess(
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) { sendError(res, 'Unauthorized', 401); return; }

    const { employeeId, companyId: homeCompanyId, isSuperAdmin } = req.user;

    // Resolve company_id from request
    const rawId =
      req.body?.company_id   ??
      req.query?.company_id  ??
      null;

    const requestedId = rawId ? Number(rawId) : null;

    // If no company_id provided, use home company — always valid
    if (!requestedId || requestedId === homeCompanyId) {
      (req as any).resolvedCompanyId = homeCompanyId;
      next();
      return;
    }

    // Super admins can act on any company without a CompanyManager row
    if (isSuperAdmin) {
      (req as any).resolvedCompanyId = requestedId;
      next();
      return;
    }

    // Regular employees: verify they are assigned to the requested company
    const assignment = await CompanyManager.findOne({
      where: { employee_id: employeeId, company_id: requestedId },
      attributes: ['id', 'company_id'],
    });

    if (!assignment) {
      sendError(res, 'You do not have access to this company', 403);
      return;
    }

    (req as any).resolvedCompanyId = requestedId;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Extend Express Request type to include resolvedCompanyId.
 * Add to your global Express type augmentation (express.d.ts):
 *
 *   interface Request {
 *     resolvedCompanyId?: number;
 *   }
 */
