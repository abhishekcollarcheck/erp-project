/**
 * bulkImport.fields.ts
 * Single source of truth for the bulk-import Excel template.
 *
 * Every scalar column an admin can fill in for an employee, mapped to the wizard
 * step + DTO key it feeds. The importer, the template generator, and the
 * failed-rows file all derive from this list — add a column here and it flows
 * everywhere.
 *
 * Repeatable groups (children, family members, emergency contacts, experience,
 * education, vaccinations, extra documents) are handled separately in
 * REPEATABLE_GROUPS below since they expand into numbered columns.
 */

import type { StepKey } from './employee.constants';
import {
  EMPLOYEE_STATUS, EMPLOYMENT_TYPE, COMMITMENT_TERM, PROBATION_PERIOD, PROBATION_STATUS,
  PF_EMPLOYER_FROM, MEDICLAIM_STATUS, RD_TERM, HOUSE_TYPE, PERM_ADDRESS_TYPE,
  FATHER_SALUTATION, MOTHER_SALUTATION, SALARY_MODE, DEDUCTION_FROM,
  GENDER, BLOOD_GROUP, MARITAL_STATUS, SHIFT_CATEGORY,
} from './employee.constants';
import type { MasterOptionGroup } from './employee.masterOptions';

export type FieldType = 'str' | 'int' | 'num' | 'bool' | 'date' | 'enum' | 'master' | 'dbmaster';

/** DB-backed master lookups resolved by name (see bulkImport.mapper.ts). */
export type DbMaster =
  | 'company' | 'department' | 'designation' | 'sub_department' | 'sub_designation'
  | 'shift' | 'manager';

export interface FieldDef {
  col:      string;                 // spreadsheet header (snake_case)
  step:     StepKey | 'role_identity';
  key:      string;                 // key in the step payload / base row
  type:     FieldType;
  master?:  MasterOptionGroup;      // for type 'master'
  dbMaster?: DbMaster;              // for type 'dbmaster'
  enumValues?: readonly string[];   // for type 'enum'
  required?: boolean;               // hard-required for every row
  requiredWithStep?: boolean;       // required only if that step block has any data
  label:    string;
  help?:    string;
}

const f = (d: FieldDef): FieldDef => d;

