import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// ─── 1. SATURDAY RULE MODEL ───────────────────────────────────────────────

interface SaturdayRuleAttributes {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface SaturdayRuleCreationAttributes
  extends Optional<SaturdayRuleAttributes, 'id' | 'display_order' | 'is_active'> {}

export class SaturdayRule
  extends Model<SaturdayRuleAttributes, SaturdayRuleCreationAttributes>
  implements SaturdayRuleAttributes
{
  public id!: number;
  public name!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SaturdayRule.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'saturday_rules',
    modelName: 'SaturdayRule',
    paranoid: true,
    indexes: [{ unique: true, fields: ['name'], name: 'saturday_rules_name_unique' }],
  }
);

// ─── 2. GRACE MINUTE MODEL ────────────────────────────────────────────────

interface GraceMinuteAttributes {
  id: number;
  name: string;
  minutes?: number | null;
  display_order: number;
  is_active: boolean;
}

interface GraceMinuteCreationAttributes
  extends Optional<GraceMinuteAttributes, 'id' | 'minutes' | 'display_order' | 'is_active'> {}

export class GraceMinute
  extends Model<GraceMinuteAttributes, GraceMinuteCreationAttributes>
  implements GraceMinuteAttributes
{
  public id!: number;
  public name!: string;
  public minutes!: number | null;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

GraceMinute.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    minutes: { type: DataTypes.INTEGER, allowNull: true },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'grace_minutes',
    modelName: 'GraceMinute',
    paranoid: true,
    indexes: [{ unique: true, fields: ['name'], name: 'grace_minutes_name_unique' }],
  }
);

// ─── 3. ATTENDANCE TYPE MODEL ─────────────────────────────────────────────

interface AttendanceTypeAttributes {
  id: number;
  name: string;
  code?: string | null;
  display_order: number;
  is_active: boolean;
}

interface AttendanceTypeCreationAttributes
  extends Optional<AttendanceTypeAttributes, 'id' | 'code' | 'display_order' | 'is_active'> {}

export class AttendanceType
  extends Model<AttendanceTypeAttributes, AttendanceTypeCreationAttributes>
  implements AttendanceTypeAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AttendanceType.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: true },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'attendance_types',
    modelName: 'AttendanceType',
    paranoid: true,
    indexes: [{ unique: true, fields: ['name'], name: 'attendance_types_name_unique' }],
  }
);