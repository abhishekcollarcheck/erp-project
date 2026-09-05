// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';
// // WeeklyOffPreset lives in its own model file — imported here only so the
// // association at the bottom (WeeklyOffPreset ↔ EmployeeWeeklyOffAssignment)
// // can be wired up. Adjust the path to wherever that file actually sits.
// // Holiday is NOT imported here since nothing in this file references it
// // directly — your sandwich-day calculation service will import it there.
// import { WeeklyOffPreset } from './weeklyOffPreset';

// /* ============================================================================
//  * LEAVE MANAGEMENT — MODELS
//  * ----------------------------------------------------------------------------
//  * Covers: EL / CL / Short Leave / Special Leave / Half Day, sandwich policy,
//  * per-employee weekly-off assignment, monthly short-leave minutes tracking,
//  * special-leave crediting, and a per-day audit breakdown for every
//  * charged/sandwiched day on a request.
//  *
//  * Holiday and WeeklyOffPreset are NOT defined in this file — you already
//  * have those as separate models, so this file only imports and references
//  * them (for the EmployeeWeeklyOffAssignment association, and conceptually
//  * for wherever your sandwich-day calculation service reads them).
//  *
//  * NOTE on your original LeaveRequest: `leave_application_type` already does
//  * double duty nicely — arrival_late / leaving_early map to "Short Leave"
//  * variants (late coming / early going), first_half / second_half map to
//  * "Half Day" sessions, and full_day covers EL / CL / Special. I kept and
//  * leaned into that instead of adding a redundant "variant" column.
//  * ==========================================================================*/

// // ─── Enums ──────────────────────────────────────────────────────────────

// export type LeaveUnit = 'day' | 'minutes';
// export type LeaveApplicationType =
//   | 'arrival_late'   // short leave — late coming
//   | 'leaving_early'  // short leave — early going
//   | 'first_half'     // half day — first half
//   | 'second_half'    // half day — second half
//   | 'full_day';       // EL / CL / Special
// export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
// export type LeaveSubmissionType = 'self' | 'admin';
// export type LeaveDayKind = 'working' | 'weekly_off' | 'holiday';
// export type AccrualRuleType = 'monthly' | 'yearly' | 'custom';

// // ─── 1. Leave Type (policy master — one row per EL/CL/SHORT/SPECIAL/HALF) ─

// interface LeaveTypeAttributes {
//   id: number;
//   company_id: number;
//   name: string;
//   code: string; // EL, CL, SHORT, SPECIAL, HALF, ...
//   unit: LeaveUnit; // 'day' for EL/CL/SPECIAL/HALF, 'minutes' for SHORT
//   days_per_year: number; // annual quota in days (ignored when unit = minutes)
//   monthly_quota_minutes: number; // SHORT leave monthly quota, e.g. 60
//   split_chunk_minutes: number; // SHORT leave splittable chunk, e.g. 30
//   allow_split: boolean;
//   is_paid: boolean;
//   carry_forward: boolean;
//   max_carry_days: number;
//   min_advance_days: number; // must apply >= N days before leave start
//   max_backdate_days: number; // may apply up to N days after leave started (0 = no backdating)
//   sandwich_applies: boolean;
//   allow_half_day: boolean;
//   requires_approval: boolean;
//   is_earned: boolean; // true for SPECIAL — balance is credited manually, not auto-allocated
//   deduct_from_leave_type_id: number | null; // HALF day deducts 0.5 from this linked type (e.g. CL)
//   is_active: boolean;
// }

// export class LeaveType
//   extends Model<
//     LeaveTypeAttributes,
//     Optional<
//       LeaveTypeAttributes,
//       | 'id'
//       | 'unit'
//       | 'days_per_year'
//       | 'monthly_quota_minutes'
//       | 'split_chunk_minutes'
//       | 'allow_split'
//       | 'is_paid'
//       | 'carry_forward'
//       | 'max_carry_days'
//       | 'min_advance_days'
//       | 'max_backdate_days'
//       | 'sandwich_applies'
//       | 'allow_half_day'
//       | 'requires_approval'
//       | 'is_earned'
//       | 'deduct_from_leave_type_id'
//       | 'is_active'
//     >
//   >
//   implements LeaveTypeAttributes
// {
//   public id!: number;
//   public company_id!: number;
//   public name!: string;
//   public code!: string;
//   public unit!: LeaveUnit;
//   public days_per_year!: number;
//   public monthly_quota_minutes!: number;
//   public split_chunk_minutes!: number;
//   public allow_split!: boolean;
//   public is_paid!: boolean;
//   public carry_forward!: boolean;
//   public max_carry_days!: number;
//   public min_advance_days!: number;
//   public max_backdate_days!: number;
//   public sandwich_applies!: boolean;
//   public allow_half_day!: boolean;
//   public requires_approval!: boolean;
//   public is_earned!: boolean;
//   public deduct_from_leave_type_id!: number | null;
//   public is_active!: boolean;
// }

