import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates the Form Builder tables — `hr_modules`, `module_companies`,
 * `form_definitions`, `dynamic_fields`, `field_options`, `field_permissions_v2`
 * — exactly matching `backend/src/database/models/FormBuilder.ts`.
 *
 * These tables were never created by a migration; they only ever existed via
 * `sequelize.sync()` on a dev boot. Running `npx sequelize-cli db:migrate`
 * against a database that has never booted the app (fresh DB / CI) therefore
 * failed as soon as it reached `20260826-insert-employees-core-fields.ts`,
 * which reads/writes `form_definitions`, `hr_modules`, `dynamic_fields` and
 * `field_permissions_v2` directly:
 *
 *   ERROR: Table 'erphr_db.form_definitions' doesn't exist
 *
 * This migration must run BEFORE that one (filename timestamp
 * 20260825235959 < 20260826-...). Idempotent — `sequelize.sync({alter:false})`
 * (dev boot, see config/database.ts) may already have created some/all of
 * these on a DB that has booted the app at least once, so every table is
 * skipped individually if it already exists. Does not touch RBAC / master-data
 * / employee tables and does not use `sync({ alter: true })`.
 */

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

// Keep in sync with FormBuilder.ts's FIELD_TYPES / DYNAMIC_SOURCES.
const FIELD_TYPES = [
  'text', 'email', 'number', 'password', 'textarea',
  'select', 'multi_select', 'radio', 'checkbox',
  'date', 'datetime', 'file', 'image',
  'phone', 'url', 'currency', 'percentage',
];
const DYNAMIC_SOURCES = [
  'departments', 'designations', 'employees', 'roles',
  'leave_types', 'asset_categories', 'custom',
];

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── hr_modules ─────────────────────────────────────────────────────────
  const createdHrModules = await createTableIfMissing(queryInterface, 'hr_modules', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false },
    icon: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    is_system: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdHrModules) {
    await addIndexIfMissing(queryInterface, 'hr_modules', ['slug'], { unique: true, name: 'hr_modules_slug_unique' });
  }

  // ─── module_companies ───────────────────────────────────────────────────
  const createdModuleCompanies = await createTableIfMissing(queryInterface, 'module_companies', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    module_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdModuleCompanies) {
    await addIndexIfMissing(queryInterface, 'module_companies', ['module_id', 'company_id'], { unique: true, name: 'module_companies_module_company_unique' });
    await addIndexIfMissing(queryInterface, 'module_companies', ['company_id'], { name: 'module_companies_company_id_index' });
  }

  // ─── form_definitions ───────────────────────────────────────────────────
  const createdFormDefinitions = await createTableIfMissing(queryInterface, 'form_definitions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    module_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    is_system: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdFormDefinitions) {
    await addIndexIfMissing(queryInterface, 'form_definitions', ['module_id', 'slug'], { unique: true, name: 'form_definitions_module_slug_unique' });
  }

  // ─── dynamic_fields ─────────────────────────────────────────────────────
  const createdDynamicFields = await createTableIfMissing(queryInterface, 'dynamic_fields', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    form_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    field_type: { type: DataTypes.ENUM(...FIELD_TYPES), allowNull: false },
    label: { type: DataTypes.STRING(200), allowNull: false },
    field_key: { type: DataTypes.STRING(200), allowNull: false },
    section: { type: DataTypes.STRING(100), allowNull: true },
    placeholder: { type: DataTypes.STRING(300), allowNull: true },
    help_text: { type: DataTypes.STRING(500), allowNull: true },
    is_required: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    is_readonly: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    is_hidden: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    is_unique: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    default_value: { type: DataTypes.STRING(500), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    width: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 100 },
    column_span: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    min_length: { type: DataTypes.INTEGER, allowNull: true },
    max_length: { type: DataTypes.INTEGER, allowNull: true },
    min_value: { type: DataTypes.DECIMAL(20, 4), allowNull: true },
    max_value: { type: DataTypes.DECIMAL(20, 4), allowNull: true },
    regex_pattern: { type: DataTypes.STRING(500), allowNull: true },
    custom_validation: { type: DataTypes.TEXT, allowNull: true },
    dynamic_source: { type: DataTypes.ENUM(...DYNAMIC_SOURCES), allowNull: true },
    dynamic_source_label: { type: DataTypes.STRING(100), allowNull: true },
    dynamic_source_value: { type: DataTypes.STRING(100), allowNull: true },
    dynamic_source_filter: { type: DataTypes.STRING(500), allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdDynamicFields) {
    await addIndexIfMissing(queryInterface, 'dynamic_fields', ['form_id', 'field_key'], { unique: true, name: 'dynamic_fields_form_field_key_unique' });
  }

  // ─── field_options ──────────────────────────────────────────────────────
  await createTableIfMissing(queryInterface, 'field_options', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    field_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    label: { type: DataTypes.STRING(200), allowNull: false },
    value: { type: DataTypes.STRING(200), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    is_default: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  });

  // ─── field_permissions_v2 ───────────────────────────────────────────────
  // can_add / is_partial_masked included up front (NOT NULL, default false) so
  // this matches the FINAL schema after 20260909000000-add-field-perm-add-
  // partial-mask.ts — that migration's addColumnIfMissing() is a no-op here.
  await createTableIfMissing(queryInterface, 'field_permissions_v2', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    field_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    can_view: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    can_add: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_copy: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    can_download: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    is_masked: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    is_partial_masked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }).then(async (created) => {
    if (created) {
      await addIndexIfMissing(queryInterface, 'field_permissions_v2', ['company_id', 'group_id', 'field_id'], { unique: true, name: 'field_permissions_v2_company_group_field_unique' });
    }
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Reverse order (children before parents), each tolerant of "already gone".
  for (const table of ['field_permissions_v2', 'field_options', 'dynamic_fields', 'form_definitions', 'module_companies', 'hr_modules']) {
    await queryInterface.dropTable(table).catch(() => { /* already absent */ });
  }
}
