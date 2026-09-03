import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Adds `current_doj` (Current Date of Joining) to `employee_location_attendance`.
 *
 * `actual_doj` = original / group joining date.
 * `current_doj` = joining date at the present company after a transfer.
 *
 * The field key already existed in the wizard payload, the DTOs and the
 * dynamic_fields seed ("Current Date of Joining") but never had a physical
 * column, so the value was silently dropped on save. The bulk-import
 * "Current Joining Date" column now writes it.
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  const table = await queryInterface.describeTable('employee_location_attendance');
  if (!table.current_doj) {
    await queryInterface.addColumn('employee_location_attendance', 'current_doj', {
      type: DataTypes.DATEONLY,
      allowNull: true,
      after: 'actual_doj',
    } as any);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const table = await queryInterface.describeTable('employee_location_attendance');
  if (table.current_doj) {
    await queryInterface.removeColumn('employee_location_attendance', 'current_doj');
  }
}
