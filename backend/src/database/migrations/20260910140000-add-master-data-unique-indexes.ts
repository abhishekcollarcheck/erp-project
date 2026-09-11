import { QueryInterface } from 'sequelize';

/**
 * Adds the missing DB-level UNIQUE constraints on master-data natural keys so
 * `npm run seed` (and concurrent seeds / manual inserts / multiple app
 * instances) can never multiply master rows. The seeder's application-level
 * "check before insert" is the first line of defence; these indexes are the
 * backstop against races.
 *
 * Tables that ALREADY had the right unique key are left untouched:
 *   countries(name), departments(department_name) + (company_id,department_name),
 *   sub_departments(name,is_active), companies(slug)/(code), every simple
 *   {name}+{code} lookup (genders … exit_statuses), attendance_types(name),
 *   grace_minutes(name), saturday_rules(name).
 *
 * Natural keys added here (verified duplicate-free before adding — the up()
 * refuses to run if any table still has duplicates so nothing is silently
 * clobbered):
 *   states               UNIQUE(name, country_id)
 *   cities               UNIQUE(name, state_id)
 *   designations         UNIQUE(name)          -- app already 409s on dup name
 *   sub_designations     UNIQUE(name)          -- app already 409s on dup name
 *   weekly_off_preset    UNIQUE(name)
 *   shift                UNIQUE(label)         -- app already asserts unique label
 *   sites                UNIQUE(company_id, name)
 *   pay_registers        UNIQUE(company_id, name)
 *
 * NOTE on paranoid tables (states, cities, designations, sub_designations,
 * sites, pay_registers): the unique key does NOT include `deleted_at`, so once
 * a row is soft-deleted a new row with the same natural key cannot be created
 * until the old one is restored or hard-deleted. That is the intended, strict
 * behaviour for master data.
 */

interface IndexSpec {
  table: string;
  fields: string[];
  name: string;
}

const INDEXES: IndexSpec[] = [
  { table: 'states',            fields: ['name', 'country_id'], name: 'states_name_country_id_unique' },
  { table: 'cities',            fields: ['name', 'state_id'],   name: 'cities_name_state_id_unique' },
  { table: 'designations',      fields: ['name'],               name: 'designations_name_unique' },
  { table: 'sub_designations',  fields: ['name'],               name: 'sub_designations_name_unique' },
  { table: 'weekly_off_preset', fields: ['name'],               name: 'weekly_off_preset_name_unique' },
  { table: 'shift',             fields: ['label'],              name: 'shift_label_unique' },
  { table: 'sites',             fields: ['company_id', 'name'], name: 'sites_company_id_name_unique' },
  { table: 'pay_registers',     fields: ['company_id', 'name'], name: 'pay_registers_company_id_name_unique' },
];

async function tableExists(queryInterface: QueryInterface, table: string): Promise<boolean> {
  const [rows] = (await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table LIMIT 1`,
    { replacements: { table } },
  )) as unknown as [unknown[], unknown];
  return rows.length > 0;
}

async function indexExists(queryInterface: QueryInterface, table: string, name: string): Promise<boolean> {
  const [rows] = (await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :name LIMIT 1`,
    { replacements: { table, name } },
  )) as unknown as [unknown[], unknown];
  return rows.length > 0;
}

/** Throws (with the offending rows) rather than let ADD UNIQUE fail cryptically. */
async function assertNoDuplicates(queryInterface: QueryInterface, spec: IndexSpec): Promise<void> {
  const cols = spec.fields.map((f) => `\`${f}\``).join(', ');
  const [rows] = (await queryInterface.sequelize.query(
    `SELECT ${cols}, COUNT(*) AS n FROM \`${spec.table}\`
      GROUP BY ${cols} HAVING COUNT(*) > 1`,
  )) as unknown as [Array<Record<string, unknown>>, unknown];
  if (rows.length > 0) {
    throw new Error(
      `Cannot add ${spec.name}: \`${spec.table}\` still has ${rows.length} duplicate ` +
      `group(s) on (${spec.fields.join(', ')}). Resolve them first ` +
      `(check FK references, then collapse to the earliest id). Offending: ` +
      JSON.stringify(rows.slice(0, 10)),
    );
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const spec of INDEXES) {
    if (!(await tableExists(queryInterface, spec.table))) {
      console.log(`[master-unique-indexes] table "${spec.table}" not present — skipping ${spec.name}`);
      continue;
    }
    if (await indexExists(queryInterface, spec.table, spec.name)) {
      continue; // idempotent
    }
    await assertNoDuplicates(queryInterface, spec);
    await queryInterface.addIndex(spec.table, {
      fields: spec.fields,
      unique: true,
      name: spec.name,
    });
    console.log(`[master-unique-indexes] added UNIQUE ${spec.name} on ${spec.table}(${spec.fields.join(', ')})`);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const spec of [...INDEXES].reverse()) {
    if (!(await tableExists(queryInterface, spec.table))) continue;
    if (await indexExists(queryInterface, spec.table, spec.name)) {
      await queryInterface.removeIndex(spec.table, spec.name);
    }
  }
}
