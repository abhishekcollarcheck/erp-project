import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates the `employees` table — exact match of
 * `backend/src/database/models/Employee.ts`'s `Employee.init()` (the base
 * identity table; the ~20 child tables such as `employee_personal`,
 * `employee_location_attendance`, etc. are only created here if a later
 * migration actually needs one of them to pre-exist — see the sibling
 * `2026090xxxxxxx-create-employee-*-table.ts` migrations).
 *
 * Never created by a migration — only via `sequelize.sync()`. Must exist
 * before `20260903000000-candidate-wizard-fields.ts`, which adds
 * `candidates.referred_by_employee_id` with an inline FK `references` to
 * `employees.id`. `employees` itself declares real inline FK `references`
 * (`onDelete: 'RESTRICT'`) to `companies`, `departments`, `sub_departments`,
 * `designations`, `sub_designations` — all of which must (and now do) exist
 * before this migration, in that order.
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
  options: { unique?: boolean; name: string; where?: any },
): Promise<void> {
  const indexes = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
  if (indexes.some((i) => i.name === options.name)) return;
  await queryInterface.addIndex(table, fields, options);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const created = await createTableIfMissing(queryInterface, 'employees', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    employee_code: { type: DataTypes.STRING(30), allowNull: true },
    reference_code: { type: DataTypes.STRING(50), allowNull: true },
    status: {
      type: DataTypes.ENUM('Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive'),
      allowNull: true,
      defaultValue: 'Active',
    },
    record_status: { type: DataTypes.ENUM('Draft', 'Final'), allowNull: false, defaultValue: 'Draft' },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    middle_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: true },
    company_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
      references: { model: 'companies', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    employment_type: {
      type: DataTypes.ENUM('Permanent', 'Contract', 'Intern', 'Consultant', 'Probation'),
      allowNull: true, defaultValue: 'Permanent',
    },
    department_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
      references: { model: 'departments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    sub_department_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true,
      references: { model: 'sub_departments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    designation_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
      references: { model: 'designations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    sub_designation_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true,
      references: { model: 'sub_designations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    form_completion_pct: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, defaultValue: 0 },
    portal_access: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    is_super_admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    otp_hash: { type: DataTypes.STRING(255), allowNull: true },
    otp_expires: { type: DataTypes.DATE, allowNull: true },
    otp_attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
    otp_locked_until: { type: DataTypes.DATE, allowNull: true },
    refresh_token: { type: DataTypes.TEXT, allowNull: true },
    refresh_expires: { type: DataTypes.DATE, allowNull: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    must_change_password: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid: true on the model
  });

  if (created) {
    await addIndexIfMissing(queryInterface, 'employees', ['employee_code'], { unique: true, name: 'employees_employee_code_unique', where: { deleted_at: null } });
    await addIndexIfMissing(queryInterface, 'employees', ['reference_code'], { unique: true, name: 'employees_reference_code_unique', where: { deleted_at: null } });
    await addIndexIfMissing(queryInterface, 'employees', ['status'], { name: 'employees_status' });
    await addIndexIfMissing(queryInterface, 'employees', ['portal_access'], { name: 'employees_portal_access' });
    await addIndexIfMissing(queryInterface, 'employees', ['is_super_admin'], { name: 'employees_is_super_admin' });
    await addIndexIfMissing(queryInterface, 'employees', ['company_id'], { name: 'employees_company_id' });
    await addIndexIfMissing(queryInterface, 'employees', ['department_id'], { name: 'employees_department_id' });
    await addIndexIfMissing(queryInterface, 'employees', ['designation_id'], { name: 'employees_designation_id' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('employees').catch(() => { /* already absent */ });
}