// LeaveType.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     name: { type: DataTypes.STRING(100), allowNull: false },
//     code: { type: DataTypes.STRING(10), allowNull: false },
//     unit: { type: DataTypes.ENUM('day', 'minutes'), allowNull: false, defaultValue: 'day' },
//     days_per_year: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
//     monthly_quota_minutes: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
//     split_chunk_minutes: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
//     allow_split: { type: DataTypes.BOOLEAN, defaultValue: false },
//     is_paid: { type: DataTypes.BOOLEAN, defaultValue: true },
//     carry_forward: { type: DataTypes.BOOLEAN, defaultValue: false },
//     max_carry_days: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
//     min_advance_days: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
//     max_backdate_days: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
//     sandwich_applies: { type: DataTypes.BOOLEAN, defaultValue: false },
//     allow_half_day: { type: DataTypes.BOOLEAN, defaultValue: false },
//     requires_approval: { type: DataTypes.BOOLEAN, defaultValue: true },
//     is_earned: { type: DataTypes.BOOLEAN, defaultValue: false },
//     deduct_from_leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
//   },
//   {
//     sequelize,
//     tableName: 'leave_types',
//     modelName: 'LeaveType',
//     timestamps: false,
//     indexes: [
//       { unique: true, fields: ['company_id', 'code'], name: 'leave_type_company_code_unique' },
//     ],
//   },
// );

// // ─── 2. Company Leave Policy (global sandwich switches, one row per company) ─

// interface LeavePolicySettingAttributes {
//   id: number;
//   company_id: number;
//   sandwich_enabled: boolean;
//   sandwich_include_weekly_off: boolean;
//   sandwich_include_holidays: boolean;
// }

// export class LeavePolicySetting
//   extends Model<
//     LeavePolicySettingAttributes,
//     Optional<LeavePolicySettingAttributes, 'id' | 'sandwich_enabled' | 'sandwich_include_weekly_off' | 'sandwich_include_holidays'>
//   >
//   implements LeavePolicySettingAttributes
// {
//   public id!: number;
//   public company_id!: number;
//   public sandwich_enabled!: boolean;
//   public sandwich_include_weekly_off!: boolean;
//   public sandwich_include_holidays!: boolean;
// }

// LeavePolicySetting.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
//     sandwich_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
//     sandwich_include_weekly_off: { type: DataTypes.BOOLEAN, defaultValue: true },
//     sandwich_include_holidays: { type: DataTypes.BOOLEAN, defaultValue: true },
//   },
//   { sequelize, tableName: 'leave_policy_settings', modelName: 'LeavePolicySetting', timestamps: true, underscored: true },
// );

// // ─── 3. Employee ↔ Weekly-Off Preset assignment ────────────────────────────

// interface EmployeeWeeklyOffAssignmentAttributes {
//   id: number;
//   employee_id: number;
//   weekly_off_preset_id: number;
// }

// export class EmployeeWeeklyOffAssignment
//   extends Model<EmployeeWeeklyOffAssignmentAttributes, Optional<EmployeeWeeklyOffAssignmentAttributes, 'id'>>
//   implements EmployeeWeeklyOffAssignmentAttributes
// {
//   public id!: number;
//   public employee_id!: number;
//   public weekly_off_preset_id!: number;
// }

// EmployeeWeeklyOffAssignment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
//     weekly_off_preset_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   { sequelize, tableName: 'employee_weekly_off_assignments', modelName: 'EmployeeWeeklyOffAssignment', timestamps: true, underscored: true },
// );

// // ─── 4. Employee Leave Balance (annual, day-based: EL / CL / SPECIAL) ─────

// interface EmployeeLeaveBalanceAttributes {
//   id: number;
//   employee_id: number;
//   leave_type_id: number;
//   year: number;
//   allocated: number;
//   used: number;
//   pending: number;
//   carried_forward: number;
// }

// export class EmployeeLeaveBalance
//   extends Model<
//     EmployeeLeaveBalanceAttributes,
//     Optional<EmployeeLeaveBalanceAttributes, 'id' | 'allocated' | 'used' | 'pending' | 'carried_forward'>
//   >
//   implements EmployeeLeaveBalanceAttributes
// {
//   public id!: number;
//   public employee_id!: number;
//   public leave_type_id!: number;
//   public year!: number;
//   public allocated!: number;
//   public used!: number;
//   public pending!: number;
//   public carried_forward!: number;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// EmployeeLeaveBalance.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
//     allocated: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
//     used: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
//     pending: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
//     carried_forward: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
//   },
//   {
//     sequelize,
//     tableName: 'employee_leave_balances',
//     modelName: 'EmployeeLeaveBalance',
//     timestamps: true,
//     underscored: true,
//     indexes: [
//       { unique: true, fields: ['employee_id', 'leave_type_id', 'year'], name: 'employee_leave_balance_unique' },
//       { fields: ['employee_id'] },
//       { fields: ['leave_type_id'] },
//       { fields: ['year'] },
//     ],
//   },
// );

