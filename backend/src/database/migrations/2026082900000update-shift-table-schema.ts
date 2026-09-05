import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already applied some of these
// column changes on many local DBs before this migration existed, so both
// helpers must tolerate "already (not) there" instead of throwing.
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

async function removeColumnIfPresent(queryInterface: QueryInterface, table: string, column: string): Promise<void> {
  const existing = await queryInterface.describeTable(table);
  if (existing[column]) {
    await queryInterface.removeColumn(table, column);
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  // 1. Make start_time and end_time nullable for "Full Attendance" support
  await queryInterface.changeColumn('shift', 'start_time', {
    type: DataTypes.TIME,
    allowNull: true,
  });

  await queryInterface.changeColumn('shift', 'end_time', {
    type: DataTypes.TIME,
    allowNull: true,
  });

  // 2. Add half_day_time
  await addColumnIfMissing(queryInterface, 'shift', 'half_day_time', {
    type: DataTypes.TIME,
    allowNull: true,
  });

  // 3. Add day_span
  await addColumnIfMissing(queryInterface, 'shift', 'day_span', {
    type: DataTypes.ENUM('1 day', '2 days'),
    allowNull: false,
    defaultValue: '1 day',
  });

  // 4. Remove unused indexes from old schema
  await queryInterface.removeIndex('shift', 'category').catch(() => {});

  // 5. Remove obsolete columns
  await removeColumnIfPresent(queryInterface, 'shift', 'category');
  await removeColumnIfPresent(queryInterface, 'shift', 'crosses_midnight');
  await removeColumnIfPresent(queryInterface, 'shift', 'duration_minutes');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Re-add old columns
  await queryInterface.addColumn('shift', 'category', {
    type: DataTypes.ENUM('STANDARD', 'NAT'),
    allowNull: false,
    defaultValue: 'STANDARD',
  });

  await queryInterface.addColumn('shift', 'crosses_midnight', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn('shift', 'duration_minutes', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  // Restore category index
  await queryInterface.addIndex('shift', ['category']).catch(() => {});

  // Remove new columns
  await queryInterface.removeColumn('shift', 'day_span');
  await queryInterface.removeColumn('shift', 'half_day_time');

  // Revert nullability
  await queryInterface.changeColumn('shift', 'start_time', {
    type: DataTypes.TIME,
    allowNull: false,
  });

  await queryInterface.changeColumn('shift', 'end_time', {
    type: DataTypes.TIME,
    allowNull: false,
  });
}