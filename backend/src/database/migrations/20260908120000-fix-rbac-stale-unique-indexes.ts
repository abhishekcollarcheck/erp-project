import { QueryInterface } from 'sequelize';

/**
 * Drops three stale unique indexes on the RBAC join tables that predate the
 * multi-company model and silently break multi-tenant Role & Permission use.
 *
 * Each table has BOTH the correct composite unique (…, company_id, …) AND an
 * older, narrower unique missing company_id — a leftover from a historical
 * `sequelize.sync({ alter: true })` run (same root cause as the 2026-09-05
 * duplicate-index cleanup, but that migration only collapsed indexes covering
 * the EXACT same column list, so these subset duplicates slipped through).
 *
 *   group_permissions.group_permissions_permission_id_group_id_unique
 *       (group_id, permission_id)            → blocks the same permission being
 *       granted to a group for more than one company (PermissionGroupService
 *       .setPermissions writes one row per selected company).
 *
 *   user_groups.user_groups_employee_id_group_id_unique
 *       (employee_id, group_id)              → blocks the same employee being a
 *       member of a group in more than one company.
 *
 *   employee_roles.employee_roles_role_id_employee_id_unique
 *       (employee_id, role_id)               → blocks the same employee holding
 *       the same role in more than one company.
 *
 * Purely an index fix — no column, type, or business rule changes. The real
 * uniqueness rule (…including company_id) is still enforced by the composite
 * index that stays in place. Idempotent: skips anything already gone.
 */

const STALE = [
  { table: 'group_permissions', index: 'group_permissions_permission_id_group_id_unique' },
  { table: 'user_groups',       index: 'user_groups_employee_id_group_id_unique' },
  { table: 'employee_roles',    index: 'employee_roles_role_id_employee_id_unique' },
];

async function indexExists(qi: QueryInterface, table: string, index: string): Promise<boolean> {
  const [rows] = (await qi.sequelize.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index
     LIMIT 1`,
    { replacements: { table, index } },
  )) as unknown as [unknown[], unknown];
  return rows.length > 0;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const { table, index } of STALE) {
    if (await indexExists(queryInterface, table, index)) {
      await queryInterface.removeIndex(table, index);
      // eslint-disable-next-line no-console
      console.log(`[migration] dropped stale unique index ${table}.${index}`);
    }
  }
}

export async function down(): Promise<void> {
  // Intentionally a no-op — these indexes were wrong (missing company_id) and
  // recreating them would re-break multi-company RBAC. The correct composite
  // unique on each table is untouched by this migration.
}
