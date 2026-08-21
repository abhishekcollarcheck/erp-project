// import { QueryInterface, DataTypes } from 'sequelize';

// export default {
//   async up(queryInterface: QueryInterface) {
//     await queryInterface.createTable('employee_leave_balances', {
//       id: {
//         type: DataTypes.INTEGER.UNSIGNED,
//         autoIncrement: true,
//         primaryKey: true,
//       },

//       employee_id: {
//         type: DataTypes.INTEGER.UNSIGNED,
//         allowNull: false,
//       },

//       leave_type_id: {
//         type: DataTypes.INTEGER.UNSIGNED,
//         allowNull: false,
//       },

//       year: {
//         type: DataTypes.SMALLINT.UNSIGNED,
//         allowNull: false,
//       },

//       allocated: {
//         type: DataTypes.DECIMAL(5, 2),
//         allowNull: false,
//         defaultValue: 0,
//       },

//       used: {
//         type: DataTypes.DECIMAL(5, 2),
//         allowNull: false,
//         defaultValue: 0,
//       },

//       pending: {
//         type: DataTypes.DECIMAL(5, 2),
//         allowNull: false,
//         defaultValue: 0,
//       },

//       carried_forward: {
//         type: DataTypes.DECIMAL(5, 2),
//         allowNull: false,
//         defaultValue: 0,
//       },

//       created_at: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: DataTypes.NOW,
//       },

//       updated_at: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: DataTypes.NOW,
//       },
//     });

//     await queryInterface.addIndex(
//       'employee_leave_balances',
//       ['employee_id', 'leave_type_id', 'year'],
//       {
//         unique: true,
//         name: 'unique_employee_leave_year',
//       }
//     );

//     await queryInterface.addIndex(
//       'employee_leave_balances',
//       ['employee_id'],
//       {
//         name: 'idx_employee_leave_balance_employee',
//       }
//     );

//     await queryInterface.addIndex(
//       'employee_leave_balances',
//       ['leave_type_id'],
//       {
//         name: 'idx_employee_leave_balance_type',
//       }
//     );
//   },

//   async down(queryInterface: QueryInterface) {
//     await queryInterface.dropTable('employee_leave_balances');
//   },
// };


import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('employee_leave_balances', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      employee_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },

      leave_type_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },

      year: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
      },

      // Total leave allocated for the year
      allocated: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
      },

      // Total leave already used
      used: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
      },

      // Leave currently requested but not yet approved/rejected
      pending: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
      },

      // Leave carried forward from previous year
      carried_forward: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
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

    // One balance record per employee,
    // per leave type, per year.
    await queryInterface.addIndex(
      'employee_leave_balances',
      ['employee_id', 'leave_type_id', 'year'],
      {
        unique: true,
        name: 'employee_leave_balance_unique',
      }
    );

    // Faster lookup by employee
    await queryInterface.addIndex(
      'employee_leave_balances',
      ['employee_id'],
      {
        name: 'employee_leave_balance_employee_idx',
      }
    );

    // Faster lookup by leave type
    await queryInterface.addIndex(
      'employee_leave_balances',
      ['leave_type_id'],
      {
        name: 'employee_leave_balance_leave_type_idx',
      }
    );

    // Faster lookup by year
    await queryInterface.addIndex(
      'employee_leave_balances',
      ['year'],
      {
        name: 'employee_leave_balance_year_idx',
      }
    );
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('employee_leave_balances');
  },
};