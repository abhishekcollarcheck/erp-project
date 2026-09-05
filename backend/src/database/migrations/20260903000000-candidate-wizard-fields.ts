import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const addIfMissing = async (
    column: string,
    spec: Parameters<QueryInterface['addColumn']>[2],
  ) => {
    const table = await queryInterface.describeTable('candidates');
    if (!table[column]) await queryInterface.addColumn('candidates', column, spec);
  };

  await addIfMissing('first_name', { type: DataTypes.STRING(100), allowNull: true });
  await addIfMissing('middle_name', { type: DataTypes.STRING(100), allowNull: true });
  await addIfMissing('last_name', { type: DataTypes.STRING(100), allowNull: true });

  await addIfMissing('current_state_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await addIfMissing('current_city_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await addIfMissing('ready_to_relocate', { type: DataTypes.BOOLEAN, allowNull: true });
  await addIfMissing('perm_address_same_as_present', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await addIfMissing('perm_state_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await addIfMissing('perm_city_id', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });

  await addIfMissing('course', { type: DataTypes.STRING(200), allowNull: true });
  await addIfMissing('institute', { type: DataTypes.STRING(200), allowNull: true });
  await addIfMissing('edu_mode', {
    type: DataTypes.ENUM('Regular', 'Non Regular', 'Not Applicable'),
    allowNull: true,
  });
  await addIfMissing('edu_start_date', { type: DataTypes.DATEONLY, allowNull: true });
  await addIfMissing('edu_end_date', { type: DataTypes.DATEONLY, allowNull: true });
  await addIfMissing('edu_currently_pursuing', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await addIfMissing('fresher', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
  await addIfMissing('currently_working', { type: DataTypes.BOOLEAN, allowNull: true });

  await addIfMissing('serving_notice_period', { type: DataTypes.BOOLEAN, allowNull: true });
  await addIfMissing('last_working_day', { type: DataTypes.DATEONLY, allowNull: true });

  await addIfMissing('vehicle_types', { type: DataTypes.JSON, allowNull: true });

  await addIfMissing('is_internal_referral', { type: DataTypes.BOOLEAN, allowNull: true });
  await addIfMissing('referred_by_employee_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'employees', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // Backfill split-name columns from the legacy single `candidate_name`.
  await queryInterface.sequelize.query(
    "UPDATE candidates SET first_name = TRIM(SUBSTRING_INDEX(candidate_name, ' ', 1)), " +
    "last_name = TRIM(CASE WHEN LOCATE(' ', candidate_name) > 0 " +
    "THEN SUBSTRING(candidate_name, LOCATE(' ', candidate_name) + 1) ELSE '-' END) " +
    "WHERE first_name IS NULL OR first_name = ''",
  );
  // Guard against any row that still has no usable name part.
  await queryInterface.sequelize.query(
    "UPDATE candidates SET first_name = '-' WHERE first_name IS NULL OR first_name = ''",
  );
  await queryInterface.sequelize.query(
    "UPDATE candidates SET last_name = '-' WHERE last_name IS NULL OR last_name = ''",
  );

  await queryInterface.changeColumn('candidates', 'first_name', {
    type: DataTypes.STRING(100),
    allowNull: false,
  });
  await queryInterface.changeColumn('candidates', 'last_name', {
    type: DataTypes.STRING(100),
    allowNull: false,
  });

  const tables = await queryInterface.showAllTables();
  if (!tables.map(t => (typeof t === 'string' ? t : (t as any).tableName)).includes('candidate_employments')) {
    await queryInterface.createTable('candidate_employments', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      candidate_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'candidates', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      company: { type: DataTypes.STRING(200), allowNull: false },
      designation: { type: DataTypes.STRING(200), allowNull: true },
      joining_date: { type: DataTypes.DATEONLY, allowNull: true },
      leaving_date: { type: DataTypes.DATEONLY, allowNull: true },
      currently_working: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('candidate_employments', ['candidate_id']);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('candidate_employments').catch(() => {});

  const columns = [
    'first_name', 'middle_name', 'last_name',
    'current_state_id', 'current_city_id', 'ready_to_relocate',
    'perm_address_same_as_present', 'perm_state_id', 'perm_city_id',
    'course', 'institute', 'edu_mode', 'edu_start_date', 'edu_end_date', 'edu_currently_pursuing',
    'fresher', 'currently_working',
    'serving_notice_period', 'last_working_day',
    'vehicle_types',
    'is_internal_referral', 'referred_by_employee_id',
  ];

  for (const column of columns) {
    const table = await queryInterface.describeTable('candidates');
    if (table[column]) await queryInterface.removeColumn('candidates', column);
  }
}
