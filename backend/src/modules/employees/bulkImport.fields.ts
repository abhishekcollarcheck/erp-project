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
 *
 * Dropdown values are NEVER hardcoded here beyond the shared enum constants
 * (which the validators also enforce): every master-backed column points at a
 * live list via `COLUMN_OPTION_SOURCE` → bulkImport.masterLists.getMasterLists().
 */

import type { StepKey } from './employee.constants';
import {
  EMPLOYEE_STATUS, EMPLOYMENT_TYPE, COMMITMENT_TERM, PROBATION_PERIOD, PROBATION_STATUS,
  PF_EMPLOYER_FROM, MEDICLAIM_STATUS, RD_TERM, HOUSE_TYPE, PERM_ADDRESS_TYPE,
  FATHER_SALUTATION, MOTHER_SALUTATION, SALARY_MODE, DEDUCTION_FROM,
  GENDER, BLOOD_GROUP, MARITAL_STATUS, SHIFT_CATEGORY,
} from './employee.constants';

export type FieldType = 'str' | 'int' | 'num' | 'bool' | 'date' | 'enum' | 'dbmaster';

/** DB-backed master lookups resolved by name (see bulkImport.mapper.ts). */
export type DbMaster =
  | 'company' | 'department' | 'designation' | 'sub_department' | 'sub_designation'
  | 'shift' | 'manager'
  | 'site' | 'city' | 'state' | 'pay_register' | 'weekly_off' | 'grace_minutes';

export interface FieldDef {
  col:      string;                 // spreadsheet header (snake_case)
  step:     StepKey | 'role_identity';
  key:      string;                 // key in the step payload / base row
  type:     FieldType;
  dbMaster?: DbMaster;              // for type 'dbmaster'
  enumValues?: readonly string[];   // for type 'enum'
  required?: boolean;               // hard-required for every row
  requiredWithStep?: boolean;       // required only if that step block has any data
  label:    string;
  help?:    string;                 // hint/example shown in the template's guidance row
}

const f = (d: FieldDef): FieldDef => d;

const YMD = 'Date — YYYY-MM-DD';
const YESNO = 'Yes / No';

