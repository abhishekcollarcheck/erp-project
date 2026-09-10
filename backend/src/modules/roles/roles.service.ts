import { Role, Permission, RolePermission, RoleModulePermission } from '../../database/models/RoleModels';
import { EmployeeRole }                       from '../../database/models/AuthModels';
import { Employee }                           from '../../database/models/Employee';
import { CompanyManager }                     from '../../database/models/CompanyManager';
import { UserGroup }                          from '../../database/models/PermissionGroups';
import { AppError }                           from '../../middleware/errorHandler.middleware';
import { clearPermissionCache }               from '../../middleware/rbac.middleware';
import { refreshEmployeePermission }          from '../../utils/refreshEmployeePermission';
import { refreshEmployeeCompanies }           from '../../utils/refreshEmployeeCompanies';
import { logActivity }                        from '../../utils/activityLogger';

// A role can only grant view/edit/delete/download: role_module_permissions has
// just those columns (no create/approve/export) and auth.service reads exactly
// them. create/approve/export must come from a permission group. setPermissions()
// still stores the full slug list in role_permissions so the API round-trips
// everything the caller sent.

export class RolesService {

  // ─── List roles ─────────────────────────────────────────────────────────────
  async list(companyId: number) {
    const roles = await Role.findAll({
      where: { company_id: companyId },
      order: [['is_system','DESC'],['name','ASC']],
    });

    // Enrich with member counts — members live in employee_roles (the table
    // auth.service reads), NOT the legacy role_assignments table.
    const roleIds = roles.map(r => r.id);
    const assignments = roleIds.length
      ? await EmployeeRole.findAll({
          where: { company_id: companyId, role_id: roleIds },
          attributes: ['role_id'],
        })
      : [];

    const countMap: Record<number,number> = {};
    for (const a of assignments) {
      countMap[a.role_id] = (countMap[a.role_id] || 0) + 1;
    }

    return roles.map(r => ({ ...r.toJSON(), member_count: countMap[r.id] || 0 }));
  }

  async getById(id: number, companyId: number) {
    const role = await Role.findOne({ where: { id, company_id: companyId } });
    if (!role) throw new AppError('Role not found', 404);
    return role;
  }

  // ─── Create custom role ──────────────────────────────────────────────────────
  async create(companyId: number, dto: {
    name: string; slug?: string; description?: string;
  }, createdBy?: number) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const exists = await Role.findOne({ where: { company_id: companyId, slug } });
    if (exists) throw new AppError('A role with this slug already exists', 409);

    const role = await Role.create({
      company_id:  companyId,
      name:        dto.name,
      slug,
      description: dto.description || null,
      is_system:   false,
    });

