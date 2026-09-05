import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already created these tables
// and indexes on many local DBs before this migration existed. createTable
// is already safe (MySQL's CREATE TABLE IF NOT EXISTS), but addIndex must
// tolerate "index already exists" instead of throwing — narrowly, so a real
// schema error doesn't get silently swallowed along with it.
async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  fields: string[],
  options: { name?: string; unique?: boolean },
): Promise<void> {
  await queryInterface.addIndex(table, fields, options).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── 1. CREATE 'saturday_rules' TABLE ───────────────────────────────────
  {
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

    await addIndexIfMissing(queryInterface, 'saturday_rules', ['name'], {
      unique: true,
      name: 'saturday_rules_name_unique',
    });
  }

  // ─── 2. CREATE 'grace_minutes' TABLE ─────────────────────────────────────
  {
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

    await addIndexIfMissing(queryInterface, 'grace_minutes', ['name'], {
      unique: true,
      name: 'grace_minutes_name_unique',
    });
  }

  // ─── 3. CREATE 'attendance_types' TABLE ──────────────────────────────────
  {
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

    await addIndexIfMissing(queryInterface, 'attendance_types', ['name'], {
      unique: true,
      name: 'attendance_types_name_unique',
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // ─── DROP ALL THREE TABLES IN REVERSE ORDER ─────────────────────────────
  await queryInterface.dropTable('attendance_types').catch(() => {});
  await queryInterface.dropTable('grace_minutes').catch(() => {});
  await queryInterface.dropTable('saturday_rules').catch(() => {});
}