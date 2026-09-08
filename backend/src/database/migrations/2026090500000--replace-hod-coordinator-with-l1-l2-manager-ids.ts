import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already moved many local DBs
// to the new l1_manager_id/l2_manager_id shape directly — hod_id, hod_name
// and coordinator_name may never have existed as real columns there — so
// every step here must tolerate "already (not) there" instead of throwing.
async function removeColumnIfPresent(queryInterface: QueryInterface, table: string, column: string): Promise<void> {
  const existing = await queryInterface.describeTable(table);
  if (existing[column]) {
    await queryInterface.removeColumn(table, column);
  }
}

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
  fields: string[],
  options: { name?: string; unique?: boolean },
): Promise<void> {
  await queryInterface.addIndex(table, fields, options).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function up(queryInterface: QueryInterface) {
  // Remove old HOD-related index if it exists.
  // Your existing model had an index on hod_id.
  await queryInterface.removeIndex('leave_requests', 'leave_requests_hod_id').catch(() => {
    // Ignore if the index name is different or does not exist.
  });

  // Remove old columns
  await removeColumnIfPresent(queryInterface, 'leave_requests', 'hod_id');
  await removeColumnIfPresent(queryInterface, 'leave_requests', 'hod_name');
  await removeColumnIfPresent(queryInterface, 'leave_requests', 'coordinator_name');

  // Add L1 manager ID
  await addColumnIfMissing(queryInterface, 'leave_requests', 'l1_manager_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Add L2 manager ID
  await addColumnIfMissing(queryInterface, 'leave_requests', 'l2_manager_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Add indexes
  await addIndexIfMissing(
    queryInterface,
    'leave_requests',
    ['l1_manager_id'],
    {
      name: 'leave_requests_l1_manager_id',
    },
  );

  await addIndexIfMissing(
    queryInterface,
    'leave_requests',
    ['l2_manager_id'],
    {
      name: 'leave_requests_l2_manager_id',
    },
  );
}

export async function down(queryInterface: QueryInterface) {
  // Remove new indexes
  await queryInterface.removeIndex(
    'leave_requests',
    'leave_requests_l1_manager_id',
  ).catch(() => {});

  await queryInterface.removeIndex(
    'leave_requests',
    'leave_requests_l2_manager_id',
  ).catch(() => {});

  // Remove new columns
  await removeColumnIfPresent(queryInterface, 'leave_requests', 'l1_manager_id');
  await removeColumnIfPresent(queryInterface, 'leave_requests', 'l2_manager_id');

  // Restore old columns
  await addColumnIfMissing(queryInterface, 'leave_requests', 'hod_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'hod_name', {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, 'leave_requests', 'coordinator_name', {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await addIndexIfMissing(
    queryInterface,
    'leave_requests',
    ['hod_id'],
    {
      name: 'leave_requests_hod_id',
    },
  );
}