// // ─── 5. Employee Short-Leave Minutes Balance (monthly quota, e.g. 60 min) ──

// interface EmployeeLeaveMinutesBalanceAttributes {
//   id: number;
//   employee_id: number;
//   leave_type_id: number;
//   year: number;
//   month: number; // 1–12
//   allocated_minutes: number;
//   used_minutes: number;
// }

// export class EmployeeLeaveMinutesBalance
//   extends Model<
//     EmployeeLeaveMinutesBalanceAttributes,
//     Optional<EmployeeLeaveMinutesBalanceAttributes, 'id' | 'allocated_minutes' | 'used_minutes'>
//   >
//   implements EmployeeLeaveMinutesBalanceAttributes
// {
//   public id!: number;
//   public employee_id!: number;
//   public leave_type_id!: number;
//   public year!: number;
//   public month!: number;
//   public allocated_minutes!: number;
//   public used_minutes!: number;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// EmployeeLeaveMinutesBalance.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
//     month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 12 } },
//     allocated_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 60 },
//     used_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
//   },
//   {
//     sequelize,
//     tableName: 'employee_leave_minutes_balances',
//     modelName: 'EmployeeLeaveMinutesBalance',
//     timestamps: true,
//     underscored: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['employee_id', 'leave_type_id', 'year', 'month'],
//         name: 'employee_leave_minutes_balance_unique',
//       },
//       { fields: ['employee_id', 'year'] },
//     ],
//   },
// );

// // ─── 6. Employee Leave Accrual (your model, corrected) ─────────────────────

// interface EmployeeLeaveAccrualAttributes {
//   id: number;
//   employee_id: number;
//   leave_type_id: number;
//   year: number;
//   month: number;
//   rule_type: AccrualRuleType;
//   days_earned: number;
//   working_days: number;
//   working_hours: number;
//   remarks?: string | null;
// }

// export class EmployeeLeaveAccrual
//   extends Model<
//     EmployeeLeaveAccrualAttributes,
//     Optional<EmployeeLeaveAccrualAttributes, 'id' | 'days_earned' | 'working_days' | 'working_hours' | 'remarks'>
//   >
//   implements EmployeeLeaveAccrualAttributes
// {
//   public id!: number;
//   public employee_id!: number;
//   public leave_type_id!: number;
//   public year!: number;
//   public month!: number;
//   public rule_type!: AccrualRuleType;
//   public days_earned!: number;
//   public working_days!: number;
//   public working_hours!: number;
//   public remarks!: string | null;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// EmployeeLeaveAccrual.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
//     month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 12 } },
//     // was a bare STRING(50) — tightened to an enum since only 3 rule shapes are used anywhere else in the system
//     rule_type: { type: DataTypes.ENUM('monthly', 'yearly', 'custom'), allowNull: false },
//     days_earned: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
//     working_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
//     working_hours: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0.0 },
//     remarks: { type: DataTypes.TEXT, allowNull: true },
//   },
//   {
//     sequelize,
//     tableName: 'employee_leave_accruals',
//     modelName: 'EmployeeLeaveAccrual',
//     timestamps: true,
//     underscored: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['employee_id', 'leave_type_id', 'year', 'month', 'rule_type'],
//         name: 'employee_leave_accrual_unique_monthly_rule',
//       },
//       { fields: ['employee_id', 'year'], name: 'employee_leave_accrual_employee_year' },
//       { fields: ['year', 'month'], name: 'employee_leave_accrual_year_month' },
//       { fields: ['leave_type_id'], name: 'employee_leave_accrual_leave_type' },
//     ],
//   },
// );

// // ─── 7. Special-Leave Credit ledger (earned by working a holiday) ─────────

// interface LeaveCreditAttributes {
//   id: number;
//   employee_id: number;
//   leave_type_id: number;
//   credit_date: string; // the holiday worked, DATEONLY
//   days: number;
//   holiday_name?: string | null;
//   note?: string | null;
//   credited_by: number;
// }

// export class LeaveCredit
//   extends Model<LeaveCreditAttributes, Optional<LeaveCreditAttributes, 'id' | 'holiday_name' | 'note'>>
//   implements LeaveCreditAttributes
// {
//   public id!: number;
//   public employee_id!: number;
//   public leave_type_id!: number;
//   public credit_date!: string;
//   public days!: number;
//   public holiday_name!: string | null;
//   public note!: string | null;
//   public credited_by!: number;
//   public readonly created_at!: Date;
// }

