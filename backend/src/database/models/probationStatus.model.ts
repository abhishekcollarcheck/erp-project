import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface ProbationStatusAttributes {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

interface ProbationStatusCreationAttributes
  extends Optional<ProbationStatusAttributes, 'id' | 'code' | 'display_order' | 'is_active'> {}

export class ProbationStatus
  extends Model<ProbationStatusAttributes, ProbationStatusCreationAttributes>
  implements ProbationStatusAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public display_order!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProbationStatus.init(
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
    tableName: 'probation_statuses',
    modelName: 'ProbationStatus',
    indexes: [
      { unique: true, fields: ['name'], name: 'probation_statuses_name_unique' },
      { unique: true, fields: ['code'], name: 'probation_statuses_code_unique' },
      { fields: ['display_order'] },
      { fields: ['is_active'] },
    ],
  },
);