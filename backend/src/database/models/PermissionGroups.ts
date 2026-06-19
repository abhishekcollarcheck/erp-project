import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';


export const SYSTEM_GROUPS = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Full access to everything — cannot be modified',
    color: '#cc2a2a',
    is_system: true,
    slug_grants: ['employees:view', 'employees:create', 'employees:edit', 'employees:delete', 'employees:download',
      'aptitude:view', 'aptitude:create', 'aptitude:edit', 'aptitude:delete', 'aptitude:download',
      'recruitment:view', 'recruitment:create', 'recruitment:edit', 'recruitment:delete', 'recruitment:download',
      'department:view', 'department:create', 'department:edit', 'department:delete', 'department:download',
      'designation:view', 'designation:create', 'designation:edit', 'designation:delete', 'designation:download',
      'settings:view', 'settings:create', 'settings:edit', 'settings:delete', 'settings:download',
      'companies:view', 'companies:create', 'companies:edit', 'companies:delete', 'companies:download'
    ] as string[], // handled by is_super_admin flag
  },
  {
    name: 'HR Manager',
    slug: 'hr_manager',
    description: 'Full HR operations — employee lifecycle, leave, attendance',
    color: '#1e56d9',
    is_system: true,
    slug_grants: ['employees:view', 'employees:create', 'employees:edit', 'employees:delete', 'employees:download', 'aptitude:view', 'aptitude:create', 'aptitude:edit', 'aptitude:delete', 'aptitude:download', 'recruitment:view', 'recruitment:create', 'recruitment:edit', 'recruitment:delete', 'recruitment:download'] as string[], // handled by is_super_admin flag
  },
  {
    name: 'Recruiter',
    slug: 'recruiter',
    description: 'End-to-end recruitment and ATS management',
    color: '#c96f00',
    is_system: true,
    slug_grants: ['aptitude:view', 'aptitude:create', 'aptitude:edit', 'aptitude:delete', 'aptitude:download', 'recruitment:view', 'recruitment:create', 'recruitment:edit', 'recruitment:delete', 'recruitment:download'] as string[],
  },
  {
    name: 'Department Manager',
    slug: 'dept_manager',
    description: 'Manage team members, approve leaves and attendance',
    color: '#0d9669',
    is_system: true,
    slug_grants: ['department:view', 'department:create', 'department:edit', 'department:delete', 'department:download', 'designation:view', 'designation:create', 'designation:edit', 'designation:delete', 'designation:download'] as string[],
  },
  {
    name: 'Employee Self-Service',
    slug: 'employee_self',
    description: 'View own data, apply for leaves, request assets',
    color: '#94a3b8',
    is_system: true,
    slug_grants: ['employees:view'],
  },
] as const;

// ─── PermissionGroup ──────────────────────────────────────────────────────────

interface GroupAttrs {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;     // hex color for UI badge
  is_system: boolean;           // system groups cannot be deleted
  is_active: boolean;
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}


export class PermissionGroup
  extends Model<GroupAttrs, Optional<GroupAttrs, 'id' | 'is_system' | 'is_active'>>
  implements GroupAttrs {
  public id!: number;
  public company_id!: number;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public color!: string | null;
  public is_system!: boolean;
  public is_active!: boolean;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
  // associations
  public permissions?: any[];
  public members?: any[];
}

PermissionGroup.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  color: { type: DataTypes.STRING(20), allowNull: true, defaultValue: '#1e56d9' },
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  sequelize,
  tableName: 'permission_groups',
  modelName: 'PermissionGroup',
  paranoid: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [{ unique: true, fields: ['company_id', 'slug'] }],
});

// ─── GroupPermission — join: permission_group ↔ permissions ──────────────────

export class GroupPermission extends Model {
  public id!: number;
  public group_id!: number;
  public company_id!: number;
  public permission_id!: number;
}

GroupPermission.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  permission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, {
  sequelize,
  tableName: 'group_permissions',
  modelName: 'GroupPermission',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['group_id', 'company_id', 'permission_id'] },
    { fields: ['company_id'] },
  ],
});

// ─── UserGroup — join: employee ↔ permission_group ───────────────────────────
// NOTE: field is employee_id (was user_id — migrated in 002_user_groups_employee_id.sql)

export class UserGroup extends Model {
  public id!: number;
  public employee_id!: number;
  public group_id!: number;
  public company_id!: number;
  public assigned_by!: number | null;
  public readonly assigned_at!: Date;
}

UserGroup.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  // FK → employees.id (employee-as-identity — no users table)
  group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  assigned_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  tableName: 'user_groups',
  modelName: 'UserGroup',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['employee_id', 'group_id'] },
    { fields: ['company_id', 'group_id'] },
  ],
});

export class CompanyModule extends Model {
  public id!:            number;
  public company_id!:    number;
  public module!:        string;
  public label!:         string;
  public is_active!:     boolean;
  public display_order!: number;
}

CompanyModule.init({
  id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  company_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  module:        { type: DataTypes.STRING(100), allowNull: false },
  label:         { type: DataTypes.STRING(200), allowNull: false },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.SMALLINT, defaultValue: 0 },
}, {
  sequelize,
  tableName:  'company_modules',
  modelName:  'CompanyModule',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  indexes: [
    { unique: true, fields: ['company_id', 'module'] },
    { fields: ['company_id'] },
  ],
});