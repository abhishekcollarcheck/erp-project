import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates `sub_departments` + `sub_department_departments` — exact match of
 * `backend/src/database/models/Subdepartment.ts` (`SubDepartment.init()` /
 * `SubDepartmentDepartment.init()`). Neither was ever created by a
 * migration — only via `sequelize.sync()`.
 *
 * `2026082700000-add-department-id.ts` is the first migration to touch
 * `sub_departments` (`describeTable` to add a legacy `department_id` column,
 * later dropped again by `20260905020000-remove-legacy-subdepartment-
 * department-id.ts`), so this migration must run before it. Deliberately
 * created WITHOUT `department_id` — that column is legacy, added and removed
 * by those two migrations in sequence; the model's real, current schema
 * (many-to-many via `sub_department_departments`, matching sibling
 * `department_departments`-style pivots) never has it.
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
  const createdSubDept = await createTableIfMissing(queryInterface, 'sub_departments', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_all_departments: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    head_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid: true on the model
  });

  if (createdSubDept) {
    await addIndexIfMissing(queryInterface, 'sub_departments', ['name', 'is_active'], { unique: true, name: 'uniq_subdept_name_active' });
    await addIndexIfMissing(queryInterface, 'sub_departments', ['is_active'], { name: 'idx_subdept_active' });
    await addIndexIfMissing(queryInterface, 'sub_departments', ['head_id'], { name: 'idx_subdept_head' });
  }

  const createdPivot = await createTableIfMissing(queryInterface, 'sub_department_departments', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    sub_department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'sub_departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  if (createdPivot) {
    await addIndexIfMissing(queryInterface, 'sub_department_departments', ['sub_department_id', 'department_id'], { unique: true, name: 'uniq_subdept_dept' });
    await addIndexIfMissing(queryInterface, 'sub_department_departments', ['sub_department_id'], { name: 'idx_subdept_dept_sub' });
    await addIndexIfMissing(queryInterface, 'sub_department_departments', ['department_id'], { name: 'idx_subdept_dept_dept' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('sub_department_departments').catch(() => { /* already absent */ });
  await queryInterface.dropTable('sub_departments').catch(() => { /* already absent */ });
}
