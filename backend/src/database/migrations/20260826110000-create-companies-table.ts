import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates the `companies` AND `company_modules` tables — exact column-for-
 * column match of `backend/src/database/models/Company.ts`'s `Company.init()`
 * / `CompanyModule.init()` (table names are lower-case `companies` /
 * `company_modules`, confirmed against both the model and a live
 * `SHOW COLUMNS FROM companies` — see [[company-master-field-map]]).
 *
 * Like the Form Builder tables, neither was ever created by a migration —
 * only ever via `sequelize.sync()` on a dev boot. The very next migration,
 * `20260826123000-add-company-profile-fields-and-module-core.ts`, calls
 * `queryInterface.describeTable('companies')` then `describeTable(
 * 'company_modules')` to add columns to each — on a database that has never
 * booted the app (fresh DB / CI), neither table exists yet:
 *
 *   ERROR: No description found for "companies" table.
 *   ERROR: No description found for "company_modules" table.
 *
 * This migration must run BEFORE that one (filename timestamp
 * 20260826110000 < 20260826123000). It creates both tables with their FULL
 * current schema (including the `legal_name`/`tagline`/`since_year`/`cin`/
 * `google_maps_link`/`hr_email`/`about` profile columns on `companies` and
 * `is_core` on `company_modules`, plus every named index those two tables'
 * models declare — `companies_slug_unique` / `companies_code_unique` /
 * `is_active`, `company_modules_company_module_unique` /
 * `company_modules_company_active_index`), so `20260826123000`'s
 * `addColumnIfMissing` calls become safe no-ops — same pattern already used
 * for `20260825235959-create-form-builder-tables.ts`.
 *
 * Idempotent (skips a table individually if it already exists, e.g. a DB
 * that booted the app at least once). Does not use `sync({ alter: true })`.
 * Not a fake/minimal table — this is the real, full schema. Does not touch
 * RBAC / master-data / employee tables.
 */

async function createTableIfMissing(
  queryInterface: QueryInterface,
  table: string,
  attributes: Parameters<QueryInterface['createTable']>[1],
  options?: Parameters<QueryInterface['createTable']>[2],
): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : (t as any).tableName));
  if (names.includes(table)) return false;
  await queryInterface.createTable(table, attributes, options);
  return true;
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  fields: string[],
  options: { unique?: boolean; name: string },
): Promise<void> {
  const indexes = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
  if (indexes.some((i) => i.name === options.name)) return;
  await queryInterface.addIndex(table, fields, options);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const created = await createTableIfMissing(queryInterface, 'companies', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: true },
    code: { type: DataTypes.STRING(20), allowNull: true },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    gstin: { type: DataTypes.STRING(20), allowNull: true },
    pan: { type: DataTypes.STRING(20), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(300), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    pincode: { type: DataTypes.STRING(10), allowNull: true },

    employee_code_start: { type: DataTypes.STRING(10), allowNull: true },
    employee_code_end: { type: DataTypes.STRING(10), allowNull: true },
    employee_code_skip: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },

    country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'India' },
    industry: { type: DataTypes.STRING(100), allowNull: true },
    fiscal_year: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'Apr-Mar' },
    employee_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    timezone: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Asia/Kolkata' },
    currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'INR' },
    date_format: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'DD/MM/YYYY' },
    theme_color: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null },

    onboarding_step: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    setup_completed_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    // ─── Company profile fields (also touched by 20260826123000-...) ───────
    legal_name: { type: DataTypes.STRING(200), allowNull: true },
    tagline: { type: DataTypes.STRING(300), allowNull: true },
    since_year: { type: DataTypes.INTEGER, allowNull: true },
    cin: { type: DataTypes.STRING(30), allowNull: true },
    google_maps_link: { type: DataTypes.STRING(1000), allowNull: true },
    hr_email: { type: DataTypes.STRING(255), allowNull: true },
    about: { type: DataTypes.TEXT, allowNull: true },

    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid: true on the model
  });

  if (created) {
    await addIndexIfMissing(queryInterface, 'companies', ['slug'], { unique: true, name: 'companies_slug_unique' });
    await addIndexIfMissing(queryInterface, 'companies', ['code'], { unique: true, name: 'companies_code_unique' });
    await addIndexIfMissing(queryInterface, 'companies', ['is_active'], { name: 'companies_is_active' });
  }

  // ─── company_modules (per-company module activation) ─────────────────────
  const createdModules = await createTableIfMissing(queryInterface, 'company_modules', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    label: { type: DataTypes.STRING(200), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // Also added later by 20260826123000-add-company-profile-fields-and-module-core.ts
    // via addColumnIfMissing — included here from the start so that becomes a no-op.
    is_core: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    display_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  if (createdModules) {
    await addIndexIfMissing(queryInterface, 'company_modules', ['company_id', 'module'], { unique: true, name: 'company_modules_company_module_unique' });
    await addIndexIfMissing(queryInterface, 'company_modules', ['company_id', 'is_active'], { name: 'company_modules_company_active_index' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('company_modules').catch(() => { /* already absent */ });
  await queryInterface.dropTable('companies').catch(() => { /* already absent */ });
}
