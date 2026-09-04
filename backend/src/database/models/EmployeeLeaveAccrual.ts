import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface EmployeeLeaveAccrualAttributes {
  id: number;

  employee_id: number;
  leave_type_id: number;

  year: number;
  month: number;

  rule_type: string;

  days_earned: number;

  working_days: number;
  working_hours: number;

  remarks?: string | null;
}

export class EmployeeLeaveAccrual
  extends Model<
    EmployeeLeaveAccrualAttributes,
    Optional<
      EmployeeLeaveAccrualAttributes,
      | 'id'
      | 'days_earned'
      | 'working_days'
      | 'working_hours'
      | 'remarks'
    >
  >
  implements EmployeeLeaveAccrualAttributes
{
  public id!: number;

  public employee_id!: number;
  public leave_type_id!: number;

  public year!: number;
  public month!: number;

  public rule_type!: string;

  public days_earned!: number;

  public working_days!: number;
  public working_hours!: number;

  public remarks!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmployeeLeaveAccrual.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
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
      validate: {
        min: 1,
        max: 12,
      },
    },

    rule_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    days_earned: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    working_days: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    working_hours: {
      type: DataTypes.DECIMAL(7, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'employee_leave_accruals',
    modelName: 'EmployeeLeaveAccrual',

    timestamps: true,
    underscored: true,

    indexes: [
      {
        unique: true,
        fields: [
          'employee_id',
          'leave_type_id',
          'year',
          'month',
          'rule_type',
        ],
        name: 'employee_leave_accrual_unique_monthly_rule',
      },

      {
        fields: ['employee_id', 'year'],
        name: 'employee_leave_accrual_employee_year',
      },

      {
        fields: ['year', 'month'],
        name: 'employee_leave_accrual_year_month',
      },

      {
        fields: ['leave_type_id'],
        name: 'employee_leave_accrual_leave_type',
      },
    ],
  }
);