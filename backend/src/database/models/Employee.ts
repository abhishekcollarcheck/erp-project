import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { PROBATION_STATUS } from '../../modules/employees/employee.constants';

interface EmployeeAttrs {
  id:                     number;
  avatar_url?:            string | null;
  employee_code:          string | null;
  reference_code:         string | null;
  status:                 'Active' | 'Left' | 'Retired' | 'On Notice' | 'Relieved' | 'Absconded' | 'Inactive';
  record_status:          'Draft' | 'Final';
  first_name:             string;
  middle_name?:           string | null;
  last_name:              string;
  company_id:             number;
  employment_type:        'Permanent' | 'Contract' | 'Intern' | 'Consultant' | 'Probation';
  department_id:          number;
  sub_department_id:      number | null;
  designation_id:         number;
  sub_designation_id:     number | null;
  email:                  string;
  phone:                  string;
  form_completion_pct:    number;

  portal_access:          boolean;
  is_super_admin:         boolean;
  otp_hash?:              string | null;
  otp_expires?:           Date | null;
  otp_attempts:           number;
  otp_locked_until?:      Date | null;
  refresh_token?:         string | null;
  refresh_expires?:       Date | null;
  last_login_at?:         Date | null;
  must_change_password:   boolean;

  created_by?:            number | null;
  updated_by?:            number | null;
  deleted_by?:            number | null;
  created_at?:            Date;
  updated_at?:            Date;
  deleted_at?:            Date | null;
}

type EmployeeCreation = Optional<EmployeeAttrs,
  'id' | 'avatar_url' | 'employee_code' | 'reference_code' | 'record_status'
  | 'company_id' | 'department_id' | 'sub_department_id' | 'designation_id' | 'sub_designation_id'
  | 'middle_name'
  | 'form_completion_pct' | 'portal_access' | 'is_super_admin' | 'otp_hash' | 'otp_expires'
  | 'otp_attempts' | 'otp_locked_until' | 'refresh_token' | 'refresh_expires'
  | 'last_login_at' | 'must_change_password'
  | 'created_by' | 'updated_by' | 'deleted_by' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export class Employee extends Model<EmployeeAttrs, EmployeeCreation> implements EmployeeAttrs {
  public id!:                    number;
  public avatar_url!:            string | null;
  public employee_code!:         string | null;
  public reference_code!:        string | null;
  public status!:                'Active' | 'Left' | 'Retired' | 'On Notice' | 'Relieved' | 'Absconded' | 'Inactive';
  public record_status!:         'Draft' | 'Final';
  public first_name!:            string;
  public middle_name!:           string | null;
  public last_name!:             string;
  public company_id!:            number;
  public employment_type!:       'Permanent' | 'Contract' | 'Intern' | 'Consultant' | 'Probation';
  public department_id!:         number;
  public sub_department_id!:     number | null;
  public designation_id!:        number;
  public sub_designation_id!:    number | null;
  public email!:                 string;
  public phone!:                 string;
  public form_completion_pct!:   number;
  public portal_access!:         boolean;
  public is_super_admin!:        boolean;
  public otp_hash!:              string | null;
  public otp_expires!:           Date | null;
  public otp_attempts!:          number;
  public otp_locked_until!:      Date | null;
  public refresh_token!:         string | null;
  public refresh_expires!:       Date | null;
  public last_login_at!:         Date | null;
  public must_change_password!:  boolean;
  public created_by!:            number | null;
  public updated_by!:            number | null;
  public deleted_by!:            number | null;
  public readonly created_at!:   Date;
  public readonly updated_at!:   Date;
  public readonly deleted_at!:   Date | null;

  get fullName(): string {
    return [this.first_name, this.middle_name, this.last_name].filter(Boolean).join(' ');
  }
  get canLogin(): boolean { return this.portal_access && !this.deleted_at; }
  get isLocked(): boolean { return !!this.otp_locked_until && this.otp_locked_until > new Date(); }

  public locationAttendance?: any;
  public managersWorkContact?: any;
  public l1Manager?: Employee;
  public l2Manager?: Employee;
  public commitmentProbation?: any;
  public schemes?: any;
  public personal?: any;
  public family?: any;
  public familyMembers?: any[];
  public addresses?: any[];
  public emergencyContacts?: any[];
  public statutory?: any;
  public vaccinations?: any[];
  public documents?: any[];
  public bankDetails?: any[];
  public salaries?: any[];
  public assetDeduction?: any;
  public experience?: any[];
  public education?: any[];
  public onboardingDocs?: any;
  public transfers?: any[];
  public exit?: any;
}

