import { QueryInterface } from 'sequelize';

interface IndexInfo {
  name?: string;
}

export async function up(queryInterface: QueryInterface) {
  const indexes = (await queryInterface.showIndex(
    'sub_departments'
  )) as IndexInfo[];

  const indexesToRemove = [
    'sub_departments_department_id_name_unique',
    'sub_departments_department_id_index',
    'idx_sub_dept_department_id',
  ];

  for (const indexName of indexesToRemove) {
    const exists = indexes.some(
      (index: IndexInfo) => index.name === indexName
    );

    if (exists) {
      await queryInterface.removeIndex(
        'sub_departments',
        indexName
      );
    }
  }

  // Check whether the legacy column still exists.
  const columns = await queryInterface.describeTable(
    'sub_departments'
  );

  if (columns.department_id) {
    await queryInterface.removeColumn(
      'sub_departments',
      'department_id'
    );
  }
}

export async function down(queryInterface: QueryInterface) {
  const columns = await queryInterface.describeTable(
    'sub_departments'
  );

  // Restore department_id if it does not exist.
  if (!columns.department_id) {
    await queryInterface.addColumn(
      'sub_departments',
      'department_id',
      {
        type: 'INTEGER UNSIGNED',
        allowNull: true,
      }
    );
  }

  const indexes = (await queryInterface.showIndex(
    'sub_departments'
  )) as IndexInfo[];

  // Restore normal department_id index.
  if (
    !indexes.some(
      (index: IndexInfo) =>
        index.name === 'sub_departments_department_id_index'
    )
  ) {
    await queryInterface.addIndex(
      'sub_departments',
      ['department_id'],
      {
        name: 'sub_departments_department_id_index',
      }
    );
  }

  // Restore unique department_id + name index.
  if (
    !indexes.some(
      (index: IndexInfo) =>
        index.name ===
        'sub_departments_department_id_name_unique'
    )
  ) {
    await queryInterface.addIndex(
      'sub_departments',
      ['department_id', 'name'],
      {
        unique: true,
        name: 'sub_departments_department_id_name_unique',
      }
    );
  }
}