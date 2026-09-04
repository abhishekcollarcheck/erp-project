// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// export type ShiftCategory = 'STANDARD' | 'NAT';

// interface ShiftAttributes {
//   id: number; // explicit, preserved from the legacy frontend array — never auto-increment
//   label: string;
//   category: ShiftCategory;
//   start_time: string; // 'HH:MM:SS'
//   end_time: string;
//   crosses_midnight: boolean;
//   duration_minutes: number;
//   is_active: boolean;
// }

// interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'is_active'> {}

// export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
//   public id!: number;
//   public label!: string;
//   public category!: ShiftCategory;
//   public start_time!: string;
//   public end_time!: string;
//   public crosses_midnight!: boolean;
//   public duration_minutes!: number;
//   public is_active!: boolean;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// Shift.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: false }, // explicit IDs only
//     label: { type: DataTypes.STRING(100), allowNull: false },
//     category: { type: DataTypes.ENUM('STANDARD', 'NAT'), allowNull: false },
//     start_time: { type: DataTypes.TIME, allowNull: false },
//     end_time: { type: DataTypes.TIME, allowNull: false },
//     crosses_midnight: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
//     duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
//   },
//   {
//     sequelize,
//     tableName: 'shift',
//     modelName: 'Shift',
//     indexes: [{ fields: ['category'] }, { fields: ['is_active'] }],
//   },
// );



import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type DaySpan = '1 day' | '2 days';

interface ShiftAttributes {
  id: number;
  label: string; // Shift Name / Marking
  start_time: string | null; // 'HH:MM:SS' or null for Full Attendance
  end_time: string | null;
  half_day_time: string | null; // Half-day Mark
  day_span: DaySpan; // Day Span (e.g., '1 day')
  is_active: boolean;
}

interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id' | 'start_time' | 'end_time' | 'half_day_time' | 'day_span' | 'is_active'> {}

export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
  public id!: number;
  public label!: string;
  public start_time!: string ;
  public end_time!: string | null;
  public half_day_time!: string | null;
  public day_span!: DaySpan;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Shift.init(
  {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    label: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    start_time: { 
      type: DataTypes.TIME, 
      allowNull: true 
    },
    end_time: { 
      type: DataTypes.TIME, 
      allowNull: true 
    },
    half_day_time: { 
      type: DataTypes.TIME, 
      allowNull: true 
    },
    day_span: { 
      type: DataTypes.ENUM('1 day', '2 days'), 
      allowNull: false, 
      defaultValue: '1 day' 
    },
    is_active: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: true 
    },
  },
  {
    sequelize,
    tableName: 'shift',
    modelName: 'Shift',
    indexes: [{ fields: ['is_active'] }],
  },
);