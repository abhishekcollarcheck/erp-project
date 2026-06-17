import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface OverrideAttrs {
  id:          number;
  company_id:  number;
  group_id:    number;    // FK → permission_groups.id
  employee_id: number;    // FK → employees.id (THE identity — no users table)
  module:      string;    // e.g. 'employees', 'payroll'
  field_name:  string | null; // null = module-level; 'Aadhaar Number' = field-level
  permission:  string;    // 'view'|'edit'|'print'|'download'|'copy'|'mask'
  granted:     boolean;   // true = grant, false = revoke
  created_by:  number | null;
  created_at?: Date;
  updated_at?: Date;
}

export class EmployeePermissionOverride
  extends Model<OverrideAttrs, Optional<OverrideAttrs, 'id'>>
  implements OverrideAttrs
{
  public id!:          number;
  public company_id!:  number;
  public group_id!:    number;
  public employee_id!: number;
  public module!:      string;
  public field_name!:  string | null;
  public permission!:  string;
  public granted!:     boolean;
  public created_by!:  number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmployeePermissionOverride.init(
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    group_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
                   comment: 'FK employees.id — employee IS the identity, no users table' },
    module:      { type: DataTypes.STRING(50), allowNull: false },
    field_name:  { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    permission:  { type: DataTypes.STRING(20), allowNull: false },
    granted:     { type: DataTypes.BOOLEAN, allowNull: false },
    created_by:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName:  'employee_permission_overrides',
    modelName:  'EmployeePermissionOverride',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'group_id', 'employee_id', 'module', 'field_name', 'permission'],
        name:   'uq_emp_override',
      },
      { fields: ['employee_id'], name: 'idx_epo_employee' },
      { fields: ['group_id'],    name: 'idx_epo_group' },
    ],
  },
);
