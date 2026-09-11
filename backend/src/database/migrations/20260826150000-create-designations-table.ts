import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates `designations` + `sub_designations` — exact match of
 * `backend/src/database/models/Designation.ts` (`Designation.init()` /
 * `SubDesignation.init()`). Neither was ever created by a migration — only
 * via `sequelize.sync()`.
 *
 * Both must exist before `20260826160000-create-employees-table.ts`, whose
 * `department_id`/`designation_id`/`sub_designation_id` columns declare real
 * inline FK `references` to them (`onDelete: 'RESTRICT'`) — MySQL requires
 * the referenced table to exist when that FK is created. `sub_designations`
 * would otherwise only appear via
 * `20260931000001-update_designations_and_sub_designations_schema.ts`, which
 * runs long after `employees` is first needed
 * (`20260903000000-candidate-wizard-fields.ts`); that migration's own
 * `createTable('sub_designations', ...)` was patched to skip when the table
 * already exists (i.e. created here) — see the comment there.
 *
 * `designation_departments` / `sub_designation_designations` (the two
 * many-to-many junction tables) are left for that same later migration to
 * create, unchanged — nothing needs them this early, and `designations`
 * existing here is enough for their inline FK references to succeed.
 *
 * Idempotent, no `sync({ alter: true })`, real (not fake/minimal) schema.
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
  const indexes = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
  if (indexes.some((i) => i.name === options.name)) return;
  await queryInterface.addIndex(table, fields, options);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const createdDesignations = await createTableIfMissing(queryInterface, 'designations', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: true },
    is_all_departments: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid: true on the model
  });
  if (createdDesignations) {
    await addIndexIfMissing(queryInterface, 'designations', ['name'], { unique: true, name: 'designations_name_unique' });
  }

  const createdSubDesignations = await createTableIfMissing(queryInterface, 'sub_designations', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: true },
    is_all_designations: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid: true on the model
  });
  if (createdSubDesignations) {
    await addIndexIfMissing(queryInterface, 'sub_designations', ['name'], { unique: true, name: 'sub_designations_name_unique' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('sub_designations').catch(() => { /* already absent */ });
  await queryInterface.dropTable('designations').catch(() => { /* already absent */ });
}
