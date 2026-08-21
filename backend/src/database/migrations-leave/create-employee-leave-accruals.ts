import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('employee_leave_accruals', {
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

    month: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },

    rule_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    days_earned: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    working_days: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    working_hours: {
      type: DataTypes.DECIMAL(7, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
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

  // Prevent duplicate monthly accruals
  await queryInterface.addIndex(
    'employee_leave_accruals',
    [
      'employee_id',
      'leave_type_id',
      'year',
      'month',
      'rule_type',
    ],
    {
      unique: true,
      name: 'employee_leave_accrual_unique_monthly_rule',
    }
  );

  // Employee + year lookup
  await queryInterface.addIndex(
    'employee_leave_accruals',
    ['employee_id', 'year'],
    {
      name: 'employee_leave_accrual_employee_year',
    }
  );

  // Year + month lookup
  await queryInterface.addIndex(
    'employee_leave_accruals',
    ['year', 'month'],
    {
      name: 'employee_leave_accrual_year_month',
    }
  );

  // Leave type lookup
  await queryInterface.addIndex(
    'employee_leave_accruals',
    ['leave_type_id'],
    {
      name: 'employee_leave_accrual_leave_type',
    }
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('employee_leave_accruals');
}