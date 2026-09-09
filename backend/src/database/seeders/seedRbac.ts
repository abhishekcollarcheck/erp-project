/**
 * seedRbac — bootstraps the Role & Permission system to a working state:
 *
 *   1. Permission catalog (permissions table)
 *   2. Role templates + their module grants
 *   3. Per-company system roles (roles + role_module_permissions)
 *   4. Module ↔ company links (module_companies) for the form-builder
 *   5. System permission groups (permission_groups + group_permissions per company)
 *   6. super_admin / hr_manager role assignments for the seeded admin accounts
 *
 * Fully idempotent — safe to re-run. Invoked from the main seeder (seeder.ts)
 * and from POST /api/permission-groups/seed.
 *
 * Standalone:  npx ts-node -r tsconfig-paths/register src/database/seeders/seedRbac.ts
 */
import { sequelize } from '../../config/database';
import { logger } from '../../config/logger';
import { Company } from '../models/Company';
import { Employee } from '../models/Employee';
import { Permission, Role, RoleModulePermission } from '../models/RoleModels';
import { EmployeeRole, RoleTemplate, RoleTemplatePermission } from '../models/AuthModels';
import { HrModule, ModuleCompany } from '../models/FormBuilder';
import { PermissionGroup, GroupPermission } from '../models/PermissionGroups';
import { FormBuilderService } from '../../modules/form-builder/formBuilder.service';
import {
  buildPermissionCatalog, SYSTEM_GROUPS, ROLE_TEMPLATE_PERMS,
} from './rbac-seed-data';

const fbSvc = new FormBuilderService();

const TEMPLATE_DEFS = [
  { slug: 'super_admin', name: 'Super Admin',       sort_order: 1 },
  { slug: 'hr_manager',  name: 'HR Manager',        sort_order: 2 },
  { slug: 'manager',     name: 'Department Manager', sort_order: 3 },
  { slug: 'employee',    name: 'Employee',          sort_order: 4 },
];

export interface SeedRbacResult {
  permissions: number;
  roleTemplates: number;
  companyRoles: number;
  moduleLinks: number;
  groups: number;
  groupPermissionRows: number;
  roleAssignments: number;
}

