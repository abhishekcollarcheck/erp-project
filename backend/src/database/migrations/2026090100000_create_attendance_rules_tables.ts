import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── 1. CREATE 'saturday_rules' TABLE ───────────────────────────────────
  try {
    await queryInterface.createTable('saturday_rules', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('saturday_rules', ['name'], {
      unique: true,
      name: 'saturday_rules_name_unique',
    });
  } catch (error) {
    // Table or index already exists
  }

  // ─── 2. CREATE 'grace_minutes' TABLE ─────────────────────────────────────
  try {
    await queryInterface.createTable('grace_minutes', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      display_order: {
        type: DataTypes.INTEGER,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('grace_minutes', ['name'], {
      unique: true,
      name: 'grace_minutes_name_unique',
    });
  } catch (error) {
    // Table or index already exists
  }

  // ─── 3. CREATE 'attendance_types' TABLE ──────────────────────────────────
  try {
    await queryInterface.createTable('attendance_types', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      display_order: {
        type: DataTypes.INTEGER,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('attendance_types', ['name'], {
      unique: true,
      name: 'attendance_types_name_unique',
    });
  } catch (error) {
    // Table or index already exists
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // ─── DROP ALL THREE TABLES IN REVERSE ORDER ─────────────────────────────
  await queryInterface.dropTable('attendance_types').catch(() => {});
  await queryInterface.dropTable('grace_minutes').catch(() => {});
  await queryInterface.dropTable('saturday_rules').catch(() => {});
}