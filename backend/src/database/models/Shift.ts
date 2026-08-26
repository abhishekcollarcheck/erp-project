import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// NOTE: Shift is intentionally a global, shared catalog — not company-scoped.
// No company_id column by design; every company draws from the same set of
// shifts. Confirmed decision, same pattern as employees.employee_code/email/phone
// and the Department/Designation/SubDepartment/SubDesignation tables.
export type ShiftCategory = 'STANDARD' | 'NAT';

interface ShiftAttributes {
  id: number; // explicit, preserved from the legacy frontend array — never auto-increment
  label: string;
  category: ShiftCategory;
  start_time: string; // 'HH:MM:SS'
  end_time: string;
  crosses_midnight: boolean;
  duration_minutes: number;
  is_active: boolean;
}

interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'is_active'> {}

export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
  public id!: number;
  public label!: string;
  public category!: ShiftCategory;
  public start_time!: string;
  public end_time!: string;
  public crosses_midnight!: boolean;
  public duration_minutes!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Shift.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: false }, // explicit IDs only
    label: { type: DataTypes.STRING(100), allowNull: false },
    category: { type: DataTypes.ENUM('STANDARD', 'NAT'), allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    crosses_midnight: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'shift',
    modelName: 'Shift',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['category'] }, { fields: ['is_active'] }],
  },
);