import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add company_id to departments
  await queryInterface.addColumn('departments', 'company_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Remove old unique index on department_name
  await queryInterface.removeIndex(
    'departments',
    'departments_department_name'
  ).catch(() => {
    // Ignore if index name is different
  });

  // Add composite unique index
  await queryInterface.addIndex('departments', ['company_id', 'department_name'], {
    unique: true,
    name: 'departments_company_id_department_name_unique',
  });

  // Add index for company_id
  await queryInterface.addIndex('departments', ['company_id'], {
    name: 'departments_company_id_index',
  });

  // After existing records are updated with the correct company_id,
  // change company_id to NOT NULL.
  //
  // IMPORTANT:
  // Do this only after populating company_id for existing departments.
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex(
    'departments',
    'departments_company_id_department_name_unique'
  ).catch(() => {});

  await queryInterface.removeIndex(
    'departments',
    'departments_company_id_index'
  ).catch(() => {});

  await queryInterface.addIndex('departments', ['department_name'], {
    unique: true,
    name: 'departments_department_name_unique',
  }).catch(() => {});

  await queryInterface.removeColumn('departments', 'company_id');
}