import { Op } from "sequelize";
import { PermissionGroup, GroupPermission, UserGroup } from "../../database/models/PermissionGroups";
import { Permission } from "../../database/models/RoleModels";
import { Employee } from "../../database/models/Employee";
import { AppError } from "../../middleware/errorHandler.middleware";
import { clearPermissionCache } from "../../middleware/rbac.middleware";
import { logActivity } from "../../utils/activityLogger";
import { EmployeePermission } from "../../database/models/EmployeePermission";
import { EmployeePermissionOverride } from "../../database/models/EmployeePermissionOverride";
import { CompanyManager } from "../../database/models";
import { refreshEmployeePermission } from "../../utils/refreshEmployeePermission";
import { refreshEmployeeCompanies } from "../../utils/refreshEmployeeCompanies";
import { FormBuilderService } from '../form-builder/formBuilder.service';
import { resolvePermissionsForEmployee } from './permissionGroupOverrides';


const fbSvc = new FormBuilderService();
export class PermissionGroupService {
  async list(companyId: number) {
    const groups = await PermissionGroup.findAll({
      where: {},
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["id", "slug", "module", "action"],
          // company_id filter on the junction row — same reasoning as
          // getById(): a group shared across companies would otherwise
          // show whichever company's permissions were saved, not this one.
          through: { attributes: [], where: { company_id: companyId } },
        },
      ],
      order: [
        ["is_system", "DESC"],
        ["name", "ASC"],
      ],
    });

    // Enrich with member counts
    const groupIds = groups.map((g) => g.id);
    const userGroups = await UserGroup.findAll({
      where: { group_id: groupIds, company_id: companyId },
      attributes: ["group_id"],
    });
    const countMap: Record<number, number> = {};
    for (const ug of userGroups)
      countMap[ug.group_id] = (countMap[ug.group_id] || 0) + 1;

    return groups.map((g) => ({
      ...g.toJSON(),
      member_count: countMap[g.id] || 0,
    }));
  }

  async getById(id: number, companyId: number) {
    const group = await PermissionGroup.findOne({
      where: { id },
      include: [
        {
          model: Permission,
          as: "permissions",
          // company_id filter on the junction row — without this, a group
          // shared across companies (see resolveGroupCompanyScope) returns
          // whichever company's permissions were saved, not necessarily
          // THIS company's. This directly feeds groupBaseModPerms in
          // GroupDetail.tsx (via useGroupPerms), which decides which
          // modules get checked for field-level overrides and what
          // "previous" value the override diff panel displays.
          through: { attributes: [], where: { company_id: companyId } },
        },
      ],
    });
    if (!group) throw new AppError("Permission group not found", 404);
    return group;
  }

  async create(
    dto: {
      name: string;
      description?: string;
      color?: string;
      slug?: string;
    },
    createdBy?: number,
  ) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const exists = await PermissionGroup.findOne({
      where: { slug },
    });
    if (exists)
      throw new AppError("A group with this slug already exists", 409);

    const group = await PermissionGroup.create({
      name: dto.name,
      slug,
      description: dto.description || null,
      color: dto.color || "#1e56d9",
      is_system: false,
      is_active: true,
      created_by: createdBy || null,
    });

    await logActivity({
      companyId: null,
      employeeId: createdBy,
      action: "PERMISSION_GROUP_CREATED",
      module: "settings",
      entityId: group.id,
      newValues: { name: group.name },
    });

    return group;
  }

  async update(
    id: number,
    companyId: number,
    dto: {
      name?: string;
      description?: string;
      color?: string;
      is_active?: boolean;
    },
    updatedBy?: number,
  ) {
    const group = await this.getById(id, companyId);
    const old = { name: group.name, is_active: group.is_active };
    const { name, description, color, is_active } = dto;
    await group.update({ name, description, color, is_active });
    await logActivity({
      companyId,
      employeeId: updatedBy,
      action: "PERMISSION_GROUP_UPDATED",
      module: "settings",
      entityId: id,
      oldValues: old,
      newValues: dto,
    });
    return group;
  }

  async delete(id: number, companyId: number, deletedBy?: number) {
    const group = await this.getById(id, companyId);
    if (group.is_system)
      throw new AppError("System permission groups cannot be deleted", 403);

    const memberCount = await UserGroup.count({ where: { group_id: id } });
    if (memberCount > 0)
      throw new AppError(
        `Cannot delete: ${memberCount} users are assigned to this group`,
        409,
      );

    await GroupPermission.destroy({ where: { group_id: id } });
    await group.destroy();
    await logActivity({
      companyId,
      employeeId: deletedBy,
      action: "PERMISSION_GROUP_DELETED",
      module: "settings",
      entityId: id,
      oldValues: { name: group.name },
    });
    return { deleted: true };
  }

  // ── Permission assignment ────────────────────────────────────────────────────

  async setPermissions(
    id: number,
    companyId: number,
    slugs: string[],
    updatedBy?: number,
    isSuperAdmin = false,
  ) {

    await this.getById(id, companyId);

    const permissions = await Permission.findAll({
      where: { slug: [...new Set(slugs)] },
    });
    // Scope the wipe to THIS company only. A group's members can span
    // multiple companies (see resolveGroupCompanyScope) and GroupPermission
    // rows are company-scoped by design (company_id column) — deleting by
    // group_id alone here used to wipe every other company's saved
    // permissions for this same group, and since the reads never filtered
    // by company_id either, whichever company saved last silently became
    // the baseline for ALL companies sharing this group.
    await GroupPermission.destroy({
      where: { group_id: id, company_id: companyId },
    });

    await GroupPermission.bulkCreate(
      permissions.map((p) => ({
        group_id: id,
        company_id: companyId,
        permission_id: p.id,
      }))
    );
    const companyIds = await fbSvc.resolveGroupCompanyScope(id, updatedBy!, isSuperAdmin);
    await fbSvc.applyModuleDefaultsToFields(
      id, companyIds, permissions.map(p => p.slug), updatedBy,
    );
    const userGroups = await UserGroup.findAll({ where: { group_id: id } });
    for (const ug of userGroups) {
      await refreshEmployeePermission(
        ug.employee_id,
        [ug.company_id],
      );
      clearPermissionCache(ug.employee_id);
    }

    // await refreshEmployeeCompanies(employee_Id);
    // await refreshEmployeePermission(employeeId, added);

    return { groupId: id, slugs, updated: permissions.length };
  }

  async getEmployeePermissions(employeeId: number, companyId: number) {
    const groups = await UserGroup.findAll({
      where: {
        employee_id: employeeId,
        company_id: companyId,
      },
    });

    const groupIds = groups.map((g) => g.group_id);

    // company_id filter here matters: GroupPermission rows are company-scoped,
    // and a group can have members in several companies at once — without
    // this filter, the baseline would include permissions saved for ANY
    // company that shares this group, not just this one.
    const groupPermissions = await GroupPermission.findAll({
      where: {
        group_id: groupIds,
        company_id: companyId,
      },
      include: [
        {
          model: Permission,
        },
      ],
    });

    const finalPermissions = new Set<string>();

    for (const gp of groupPermissions) {
      finalPermissions.add((gp as any).Permission.slug);
    }

    // Apply the employee's actual module-level overrides — EmployeePermissionOverride
    // is what the override UI (setOverrides) and the runtime resolver
    // (resolveModuleSlugs in formBuilder.service.ts) both read/write.
    // EmployeePermission (a separate, differently-shaped model — `type`
    // grant/revoke vs `granted` boolean) is never written to anywhere in
    // this codebase, so reading it here silently ignored every override an
    // admin ever set.
    return [...(await resolvePermissionsForEmployee(employeeId, companyId, groupIds, finalPermissions))];
  }

  // ── Member management ────────────────────────────────────────────────────────

  async getMembers(id: number, employeeId: number, isSuperAdmin: boolean) {
    let companyIds: number[] = [];

    if (isSuperAdmin) {
      const { Company } = await import("../../database/models/Company");
      const companies = await Company.findAll({
        where: { is_active: true },
        attributes: ["id"],
      });

      companyIds = companies.map((c: any) => c.id);
    } else {
      const assignments = await CompanyManager.findAll({
        where: { employee_id: employeeId },
        attributes: ["company_id"],
      });

      companyIds = assignments.map((c: any) => c.company_id);
    }

    const userGroups = await UserGroup.findAll({
      where: {
        group_id: id,
        company_id: {
          [Op.in]: companyIds,
        },
      },
    });

    if (!userGroups.length) return [];

    const companiesByEmployee: Record<number, number[]> = {};
    for (const ug of userGroups) {
      (companiesByEmployee[ug.employee_id] ??= []).push(ug.company_id);
    }

    const employeeIds = Object.keys(companiesByEmployee).map(Number);
    const employees = await Employee.findAll({
      where: { id: employeeIds },
      attributes: ["id", "first_name", "last_name", "employee_code", "company_id"],
    });

    return employees.map((e: any) => ({
      ...e.toJSON(),
      assigned_company_ids: companiesByEmployee[e.id] || [],
    }));

    // const employeeIds = [...new Set(userGroups.map((x) => x.employee_id))];
    // return Employee.findAll({
    //   where: { id: employeeIds },
    //   attributes: [
    //     "id",
    //     "first_name",
    //     "last_name",
    //     "employee_code",
    //     "company_id",
    //   ],
    // });
  }

  async addMember(
    groupId: number,
    companyId: number,
    employeeId: number,
    addedBy?: number,
    companyIds?: number[],
  ) {
    const group = await this.getById(groupId, companyId);

    const emp = await Employee.findOne({ where: { id: employeeId } });
    if (!emp) throw new AppError("Employee not found", 404);

    const targetCompanies =
      companyIds && companyIds.length > 0 ? companyIds : [companyId];
    const added: number[] = [];
    for (const cid of targetCompanies) {
      // Bug 2 fix: UserGroup.company_id = the TARGET company (cid), not admin's company
      const [created] = await UserGroup.findOrCreate({
        where: { group_id: groupId, employee_id: employeeId, company_id: cid },
        defaults: {
          group_id: groupId,
          employee_id: employeeId,
          company_id: cid,
          assigned_by: addedBy || null,
        },
      });

      if (created) {
        added.push(cid);

        // Bug 1 fix: create CompanyManager row so employee can see this company
        // in /companies/mine and switch to it in the portal
        await CompanyManager.findOrCreate({
          where: { company_id: cid, employee_id: employeeId },
          defaults: {
            company_id: cid,
            employee_id: employeeId,
            is_primary: false,
            assigned_by: addedBy || null,
          },
        } as any);
      }
    }

    if (added.length === 0) {
      throw new AppError(
        "Employee is already in this group for all selected companies",
        409,
      );
    }

    clearPermissionCache(employeeId);
    await logActivity({
      companyId,
      employeeId: addedBy,
      action: "PERMISSION_GROUP_MEMBER_ADDED",
      module: "settings",
      entityId: groupId,
      newValues: { employeeId, companiesAdded: added },
    });

    await refreshEmployeeCompanies(employeeId);
    await refreshEmployeePermission(employeeId, added);
    return {
      employeeId,
      groupId,
      companiesAdded: added,
      action: "member_added",
    };
  }

  async removeMember(
    groupId: number,
    companyId: number,
    employeeId: number,
    removedBy?: number,
  ) {
    const membership = await UserGroup.findOne({
      where: {
        group_id: groupId,
        employee_id: employeeId,
        company_id: companyId,
      },
    });

    if (!membership) {
      throw new AppError("User is not in this group", 404);
    }

    const targetCompanyId = membership.company_id;

    const deleted = await UserGroup.destroy({
      where: {
        id: membership.id,
      },
    });

    if (!deleted) throw new AppError("User is not in this group", 404);
    const deletedOverrides = await EmployeePermissionOverride.destroy({
      where: {
        group_id: groupId,
        employee_id: employeeId,
        company_id: targetCompanyId,
      },
    });

    await EmployeePermission.destroy({
      where: { employee_id: employeeId, company_id: targetCompanyId },
    });

    // Also remove the CompanyManager row for this company if the employee
    // has no other UserGroup rows for it (i.e. no other group access to this company)
    const remainingGroups = await UserGroup.findOne({
      where: { employee_id: employeeId, company_id: targetCompanyId },
    });
    if (!remainingGroups) {
      await CompanyManager.destroy({
        where: { company_id: targetCompanyId, employee_id: employeeId },
      });
    }

    clearPermissionCache(employeeId);
    await logActivity({
      companyId: targetCompanyId,
      employeeId: removedBy,
      action: "PERMISSION_GROUP_MEMBER_REMOVED",
      module: "settings",
      entityId: groupId,
      newValues: { employeeId },
    });
    await refreshEmployeeCompanies(employeeId)
    await refreshEmployeePermission(employeeId, [targetCompanyId]);
    return { employeeId, groupId, action: "member_removed" };
  }

  async getUserGroups(employeeId: number, companyId: number) {
    return PermissionGroup.findAll({
      where: { is_active: true },
      include: [
        {
          model: Employee,
          as: "members",
          where: { id: employeeId },
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
          attributes: ["slug"],
        },
      ],
    });
  }

}