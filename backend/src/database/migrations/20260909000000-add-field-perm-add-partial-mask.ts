import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Field Permissions gains two new capabilities:
 *   - can_add            — onboarding-only edit grant (editable only while the
 *                          target employee profile is < 100% complete)
 *   - is_partial_masked  — show first 2 + last 2 chars, mask the middle
 *
 * Both are additive booleans on field_permissions_v2. The existing is_masked
 * (full mask) column is left untouched — it is read in ~20 places and full mask
 * still wins over partial mask at resolution time.
 *
 * employee_permission_overrides.permission is varchar(20) and already accepts
 * the new "add" / "partial_mask" values without a schema change.
 */

// `sequelize.sync({ alter: true })` on a dev boot may already have added these,
// so tolerate "column already exists".
async function addColumnIfMissing(
  queryInterface: QueryInterface,
  table: string,
  column: string,
  attribute: Parameters<QueryInterface['addColumn']>[2],
): Promise<void> {
  const existing = await queryInterface.describeTable(table);
  if (!existing[column]) {
    await queryInterface.addColumn(table, column, attribute);
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  await addColumnIfMissing(queryInterface, 'field_permissions_v2', 'can_add', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await addColumnIfMissing(queryInterface, 'field_permissions_v2', 'is_partial_masked', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const cols = await queryInterface.describeTable('field_permissions_v2');
  if (cols['can_add']) await queryInterface.removeColumn('field_permissions_v2', 'can_add');
  if (cols['is_partial_masked']) await queryInterface.removeColumn('field_permissions_v2', 'is_partial_masked');
}
