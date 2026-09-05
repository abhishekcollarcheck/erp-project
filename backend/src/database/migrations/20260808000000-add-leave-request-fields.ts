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
