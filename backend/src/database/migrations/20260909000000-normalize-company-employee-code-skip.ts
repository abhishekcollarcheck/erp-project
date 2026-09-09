import { QueryInterface } from 'sequelize';

/**
 * Data cleanup: `companies.employee_code_skip` (Reserved / Skip Codes).
 *
 * A frontend bug serialised an empty Reserved/Skip Codes field as `"[0]"`
 * (Number('') === 0), which then made every Company create/update fail with
 * "Reserved code 0 is outside company range". This migration normalises any
 * bad stored value:
 *   - NULL / '' / invalid JSON / non-array           -> '[]'
 *   - duplicates / non-integers                       -> removed
 *   - a `0` entry that is NOT inside a configured
 *     [start, end] range                              -> removed
 *
 * A `0` that genuinely sits inside a company's configured code range is left
 * untouched (explicitly configured). Idempotent — safe to re-run.
 */

interface Row {
  id: number;
  employee_code_start: string | null;
  employee_code_end: string | null;
  employee_code_skip: string | null;
}

function normalise(row: Row): string {
  const start = row.employee_code_start != null && row.employee_code_start !== ''
    ? Number(row.employee_code_start) : null;
  const end = row.employee_code_end != null && row.employee_code_end !== ''
    ? Number(row.employee_code_end) : null;

  let arr: unknown[] = [];
  if (row.employee_code_skip != null && row.employee_code_skip !== '') {
    try {
      const parsed = JSON.parse(row.employee_code_skip);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  }

  const cleaned = Array.from(
    new Set(
      arr
        .map((c) => (typeof c === 'string' ? c.trim() : c))
        .filter((c) => c !== '' && c !== null && c !== undefined)
        .map((c) => Number(c))
        .filter((c) => Number.isInteger(c)),
    ),
  ).filter((code) => {
    if (code !== 0) return true;
    // keep a 0 only if it is explicitly inside a configured range
    return start !== null && end !== null && start <= 0 && end >= 0;
  });

  return JSON.stringify(cleaned);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : (t as any).tableName));
  if (!names.includes('companies')) {
    console.log('[normalize-company-employee-code-skip] companies table missing — skipping.');
    return;
  }

  const [rows] = (await queryInterface.sequelize.query(
    'SELECT id, employee_code_start, employee_code_end, employee_code_skip FROM companies',
  )) as unknown as [Row[], unknown];

  let fixed = 0;
  for (const row of rows) {
    const next = normalise(row);
    const current = row.employee_code_skip ?? null;
    if (current !== next) {
      await queryInterface.sequelize.query(
        'UPDATE companies SET employee_code_skip = :skip WHERE id = :id',
        { replacements: { skip: next, id: row.id } },
      );
      fixed += 1;
      console.log(`[normalize-company-employee-code-skip] company ${row.id}: ${JSON.stringify(current)} -> ${next}`);
    }
  }
  console.log(`[normalize-company-employee-code-skip] done — ${fixed} row(s) updated.`);
}

export async function down(): Promise<void> {
  // Data normalisation only — nothing to reverse.
}
