import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface ShirtSizeAttributes {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

interface ShirtSizeCreationAttributes
  extends Optional<ShirtSizeAttributes, 'id' | 'display_order' | 'is_active'> {}

export class ShirtSize
  extends Model<ShirtSizeAttributes, ShirtSizeCreationAttributes>
  implements ShirtSizeAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ShirtSize.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'shirt_sizes', modelName: 'ShirtSize' }
);