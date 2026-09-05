import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface EmployeeTypeAttributes {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

interface EmployeeTypeCreationAttributes
  extends Optional<EmployeeTypeAttributes, 'id' | 'code' | 'display_order' | 'is_active'> {}

export class EmployeeType
  extends Model<EmployeeTypeAttributes, EmployeeTypeCreationAttributes>
  implements EmployeeTypeAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public display_order!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmployeeType.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    display_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'employee_types',
    modelName: 'EmployeeType',

    indexes: [
      {
        unique: true,
        name: 'employee_types_name_unique',
        fields: ['name'],
      },
      {
        unique: true,
        name: 'employee_types_code_unique',
        fields: ['code'],
      },
      {
        name: 'employee_types_display_order_idx',
        fields: ['display_order'],
      },
      {
        name: 'employee_types_is_active_idx',
        fields: ['is_active'],
      },
    ],
  },
);