Employee.init({
  id:                     { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  avatar_url:             { type: DataTypes.STRING(500), allowNull: true },
  employee_code:          { type: DataTypes.STRING(30), allowNull: true },
  reference_code:         { type: DataTypes.STRING(50), allowNull: true },
  status:                 { type: DataTypes.ENUM('Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive'), defaultValue: 'Active' },
  record_status:          { type: DataTypes.ENUM('Draft', 'Final'), defaultValue: 'Draft', allowNull: false },
  first_name:             { type: DataTypes.STRING(100), allowNull: false },
  middle_name:            { type: DataTypes.STRING(100), allowNull: true },
  last_name:              { type: DataTypes.STRING(100), allowNull: false },
  company_id:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'companies', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  employment_type:        { type: DataTypes.ENUM('Permanent', 'Contract', 'Intern', 'Consultant', 'Probation'), defaultValue: 'Permanent' },
  department_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'departments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  sub_department_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'sub_departments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  designation_id:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'designations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  sub_designation_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'sub_designations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  email:                  { type: DataTypes.STRING(255), allowNull: false },
  phone:                  { type: DataTypes.STRING(20), allowNull: false },
  form_completion_pct:    { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
  portal_access:          { type: DataTypes.BOOLEAN, defaultValue: true },
  is_super_admin:         { type: DataTypes.BOOLEAN, defaultValue: false },
  otp_hash:               { type: DataTypes.STRING(255), allowNull: true },
  otp_expires:            { type: DataTypes.DATE, allowNull: true },
  otp_attempts:           { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  otp_locked_until:       { type: DataTypes.DATE, allowNull: true },
  refresh_token:          { type: DataTypes.TEXT, allowNull: true },
  refresh_expires:        { type: DataTypes.DATE, allowNull: true },
  last_login_at:          { type: DataTypes.DATE, allowNull: true },
  must_change_password:   { type: DataTypes.BOOLEAN, defaultValue: false },
  created_by:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  updated_by:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  deleted_by:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  sequelize, tableName: 'employees', modelName: 'Employee',
  paranoid: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at',
  indexes: [
    { unique: true, fields: ['employee_code'], where: { deleted_at: null } },
    { unique: true, fields: ['reference_code'], where: { deleted_at: null } },
    { fields: ['status'] },
    { fields: ['portal_access'] },
    { fields: ['is_super_admin'] },
    { fields: ['company_id'] },
    { fields: ['department_id'] },
    { fields: ['designation_id'] },
  ],
});

export class EmployeeLocationAttendance extends Model {
  public employee_id!:           number;
  public working_state_country!: number | null;
  public working_city!:          number | null;
  public working_site!:          number | null;
  public pay_register_location!: number | null;
  public actual_doj!:            Date;
  public weekly_off!:            number | null;
  public shift_category!:        'Shift' | 'Duration';
  public shift_id!:              number | null;
  public grace_minutes!:         number | null;
}
EmployeeLocationAttendance.init({
  employee_id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
  working_state_country:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  working_city:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  working_site:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  pay_register_location:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  actual_doj:             { type: DataTypes.DATEONLY, allowNull: false },
  weekly_off:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  shift_category:         { type: DataTypes.ENUM('Shift', 'Duration'), allowNull: false, defaultValue: 'Duration' },
  shift_id:               { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'shift', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
  grace_minutes:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { sequelize, tableName: 'employee_location_attendance', modelName: 'EmployeeLocationAttendance', timestamps: true });

export class EmployeeManagersWorkContact extends Model {
  public employee_id!:      number;
  public l1_manager_id!:    number | null;
  public l2_manager_id!:    number | null;
  public official_email!:   string | null;
  public official_mobile!:  string | null;
}
EmployeeManagersWorkContact.init({
  employee_id:      { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
  l1_manager_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
  l2_manager_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'employees', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
  official_email:   { type: DataTypes.STRING(255), allowNull: true },
  official_mobile:  { type: DataTypes.STRING(20), allowNull: true },
}, {
  sequelize, tableName: 'employee_managers_work_contact', modelName: 'EmployeeManagersWorkContact', timestamps: true,
  indexes: [{ fields: ['l1_manager_id'] }],
});

export class EmployeeCommitmentProbation extends Model {
  public employee_id!:               number;
  public commitment!:                boolean;
  public commitment_term!:           string | null;
  public commitment_entered_on!:     Date | null;
  public commitment_end_date!:       Date | null;
  public on_probation!:              boolean;
  public probation_period!:          string | null;
  public probation_end_date!:        Date | null;
  public probation_status!:          string | null;
}
EmployeeCommitmentProbation.init({
  employee_id:               { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  commitment:                { type: DataTypes.BOOLEAN, defaultValue: false },
  commitment_term:           { type: DataTypes.ENUM('36 Months', '60 Months', 'N/A'), defaultValue: null, allowNull: true },
  commitment_entered_on:     { type: DataTypes.DATEONLY, allowNull: true },
  commitment_end_date:       { type: DataTypes.DATEONLY, allowNull: true },
  on_probation:              { type: DataTypes.BOOLEAN, defaultValue: true },
  probation_period:          { type: DataTypes.STRING(30), allowNull: true },
  probation_end_date:        { type: DataTypes.DATEONLY, allowNull: true },
  probation_status:          { type: DataTypes.ENUM(...PROBATION_STATUS), defaultValue: null, allowNull: true },
}, { sequelize, tableName: 'employee_commitment_probation', modelName: 'EmployeeCommitmentProbation', timestamps: true });

export class EmployeeSchemes extends Model {
  public employee_id!: number;

  // Provident Fund
  public pf_status!: boolean;
  public uan_number!: string | null;
  public epfo_member_id!: string | null;
  public pf_contribution_pct!: number | null;
  public pf_employer_from!: string | null;
  public pf_employee_12!: number | null;
  public eps_employer_833!: number | null;
  public epf_eps_diff_367!: number | null;

  // ESI
  public esic_status!: boolean;
  public esic_number!: string | null;
  public esi_employee_pct!: number | null;
  public esi_employer_pct!: number | null;

  // Mediclaim
  public mediclaim_status!: 'Yes' | 'No' | 'Not Applicable' | null;
  public mediclaim_number!: string | null;
  public mediclaim_amount!: string | null;

  // RD Scheme
  public rd_scheme!: boolean;
  public rd_term!: string | null;
  public rd_opening_date!: Date | null;
  public rd_account_number!: string | null;
  public rd_deduction_from!: 'Salary' | 'AMDB' | 'N/A' | null;
  public rd_amount_employee!: number | null;
  public rd_amount_employer!: number | null;
  public ttl_m_contribution!: number | null;
  public rd_maturity_date!: Date | null;
  public rd_maturity_amount!: number | null;
  public rd_status!: 'Yes' | 'No' | 'Not Applicable' | null;
}
EmployeeSchemes.init({
  employee_id:         { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  pf_status:           { type: DataTypes.BOOLEAN, defaultValue: false },
  uan_number:          { type: DataTypes.STRING(20), allowNull: true },
  epfo_member_id:      { type: DataTypes.STRING(30), allowNull: true },
  pf_contribution_pct: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  pf_employer_from:    { type: DataTypes.STRING(100), allowNull: true },
  pf_employee_12:      { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  eps_employer_833:    { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  epf_eps_diff_367:    { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  esic_status:         { type: DataTypes.BOOLEAN, defaultValue: false },
  esic_number:         { type: DataTypes.STRING(30), allowNull: true },
  esi_employee_pct:    { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  esi_employer_pct:    { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  mediclaim_status:    { type: DataTypes.ENUM('Yes', 'No', 'Not Applicable'), defaultValue: 'No' },
  mediclaim_number:    { type: DataTypes.STRING(50), allowNull: true },
  mediclaim_amount:    { type: DataTypes.ENUM('150000', '250000', '400000', '500000', 'Not Applicable'), allowNull: true },
  rd_scheme:           { type: DataTypes.BOOLEAN, defaultValue: false },
  rd_term:             { type: DataTypes.ENUM('6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A'), allowNull: true },
  rd_opening_date:     { type: DataTypes.DATEONLY, allowNull: true },
  rd_account_number:   { type: DataTypes.STRING(50), allowNull: true },
  rd_deduction_from:   { type: DataTypes.ENUM('Salary', 'AMDB', 'N/A'), allowNull: true },
  rd_amount_employee:  { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  rd_amount_employer:  { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  ttl_m_contribution:  { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  rd_maturity_date:    { type: DataTypes.DATEONLY, allowNull: true },
  rd_maturity_amount:  { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  rd_status:           { type: DataTypes.ENUM('Yes', 'No', 'Not Applicable'), allowNull: true },
}, { sequelize, tableName: 'employee_schemes', modelName: 'EmployeeSchemes', timestamps: true });

export class EmployeeSalary extends Model {
  public id!:               number;
  public employee_id!:      number;
  public salary_type!:      'current' | 'joining';
  public salary_mode!:      'Bank Transfer' | 'Cash' | 'Cheque' | null;
  public basic!:            number | null;
  public hra!:              number | null;
  public allowance1!:       number | null;
  public gross_salary_pm!:  number | null;
  public amdb_pm!:          number | null;
  public total_earning_pm!: number | null;
  public effective_from!:   Date | null;
}
EmployeeSalary.init({
  id:               { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  salary_type:      { type: DataTypes.ENUM('current', 'joining'), allowNull: false },
  salary_mode:      { type: DataTypes.ENUM('Bank Transfer', 'Cash', 'Cheque'), allowNull: true },
  basic:            { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  hra:              { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  allowance1:       { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  gross_salary_pm:  { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  amdb_pm:          { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  total_earning_pm: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  effective_from:   { type: DataTypes.DATEONLY, allowNull: true },
}, { sequelize, tableName: 'employee_salary', modelName: 'EmployeeSalary', timestamps: true,
  indexes: [{ unique: true, fields: ['employee_id', 'salary_type'] }] });

export class EmployeeAssetDeduction extends Model {
  public employee_id!:                 number;
  public asset_deduction_applicable!:  boolean;
  public security_amount!:             number | null;
  public deduction_months!:            number | null;
  public deduction_from!:              'Salary' | 'AMDB' | 'N/A' | null;
  public monthly_deduction!:           number | null;
  public final_monthly_deduction!:     number | null;
  public last_installment!:            number | null;
}
EmployeeAssetDeduction.init({
  employee_id:                 { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  asset_deduction_applicable:  { type: DataTypes.BOOLEAN, defaultValue: false },
  security_amount:             { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  deduction_months:            { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  deduction_from:              { type: DataTypes.ENUM('Salary', 'AMDB', 'N/A'), allowNull: true },
  monthly_deduction:           { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  final_monthly_deduction:     { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  last_installment:            { type: DataTypes.DECIMAL(12, 2), allowNull: true },
}, { sequelize, tableName: 'employee_asset_deduction', modelName: 'EmployeeAssetDeduction', timestamps: true });

export class EmployeeOnboardingDocs extends Model {
  public employee_id!:            number;
  public offer_letter!:           boolean;
  public address_verification!:   boolean;
  public service_agreement!:      boolean;
  public indemnity_bond!:         boolean;
  public asset_deduction_letter!: boolean;
  public account_opening_letter!: boolean;
  public nda!:                    boolean;
  public remarks!:                string | null;
}
EmployeeOnboardingDocs.init({
  employee_id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  offer_letter:             { type: DataTypes.BOOLEAN, defaultValue: false },
  address_verification:     { type: DataTypes.BOOLEAN, defaultValue: false },
  service_agreement:        { type: DataTypes.BOOLEAN, defaultValue: false },
  indemnity_bond:           { type: DataTypes.BOOLEAN, defaultValue: false },
  asset_deduction_letter:   { type: DataTypes.BOOLEAN, defaultValue: false },
  account_opening_letter:   { type: DataTypes.BOOLEAN, defaultValue: false },
  nda:                      { type: DataTypes.BOOLEAN, defaultValue: false },
  remarks:                  { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'employee_onboarding_docs', modelName: 'EmployeeOnboardingDocs', timestamps: true });

export class EmployeePersonal extends Model {
  public employee_id!: number;
  public date_of_birth!: Date | null;
  public gender!: string | null;
  public shirt_size!: string | null;
  public tshirt_size!: string | null;
  public nationality!: string | null;
  public religion!: string | null;
  public blood_group!: string | null;
  public marital_status!: string | null;
  public marriage_date!: Date | null;
  public spouse_name!: string | null;
  public spouse_dob!: Date | null;
  public child1_name!: string | null;
  public child1_gender!: string | null;
  public child1_dob!: Date | null;
  public child2_name!: string | null;
  public child2_gender!: string | null;
  public child2_dob!: Date | null;
  public child3_name!: string | null;
  public child3_gender!: string | null;
  public child3_dob!: Date | null;
}
EmployeePersonal.init({
  employee_id:     { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  date_of_birth:   { type: DataTypes.DATEONLY, allowNull: true },
  gender:          { type: DataTypes.ENUM('Male', 'Female'), allowNull: true },
  shirt_size:      { type: DataTypes.STRING(20), allowNull: true },
  tshirt_size:     { type: DataTypes.STRING(20), allowNull: true },
  nationality:     { type: DataTypes.STRING(100), allowNull: true },
  religion:        { type: DataTypes.STRING(100), allowNull: true },
  blood_group:     { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available'), allowNull: true },
  marital_status:  { type: DataTypes.ENUM('Unmarried', 'Married', 'Divorced', 'Widow', 'Widower'), allowNull: true },
  marriage_date:   { type: DataTypes.DATEONLY, allowNull: true },
  spouse_name:     { type: DataTypes.STRING(200), allowNull: true },
  spouse_dob:      { type: DataTypes.DATEONLY, allowNull: true },
  child1_name:     { type: DataTypes.STRING(200), allowNull: true },
  child1_gender:   { type: DataTypes.ENUM('Male', 'Female'), allowNull: true },
  child1_dob:      { type: DataTypes.DATEONLY, allowNull: true },
  child2_name:     { type: DataTypes.STRING(200), allowNull: true },
  child2_gender:   { type: DataTypes.ENUM('Male', 'Female'), allowNull: true },
  child2_dob:      { type: DataTypes.DATEONLY, allowNull: true },
  child3_name:     { type: DataTypes.STRING(200), allowNull: true },
  child3_gender:   { type: DataTypes.ENUM('Male', 'Female'), allowNull: true },
  child3_dob:      { type: DataTypes.DATEONLY, allowNull: true },
}, { sequelize, tableName: 'employee_personal', modelName: 'EmployeePersonal', timestamps: true });

export class EmployeeAddress extends Model {
  public id!: number;
  public employee_id!: number;

  public address_type!: 'present' | 'permanent';

  public house_type!:
    | 'Owned'
    | 'Rented'
    | 'Company Provided'
    | 'PG / Hostel'
    | 'Other'
    | null;

  public house_no!: string | null;
  public area!: string | null;
  public district!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  public pincode!: string | null;

  // Only relevant for permanent address
  public perm_address_type!:
    | 'Same as Present'
    | 'Different'
    | 'Not Applicable'
    | null;
}

EmployeeAddress.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    address_type: {
      type: DataTypes.ENUM('present', 'permanent'),
      allowNull: false,
    },

    house_type: {
      type: DataTypes.ENUM(
        'Owned',
        'Rented',
        'Company Provided',
        'PG / Hostel',
        'Other'
      ),
      allowNull: true,
    },

    house_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    area: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },

    district: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'India',
    },

    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    perm_address_type: {
      type: DataTypes.ENUM(
        'Same as Present',
        'Different',
        'Not Applicable'
      ),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'employee_addresses',
    modelName: 'EmployeeAddress',
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'address_type'],
      },
    ],
  }
);
export class EmployeeFamily extends Model {
  public employee_id!:       number;
  public father_salutation!: string | null;
  public father_name!:       string | null;
  public father_dob!:        Date | null;
  public father_occupation!: string | null;
  public mother_salutation!: string | null;
  public mother_name!:       string | null;
  public mother_dob!:        Date | null;
  public mother_occupation!: string | null;
}
EmployeeFamily.init({
  employee_id:        { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  father_salutation:  { type: DataTypes.ENUM('Mr.', 'Dr.', 'Late'), allowNull: true },
  father_name:        { type: DataTypes.STRING(200), allowNull: true },
  father_dob:         { type: DataTypes.DATEONLY, allowNull: true },
  father_occupation:  { type: DataTypes.STRING(100), allowNull: true },
  mother_salutation:  { type: DataTypes.ENUM('Mrs.', 'Ms.', 'Dr.', 'Late'), allowNull: true },
  mother_name:        { type: DataTypes.STRING(200), allowNull: true },
  mother_dob:         { type: DataTypes.DATEONLY, allowNull: true },
  mother_occupation:  { type: DataTypes.STRING(100), allowNull: true },
}, { sequelize, tableName: 'employee_family', modelName: 'EmployeeFamily', timestamps: true });

export class EmployeeFamilyMember extends Model {
  public id!:           number;
  public employee_id!:  number;
  public name!:          string;
  public relationship!:  string | null;
  public relationship_other!: string | null;
  public salutation!:    string | null;
  public dob!:            Date | null;
  public occupation!:     string | null;
}
EmployeeFamilyMember.init({
  id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name:          { type: DataTypes.STRING(200), allowNull: false },
  relationship:  { type: DataTypes.STRING(100), allowNull: true },
  relationship_other: { type: DataTypes.STRING(100), allowNull: true },
  salutation:    { type: DataTypes.STRING(10), allowNull: true },
  dob:           { type: DataTypes.DATEONLY, allowNull: true },
  occupation:    { type: DataTypes.STRING(100), allowNull: true },
}, { sequelize, tableName: 'employee_family_members', modelName: 'EmployeeFamilyMember', timestamps: true,
  indexes: [{ fields: ['employee_id'] }] });

export class EmployeeEmergencyContact extends Model {
  public id!:             number;
  public employee_id!:    number;
  public contact_name!:   string;
  public contact_number!: string;
  public email!:          string | null;
  public relationship!:   string;
  public relationship_other!: string | null;
  public is_primary!:     boolean;
}
EmployeeEmergencyContact.init({
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  contact_name:   { type: DataTypes.STRING(200), allowNull: false },
  contact_number: { type: DataTypes.STRING(20), allowNull: false },
  email:          { type: DataTypes.STRING(255), allowNull: true },
  relationship:   { type: DataTypes.STRING(100), allowNull: false },
  relationship_other: { type: DataTypes.STRING(100), allowNull: true },
  is_primary:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'employee_emergency_contacts', modelName: 'EmployeeEmergencyContact', timestamps: true });

export class EmployeeStatutory extends Model {
  public employee_id!:            number;
  public aadhaar_number!:         string | null;
  public aadhaar_name!:           string | null;
  public aadhaar_dob!:            Date | null;
  public aadhaar_address!:        string | null;
  public aadhaar_scan_url!:       string | null;
  public pan_number!:             string | null;
  public pan_full_name!:          string | null;
  public pan_dob!:                Date | null;
  public pan_parent_spouse_name!: string | null;
  public pan_scan_url!:           string | null;
  public passport_number!:        string | null;
  public passport_full_name!:     string | null;
  public passport_nationality!:   string | null;
  public passport_issue_date!:    Date | null;
  public passport_expiry!:        Date | null;
  public passport_place_of_issue!: string | null;
  public passport_scan_url!:      string | null;
  public driving_license_number!: string | null;
  public driving_license_name!:   string | null;
  public driving_license_issue_date!: Date | null;
  public driving_license_expiry!: Date | null;
  public driving_license_authority!: string | null;
  public driving_license_scan_url!: string | null;
  public yellow_fever!:           boolean;
  public yellow_fever_date!:      Date | null;
}
EmployeeStatutory.init({
  employee_id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  aadhaar_number:           { type: DataTypes.STRING(12), allowNull: true },
  aadhaar_name:             { type: DataTypes.STRING(200), allowNull: true },
  aadhaar_dob:              { type: DataTypes.DATEONLY, allowNull: true },
  aadhaar_address:          { type: DataTypes.TEXT, allowNull: true },
  aadhaar_scan_url:         { type: DataTypes.STRING(500), allowNull: true },
  pan_number:               { type: DataTypes.STRING(10), allowNull: true },
  pan_full_name:            { type: DataTypes.STRING(200), allowNull: true },
  pan_dob:                  { type: DataTypes.DATEONLY, allowNull: true },
  pan_parent_spouse_name:   { type: DataTypes.STRING(200), allowNull: true },
  pan_scan_url:             { type: DataTypes.STRING(500), allowNull: true },
  passport_number:          { type: DataTypes.STRING(30), allowNull: true },
  passport_full_name:       { type: DataTypes.STRING(200), allowNull: true },
  passport_nationality:     { type: DataTypes.STRING(100), allowNull: true },
  passport_issue_date:      { type: DataTypes.DATEONLY, allowNull: true },
  passport_expiry:          { type: DataTypes.DATEONLY, allowNull: true },
  passport_place_of_issue:  { type: DataTypes.STRING(200), allowNull: true },
  passport_scan_url:        { type: DataTypes.STRING(500), allowNull: true },
  driving_license_number:   { type: DataTypes.STRING(30), allowNull: true },
  driving_license_name:     { type: DataTypes.STRING(200), allowNull: true },
  driving_license_issue_date: { type: DataTypes.DATEONLY, allowNull: true },
  driving_license_expiry:   { type: DataTypes.DATEONLY, allowNull: true },
  driving_license_authority: { type: DataTypes.STRING(200), allowNull: true },
  driving_license_scan_url: { type: DataTypes.STRING(500), allowNull: true },
  yellow_fever:             { type: DataTypes.BOOLEAN, defaultValue: false },
  yellow_fever_date:        { type: DataTypes.DATEONLY, allowNull: true },
}, { sequelize, tableName: 'employee_statutory', modelName: 'EmployeeStatutory', timestamps: true });

export class EmployeeVaccination extends Model {
  public id!:            number;
  public employee_id!:   number;
  public vaccine_name!:  string;
  public date!:          Date | null;
  public notes!:         string | null;
}
EmployeeVaccination.init({
  id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  vaccine_name: { type: DataTypes.STRING(100), allowNull: false },
  date:         { type: DataTypes.DATEONLY, allowNull: true },
  notes:        { type: DataTypes.STRING(300), allowNull: true },
}, { sequelize, tableName: 'employee_vaccinations', modelName: 'EmployeeVaccination', timestamps: true,
  indexes: [{ fields: ['employee_id'] }] });

export class EmployeeDocument extends Model {
  public id!:            number;
  public employee_id!:   number;
  public doc_type!:      string;
  public doc_type_other!: string | null;
  public file_url!:      string;
}
EmployeeDocument.init({
  id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  doc_type:      { type: DataTypes.STRING(100), allowNull: false },
  doc_type_other:{ type: DataTypes.STRING(100), allowNull: true },
  file_url:      { type: DataTypes.STRING(500), allowNull: false },
}, { sequelize, tableName: 'employee_documents', modelName: 'EmployeeDocument', timestamps: true,
  indexes: [{ fields: ['employee_id'] }] });

export class EmployeeBankDetail extends Model {
  public id!:             number;
  public employee_id!:    number;
  public bank_type!:      'personal' | 'official';
  public bank_name!:      string | null;
  public account_number!: string | null;
  public ifsc_code!:      string | null;
  public branch_name!:    string | null;
}
EmployeeBankDetail.init({
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  bank_type:      { type: DataTypes.ENUM('personal', 'official'), allowNull: false },
  bank_name:      { type: DataTypes.STRING(200), allowNull: true },
  account_number: { type: DataTypes.STRING(30), allowNull: true },
  ifsc_code:      { type: DataTypes.STRING(15), allowNull: true },
  branch_name:    { type: DataTypes.STRING(200), allowNull: true },
}, { sequelize, tableName: 'employee_bank_details', modelName: 'EmployeeBankDetail', timestamps: true,
  indexes: [{ unique: true, fields: ['employee_id', 'bank_type'] }] });

export class EmployeeExperience extends Model {
  public id!:                       number;
  public employee_id!:              number;
  public last_company_name!:        string | null;
  public last_designation!:         string | null;
  public last_working_day!:         Date | null;
  public exp_contact_name!:         string | null;
  public exp_contact_number!:       string | null;
  public exp_contact_designation!:  string | null;
  public last_inhand_salary!:       number | null;
}
EmployeeExperience.init({
  id:                       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:              { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  last_company_name:        { type: DataTypes.STRING(300), allowNull: true },
  last_designation:         { type: DataTypes.STRING(200), allowNull: true },
  last_working_day:         { type: DataTypes.DATEONLY, allowNull: true },
  exp_contact_name:         { type: DataTypes.STRING(200), allowNull: true },
  exp_contact_number:       { type: DataTypes.STRING(20), allowNull: true },
  exp_contact_designation:  { type: DataTypes.STRING(200), allowNull: true },
  last_inhand_salary:       { type: DataTypes.DECIMAL(12, 2), allowNull: true },
}, { sequelize, tableName: 'employee_experience', modelName: 'EmployeeExperience', timestamps: true,
  indexes: [{ fields: ['employee_id'] }] });

export class EmployeeExperienceFlag extends Model {
  public employee_id!:    number;
  public is_experienced!: boolean;
}
EmployeeExperienceFlag.init({
  employee_id:    { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  is_experienced: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'employee_experience_flag', modelName: 'EmployeeExperienceFlag', timestamps: true });

export class EmployeeEducation extends Model {
  public id!:                 number;
  public employee_id!:        number;
  public highest_education!:  string | null;
  public education_stream!:   string | null;
  public education_mode!:     string | null;
  public institute_name!:     string | null;
  public education_marks!:    string | null;
  public education_start_year!: number | null;
  public education_end_year!:   number | null;
  public is_pursuing!:          boolean;
}
EmployeeEducation.init({
  id:                   { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  highest_education:    { type: DataTypes.STRING(100), allowNull: true },
  education_stream:     { type: DataTypes.STRING(100), allowNull: true },
  education_mode:       { type: DataTypes.STRING(50), allowNull: true },
  institute_name:       { type: DataTypes.STRING(300), allowNull: true },
  education_marks:      { type: DataTypes.STRING(20), allowNull: true },
  education_start_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  education_end_year:   { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  is_pursuing:          { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'employee_education', modelName: 'EmployeeEducation', timestamps: true,
  indexes: [{ fields: ['employee_id'] }] });

export class EmployeeTransfer extends Model {
  public id!:               number;
  public employee_id!:      number;
  public transfer_order!:   number;
  public transferred_on!:   Date | null;
  public new_company!:      string | null;
  public new_joining_date!: Date | null;
  public new_location!:     string | null;
  public new_department!:   string | null;
  public new_job_title!:    string | null;
  public old_company!:      string | null;
  public exit_date!:        Date | null;
  public old_location!:     string | null;
  public old_department!:   string | null;
  public old_job_title!:    string | null;
  public old_emp_code!:     string | null;
}
EmployeeTransfer.init({
  id:               { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  transfer_order:   { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  transferred_on:   { type: DataTypes.DATEONLY, allowNull: true },
  new_company:      { type: DataTypes.STRING(200), allowNull: true },
  new_joining_date: { type: DataTypes.DATEONLY, allowNull: true },
  new_location:     { type: DataTypes.STRING(200), allowNull: true },
  new_department:   { type: DataTypes.STRING(200), allowNull: true },
  new_job_title:    { type: DataTypes.STRING(200), allowNull: true },
  old_company:      { type: DataTypes.STRING(200), allowNull: true },
  exit_date:        { type: DataTypes.DATEONLY, allowNull: true },
  old_location:     { type: DataTypes.STRING(200), allowNull: true },
  old_department:   { type: DataTypes.STRING(200), allowNull: true },
  old_job_title:    { type: DataTypes.STRING(200), allowNull: true },
  old_emp_code:     { type: DataTypes.STRING(30), allowNull: true },
}, { sequelize, tableName: 'employee_transfers', modelName: 'EmployeeTransfer', timestamps: true,
  indexes: [{ fields: ['employee_id', 'transfer_order'] }] });

export class EmployeeExit extends Model {
  public employee_id!:           number;
  public resignation_submitted!: boolean;
  public resignation_date!:      Date | null;
  public notice_period!:         string | null;
  public last_working_day!:      Date | null;
  public exit_formalities_done!: boolean;
  public exit_status!:           string | null;
  public exit_remarks!:          string | null;
  public verified!:              boolean;
  public verified_by!:           string | null;
  public verification_remarks!:  string | null;
}
EmployeeExit.init({
  employee_id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  resignation_submitted:    { type: DataTypes.BOOLEAN, defaultValue: false },
  resignation_date:         { type: DataTypes.DATEONLY, allowNull: true },
  notice_period:            { type: DataTypes.STRING(50), allowNull: true },
  last_working_day:         { type: DataTypes.DATEONLY, allowNull: true },
  exit_formalities_done:    { type: DataTypes.BOOLEAN, defaultValue: false },
  exit_status:              { type: DataTypes.STRING(50), allowNull: true },
  exit_remarks:             { type: DataTypes.TEXT, allowNull: true },
  verified:                 { type: DataTypes.BOOLEAN, defaultValue: false },
  verified_by:              { type: DataTypes.STRING(200), allowNull: true },
  verification_remarks:     { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'employee_exit', modelName: 'EmployeeExit', timestamps: true });

export class EmployeeDraft extends Model {
  public id!:          number;
  public employee_id!: number | null;
  public created_by!:  number;
  public step!:        string;
  public form_data!:   object;
  public session_id!:  string;
  public expires_at!:  Date;
}
EmployeeDraft.init({
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  created_by:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  step:        { type: DataTypes.STRING(50), allowNull: false },
  form_data:   { type: DataTypes.JSON, allowNull: false },
  session_id:  { type: DataTypes.STRING(100), allowNull: false },
  expires_at:  { type: DataTypes.DATE, allowNull: false },
}, { sequelize, tableName: 'employee_drafts', modelName: 'EmployeeDraft', timestamps: true,
  indexes: [{ fields: ['created_by', 'session_id'] }, { fields: ['employee_id'] }] });