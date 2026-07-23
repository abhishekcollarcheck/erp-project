import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface HolidayAttributes {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  // NULL = applies to every company (matches your circular — one shared
  // calendar across Narula Exports, Med Freshe, Greenvac, Collar Check).
  // Set to a specific company_id only if that company later needs its own
  // distinct holiday on top of/instead of the shared calendar.
  company_id: number | null;
  is_active: boolean;
}

interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id' | 'company_id' | 'is_active'> {}

export class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
  public id!: number;
  public date!: string;
  public name!: string;
  public company_id!: number | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Holiday.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'holidays',
    modelName: 'Holiday',
    indexes: [
      { fields: ['date'] },
      { unique: true, fields: ['date', 'company_id'] }, // same date can exist once globally + once per company override
    ],
  },
);