// LeaveCredit.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     credit_date: { type: DataTypes.DATEONLY, allowNull: false },
//     days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1.0 },
//     holiday_name: { type: DataTypes.STRING(150), allowNull: true },
//     note: { type: DataTypes.TEXT, allowNull: true },
//     credited_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   { sequelize, tableName: 'leave_credits', modelName: 'LeaveCredit', timestamps: true, underscored: true, updatedAt: false },
// );

// // ─── 8. Leave Request (your model, corrected + extended) ─────────────────

// interface LeaveRequestAttributes {
//   id: number;
//   ref_no: string; // e.g. LV-2026-0001
//   employee_id: number;
//   leave_type_id: number;
//   leave_application_type: LeaveApplicationType;
//   from_date: string;
//   to_date: string;
//   from_time?: string | null;
//   to_time?: string | null;
//   days: number; // charged days (0 for SHORT leave — use `minutes` instead)
//   minutes: number; // charged minutes (SHORT leave only)
//   working_days: number; // charged days that were normal working days
//   sandwich_days: number; // charged days that were weekly-off/holiday sandwiched in
//   half_day: boolean;
//   reason?: string | null;
//   status: LeaveRequestStatus;
//   approved_by?: number | null;
//   approved_at?: Date | null;
//   rejection_reason?: string | null;
//   submission_type: LeaveSubmissionType;
//   applied_by?: number | null;
//   applied_at: string; // DATEONLY — date the request was submitted
//   cancelled_by?: number | null;
//   cancelled_at?: Date | null;
//   hod_id?: number | null;
//   hod_name?: string | null;
//   coordinator_name?: string | null;
//   undertaking_accepted: boolean;
// }

// export class LeaveRequest
//   extends Model<
//     LeaveRequestAttributes,
//     Optional<
//       LeaveRequestAttributes,
//       | 'id'
//       | 'minutes'
//       | 'working_days'
//       | 'sandwich_days'
//       | 'half_day'
//       | 'status'
//       | 'submission_type'
//       | 'undertaking_accepted'
//       | 'leave_application_type'
//       | 'applied_at'
//     >
//   >
//   implements LeaveRequestAttributes
// {
//   public id!: number;
//   public ref_no!: string;
//   public employee_id!: number;
//   public leave_type_id!: number;
//   public leave_application_type!: LeaveApplicationType;
//   public from_date!: string;
//   public to_date!: string;
//   public from_time!: string | null;
//   public to_time!: string | null;
//   public days!: number;
//   public minutes!: number;
//   public working_days!: number;
//   public sandwich_days!: number;
//   public half_day!: boolean;
//   public reason!: string | null;
//   public status!: LeaveRequestStatus;
//   public approved_by!: number | null;
//   public approved_at!: Date | null;
//   public rejection_reason!: string | null;
//   public submission_type!: LeaveSubmissionType;
//   public applied_by!: number | null;
//   public applied_at!: string;
//   public cancelled_by!: number | null;
//   public cancelled_at!: Date | null;
//   public hod_id!: number | null;
//   public hod_name!: string | null;
//   public coordinator_name!: string | null;
//   public undertaking_accepted!: boolean;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// LeaveRequest.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     ref_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
//     employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     leave_application_type: {
//       type: DataTypes.ENUM('arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'),
//       allowNull: false,
//       defaultValue: 'full_day',
//     },
//     from_date: { type: DataTypes.DATEONLY, allowNull: false },
//     to_date: { type: DataTypes.DATEONLY, allowNull: false },
//     from_time: { type: DataTypes.STRING(5), allowNull: true },
//     to_time: { type: DataTypes.STRING(5), allowNull: true },
//     days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
//     minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
//     working_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
//     sandwich_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
//     half_day: { type: DataTypes.BOOLEAN, defaultValue: false },
//     reason: { type: DataTypes.TEXT, allowNull: true },
//     status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'), defaultValue: 'Pending' },
//     approved_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     approved_at: { type: DataTypes.DATE, allowNull: true },
//     rejection_reason: { type: DataTypes.TEXT, allowNull: true },
//     submission_type: { type: DataTypes.ENUM('self', 'admin'), defaultValue: 'self' },
//     applied_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     applied_at: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
//     cancelled_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     cancelled_at: { type: DataTypes.DATE, allowNull: true },
//     hod_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     hod_name: { type: DataTypes.STRING(200), allowNull: true },
//     coordinator_name: { type: DataTypes.STRING(200), allowNull: true },
//     undertaking_accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
//   },
//   {
//     sequelize,
//     tableName: 'leave_requests',
//     modelName: 'LeaveRequest',
//     timestamps: true,
//     underscored: true,
//     indexes: [
//       { fields: ['employee_id'] },
//       { fields: ['status'] },
//       { fields: ['hod_id'] },
//       { fields: ['applied_by'] },
//       { fields: ['leave_type_id'] },
//       { fields: ['from_date', 'to_date'] },
//     ],
//   },
// );

