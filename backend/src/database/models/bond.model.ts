import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface BondAttributes {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

interface BondCreationAttributes
  extends Optional<BondAttributes, 'id' | 'code' | 'display_order' | 'is_active'> {}

export class Bond
  extends Model<BondAttributes, BondCreationAttributes>
  implements BondAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public display_order!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Bond.init(
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
    tableName: 'bonds',
    modelName: 'Bond',
    indexes: [
      { unique: true, fields: ['name'], name: 'bonds_name_unique' },
      { unique: true, fields: ['code'], name: 'bonds_code_unique' },
      { fields: ['display_order'] },
      { fields: ['is_active'] },
    ],
  },
);