export const FIELD_DEFS: FieldDef[] = [
  // ── Role & Identity (base employees row) ────────────────────────────────────
  f({ col: 'avatar',           step: 'role_identity', key: 'avatar',            type: 'str', label: 'Avatar', help: 'Optional. Image URL or data:image/… URI — downloaded into the employee upload folder on import' }),
  f({ col: 'avatar_url',       step: 'role_identity', key: 'avatar_url',        type: 'str', label: 'Avatar URL (legacy)', help: 'Legacy — stores the link verbatim without downloading. Prefer the "Avatar" column' }),
  f({ col: 'employee_code',    step: 'role_identity', key: 'employee_code',     type: 'str', label: 'Employee Code', help: 'Blank on a NEW employee → auto-generated at 100% complete. Fill it to UPDATE an existing employee. Must be unique, max 30 chars' }),
  f({ col: 'reference_code',   step: 'role_identity', key: 'reference_code',    type: 'str', label: 'Reference Code', help: 'Optional external / legacy tracking code. Must be unique, max 50 chars' }),
  f({ col: 'status',           step: 'role_identity', key: 'status',            type: 'enum', enumValues: EMPLOYEE_STATUS, label: 'Status', help: `Pick from the dropdown. Default: Active` }),
  f({ col: 'first_name',       step: 'role_identity', key: 'first_name',        type: 'str', required: true, label: 'First Name', help: 'Required. e.g. "Rahul"' }),
  f({ col: 'middle_name',      step: 'role_identity', key: 'middle_name',       type: 'str', label: 'Middle Name', help: 'Optional' }),
  f({ col: 'last_name',        step: 'role_identity', key: 'last_name',         type: 'str', label: 'Last Name', help: 'Optional. e.g. "Sharma"' }),
  f({ col: 'company',          step: 'role_identity', key: 'company_id',        type: 'dbmaster', dbMaster: 'company', label: 'Company', help: 'Pick from the dropdown (company master). Blank → your own company' }),
  f({ col: 'employment_type',  step: 'role_identity', key: 'employment_type',   type: 'enum', enumValues: EMPLOYMENT_TYPE, label: 'Employment Type', help: 'Pick from the dropdown. Default: Permanent' }),
  f({ col: 'department',       step: 'role_identity', key: 'department_id',     type: 'dbmaster', dbMaster: 'department', required: true, label: 'Department', help: 'Required. Pick from the dropdown (department master)' }),
  f({ col: 'sub_department',   step: 'role_identity', key: 'sub_department_id', type: 'dbmaster', dbMaster: 'sub_department', label: 'Sub-department', help: 'Optional. Pick from the dropdown; must belong to the chosen Department' }),
  f({ col: 'designation',      step: 'role_identity', key: 'designation_id',    type: 'dbmaster', dbMaster: 'designation', required: true, label: 'Designation', help: 'Required. Pick from the dropdown (designation master)' }),
  f({ col: 'sub_designation',  step: 'role_identity', key: 'sub_designation_id',type: 'dbmaster', dbMaster: 'sub_designation', label: 'Sub-designation', help: 'Optional. Pick from the dropdown' }),
  f({ col: 'email',            step: 'role_identity', key: 'email',             type: 'str', required: true, label: 'Personal Email', help: 'Required. Globally unique across all companies. e.g. "rahul.sharma@gmail.com"' }),
  f({ col: 'phone',            step: 'role_identity', key: 'phone',             type: 'str', required: true, label: 'Personal Mobile', help: 'Required. Globally unique. 10 digits or +91XXXXXXXXXX' }),

  // ── Location & Attendance ──────────────────────────────────────────────────
  f({ col: 'working_state_country', step: 'location_attendance', key: 'working_state_country', type: 'dbmaster', dbMaster: 'state', label: 'Working State / Country', help: 'Pick from the dropdown — "State, Country" from Master → Location (e.g. "Delhi, India")' }),
  f({ col: 'working_city',          step: 'location_attendance', key: 'working_city',          type: 'dbmaster', dbMaster: 'city', label: 'Working City', help: 'Pick from the dropdown — "City, State" from Master → Location (e.g. "New Delhi, Delhi")' }),
  f({ col: 'working_site',          step: 'location_attendance', key: 'working_site',          type: 'dbmaster', dbMaster: 'site', label: 'Working Site', help: 'Pick from the dropdown — "Site, City" from Master → Location (e.g. "Head Office, New Delhi")' }),
  f({ col: 'pay_register_location', step: 'location_attendance', key: 'pay_register_location', type: 'dbmaster', dbMaster: 'pay_register', label: 'Pay Register Location', help: 'Pick from the dropdown — "Pay Register, State" from Master → Location' }),
  f({ col: 'date_of_joining',       step: 'location_attendance', key: 'actual_doj',            type: 'date', requiredWithStep: true, label: 'Date of Joining', help: `Required for this section. Original / group joining date. ${YMD}` }),
  f({ col: 'current_joining_date',  step: 'location_attendance', key: 'current_doj',           type: 'date', label: 'Current Joining Date', help: `Transfer field — joining date at the current company after a transfer. ${YMD}` }),
  f({ col: 'weekly_off',            step: 'location_attendance', key: 'weekly_off',            type: 'dbmaster', dbMaster: 'weekly_off', label: 'Weekly Off', help: 'Pick from the dropdown (weekly-off preset master), e.g. "Sunday"' }),
  f({ col: 'shift_category',        step: 'location_attendance', key: 'shift_category',        type: 'enum', enumValues: SHIFT_CATEGORY, label: 'Shift Category', help: 'Pick from the dropdown. "Shift" = fixed shift timing · "Duration" = hours-per-day only' }),
  f({ col: 'shift',                 step: 'location_attendance', key: 'shift_id',              type: 'dbmaster', dbMaster: 'shift', label: 'Shift', help: 'Pick from the dropdown (shift master). Only when Shift Category = Shift' }),
  f({ col: 'grace_minutes',         step: 'location_attendance', key: 'grace_minutes',         type: 'dbmaster', dbMaster: 'grace_minutes', label: 'Grace Minutes', help: 'Pick from the dropdown (grace-minutes master), e.g. "15 minutes"' }),

  // ── Managers & Work Contact ────────────────────────────────────────────────
  f({ col: 'l1_manager_code',  step: 'managers_work_contact', key: 'l1_manager_id',  type: 'dbmaster', dbMaster: 'manager', label: 'L1 Manager Code', help: 'Employee Code (or email) of the L1 manager. May be in another company' }),
  f({ col: 'l2_manager_code',  step: 'managers_work_contact', key: 'l2_manager_id',  type: 'dbmaster', dbMaster: 'manager', label: 'L2 Manager Code', help: 'Employee Code (or email) of the L2 manager' }),
  f({ col: 'official_email',   step: 'managers_work_contact', key: 'official_email', type: 'str', label: 'Official Email', help: 'Optional. Company-issued email' }),
  f({ col: 'official_mobile',  step: 'managers_work_contact', key: 'official_mobile',type: 'str', label: 'Official Mobile', help: 'Optional. 10 digits or +91…' }),

  // ── Commitment & Probation ─────────────────────────────────────────────────
  f({ col: 'commitment',            step: 'commitment_probation', key: 'commitment',            type: 'bool', label: 'Has Commitment', help: YESNO }),
  f({ col: 'commitment_term',       step: 'commitment_probation', key: 'commitment_term',       type: 'enum', enumValues: COMMITMENT_TERM, label: 'Commitment Term', help: 'Pick from the dropdown. Only when Has Commitment = Yes' }),
  f({ col: 'commitment_entered_on', step: 'commitment_probation', key: 'commitment_entered_on', type: 'date', label: 'Commitment Entered On', help: YMD }),
  f({ col: 'commitment_end_date',   step: 'commitment_probation', key: 'commitment_end_date',   type: 'date', label: 'Commitment End Date', help: `Optional — auto-computed from term + entered-on when left blank. ${YMD}` }),
  f({ col: 'on_probation',          step: 'commitment_probation', key: 'on_probation',          type: 'bool', label: 'On Probation', help: YESNO }),
  f({ col: 'probation_period',      step: 'commitment_probation', key: 'probation_period',      type: 'enum', enumValues: PROBATION_PERIOD, label: 'Probation Period', help: 'Pick from the dropdown. Only when On Probation = Yes' }),
  f({ col: 'probation_end_date',    step: 'commitment_probation', key: 'probation_end_date',    type: 'date', label: 'Probation End Date', help: YMD }),
  f({ col: 'probation_status',      step: 'commitment_probation', key: 'probation_status',      type: 'enum', enumValues: PROBATION_STATUS, label: 'Probation Status', help: 'Pick from the dropdown' }),

  // ── Statutory Schemes ──────────────────────────────────────────────────────
  f({ col: 'pf_status',           step: 'statutory_schemes', key: 'pf_status',           type: 'bool', label: 'PF Applicable', help: YESNO }),
  f({ col: 'uan_number',          step: 'statutory_schemes', key: 'uan_number',          type: 'str', label: 'UAN Number', help: 'Optional. 12 digits' }),
  f({ col: 'epfo_member_id',      step: 'statutory_schemes', key: 'epfo_member_id',      type: 'str', label: 'EPFO Member ID', help: 'Optional' }),
  f({ col: 'pf_contribution_pct', step: 'statutory_schemes', key: 'pf_contribution_pct', type: 'num', label: 'PF Contribution %', help: 'Number, e.g. 12' }),
  f({ col: 'pf_employer_from',    step: 'statutory_schemes', key: 'pf_employer_from',    type: 'enum', enumValues: PF_EMPLOYER_FROM, label: 'Employer Contribution From', help: 'Pick from the dropdown' }),
  f({ col: 'pf_employee_12',      step: 'statutory_schemes', key: 'pf_employee_12',      type: 'num', label: 'PF Employee (12%)', help: 'Amount (₹) per month' }),
  f({ col: 'eps_employer_833',    step: 'statutory_schemes', key: 'eps_employer_833',    type: 'num', label: 'EPS Employer (8.33%)', help: 'Amount (₹) per month' }),
  f({ col: 'epf_eps_diff_367',    step: 'statutory_schemes', key: 'epf_eps_diff_367',    type: 'num', label: 'EPF/EPS Diff (3.67%)', help: 'Amount (₹) per month' }),
  f({ col: 'esic_status',         step: 'statutory_schemes', key: 'esic_status',         type: 'bool', label: 'ESI Applicable', help: YESNO }),
  f({ col: 'esic_number',         step: 'statutory_schemes', key: 'esic_number',         type: 'str', label: 'ESI Number', help: 'Optional' }),
  f({ col: 'esi_employee_pct',    step: 'statutory_schemes', key: 'esi_employee_pct',    type: 'num', label: 'ESI Employee %', help: 'Number, e.g. 0.75' }),
  f({ col: 'esi_employer_pct',    step: 'statutory_schemes', key: 'esi_employer_pct',    type: 'num', label: 'ESI Employer %', help: 'Number, e.g. 3.25' }),
  f({ col: 'mediclaim_status',    step: 'statutory_schemes', key: 'mediclaim_status',    type: 'enum', enumValues: MEDICLAIM_STATUS, label: 'Mediclaim Status', help: 'Pick from the dropdown' }),
  f({ col: 'mediclaim_number',    step: 'statutory_schemes', key: 'mediclaim_number',    type: 'str', label: 'Mediclaim Policy Number', help: 'Optional' }),
  f({ col: 'mediclaim_amount',    step: 'statutory_schemes', key: 'mediclaim_amount',    type: 'enum', enumValues: ['150000', '250000', '400000', '500000', 'Not Applicable'], label: 'Mediclaim Amount', help: 'Pick from the dropdown (sum insured)' }),
  f({ col: 'rd_scheme',           step: 'statutory_schemes', key: 'rd_scheme',           type: 'bool', label: 'RD Scheme Applicable', help: YESNO }),
  f({ col: 'rd_term',             step: 'statutory_schemes', key: 'rd_term',             type: 'enum', enumValues: RD_TERM, label: 'RD Term', help: 'Pick from the dropdown. Only when RD Scheme = Yes' }),
  f({ col: 'rd_opening_date',     step: 'statutory_schemes', key: 'rd_opening_date',     type: 'date', label: 'RD Opening Date', help: YMD }),
  f({ col: 'rd_account_number',   step: 'statutory_schemes', key: 'rd_account_number',   type: 'str', label: 'RD Account Number', help: 'Optional' }),
  f({ col: 'rd_deduction_from',   step: 'statutory_schemes', key: 'rd_deduction_from',   type: 'enum', enumValues: DEDUCTION_FROM, label: 'RD Deduction From', help: 'Pick from the dropdown' }),
  f({ col: 'rd_amount_employee',  step: 'statutory_schemes', key: 'rd_amount_employee',  type: 'num', label: 'RD Amount (Employee)', help: 'Amount (₹) per month' }),
  f({ col: 'rd_amount_employer',  step: 'statutory_schemes', key: 'rd_amount_employer',  type: 'num', label: 'RD Amount (Employer)', help: 'Amount (₹) per month' }),

  // ── Compensation (sensitive) ──────────────────────────────────────────────
  f({ col: 'salary_mode',                 step: 'compensation', key: 'salary_mode',                 type: 'enum', enumValues: SALARY_MODE, label: 'Salary Mode', help: 'Pick from the dropdown (mode of payment)' }),
  f({ col: 'current_basic',               step: 'compensation', key: 'current_basic',               type: 'num', label: 'Current Basic', help: 'Current monthly Basic (₹)' }),
  f({ col: 'current_hra',                 step: 'compensation', key: 'current_hra',                 type: 'num', label: 'Current HRA', help: 'Current monthly HRA (₹)' }),
  f({ col: 'current_allowance1',          step: 'compensation', key: 'current_allowance1',          type: 'num', label: 'Current Allowance 1', help: 'Current monthly other allowance (₹)' }),
  f({ col: 'current_amdb',                step: 'compensation', key: 'current_amdb',                type: 'num', label: 'Current AMDB', help: 'Blank → auto 30% of gross' }),
  f({ col: 'joining_basic',               step: 'compensation', key: 'joining_basic',               type: 'num', label: 'Joining Basic', help: 'Monthly Basic at joining (₹)' }),
  f({ col: 'joining_hra',                 step: 'compensation', key: 'joining_hra',                 type: 'num', label: 'Joining HRA', help: 'Monthly HRA at joining (₹)' }),
  f({ col: 'joining_allowance1',          step: 'compensation', key: 'joining_allowance1',          type: 'num', label: 'Joining Allowance 1', help: 'Monthly other allowance at joining (₹)' }),
  f({ col: 'joining_amdb',                step: 'compensation', key: 'joining_amdb',                type: 'num', label: 'Joining AMDB', help: 'Blank → auto 30% of gross' }),
  f({ col: 'salary_change_after_probation', step: 'compensation', key: 'salary_change_after_probation', type: 'bool', label: 'Salary Change After Probation', help: `${YESNO} — a different package starts the day probation is passed. Only applies when On Probation = Yes` }),
  f({ col: 'after_probation_basic',       step: 'compensation', key: 'after_probation_basic',       type: 'num', label: 'Basic (After Probation)', help: 'Monthly Basic once probation is passed (₹). Only when Salary Change After Probation = Yes' }),
  f({ col: 'after_probation_hra',         step: 'compensation', key: 'after_probation_hra',         type: 'num', label: 'HRA (After Probation)', help: 'Monthly HRA once probation is passed (₹)' }),
  f({ col: 'after_probation_allowance1',  step: 'compensation', key: 'after_probation_allowance1',  type: 'num', label: 'Allowance 1 (After Probation)', help: 'Monthly other allowance once probation is passed (₹)' }),
  f({ col: 'after_probation_amdb',        step: 'compensation', key: 'after_probation_amdb',        type: 'num', label: 'AMDB PM (After Probation)', help: 'Blank → auto 30% of gross' }),
  f({ col: 'give_arrears_after_probation', step: 'compensation', key: 'give_arrears_after_probation', type: 'bool', label: 'Give Arrears After Probation', help: `${YESNO} — pay the probation-period difference in the next processed salary` }),
  f({ col: 'asset_deduction_applicable',  step: 'compensation', key: 'asset_deduction_applicable',  type: 'bool', label: 'Asset Deduction Applicable', help: YESNO }),
  f({ col: 'security_amount',             step: 'compensation', key: 'security_amount',             type: 'num', label: 'Security Amount', help: 'Total asset security to recover (₹). Only when Asset Deduction = Yes' }),
  f({ col: 'deduction_months',            step: 'compensation', key: 'deduction_months',            type: 'int', label: 'Deduction Months', help: 'Whole number of months to spread the deduction over' }),
  f({ col: 'deduction_from',              step: 'compensation', key: 'deduction_from',              type: 'enum', enumValues: DEDUCTION_FROM, label: 'Deduction From', help: 'Pick from the dropdown' }),
  f({ col: 'monthly_deduction',           step: 'compensation', key: 'monthly_deduction',           type: 'num', label: 'Monthly Deduction', help: 'Blank → auto (security ÷ months)' }),
  f({ col: 'final_monthly_deduction',     step: 'compensation', key: 'final_monthly_deduction',     type: 'num', label: 'Final Monthly Deduction', help: 'Optional override of the auto figure (₹)' }),

  // ── HR Joining Checklist ──────────────────────────────────────────────────
  f({ col: 'offer_letter',           step: 'hr_joining_checklist', key: 'offer_letter',           type: 'bool', label: 'Offer Letter', help: `${YESNO} — signed offer letter received` }),
  f({ col: 'address_verification',    step: 'hr_joining_checklist', key: 'address_verification',    type: 'bool', label: 'Address Verification', help: `${YESNO} — address proof received` }),
  f({ col: 'service_agreement',       step: 'hr_joining_checklist', key: 'service_agreement',       type: 'bool', label: 'Service Agreement', help: `${YESNO} — employment contract signed` }),
  f({ col: 'indemnity_bond',          step: 'hr_joining_checklist', key: 'indemnity_bond',          type: 'bool', label: 'Indemnity Bond', help: YESNO }),
  f({ col: 'asset_deduction_letter',  step: 'hr_joining_checklist', key: 'asset_deduction_letter',  type: 'bool', label: 'Asset Deduction Letter', help: YESNO }),
  f({ col: 'account_opening_letter',  step: 'hr_joining_checklist', key: 'account_opening_letter',  type: 'bool', label: 'Account Opening Letter', help: YESNO }),
  f({ col: 'nda',                     step: 'hr_joining_checklist', key: 'nda',                     type: 'bool', label: 'NDA', help: `${YESNO} — non-disclosure agreement signed` }),
  f({ col: 'checklist_remarks',       step: 'hr_joining_checklist', key: 'remarks',                 type: 'str',  label: 'Checklist Remarks', help: 'Optional free-text notes' }),

  // ── Personal Profile ──────────────────────────────────────────────────────
  f({ col: 'date_of_birth', step: 'personal_profile', key: 'date_of_birth', type: 'date', label: 'Date of Birth', help: `${YMD}. Must be before Date of Joining` }),
  f({ col: 'gender',        step: 'personal_profile', key: 'gender',        type: 'enum', enumValues: GENDER, label: 'Gender', help: 'Pick from the dropdown' }),
  f({ col: 'shirt_size',    step: 'personal_profile', key: 'shirt_size',    type: 'str',  label: 'Shirt Size', help: 'Pick from the dropdown (shirt-size master)' }),
  f({ col: 'tshirt_size',   step: 'personal_profile', key: 'tshirt_size',   type: 'str',  label: 'T-shirt Size', help: 'Pick from the dropdown (shirt-size master)' }),
  f({ col: 'nationality',   step: 'personal_profile', key: 'nationality',   type: 'str',  label: 'Nationality', help: 'Pick from the dropdown (nationality master), e.g. "Indian"' }),
  f({ col: 'religion',      step: 'personal_profile', key: 'religion',      type: 'str',  label: 'Religion', help: 'Pick from the dropdown (religion master)' }),
  f({ col: 'blood_group',   step: 'personal_profile', key: 'blood_group',   type: 'enum', enumValues: BLOOD_GROUP, label: 'Blood Group', help: 'Pick from the dropdown' }),

  // ── Address ───────────────────────────────────────────────────────────────
  f({ col: 'present_house_type', step: 'address', key: 'present_house_type', type: 'enum', enumValues: HOUSE_TYPE, label: 'Present House Type', help: 'Pick from the dropdown' }),
  f({ col: 'present_house_no',   step: 'address', key: 'present_house_no',   type: 'str',  label: 'Present House No', help: 'e.g. "B-12, 2nd Floor"' }),
  f({ col: 'present_area',       step: 'address', key: 'present_area',       type: 'str',  label: 'Present Area', help: 'Locality / area name' }),
  f({ col: 'present_district',   step: 'address', key: 'present_district',   type: 'str',  label: 'Present District', help: 'Free text' }),
  f({ col: 'present_city',       step: 'address', key: 'present_city',       type: 'str',  label: 'Present City', help: 'Free text' }),
  f({ col: 'present_state',      step: 'address', key: 'present_state',      type: 'str',  label: 'Present State', help: 'Free text' }),
  f({ col: 'present_country',    step: 'address', key: 'present_country',    type: 'str',  label: 'Present Country', help: 'Free text, e.g. "India"' }),
  f({ col: 'present_pincode',    step: 'address', key: 'present_pincode',    type: 'str',  label: 'Present Pincode', help: '4-10 digits' }),
  f({ col: 'perm_address_type',  step: 'address', key: 'perm_address_type',  type: 'enum', enumValues: PERM_ADDRESS_TYPE, label: 'Permanent Address Type', help: 'Pick from the dropdown. "Same as Present" copies the present address' }),
  f({ col: 'perm_house_type',    step: 'address', key: 'perm_house_type',    type: 'enum', enumValues: HOUSE_TYPE, label: 'Permanent House Type', help: 'Pick from the dropdown' }),
  f({ col: 'perm_house_no',      step: 'address', key: 'perm_house_no',      type: 'str',  label: 'Permanent House No', help: 'e.g. "House 45, Ward 3"' }),
  f({ col: 'perm_area',          step: 'address', key: 'perm_area',          type: 'str',  label: 'Permanent Area', help: 'Locality / area name' }),
  f({ col: 'perm_district',      step: 'address', key: 'perm_district',      type: 'str',  label: 'Permanent District', help: 'Free text' }),
  f({ col: 'perm_city',          step: 'address', key: 'perm_city',          type: 'str',  label: 'Permanent City', help: 'Free text' }),
  f({ col: 'perm_state',         step: 'address', key: 'perm_state',         type: 'str',  label: 'Permanent State', help: 'Free text' }),
  f({ col: 'perm_country',       step: 'address', key: 'perm_country',       type: 'str',  label: 'Permanent Country', help: 'Free text, e.g. "India"' }),
  f({ col: 'perm_pincode',       step: 'address', key: 'perm_pincode',       type: 'str',  label: 'Permanent Pincode', help: '4-10 digits' }),

  // ── Family & Emergency (scalars; repeatables below) ───────────────────────
  f({ col: 'marital_status',    step: 'family_emergency', key: 'marital_status',    type: 'enum', enumValues: MARITAL_STATUS, label: 'Marital Status', help: 'Pick from the dropdown' }),
  f({ col: 'marriage_date',     step: 'family_emergency', key: 'marriage_date',     type: 'date', label: 'Marriage Date', help: `${YMD}. Only when Married` }),
  f({ col: 'spouse_name',       step: 'family_emergency', key: 'spouse_name',       type: 'str',  label: 'Spouse Name', help: 'Only when Married' }),
  f({ col: 'spouse_dob',        step: 'family_emergency', key: 'spouse_dob',        type: 'date', label: 'Spouse DOB', help: YMD }),
  f({ col: 'child1_name',       step: 'family_emergency', key: 'child1_name',       type: 'str',  label: 'Child 1 Name', help: 'Optional' }),
  f({ col: 'child1_gender',     step: 'family_emergency', key: 'child1_gender',     type: 'enum', enumValues: GENDER, label: 'Child 1 Gender', help: 'Pick from the dropdown' }),
  f({ col: 'child1_dob',        step: 'family_emergency', key: 'child1_dob',        type: 'date', label: 'Child 1 DOB', help: YMD }),
  f({ col: 'child2_name',       step: 'family_emergency', key: 'child2_name',       type: 'str',  label: 'Child 2 Name', help: 'Optional' }),
  f({ col: 'child2_gender',     step: 'family_emergency', key: 'child2_gender',     type: 'enum', enumValues: GENDER, label: 'Child 2 Gender', help: 'Pick from the dropdown' }),
  f({ col: 'child2_dob',        step: 'family_emergency', key: 'child2_dob',        type: 'date', label: 'Child 2 DOB', help: YMD }),
  f({ col: 'child3_name',       step: 'family_emergency', key: 'child3_name',       type: 'str',  label: 'Child 3 Name', help: 'Optional' }),
  f({ col: 'child3_gender',     step: 'family_emergency', key: 'child3_gender',     type: 'enum', enumValues: GENDER, label: 'Child 3 Gender', help: 'Pick from the dropdown' }),
  f({ col: 'child3_dob',        step: 'family_emergency', key: 'child3_dob',        type: 'date', label: 'Child 3 DOB', help: YMD }),
  f({ col: 'father_salutation', step: 'family_emergency', key: 'father_salutation', type: 'enum', enumValues: FATHER_SALUTATION, label: 'Father Salutation', help: 'Pick from the dropdown' }),
  f({ col: 'father_name',       step: 'family_emergency', key: 'father_name',       type: 'str',  label: 'Father Name', help: 'Optional' }),
  f({ col: 'father_dob',        step: 'family_emergency', key: 'father_dob',        type: 'date', label: 'Father DOB', help: YMD }),
  f({ col: 'father_occupation', step: 'family_emergency', key: 'father_occupation', type: 'str',  label: 'Father Occupation', help: 'Free text' }),
  f({ col: 'mother_salutation', step: 'family_emergency', key: 'mother_salutation', type: 'enum', enumValues: MOTHER_SALUTATION, label: 'Mother Salutation', help: 'Pick from the dropdown' }),
  f({ col: 'mother_name',       step: 'family_emergency', key: 'mother_name',       type: 'str',  label: 'Mother Name', help: 'Optional' }),
  f({ col: 'mother_dob',        step: 'family_emergency', key: 'mother_dob',        type: 'date', label: 'Mother DOB', help: YMD }),
  f({ col: 'mother_occupation', step: 'family_emergency', key: 'mother_occupation', type: 'str',  label: 'Mother Occupation', help: 'Free text' }),

  // ── IDs & Bank (sensitive; repeatables below) ────────────────────────────
  f({ col: 'aadhaar_number',            step: 'ids_bank', key: 'aadhaar_number',            type: 'str', requiredWithStep: true, label: 'Aadhaar Number', help: 'Required for this section. 12 digits' }),
  f({ col: 'aadhaar_name',              step: 'ids_bank', key: 'aadhaar_name',              type: 'str', requiredWithStep: true, label: 'Name as on Aadhaar', help: 'Required for this section' }),
  f({ col: 'aadhaar_dob',               step: 'ids_bank', key: 'aadhaar_dob',               type: 'date', requiredWithStep: true, label: 'DOB as on Aadhaar', help: `Required for this section. ${YMD}` }),
  f({ col: 'aadhaar_address',           step: 'ids_bank', key: 'aadhaar_address',           type: 'str', requiredWithStep: true, label: 'Address as on Aadhaar', help: 'Required for this section' }),
  f({ col: 'aadhaar_scan_url',          step: 'ids_bank', key: 'aadhaar_scan_url',          type: 'str', label: 'Aadhaar Scan URL', help: 'Optional. http(s) link or /uploads/… path to the scan' }),
  f({ col: 'pan_number',                step: 'ids_bank', key: 'pan_number',                type: 'str', label: 'PAN Number', help: 'Optional. Format ABCDE1234F' }),
  f({ col: 'pan_full_name',             step: 'ids_bank', key: 'pan_full_name',             type: 'str', label: 'PAN Full Name', help: 'Optional' }),
  f({ col: 'pan_dob',                   step: 'ids_bank', key: 'pan_dob',                   type: 'date', label: 'PAN DOB', help: YMD }),
  f({ col: 'pan_parent_spouse_name',    step: 'ids_bank', key: 'pan_parent_spouse_name',    type: 'str', label: 'PAN Parent/Spouse Name', help: 'Optional' }),
  f({ col: 'pan_scan_url',              step: 'ids_bank', key: 'pan_scan_url',              type: 'str', label: 'PAN Scan URL', help: 'Optional. Link / path to the scan' }),
  f({ col: 'passport_number',           step: 'ids_bank', key: 'passport_number',           type: 'str', label: 'Passport Number', help: 'Optional' }),
  f({ col: 'passport_full_name',        step: 'ids_bank', key: 'passport_full_name',        type: 'str', label: 'Passport Full Name', help: 'Optional' }),
  f({ col: 'passport_nationality',      step: 'ids_bank', key: 'passport_nationality',      type: 'str', label: 'Passport Nationality', help: 'Pick from the dropdown (nationality master)' }),
  f({ col: 'passport_issue_date',       step: 'ids_bank', key: 'passport_issue_date',       type: 'date', label: 'Passport Issue Date', help: YMD }),
  f({ col: 'passport_expiry',           step: 'ids_bank', key: 'passport_expiry',           type: 'date', label: 'Passport Expiry', help: `${YMD}. Must be after the issue date` }),
  f({ col: 'passport_place_of_issue',   step: 'ids_bank', key: 'passport_place_of_issue',   type: 'str', label: 'Passport Place of Issue', help: 'Optional' }),
  f({ col: 'passport_scan_url',         step: 'ids_bank', key: 'passport_scan_url',         type: 'str', label: 'Passport Scan URL', help: 'Optional. Link / path to the scan' }),
  // Yellow Fever sits with Passport in the Employee form (travel document details).
  f({ col: 'yellow_fever',              step: 'ids_bank', key: 'yellow_fever',              type: 'bool', label: 'Yellow Fever Injection', help: YESNO }),
  f({ col: 'yellow_fever_date',         step: 'ids_bank', key: 'yellow_fever_date',         type: 'date', label: 'Yellow Fever Date', help: YMD }),
  f({ col: 'driving_license_number',    step: 'ids_bank', key: 'driving_license_number',    type: 'str', label: 'Driving Licence Number', help: 'Optional' }),
  f({ col: 'driving_license_name',      step: 'ids_bank', key: 'driving_license_name',      type: 'str', label: 'Driving Licence Name', help: 'Optional' }),
  f({ col: 'driving_license_issue_date',step: 'ids_bank', key: 'driving_license_issue_date',type: 'date', label: 'Driving Licence Issue Date', help: YMD }),
  f({ col: 'driving_license_expiry',    step: 'ids_bank', key: 'driving_license_expiry',    type: 'date', label: 'Driving Licence Expiry', help: `${YMD}. Must be after the issue date` }),
  f({ col: 'driving_license_authority', step: 'ids_bank', key: 'driving_license_authority', type: 'str', label: 'Driving Licence Authority', help: 'Issuing RTO' }),
  f({ col: 'driving_license_scan_url',  step: 'ids_bank', key: 'driving_license_scan_url',  type: 'str', label: 'Driving Licence Scan URL', help: 'Optional. Link / path to the scan' }),
  // Personal bank — required for this section
  f({ col: 'personal_bank_name',        step: 'ids_bank', key: 'personal_bank_name',        type: 'str', requiredWithStep: true, label: 'Personal Bank Name', help: 'Required for this section. Pick from the dropdown (bank master)' }),
  f({ col: 'personal_bank_account',     step: 'ids_bank', key: 'personal_bank_account',     type: 'str', requiredWithStep: true, label: 'Personal Bank Account Number', help: 'Required for this section. 9-18 digits' }),
  f({ col: 'personal_ifsc',             step: 'ids_bank', key: 'personal_ifsc',             type: 'str', requiredWithStep: true, label: 'Personal IFSC Code', help: 'Required for this section. Format ABCD0123456' }),
  f({ col: 'personal_bank_branch',      step: 'ids_bank', key: 'personal_bank_branch',      type: 'str', label: 'Personal Bank Branch', help: 'Optional' }),
  // Official / salary bank — all optional (HR-set)
  f({ col: 'official_bank_name',        step: 'ids_bank', key: 'official_bank_name',        type: 'str', label: 'Official Bank Name', help: 'Optional. Salary bank. Pick from the dropdown (bank master)' }),
  f({ col: 'official_bank_account',     step: 'ids_bank', key: 'official_bank_account',     type: 'str', label: 'Official Bank Account Number', help: 'Optional. 9-18 digits' }),
  f({ col: 'official_ifsc',             step: 'ids_bank', key: 'official_ifsc',             type: 'str', label: 'Official IFSC Code', help: 'Optional. Format ABCD0123456' }),
  f({ col: 'official_bank_branch',      step: 'ids_bank', key: 'official_bank_branch',      type: 'str', label: 'Official Bank Branch', help: 'Optional' }),

  // ── Experience & Education (scalar flag; repeatables below) ──────────────
  f({ col: 'is_experienced', step: 'experience_education', key: 'is_experienced', type: 'bool', label: 'Is Experienced', help: `${YESNO} — has prior work experience` }),
];