// // ─── 9. Per-day breakdown (audit trail for sandwich / charged days) ──────

// interface LeaveRequestDayAttributes {
//   id: number;
//   leave_request_id: number;
//   date: string; // DATEONLY
//   kind: LeaveDayKind;
//   label?: string | null; // e.g. holiday name, "Weekly off"
//   charged: number; // 0 or 1 (0.5 for half-day rows)
//   is_sandwich: boolean;
//   is_adjacent: boolean; // charged because it bridges to a separate adjacent request
// }

// export class LeaveRequestDay
//   extends Model<LeaveRequestDayAttributes, Optional<LeaveRequestDayAttributes, 'id' | 'label' | 'is_sandwich' | 'is_adjacent'>>
//   implements LeaveRequestDayAttributes
// {
//   public id!: number;
//   public leave_request_id!: number;
//   public date!: string;
//   public kind!: LeaveDayKind;
//   public label!: string | null;
//   public charged!: number;
//   public is_sandwich!: boolean;
//   public is_adjacent!: boolean;
// }

// LeaveRequestDay.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     leave_request_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     date: { type: DataTypes.DATEONLY, allowNull: false },
//     kind: { type: DataTypes.ENUM('working', 'weekly_off', 'holiday'), allowNull: false },
//     label: { type: DataTypes.STRING(150), allowNull: true },
//     charged: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
//     is_sandwich: { type: DataTypes.BOOLEAN, defaultValue: false },
//     is_adjacent: { type: DataTypes.BOOLEAN, defaultValue: false },
//   },
//   {
//     sequelize,
//     tableName: 'leave_request_days',
//     modelName: 'LeaveRequestDay',
//     timestamps: false,
//     indexes: [
//       { unique: true, fields: ['leave_request_id', 'date'], name: 'leave_request_day_unique' },
//       { fields: ['date'] },
//     ],
//   },
// );




import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
// WeeklyOffPreset lives in its own model file — imported here only so the
// association at the bottom (WeeklyOffPreset ↔ EmployeeWeeklyOffAssignment)
// can be wired up. Adjust the path to wherever that file actually sits.
// Holiday is NOT imported here since nothing in this file references it
// directly — your sandwich-day calculation service will import it there.
import { WeeklyOffPreset } from './weeklyOffPreset';
 
/* ============================================================================
 * LEAVE MANAGEMENT — MODELS
 * ----------------------------------------------------------------------------
 * Covers: EL / CL / Short Leave / Special Leave / Half Day, sandwich policy,
 * per-employee weekly-off assignment, monthly short-leave minutes tracking,
 * special-leave crediting, and a per-day audit breakdown for every
 * charged/sandwiched day on a request.
 *
 * Holiday and WeeklyOffPreset are NOT defined in this file — you already
 * have those as separate models, so this file only imports and references
 * them (for the EmployeeWeeklyOffAssignment association, and conceptually
 * for wherever your sandwich-day calculation service reads them).
 *
 * NOTE on your original LeaveRequest: `leave_application_type` already does
 * double duty nicely — arrival_late / leaving_early map to "Short Leave"
 * variants (late coming / early going), first_half / second_half map to
 * "Half Day" sessions, and full_day covers EL / CL / Special. I kept and
 * leaned into that instead of adding a redundant "variant" column.
 * ==========================================================================*/
 
// ─── Enums ──────────────────────────────────────────────────────────────
 
export type LeaveUnit = 'day' | 'minutes';
export type LeaveApplicationType =
  | 'arrival_late'   // short leave — late coming
  | 'leaving_early'  // short leave — early going
  | 'first_half'     // half day — first half
  | 'second_half'    // half day — second half
  | 'full_day';       // EL / CL / Special
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveSubmissionType = 'self' | 'admin';
export type LeaveDayKind = 'working' | 'weekly_off' | 'holiday';
export type AccrualRuleType = 'monthly' | 'yearly' | 'custom';
 
// ─── 1. Leave Type (policy master — one row per EL/CL/SHORT/SPECIAL/HALF) ─
 
interface LeaveTypeAttributes {
  id: number;
  company_id: number;
  name: string;
  code: string; // EL, CL, SHORT, SPECIAL, HALF, ...
  unit: LeaveUnit; // 'day' for EL/CL/SPECIAL/HALF, 'minutes' for SHORT
  days_per_year: number; // annual quota in days (ignored when unit = minutes)
  monthly_quota_minutes: number; // SHORT leave monthly quota, e.g. 60
  split_chunk_minutes: number; // SHORT leave splittable chunk, e.g. 30
  allow_split: boolean;
  is_paid: boolean;
  carry_forward: boolean;
  max_carry_days: number;
  min_advance_days: number; // must apply >= N days before leave start
  max_backdate_days: number; // may apply up to N days after leave started (0 = no backdating)
  sandwich_applies: boolean;
  allow_half_day: boolean;
  requires_approval: boolean;
  is_earned: boolean; // true for SPECIAL — balance is credited manually, not auto-allocated
  deduct_from_leave_type_id: number | null; // HALF day deducts 0.5 from this linked type (e.g. CL)
  is_active: boolean;
}
 
