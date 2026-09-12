import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';

/**
 * Restores the "Role" system (as opposed to the separate Permission-Group
 * system) to a working state on any environment where it is missing or
 * incomplete — most notably the reported bug where `hr_manager` (and
 * potentially `super_admin` / `manager` / `employee`) does not exist for a
 * given company, breaking "Add Manager" (`POST /companies/:id/managers`,
 * `company.controller.ts assignManager`, hardcoded to `role_slug:'hr_manager'`
 * from the frontend `AssignManagerModal`) with a 404 "Role 'hr_manager' not
 * found in this company".
 *
 * Root cause: `role_templates`, `role_template_permissions`, `roles`,
 * `employee_roles` and `role_module_permissions` have never had a
 * `createTable` migration — they only ever existed via `sequelize.sync()` on
 * a dev boot (see the identical, already-documented situation for the
 * form-builder tables in `20260825235959-create-form-builder-tables.ts`).
 * On any DB that boots outside dev (`NODE_ENV!=='development'`, see
 * `config/database.ts` `connectDatabase()`) or that gets reset without a
 * reseed, these tables are missing or empty and `seedRbac.ts`
 * (`src/database/seeders/seedRbac.ts`) — which DOES already define
 * `hr_manager` correctly — has nothing to insert into, or never gets run for
 * a company created afterwards.
 *
 * This migration:
 *   1. Creates the 5 tables above if they don't already exist, EXACTLY
 *      matching `models/AuthModels.ts` / `models/RoleModels.ts` (idempotent —
 *      skipped per-table if already present from a dev sync boot).
 *   2. Seeds the canonical system role templates (`super_admin`, `hr_manager`,
 *      `manager`, `employee` — kept in sync with `TEMPLATE_DEFS` in
 *      `seedRbac.ts` and `ROLE_TEMPLATE_PERMS` in `rbac-seed-data.ts`) and,
 *      for every existing active company (looked up dynamically — no
 *      hardcoded company IDs), the per-company `roles` + matching
 *      `role_module_permissions` rows for any of the four that are missing.
 *
 * Every insert is guarded by an existence check keyed on the same unique
 * index the table enforces (slug / (template_id,module) / (company_id,slug) /
 * (role_id,module)), so re-running this migration, or running it alongside
 * `seedRbac.ts`, can never create duplicates and never touches a role/
 * template that doesn't match these 4 canonical system slugs — any
 * custom/non-system role a company has created is left untouched.
 *
 * Does not touch `permission_groups` / `group_permissions` / `user_groups`
 * (the separate, unrelated Permission-Group system) or use
 * `sequelize.sync({ alter: true })`.
 */

// Keep in sync with `TEMPLATE_DEFS` in seedRbac.ts.
const TEMPLATE_DEFS = [
  { slug: 'super_admin', name: 'Super Admin', sort_order: 1 },
  { slug: 'hr_manager', name: 'HR Manager', sort_order: 2 },
  { slug: 'manager', name: 'Department Manager', sort_order: 3 },
  { slug: 'employee', name: 'Employee', sort_order: 4 },
] as const;

const SYSTEM_ROLE_SLUGS = TEMPLATE_DEFS.map((d) => d.slug);

// Keep in sync with `PERMISSION_MODULE_KEYS` / `ROLE_TEMPLATE_PERMS` in
// rbac-seed-data.ts.
const PERMISSION_MODULE_KEYS = [
  'employees', 'candidates', 'recruitment', 'aptitude',
  'attendance', 'leave', 'leaves', 'payroll',
  'departments', 'designations', 'reports',
  'companies', 'settings',
];

interface TemplatePerm { module: string; can_view: boolean; can_edit: boolean; can_delete: boolean; can_download: boolean; }
const tperm = (module: string, v = true, e = false, d = false, dl = false): TemplatePerm => ({
  module, can_view: v, can_edit: e, can_delete: d, can_download: dl,
});

