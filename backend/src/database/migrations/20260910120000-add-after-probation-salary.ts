import { QueryInterface, DataTypes } from 'sequelize';

/**
 * "Salary change after probation" — Compensation step.
 *
 * When an employee is on probation, HR can record a SECOND salary package that
 * takes effect the day probation is passed (usually higher). Optionally the
 * probation-period difference is paid as arrears in the next processed salary.
 *
 * Schema, reusing the existing compensation tables (no new compensation system):
 *   - employee_salary.salary_type ENUM gains a third value 'after_probation'.
 *     The after-probation package is just another row for the employee, exactly
 *     like 'current' / 'joining' (same basic/hra/allowance1/gross/amdb/total
 *     columns, same (employee_id, salary_type) unique index).
 *   - employee_asset_deduction (the per-employee Compensation-step singleton)
 *     gains two flags: salary_change_after_probation, give_arrears_after_probation.
 *
 * Idempotent: ENUM change is a MODIFY (safe to re-run); columns guarded by
 * describeTable so a dev `sync({alter:true})` boot doesn't clash.
 */

const SALARY_TYPE_WITH_AP = DataTypes.ENUM('current', 'joining', 'after_probation');
const SALARY_TYPE_OLD = DataTypes.ENUM('current', 'joining');

async function addColumnIfMissing(
  qi: QueryInterface,
  table: string,
  column: string,
  attribute: Parameters<QueryInterface['addColumn']>[2],
): Promise<void> {
  const cols = await qi.describeTable(table);
  if (!cols[column]) await qi.addColumn(table, column, attribute);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('employee_salary', 'salary_type', {
    type: SALARY_TYPE_WITH_AP,
    allowNull: false,
  });

  await addColumnIfMissing(queryInterface, 'employee_asset_deduction', 'salary_change_after_probation', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await addColumnIfMissing(queryInterface, 'employee_asset_deduction', 'give_arrears_after_probation', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop the after-probation packages before shrinking the ENUM.
  await queryInterface.sequelize.query(
    "DELETE FROM employee_salary WHERE salary_type = 'after_probation'",
  );
  await queryInterface.changeColumn('employee_salary', 'salary_type', {
    type: SALARY_TYPE_OLD,
    allowNull: false,
  });

  const cols = await queryInterface.describeTable('employee_asset_deduction');
  if (cols['salary_change_after_probation']) {
    await queryInterface.removeColumn('employee_asset_deduction', 'salary_change_after_probation');
  }
  if (cols['give_arrears_after_probation']) {
    await queryInterface.removeColumn('employee_asset_deduction', 'give_arrears_after_probation');
  }
}
