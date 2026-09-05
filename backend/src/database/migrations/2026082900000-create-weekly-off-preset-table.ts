import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already created this table and
// index on many local DBs before this migration existed, so addIndex must
// tolerate "index already exists" instead of throwing.
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

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('weekly_off_preset', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    always_off: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    nth_off_rules: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add index on is_active for faster filtering
  await addIndexIfMissing(queryInterface, 'weekly_off_preset', ['is_active'], {
    name: 'weekly_off_preset_is_active_index',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex(
    'weekly_off_preset',
    'weekly_off_preset_is_active_index'
  ).catch(() => {});

  await queryInterface.dropTable('weekly_off_preset');
}