export const FIELD_DEFS: FieldDef[] = [
  // ── Role & Identity (base employees row) ────────────────────────────────────
  f({ col: 'employee_code',     step: 'role_identity', key: 'employee_code',     type: 'str',  label: 'Employee Code', help: 'Leave blank to auto-generate when the profile is complete; set it to keep an existing code (must be unique)' }),
  f({ col: 'reference_code',       step: 'role_identity', key: 'reference_code',       type: 'str', label: 'Reference Code', help: 'Optional external/legacy tracking code (must be unique)' }),
  f({ col: 'avatar_url',           step: 'role_identity', key: 'avatar_url',           type: 'str', label: 'Avatar URL', help: 'Optional link to an already-hosted profile photo' }),
  f({ col: 'reporting_manager_code', step: 'role_identity', key: 'reporting_manager_id', type: 'dbmaster', dbMaster: 'manager', label: 'Reporting Manager (employee code)', help: 'Used for leave approvals & org chart' }),
  f({ col: 'company',           step: 'role_identity', key: 'company_id',        type: 'dbmaster', dbMaster: 'company',        label: 'Company', help: 'Company name — defaults to your company if blank' }),
  f({ col: 'first_name',        step: 'role_identity', key: 'first_name',        type: 'str',  required: true, label: 'First Name' }),
  f({ col: 'middle_name',       step: 'role_identity', key: 'middle_name',       type: 'str',  label: 'Middle Name' }),
  f({ col: 'last_name',         step: 'role_identity', key: 'last_name',         type: 'str',  required: true, label: 'Last Name' }),
  f({ col: 'email',             step: 'role_identity', key: 'email',             type: 'str',  required: true, label: 'Personal Email', help: 'Globally unique across all companies' }),
  f({ col: 'phone',             step: 'role_identity', key: 'phone',             type: 'str',  required: true, label: 'Personal Mobile', help: 'Globally unique; 10 digits or +91…' }),
  f({ col: 'status',            step: 'role_identity', key: 'status',            type: 'enum', enumValues: EMPLOYEE_STATUS, label: 'Status', help: 'Default: Active' }),
  f({ col: 'employment_type',   step: 'role_identity', key: 'employment_type',   type: 'enum', enumValues: EMPLOYMENT_TYPE, label: 'Employment Type', help: 'Default: Permanent' }),
  f({ col: 'department',        step: 'role_identity', key: 'department_id',     type: 'dbmaster', dbMaster: 'department',     required: true, label: 'Department' }),
  f({ col: 'sub_department',    step: 'role_identity', key: 'sub_department_id', type: 'dbmaster', dbMaster: 'sub_department', label: 'Sub-department' }),
  f({ col: 'designation',       step: 'role_identity', key: 'designation_id',    type: 'dbmaster', dbMaster: 'designation',    required: true, label: 'Designation' }),
  f({ col: 'sub_designation',   step: 'role_identity', key: 'sub_designation_id',type: 'dbmaster', dbMaster: 'sub_designation',label: 'Sub-designation' }),

  // ── Location & Attendance ──────────────────────────────────────────────────
  f({ col: 'working_site',          step: 'location_attendance', key: 'working_site',          type: 'master', master: 'working_site',          label: 'Working Site' }),
  f({ col: 'working_city',          step: 'location_attendance', key: 'working_city',          type: 'master', master: 'working_city',          label: 'Working City' }),
  f({ col: 'working_state_country', step: 'location_attendance', key: 'working_state_country', type: 'master', master: 'working_state_country', label: 'Working State / Country' }),
  f({ col: 'pay_register_location', step: 'location_attendance', key: 'pay_register_location', type: 'master', master: 'pay_register_location', label: 'Pay Register Location' }),
  f({ col: 'date_of_joining',       step: 'location_attendance', key: 'actual_doj',            type: 'date', requiredWithStep: true, label: 'Date of Joining', help: 'YYYY-MM-DD' }),
  f({ col: 'weekly_off',            step: 'location_attendance', key: 'weekly_off',            type: 'master', master: 'weekly_off',            label: 'Weekly Off' }),
  f({ col: 'shift_category',        step: 'location_attendance', key: 'shift_category',        type: 'enum', enumValues: SHIFT_CATEGORY, label: 'Shift Category' }),
  f({ col: 'shift',                 step: 'location_attendance', key: 'shift_id',              type: 'dbmaster', dbMaster: 'shift', label: 'Shift', help: 'Shift label' }),
  f({ col: 'grace_minutes',         step: 'location_attendance', key: 'grace_minutes',         type: 'master', master: 'grace_minutes',         label: 'Grace Minutes' }),

  // ── Managers & Work Contact ────────────────────────────────────────────────
  f({ col: 'l1_manager_code',  step: 'managers_work_contact', key: 'l1_manager_id',  type: 'dbmaster', dbMaster: 'manager', label: 'L1 Manager (employee code)' }),
  f({ col: 'l2_manager_code',  step: 'managers_work_contact', key: 'l2_manager_id',  type: 'dbmaster', dbMaster: 'manager', label: 'L2 Manager (employee code)' }),
  f({ col: 'official_email',   step: 'managers_work_contact', key: 'official_email', type: 'str', label: 'Official Email' }),
  f({ col: 'official_mobile',  step: 'managers_work_contact', key: 'official_mobile',type: 'str', label: 'Official Mobile' }),

  // ── Commitment & Probation ─────────────────────────────────────────────────
  f({ col: 'commitment',            step: 'commitment_probation', key: 'commitment',            type: 'bool', label: 'Has Commitment Bond' }),
  f({ col: 'commitment_term',       step: 'commitment_probation', key: 'commitment_term',       type: 'enum', enumValues: COMMITMENT_TERM, label: 'Commitment Term' }),
  f({ col: 'commitment_entered_on', step: 'commitment_probation', key: 'commitment_entered_on', type: 'date', label: 'Commitment Entered On' }),
  f({ col: 'on_probation',          step: 'commitment_probation', key: 'on_probation',          type: 'bool', label: 'On Probation' }),
  f({ col: 'probation_period',      step: 'commitment_probation', key: 'probation_period',      type: 'enum', enumValues: PROBATION_PERIOD, label: 'Probation Period' }),
  f({ col: 'probation_status',      step: 'commitment_probation', key: 'probation_status',      type: 'enum', enumValues: PROBATION_STATUS, label: 'Probation Status' }),

  // ── Statutory Schemes ──────────────────────────────────────────────────────
  f({ col: 'pf_status',           step: 'statutory_schemes', key: 'pf_status',           type: 'bool', label: 'PF Applicable' }),
  f({ col: 'uan_number',          step: 'statutory_schemes', key: 'uan_number',          type: 'str',  label: 'UAN Number', help: '12 digits' }),
  f({ col: 'epfo_member_id',      step: 'statutory_schemes', key: 'epfo_member_id',      type: 'str',  label: 'EPFO Member ID' }),
  f({ col: 'pf_contribution_pct', step: 'statutory_schemes', key: 'pf_contribution_pct', type: 'num',  label: 'PF Contribution %' }),
  f({ col: 'pf_employer_from',    step: 'statutory_schemes', key: 'pf_employer_from',    type: 'enum', enumValues: PF_EMPLOYER_FROM, label: 'Employer Contribution From' }),
  f({ col: 'pf_employee_12',      step: 'statutory_schemes', key: 'pf_employee_12',      type: 'num',  label: 'PF Employee (12%)' }),
  f({ col: 'eps_employer_833',    step: 'statutory_schemes', key: 'eps_employer_833',    type: 'num',  label: 'EPS Employer (8.33%)' }),
  f({ col: 'epf_eps_diff_367',    step: 'statutory_schemes', key: 'epf_eps_diff_367',    type: 'num',  label: 'EPF/EPS Diff (3.67%)' }),
  f({ col: 'esic_status',         step: 'statutory_schemes', key: 'esic_status',         type: 'bool', label: 'ESI Applicable' }),
  f({ col: 'esic_number',         step: 'statutory_schemes', key: 'esic_number',         type: 'str',  label: 'ESI Number' }),
  f({ col: 'esi_employee_pct',    step: 'statutory_schemes', key: 'esi_employee_pct',    type: 'num',  label: 'ESI Employee %' }),
  f({ col: 'esi_employer_pct',    step: 'statutory_schemes', key: 'esi_employer_pct',    type: 'num',  label: 'ESI Employer %' }),
  f({ col: 'mediclaim_status',    step: 'statutory_schemes', key: 'mediclaim_status',    type: 'enum', enumValues: MEDICLAIM_STATUS, label: 'Mediclaim Status' }),
  f({ col: 'mediclaim_number',    step: 'statutory_schemes', key: 'mediclaim_number',    type: 'str',  label: 'Mediclaim Policy Number' }),
  f({ col: 'mediclaim_amount',    step: 'statutory_schemes', key: 'mediclaim_amount',    type: 'enum', enumValues: ['150000', '250000', '400000', '500000', 'Not Applicable'], label: 'Mediclaim Amount' }),
  f({ col: 'rd_scheme',           step: 'statutory_schemes', key: 'rd_scheme',           type: 'bool', label: 'RD Scheme Applicable' }),
  f({ col: 'rd_term',             step: 'statutory_schemes', key: 'rd_term',             type: 'enum', enumValues: RD_TERM, label: 'RD Term' }),
  f({ col: 'rd_opening_date',     step: 'statutory_schemes', key: 'rd_opening_date',     type: 'date', label: 'RD Opening Date' }),
  f({ col: 'rd_account_number',   step: 'statutory_schemes', key: 'rd_account_number',   type: 'str',  label: 'RD Account Number' }),
  f({ col: 'rd_deduction_from',   step: 'statutory_schemes', key: 'rd_deduction_from',   type: 'enum', enumValues: DEDUCTION_FROM, label: 'RD Deduction From' }),
  f({ col: 'rd_amount_employee',  step: 'statutory_schemes', key: 'rd_amount_employee',  type: 'num',  label: 'RD Amount (Employee)' }),
  f({ col: 'rd_amount_employer',  step: 'statutory_schemes', key: 'rd_amount_employer',  type: 'num',  label: 'RD Amount (Employer)' }),

  // ── Compensation (sensitive) ──────────────────────────────────────────────
  f({ col: 'salary_mode',                 step: 'compensation', key: 'salary_mode',                 type: 'enum', enumValues: SALARY_MODE, label: 'Salary Mode' }),
  f({ col: 'current_basic',               step: 'compensation', key: 'current_basic',               type: 'num', label: 'Current Basic' }),
  f({ col: 'current_hra',                 step: 'compensation', key: 'current_hra',                 type: 'num', label: 'Current HRA' }),
  f({ col: 'current_allowance1',          step: 'compensation', key: 'current_allowance1',          type: 'num', label: 'Current Allowance 1' }),
  f({ col: 'current_amdb',                step: 'compensation', key: 'current_amdb',                type: 'num', label: 'Current AMDB (blank = auto 30%)' }),
  f({ col: 'joining_basic',               step: 'compensation', key: 'joining_basic',               type: 'num', label: 'Joining Basic' }),
  f({ col: 'joining_hra',                 step: 'compensation', key: 'joining_hra',                 type: 'num', label: 'Joining HRA' }),
  f({ col: 'joining_allowance1',          step: 'compensation', key: 'joining_allowance1',          type: 'num', label: 'Joining Allowance 1' }),
  f({ col: 'joining_amdb',                step: 'compensation', key: 'joining_amdb',                type: 'num', label: 'Joining AMDB' }),
  f({ col: 'asset_deduction_applicable',  step: 'compensation', key: 'asset_deduction_applicable',  type: 'bool', label: 'Asset Deduction Applicable' }),
  f({ col: 'security_amount',             step: 'compensation', key: 'security_amount',             type: 'num', label: 'Security Amount' }),
  f({ col: 'deduction_months',            step: 'compensation', key: 'deduction_months',            type: 'int', label: 'Deduction Months' }),
  f({ col: 'deduction_from',              step: 'compensation', key: 'deduction_from',              type: 'enum', enumValues: DEDUCTION_FROM, label: 'Deduction From' }),
  f({ col: 'monthly_deduction',           step: 'compensation', key: 'monthly_deduction',           type: 'num', label: 'Monthly Deduction (blank = auto)' }),
  f({ col: 'final_monthly_deduction',     step: 'compensation', key: 'final_monthly_deduction',     type: 'num', label: 'Final Monthly Deduction' }),

  // ── HR Joining Checklist ──────────────────────────────────────────────────
  f({ col: 'offer_letter',           step: 'hr_joining_checklist', key: 'offer_letter',           type: 'bool', label: 'Offer Letter' }),
  f({ col: 'address_verification',    step: 'hr_joining_checklist', key: 'address_verification',    type: 'bool', label: 'Address Verification' }),
  f({ col: 'service_agreement',       step: 'hr_joining_checklist', key: 'service_agreement',       type: 'bool', label: 'Service Agreement' }),
  f({ col: 'indemnity_bond',          step: 'hr_joining_checklist', key: 'indemnity_bond',          type: 'bool', label: 'Indemnity Bond' }),
  f({ col: 'asset_deduction_letter',  step: 'hr_joining_checklist', key: 'asset_deduction_letter',  type: 'bool', label: 'Asset Deduction Letter' }),
  f({ col: 'account_opening_letter',  step: 'hr_joining_checklist', key: 'account_opening_letter',  type: 'bool', label: 'Account Opening Letter' }),
  f({ col: 'nda',                     step: 'hr_joining_checklist', key: 'nda',                     type: 'bool', label: 'NDA' }),
  f({ col: 'checklist_remarks',       step: 'hr_joining_checklist', key: 'remarks',                 type: 'str',  label: 'Checklist Remarks' }),

  // ── Personal Profile ──────────────────────────────────────────────────────
  f({ col: 'date_of_birth', step: 'personal_profile', key: 'date_of_birth', type: 'date', label: 'Date of Birth', help: 'YYYY-MM-DD' }),
  f({ col: 'gender',        step: 'personal_profile', key: 'gender',        type: 'enum', enumValues: GENDER, label: 'Gender' }),
  f({ col: 'shirt_size',    step: 'personal_profile', key: 'shirt_size',    type: 'str',  label: 'Shirt Size' }),
  f({ col: 'tshirt_size',   step: 'personal_profile', key: 'tshirt_size',   type: 'str',  label: 'T-shirt Size' }),
  f({ col: 'nationality',   step: 'personal_profile', key: 'nationality',   type: 'str',  label: 'Nationality' }),
  f({ col: 'religion',      step: 'personal_profile', key: 'religion',      type: 'str',  label: 'Religion' }),
  f({ col: 'blood_group',   step: 'personal_profile', key: 'blood_group',   type: 'enum', enumValues: BLOOD_GROUP, label: 'Blood Group' }),

  // ── Address ───────────────────────────────────────────────────────────────
  f({ col: 'present_house_type', step: 'address', key: 'present_house_type', type: 'enum', enumValues: HOUSE_TYPE, label: 'Present House Type' }),
  f({ col: 'present_house_no',   step: 'address', key: 'present_house_no',   type: 'str',  label: 'Present House No' }),
  f({ col: 'present_area',       step: 'address', key: 'present_area',       type: 'str',  label: 'Present Area' }),
  f({ col: 'present_district',   step: 'address', key: 'present_district',   type: 'str',  label: 'Present District' }),
  f({ col: 'present_city',       step: 'address', key: 'present_city',       type: 'str',  label: 'Present City' }),
  f({ col: 'present_state',      step: 'address', key: 'present_state',      type: 'str',  label: 'Present State' }),
  f({ col: 'present_country',    step: 'address', key: 'present_country',    type: 'str',  label: 'Present Country' }),
  f({ col: 'present_pincode',    step: 'address', key: 'present_pincode',    type: 'str',  label: 'Present Pincode', help: '4-10 digits' }),
  f({ col: 'perm_address_type',  step: 'address', key: 'perm_address_type',  type: 'enum', enumValues: PERM_ADDRESS_TYPE, label: 'Permanent Address Type' }),
  f({ col: 'perm_house_type',    step: 'address', key: 'perm_house_type',    type: 'enum', enumValues: HOUSE_TYPE, label: 'Permanent House Type' }),
  f({ col: 'perm_house_no',      step: 'address', key: 'perm_house_no',      type: 'str',  label: 'Permanent House No' }),
  f({ col: 'perm_area',          step: 'address', key: 'perm_area',          type: 'str',  label: 'Permanent Area' }),
  f({ col: 'perm_district',      step: 'address', key: 'perm_district',      type: 'str',  label: 'Permanent District' }),
  f({ col: 'perm_city',          step: 'address', key: 'perm_city',          type: 'str',  label: 'Permanent City' }),
  f({ col: 'perm_state',         step: 'address', key: 'perm_state',         type: 'str',  label: 'Permanent State' }),
  f({ col: 'perm_country',       step: 'address', key: 'perm_country',       type: 'str',  label: 'Permanent Country' }),
  f({ col: 'perm_pincode',       step: 'address', key: 'perm_pincode',       type: 'str',  label: 'Permanent Pincode' }),

  // ── Family & Emergency (scalars; repeatables below) ───────────────────────
  f({ col: 'marital_status',    step: 'family_emergency', key: 'marital_status',    type: 'enum', enumValues: MARITAL_STATUS, label: 'Marital Status' }),
  f({ col: 'marriage_date',     step: 'family_emergency', key: 'marriage_date',     type: 'date', label: 'Marriage Date' }),
  f({ col: 'spouse_name',       step: 'family_emergency', key: 'spouse_name',       type: 'str',  label: 'Spouse Name' }),
  f({ col: 'spouse_dob',        step: 'family_emergency', key: 'spouse_dob',        type: 'date', label: 'Spouse DOB' }),
  f({ col: 'child1_name',       step: 'family_emergency', key: 'child1_name',       type: 'str',  label: 'Child 1 Name' }),
  f({ col: 'child1_gender',     step: 'family_emergency', key: 'child1_gender',     type: 'enum', enumValues: GENDER, label: 'Child 1 Gender' }),
  f({ col: 'child1_dob',        step: 'family_emergency', key: 'child1_dob',        type: 'date', label: 'Child 1 DOB' }),
  f({ col: 'child2_name',       step: 'family_emergency', key: 'child2_name',       type: 'str',  label: 'Child 2 Name' }),
  f({ col: 'child2_gender',     step: 'family_emergency', key: 'child2_gender',     type: 'enum', enumValues: GENDER, label: 'Child 2 Gender' }),
  f({ col: 'child2_dob',        step: 'family_emergency', key: 'child2_dob',        type: 'date', label: 'Child 2 DOB' }),
  f({ col: 'child3_name',       step: 'family_emergency', key: 'child3_name',       type: 'str',  label: 'Child 3 Name' }),
  f({ col: 'child3_gender',     step: 'family_emergency', key: 'child3_gender',     type: 'enum', enumValues: GENDER, label: 'Child 3 Gender' }),
  f({ col: 'child3_dob',        step: 'family_emergency', key: 'child3_dob',        type: 'date', label: 'Child 3 DOB' }),
  f({ col: 'father_salutation', step: 'family_emergency', key: 'father_salutation', type: 'enum', enumValues: FATHER_SALUTATION, label: 'Father Salutation' }),
  f({ col: 'father_name',       step: 'family_emergency', key: 'father_name',       type: 'str',  label: 'Father Name' }),
  f({ col: 'father_dob',        step: 'family_emergency', key: 'father_dob',        type: 'date', label: 'Father DOB' }),
  f({ col: 'father_occupation', step: 'family_emergency', key: 'father_occupation', type: 'str',  label: 'Father Occupation' }),
  f({ col: 'mother_salutation', step: 'family_emergency', key: 'mother_salutation', type: 'enum', enumValues: MOTHER_SALUTATION, label: 'Mother Salutation' }),
  f({ col: 'mother_name',       step: 'family_emergency', key: 'mother_name',       type: 'str',  label: 'Mother Name' }),
  f({ col: 'mother_dob',        step: 'family_emergency', key: 'mother_dob',        type: 'date', label: 'Mother DOB' }),
  f({ col: 'mother_occupation', step: 'family_emergency', key: 'mother_occupation', type: 'str',  label: 'Mother Occupation' }),

  // ── IDs & Bank (sensitive; repeatables below) ────────────────────────────
  f({ col: 'aadhaar_number',            step: 'ids_bank', key: 'aadhaar_number',            type: 'str', requiredWithStep: true, label: 'Aadhaar Number', help: '12 digits' }),
  f({ col: 'aadhaar_name',              step: 'ids_bank', key: 'aadhaar_name',              type: 'str', requiredWithStep: true, label: 'Name as on Aadhaar' }),
  f({ col: 'aadhaar_dob',               step: 'ids_bank', key: 'aadhaar_dob',               type: 'date', requiredWithStep: true, label: 'DOB as on Aadhaar' }),
  f({ col: 'aadhaar_address',           step: 'ids_bank', key: 'aadhaar_address',           type: 'str', requiredWithStep: true, label: 'Address as on Aadhaar' }),
  f({ col: 'aadhaar_scan_url',          step: 'ids_bank', key: 'aadhaar_scan_url',          type: 'str', label: 'Aadhaar Scan URL' }),
  f({ col: 'pan_number',                step: 'ids_bank', key: 'pan_number',                type: 'str', label: 'PAN Number', help: 'ABCDE1234F' }),
  f({ col: 'pan_full_name',             step: 'ids_bank', key: 'pan_full_name',             type: 'str', label: 'PAN Full Name' }),
  f({ col: 'pan_dob',                   step: 'ids_bank', key: 'pan_dob',                   type: 'date', label: 'PAN DOB' }),
  f({ col: 'pan_parent_spouse_name',    step: 'ids_bank', key: 'pan_parent_spouse_name',    type: 'str', label: 'PAN Parent/Spouse Name' }),
  f({ col: 'pan_scan_url',              step: 'ids_bank', key: 'pan_scan_url',              type: 'str', label: 'PAN Scan URL' }),
  f({ col: 'passport_number',           step: 'ids_bank', key: 'passport_number',           type: 'str', label: 'Passport Number' }),
  f({ col: 'passport_full_name',        step: 'ids_bank', key: 'passport_full_name',        type: 'str', label: 'Passport Full Name' }),
  f({ col: 'passport_nationality',      step: 'ids_bank', key: 'passport_nationality',      type: 'str', label: 'Passport Nationality' }),
  f({ col: 'passport_issue_date',       step: 'ids_bank', key: 'passport_issue_date',       type: 'date', label: 'Passport Issue Date' }),
  f({ col: 'passport_expiry',           step: 'ids_bank', key: 'passport_expiry',           type: 'date', label: 'Passport Expiry' }),
  f({ col: 'passport_place_of_issue',   step: 'ids_bank', key: 'passport_place_of_issue',   type: 'str', label: 'Passport Place of Issue' }),
  f({ col: 'passport_scan_url',         step: 'ids_bank', key: 'passport_scan_url',         type: 'str', label: 'Passport Scan URL' }),
  f({ col: 'driving_license_number',    step: 'ids_bank', key: 'driving_license_number',    type: 'str', label: 'Driving Licence Number' }),
  f({ col: 'driving_license_name',      step: 'ids_bank', key: 'driving_license_name',      type: 'str', label: 'Driving Licence Name' }),
  f({ col: 'driving_license_issue_date',step: 'ids_bank', key: 'driving_license_issue_date',type: 'date', label: 'Driving Licence Issue Date' }),
  f({ col: 'driving_license_expiry',    step: 'ids_bank', key: 'driving_license_expiry',    type: 'date', label: 'Driving Licence Expiry' }),
  f({ col: 'driving_license_authority', step: 'ids_bank', key: 'driving_license_authority', type: 'str', label: 'Driving Licence Authority' }),
  f({ col: 'driving_license_scan_url',  step: 'ids_bank', key: 'driving_license_scan_url',  type: 'str', label: 'Driving Licence Scan URL' }),
  f({ col: 'yellow_fever',              step: 'ids_bank', key: 'yellow_fever',              type: 'bool', label: 'Yellow Fever Vaccinated' }),
  f({ col: 'yellow_fever_date',         step: 'ids_bank', key: 'yellow_fever_date',         type: 'date', label: 'Yellow Fever Date' }),
  f({ col: 'personal_bank_name',        step: 'ids_bank', key: 'personal_bank_name',        type: 'str', requiredWithStep: true, label: 'Bank Name' }),
  f({ col: 'personal_bank_account',     step: 'ids_bank', key: 'personal_bank_account',     type: 'str', requiredWithStep: true, label: 'Bank Account Number', help: '9-18 digits' }),
  f({ col: 'personal_ifsc',             step: 'ids_bank', key: 'personal_ifsc',             type: 'str', requiredWithStep: true, label: 'IFSC Code' }),
  f({ col: 'personal_bank_branch',      step: 'ids_bank', key: 'personal_bank_branch',      type: 'str', label: 'Bank Branch' }),

  // ── Experience & Education (scalar flag; repeatables below) ──────────────
  f({ col: 'is_experienced', step: 'experience_education', key: 'is_experienced', type: 'bool', label: 'Is Experienced' }),
];

