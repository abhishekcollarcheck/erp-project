import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';


// ─── Attributes ───────────────────────────────────────────────────────────────

interface CompanyAttributes {
  id:                    number;
  name:                  string;
  slug:                  string | null;
  code:                  string | null;
  logo_url:              string | null;
  gstin:                 string | null;
  pan:                   string | null;
  phone:                 string | null;
  email:                 string | null;
  website:               string | null;
  address:               string | null;
  city:                  string | null;
  state:                 string | null;
  pincode:               string | null;
  employee_code_start:   string | null;
  employee_code_end:     string | null;
  employee_code_skip:    string;  
  country:               string;
  industry:              string | null;
  fiscal_year:           string;
  employee_count:        number;
  timezone:              string;
  currency:              string;
  date_format:           string;
  theme_color:           string | null;  
  onboarding_step:       number;
  setup_completed_at:    Date | null;
  is_active:             boolean;
  notes:                 string | null;
  created_by:            number | null;
  created_at?:           Date;
  updated_at?:           Date;
  deleted_at?:           Date | null;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes,
  'id' | 'slug' | 'code' | 'logo_url' | 'gstin' | 'pan' | 'phone' | 'email' |
  'website' | 'address' | 'city' | 'state' | 'pincode' | 'industry' |
  'country' | 'fiscal_year' | 'employee_count' |
  'timezone' | 'currency' |
  'date_format' | 'theme_color' | 'onboarding_step' | 'setup_completed_at' | 'is_active' |
  'notes' | 'created_by'
> {}

export class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  public id!:                    number;
  public name!:                  string;
  public slug!:                  string | null;
  public code!:                  string | null;
  public logo_url!:              string | null;
  public gstin!:                 string | null;
  public pan!:                   string | null;
  public phone!:                 string | null;
  public email!:                 string | null;
  public website!:               string | null;
  public address!:               string | null;
  public city!:                  string | null;
  public state!:                 string | null;
  public pincode!:               string | null;
  public employee_code_start!:   string | null;
  public employee_code_end!:     string | null;
  public employee_code_skip!:    string;
  public country!:               string;
  public industry!:              string | null;
  public fiscal_year!:           string;
  public employee_count!:        number;
  public timezone!:              string;
  public currency!:              string;
  public date_format!:           string;
  public theme_color!:           string | null;
  public onboarding_step!:       number;
  public setup_completed_at!:    Date | null;
  public is_active!:             boolean;
  public notes!:                 string | null;
  public created_by!:            number | null;
  public readonly created_at!:   Date;
  public readonly updated_at!:   Date;
  public readonly deleted_at!:   Date | null;
}