export class LeaveType
  extends Model<
    LeaveTypeAttributes,
    Optional<
      LeaveTypeAttributes,
      | 'id'
      | 'unit'
      | 'days_per_year'
      | 'monthly_quota_minutes'
      | 'split_chunk_minutes'
      | 'allow_split'
      | 'is_paid'
      | 'carry_forward'
      | 'max_carry_days'
      | 'min_advance_days'
      | 'max_backdate_days'
      | 'sandwich_applies'
      | 'allow_half_day'
      | 'requires_approval'
      | 'is_earned'
      | 'deduct_from_leave_type_id'
      | 'is_active'
    >
  >
  implements LeaveTypeAttributes
{
  public id!: number;
  public company_id!: number;
  public name!: string;
  public code!: string;
  public unit!: LeaveUnit;
  public days_per_year!: number;
  public monthly_quota_minutes!: number;
  public split_chunk_minutes!: number;
  public allow_split!: boolean;
  public is_paid!: boolean;
  public carry_forward!: boolean;
  public max_carry_days!: number;
  public min_advance_days!: number;
  public max_backdate_days!: number;
  public sandwich_applies!: boolean;
  public allow_half_day!: boolean;
  public requires_approval!: boolean;
  public is_earned!: boolean;
  public deduct_from_leave_type_id!: number | null;
  public is_active!: boolean;
}
 
LeaveType.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false },
    unit: { type: DataTypes.ENUM('day', 'minutes'), allowNull: false, defaultValue: 'day' },
    days_per_year: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    monthly_quota_minutes: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    split_chunk_minutes: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    allow_split: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_paid: { type: DataTypes.BOOLEAN, defaultValue: true },
    carry_forward: { type: DataTypes.BOOLEAN, defaultValue: false },
    max_carry_days: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    min_advance_days: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    max_backdate_days: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    sandwich_applies: { type: DataTypes.BOOLEAN, defaultValue: false },
    allow_half_day: { type: DataTypes.BOOLEAN, defaultValue: false },
    requires_approval: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_earned: { type: DataTypes.BOOLEAN, defaultValue: false },
    deduct_from_leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'leave_types',
    modelName: 'LeaveType',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['company_id', 'code'], name: 'leave_type_company_code_unique' },
    ],
  },
);
 
// ─── 2. Company Leave Policy (global sandwich switches, one row per company) ─
 
interface LeavePolicySettingAttributes {
  id: number;
  company_id: number;
  sandwich_enabled: boolean;
  sandwich_include_weekly_off: boolean;
  sandwich_include_holidays: boolean;
}
 
export class LeavePolicySetting
  extends Model<
    LeavePolicySettingAttributes,
    Optional<LeavePolicySettingAttributes, 'id' | 'sandwich_enabled' | 'sandwich_include_weekly_off' | 'sandwich_include_holidays'>
  >
  implements LeavePolicySettingAttributes
{
  public id!: number;
  public company_id!: number;
  public sandwich_enabled!: boolean;
  public sandwich_include_weekly_off!: boolean;
  public sandwich_include_holidays!: boolean;
}
 
LeavePolicySetting.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    sandwich_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    sandwich_include_weekly_off: { type: DataTypes.BOOLEAN, defaultValue: true },
    sandwich_include_holidays: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'leave_policy_settings', modelName: 'LeavePolicySetting', timestamps: true, underscored: true },
);
 
// ─── 3. Employee ↔ Weekly-Off Preset assignment ────────────────────────────
 
interface EmployeeWeeklyOffAssignmentAttributes {
  id: number;
  employee_id: number;
  weekly_off_preset_id: number;
}
 
export class EmployeeWeeklyOffAssignment
  extends Model<EmployeeWeeklyOffAssignmentAttributes, Optional<EmployeeWeeklyOffAssignmentAttributes, 'id'>>
  implements EmployeeWeeklyOffAssignmentAttributes
{
  public id!: number;
  public employee_id!: number;
  public weekly_off_preset_id!: number;
}
 
EmployeeWeeklyOffAssignment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    weekly_off_preset_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { sequelize, tableName: 'employee_weekly_off_assignments', modelName: 'EmployeeWeeklyOffAssignment', timestamps: true, underscored: true },
);
 