const ROLE_TEMPLATE_PERMS: Record<string, TemplatePerm[]> = {
  super_admin: PERMISSION_MODULE_KEYS.map((m) => tperm(m, true, true, true, true)),
  hr_manager: [
    tperm('employees', true, true, true, true),
    tperm('candidates', true, true, true, true),
    tperm('recruitment', true, true, true, true),
    tperm('attendance', true, true, false, true),
    tperm('leave', true, true, false, true),
    tperm('leaves', true, true, false, true),
    tperm('departments', true, true, false, false),
    tperm('designations', true, true, false, false),
    tperm('reports', true, false, false, true),
  ],
  manager: [
    tperm('employees', true, false, false, false),
    tperm('attendance', true, true, false, false),
    tperm('leave', true, true, false, false),
    tperm('leaves', true, true, false, false),
    tperm('reports', true, false, false, false),
  ],
  employee: [
    tperm('employees', true, false, false, false),
    tperm('attendance', true, false, false, false),
    tperm('leave', true, false, false, false),
    tperm('leaves', true, false, false, false),
  ],
};

async function createTableIfMissing(
  queryInterface: QueryInterface,
  table: string,
  attributes: Parameters<QueryInterface['createTable']>[1],
): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : (t as any).tableName));
  if (names.includes(table)) return false;
  await queryInterface.createTable(table, attributes);
  return true;
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  fields: string[],
  options: { unique?: boolean; name: string },
): Promise<void> {
  const indexes = await queryInterface.showIndex(table) as Array<{ name: string }>;
  if (indexes.some((i) => i.name === options.name)) return;
  await queryInterface.addIndex(table, fields, options);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── 1. Tables (idempotent — matches models/AuthModels.ts + RoleModels.ts) ──

  const createdRoleTemplates = await createTableIfMissing(queryInterface, 'role_templates', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_system: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdRoleTemplates) {
    await addIndexIfMissing(queryInterface, 'role_templates', ['slug'], { unique: true, name: 'uk_role_templates_slug' });
  }

  const createdRoleTemplatePermissions = await createTableIfMissing(queryInterface, 'role_template_permissions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    template_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    can_view: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_create: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_delete: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_download: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  });
  if (createdRoleTemplatePermissions) {
    await addIndexIfMissing(queryInterface, 'role_template_permissions', ['template_id', 'module'], { unique: true, name: 'role_template_permissions_template_module_unique' });
  }

  const createdRoles = await createTableIfMissing(queryInterface, 'roles', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_system: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    template_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  if (createdRoles) {
    await addIndexIfMissing(queryInterface, 'roles', ['company_id', 'slug'], { unique: true, name: 'roles_company_slug_unique' });
  }

  const createdEmployeeRoles = await createTableIfMissing(queryInterface, 'employee_roles', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    assigned_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    assigned_at: { type: DataTypes.DATE, allowNull: true },
  });
  if (createdEmployeeRoles) {
    await addIndexIfMissing(queryInterface, 'employee_roles', ['employee_id', 'role_id', 'company_id'], { unique: true, name: 'employee_roles_employee_role_company_unique' });
    await addIndexIfMissing(queryInterface, 'employee_roles', ['company_id', 'role_id'], { name: 'employee_roles_company_role_index' });
  }

  const createdRoleModulePermissions = await createTableIfMissing(queryInterface, 'role_module_permissions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    can_view: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_delete: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_download: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_mask: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  });
  if (createdRoleModulePermissions) {
    await addIndexIfMissing(queryInterface, 'role_module_permissions', ['role_id', 'module'], { unique: true, name: 'role_module_permissions_role_module_unique' });
  }

  // ─── 2. Data: role templates + their module grants ─────────────────────────

  const now = new Date();

  for (const def of TEMPLATE_DEFS) {
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM role_templates WHERE slug = :slug LIMIT 1',
      { replacements: { slug: def.slug }, type: QueryTypes.SELECT },
    ) as Array<{ id: number }>;
    if (existing.length === 0) {
      await queryInterface.bulkInsert('role_templates', [{
        slug: def.slug, name: def.name, description: null,
        is_system: true, sort_order: def.sort_order, created_at: now,
      }]);
    }
  }

  const templates = await queryInterface.sequelize.query(
    'SELECT id, slug FROM role_templates WHERE slug IN (:slugs)',
    { replacements: { slugs: SYSTEM_ROLE_SLUGS }, type: QueryTypes.SELECT },
  ) as Array<{ id: number; slug: string }>;
  const templateIdBySlug = new Map(templates.map((t) => [t.slug, t.id]));

  for (const def of TEMPLATE_DEFS) {
    const templateId = templateIdBySlug.get(def.slug)!;
    for (const p of ROLE_TEMPLATE_PERMS[def.slug] ?? []) {
      const existing = await queryInterface.sequelize.query(
        'SELECT id FROM role_template_permissions WHERE template_id = :templateId AND module = :module LIMIT 1',
        { replacements: { templateId, module: p.module }, type: QueryTypes.SELECT },
      ) as Array<{ id: number }>;
      if (existing.length === 0) {
        await queryInterface.bulkInsert('role_template_permissions', [{
          template_id: templateId, module: p.module,
          can_view: p.can_view, can_create: p.can_edit, can_edit: p.can_edit,
          can_delete: p.can_delete, can_download: p.can_download,
        }]);
      }
    }
  }

  // ─── 3. Data: per-company system roles + role_module_permissions ───────────
  // Companies are looked up dynamically — never hardcoded — so this restores
  // hr_manager (and the other 3 system roles) for every company that is
  // missing them, including ones created after the last seedRbac.ts run.

  const companies = await queryInterface.sequelize.query(
    'SELECT id FROM companies WHERE is_active = 1',
    { type: QueryTypes.SELECT },
  ) as Array<{ id: number }>;

  for (const company of companies) {
    for (const def of TEMPLATE_DEFS) {
      const templateId = templateIdBySlug.get(def.slug)!;

      let role = (await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE company_id = :companyId AND slug = :slug LIMIT 1',
        { replacements: { companyId: company.id, slug: def.slug }, type: QueryTypes.SELECT },
      ) as Array<{ id: number }>)[0];

      if (!role) {
        await queryInterface.bulkInsert('roles', [{
          company_id: company.id, name: def.name, slug: def.slug,
          description: null, is_system: true, template_id: templateId,
          created_at: now, updated_at: now, deleted_at: null,
        }]);
        role = (await queryInterface.sequelize.query(
          'SELECT id FROM roles WHERE company_id = :companyId AND slug = :slug LIMIT 1',
          { replacements: { companyId: company.id, slug: def.slug }, type: QueryTypes.SELECT },
        ) as Array<{ id: number }>)[0];
      }

      const templatePerms = ROLE_TEMPLATE_PERMS[def.slug] ?? [];
      for (const p of templatePerms) {
        const existingPerm = await queryInterface.sequelize.query(
          'SELECT id FROM role_module_permissions WHERE role_id = :roleId AND module = :module LIMIT 1',
          { replacements: { roleId: role.id, module: p.module }, type: QueryTypes.SELECT },
        ) as Array<{ id: number }>;
        if (existingPerm.length === 0) {
          await queryInterface.bulkInsert('role_module_permissions', [{
            role_id: role.id, module: p.module,
            can_view: p.can_view, can_edit: p.can_edit,
            can_delete: p.can_delete, can_download: p.can_download,
            can_mask: false,
          }]);
        }
      }
    }
  }
}

