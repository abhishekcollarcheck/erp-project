import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── 1. ALTER EXISTING 'designations' TABLE ─────────────────────────────

  // Rename designation_name to name if present
  await queryInterface.renameColumn('designations', 'designation_name', 'name').catch(() => {});

  // Remove old unique index on designation_name if it exists
  await queryInterface.removeIndex('designations', 'designations_designation_name').catch(() => {});
  await queryInterface.removeIndex('designations', 'designation_name').catch(() => {});

  // Add new columns safely (skips if column already exists)
  await queryInterface.addColumn('designations', 'code', {
    type: DataTypes.STRING(20),
    allowNull: true,
  }).catch(() => {});

  await queryInterface.addColumn('designations', 'is_all_departments', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  }).catch(() => {});

  // Remove legacy tracking columns if present
  await queryInterface.removeColumn('designations', 'created_by').catch(() => {});
  await queryInterface.removeColumn('designations', 'updated_by').catch(() => {});

  // ─── 2. CREATE NEW 'designation_departments' JUNCTION TABLE ─────────────

  try {
    await queryInterface.createTable('designation_departments', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      designation_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'designations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Add composite unique index on [designation_id, department_id]
    await queryInterface.addIndex('designation_departments', ['designation_id', 'department_id'], {
      unique: true,
      name: 'designation_departments_designation_id_department_id_unique',
    });
  } catch (error) {
    // Table or index already exists
  }

  // ─── 3. CREATE NEW 'sub_designations' TABLE ─────────────────────────────

  try {
    await queryInterface.createTable('sub_designations', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      designation_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'designations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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

    // Add composite unique index for [designation_id, name]
    await queryInterface.addIndex('sub_designations', ['designation_id', 'name'], {
      unique: true,
      name: 'sub_designations_designation_id_name_unique',
    });

    // Add index for fast designation_id lookups
    await queryInterface.addIndex('sub_designations', ['designation_id'], {
      name: 'sub_designations_designation_id_index',
    });
  } catch (error) {
    // Table or indexes already exist
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // ─── 1. DROP 'sub_designations' TABLE ──────────────────────────────────
  await queryInterface.removeIndex(
    'sub_designations',
    'sub_designations_designation_id_name_unique'
  ).catch(() => {});

  await queryInterface.removeIndex(
    'sub_designations',
    'sub_designations_designation_id_index'
  ).catch(() => {});

  await queryInterface.dropTable('sub_designations').catch(() => {});

  // ─── 2. DROP 'designation_departments' TABLE ───────────────────────────
  await queryInterface.removeIndex(
    'designation_departments',
    'designation_departments_designation_id_department_id_unique'
  ).catch(() => {});

  await queryInterface.dropTable('designation_departments').catch(() => {});

  // ─── 3. REVERT 'designations' TABLE ────────────────────────────────────
  await queryInterface.removeColumn('designations', 'is_all_departments').catch(() => {});
  await queryInterface.removeColumn('designations', 'code').catch(() => {});

  await queryInterface.renameColumn('designations', 'name', 'designation_name').catch(() => {});

  await queryInterface.addColumn('designations', 'created_by', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  }).catch(() => {});

  await queryInterface.addColumn('designations', 'updated_by', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  }).catch(() => {});
}