// ── Repeatable groups → numbered columns (col{n}_field) ─────────────────────
export interface RepeatableGroup {
  step:      StepKey;
  arrayKey:  string;                     // payload key holding the array
  prefix:    string;                     // column prefix, e.g. 'experience'
  max:       number;
  requiredSubKeys: string[];             // sub-row is kept only if all of these are filled
  fields: Array<{ sub: string; key: string; type: FieldType; enumValues?: readonly string[]; help?: string; optionSource?: string }>;
}

export const REPEATABLE_GROUPS: RepeatableGroup[] = [
  {
    step: 'family_emergency', arrayKey: 'family_members', prefix: 'family_member', max: 3,
    requiredSubKeys: ['name'],
    fields: [
      { sub: 'name',               key: 'name',               type: 'str',  help: 'Member name — the row is saved only when this is filled' },
      { sub: 'relationship',       key: 'relationship',       type: 'str',  optionSource: 'relationship', help: 'Pick from the dropdown (relationship master), or "Other"' },
      { sub: 'relationship_other', key: 'relationship_other', type: 'str',  help: 'Fill only when Relationship = Other' },
      { sub: 'salutation',         key: 'salutation',         type: 'str',  optionSource: 'salutation', help: 'Pick from the dropdown (salutation master)' },
      { sub: 'dob',                key: 'dob',                type: 'date', help: 'Date — YYYY-MM-DD' },
      { sub: 'occupation',         key: 'occupation',         type: 'str',  help: 'Free text' },
    ],
  },
  {
    step: 'family_emergency', arrayKey: 'emergency_contacts', prefix: 'emergency_contact', max: 2,
    requiredSubKeys: ['contact_name', 'contact_number', 'relationship'],
    fields: [
      { sub: 'name',               key: 'contact_name',       type: 'str',  help: 'Contact name — required to save the row' },
      { sub: 'number',             key: 'contact_number',     type: 'str',  help: 'Required. 10 digits or +91…' },
      { sub: 'email',              key: 'email',              type: 'str',  help: 'Optional' },
      { sub: 'relationship',       key: 'relationship',       type: 'str',  optionSource: 'relationship', help: 'Required. Pick from the dropdown, or "Other"' },
      { sub: 'relationship_other', key: 'relationship_other', type: 'str',  help: 'Fill only when Relationship = Other' },
    ],
  },
  {
    step: 'ids_bank', arrayKey: 'vaccinations', prefix: 'vaccination', max: 3,
    requiredSubKeys: ['vaccine_name'],
    fields: [
      { sub: 'name',  key: 'vaccine_name', type: 'str',  help: 'Vaccine name (e.g. "COVID-19", "Yellow Fever") — required to save the row' },
      { sub: 'date',  key: 'date',         type: 'date', help: 'Date — YYYY-MM-DD' },
      { sub: 'notes', key: 'notes',        type: 'str',  help: 'Optional (dose, batch, etc.)' },
    ],
  },
  {
    step: 'ids_bank', arrayKey: 'documents', prefix: 'document', max: 3,
    requiredSubKeys: ['doc_type', 'file_url'],
    fields: [
      { sub: 'type',       key: 'doc_type',        type: 'str',  help: 'Document type (e.g. "Voter ID", "Marksheet") — required with a File' },
      { sub: 'type_other', key: 'doc_type_other',  type: 'str',  help: 'Fill only when Type = Other' },
      { sub: 'url',        key: 'file_url',        type: 'str',  help: 'Required. http(s) link or /uploads/… path to the file' },
    ],
  },
  {
    step: 'experience_education', arrayKey: 'experience', prefix: 'experience', max: 3,
    requiredSubKeys: ['last_company_name'],
    fields: [
      { sub: 'company',            key: 'last_company_name',       type: 'str',  help: 'Previous employer — required to save the row' },
      { sub: 'designation',        key: 'last_designation',        type: 'str',  help: 'Role held there' },
      { sub: 'last_working_day',   key: 'last_working_day',        type: 'date', help: 'Date — YYYY-MM-DD' },
      { sub: 'contact_name',       key: 'exp_contact_name',        type: 'str',  help: 'Reference / HR contact name' },
      { sub: 'contact_number',     key: 'exp_contact_number',      type: 'str',  help: '10 digits or +91…' },
      { sub: 'contact_designation',key: 'exp_contact_designation', type: 'str',  help: "Reference contact's role" },
      { sub: 'inhand_salary',      key: 'last_inhand_salary',      type: 'num',  help: 'Last in-hand salary (₹ per month)' },
    ],
  },
  {
    step: 'experience_education', arrayKey: 'education', prefix: 'education', max: 3,
    requiredSubKeys: ['highest_education'],
    fields: [
      { sub: 'highest',     key: 'highest_education',    type: 'str',  optionSource: 'qualification', help: 'Pick from the dropdown (qualification master) — required to save the row' },
      { sub: 'stream',      key: 'education_stream',     type: 'str',  help: 'e.g. "Science", "Commerce", "Mechanical"' },
      { sub: 'mode',        key: 'education_mode',       type: 'str',  optionSource: 'education_mode', help: 'Pick from the dropdown (education-mode master)' },
      { sub: 'institute',   key: 'institute_name',      type: 'str',  help: 'School / college / university' },
      { sub: 'marks',       key: 'education_marks',      type: 'str',  help: 'e.g. "72%" or "8.1 CGPA"' },
      { sub: 'start_year',  key: 'education_start_year', type: 'int',  help: 'Year, e.g. 2016' },
      { sub: 'end_year',    key: 'education_end_year',   type: 'int',  help: 'Year, e.g. 2019' },
      { sub: 'is_pursuing', key: 'is_pursuing',         type: 'bool', help: 'Yes / No — currently studying' },
    ],
  },
];

