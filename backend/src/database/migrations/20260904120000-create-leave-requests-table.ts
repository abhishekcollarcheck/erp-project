import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates `leave_requests` — exact match of
 * `backend/src/database/models/LeaveModels.ts`'s `LeaveRequest.init()`
 * (current shape: `l1_manager_id`/`l2_manager_id`, no legacy
 * `hod_id`/`hod_name`/`coordinator_name` — those were removed; see the
 * class's own commented-out fields). Never created by a migration — only
 * via `sequelize.sync()`.
 *
 * `20260808000000-add-leave-request-fields.ts` (Aug 8, before this) already
 * has its own guard and simply skips while `leave_requests` doesn't exist —
 * unaffected either way. Must exist before
 * `2026090500000--replace-hod-coordinator-with-l1-l2-manager-ids.ts` (Sep 5),
 * whose `describeTable('leave_requests')` throws on a genuinely fresh DB;
 * created here already in that migration's target shape, so its column
 * add/remove calls are safe no-ops.
 *
 * Uses the model's own named unique index (`leave_requests_ref_no_unique`)
 * rather than an inline `unique: true` on `ref_no` — see [[master-data-seed]]
 * on why this project stopped doing that (duplicate-index pileup under
 * `sync({ alter: true })`).
 *
 * Idempotent, no `sync({ alter: true })`, real (not fake/minimal) schema.
 */

async function createTableIfMissing(
  queryInterface: QueryInterface,
  table: string,
  attributes: Parameters<QueryInterface['createTable']>[1],
): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : (t as any).tableName));
  if (names.includes(table)) return false;
  await queryInterface.createTable(table, attributes);
  return true;
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  fields: string[],
  options: { unique?: boolean; name: string },
): Promise<void> {
  const indexes = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
  if (indexes.some((i) => i.name === options.name)) return;
  await queryInterface.addIndex(table, fields, options);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const created = await createTableIfMissing(queryInterface, 'leave_requests', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    ref_no: { type: DataTypes.STRING(30), allowNull: false },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_application_type: {
      type: DataTypes.ENUM('arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'),
      allowNull: false,
      defaultValue: 'full_day',
    },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    from_time: { type: DataTypes.STRING(5), allowNull: true },
    to_time: { type: DataTypes.STRING(5), allowNull: true },
    days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    working_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    sandwich_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    half_day: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'), allowNull: true, defaultValue: 'Pending' },
    approved_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    submission_type: { type: DataTypes.ENUM('self', 'admin'), allowNull: true, defaultValue: 'self' },
    applied_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    applied_at: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    cancelled_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    l1_manager_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    l2_manager_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    undertaking_accepted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  if (created) {
    await addIndexIfMissing(queryInterface, 'leave_requests', ['ref_no'], { unique: true, name: 'leave_requests_ref_no_unique' });
    await addIndexIfMissing(queryInterface, 'leave_requests', ['employee_id'], { name: 'leave_requests_employee_id' });
    await addIndexIfMissing(queryInterface, 'leave_requests', ['status'], { name: 'leave_requests_status' });
    await addIndexIfMissing(queryInterface, 'leave_requests', ['applied_by'], { name: 'leave_requests_applied_by' });
    await addIndexIfMissing(queryInterface, 'leave_requests', ['leave_type_id'], { name: 'leave_requests_leave_type_id' });
    await addIndexIfMissing(queryInterface, 'leave_requests', ['from_date', 'to_date'], { name: 'leave_requests_from_date_to_date' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('leave_requests').catch(() => { /* already absent */ });
}
