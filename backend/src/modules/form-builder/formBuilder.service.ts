import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import {
  HrModule, ModuleCompany, FormDefinition, DynamicField, FieldOption,
  FieldPermissionV2, FIELD_TYPES,
} from '../../database/models/FormBuilder';
// import { Role }            from '../../database/models/RoleModels';
import type { DynamicSource } from '../../database/models/FormBuilder';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';
import { PermissionGroup, UserGroup, GroupPermission } from '../../database/models/PermissionGroups';
import { refreshEmployeePermission } from '../../utils/refreshEmployeePermission';
import { CompanyModule, Employee, CompanyManager } from '../../database/models';
import { Permission } from '../../database/models/RoleModels';
import { getEmployeeFieldOverrides, resolvePermissionsForEmployee } from '../permission-groups/permissionGroupOverrides';

// ─── Default system modules seeded on company creation ────────────────────────
export const SYSTEM_MODULES = [
  { name: 'Employee', slug: 'employee', icon: '👤', description: 'Employee records and profile management' },
  { name: 'Candidate', slug: 'candidate', icon: '📋', description: 'ATS candidate management' },
  { name: 'Attendance', slug: 'attendance', icon: '📅', description: 'Daily attendance tracking' },
  { name: 'Leave', slug: 'leave', icon: '🏖', description: 'Leave applications and balances' },
  { name: 'Payroll', slug: 'payroll', icon: '💰', description: 'Payroll processing and payslips' },
  { name: 'Recruitment', slug: 'recruitment', icon: '🎯', description: 'End-to-end recruitment workflow' },
  { name: 'Performance', slug: 'performance', icon: '📈', description: 'KRA, KPI and appraisals' },
  { name: 'Assets', slug: 'assets', icon: '🖥', description: 'Company asset tracking' },
];

export const HR_MODULE_TO_PERM_KEY: Record<string, string> = {
  employee: 'employees',
  leave: 'leaves',
  candidate: 'recruitment',
  attendance: 'attendance'
};
export const permKeyForModule = (slug: string) => HR_MODULE_TO_PERM_KEY[slug] ?? slug;

export class FormBuilderService {

  async resolveGroupCompanyScope(
    groupId: number,
    actorEmployeeId: number,
    isSuperAdmin = false,
  ): Promise<number[]> {
    const ugs = await UserGroup.findAll({
      where: { group_id: groupId },
      attributes: ['company_id'],
    });
    const memberCompanies = [...new Set(ugs.map(u => u.company_id))];
    const manageable = await this.manageableCompanyIds(actorEmployeeId, isSuperAdmin);

    // A member row can point at a company the acting admin no longer manages
    // (e.g. the company was later deleted/deactivated, leaving an orphaned
    // user_groups row) — never hand back a company outside the admin's own
    // authority, or a later company-scoped save (module or field) will be
    // rejected for a company nobody asked to touch.
    const inScope = memberCompanies.filter(id => manageable.includes(id));
    if (inScope.length) return inScope.sort((a, b) => a - b);

    return manageable;
  }

  async manageableCompanyIds(
    actorEmployeeId: number,
    isSuperAdmin = false,
  ): Promise<number[]> {
    if (isSuperAdmin) {
      const { Company } = await import('../../database/models/Company');
      const rows = await Company.findAll({ where: { is_active: true }, attributes: ['id'] });
      return rows.map((c: any) => c.id).sort((a: number, b: number) => a - b);
    }
    // Home company (Employee.company_id) plus every company this employee
    // has been delegated as a manager for (CompanyManager) — matches the
    // scope resolution already used for the same concept in
    // permissionGroups.controller.ts's addGroupMember/manageableCompanyIds.
    const [employees, assignments] = await Promise.all([
      Employee.findAll({ where: { id: actorEmployeeId }, attributes: ['company_id'] }),
      CompanyManager.findAll({ where: { employee_id: actorEmployeeId }, attributes: ['company_id'] }),
    ]);
    const ids = new Set<number>([
      ...employees.map((e: any) => e.company_id),
      ...assignments.map((a: any) => a.company_id),
    ]);
    return [...ids].sort((a, b) => a - b);
  }