export async function seedRbac(): Promise<SeedRbacResult> {
  const result: SeedRbacResult = {
    permissions: 0, roleTemplates: 0, companyRoles: 0, moduleLinks: 0,
    groups: 0, groupPermissionRows: 0, roleAssignments: 0,
  };

  // ── 1. Permission catalog ──────────────────────────────────────────────────
  const catalog = buildPermissionCatalog();
  for (const row of catalog) {
    const [, created] = await Permission.findOrCreate({
      where: { slug: row.slug },
      defaults: { module: row.module, action: row.action, slug: row.slug },
    });
    if (created) result.permissions++;
  }
  const allPerms = await Permission.findAll({ attributes: ['id', 'slug'] });
  const permIdBySlug = new Map(allPerms.map(p => [p.slug, p.id]));

  // ── 2. Role templates + template permissions ───────────────────────────────
  for (const def of TEMPLATE_DEFS) {
    const [tmpl, created] = await RoleTemplate.findOrCreate({
      where: { slug: def.slug },
      defaults: { slug: def.slug, name: def.name, sort_order: def.sort_order, is_system: true },
    });
    if (created) result.roleTemplates++;

    for (const p of (ROLE_TEMPLATE_PERMS[def.slug] ?? [])) {
      await RoleTemplatePermission.findOrCreate({
        where: { template_id: tmpl.id, module: p.module },
        defaults: {
          template_id: tmpl.id, module: p.module,
          can_view: p.can_view, can_create: p.can_edit, can_edit: p.can_edit,
          can_delete: p.can_delete, can_download: p.can_download,
        },
      });
    }
  }
  const templates = await RoleTemplate.findAll();
  const templateBySlug = new Map(templates.map(t => [t.slug, t]));

  const companies = await Company.findAll({ where: { is_active: true }, attributes: ['id'] });
  const companyIds = companies.map(c => c.id);

  // ── 3. Per-company system roles + role_module_permissions ───────────────────
  for (const companyId of companyIds) {
    for (const def of TEMPLATE_DEFS) {
      const tmpl = templateBySlug.get(def.slug)!;
      const [role, created] = await Role.findOrCreate({
        where: { company_id: companyId, slug: def.slug },
        defaults: {
          company_id: companyId, name: def.name, slug: def.slug,
          is_system: true, template_id: tmpl.id,
        },
      });
      if (created) result.companyRoles++;

      const tPerms = await RoleTemplatePermission.findAll({ where: { template_id: tmpl.id } });
      for (const tp of tPerms) {
        await RoleModulePermission.findOrCreate({
          where: { role_id: role.id, module: tp.module },
          defaults: {
            role_id: role.id, module: tp.module,
            can_view: tp.can_view, can_edit: tp.can_edit,
            can_delete: tp.can_delete, can_download: (tp as any).can_download ?? false,
            can_mask: false,
          },
        });
      }
    }
  }

  // ── 4. Module ↔ company links ──────────────────────────────────────────────
  const modules = await HrModule.findAll({ where: { is_active: true }, attributes: ['id'] });
  for (const m of modules) {
    for (const companyId of companyIds) {
      const [, created] = await ModuleCompany.findOrCreate({
        where: { module_id: m.id, company_id: companyId },
        defaults: { module_id: m.id, company_id: companyId },
      });
      if (created) result.moduleLinks++;
    }
  }

  // ── 5. System permission groups + per-company grants ───────────────────────
  for (const def of SYSTEM_GROUPS) {
    const [group, created] = await PermissionGroup.findOrCreate({
      where: { slug: def.slug },
      defaults: {
        name: def.name, slug: def.slug, description: def.description,
        color: def.color, is_system: true, is_active: true,
      },
    });
    if (created) result.groups++;

    const permIds = def.slug_grants
      .map(s => permIdBySlug.get(s))
      .filter((id): id is number => typeof id === 'number');

    for (const companyId of companyIds) {
      for (const permission_id of permIds) {
        const [, gpCreated] = await GroupPermission.findOrCreate({
          where: { group_id: group.id, company_id: companyId, permission_id },
          defaults: { group_id: group.id, company_id: companyId, permission_id },
        });
        if (gpCreated) result.groupPermissionRows++;
      }
    }

    // Seed default field_permissions_v2 rows for every form field of the
    // modules this group can view, so the Field Permissions UI is populated and
    // the wizard's field-level enforcement has a baseline to work from.
    // Idempotent — applyModuleDefaultsToFields never overwrites an existing row.
    try {
      await fbSvc.applyModuleDefaultsToFields(group.id, companyIds, def.slug_grants);
    } catch (e) {
      logger.warn(`seedRbac: applyModuleDefaultsToFields failed for group ${group.slug}: ${(e as Error).message}`);
    }
  }

  // ── 6. Admin role assignments ─────────────────────────────────────────────
  const superAdmins = await Employee.findAll({
    where: { is_super_admin: true }, attributes: ['id', 'company_id'],
  });
  for (const emp of superAdmins) {
    if (!emp.company_id) continue;
    const saRole = await Role.findOne({ where: { company_id: emp.company_id, slug: 'super_admin' } });
    if (!saRole) continue;
    const [, created] = await EmployeeRole.findOrCreate({
      where: { employee_id: emp.id, role_id: saRole.id, company_id: emp.company_id },
      defaults: { employee_id: emp.id, role_id: saRole.id, company_id: emp.company_id, assigned_by: emp.id },
    });
    if (created) result.roleAssignments++;
  }

  const hrAdmin = await Employee.findOne({ where: { email: 'admin@ung.com' }, attributes: ['id', 'company_id'] });
  if (hrAdmin?.company_id) {
    const hrRole = await Role.findOne({ where: { company_id: hrAdmin.company_id, slug: 'hr_manager' } });
    if (hrRole) {
      const [, created] = await EmployeeRole.findOrCreate({
        where: { employee_id: hrAdmin.id, role_id: hrRole.id, company_id: hrAdmin.company_id },
        defaults: { employee_id: hrAdmin.id, role_id: hrRole.id, company_id: hrAdmin.company_id, assigned_by: hrAdmin.id },
      });
      if (created) result.roleAssignments++;
    }
  }

  return result;
}

if (require.main === module) {
  sequelize.authenticate()
    .then(() => seedRbac())
    .then(r => { logger.info('🔐 RBAC seed complete: ' + JSON.stringify(r)); process.exit(0); })
    .catch(e => { console.error(e); logger.error('RBAC seed failed:', e); process.exit(1); });
}
