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

  {
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
    await addIndexIfMissing(queryInterface, 'designation_departments', ['designation_id', 'department_id'], {
      unique: true,
      name: 'designation_departments_designation_id_department_id_unique',
    });
  }

  // ─── 3. CREATE NEW 'sub_designations' TABLE ─────────────────────────────
  //
  // Sub-designations are NOT tied to a single designation via an FK column —
  // they relate to designations many-to-many through the
  // 'sub_designation_designations' junction table below (or apply to all
  // designations when is_all_designations is set), matching the current
  // SubDesignation model (src/database/models/Designation.ts).

  {
    await queryInterface.createTable('sub_designations', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      is_all_designations: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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

    // Existing 'sub_designations' tables created before this redesign (or by
    // an older version of this migration) may still have the old columns.
    const existing = await queryInterface.describeTable('sub_designations');
    if (!existing.is_all_designations) {
      await queryInterface.addColumn('sub_designations', 'is_all_designations', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
    if (existing.designation_id) {
      await queryInterface.removeIndex('sub_designations', 'sub_designations_designation_id_name_unique').catch(() => {});
      await queryInterface.removeIndex('sub_designations', 'sub_designations_designation_id_index').catch(() => {});
      await queryInterface.removeColumn('sub_designations', 'designation_id');
    }
  }

  // ─── 4. CREATE NEW 'sub_designation_designations' JUNCTION TABLE ────────

  {
    await queryInterface.createTable('sub_designation_designations', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      sub_designation_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'sub_designations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await addIndexIfMissing(queryInterface, 'sub_designation_designations', ['sub_designation_id', 'designation_id'], {
      unique: true,
      name: 'uniq_subdesig_desig',
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // ─── 1. DROP 'sub_designation_designations' AND 'sub_designations' ─────
  await queryInterface.removeIndex(
    'sub_designation_designations',
    'uniq_subdesig_desig'
  ).catch(() => {});

  await queryInterface.dropTable('sub_designation_designations').catch(() => {});

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