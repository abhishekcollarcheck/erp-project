import { QueryInterface } from 'sequelize';

/**
 * `leave_requests` hit MySQL's 64-key-per-table ceiling — 52 duplicate unique
 * indexes on `ref_no` (`ref_no`, `ref_no_2`, … `ref_no_52`).
 *
 * ROOT CAUSE (same as the 2026-09-05 master-data cleanup): the LeaveRequest
 * model declared `ref_no: { …, unique: true }` inline. Every dev-boot
 * `sequelize.sync()` that couldn't match that inline-unique attribute to the
 * anonymous index it made last time issued another `ALTER TABLE … CHANGE
 * COLUMN ref_no … UNIQUE`, and MySQL added a fresh index each time. Once the
 * table crossed 64 keys, the backend could no longer boot ("Too many keys
 * specified; max 64 keys allowed").
 *
 * This migration collapses every `ref_no` index into a single named one
 * (`leave_requests_ref_no_unique`, which the model now declares in `indexes[]`
 * instead of inline). Index-plane only — the uniqueness rule is unchanged.
 * Idempotent: re-running when only the canonical index remains does nothing.
 */

interface StatRow { INDEX_NAME: string; NON_UNIQUE: number; COLUMN_NAME: string; }

const CANONICAL = 'leave_requests_ref_no_unique';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const [rows] = (await queryInterface.sequelize.query(
    `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'leave_requests'
        AND INDEX_NAME <> 'PRIMARY'`,
  )) as unknown as [StatRow[], unknown];

  // Every single-column index that covers only `ref_no`.
  const byIndex = new Map<string, string[]>();
  for (const r of rows) {
    if (!byIndex.has(r.INDEX_NAME)) byIndex.set(r.INDEX_NAME, []);
    byIndex.get(r.INDEX_NAME)!.push(r.COLUMN_NAME);
  }
  const refNoIndexes = [...byIndex.entries()]
    .filter(([, cols]) => cols.length === 1 && cols[0] === 'ref_no')
    .map(([name]) => name);

  if (refNoIndexes.length <= 1 && refNoIndexes[0] === CANONICAL) {
    console.log('[cleanup-leave-request-ref-no-indexes] Already clean — nothing to do.');
    return;
  }

  console.log(
    `[cleanup-leave-request-ref-no-indexes] collapsing ${refNoIndexes.length} ` +
    `ref_no indexes into "${CANONICAL}"`,
  );

  for (const name of refNoIndexes) {
    await queryInterface.removeIndex('leave_requests', name).catch((e: any) => {
      console.warn(`  could not drop "${name}": ${e.message}`);
    });
  }

  await queryInterface.addIndex('leave_requests', {
    fields: ['ref_no'],
    unique: true,
    name: CANONICAL,
  }).catch((e: any) => {
    console.warn(`  could not create "${CANONICAL}": ${e.message}`);
  });
}

export async function down(): Promise<void> {
  // Not reversible — the duplicate indexes should never have existed. The one
  // canonical unique index is exactly the constraint the model declares.
}
