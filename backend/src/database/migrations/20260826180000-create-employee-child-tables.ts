import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates `shift`, `employee_location_attendance`, `employee_asset_deduction`,
 * `employee_salary` — exact match of their Sequelize models (`Shift.ts`,
 * `Employee.ts`'s `EmployeeLocationAttendance` / `EmployeeAssetDeduction` /
 * `EmployeeSalary`). None were ever created by a migration — only via
 * `sequelize.sync()`.
 *
 * Needed before:
 *   - `20260904-add-location-current-doj.ts` — `describeTable(
 *     'employee_location_attendance')`. Created here WITH `current_doj`
 *     already present (it's in the current model), so that migration's
 *     `addColumn` is a safe no-op.
 *   - `20260910120000-add-after-probation-salary.ts` — unconditional
 *     `changeColumn('employee_salary', 'salary_type', ...)` (no existence
 *     guard) and `describeTable('employee_asset_deduction')`. Both tables
 *     are created here with their final shape (`salary_type` already the
 *     3-value ENUM, `salary_change_after_probation` / `give_arrears_after_
 *     probation` already present) so that migration is a safe no-op too.
 *
 * `employee_location_attendance.shift_id` and `.employee_id` are real inline
 * FK `references` (`shift`, `employees`, both already created — `employees`
 * by `20260826160000-create-employees-table.ts`) — hence `shift` is created
 * first, in this same migration.
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
  // ─── shift ────────────────────────────────────────────────────────────
  const createdShift = await createTableIfMissing(queryInterface, 'shift', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    label: { type: DataTypes.STRING(100), allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    half_day_time: { type: DataTypes.TIME, allowNull: true },
    day_span: { type: DataTypes.ENUM('1 day', '2 days'), allowNull: false, defaultValue: '1 day' },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdShift) {
    await addIndexIfMissing(queryInterface, 'shift', ['label'], { unique: true, name: 'shift_label_unique' });
    await addIndexIfMissing(queryInterface, 'shift', ['is_active'], { name: 'shift_is_active' });
  }

  // ─── employee_location_attendance ───────────────────────────────────────
  await createTableIfMissing(queryInterface, 'employee_location_attendance', {
    employee_id: {
      type: DataTypes.INTEGER.UNSIGNED, primaryKey: true,
      references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    working_state_country: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    working_city: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    working_site: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    pay_register_location: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    actual_doj: { type: DataTypes.DATEONLY, allowNull: false },
    current_doj: { type: DataTypes.DATEONLY, allowNull: true },
    weekly_off: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    shift_category: { type: DataTypes.ENUM('Shift', 'Duration'), allowNull: false, defaultValue: 'Duration' },
    shift_id: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true,
      references: { model: 'shift', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    },
    grace_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  // ─── employee_asset_deduction ────────────────────────────────────────────
  await createTableIfMissing(queryInterface, 'employee_asset_deduction', {
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
    asset_deduction_applicable: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    security_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    deduction_months: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    deduction_from: { type: DataTypes.ENUM('Salary', 'AMDB', 'N/A'), allowNull: true },
    monthly_deduction: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    final_monthly_deduction: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    last_installment: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salary_change_after_probation: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    give_arrears_after_probation: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  // ─── employee_salary ─────────────────────────────────────────────────────
  const createdSalary = await createTableIfMissing(queryInterface, 'employee_salary', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    salary_type: { type: DataTypes.ENUM('current', 'joining', 'after_probation'), allowNull: false },
    salary_mode: { type: DataTypes.ENUM('Bank Transfer', 'Cash', 'Cheque'), allowNull: true },
    basic: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    hra: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    allowance1: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    gross_salary_pm: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    amdb_pm: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    total_earning_pm: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  if (createdSalary) {
    await addIndexIfMissing(queryInterface, 'employee_salary', ['employee_id', 'salary_type'], { unique: true, name: 'employee_salary_employee_id_salary_type_unique' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('employee_salary').catch(() => { /* already absent */ });
  await queryInterface.dropTable('employee_asset_deduction').catch(() => { /* already absent */ });
  await queryInterface.dropTable('employee_location_attendance').catch(() => { /* already absent */ });
  await queryInterface.dropTable('shift').catch(() => { /* already absent */ });
}
