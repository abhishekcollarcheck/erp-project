import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // Remove old HOD-related index if it exists.
  // Your existing model had an index on hod_id.
  try {
    await queryInterface.removeIndex('leave_requests', 'leave_requests_hod_id');
  } catch (error) {
    // Ignore if the index name is different or does not exist.
  }

  // Remove old columns
  await queryInterface.removeColumn('leave_requests', 'hod_id');
  await queryInterface.removeColumn('leave_requests', 'hod_name');
  await queryInterface.removeColumn('leave_requests', 'coordinator_name');

  // Add L1 manager ID
  await queryInterface.addColumn('leave_requests', 'l1_manager_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Add L2 manager ID
  await queryInterface.addColumn('leave_requests', 'l2_manager_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Add indexes
  await queryInterface.addIndex(
    'leave_requests',
    ['l1_manager_id'],
    {
      name: 'leave_requests_l1_manager_id',
    },
  );

  await queryInterface.addIndex(
    'leave_requests',
    ['l2_manager_id'],
    {
      name: 'leave_requests_l2_manager_id',
    },
  );
}

export async function down(queryInterface: QueryInterface) {
  // Remove new indexes
  await queryInterface.removeIndex(
    'leave_requests',
    'leave_requests_l1_manager_id',
  );

  await queryInterface.removeIndex(
    'leave_requests',
    'leave_requests_l2_manager_id',
  );

  // Remove new columns
  await queryInterface.removeColumn('leave_requests', 'l1_manager_id');
  await queryInterface.removeColumn('leave_requests', 'l2_manager_id');

  // Restore old columns
  await queryInterface.addColumn('leave_requests', 'hod_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  await queryInterface.addColumn('leave_requests', 'hod_name', {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addColumn('leave_requests', 'coordinator_name', {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await queryInterface.addIndex(
    'leave_requests',
    ['hod_id'],
    {
      name: 'leave_requests_hod_id',
    },
  );
}