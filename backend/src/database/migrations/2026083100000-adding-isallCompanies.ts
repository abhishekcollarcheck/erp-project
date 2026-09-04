import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('departments', 'is_all_companies', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('departments', 'is_all_companies');
}