import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { Company, DEFAULT_MODULES, CompanyModule } from '../../database/models/Company';
import { Employee } from '../../database/models/Employee';
import { Role, RoleModulePermission } from '../../database/models/RoleModels';
import { EmployeeRole, RoleTemplate, RoleTemplatePermission } from '../../database/models/AuthModels';
import { Department } from '../../database/models/Department';
import { CompanyManager } from '../../database/models/CompanyManager';
import { AppError } from '../../middleware/errorHandler.middleware';
import { authenticate, authorize, resolveCompanyContext } from '../auth/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { logActivity } from '../../utils/activityLogger';
import { isCompanySuperAdmin, countCompanySuperAdmins } from '../auth/auth.service';
import { sendResponse, sendError, sendPaginated, parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { getSettings, updateSettings, updateTheme } from './companySetting'
import { PermissionGroup, GroupPermission, SYSTEM_GROUPS } from '../../database/models/PermissionGroups';
import { Permission } from '../../database/models/RoleModels';

// ─── Guards ───────────────────────────────────────────────────────────────────

// Platform super admin OR company super admin of this specific company
async function requireCompanyAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
  if (req.user.isSuperAdmin) { next(); return; }
  const ok = await isCompanySuperAdmin(req.user.employeeId, +req.params.id);
  if (!ok) {
    sendError(res, 'Forbidden: Only company super admins can perform this action', 403);
    return;
  }
  next();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextEmpCode(companyId: number, slug: string): Promise<string> {
  const count = await Employee.count({ where: { company_id: companyId } });
  const prefix = slug.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'E');
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

async function getSuperAdminRole(companyId: number) {
  return Role.findOne({ where: { company_id: companyId, slug: 'super_admin' } });
}

// ─── Platform stats ───────────────────────────────────────────────────────────

async function getPlatformStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [total, active, totalEmployees] = await Promise.all([
      Company.count({ paranoid: false }),
      Company.count({ where: { is_active: true } }),
      Employee.count(),
    ]);
    const planRows = await Company.findAll({
      attributes: ['subscription_plan', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { is_active: true }, group: ['subscription_plan'], raw: true,
    }) as any[];
    const plans: Record<string, number> = {};
    for (const r of planRows) plans[r.subscription_plan] = Number(r.count);
    sendResponse(res, { data: { totalCompanies: total, activeCompanies: active, suspendedCompanies: total - active, totalEmployees, plans } });
  } catch (e) { next(e); }
}

// ─── List companies ───────────────────────────────────────────────────────────

async function listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query as any);
    const where: any = {};

    if (!req.user!.isSuperAdmin) {
      const managed = await CompanyManager.findAll({ where: { employee_id: req.user!.employeeId }, attributes: ['company_id'] });
      const ids = managed.map(m => m.company_id);
      if (!ids.length) { sendPaginated(res, [], buildPaginationMeta(page, limit, 0)); return; }
      where.id = ids;
    }
    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';
    if (req.query.plan) where.subscription_plan = req.query.plan;
    if (req.query.search) {
      where[Op.or] = [{ name: { [Op.like]: `%${req.query.search}%` } }, { slug: { [Op.like]: `%${req.query.search}%` } }];
    }

    const { count, rows } = await Company.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']], paranoid: false });
    const ids = rows.map(c => c.id);

    const [empCounts, primaryManagers] = await Promise.all([
      Employee.findAll({ where: { company_id: ids }, attributes: ['company_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']], group: ['company_id'], raw: true }),
      CompanyManager.findAll({ where: { company_id: ids, is_primary: true }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }] }),
    ]);
    const eMap: Record<number, number> = {};
    for (const r of empCounts as any[]) eMap[r.company_id] = Number(r.cnt);
    const mMap: Record<number, any> = {};
    for (const m of primaryManagers) mMap[m.company_id] = (m as any).employee;

    sendPaginated(res, rows.map(c => ({
      ...c.toJSON(),
      employee_count: eMap[c.id] || 0,
      primary_manager: mMap[c.id] || null,
    })), buildPaginationMeta(page, limit, count));
  } catch (e) { next(e); }
}

// ─── My companies ─────────────────────────────────────────────────────────────

