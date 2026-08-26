import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface DepartmentAttributes {
  id: number;
  department_name: string;
  department_code?: string | null;
  head_id: number | null;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'is_active'> { }

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes {
  public id!: number;
  public department_name!: string;
  public department_code!: string | null;
  public head_id!: number | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

Department.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    department_name: { type: DataTypes.STRING(200), allowNull: false },
    department_code: { type: DataTypes.STRING(20), allowNull: true }, // free-text label, not a unique identifier — intentionally unconstrained
    head_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: 'departments',
    modelName: 'Department',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        // department_name is intentionally globally unique across ALL companies,
        // not per-company scoped — confirmed decision, same pattern as
        // employees.employee_code/email/phone. No company_id column exists here
        // by design. Do not treat the absence of company_id as a bug.
        unique: true,
        fields: ['department_name']
      },
    ]
  },
);