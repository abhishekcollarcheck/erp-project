import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Adds `candidates.reference_code` (CAND-{year}-{seq}) with a single unique index.
 *
 * Idempotent: earlier `sequelize.sync({ alter: true })` runs may have already
 * added the column and — because the model briefly declared `unique: true` on it
 * — a pile of duplicate anonymous unique indexes (`reference_code`,
 * `reference_code_2`, …). This migration collapses them to one named index.
 */

async function referenceCodeIndexNames(queryInterface: QueryInterface): Promise<string[]> {
  const [rows] = (await queryInterface.sequelize.query(
    "SHOW INDEX FROM candidates WHERE Column_name = 'reference_code'",
  )) as unknown as [{ Key_name: string }[], unknown];
  return [...new Set(rows.map(r => r.Key_name))];
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const table = await queryInterface.describeTable('candidates');
  if (!table.reference_code) {
    await queryInterface.addColumn('candidates', 'reference_code', {
      type: DataTypes.STRING(20),
      allowNull: true,
    });
  }

  // Drop every existing index on reference_code (named or auto-generated dupes).
  for (const name of await referenceCodeIndexNames(queryInterface)) {
    await queryInterface.removeIndex('candidates', name).catch(() => undefined);
  }

  await queryInterface.addIndex('candidates', {
    fields: ['reference_code'],
    unique: true,
    name: 'candidates_reference_code_unique',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('candidates', 'candidates_reference_code_unique').catch(() => undefined);
  const table = await queryInterface.describeTable('candidates');
  if (table.reference_code) {
    await queryInterface.removeColumn('candidates', 'reference_code');
  }
}