async function getMyCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignments = await CompanyManager.findAll({
      where: { employee_id: req.user!.employeeId },
      include: [{ model: Company, as: 'company' }],
      order: [['is_primary', 'DESC'], ['assigned_at', 'ASC']],
    });
    const companyIds = assignments.map(a => a.company_id);
    const empRoles = await EmployeeRole.findAll({
      where: { employee_id: req.user!.employeeId, company_id: companyIds },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'slug'] }],
    });
    const roleMap: Record<number, any> = {};
    for (const er of empRoles) roleMap[er.company_id] = (er as any).role;

    const result = await Promise.all(assignments.map(async a => ({
      ...(a as any).company?.toJSON(),
      is_primary: a.is_primary,
      manager_role: roleMap[a.company_id] || null,
      is_super_admin: await isCompanySuperAdmin(req.user!.employeeId, a.company_id),
    })));
    sendResponse(res, { data: result });
  } catch (e) { next(e); }
}

// ─── Get single company ───────────────────────────────────────────────────────

async function getCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await Company.findByPk(+req.params.id, { paranoid: false });
    if (!company) { sendError(res, 'Company not found', 404); return; }

    const [empCount, managers, roles] = await Promise.all([
      Employee.count({ where: { company_id: company.id } }),
      CompanyManager.findAll({
        where: { company_id: company.id },
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url', 'employee_code', 'is_super_admin'] }],
        order: [['is_primary', 'DESC'], ['assigned_at', 'ASC']],
      }),
      Role.findAll({ where: { company_id: company.id }, attributes: ['id', 'name', 'slug', 'is_system'], order: [['id', 'ASC']] }),
    ]);

    const managerIds = managers.map(m => m.employee_id);
    const empRoles = await EmployeeRole.findAll({
      where: { employee_id: managerIds, company_id: company.id },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'slug'] }],
    });
    const roleMap: Record<number, any> = {};
    for (const er of empRoles) roleMap[er.employee_id] = (er as any).role;

    // Mark which managers are company super admins
    const superAdminRole = roles.find(r => r.slug === 'super_admin');
    const superAdminCount = await countCompanySuperAdmins(company.id);

    sendResponse(res, {
      data: {
        ...company.toJSON(),
        employee_count: empCount,
        super_admin_count: superAdminCount,
        managers: managers.map(m => ({
          employee: (m as any).employee,
          role: roleMap[m.employee_id] || null,
          is_primary: m.is_primary,
          assigned_at: m.assigned_at,
          is_company_super_admin: roleMap[m.employee_id]?.slug === 'super_admin',
        })),
        roles,
      },
    });
  } catch (e) { next(e); }
}

// ─── Create company ───────────────────────────────────────────────────────────
// BOTH the creator AND the first employee get the super_admin role

