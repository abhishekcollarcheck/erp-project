import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already added some of these
// columns/indexes on many local DBs before this migration existed, so both
// helpers must tolerate "already exists" instead of throwing.
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

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  options: Parameters<QueryInterface['addIndex']>[1],
): Promise<void> {
  await queryInterface.addIndex(table, options).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function up(queryInterface: QueryInterface) {
  // On a genuinely fresh database (migrations run before the app has ever
  // booted, e.g. `db:migrate` on an empty DB / CI / a new machine),
  // `leave_requests` doesn't exist yet — it was only ever created via
  // `sequelize.sync()` from the model, never by a `createTable` migration.
  // This migration is a backfill for OLDER databases where the table
  // predates these columns; the current model (LeaveModels.ts) already
  // declares every one of them, so a table `sync()` creates fresh already
  // has them — nothing to backfill. Skip rather than fail on
  // `describeTable`, which throws "No description found for ... table" for
  // a table that doesn't exist at all (not to be confused with a missing
  // column, which `addColumnIfMissing` already tolerates).
  const tables = await queryInterface.showAllTables();
  if (!tables.includes('leave_requests')) {
    console.log(
      '[add-leave-request-fields] leave_requests does not exist yet — skipping ' +
      '(sequelize.sync() will create it with these columns already included).',
    );
    return;
  }

  await addColumnIfMissing(queryInterface, 'leave_requests', 'from_time', {
    type: DataTypes.STRING(5),
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'to_time', {
    type: DataTypes.STRING(5),
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'submission_type', {
    type: DataTypes.ENUM('self', 'admin'),
    allowNull: false,
    defaultValue: 'self',
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'applied_by', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'SET NULL',
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'hod_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'SET NULL',
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'coordinator_name', {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'undertaking_accepted', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await addIndexIfMissing(queryInterface, 'leave_requests', {
    fields: ['hod_id'],
    name: 'idx_leave_requests_hod_id',
  });

  await addIndexIfMissing(queryInterface, 'leave_requests', {
    fields: ['applied_by'],
    name: 'idx_leave_requests_applied_by',
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_applied_by');
  await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_hod_id');
  await queryInterface.removeColumn('leave_requests', 'undertaking_accepted');
  await queryInterface.removeColumn('leave_requests', 'coordinator_name');
  await queryInterface.removeColumn('leave_requests', 'hod_id');
  await queryInterface.removeColumn('leave_requests', 'applied_by');
  await queryInterface.removeColumn('leave_requests', 'submission_type');
  await queryInterface.removeColumn('leave_requests', 'to_time');
  await queryInterface.removeColumn('leave_requests', 'from_time');
}