async function dropTableIfEmpty(queryInterface: QueryInterface, table: string): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : (t as any).tableName));
  if (!names.includes(table)) return;
  const [{ c }] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) c FROM ${table}`,
    { type: QueryTypes.SELECT },
  ) as Array<{ c: number }>;
  if (Number(c) === 0) {
    await queryInterface.dropTable(table).catch(() => { /* already gone */ });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Deliberately does NOT delete any role_templates / role_template_permissions
  // / roles / role_module_permissions / employee_roles ROWS. This migration's
  // job is to repair missing system-role data (e.g. a company silently
  // missing its `hr_manager` row breaks "Add Manager" with a 404) on
  // environments where these tables were only ever created ad hoc by
  // `sequelize.sync()`. Up() cannot tell which of these rows pre-existed vs.
  // which it just restored, and in every real environment these tables
  // already hold live, hand-assigned role data (per-company custom roles,
  // real employee→role assignments) that has NO reliable "created by this
  // migration" marker. Deleting by slug/is_system alone — the initial version
  // of this function — was verified locally to also delete pre-existing,
  // non-reconstructible employee_roles assignments that had nothing to do
  // with this migration. So: reversing the data-seed step is unsafe and is
  // intentionally skipped to honor "never remove or modify a valid existing
  // role or assignment."
  //
  // What IS safely reversible is the schema: each table is dropped only if
  // this rollback finds it completely empty (i.e. nothing — not even this
  // migration's own inserts — currently depends on it), which can only be
  // true if up() both created it AND every row ever inserted into it since
  // has also been removed some other way. Any table still holding data is
  // left in place untouched.
  for (const table of ['role_module_permissions', 'employee_roles', 'roles', 'role_template_permissions', 'role_templates']) {
    await dropTableIfEmpty(queryInterface, table);
  }
}
