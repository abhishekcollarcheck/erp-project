import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already created this pivot
// table's index on many local DBs before this migration existed, so addIndex
// must tolerate "index already exists" instead of throwing.
async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  fields: string[],
  options: { name?: string; unique?: boolean; transaction?: unknown },
): Promise<void> {
  await queryInterface.addIndex(table, fields, options as any).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // 1. Create 'departments' table
    await queryInterface.createTable(
      'departments',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        department_name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          unique: true,
        },
        department_code: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        is_all_companies: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        head_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        created_by: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        updated_by: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        deleted_by: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
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
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      { transaction }
    );

    // 2. Create 'company_departments' pivot table
    await queryInterface.createTable(
      'company_departments',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        department_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'departments',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        company_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
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
      },
      { transaction }
    );

    // 3. Add composite unique constraint
    await addIndexIfMissing(queryInterface, 'company_departments', ['department_id', 'company_id'], {
      unique: true,
      name: 'unique_department_company',
      transaction,
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.dropTable('company_departments', { transaction });
    await queryInterface.dropTable('departments', { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}