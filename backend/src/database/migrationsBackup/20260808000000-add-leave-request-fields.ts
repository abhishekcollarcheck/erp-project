import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('leave_requests', 'from_time', {
    type: DataTypes.STRING(5),
    allowNull: true,
  });

  await queryInterface.addColumn('leave_requests', 'to_time', {
    type: DataTypes.STRING(5),
    allowNull: true,
  });

  await queryInterface.addColumn('leave_requests', 'submission_type', {
    type: DataTypes.ENUM('self', 'admin'),
    allowNull: false,
    defaultValue: 'self',
  });

  await queryInterface.addColumn('leave_requests', 'applied_by', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('leave_requests', 'hod_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('leave_requests', 'coordinator_name', {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addColumn('leave_requests', 'undertaking_accepted', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addIndex('leave_requests', {
    fields: ['hod_id'],
    name: 'idx_leave_requests_hod_id',
  });

  await queryInterface.addIndex('leave_requests', {
    fields: ['applied_by'],
    name: 'idx_leave_requests_applied_by',
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_applied_by');
  await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_hod_id');
  await queryInterface.removeColumn('leave_requests', 'undertaking_accepted');
  await queryInterface.removeColumn('leave_requests', 'coordinator_name');
  await queryInterface.removeColumn('leave_requests', 'hod_id');
  await queryInterface.removeColumn('leave_requests', 'applied_by');
  await queryInterface.removeColumn('leave_requests', 'submission_type');
  await queryInterface.removeColumn('leave_requests', 'to_time');
  await queryInterface.removeColumn('leave_requests', 'from_time');
}