/**
 * column key → logical master list (see bulkImport.masterLists.getMasterLists).
 * Only the master/catalogue-backed columns; enum columns carry their list in
 * `enumValues` already. Repeatable sub-fields declare `optionSource` inline.
 */
export const COLUMN_OPTION_SOURCE: Record<string, string> = {
  company: 'company',
  department: 'department',
  sub_department: 'sub_department',
  designation: 'designation',
  sub_designation: 'sub_designation',
  shift: 'shift',
  weekly_off: 'weekly_off',
  grace_minutes: 'grace_minutes',
  working_state_country: 'state',
  working_city: 'city',
  working_site: 'site',
  pay_register_location: 'pay_register',
  // catalogue-backed free-text fields (dropdown is a helper, other values allowed)
  nationality: 'nationality',
  passport_nationality: 'nationality',
  religion: 'religion',
  shirt_size: 'shirt_size',
  tshirt_size: 'shirt_size',
  personal_bank_name: 'bank',
  official_bank_name: 'bank',
};

/**
 * Master-backed columns whose dropdown is ENFORCED in Excel (unknown value =
 * hard error). Kept to the canonical single-form lists. Locations and the
 * sub-* masters stay a soft warning: the importer accepts several forms (bare
 * name, "name, parent", numeric id) and those masters can legitimately be
 * sparse, so a hard block there would be misleading.
 */
