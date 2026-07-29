import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from '../../config/database';

interface SubDepartmentAttributes {
  id: number;
  name: string;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

interface SubDepartmentCreationAttributes extends Optional<SubDepartmentAttributes, 'id' | 'is_active'> { }

export class SubDepartment
  extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
  implements SubDepartmentAttributes {
  public id!: number;
  public name!: string;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

SubDepartment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: 'sub_departments',
    modelName: 'SubDepartment',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['is_active']
      },
    ]
  },
);