  async assertCompaniesManaged(
    companyIds: number[],
    actorEmployeeId: number,
    isSuperAdmin = false,
  ): Promise<void> {
    const allowed = new Set(await this.manageableCompanyIds(actorEmployeeId, isSuperAdmin));
    const bad = companyIds.filter(id => !allowed.has(id));
    if (bad.length) {
      throw new AppError(`Not permitted for company_id(s): ${bad.join(', ')}`, 403);
    }
  }

  // ════════════════════════ MODULES (catalog) ════════════════════════

  // The module CATALOG — every module that exists at all, regardless of
  // which companies have it enabled. Used for the "select modules" UI and
  // for super-admin catalog management.
  async listAllModules() {
    const mods = await HrModule.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC']] });
    return mods.map(m => ({ ...m.toJSON(), permission_key: permKeyForModule(m.slug) }));
  }

  // Modules a SPECIFIC company currently has enabled — this is what drives
  // the company's sidebar/nav and what resolveFormPermissions gates on.
  async listModules(companyId: number) {
    const links = await ModuleCompany.findAll({ where: { company_id: companyId }, attributes: ['module_id'] });
    const moduleIds = links.map(l => l.module_id);
    if (!moduleIds.length) return [];

    const mods = await HrModule.findAll({
      where: { id: moduleIds, is_active: true },
      order: [['sort_order', 'ASC']],
    });
    return mods.map(m => ({ ...m.toJSON(), permission_key: permKeyForModule(m.slug) }));
  }

  async getCompanyModuleIds(companyId: number): Promise<number[]> {
    const links = await ModuleCompany.findAll({ where: { company_id: companyId }, attributes: ['module_id'] });
    return links.map(l => l.module_id);
  }

  // Creates a module in the CATALOG — a single global row, e.g. "Payroll".
  // Does not assign it to any company by itself; use setCompanyModules for
  // that (mirrors how a company picks modules independently of catalog
  // authoring, per the "Company A selects 4, Company B selects 2" flow).
  async createModule(dto: {
    name: string; slug?: string; icon?: string; description?: string; sort_order?: number;
  }, createdBy?: number) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const exists = await HrModule.findOne({ where: { slug } });
    if (exists) throw new AppError('Module with this slug already exists', 409);

