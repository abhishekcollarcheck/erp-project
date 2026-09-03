import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface QualificationAttributes {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

interface QualificationCreationAttributes
  extends Optional<QualificationAttributes, 'id' | 'display_order' | 'is_active'> {}

export class Qualification
  extends Model<QualificationAttributes, QualificationCreationAttributes>
  implements QualificationAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Qualification.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'qualifications', modelName: 'Qualification' }
);