async function createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name, city, state, industry, email, theme_color, employee_code_skip, employee_code_end, employee_code_start,
      employees = [],
    } = req.body;
    const startCode = employee_code_start
      ? Number(employee_code_start)
      : null;

    const endCode = employee_code_end
      ? Number(employee_code_end)
      : null;

    let skipCodes: number[] = [];

    try {
      skipCodes = employee_code_skip
        ? JSON.parse(employee_code_skip)
        : [];
    } catch {
      sendError(res, 'Invalid employee_code_skip format', 400);
      return;
    }

    if (!Array.isArray(skipCodes)) {
      sendError(res, 'employee_code_skip must be an array', 400);
      return;
    }

    if (
      startCode !== null &&
      endCode !== null &&
      startCode >= endCode
    ) {
      sendError(
        res,
        'Employee code end must be greater than start',
        400
      );
      return;
    }

    for (const code of skipCodes) {
      if (!Number.isInteger(code)) {
        sendError(
          res,
          `Invalid reserved employee code: ${code}`,
          400
        );
        return;
      }

      if (
        startCode !== null &&
        endCode !== null &&
        (code < startCode || code > endCode)
      ) {
        sendError(
          res,
          `Reserved code ${code} is outside company range`,
          400
        );
        return;
      }
    }
    const slug = (req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 100);
    const exists = await Company.findOne({ where: { slug }, paranoid: false });
    if (exists) { sendError(res, 'A company with this slug already exists', 409); return; }

    const t = await sequelize.transaction();
    try {
      // 1. Create company
      const company = await Company.create({
        name,
        slug,
        theme_color,
        city: city || null,
        state: state || null,
        industry: industry || null,
        email: email || null,

        employee_code_start: startCode
          ? String(startCode)
          : null,

        employee_code_end: endCode
          ? String(endCode)
          : null,

        employee_code_skip: JSON.stringify(skipCodes),

        is_active: true,
        onboarding_step: 0,
        created_by: req.user!.employeeId,
      }, { transaction: t });

      // 2. Seed system roles from global templates (unchanged)
      const templates = await RoleTemplate.findAll();
      const rolesCreated: any[] = [];
      for (const tmpl of templates) {
        const [role] = await Role.findOrCreate({
          where: { company_id: company.id, slug: tmpl.slug },
          defaults: { company_id: company.id, name: tmpl.name, slug: tmpl.slug, is_system: true, template_id: tmpl.id },
          transaction: t,
        } as any);
        rolesCreated.push(role);
        const tPerms = await RoleTemplatePermission.findAll({ where: { template_id: tmpl.id } });
        for (const tp of tPerms) {
          await RoleModulePermission.findOrCreate({
            where: { role_id: role.id, module: tp.module },
            defaults: { role_id: role.id, module: tp.module, can_view: tp.can_view, can_edit: tp.can_edit, can_delete: tp.can_delete },
            transaction: t,
          } as any);
        }
      }

      const saRole = rolesCreated.find(r => r.slug === 'super_admin')!;

      // 3. Seed departments (unchanged)
      await Department.bulkCreate([
        { company_id: company.id, name: 'Human Resources', },
        { company_id: company.id, name: 'Engineering', },
        { company_id: company.id, name: 'Finance', },
        { company_id: company.id, name: 'Operations', },
      ], { transaction: t, ignoreDuplicates: true });

      // Step 3.5: Seed permission groups with default permissions
      const allPerms = await Permission.findAll({ attributes: ['id', 'slug'], transaction: t });
      const permMap = new Map(allPerms.map((p: any) => [p.slug, p.id]));

      for (const tpl of SYSTEM_GROUPS) {
        const [group] = await PermissionGroup.findOrCreate({
          where: { company_id: company.id, slug: tpl.slug },
          defaults: {
            company_id: company.id, name: tpl.name, slug: tpl.slug,
            description: tpl.description, color: tpl.color,
            is_system: tpl.is_system, is_active: true
          },
          transaction: t,
        } as any);

        const permIds = (tpl.slug_grants as readonly string[])
          .filter(s => s !== '*')
          .map(s => permMap.get(s))
          .filter(Boolean) as number[];

        if (permIds.length) {
          await GroupPermission.bulkCreate(
            permIds.map(pid => ({ group_id: group.id, company_id: company.id, permission_id: pid })),
            { ignoreDuplicates: true, transaction: t },
          );
        }
      }

      await CompanyModule.bulkCreate(
        DEFAULT_MODULES.map(m => ({ ...m, company_id: company.id })),
        { ignoreDuplicates: true, transaction: t },
      );      

      // 4. Creator gets super_admin + CompanyManager (unchanged)
      await EmployeeRole.findOrCreate({
        where: { employee_id: req.user!.employeeId, role_id: saRole.id, company_id: company.id },
        defaults: { employee_id: req.user!.employeeId, role_id: saRole.id, company_id: company.id, assigned_by: req.user!.employeeId },
        transaction: t,
      } as any);

      await CompanyManager.findOrCreate({
        where: { company_id: company.id, employee_id: req.user!.employeeId },
        defaults: { company_id: company.id, employee_id: req.user!.employeeId, is_primary: true, assigned_by: req.user!.employeeId },
        transaction: t,
      } as any);

      // 5. Assign each selected existing employee their role + CompanyManager access
      //    Same role can be assigned to multiple employees (e.g. 2 HR Managers)
      //    UNIQUE on (employee_id, role_id, company_id) — so same employee can't
      //    get the same role twice but two different employees can share a role
      const assignedEmployees: any[] = [];
      for (const entry of (employees as { employee_id: number; role_slug: string }[])) {
        if (entry.employee_id === req.user!.employeeId) continue; // creator already handled

        const emp = await Employee.findOne({ where: { id: entry.employee_id, status: 'Active' } });
        if (!emp) continue; // skip invalid

        const role = rolesCreated.find(r => r.slug === entry.role_slug)
          || rolesCreated.find(r => r.slug === 'hr_manager');
        if (!role) continue;

        await EmployeeRole.findOrCreate({
          where: { employee_id: emp.id, role_id: role.id, company_id: company.id },
          defaults: { employee_id: emp.id, role_id: role.id, company_id: company.id, assigned_by: req.user!.employeeId },
          transaction: t,
        } as any);

        await CompanyManager.findOrCreate({
          where: { company_id: company.id, employee_id: emp.id },
          defaults: { company_id: company.id, employee_id: emp.id, is_primary: false, assigned_by: req.user!.employeeId },
          transaction: t,
        } as any);

        assignedEmployees.push({ id: emp.id, name: `${emp.first_name} ${emp.last_name}`, role: role.slug });
      }

      await company.update({ onboarding_step: 5 }, { transaction: t });
      await t.commit();

      await logActivity({
        companyId: req.user!.companyId, employeeId: req.user!.employeeId,
        action: 'COMPANY_CREATED', module: 'companies', entityId: company.id,
        newValues: { name, slug, assigned_employees: assignedEmployees.length },
      });

      sendResponse(res, {
        statusCode: 201,
        message: `${name} created successfully.`,
        data: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          assigned_employees: assignedEmployees,
        },
      });
    } catch (e2) { await t.rollback(); throw e2; }
  } catch (e) { next(e); }
}

