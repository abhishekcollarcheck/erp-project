import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already added this column and
// some of these indexes on many local DBs before this migration existed, so
// both helpers must tolerate "already exists" instead of throwing.
async function addColumnIfMissing(
  queryInterface: QueryInterface,
  table: string,
  column: string,
  attribute: Parameters<QueryInterface['addColumn']>[2],
): Promise<void> {
  const existing = await queryInterface.describeTable(table);
  if (!existing[column]) {
    await queryInterface.addColumn(table, column, attribute);
  }
}

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
  // Add department_id to sub_departments
  await addColumnIfMissing(queryInterface, 'sub_departments', 'department_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Remove old unique index on name
  await queryInterface.removeIndex(
    'sub_departments',
    'sub_departments_name'
  ).catch(() => {
    // Ignore if index name is different
  });

  // Add composite unique index
  await addIndexIfMissing(
    queryInterface,
    'sub_departments',
    ['department_id', 'name'],
    {
      unique: true,
      name: 'sub_departments_department_id_name_unique',
    }
  );

  // Add index for department_id
  await addIndexIfMissing(
    queryInterface,
    'sub_departments',
    ['department_id'],
    {
      name: 'sub_departments_department_id_index',
    }
  );

  // After existing records are updated with the correct department_id,
  // change department_id to NOT NULL.
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex(
    'sub_departments',
    'sub_departments_department_id_name_unique'
  ).catch(() => {});

  await queryInterface.removeIndex(
    'sub_departments',
    'sub_departments_department_id_index'
  ).catch(() => {});

  await queryInterface.addIndex(
    'sub_departments',
    ['name'],
    {
      unique: true,
      name: 'sub_departments_name_unique',
    }
  ).catch(() => {});

  await queryInterface.removeColumn(
    'sub_departments',
    'department_id'
  );
}