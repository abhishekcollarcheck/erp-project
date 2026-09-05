import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface BloodGroupAttributes {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

interface BloodGroupCreationAttributes
  extends Optional<BloodGroupAttributes, 'id' | 'display_order' | 'is_active'> {}

export class BloodGroup
  extends Model<BloodGroupAttributes, BloodGroupCreationAttributes>
  implements BloodGroupAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

BloodGroup.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'blood_groups',
    modelName: 'BloodGroup',
    indexes: [
      { unique: true, fields: ['name'], name: 'blood_groups_name_unique' },
      { unique: true, fields: ['code'], name: 'blood_groups_code_unique' },
    ],
  }
);