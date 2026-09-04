import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface ExitStatusAttributes {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

interface ExitStatusCreationAttributes
  extends Optional<ExitStatusAttributes, 'id' | 'code' | 'display_order' | 'is_active'> {}

export class ExitStatus
  extends Model<ExitStatusAttributes, ExitStatusCreationAttributes>
  implements ExitStatusAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public display_order!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ExitStatus.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
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
    tableName: 'exit_statuses',
    modelName: 'ExitStatus',
    indexes: [
      { fields: ['display_order'] },
      { fields: ['is_active'] },
    ],
  },
);