    const mod = await HrModule.create({
      name: dto.name, slug, icon: dto.icon || null, description: dto.description || null,
      sort_order: dto.sort_order || 0, is_active: true, is_system: false,
    });
    await logActivity({ companyId: 0, employeeId: createdBy, action: 'MODULE_CREATED', module: 'settings', entityId: mod.id, newValues: { name: mod.name, slug } });
    return mod;
  }

  async updateModule(id: number, dto: {
    name?: string; icon?: string; description?: string; sort_order?: number; is_active?: boolean;
  }, updatedBy?: number) {
    const mod = await HrModule.findOne({ where: { id } });
    if (!mod) throw new AppError('Module not found', 404);
    await mod.update(dto as any);
    await logActivity({ companyId: 0, employeeId: updatedBy, action: 'MODULE_UPDATED', module: 'settings', entityId: id });
    return mod;
  }

  // Deletes a module from the CATALOG entirely — removes it (and its forms,
  // fields, and field permissions) for EVERY company that had it enabled.
  // This has a much larger blast radius than before; the frontend should
  // confirm this explicitly (e.g. show "N companies currently use this").
  async deleteModule(id: number, deletedBy?: number) {
    const mod = await HrModule.findOne({ where: { id } });
    if (!mod) throw new AppError('Module not found', 404);
    if (mod.is_system) throw new AppError('System modules cannot be deleted', 403);

    const forms = await FormDefinition.findAll({ where: { module_id: id } });
    for (const f of forms) {
      const fields = await DynamicField.findAll({ where: { form_id: f.id }, attributes: ['id'] });
      if (fields.length) {
        await FieldPermissionV2.destroy({ where: { field_id: fields.map(fl => fl.id) } });
      }
      await DynamicField.destroy({ where: { form_id: f.id } });
    }
    await FormDefinition.destroy({ where: { module_id: id } });
    await ModuleCompany.destroy({ where: { module_id: id } });
    await mod.destroy();

    await logActivity({ companyId: 0, employeeId: deletedBy, action: 'MODULE_DELETED', module: 'settings', entityId: id });
    return { deleted: true };
  }

  // The "Company A selects Employee, Payroll, Sales, Assets" endpoint.
  // Diffs the requested module_ids against what the company currently has
  // and adds/removes ModuleCompany links accordingly. Does NOT touch forms,
  // fields, or the catalog — those are shared and untouched by enable/disable.
  // Existing FieldPermissionV2 rows for a removed module are left in place
  // (harmless — resolveFormPermissions denies access once the module link is
  // gone) so re-enabling the module later restores prior grants automatically.
  async setCompanyModules(companyId: number, moduleIds: number[], updatedBy?: number) {
    const modules = await HrModule.findAll({ where: { id: moduleIds, is_active: true }, attributes: ['id'] });
    if (modules.length !== new Set(moduleIds).size) {
      throw new AppError('One or more selected modules were not found', 404);
    }

    const existing = await ModuleCompany.findAll({ where: { company_id: companyId } });
    const existingIds = new Set(existing.map(e => e.module_id));
    const wantedIds = new Set(moduleIds);

    const toAdd = moduleIds.filter(id => !existingIds.has(id));
    const toRemove = existing.filter(e => !wantedIds.has(e.module_id));

    if (toAdd.length) {
      await ModuleCompany.bulkCreate(toAdd.map(module_id => ({ module_id, company_id: companyId })));
    }
    if (toRemove.length) {
      await ModuleCompany.destroy({ where: { id: toRemove.map(r => r.id) } });
    }

    if (toAdd.length || toRemove.length) {
      await logActivity({
        companyId, employeeId: updatedBy, action: 'COMPANY_MODULES_UPDATED', module: 'settings',
        entityId: companyId, newValues: { added: toAdd, removed: toRemove.map(r => r.module_id) },
      });
    }
    return { added: toAdd, removed: toRemove.map(r => r.module_id) };
  }

  // ════════════════════════ FORMS ════════════════════════
  // Forms belong to the module (shared catalog data), not to a company.

  async listForms(moduleId: number) {
    return FormDefinition.findAll({ where: { module_id: moduleId }, order: [['sort_order', 'ASC']] });
  }

  async getFormWithFields(formId: number) {
    const form = await FormDefinition.findOne({
      where: { id: formId },
      include: [{ model: DynamicField, as: 'fields', where: { is_active: true }, required: false, order: [['sort_order', 'ASC']] }],
    });
    if (!form) throw new AppError('Form not found', 404);
    return form;
  }

  async createForm(moduleId: number, dto: {
    name: string; slug?: string; description?: string; sort_order?: number;
  }, createdBy?: number) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const exists = await FormDefinition.findOne({ where: { module_id: moduleId, slug } });
    if (exists) throw new AppError('Form with this slug already exists in this module', 409);

    const form = await FormDefinition.create({ company_id: null, module_id: moduleId, name: dto.name, slug, description: dto.description || null, sort_order: dto.sort_order || 0, is_active: true, is_system: false, created_by: createdBy || null });
    await logActivity({ companyId: 0, employeeId: createdBy, action: 'FORM_CREATED', module: 'settings', entityId: form.id, newValues: { name: form.name } });
    return form;
  }

  async updateForm(formId: number, dto: {
    name?: string; description?: string; sort_order?: number; is_active?: boolean;
  }, updatedBy?: number) {
    const form = await FormDefinition.findOne({ where: { id: formId } });
    if (!form) throw new AppError('Form not found', 404);
    await form.update({ ...dto, updated_by: updatedBy || null } as any);
    return form;
  }

  async deleteForm(formId: number) {
    const form = await FormDefinition.findOne({ where: { id: formId } });
    if (!form) throw new AppError('Form not found', 404);
    if (form.is_system) throw new AppError('System forms cannot be deleted', 403);
    const fields = await DynamicField.findAll({ where: { form_id: formId }, attributes: ['id'] });
    if (fields.length) await FieldPermissionV2.destroy({ where: { field_id: fields.map(f => f.id) } });
    await DynamicField.destroy({ where: { form_id: formId } });
    await form.destroy();
    return { deleted: true };
  }

  // ════════════════════════ FIELDS ════════════════════════
  // Fields belong to the form (shared catalog data), not to a company.

  async createField(formId: number, dto: {
    field_type: string; label: string; field_key?: string;
    placeholder?: string; help_text?: string; section?: string;
    is_required?: boolean; is_readonly?: boolean; is_hidden?: boolean;
    is_unique?: boolean; default_value?: string;
    min_length?: number; max_length?: number;
    min_value?: number; max_value?: number;
    regex_pattern?: string; sort_order?: number;
    options?: { label: string; value: string; is_default?: boolean }[];
  }, createdBy?: number) {
    const form = await FormDefinition.findOne({ where: { id: formId } });
    if (!form) throw new AppError('Form not found', 404);
    if (!FIELD_TYPES.includes(dto.field_type as any)) throw new AppError('Invalid field type', 400);

    const field_key = dto.field_key || dto.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const duplicate = await DynamicField.findOne({ where: { form_id: formId, field_key } });
    if (duplicate) throw new AppError('A field with this key already exists in this form', 409);

    const t: Transaction = await sequelize.transaction();
    try {
      const field = await DynamicField.create({
        company_id: null, form_id: formId,
        field_type: dto.field_type as any, label: dto.label, field_key,
        placeholder: dto.placeholder || null, help_text: dto.help_text || null,
        is_required: dto.is_required || false, is_readonly: dto.is_readonly || false,
        is_hidden: dto.is_hidden || false, is_unique: dto.is_unique || false, is_active: true,
        default_value: dto.default_value || null,
        sort_order: dto.sort_order || 0, section: dto.section || null,
        min_length: dto.min_length || null, max_length: dto.max_length || null,
        min_value: dto.min_value || null, max_value: dto.max_value || null,
        regex_pattern: dto.regex_pattern || null,
        created_by: createdBy || null,
      }, { transaction: t });

      if (dto.options?.length && ['select', 'multi_select', 'radio'].includes(dto.field_type)) {
        await FieldOption.bulkCreate(dto.options.map((o, i) => ({
          field_id: field.id, label: o.label, value: o.value,
          sort_order: i, is_active: true, is_default: o.is_default || false,
        })), { transaction: t });
      }

      await t.commit();
      await logActivity({ companyId: 0, employeeId: createdBy, action: 'FIELD_CREATED', module: 'settings', entityId: field.id, newValues: { label: field.label, field_key } });
      return this.getFieldById(field.id);
    } catch (e) { await t.rollback(); throw e; }
  }

  async updateField(fieldId: number, dto: any, updatedBy?: number) {
    const field = await DynamicField.findOne({ where: { id: fieldId } });
    if (!field) throw new AppError('Field not found', 404);

    const { options, ...rest } = dto;
    await field.update({ ...rest, updated_by: updatedBy || null });

    if (options && Array.isArray(options)) {
      await FieldOption.destroy({ where: { field_id: fieldId } });
      await FieldOption.bulkCreate(options.map((o: any, i: number) => ({
        field_id: fieldId, label: o.label, value: o.value,
        sort_order: i, is_active: true, is_default: o.is_default || false,
      })));
    }

    await logActivity({ companyId: 0, employeeId: updatedBy, action: 'FIELD_UPDATED', module: 'settings', entityId: fieldId });
    return this.getFieldById(fieldId);
  }

  async deleteField(fieldId: number) {
    const field = await DynamicField.findOne({ where: { id: fieldId } });
    if (!field) throw new AppError('Field not found', 404);
    await FieldOption.destroy({ where: { field_id: fieldId } });
    await FieldPermissionV2.destroy({ where: { field_id: fieldId } });
    await field.destroy();
    return { deleted: true };
  }

  async getFieldById(fieldId: number) {
    const field = await DynamicField.findOne({
      where: { id: fieldId },
      include: [{ model: FieldOption, as: 'options', required: false, order: [['sort_order', 'ASC']] }],
    });
    if (!field) throw new AppError('Field not found', 404);
    return field;
  }

  async reorderFields(formId: number, order: { id: number; sort_order: number }[]) {
    await Promise.all(order.map(({ id, sort_order }) =>
      DynamicField.update({ sort_order }, { where: { id, form_id: formId } })
    ));
    return { updated: true };
  }

  // ════════════════════════ FIELD PERMISSIONS ════════════════════════
  async getPermissionMatrix(companyId: number, formId: number) {
    const [form, groups] = await Promise.all([
      this.getFormWithFields(formId),
      PermissionGroup.findAll({ where: { }, order: [['is_system', 'DESC'], ['name', 'ASC']] }),
    ]);
    const fields = (form.fields || []) as DynamicField[];
    if (!fields.length) return { groups, fields, matrix: {} };

    const fieldIds = fields.map(f => f.id);
    const perms = await FieldPermissionV2.findAll({
      where: { company_id: companyId, field_id: fieldIds },
    });

    const matrix: Record<number, Record<number, {
      can_view: boolean; can_edit: boolean; can_copy: boolean;
      can_download: boolean; is_masked: boolean;
    }>> = {};

    for (const group of groups) {
      matrix[group.id] = {};
      for (const field of fields) {
        const existing = perms.find(p => p.group_id === group.id && p.field_id === field.id);
        matrix[group.id][field.id] = existing
          ? { can_view: existing.can_view, can_edit: existing.can_edit, can_copy: existing.can_copy, can_download: existing.can_download, is_masked: existing.is_masked }
          : { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
      }
    }
    return { groups, fields, matrix };
  }


  // async setFieldPermission(companyId: number, roleId: number, fieldId: number, dto: {
  //   can_view?: boolean; can_edit?: boolean; can_copy?: boolean;
  //   can_download?: boolean; is_masked?: boolean;
  // }, updatedBy?: number) {
  //   const [perm, created] = await FieldPermissionV2.findOrCreate({
  //     where: { role_id: roleId, field_id: fieldId },
  //     defaults: { role_id: roleId, field_id: fieldId, company_id: companyId, ...dto },
  //   });

  //   if (!created) await perm.update(dto as any);

  //   await logActivity({ companyId, employeeId: updatedBy, action: 'FIELD_PERMISSION_UPDATED', module: 'settings', entityId: fieldId, newValues: { roleId, ...dto } });
  //   return perm;
  // }

  async setFieldPermission(companyIds: number[], groupId: number, fieldId: number, dto: {
    can_view?: boolean; can_edit?: boolean; can_copy?: boolean;
    can_download?: boolean; is_masked?: boolean;
  }, updatedBy?: number) {
    if (!companyIds.length) throw new AppError('At least one company_id is required', 400);
    const results = [];
    for (const companyId of companyIds) {
      const [perm, created] = await FieldPermissionV2.findOrCreate({
        where: { company_id: companyId, group_id: groupId, field_id: fieldId },
        defaults: { company_id: companyId, group_id: groupId, field_id: fieldId, ...dto },
      });
      if (!created) await perm.update(dto as any);
      results.push(perm);
    }

    await logActivity({
      companyId: companyIds[0], employeeId: updatedBy,
      action: 'FIELD_PERMISSION_UPDATED', module: 'settings',
      entityId: fieldId, newValues: { groupId, companyIds, ...dto },
    });

    const memberships = await UserGroup.findAll({ where: { group_id: groupId, company_id: companyIds } });
    const byCompany = new Map<number, Set<number>>();
    for (const m of memberships) {
      if (!byCompany.has(m.company_id)) byCompany.set(m.company_id, new Set());
      byCompany.get(m.company_id)!.add(m.employee_id);
    }
    for (const [companyId, employeeIds] of byCompany) {
      for (const employeeId of employeeIds) {
        await refreshEmployeePermission(employeeId, [companyId]);
      }
    }
    return results;
  }

  // async bulkSetFieldPermissions(companyId: number, roleId: number, permissions: {
  //   field_id: number;
  //   can_view: boolean; can_edit: boolean; can_copy: boolean;
  //   can_download: boolean; is_masked: boolean;
  // }[], updatedBy?: number) {
  //   const t = await sequelize.transaction();
  //   try {
  //     for (const p of permissions) {
  //       await FieldPermissionV2.upsert({
  //         role_id: roleId, field_id: p.field_id, company_id: companyId,
  //         can_view: p.can_view, can_edit: p.can_edit, can_copy: p.can_copy,
  //         can_download: p.can_download, is_masked: p.is_masked,
  //       }, { transaction: t });
  //     }
  //     await t.commit();
  //     await logActivity({ companyId, employeeId: updatedBy, action: 'FIELD_PERMISSIONS_BULK_UPDATED', module: 'settings', newValues: { roleId, count: permissions.length } });
  //     return { updated: permissions.length };
  //   } catch(e) { await t.rollback(); throw e; }
  // }

  async bulkSetFieldPermissions(companyIds: number[], groupId: number, permissions: {
    field_id: number; can_view: boolean; can_edit: boolean; can_copy: boolean;
    can_download: boolean; is_masked: boolean;
  }[], updatedBy?: number) {
    if (!companyIds.length) throw new AppError('At least one company_id is required', 400);
    const t = await sequelize.transaction();
    try {
      for (const companyId of companyIds) {
        for (const p of permissions) {
          await FieldPermissionV2.upsert({
            company_id: companyId, group_id: groupId, field_id: p.field_id,
            can_view: p.can_view, can_edit: p.can_edit, can_copy: p.can_copy,
            can_download: p.can_download, is_masked: p.is_masked,
          }, { transaction: t });
        }
      }
      await t.commit();
      await logActivity({ companyId: companyIds[0], employeeId: updatedBy, action: 'FIELD_PERMISSIONS_BULK_UPDATED', module: 'settings', newValues: { groupId, companyIds, count: permissions.length } });
      const memberships = await UserGroup.findAll({ where: { group_id: groupId, company_id: companyIds } });
      const byCompany = new Map<number, Set<number>>();
      for (const m of memberships) {
        if (!byCompany.has(m.company_id)) byCompany.set(m.company_id, new Set());
        byCompany.get(m.company_id)!.add(m.employee_id);
      }
      for (const [companyId, employeeIds] of byCompany) {
        for (const employeeId of employeeIds) {
          await refreshEmployeePermission(employeeId, [companyId]);
        }
      }
      return { updated: permissions.length * companyIds.length };
    } catch (e) { await t.rollback(); throw e; }
  }

  async applyModuleDefaultsToFields(
    groupId: number,
    companyIds: number[],
    grantedSlugs: string[],
    updatedBy?: number,
    opts: { overwriteExisting?: boolean } = {},
  ) {
    if (!companyIds.length) return { created: 0, removed: 0 };
    const granted = new Set(grantedSlugs);
    let created = 0, removed = 0;

    for (const companyId of companyIds) {
      const moduleIds = await this.getCompanyModuleIds(companyId);
      if (!moduleIds.length) continue;
      const modules = await HrModule.findAll({ where: { id: moduleIds } });

      const forms = await FormDefinition.findAll({
        where: { module_id: moduleIds },
        attributes: ['id', 'module_id'],
      });
      if (!forms.length) continue;

      const fields = await DynamicField.findAll({
        where: { form_id: forms.map(f => f.id), is_active: true },
        attributes: ['id', 'form_id', 'is_hidden'],
      });
      if (!fields.length) continue;

      const moduleIdByForm = new Map(forms.map(f => [f.id, f.module_id]));
      const fieldsByModule = new Map<number, typeof fields>();
      for (const f of fields) {
        const mid = moduleIdByForm.get(f.form_id)!;
        if (!fieldsByModule.has(mid)) fieldsByModule.set(mid, [] as any);
        fieldsByModule.get(mid)!.push(f);
      }

      const existing = await FieldPermissionV2.findAll({
        where: { company_id: companyId, group_id: groupId, field_id: fields.map(f => f.id) },
        attributes: ['field_id'],
      });
      const hasRow = new Set(existing.map(r => r.field_id));

      const toCreate: any[] = [];
      const toRemove: number[] = [];

      for (const mod of modules) {
        const modFields = fieldsByModule.get(mod.id) || [];
        if (!modFields.length) continue;

        const key  = permKeyForModule(mod.slug);
        const view = granted.has(`${key}:view`);

        if (!view) {
          toRemove.push(...modFields.map(f => f.id));
          continue;
        }

        const edit = granted.has(`${key}:edit`);
        const down = granted.has(`${key}:download`);

        for (const f of modFields) {
          if (hasRow.has(f.id) && !opts.overwriteExisting) continue;
          toCreate.push({
            company_id: companyId, group_id: groupId, field_id: f.id,
            can_view: true, can_edit: edit, can_copy: true,
            can_download: down, is_masked: !!f.is_hidden,
          });
        }
      }

      if (toRemove.length) {
        removed += await FieldPermissionV2.destroy({
          where: { company_id: companyId, group_id: groupId, field_id: toRemove },
        });
      }
      for (const row of toCreate) {
        await FieldPermissionV2.upsert(row);
        created++;
      }
    }

    if (created || removed) {
      await logActivity({
        companyId: companyIds[0], employeeId: updatedBy,
        action: 'FIELD_PERMISSIONS_CASCADED', module: 'settings',
        entityId: groupId, newValues: { companyIds, created, removed },
      });
    }
    return { created, removed };
  }

  // ─── Runtime: resolve permissions for a user role on a form ──────────────────
async resolveFormPermissions(formId: number, employeeId: number, companyId: number) {
    const DENY = { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };

    const form = await FormDefinition.findOne({ where: { id: formId }, attributes: ['id', 'module_id'] });
    if (!form) throw new AppError('Form not found', 404);
    const hrModule = await HrModule.findOne({ where: { id: form.module_id }, attributes: ['id', 'slug'] });
    const moduleKey = hrModule ? permKeyForModule(hrModule.slug) : null;

    const [fields, memberships] = await Promise.all([
      DynamicField.findAll({
        where: { form_id: formId, is_active: true },
        include: [{ model: FieldOption, as: 'options', required: false }],
        order: [['sort_order', 'ASC']],
      }),
      UserGroup.findAll({ where: { employee_id: employeeId, company_id: companyId } }),
    ]);

    const groupIds = memberships.map(m => m.group_id);
    const denyAll = () => fields.map(f => ({ ...f.toJSON(), resolved: { ...DENY } }));
    if (!groupIds.length || !fields.length) return denyAll();

    // ── Company gate: module must be enabled for this company at all ──
    // (independent of, and checked before, group permission slugs — a
    // company that never selected this module gets nothing, regardless of
    // what any group's permissions say.)
    if (hrModule) {
      const enabled = await ModuleCompany.findOne({ where: { module_id: hrModule.id, company_id: companyId } });
      if (!enabled) return denyAll();
    }

    // ── Module gate: no module view ⇒ no fields, whatever the field rows say ──
    const moduleSlugs = await this.resolveModuleSlugs(employeeId, companyId, groupIds);
    if (!moduleKey || !moduleSlugs.has(`${moduleKey}:view`)) return denyAll();
    const moduleEdit     = moduleSlugs.has(`${moduleKey}:edit`);
    const moduleDownload = moduleSlugs.has(`${moduleKey}:download`);

    const [perms, fieldOv] = await Promise.all([
      FieldPermissionV2.findAll({
        where: { company_id: companyId, group_id: groupIds, field_id: fields.map(f => f.id) },
      }),
      getEmployeeFieldOverrides(employeeId, companyId, moduleKey, groupIds),
    ]);

    return fields.map(field => {
      const rows = perms.filter(p => p.field_id === field.id);
      let can_view     = rows.some(r => r.can_view);
      let can_edit     = rows.some(r => r.can_edit);
      let can_copy     = rows.some(r => r.can_copy);
      let can_download = rows.some(r => r.can_download);
      const viewGranting = rows.filter(r => r.can_view);
      let is_masked = viewGranting.length > 0 ? viewGranting.every(r => r.is_masked) : false;

      // ── Employee overrides on top of the group baseline ──
      const ov = fieldOv[field.field_key] || {};
      if (ov.view     !== undefined) can_view     = ov.view;
      if (ov.edit     !== undefined) can_edit     = ov.edit;
      if (ov.copy     !== undefined) can_copy     = ov.copy;
      if (ov.download !== undefined) can_download = ov.download;
      if (ov.mask     !== undefined) is_masked    = ov.mask;

      // ── Module ceiling ──
      can_edit     = can_edit     && moduleEdit;
      can_download = can_download && moduleDownload;

      // ── Dependency rule (mirrors the UI's toggle logic) ──
      if (!can_view) { can_edit = false; can_copy = false; can_download = false; is_masked = false; }

      return { ...field.toJSON(), resolved: { can_view, can_edit, can_copy, can_download, is_masked } };
    });
  }

  async getGroupFieldPermissionsForCompany(companyId: number, groupId: number, formId: number) {
    const form = await this.getFormWithFields(formId);
    const fields = (form.fields || []) as DynamicField[];
    if (!fields.length) return { fields, perms: {} };

    const fieldIds = fields.map(f => f.id);
    const rows = await FieldPermissionV2.findAll({
      where: { company_id: companyId, group_id: groupId, field_id: fieldIds },
    });

    const perms: Record<number, any> = {};
    for (const field of fields) {
      const row = rows.find(r => r.field_id === field.id);
      perms[field.id] = row
        ? { can_view: row.can_view, can_edit: row.can_edit, can_copy: row.can_copy, can_download: row.can_download, is_masked: row.is_masked }
        : { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
    }
    return { fields, perms };
  }

  /** Employee's effective module slugs: group grants + module-level overrides. */
  private async resolveModuleSlugs(
    employeeId: number, companyId: number, groupIds: number[],
  ): Promise<Set<string>> {
    const rows = await GroupPermission.findAll({
      where: { group_id: groupIds },
      include: [{ model: Permission, attributes: ['slug'] }],
    });
    const set = new Set<string>();
    for (const r of rows) {
      const slug = (r as any).Permission?.slug;
      if (slug) set.add(slug);
    }
    return resolvePermissionsForEmployee(employeeId, companyId, groupIds, set);
  }
}