    await logActivity({ companyId, employeeId: createdBy, action: 'ROLE_CREATED', module: 'roles', entityId: role.id, newValues: { name: role.name, slug } });
    return role;
  }

  // ─── Update role ─────────────────────────────────────────────────────────────
  async update(id: number, companyId: number, dto: {
    name?: string; description?: string;
  }, updatedBy?: number) {
    const role = await this.getById(id, companyId);
    const oldValues = { name: role.name, description: role.description };

    await role.update({ name: dto.name || role.name, description: dto.description ?? role.description });

    await this.refreshRoleMembers(id, companyId);
    await logActivity({ companyId, employeeId: updatedBy, action: 'ROLE_UPDATED', module: 'roles', entityId: id, oldValues, newValues: dto });
    return role;
  }

  // ─── Delete role ─────────────────────────────────────────────────────────────
  async delete(id: number, companyId: number, deletedBy?: number) {
    const role = await this.getById(id, companyId);
    if (role.is_system) throw new AppError('System roles cannot be deleted', 403);

    // Snapshot members before unassigning so their live sessions can be refreshed.
    const memberIds = (await EmployeeRole.findAll({
      where: { role_id: id, company_id: companyId }, attributes: ['employee_id'],
    })).map(m => m.employee_id);

    await EmployeeRole.destroy({ where: { role_id: id, company_id: companyId } });
    await RolePermission.destroy({ where: { role_id: id } });
    await RoleModulePermission.destroy({ where: { role_id: id } });
    await role.destroy();

    for (const eid of memberIds) {
      const [otherRole, otherGroup] = await Promise.all([
        EmployeeRole.findOne({ where: { employee_id: eid, company_id: companyId } }),
        UserGroup.findOne({ where: { employee_id: eid, company_id: companyId } }),
      ]);
      if (!otherRole && !otherGroup) {
        await CompanyManager.destroy({ where: { company_id: companyId, employee_id: eid } });
      }
      clearPermissionCache(eid);
      await refreshEmployeeCompanies(eid);
      await refreshEmployeePermission(eid, [companyId]);
    }
    await logActivity({ companyId, employeeId: deletedBy, action: 'ROLE_DELETED', module: 'roles', entityId: id, oldValues: { name: role.name } });
    return { deleted: true };
  }

  // ─── Permission assignment ───────────────────────────────────────────────────
  async getPermissions(roleId: number, companyId: number) {
    await this.getById(roleId, companyId);
    const rps = await RolePermission.findAll({
      where: { role_id: roleId },
      include: [{ model: Permission, as: 'permission' }],
    });
    return rps.map(rp => (rp as any).permission?.slug).filter(Boolean);
  }

  async setPermissions(roleId: number, companyId: number, permSlugs: string[], updatedBy?: number) {
    await this.getById(roleId, companyId);
    const slugs = [...new Set((permSlugs || []).filter(Boolean))];
    const permissions = await Permission.findAll({ where: { slug: slugs } });

    // 1. Slug join (role_permissions) — keeps the API round-trip lossless.
    await RolePermission.destroy({ where: { role_id: roleId } });
    if (permissions.length) {
      await RolePermission.bulkCreate(permissions.map(p => ({ role_id: roleId, permission_id: p.id })));
    }

    // 2. Module-level flags (role_module_permissions) — this is the table
    //    auth.service.loadPermissions() actually reads, so without this a
    //    role's grants never reach a member's session.
    const byModule = new Map<string, Set<string>>();
    for (const p of permissions) {
      const [mod, action] = p.slug.split(':');
      if (!mod || !action) continue;
      if (!byModule.has(mod)) byModule.set(mod, new Set());
      byModule.get(mod)!.add(action);
    }
    await RoleModulePermission.destroy({ where: { role_id: roleId } });
    const rows = [...byModule.entries()]
      .map(([module, actions]) => ({
        role_id:      roleId,
        module,
        can_view:     actions.has('view'),
        can_edit:     actions.has('edit'),
        can_delete:   actions.has('delete'),
        can_download: actions.has('download'),
        can_mask:     false,
      }))
      .filter(r => r.can_view || r.can_edit || r.can_delete || r.can_download);
    if (rows.length) await RoleModulePermission.bulkCreate(rows);

    await this.refreshRoleMembers(roleId, companyId);
    await logActivity({ companyId, employeeId: updatedBy, action: 'ROLE_PERMISSIONS_UPDATED', module: 'roles', entityId: roleId, newValues: { slugs } });
    return { updated: true, count: permissions.length };
  }

  // ─── Member management ───────────────────────────────────────────────────────
  async getMembers(roleId: number, companyId: number) {
    await this.getById(roleId, companyId);
    const assignments = await EmployeeRole.findAll({
      where: { role_id: roleId, company_id: companyId },
    });
    if (!assignments.length) return [];

    const employeeIds = assignments.map(a => a.employee_id);
    return Employee.findAll({
      where: { id: employeeIds },
      attributes: ['id','first_name','last_name','employee_code','email'],
      order: [['first_name','ASC']],
    });
  }

  async assignMember(roleId: number, companyId: number, employeeId: number, assignedBy?: number) {
    await this.getById(roleId, companyId);

    const emp = await Employee.findOne({ where: { id: employeeId } });
    if (!emp) throw new AppError('Employee not found', 404);

    const [assignment, created] = await EmployeeRole.findOrCreate({
      where: { role_id: roleId, employee_id: employeeId, company_id: companyId },
      defaults: { role_id: roleId, employee_id: employeeId, company_id: companyId, assigned_by: assignedBy || null },
    });
    if (!created) throw new AppError('User already has this role', 409);

    // Mirror PermissionGroupService.addMember — give the employee a
    // CompanyManager row so this company shows up in /companies/mine and can
    // be switched to in the portal (and so resolveCompanyContext accepts it).
    await CompanyManager.findOrCreate({
      where: { company_id: companyId, employee_id: employeeId },
      defaults: { company_id: companyId, employee_id: employeeId, is_primary: false, assigned_by: assignedBy || null },
    } as any);

    clearPermissionCache(employeeId);
    await refreshEmployeeCompanies(employeeId);
    await refreshEmployeePermission(employeeId, [companyId]);
    await logActivity({ companyId, employeeId: assignedBy, action: 'ROLE_MEMBER_ADDED', module: 'roles', entityId: roleId, newValues: { employeeId } });
    return assignment;
  }

  async removeMember(roleId: number, companyId: number, employeeId: number) {
    const deleted = await EmployeeRole.destroy({ where: { role_id: roleId, employee_id: employeeId, company_id: companyId } });
    if (!deleted) throw new AppError('Assignment not found', 404);

    // Drop the CompanyManager row only when nothing else ties this employee to
    // the company (no other role, no permission-group membership) — same
    // reasoning as PermissionGroupService.removeMember.
    const [otherRole, otherGroup] = await Promise.all([
      EmployeeRole.findOne({ where: { employee_id: employeeId, company_id: companyId } }),
      UserGroup.findOne({ where: { employee_id: employeeId, company_id: companyId } }),
    ]);
    if (!otherRole && !otherGroup) {
      await CompanyManager.destroy({ where: { company_id: companyId, employee_id: employeeId } });
    }

    clearPermissionCache(employeeId);
    await refreshEmployeeCompanies(employeeId);
    await refreshEmployeePermission(employeeId, [companyId]);
    await logActivity({ companyId, action: 'ROLE_MEMBER_REMOVED', module: 'roles', entityId: roleId, newValues: { employeeId } });
    return { removed: true };
  }

  async listAllPermissions() {
    return Permission.findAll({ order: [['module','ASC'],['action','ASC']] });
  }

  // ─── Internal: push fresh permissions to every member of a role ──────────────
  private async refreshRoleMembers(roleId: number, companyId: number) {
    const members = await EmployeeRole.findAll({
      where: { role_id: roleId, company_id: companyId }, attributes: ['employee_id'],
    });
    for (const m of members) {
      clearPermissionCache(m.employee_id);
      await refreshEmployeePermission(m.employee_id, [companyId]);
    }
  }
}
