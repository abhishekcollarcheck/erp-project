import { Router, Request, Response, NextFunction } from "express";
import { body, param, query } from "express-validator";
import { Op } from "sequelize";
import { EmployeePermissionOverride } from "../../database/models/EmployeePermissionOverride";
import {
  PermissionGroup,
  UserGroup,
} from "../../database/models/PermissionGroups";
import { Employee } from "../../database/models/Employee";
import { AppError } from "../../middleware/errorHandler.middleware";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { sendResponse } from "../../utils/response";
import { logActivity } from "../../utils/activityLogger";
import { clearPermissionCache } from "../../middleware/rbac.middleware";
import { refreshEmployeePermission } from "../../utils/refreshEmployeePermission";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverrideDto {
  module: string;
  field_name: string | null;
  permission: string;
  granted: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class EmployeeOverrideService {
  /**
   * Confirm employee exists in this company AND is a member of this group.
   * UserGroup uses employee_id directly — no user lookup needed.
   */
  private async assertMembership(groupId: number, employeeId: number) {
    const emp = await Employee.findOne({
      where: { id: employeeId },
    });
    if (!emp) throw new AppError("Employee not found", 404);

    const membership = await UserGroup.findOne({
      where: { group_id: groupId, employee_id: employeeId },
    });
    if (!membership)
      throw new AppError("Employee is not a member of this group", 404);

    return emp;
  }

  async listOverrides(groupId: number, employeeId: number, companyId: number) {
    const membership = await UserGroup.findOne({
      where: {
        group_id: groupId,
        employee_id: employeeId,
        company_id: companyId
      },
    });

    if (!membership) {
      throw new AppError("Employee is not a member of this group", 404);
    }

    const targetCompanyId = membership.company_id;

    return EmployeePermissionOverride.findAll({
      where: {
        group_id: groupId,
        employee_id: employeeId,
        company_id: targetCompanyId,
      },
      order: [
        ["module", "ASC"],
        ["field_name", "ASC"],
        ["permission", "ASC"],
      ],
    });
  }

  async getOverrideCountsForGroup(
    groupId: number,
    companyId: number,
  ): Promise<Record<number, number>> {
    const rows = await EmployeePermissionOverride.findAll({
      where: { group_id: groupId, company_id: companyId },
      attributes: ["employee_id"],
    });
    const counts: Record<number, number> = {};
    for (const r of rows) {
      counts[r.employee_id] = (counts[r.employee_id] || 0) + 1;
    }
    return counts;
  }

  async setOverrides(
    groupId: number,
    employeeId: number,
    companyIds: number[],
    overrides: OverrideDto[],
    actorId: number,
  ) {
    if (!companyIds.length) {
      throw new AppError("At least one company_id is required", 400);
    }

    const memberships = await UserGroup.findAll({
      where: {
        group_id: groupId,
        employee_id: employeeId,
        company_id: companyIds,
      },
    });

    const validCompanyIds = new Set(memberships.map((m) => m.company_id));
    const invalidIds = companyIds.filter((id) => !validCompanyIds.has(id));

    if (invalidIds.length > 0) {
      throw new AppError(
        `Employee is not a member of this group in company_id(s): ${invalidIds.join(", ")}`,
        404,
      );
    }

    const VALID = new Set(["view", "create", "edit", "delete", "download"]);
    for (const o of overrides) {
      if (!o.module?.trim()) throw new AppError("module is required", 400);
      if (!VALID.has(o.permission))
        throw new AppError(
          `Invalid permission "${o.permission}". Allowed: view, create, edit, delete, download`,
          400,
        );
      if (o.field_name !== null && o.field_name !== undefined)
        throw new AppError(
          "field_name must be null — only module-level overrides are supported",
          400,
        );
    }

    for (const companyId of companyIds) {
      await EmployeePermissionOverride.destroy({
        where: {
          group_id: groupId,
          employee_id: employeeId,
          company_id: companyId,
        },
      });

      if (overrides.length > 0) {
        await EmployeePermissionOverride.bulkCreate(
          overrides.map((o) => ({
            company_id: companyId,
            group_id: groupId,
            employee_id: employeeId,
            module: o.module.trim(),
            field_name: null, // always null — module-level only
            permission: o.permission,
            granted: o.granted,
            created_by: actorId,
          })),
          { ignoreDuplicates: true },
        );
      }
    }

    clearPermissionCache(employeeId);

    await logActivity({
      companyId: companyIds[0],
      employeeId: actorId,
      action: "EMPLOYEE_PERMISSION_OVERRIDES_SET",
      module: "settings",
      entityId: employeeId,
      newValues: { groupId, companyIds, overrideCount: overrides.length },
    });
    await refreshEmployeePermission(employeeId, companyIds);
    return { updated: overrides.length, companiesUpdated: companyIds };
  }

  async deleteOverride(
    groupId: number,
    employeeId: number,
    overrideId: number,
    actorId: number,
  ) {
    console.log("delete-override", groupId, employeeId, overrideId, actorId)
    const row = await EmployeePermissionOverride.findOne({
      where: {
        id: overrideId,
        group_id: groupId,
        employee_id: employeeId,
      },
    });
    if (!row) throw new AppError("Override not found", 404);

    const targetCompanyId = row.company_id;

    const snapshot = {
      module: row.module,
      field_name: row.field_name,
      permission: row.permission,
      granted: row.granted,
    };
    await row.destroy();

    clearPermissionCache(employeeId);

    await logActivity({
      companyId: targetCompanyId,
      employeeId: actorId,
      action: "EMPLOYEE_PERMISSION_OVERRIDE_DELETED",
      module: "settings",
      entityId: employeeId,
      oldValues: { overrideId, groupId, ...snapshot },
    });

    // Push fresh permissions to the affected employee's portal
    await refreshEmployeePermission(employeeId, [targetCompanyId])

    return { deleted: true };
  }
}

const overrideSvc = new EmployeeOverrideService();

// ─── Exported helpers for rbac.middleware.ts ──────────────────────────────────

/**
 * resolvePermissionsForEmployee
 *
 * Called from rbac.middleware.ts after group slugs are loaded.
 * Applies module-level overrides to the slug set.
 *
 * The cache in your existing rbac middleware is keyed by employeeId
 * (confirmed: UserGroup.findAll({ where: { employee_id: employeeId } })).
 * clearPermissionCache(employeeId) is called on every override change.
 *
 * Usage — add these 2 lines inside loadPermissions() in auth.service.ts
 * or inside your rbac middleware after the slugs Set is built:
 *
 *   import { resolvePermissionsForEmployee } from '../modules/permission-groups/permissionGroupOverrides';
 *
 *   // After: for (const ug of groups) { slugs.add(p.slug); }
 *   const groupIds = groups.map((ug: any) => ug.group_id).filter(Boolean);
 *   await resolvePermissionsForEmployee(employeeId, companyId, groupIds, slugs);
 */
export async function resolvePermissionsForEmployee(
  employeeId: number,
  companyId: number,
  groupIds: number[],
  slugSet: Set<string>,
): Promise<Set<string>> {
  if (!groupIds.length) return slugSet;

  const overrides = await EmployeePermissionOverride.findAll({
    where: {
      employee_id: employeeId,
      company_id: companyId,
      group_id: { [Op.in]: groupIds },
      field_name: null, // module-level only — field-level handled separately
    },
    order: [["created_at", "ASC"]],
  });

  for (const o of overrides) {
    const slug = `${o.module}:${o.permission}`;


    if (o.granted) {
      slugSet.add(slug);
    } else {
      slugSet.delete(slug);
    }
  }

  return slugSet;
}

/**
 * getEmployeeFieldOverrides
 *
 * Returns field-level overrides for one employee in a module.
 * Use this inside controllers that apply field masking after
 * loading the group-level FieldPermission rows.
 *
 *   const fieldOverrides = await getEmployeeFieldOverrides(employeeId, companyId, 'employees');
 *   // { 'Aadhaar Number': { mask: false } }  ← unmasked for this employee only
 */
export async function getEmployeeFieldOverrides(
  employeeId: number,
  companyId: number,
  module: string,
): Promise<Record<string, Record<string, boolean>>> {
  const rows = await EmployeePermissionOverride.findAll({
    where: {
      employee_id: employeeId,
      company_id: companyId,
      module,
      field_name: { [Op.ne]: null },
    },
  });

  const result: Record<string, Record<string, boolean>> = {};
  for (const r of rows) {
    const fn = r.field_name!;
    if (!result[fn]) result[fn] = {};
    result[fn][r.permission] = r.granted;
  }
  return result;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

async function listOverrides(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  console.log("req.user", req.user)
  console.log("req.body", req.body)
  console.log("req.query", req.query)
  try {
    const companyId = +req.query.company_id!;
    const data = await overrideSvc.listOverrides(
      +req.params.id,
      +req.params.employeeId,
      companyId
    );

    sendResponse(res, { data });
  } catch (e) {
    next(e);
  }
}

async function setOverrides(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyIds = Array.isArray(req.body.company_ids)
      ? req.body.company_ids.map((id: any) => +id)
      : [];
    const data = await overrideSvc.setOverrides(
      +req.params.id,
      +req.params.employeeId,
      companyIds,
      req.body.overrides ?? [],
      req.user!.employeeId,
    );

    sendResponse(res, { data });
  } catch (e) {
    next(e);
  }
}

async function deleteOverride(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await overrideSvc.deleteOverride(
      +req.params.id,
      +req.params.employeeId,
      +req.params.overrideId,
      req.user!.employeeId,
    );

    sendResponse(res, { data });
  } catch (e) {
    next(e);
  }
}

