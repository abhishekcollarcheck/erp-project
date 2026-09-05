import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface ModeOfPaymentAttributes {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

interface ModeOfPaymentCreationAttributes
  extends Optional<ModeOfPaymentAttributes, 'id' | 'display_order' | 'is_active'> {}

export class ModeOfPayment
  extends Model<ModeOfPaymentAttributes, ModeOfPaymentCreationAttributes>
  implements ModeOfPaymentAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ModeOfPayment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'modes_of_payment',
    modelName: 'ModeOfPayment',
    indexes: [
      { unique: true, fields: ['name'], name: 'modes_of_payment_name_unique' },
      { unique: true, fields: ['code'], name: 'modes_of_payment_code_unique' },
    ],
  }
);