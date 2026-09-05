import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // `sequelize.sync({ alter: true })` (dev boot) already added this column on
  // many local DBs before this migration existed.
  const existing = await queryInterface.describeTable('departments');
  if (!existing.is_all_companies) {
    await queryInterface.addColumn('departments', 'is_all_companies', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  }
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('departments', 'is_all_companies');
}