// ─── 4. Employee Leave Balance (annual, day-based: EL / CL / SPECIAL) ─────
 
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
    Optional<EmployeeLeaveBalanceAttributes, 'id' | 'allocated' | 'used' | 'pending' | 'carried_forward'>
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
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    allocated: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    used: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    pending: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    carried_forward: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
  },
  {
    sequelize,
    tableName: 'employee_leave_balances',
    modelName: 'EmployeeLeaveBalance',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['employee_id', 'leave_type_id', 'year'], name: 'employee_leave_balance_unique' },
      { fields: ['employee_id'] },
      { fields: ['leave_type_id'] },
      { fields: ['year'] },
    ],
  },
);
 
// ─── 5. Employee Short-Leave Minutes Balance (monthly quota, e.g. 60 min) ──
 
interface EmployeeLeaveMinutesBalanceAttributes {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  month: number; // 1–12
  allocated_minutes: number;
  used_minutes: number;
  // ADDED — without this, SHORT leave had no equivalent of the day-based
  // "pending" hold: a Pending request never reserved its minutes, so two
  // simultaneous Short Leave requests could both pass the availability
  // check and together overdraw the monthly quota. Mirrors
  // EmployeeLeaveBalance's allocated/used/pending pattern.
  pending_minutes: number;
}
 
export class EmployeeLeaveMinutesBalance
  extends Model<
    EmployeeLeaveMinutesBalanceAttributes,
    Optional<EmployeeLeaveMinutesBalanceAttributes, 'id' | 'allocated_minutes' | 'used_minutes' | 'pending_minutes'>
  >
  implements EmployeeLeaveMinutesBalanceAttributes
{
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public year!: number;
  public month!: number;
  public allocated_minutes!: number;
  public used_minutes!: number;
  public pending_minutes!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}
 
EmployeeLeaveMinutesBalance.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 12 } },
    allocated_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 60 },
    used_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    pending_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'employee_leave_minutes_balances',
    modelName: 'EmployeeLeaveMinutesBalance',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'leave_type_id', 'year', 'month'],
        name: 'employee_leave_minutes_balance_unique',
      },
      { fields: ['employee_id', 'year'] },
    ],
  },
);
 
// ─── 6. Employee Leave Accrual (your model, corrected) ─────────────────────
 
interface EmployeeLeaveAccrualAttributes {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  month: number;
  rule_type: AccrualRuleType;
  days_earned: number;
  working_days: number;
  working_hours: number;
  remarks?: string | null;
}
 
export class EmployeeLeaveAccrual
  extends Model<
    EmployeeLeaveAccrualAttributes,
    Optional<EmployeeLeaveAccrualAttributes, 'id' | 'days_earned' | 'working_days' | 'working_hours' | 'remarks'>
  >
  implements EmployeeLeaveAccrualAttributes
{
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public year!: number;
  public month!: number;
  public rule_type!: AccrualRuleType;
  public days_earned!: number;
  public working_days!: number;
  public working_hours!: number;
  public remarks!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}
 
EmployeeLeaveAccrual.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 12 } },
    // was a bare STRING(50) — tightened to an enum since only 3 rule shapes are used anywhere else in the system
    rule_type: { type: DataTypes.ENUM('monthly', 'yearly', 'custom'), allowNull: false },
    days_earned: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    working_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    working_hours: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0.0 },
    remarks: { type: DataTypes.TEXT, allowNull: true },
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
        fields: ['employee_id', 'leave_type_id', 'year', 'month', 'rule_type'],
        name: 'employee_leave_accrual_unique_monthly_rule',
      },
      { fields: ['employee_id', 'year'], name: 'employee_leave_accrual_employee_year' },
      { fields: ['year', 'month'], name: 'employee_leave_accrual_year_month' },
      { fields: ['leave_type_id'], name: 'employee_leave_accrual_leave_type' },
    ],
  },
);
 
// ─── 7. Special-Leave Credit ledger (earned by working a holiday) ─────────
 
interface LeaveCreditAttributes {
  id: number;
  employee_id: number;
  leave_type_id: number;
  credit_date: string; // the holiday worked, DATEONLY
  days: number;
  holiday_name?: string | null;
  note?: string | null;
  credited_by: number;
}
 
export class LeaveCredit
  extends Model<LeaveCreditAttributes, Optional<LeaveCreditAttributes, 'id' | 'holiday_name' | 'note'>>
  implements LeaveCreditAttributes
{
  public id!: number;
  public employee_id!: number;
  public leave_type_id!: number;
  public credit_date!: string;
  public days!: number;
  public holiday_name!: string | null;
  public note!: string | null;
  public credited_by!: number;
  public readonly created_at!: Date;
}
 
LeaveCredit.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    credit_date: { type: DataTypes.DATEONLY, allowNull: false },
    days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1.0 },
    holiday_name: { type: DataTypes.STRING(150), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    credited_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { sequelize, tableName: 'leave_credits', modelName: 'LeaveCredit', timestamps: true, underscored: true, updatedAt: false },
);
 
// ─── 8. Leave Request (your model, corrected + extended) ─────────────────
 
