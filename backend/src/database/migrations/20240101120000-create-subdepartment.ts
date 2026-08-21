// import { QueryInterface, DataTypes } from 'sequelize';

// export async function up(queryInterface: QueryInterface) {
//   // Create sub_departments table
//   await queryInterface.createTable('sub_departments', {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     department_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//       references: {
//         model: 'departments',
//         key: 'id',
//       },
//       onDelete: 'SET NULL',
//     },
//     name: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//       unique: true,
//     },
//     code: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     is_active: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//     },
//     created_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//     updated_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//     deleted_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//     head_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//       references: {
//         model: 'employees',
//         key: 'id',
//       },
//       onDelete: 'SET NULL',
//     },
//     created_at: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       defaultValue: DataTypes.NOW,
//     },
//     updated_at: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       defaultValue: DataTypes.NOW,
//     },
//     deleted_at: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//   });

//   // Add indexes
//   await queryInterface.addIndex('sub_departments', {
//     fields: ['department_id'],
//     name: 'idx_sub_dept_department_id',
//   });

//   await queryInterface.addIndex('sub_departments', {
//     fields: ['is_active'],
//     name: 'idx_sub_dept_is_active',
//   });

//   await queryInterface.addIndex('sub_departments', {
//     fields: ['head_id'],
//     name: 'idx_sub_dept_head_id',
//   });

//   // Add sub_department_id column to employees table
//   await queryInterface.addColumn('employees', 'sub_department_id', {
//     type: DataTypes.INTEGER.UNSIGNED,
//     allowNull: true,
//     references: {
//       model: 'sub_departments',
//       key: 'id',
//     },
//     onDelete: 'SET NULL',
//   });

//   await queryInterface.addIndex('employees', {
//     fields: ['sub_department_id'],
//     name: 'idx_emp_sub_department_id',
//   });
// }

// export async function down(queryInterface: QueryInterface) {
//   // Remove foreign key and column from employees
//   await queryInterface.removeIndex('employees', 'idx_emp_sub_department_id');
//   await queryInterface.removeColumn('employees', 'sub_department_id');

//   // Drop sub_departments table
//   await queryInterface.dropTable('sub_departments');
// }