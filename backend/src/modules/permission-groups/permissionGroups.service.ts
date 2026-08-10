import { Op } from "sequelize";
import { PermissionGroup, GroupPermission, UserGroup, SYSTEM_GROUPS } from "../../database/models/PermissionGroups";
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
          through: { attributes: [] },
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
        { model: Permission, as: "permissions", through: { attributes: [] } },
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
    console.log("Created permission group:", group.toJSON());
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

    // Fix: remove ALL existing rows for this group, regardless of any
    // legacy/missing company_id value — group_id alone is a sufficient,
    // unambiguous scope since a group belongs to exactly one company.
    await GroupPermission.destroy({
      where: { group_id: id },
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

    const groupPermissions = await GroupPermission.findAll({
      where: {
        group_id: groupIds,
      },
      include: [
        {
          model: Permission,
        },
      ],
    });

    const overrides = await EmployeePermission.findAll({
      where: {
        employee_id: employeeId,
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

    const grants = overrides.filter((o) => o.type === "grant");

    const revokes = overrides.filter((o) => o.type === "revoke");

    for (const grant of grants) {
      finalPermissions.add((grant as any).Permission.slug);
    }

    for (const revoke of revokes) {
      finalPermissions.delete((revoke as any).Permission.slug);
    }

    return [...finalPermissions];
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

      console.log("UserGroup findOrCreate result:", { groupId, employeeId, companyId: cid, created });

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

  // ── Seed system groups for a new company ─────────────────────────────────────
  async seedSystemGroups(companyId: number) {
    const allPerms = await Permission.findAll({ attributes: ["id", "slug"] });
    const permMap = new Map(allPerms.map((p) => [p.slug, p.id]));

    for (const tpl of SYSTEM_GROUPS) {
      const [group] = await PermissionGroup.findOrCreate({
        where: { slug: tpl.slug },
        defaults: {
          name: tpl.name,
          slug: tpl.slug,
          description: tpl.description,
          color: tpl.color,
          is_system: tpl.is_system,
          is_active: true,
        },
      });

      // Assign permissions
      const permIds = (tpl.slug_grants as readonly string[])
        .map((s) => permMap.get(s))
        .filter(Boolean) as number[];

      if (permIds.length) {
        await GroupPermission.destroy({ where: { group_id: group.id } });
        await GroupPermission.bulkCreate(
          permIds.map((pid) => ({ group_id: group.id, permission_id: pid })),
          { ignoreDuplicates: true },
        );
      }
    }
  }
}