// ─── Assign / update manager ──────────────────────────────────────────────────

async function assignManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const { employee_id, role_slug, is_primary = false, notes } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) { sendError(res, 'Company not found', 404); return; }

    const employee = await Employee.findOne({ where: { id: employee_id, status: 'Active' } });
    if (!employee) { sendError(res, 'Employee not found or inactive', 404); return; }

    const role = await Role.findOne({ where: { company_id: companyId, slug: role_slug } });
    if (!role) { sendError(res, `Role '${role_slug}' not found in this company`, 404); return; }

    // If DEMOTING from super_admin → validate min 1 remains
    if (role_slug !== 'super_admin') {
      const currentRole = await EmployeeRole.findOne({
        where: { employee_id, company_id: companyId },
        include: [{ model: Role, as: 'role', where: { slug: 'super_admin' }, required: false }],
      });
      const wasSupeAdmin = !!(currentRole as any)?.role;
      if (wasSupeAdmin) {
        const saCount = await countCompanySuperAdmins(companyId);
        if (saCount <= 1) {
          sendError(res, 'Cannot demote: this company must always have at least 1 super admin', 400);
          return;
        }
      }
    }

    const t = await sequelize.transaction();
    try {
      // Update role in employee_roles
      const [empRole, created] = await EmployeeRole.findOrCreate({
        where: { employee_id, company_id: companyId },
        defaults: { employee_id, role_id: role.id, company_id: companyId, assigned_by: req.user!.employeeId },
        transaction: t,
      } as any);
      if (!created) await (empRole as any).update({ role_id: role.id }, { transaction: t });

      // If setting as primary
      if (is_primary) {
        await CompanyManager.update({ is_primary: false }, { where: { company_id: companyId, is_primary: true }, transaction: t });
      }

      const [manager, cmCreated] = await CompanyManager.findOrCreate({
        where: { company_id: companyId, employee_id },
        defaults: { company_id: companyId, employee_id, is_primary, assigned_by: req.user!.employeeId, notes: notes || null },
        transaction: t,
      });
      if (!cmCreated) await manager.update({ is_primary, notes: notes || null }, { transaction: t });

      await t.commit();

      const newSaCount = await countCompanySuperAdmins(companyId);
      sendResponse(res, {
        statusCode: cmCreated ? 201 : 200,
        message: `${employee.first_name} ${employee.last_name} assigned as ${role.name}`,
        data: {
          employee_id,
          role: { id: role.id, name: role.name, slug: role.slug },
          is_primary,
          company_super_admin_count: newSaCount,
        },
      });
    } catch (e2) { await t.rollback(); throw e2; }
  } catch (e) { next(e); }
}