// ── Repeatable groups → numbered columns (col{n}_field) ─────────────────────
export interface RepeatableGroup {
  step:      StepKey;
  arrayKey:  string;                     // payload key holding the array
  prefix:    string;                     // column prefix, e.g. 'experience'
  max:       number;
  requiredSubKeys: string[];             // sub-row is kept only if all of these are filled
  fields: Array<{ sub: string; key: string; type: FieldType; enumValues?: readonly string[] }>;
}

export const REPEATABLE_GROUPS: RepeatableGroup[] = [
  {
    step: 'family_emergency', arrayKey: 'family_members', prefix: 'family_member', max: 3,
    requiredSubKeys: ['name'],
    fields: [
      { sub: 'name',               key: 'name',               type: 'str' },
      { sub: 'relationship',       key: 'relationship',       type: 'str' },
      { sub: 'relationship_other', key: 'relationship_other', type: 'str' },
      { sub: 'salutation',         key: 'salutation',         type: 'str' },
      { sub: 'dob',                key: 'dob',                type: 'date' },
      { sub: 'occupation',         key: 'occupation',         type: 'str' },
    ],
  },
  {
    step: 'family_emergency', arrayKey: 'emergency_contacts', prefix: 'emergency_contact', max: 2,
    requiredSubKeys: ['contact_name', 'contact_number', 'relationship'],
    fields: [
      { sub: 'name',               key: 'contact_name',       type: 'str' },
      { sub: 'number',             key: 'contact_number',     type: 'str' },
      { sub: 'email',              key: 'email',              type: 'str' },
      { sub: 'relationship',       key: 'relationship',       type: 'str' },
      { sub: 'relationship_other', key: 'relationship_other', type: 'str' },
    ],
  },
  {
    step: 'ids_bank', arrayKey: 'vaccinations', prefix: 'vaccination', max: 3,
    requiredSubKeys: ['vaccine_name'],
    fields: [
      { sub: 'name',  key: 'vaccine_name', type: 'str' },
      { sub: 'date',  key: 'date',         type: 'date' },
      { sub: 'notes', key: 'notes',        type: 'str' },
    ],
  },
  {
    step: 'ids_bank', arrayKey: 'documents', prefix: 'document', max: 3,
    requiredSubKeys: ['doc_type', 'file_url'],
    fields: [
      { sub: 'type',       key: 'doc_type',        type: 'str' },
      { sub: 'type_other', key: 'doc_type_other',  type: 'str' },
      { sub: 'url',        key: 'file_url',        type: 'str' },
    ],
  },
  {
    step: 'experience_education', arrayKey: 'experience', prefix: 'experience', max: 3,
    requiredSubKeys: ['last_company_name'],
    fields: [
      { sub: 'company',            key: 'last_company_name',       type: 'str' },
      { sub: 'designation',        key: 'last_designation',        type: 'str' },
      { sub: 'last_working_day',   key: 'last_working_day',        type: 'date' },
      { sub: 'contact_name',       key: 'exp_contact_name',        type: 'str' },
      { sub: 'contact_number',     key: 'exp_contact_number',      type: 'str' },
      { sub: 'contact_designation',key: 'exp_contact_designation', type: 'str' },
      { sub: 'inhand_salary',      key: 'last_inhand_salary',      type: 'num' },
    ],
  },
  {
    step: 'experience_education', arrayKey: 'education', prefix: 'education', max: 3,
    requiredSubKeys: ['highest_education'],
    fields: [
      { sub: 'highest',     key: 'highest_education',    type: 'str' },
      { sub: 'stream',      key: 'education_stream',     type: 'str' },
      { sub: 'mode',        key: 'education_mode',       type: 'str' },
      { sub: 'institute',   key: 'institute_name',      type: 'str' },
      { sub: 'marks',       key: 'education_marks',      type: 'str' },
      { sub: 'start_year',  key: 'education_start_year', type: 'int' },
      { sub: 'end_year',    key: 'education_end_year',   type: 'int' },
      { sub: 'is_pursuing', key: 'is_pursuing',         type: 'bool' },
    ],
  },
];

