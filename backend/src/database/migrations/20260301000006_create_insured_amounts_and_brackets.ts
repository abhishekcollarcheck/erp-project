import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already created these tables and
// some of their plain indexes on many local DBs before this migration existed,
// so addIndex must tolerate "index already exists" instead of throwing.
async function addIndexIfMissing(queryInterface: QueryInterface, table: string, fields: string[]): Promise<void> {
  await queryInterface.addIndex(table, fields).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Insured Amounts Master Table
  await queryInterface.createTable('insured_amounts', {
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

  // Salary Brackets Mapping Table
  await queryInterface.createTable('insured_amount_brackets', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    min_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    max_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // null represents "No limit"
    },
    insured_amount_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'insured_amounts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    display_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
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

  await addIndexIfMissing(queryInterface, 'insured_amounts', ['display_order']);
  await addIndexIfMissing(queryInterface, 'insured_amount_brackets', ['display_order']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('insured_amount_brackets');
  await queryInterface.dropTable('insured_amounts');
}