import { QueryInterface, DataTypes } from 'sequelize';

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
  await queryInterface.addIndex('weekly_off_preset', ['is_active'], {
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