import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add department_id to sub_departments
  await queryInterface.addColumn('sub_departments', 'department_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Remove old unique index on name
  await queryInterface.removeIndex(
    'sub_departments',
    'sub_departments_name'
  ).catch(() => {
    // Ignore if index name is different
  });

  // Add composite unique index
  await queryInterface.addIndex(
    'sub_departments',
    ['department_id', 'name'],
    {
      unique: true,
      name: 'sub_departments_department_id_name_unique',
    }
  );

  // Add index for department_id
  await queryInterface.addIndex(
    'sub_departments',
    ['department_id'],
    {
      name: 'sub_departments_department_id_index',
    }
  );

  // After existing records are updated with the correct department_id,
  // change department_id to NOT NULL.
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex(
    'sub_departments',
    'sub_departments_department_id_name_unique'
  ).catch(() => {});

  await queryInterface.removeIndex(
    'sub_departments',
    'sub_departments_department_id_index'
  ).catch(() => {});

  await queryInterface.addIndex(
    'sub_departments',
    ['name'],
    {
      unique: true,
      name: 'sub_departments_name_unique',
    }
  ).catch(() => {});

  await queryInterface.removeColumn(
    'sub_departments',
    'department_id'
  );
}