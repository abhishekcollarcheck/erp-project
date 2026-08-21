import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// ─── Leave Type ────────────────────────────────────────────────

interface LeaveTypeAttributes {
  id: number;
  company_id: number;
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward: boolean;
  max_carry_days: number;
  is_active: boolean;
}

export class  LeaveType
  extends Model<LeaveTypeAttributes, Optional<LeaveTypeAttributes, 'id' | 'is_paid' | 'carry_forward' | 'max_carry_days' | 'is_active'>>
  implements LeaveTypeAttributes
{
  public id!: number;
  public company_id!: number;
  public name!: string;
  public code!: string;
  public days_per_year!: number;
  public is_paid!: boolean;
  public carry_forward!: boolean;
  public max_carry_days!: number;
  public is_active!: boolean;
}

LeaveType.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false },
    days_per_year: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    is_paid: { type: DataTypes.BOOLEAN, defaultValue: true },
    carry_forward: { type: DataTypes.BOOLEAN, defaultValue: false },
    max_carry_days: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'leave_types', modelName: 'LeaveType', timestamps: false },
);


// ─── 2. Flat Employee Leave Balance Table ─────────────────────
interface EmployeeLeaveBalanceAttributes {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;

  allocated: number;
  used: number;
  pending: number;
  carried_forward: number;
}

export class EmployeeLeaveBalance
  extends Model<
    EmployeeLeaveBalanceAttributes,
    Optional<
      EmployeeLeaveBalanceAttributes,
      | 'id'
      | 'allocated'
      | 'used'
      | 'pending'
      | 'carried_forward'
    >
  >
  implements EmployeeLeaveBalanceAttributes
{
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public year!: number;

  public allocated!: number;
  public used!: number;
  public pending!: number;
  public carried_forward!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmployeeLeaveBalance.init(
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

    allocated: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    used: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    pending: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    carried_forward: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    tableName: 'employee_leave_balances',
    modelName: 'EmployeeLeaveBalance',

    timestamps: true,
    underscored: true,

    indexes: [
      // One balance per employee + leave type + year
      {
        unique: true,
        fields: ['employee_id', 'leave_type_id', 'year'],
        name: 'employee_leave_balance_unique',
      },

      {
        fields: ['employee_id'],
      },

      {
        fields: ['leave_type_id'],
      },

      {
        fields: ['year'],
      },
    ],
  }
);


// ─── Leave Request ─────────────────────────────────────────────

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveSubmissionType = 'self' | 'admin';
export type LeaveApplicationType = 'arrival_late' | 'leaving_early' | 'first_half' | 'second_half' | 'full_day';

interface LeaveRequestAttributes {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_application_type: LeaveApplicationType;
  from_date: string;
  to_date: string;
  from_time?: string | null;
  to_time?: string | null;
  days: number;
  half_day: boolean;
  reason?: string | null;
  status: LeaveRequestStatus;
  approved_by?: number | null;
  approved_at?: Date | null;
  rejection_reason?: string | null;
  submission_type: LeaveSubmissionType;
  applied_by?: number | null;
  hod_id?: number | null;
  hod_name?: string | null;
  coordinator_name?: string | null;
  undertaking_accepted: boolean;
}

export class LeaveRequest
  extends Model<LeaveRequestAttributes, Optional<LeaveRequestAttributes, 'id' | 'half_day' | 'status' | 'submission_type' | 'undertaking_accepted' | 'leave_application_type'>>
  implements LeaveRequestAttributes
{
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public leave_application_type!: LeaveApplicationType;
  public from_date!: string;
  public to_date!: string;
  public from_time!: string | null;
  public to_time!: string | null;
  public days!: number;
  public half_day!: boolean;
  public reason!: string | null;
  public status!: LeaveRequestStatus;
  public approved_by!: number | null;
  public approved_at!: Date | null;
  public rejection_reason!: string | null;
  public submission_type!: LeaveSubmissionType;
  public applied_by!: number | null;
  public hod_id!: number | null;
  public hod_name!: string | null;
  public coordinator_name!: string | null;
  public undertaking_accepted!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LeaveRequest.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_application_type: {
      type: DataTypes.ENUM('arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'),
      allowNull: true,
    },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    from_time: { type: DataTypes.STRING(5), allowNull: true },
    to_time: { type: DataTypes.STRING(5), allowNull: true },
    days: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    half_day: { type: DataTypes.BOOLEAN, defaultValue: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
      defaultValue: 'Pending',
    },
    approved_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    submission_type: {
      type: DataTypes.ENUM('self', 'admin'),
      defaultValue: 'self',
    },
    applied_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    hod_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    hod_name: { type: DataTypes.STRING(200), allowNull: true },
    coordinator_name: { type: DataTypes.STRING(200), allowNull: true },
    undertaking_accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    modelName: 'LeaveRequest',
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] },
      { fields: ['hod_id'] },
      { fields: ['applied_by'] },
    ],
  },
);
