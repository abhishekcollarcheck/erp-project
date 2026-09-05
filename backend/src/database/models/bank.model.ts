import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface BankAttributes {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

interface BankCreationAttributes
  extends Optional<BankAttributes, 'id' | 'display_order' | 'is_active'> {}

export class Bank
  extends Model<BankAttributes, BankCreationAttributes>
  implements BankAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Bank.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(150), allowNull: false },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'banks',
    modelName: 'Bank',
    indexes: [
      { unique: true, fields: ['name'], name: 'banks_name_unique' },
      { unique: true, fields: ['code'], name: 'banks_code_unique' },
    ],
  }
);