/** Ordered list of steps the bulk importer applies (role_identity = base row). */
export const BULK_STEP_ORDER: StepKey[] = [
  'location_attendance', 'managers_work_contact', 'commitment_probation', 'statutory_schemes',
  'compensation', 'hr_joining_checklist', 'personal_profile', 'address', 'family_emergency',
  'ids_bank', 'experience_education',
];

/** Every spreadsheet column, in order — scalars then each repeatable expanded. */
export function allTemplateColumns(): Array<{ col: string; label: string; step: string; required: boolean; help?: string; enumValues?: readonly string[] }> {
  const out: Array<{ col: string; label: string; step: string; required: boolean; help?: string; enumValues?: readonly string[] }> = [];
  for (const d of FIELD_DEFS) {
    out.push({ col: d.col, label: d.label, step: d.step, required: !!d.required, help: d.help, enumValues: d.enumValues });
  }
  for (const g of REPEATABLE_GROUPS) {
    for (let i = 1; i <= g.max; i++) {
      for (const gf of g.fields) {
        out.push({ col: `${g.prefix}_${i}_${gf.sub}`, label: `${g.prefix} ${i} ${gf.sub}`.replace(/_/g, ' '), step: g.step, required: false, enumValues: gf.enumValues });
      }
    }
  }
  return out;
}
