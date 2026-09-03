import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type WeekDay = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

// Defines structured Nth-of-month rules (e.g., { weeks: [2, 4], day: 'Mon' })
export interface NthRule {
  weeks: number[]; // e.g. [2, 4] or [5]
  day: WeekDay;
}

interface WeeklyOffPresetAttributes {
  id: number;
  name: string;
  always_off: WeekDay[]; // Stored as JSON: e.g. ["Thu"]
  nth_off_rules: NthRule[]; // Stored as JSON: e.g. [{ weeks: [2, 4], day: "Mon" }]
  is_active: boolean;
}

interface WeeklyOffPresetCreationAttributes
  extends Optional<WeeklyOffPresetAttributes, 'id' | 'always_off' | 'nth_off_rules' | 'is_active'> {}

export class WeeklyOffPreset
  extends Model<WeeklyOffPresetAttributes, WeeklyOffPresetCreationAttributes>
  implements WeeklyOffPresetAttributes
{
  public id!: number;
  public name!: string;
  public always_off!: WeekDay[];
  public nth_off_rules!: NthRule[];
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

WeeklyOffPreset.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    always_off: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    nth_off_rules: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'weekly_off_preset',
    modelName: 'WeeklyOffPreset',
    indexes: [{ fields: ['is_active'] }],
  },
);