Company.init({
  id:                    { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name:                  { type: DataTypes.STRING(200), allowNull: false },
  slug:                  { type: DataTypes.STRING(100), allowNull: true, unique: true },
  code:                  { type: DataTypes.STRING(20),  allowNull: true, unique: true },
  logo_url:              { type: DataTypes.STRING(500), allowNull: true },
  gstin:                 { type: DataTypes.STRING(20),  allowNull: true },
  pan:                   { type: DataTypes.STRING(20),  allowNull: true },
  phone:                 { type: DataTypes.STRING(20),  allowNull: true },
  email:                 { type: DataTypes.STRING(255), allowNull: true },
  website:               { type: DataTypes.STRING(300), allowNull: true },
  address:               { type: DataTypes.TEXT, allowNull: true },
  city:                  { type: DataTypes.STRING(100), allowNull: true },
  state:                 { type: DataTypes.STRING(100), allowNull: true },
  pincode:               { type: DataTypes.STRING(10),  allowNull: true },
  employee_code_start:   { type: DataTypes.STRING(10), allowNull: true, },
  employee_code_end:     { type: DataTypes.STRING(10), allowNull: true,},
  employee_code_skip:    { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]', },  
  country:               { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'India' },
  industry:              { type: DataTypes.STRING(100), allowNull: true },
  fiscal_year:           { type: DataTypes.STRING(10),  allowNull: false, defaultValue: 'Apr-Mar' },
  employee_count:        { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  timezone:              { type: DataTypes.STRING(100), defaultValue: 'Asia/Kolkata' },
  currency:              { type: DataTypes.STRING(10),  defaultValue: 'INR' },
  date_format:           { type: DataTypes.STRING(30),  defaultValue: 'DD/MM/YYYY' },
  theme_color:           { type: DataTypes.STRING(20),  allowNull: true,  defaultValue: null },
  onboarding_step:       { type: DataTypes.INTEGER,     defaultValue: 0 },
  setup_completed_at:    { type: DataTypes.DATE, allowNull: true },
  is_active:             { type: DataTypes.BOOLEAN, defaultValue: true },
  notes:                 { type: DataTypes.TEXT, allowNull: true },
  created_by:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  sequelize,
  tableName:  'companies',
  modelName:  'Company',
  paranoid:   true,
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at',
  deletedAt:  'deleted_at',
  indexes: [
    { fields: ['is_active'] },
  ],
});

// ─── CompanySettings — flexible key-value store ───────────────────────────────
interface CompanySettingAttributes {
  id:         number;
  company_id: number;
  key:        string;
  value:      string | null;
  updated_by: number | null;
}

export class CompanySetting
  extends Model<CompanySettingAttributes, Optional<CompanySettingAttributes, 'id' | 'updated_by'>>
  implements CompanySettingAttributes
{
  public id!:         number;
  public company_id!: number;
  public key!:        string;
  public value!:      string | null;
  public updated_by!: number | null;
  public readonly updated_at!: Date;
}

CompanySetting.init({
  id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  key:        { type: DataTypes.STRING(100), allowNull: false },
  value:      { type: DataTypes.TEXT, allowNull: true },
  updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  sequelize,
  tableName:  'company_settings',
  modelName:  'CompanySetting',
  timestamps: true,
  createdAt:  false,
  updatedAt:  'updated_at',
  indexes: [
    { unique: true, fields: ['company_id', 'key'] },
    { fields: ['company_id'] },
  ],
});

// ─── Well-known setting keys (for type safety in code) ────────────────────────
export const COMPANY_SETTING_KEYS = {
  LEAVE_APPROVAL_FLOW:  'leave_approval_flow',   // 'single' | 'multi'
  PROBATION_DAYS:       'probation_days',          // number as string
  PAYSLIP_FOOTER:       'payslip_footer',          // text
  WORK_WEEK:            'work_week',               // '5' | '5.5' | '6'
  ATTENDANCE_CUTOFF:    'attendance_cutoff',       // time e.g. '10:30'
  PORTAL_WELCOME_MSG:   'portal_welcome_msg',      // text
} as const;


// ─── CompanyModule — per-company module activation ─────────────────────────── 
interface CompanyModuleAttributes {
  id:            number;
  company_id:    number;
  module:        string;
  label:         string;
  is_active:     boolean;
  is_core:       boolean;    // core modules cannot be disabled
  display_order: number;
}
 
export class CompanyModule
  extends Model<CompanyModuleAttributes, Optional<CompanyModuleAttributes, 'id'>>
  implements CompanyModuleAttributes
{
  public id!:            number;
  public company_id!:    number;
  public module!:        string;
  public label!:         string;
  public is_active!:     boolean;
  public is_core!:       boolean;
  public display_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}
 
CompanyModule.init({
  id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  company_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  module:        { type: DataTypes.STRING(100), allowNull: false },
  label:         { type: DataTypes.STRING(200), allowNull: false },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  is_core:       { type: DataTypes.BOOLEAN, defaultValue: false },
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
    { fields: ['company_id', 'is_active'] },
  ],
});
 
// ─── Default module configuration ────────────────────────────────────────────
export const DEFAULT_MODULES = [
  // Core — always on
  { module: 'employees',    label: 'Employees',         is_active: true,  is_core: true,  display_order: 1 },
  { module: 'departments',  label: 'Departments',        is_active: true,  is_core: true,  display_order: 2 },
  { module: 'designations', label: 'Designations',       is_active: true,  is_core: true,  display_order: 3 },
  { module: 'settings',     label: 'Settings & RBAC',    is_active: true,  is_core: true,  display_order: 4 },
  // Default on
  { module: 'attendance',   label: 'Attendance',         is_active: true,  is_core: false, display_order: 5 },
  { module: 'leaves',       label: 'Leave Management',   is_active: true,  is_core: false, display_order: 6 },
  // Default off — activate when needed
  { module: 'payroll',      label: 'Payroll',            is_active: false, is_core: false, display_order: 7 },
  { module: 'recruitment',  label: 'Recruitment / ATS',  is_active: false, is_core: false, display_order: 8 },
  { module: 'aptitude',     label: 'Aptitude Tests',     is_active: false, is_core: false, display_order: 9 },
  { module: 'assets',       label: 'Asset Management',   is_active: false, is_core: false, display_order: 10 },
] as const;