const STRICT_OPTION_COLS = new Set<string>([
  'company', 'department', 'designation', 'shift', 'weekly_off', 'grace_minutes',
]);

/** Ordered list of steps the bulk importer applies (role_identity = base row). */
export const BULK_STEP_ORDER: StepKey[] = [
  'location_attendance', 'managers_work_contact', 'commitment_probation', 'statutory_schemes',
  'compensation', 'hr_joining_checklist', 'personal_profile', 'address', 'family_emergency',
  'ids_bank', 'experience_education',
];

/**
 * The 12 field-bearing wizard steps, in Employee-form order — the column-group
 * order for the bulk-import template. Mirrors WIZARD_STEPS (employee.constants),
 * minus `review` (no fields). `role_identity` is the base employees row and
 * leads; the rest follow BULK_STEP_ORDER.
 */
export const TEMPLATE_STEP_ORDER: StepKey[] = ['role_identity', ...BULK_STEP_ORDER];

/** Step key → Employee-form step label (kept in sync with WIZARD_STEPS). */
export const STEP_LABELS: Record<string, string> = {
  role_identity:         'Role & Identity',
  location_attendance:   'Location & Attendance',
  managers_work_contact: 'Managers & Work Contact',
  commitment_probation:  'Commitment & Probation',
  statutory_schemes:     'Statutory Schemes',
  compensation:          'Compensation',
  hr_joining_checklist:  'HR Joining Checklist',
  personal_profile:      'Personal Profile',
  address:               'Address',
  family_emergency:      'Family & Emergency',
  ids_bank:              'IDs & Bank',
  experience_education:  'Experience & Education',
};

