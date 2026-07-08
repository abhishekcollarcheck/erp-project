import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface GroupFieldPermissionAttrs {
  id: number;
  company_id: number;
  group_id: number;      // → PermissionGroup.id (NOT the old Role model)
  field_id: number;      // → DynamicField.id
  can_view: boolean;
  can_edit: boolean;
  can_copy: boolean;
  can_download: boolean;
  is_masked: boolean;
  created_by?: number | null;
  updated_by?: number | null;
}

export class GroupFieldPermission
  extends Model<GroupFieldPermissionAttrs, Optional<GroupFieldPermissionAttrs, 'id' | 'can_view' | 'can_edit' | 'can_copy' | 'can_download' | 'is_masked' | 'created_by' | 'updated_by'>>
  implements GroupFieldPermissionAttrs {
  public id!: number;
  public company_id!: number;
  public group_id!: number;
  public field_id!: number;
  public can_view!: boolean;
  public can_edit!: boolean;
  public can_copy!: boolean;
  public can_download!: boolean;
  public is_masked!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

GroupFieldPermission.init({
  id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  company_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  group_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  field_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  can_view:      { type: DataTypes.BOOLEAN, defaultValue: false },
  can_edit:      { type: DataTypes.BOOLEAN, defaultValue: false },
  can_copy:      { type: DataTypes.BOOLEAN, defaultValue: false },
  can_download:  { type: DataTypes.BOOLEAN, defaultValue: false },
  is_masked:     { type: DataTypes.BOOLEAN, defaultValue: false },
  created_by:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  updated_by:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  sequelize,
  tableName: 'group_field_permissions',
  modelName: 'GroupFieldPermission',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['group_id', 'field_id'] },
    { fields: ['company_id'] },
    { fields: ['field_id'] },
  ],
});