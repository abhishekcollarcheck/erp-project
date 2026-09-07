import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Adds a small set of "role you applied for" (JD) fields to `candidates` so the
 * Candidate Portal can show a real "Role you applied for" card without a
 * separate jobs/requisition module. All nullable — existing rows are unaffected.
 *
 * Dev boot's `sequelize.sync({ alter: false })` also adds these from the model;
 * this migration is the backfill for fresh / CI databases. Idempotent.
 */
async function addColumnIfMissing(
  qi: QueryInterface,
  table: string,
  column: string,
  attribute: Parameters<QueryInterface['addColumn']>[2],
): Promise<void> {
  const existing = await qi.describeTable(table);
  if (!existing[column]) await qi.addColumn(table, column, attribute);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map(t => (typeof t === 'string' ? t : (t as any).tableName));
  if (!names.includes('candidates')) {
    console.log('[add-candidate-job-fields] candidates table does not exist yet — skipping.');
    return;
  }

  await addColumnIfMissing(queryInterface, 'candidates', 'job_title',       { type: DataTypes.STRING(200), allowNull: true });
  await addColumnIfMissing(queryInterface, 'candidates', 'job_location',    { type: DataTypes.STRING(200), allowNull: true });
  await addColumnIfMissing(queryInterface, 'candidates', 'job_type',        { type: DataTypes.STRING(40),  allowNull: true });
  await addColumnIfMissing(queryInterface, 'candidates', 'job_code',        { type: DataTypes.STRING(40),  allowNull: true });
  await addColumnIfMissing(queryInterface, 'candidates', 'job_description', { type: DataTypes.TEXT,        allowNull: true });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const col of ['job_title', 'job_location', 'job_type', 'job_code', 'job_description']) {
    await queryInterface.removeColumn('candidates', col).catch(() => { /* ignore */ });
  }
}