// ─── Remove manager ───────────────────────────────────────────────────────────

async function removeManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const employeeId = +req.params.employeeId;

    // Check min 1 manager
    const totalManagers = await CompanyManager.count({ where: { company_id: companyId } });
    if (totalManagers <= 1) { sendError(res, 'Cannot remove: company must have at least 1 manager', 400); return; }

    // Check min 1 super admin
    const isSA = await isCompanySuperAdmin(employeeId, companyId);
    const saCount = await countCompanySuperAdmins(companyId);
    if (isSA && saCount <= 1) {
      sendError(res, 'Cannot remove: this is the last super admin of this company. Assign another super admin first.', 400);
      return;
    }

    // Remove company access + role
    await CompanyManager.destroy({ where: { company_id: companyId, employee_id: employeeId } });
    await EmployeeRole.destroy({ where: { company_id: companyId, employee_id: employeeId } });

    sendResponse(res, { data: { removed: true, remaining_super_admins: isSA ? saCount - 1 : saCount } });
  } catch (e) { next(e); }
}

// ─── Promote to company super admin ──────────────────────────────────────────

async function promoteSuperAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const employeeId = +req.params.employeeId;

    const employee = await Employee.findOne({ where: { id: employeeId, status: 'Active' } });
    if (!employee) { sendError(res, 'Employee not found', 404); return; }

    const saRole = await getSuperAdminRole(companyId);
    if (!saRole) { sendError(res, 'Super admin role not found in this company', 404); return; }

    // Check not already super admin
    const already = await isCompanySuperAdmin(employeeId, companyId);
    if (already) { sendError(res, 'Employee is already a super admin of this company', 409); return; }

    const t = await sequelize.transaction();
    try {
      // Update their role to super_admin
      const [empRole, created] = await EmployeeRole.findOrCreate({
        where: { employee_id: employeeId, company_id: companyId },
        defaults: { employee_id: employeeId, role_id: saRole.id, company_id: companyId, assigned_by: req.user!.employeeId },
        transaction: t,
      } as any);
      if (!created) await (empRole as any).update({ role_id: saRole.id }, { transaction: t });

      // Add to company managers if not already
      await CompanyManager.findOrCreate({
        where: { company_id: companyId, employee_id: employeeId },
        defaults: { company_id: companyId, employee_id: employeeId, is_primary: false, assigned_by: req.user!.employeeId },
        transaction: t,
      } as any);

      await t.commit();

      const newCount = await countCompanySuperAdmins(companyId);
      await logActivity({ companyId, employeeId: req.user!.employeeId, action: 'COMPANY_SUPER_ADMIN_PROMOTED', module: 'companies', entityId: employeeId, newValues: { company_id: companyId, promoted: employee.email } });

      sendResponse(res, {
        message: `${employee.first_name} ${employee.last_name} is now a super admin of this company`,
        data: { employee_id: employeeId, company_super_admin_count: newCount },
      });
    } catch (e2) { await t.rollback(); throw e2; }
  } catch (e) { next(e); }
}

// ─── Demote from company super admin ─────────────────────────────────────────

async function demoteSuperAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const employeeId = +req.params.employeeId;

    if (employeeId === req.user!.employeeId) {
      sendError(res, 'You cannot demote yourself', 400); return;
    }

    const saCount = await countCompanySuperAdmins(companyId);
    if (saCount <= 1) {
      sendError(res, 'Cannot demote: this company must always have at least 1 super admin. Promote another employee first.', 400);
      return;
    }

    // Find their current role and set to hr_manager
    const hrRole = await Role.findOne({ where: { company_id: companyId, slug: 'hr_manager' } });
    if (!hrRole) { sendError(res, 'hr_manager role not found', 404); return; }

    const empRole = await EmployeeRole.findOne({ where: { employee_id: employeeId, company_id: companyId } });
    if (!empRole) { sendError(res, 'Employee has no role in this company', 404); return; }

    await (empRole as any).update({ role_id: hrRole.id });

    await logActivity({ companyId, employeeId: req.user!.employeeId, action: 'COMPANY_SUPER_ADMIN_DEMOTED', module: 'companies', entityId: employeeId });

    sendResponse(res, {
      message: 'Super admin status revoked. Employee role changed to HR Manager.',
      data: { employee_id: employeeId, new_role: 'hr_manager', remaining_super_admins: saCount - 1 },
    });
  } catch (e) { next(e); }
}

