import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Adds a `skills` JSON array column to `candidates` (mirrors `vehicle_types`).
 * Powers the ATS listing "SKILLS" column and the Add/Edit Candidate form.
 * Nullable — existing rows unaffected. Dev boot `sync({ alter: false })` also
 * adds it; this migration backfills fresh / CI databases. Idempotent.
 */
async function addColumnIfMissing(
  qi: QueryInterface, table: string, column: string,
  attribute: Parameters<QueryInterface['addColumn']>[2],
): Promise<void> {
  const existing = await qi.describeTable(table);
  if (!existing[column]) await qi.addColumn(table, column, attribute);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map(t => (typeof t === 'string' ? t : (t as any).tableName));
  if (!names.includes('candidates')) {
    console.log('[add-candidate-skills] candidates table does not exist yet — skipping.');
    return;
  }
  await addColumnIfMissing(queryInterface, 'candidates', 'skills', { type: DataTypes.JSON, allowNull: true });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('candidates', 'skills').catch(() => { /* ignore */ });
}