/** "family_member" / "contact_name" → "Family Member" / "Contact Name" */
const titleize = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export interface TemplateColumn {
  col: string;
  label: string;
  step: string;
  stepLabel: string;
  required: boolean;
  help?: string;
  enumValues?: readonly string[];
  /** logical master list key — the endpoint resolves this to a value list */
  optionSource?: string;
  /** dropdown is enforced on import (unknown value rejected) */
  strictOptions?: boolean;
}

/**
 * Every spreadsheet column, grouped by wizard step in Employee-form order:
 * for each step, its scalar FIELD_DEFS (in form order) then its repeatable
 * groups expanded into numbered columns. This is the exact step + field order
 * of the Employee wizard, so the template reads top-to-bottom like the form.
 * Header matching on import is order-independent (see resolveHeader), so
 * re-ordering here never affects which employee a column feeds.
 */
export function allTemplateColumns(): TemplateColumn[] {
  const out: TemplateColumn[] = [];
  const scalarDone = new Set<string>();
  const groupDone = new Set<string>();

  const emitScalars = (step: string) => {
    const stepLabel = STEP_LABELS[step] ?? step;
    for (const d of FIELD_DEFS) {
      if (d.step !== step || scalarDone.has(d.col)) continue;
      scalarDone.add(d.col);
      const optionSource = d.enumValues ? undefined : COLUMN_OPTION_SOURCE[d.col];
      out.push({
        col: d.col, label: d.label, step: d.step, stepLabel,
        required: !!d.required, help: d.help, enumValues: d.enumValues,
        optionSource,
        strictOptions: d.type === 'enum' || (!!optionSource && STRICT_OPTION_COLS.has(d.col)),
      });
    }
  };
  const emitGroups = (step: string) => {
    const stepLabel = STEP_LABELS[step] ?? step;
    for (const g of REPEATABLE_GROUPS) {
      if (g.step !== step || groupDone.has(g.prefix)) continue;
      groupDone.add(g.prefix);
      for (let i = 1; i <= g.max; i++) {
        for (const gf of g.fields) {
          out.push({
            col: `${g.prefix}_${i}_${gf.sub}`,
            label: `${titleize(g.prefix)} ${i} — ${titleize(gf.sub)}`,
            step: g.step, stepLabel, required: false,
            help: gf.help, enumValues: gf.enumValues,
            optionSource: gf.enumValues ? undefined : gf.optionSource,
            strictOptions: !!gf.enumValues,
          });
        }
      }
    }
  };

  // One step at a time, in Employee-form order: its scalars, then its repeatables.
  for (const step of TEMPLATE_STEP_ORDER) { emitScalars(step); emitGroups(step); }
  // Safety net: nothing is ever silently dropped if a step key is added later.
  for (const d of FIELD_DEFS) if (!scalarDone.has(d.col)) emitScalars(d.step);
  for (const g of REPEATABLE_GROUPS) if (!groupDone.has(g.prefix)) emitGroups(g.step);
  return out;
}