// ─── List company super admins ────────────────────────────────────────────────

async function listSuperAdmins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const saRole = await getSuperAdminRole(companyId);
    if (!saRole) { sendResponse(res, { data: [] }); return; }

    const empRoles = await EmployeeRole.findAll({
      where: { role_id: saRole.id, company_id: companyId },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email', 'employee_code', 'avatar_url', 'is_super_admin'], where: { portal_access: true, deleted_at: null } }],
      order: [['assigned_at', 'ASC']],
    });

    // Check which are also company managers (is_primary)
    const managerMap: Record<number, any> = {};
    const managers = await CompanyManager.findAll({ where: { company_id: companyId } });
    for (const m of managers) managerMap[m.employee_id] = m;

    sendResponse(res, {
      data: empRoles.map(er => {
        const emp = (er as any).employee;
        return {
          id: emp.id,
          email: emp.email,
          full_name: `${emp.first_name} ${emp.last_name}`,
          employee_code: emp.employee_code,
          avatar_url: emp.avatar_url,
          is_platform_sa: emp.is_super_admin,
          is_primary: managerMap[emp.id]?.is_primary ?? false,
          assigned_at: er.assigned_at,
          is_current_user: emp.id === req.user!.employeeId,
        };
      }),
    });
  } catch (e) { next(e); }
}

// ─── Eligible managers ────────────────────────────────────────────────────────

async function getEligibleManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const existing = await CompanyManager.findAll({ where: { company_id: companyId }, attributes: ['employee_id'] });
    const excludeIds = existing.map(e => e.employee_id);

    const eligible = await Employee.findAll({
      where: {
        // Any active employee with portal access can be assigned — no permission filter
        status: 'Active',
        portal_access: true,
        ...(excludeIds.length ? { id: { [Op.notIn]: excludeIds } } : {}),
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'employee_code', 'is_super_admin'],
      order: [['first_name', 'ASC']], limit: 500,
    });

    const companyRoles = await Role.findAll({
      where: { company_id: companyId },
      attributes: ['id', 'name', 'slug'],
      order: [['id', 'ASC']],
    });

    sendResponse(res, {
      data: {
        employees: eligible.map(e => ({ id: e.id, full_name: `${e.first_name} ${e.last_name}`, email: e.email, employee_code: e.employee_code, is_super_admin: e.is_super_admin })),
        roles: companyRoles,
      },
    });
  } catch (e) { next(e); }
}

async function getGlobalEligibleManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eligible = await Employee.findAll({
      where: { status: 'Active', portal_access: true },
      attributes: ['id', 'first_name', 'last_name', 'email', 'employee_code', 'is_super_admin'],
      order: [['first_name', 'ASC']], limit: 500,
    });
    sendResponse(res, { data: eligible.map(e => ({ id: e.id, full_name: `${e.first_name} ${e.last_name}`, email: e.email, employee_code: e.employee_code, is_super_admin: e.is_super_admin })) });
  } catch (e) { next(e); }
}

// ─── Update + suspend + activate ─────────────────────────────────────────────

async function updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await Company.findByPk(+req.params.id);
    if (!company) { sendError(res, 'Not found', 404); return; }
    const allowed = ['name', 'city', 'state', 'country', 'industry', 'email', 'phone', 'website', 'logo_url', 'gstin', 'pan', 'timezone', 'currency', 'notes', 'theme_color'];
    const updates: any = {};
    for (const k of allowed) { if (req.body[k] !== undefined) updates[k] = req.body[k]; }
    await company.update(updates);
    sendResponse(res, { data: company, message: 'Company updated' });
  } catch (e) { next(e); }
}

async function suspendCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await Company.findByPk(+req.params.id);
    if (!company) { sendError(res, 'Not found', 404); return; }
    await company.update({ is_active: false });
    sendResponse(res, { data: { suspended: true } });
  } catch (e) { next(e); }
}