interface LeaveRequestAttributes {
  id: number;
  ref_no: string; // e.g. LV-2026-0001
  employee_id: number;
  leave_type_id: number;
  leave_application_type: LeaveApplicationType;
  from_date: string;
  to_date: string;
  from_time?: string | null;
  to_time?: string | null;
  days: number; // charged days (0 for SHORT leave — use `minutes` instead)
  minutes: number; // charged minutes (SHORT leave only)
  working_days: number; // charged days that were normal working days
  sandwich_days: number; // charged days that were weekly-off/holiday sandwiched in
  half_day: boolean;
  reason?: string | null;
  status: LeaveRequestStatus;
  approved_by?: number | null;
  approved_at?: Date | null;
  rejection_reason?: string | null;
  submission_type: LeaveSubmissionType;
  applied_by?: number | null;
  applied_at: string; // DATEONLY — date the request was submitted
  cancelled_by?: number | null;
  cancelled_at?: Date | null;
  hod_id?: number | null;
  hod_name?: string | null;
  coordinator_name?: string | null;
  undertaking_accepted: boolean;
}
 
export class LeaveRequest
  extends Model<
    LeaveRequestAttributes,
    Optional<
      LeaveRequestAttributes,
      | 'id'
      | 'minutes'
      | 'working_days'
      | 'sandwich_days'
      | 'half_day'
      | 'status'
      | 'submission_type'
      | 'undertaking_accepted'
      | 'leave_application_type'
      | 'applied_at'
    >
  >
  implements LeaveRequestAttributes
{
  public id!: number;
  public ref_no!: string;
  public employee_id!: number;
  public leave_type_id!: number;
  public leave_application_type!: LeaveApplicationType;
  public from_date!: string;
  public to_date!: string;
  public from_time!: string | null;
  public to_time!: string | null;
  public days!: number;
  public minutes!: number;
  public working_days!: number;
  public sandwich_days!: number;
  public half_day!: boolean;
  public reason!: string | null;
  public status!: LeaveRequestStatus;
  public approved_by!: number | null;
  public approved_at!: Date | null;
  public rejection_reason!: string | null;
  public submission_type!: LeaveSubmissionType;
  public applied_by!: number | null;
  public applied_at!: string;
  public cancelled_by!: number | null;
  public cancelled_at!: Date | null;
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
    ref_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    leave_application_type: {
      type: DataTypes.ENUM('arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'),
      allowNull: false,
      defaultValue: 'full_day',
    },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    from_time: { type: DataTypes.STRING(5), allowNull: true },
    to_time: { type: DataTypes.STRING(5), allowNull: true },
    days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    working_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    sandwich_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    half_day: { type: DataTypes.BOOLEAN, defaultValue: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'), defaultValue: 'Pending' },
    approved_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    submission_type: { type: DataTypes.ENUM('self', 'admin'), defaultValue: 'self' },
    applied_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    applied_at: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    cancelled_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    hod_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    hod_name: { type: DataTypes.STRING(200), allowNull: true },
    coordinator_name: { type: DataTypes.STRING(200), allowNull: true },
    undertaking_accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    modelName: 'LeaveRequest',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] },
      { fields: ['hod_id'] },
      { fields: ['applied_by'] },
      { fields: ['leave_type_id'] },
      { fields: ['from_date', 'to_date'] },
    ],
  },
);
 
// ─── 9. Per-day breakdown (audit trail for sandwich / charged days) ──────
 
interface LeaveRequestDayAttributes {
  id: number;
  leave_request_id: number;
  date: string; // DATEONLY
  kind: LeaveDayKind;
  label?: string | null; // e.g. holiday name, "Weekly off"
  charged: number; // 0 or 1 (0.5 for half-day rows)
  is_sandwich: boolean;
  is_adjacent: boolean; // charged because it bridges to a separate adjacent request
}
 
export class LeaveRequestDay
  extends Model<LeaveRequestDayAttributes, Optional<LeaveRequestDayAttributes, 'id' | 'label' | 'is_sandwich' | 'is_adjacent'>>
  implements LeaveRequestDayAttributes
{
  public id!: number;
  public leave_request_id!: number;
  public date!: string;
  public kind!: LeaveDayKind;
  public label!: string | null;
  public charged!: number;
  public is_sandwich!: boolean;
  public is_adjacent!: boolean;
}
 
LeaveRequestDay.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    leave_request_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    kind: { type: DataTypes.ENUM('working', 'weekly_off', 'holiday'), allowNull: false },
    label: { type: DataTypes.STRING(150), allowNull: true },
    charged: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    is_sandwich: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_adjacent: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'leave_request_days',
    modelName: 'LeaveRequestDay',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['leave_request_id', 'date'], name: 'leave_request_day_unique' },
      { fields: ['date'] },
    ],
  },
);