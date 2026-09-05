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
  // Add company_id to departments
  await addColumnIfMissing(queryInterface, 'departments', 'company_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  });

  // Remove old unique index on department_name
  await queryInterface.removeIndex(
    'departments',
    'departments_department_name'
  ).catch(() => {
    // Ignore if index name is different
  });

  // Add composite unique index
  await addIndexIfMissing(queryInterface, 'departments', ['company_id', 'department_name'], {
    unique: true,
    name: 'departments_company_id_department_name_unique',
  });

  // Add index for company_id
  await addIndexIfMissing(queryInterface, 'departments', ['company_id'], {
    name: 'departments_company_id_index',
  });

  // After existing records are updated with the correct company_id,
  // change company_id to NOT NULL.
  //
  // IMPORTANT:
  // Do this only after populating company_id for existing departments.
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex(
    'departments',
    'departments_company_id_department_name_unique'
  ).catch(() => {});

  await queryInterface.removeIndex(
    'departments',
    'departments_company_id_index'
  ).catch(() => {});

  await queryInterface.addIndex('departments', ['department_name'], {
    unique: true,
    name: 'departments_department_name_unique',
  }).catch(() => {});

  await queryInterface.removeColumn('departments', 'company_id');
}