async function activateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await Company.findByPk(+req.params.id, { paranoid: false });
    if (!company) { sendError(res, 'Not found', 404); return; }
    await company.update({ is_active: true, deleted_at: null });
    sendResponse(res, { data: { activated: true } });
  } catch (e) { next(e); }
}

async function listManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = +req.params.id;
    const managers = await CompanyManager.findAll({
      where: { company_id: companyId },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url', 'employee_code', 'is_super_admin'] }],
      order: [['is_primary', 'DESC'], ['assigned_at', 'ASC']],
    });
    const empIds = managers.map(m => m.employee_id);
    const empRoles = await EmployeeRole.findAll({ where: { employee_id: empIds, company_id: companyId }, include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'slug'] }] });
    const roleMap: Record<number, any> = {};
    for (const er of empRoles) roleMap[er.employee_id] = (er as any).role;

    sendResponse(res, {
      data: managers.map(m => ({
        employee: (m as any).employee,
        role: roleMap[m.employee_id] || null,
        is_primary: m.is_primary,
        assigned_at: m.assigned_at,
        is_company_super_admin: roleMap[m.employee_id]?.slug === 'super_admin',
      })),
    });
  } catch (e) { next(e); }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const companyRouter = Router();
companyRouter.use(authenticate);
companyRouter.use(resolveCompanyContext)

companyRouter.get('/platform-stats', requireSuperAdmin => authenticate, getPlatformStats);
companyRouter.get('/eligible-managers', authorize('companies:create'), getGlobalEligibleManagers);
companyRouter.get('/mine', authorize('companies:view'), getMyCompanies);
companyRouter.get('/', authorize('companies:view'), listCompanies);
companyRouter.post('/', authorize('companies:create'), [body('name').trim().notEmpty(), body('employees').optional().isArray()], validate, createCompany);
companyRouter.get('/:id', authorize('companies:view'), [param('id').isInt()], validate, getCompany);
companyRouter.put('/:id', [param('id').isInt()], validate, requireCompanyAccess, updateCompany);
companyRouter.post('/:id/suspend', [param('id').isInt()], validate, requireCompanyAccess, suspendCompany);
companyRouter.post('/:id/activate', [param('id').isInt()], validate, requireCompanyAccess, activateCompany);

// Managers
companyRouter.get('/:id/managers', [param('id').isInt()], validate, requireCompanyAccess, listManagers);
companyRouter.get('/:id/eligible-managers', [param('id').isInt()], validate, requireCompanyAccess, getEligibleManagers);
companyRouter.post('/:id/managers', [param('id').isInt(), body('employee_id').isInt(), body('role_slug').notEmpty()], validate, requireCompanyAccess, assignManager);
companyRouter.put('/:id/managers/:employeeId', [param('id').isInt(), param('employeeId').isInt()], validate, requireCompanyAccess, assignManager);
companyRouter.delete('/:id/managers/:employeeId', [param('id').isInt(), param('employeeId').isInt()], validate, requireCompanyAccess, removeManager);

// Super admin management
companyRouter.get('/:id/super-admins', [param('id').isInt()], validate, requireCompanyAccess, listSuperAdmins);
companyRouter.post('/:id/super-admins/:employeeId/promote', [param('id').isInt(), param('employeeId').isInt()], validate, requireCompanyAccess, promoteSuperAdmin);
companyRouter.post('/:id/super-admins/:employeeId/demote', [param('id').isInt(), param('employeeId').isInt()], validate, requireCompanyAccess, demoteSuperAdmin);

// ─── Company settings + theme ─────────────────────────────────────────────────
// FIXED: Added requireCompanyAccess middleware to authorize access
companyRouter.get('/:id/settings',
  [param('id').isInt()],
  validate,
  requireCompanyAccess,  // ← ADDED: Only platform super admin OR company super admin can read settings
  getSettings
);

companyRouter.put('/:id/settings',
  [param('id').isInt()],
  validate,
  requireCompanyAccess,  // ← ADDED: Only platform super admin OR company super admin can update settings
  updateSettings
);

companyRouter.put('/:id/theme',
  [param('id').isInt(), body('theme_color').isString()],
  validate,
  requireCompanyAccess,  // ← ADDED: Only platform super admin OR company super admin can update theme
  updateTheme
);

// Export helper for middleware use
export { requireCompanyAccess };