/**
 * patchGroupMembersWithOverrideCounts
 *
 * Registers GET /:id/members-with-overrides — same as existing getGroupMembers
 * but enriches each member with override_count for the amber badge in the UI.
 *
 * Call after importing permissionGroupRouter:
 *   patchGroupMembersWithOverrideCounts(permissionGroupRouter);
 */
export function patchGroupMembersWithOverrideCounts(router: Router): void {
  router.get(
    "/:id/members-with-overrides",
    authenticate,
    [param("id").isInt()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { permissionGroupService } =
          await import("./permissionGroups.controller");
        const members = await permissionGroupService.getMembers(
          +req.params.id,
          req.user!.employeeId,
          req.user!.isSuperAdmin,
        );
        const overrideCounts = await overrideSvc.getOverrideCountsForGroup(
          +req.params.id,
          req.user!.companyId,
        );
        const enriched = members.map((m: any) => ({
          ...(m.toJSON?.() ?? m),
          override_count: overrideCounts[m.id] ?? 0,
        }));
        sendResponse(res, { data: enriched });
      } catch (e) {
        next(e);
      }
    },
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Mount on the existing permissionGroupRouter:
 *
 *   import { employeeOverrideRouter, patchGroupMembersWithOverrideCounts }
 *     from './permissionGroupOverrides';
 *
 *   permissionGroupRouter.use(employeeOverrideRouter);
 *   patchGroupMembersWithOverrideCounts(permissionGroupRouter); // optional enriched members
 */
export const employeeOverrideRouter = Router();
employeeOverrideRouter.use(authenticate);

employeeOverrideRouter.get(
  "/:id/members/:employeeId/overrides",
  [
    param("id").isInt(),
    param("employeeId").isInt(),
    query("company_id").isInt()
  ],
  validate,
  listOverrides,
);

employeeOverrideRouter.put(
  "/:id/members/:employeeId/overrides",
  [
    param("id").isInt(),
    param("employeeId").isInt(),
    body("company_ids").isArray({ min: 1 }),
    body("company_ids.*").isInt(),
    body("overrides").isArray(),
    body("overrides.*.module").trim().notEmpty(),
    body("overrides.*.permission").trim().notEmpty(),
    body("overrides.*.granted").isBoolean(),
  ],
  validate,
  setOverrides,
);

employeeOverrideRouter.delete(
  "/:id/members/:employeeId/overrides/:overrideId",
  [
    param("id").isInt(),
    param("employeeId").isInt(),
    param("overrideId").isInt(),
  ],
  validate,
  deleteOverride,
);
