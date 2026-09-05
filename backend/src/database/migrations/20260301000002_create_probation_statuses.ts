import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already created this table and
// its plain indexes on many local DBs before this migration existed, so
// addIndex must tolerate "index already exists" instead of throwing.
async function addIndexIfMissing(queryInterface: QueryInterface, table: string, fields: string[]): Promise<void> {
  await queryInterface.addIndex(table, fields).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('probation_statuses', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    display_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
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

  await addIndexIfMissing(queryInterface, 'probation_statuses', ['display_order']);
  await addIndexIfMissing(queryInterface, 'probation_statuses', ['is_active']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('probation_statuses');
}