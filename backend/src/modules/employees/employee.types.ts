/**
 * employees.types.ts
 * All DTOs and interfaces derived from the UNG Master Data Form spreadsheet.
 * Employee is the root/main table again — Role & Identity (Step 1) lives
 * directly on it, since that data is used by nearly every query in the
 * system, unlike the genuinely-optional step tables. Location & Attendance
 * (Step 2) and Managers & Work Contact (Step 3) remain separate child tables;
 * the API layer (employee.service.ts's flattenEmployee()) merges just those
 * two back to a flat shape, which is what EmployeeFullResponse below describes.
 */

import type {
  EmployeeStatus, EmploymentType, CommitmentTerm, ProbationStatus,
  PfEmployerFrom, MediclaimStatus, RdTerm, HouseType, PermAddressType,
  FatherSalutation, MotherSalutation, MotherOccupationStatus,
  ParentOccupationStatus, SalaryMode, DeductionFrom, DeductionMonths,
  Gender, BloodGroup, MaritalStatus, StepKey,
} from './employee.constants';

// ─── Query params ─────────────────────────────────────────────────────────────
export interface EmployeeQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: EmployeeStatus;
  record_status?: 'Draft' | 'Final';
  employment_type?: EmploymentType;
  department_id?: number | string;
  designation_id?: number | string;
  company_id?: number | string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// ─── Step 1 (HR): Role & Identity ─────────────────────────────────────────────
export interface RoleIdentityDto {
  company_id:       number;
  first_name:       string;
  middle_name?:     string | null;
  last_name:        string;
  status:           EmployeeStatus;
  employment_type:  EmploymentType;
  email:            string;  
  phone:            string; 
  department_id:    number;
  sub_department_id?: number | null;
  designation_id:   number;
  sub_designation_id?: number | null;
}

// ─── Step 2 (HR): Location & Attendance ───────────────────────────────────────
export interface LocationAttendanceDto {
  working_state_country:    number | null;
  working_city:             number | null;
  working_site:             number | null;
  pay_register_location:    number | null;
  actual_doj:               string;
  current_doj?:             string | null;   // joining date at current company after a transfer
  weekly_off:               number | null;
  shift_category?:          'Shift' | 'Duration';
  shift_id:                 number | null;
  grace_minutes:            number | null;
}

// ─── Step 3 (HR): Managers & Work Contact ─────────────────────────────────────
export interface ManagersWorkContactDto {
  l1_manager_id:     number | null;
  l2_manager_id?:    number | null;
  official_email?:   string | null;
  official_mobile?:  string | null;
}

// ─── Step 4: Commitment & Probation ──────────────────────────────────────────
export interface CommitmentProbationDto {
  commitment: boolean;
  commitment_term?: CommitmentTerm | null;
  commitment_entered_on?: string | null;
  commitment_end_date?: string | null;

  on_probation: boolean;
  probation_period?: string | null;
  probation_end_date?: string | null;
  probation_status?: ProbationStatus | null;
}

// ─── Step 5 (HR): Statutory Schemes ────────────────────────────────────────────
export interface SchemesDto {
  pf_status?:              boolean;
  uan_number?:             string | null;
  epfo_member_id?:         string | null;
  pf_contribution_pct?:    number | null;
  pf_employer_from?:       string | null;
  pf_employee_12?:         number | null;
  eps_employer_833?:       number | null;
  epf_eps_diff_367?:       number | null;
  esic_status?:            boolean;
  esic_number?:            string | null;
  esi_employee_pct?:       number | null;
  esi_employer_pct?:       number | null;
  mediclaim_status?:       'Yes' | 'No' | 'Not Applicable' | null;
  mediclaim_number?:       string | null;
  mediclaim_amount?:       '150000' | '250000' | '400000' | '500000' | 'Not Applicable' | null;
  rd_scheme?:              boolean;
  rd_term?:                '6 Months' | '12 Months' | '18 Months' | '24 Months' | '30 Months' | '36 Months' | 'N/A' | null;
  rd_opening_date?:        string | null;
  rd_account_number?:      string | null;
  rd_deduction_from?:      'Salary' | 'AMDB' | 'N/A' | null;
  rd_amount_employee?:     number | null;
  rd_amount_employer?:     number | null;
  ttl_m_contribution?:     number | null;
  rd_maturity_date?:       string | null;
  rd_maturity_amount?:     number | null;
  rd_status?:              'Yes' | 'No' | 'Not Applicable' | null;
}

// ─── Step 8 (Candidate): Personal Profile ─────────────────────────────────────
export interface PersonalDto {
  date_of_birth:    string;
  gender:           Gender;
  shirt_size:       string;
  tshirt_size:      string;
  nationality:      string;
  religion:         string;
  blood_group:      BloodGroup;
}

// ─── Step 9: Address ─────────────────────────────────────────────────────────
export interface AddressDto {
  // Present Address
  present_house_type: HouseType | null;
  present_house_no: string | null;
  present_area: string | null;
  present_district: string | null;
  present_city: string | null;
  present_state: string | null;
  present_country: string | null;
  present_pincode: string | null;

  // Permanent Address
  perm_address_type: PermAddressType | null;
  perm_house_type: HouseType | null;
  perm_house_no: string | null;
  perm_area: string | null;
  perm_district: string | null;
  perm_city: string | null;
  perm_state: string | null;
  perm_country: string | null;
  perm_pincode: string | null;
}

// ─── Step 10 (Candidate): Family & Emergency ───────────────────────────────────
// marital_status + spouse + children now handled here (previously lived on
// PersonalDto) — they're all shown on this screen in the UI, matching
// employee.service.ts's routeStep('family_emergency') which reads them here.
export interface FamilyDto {
  marital_status:      MaritalStatus;
  marriage_date?:      string | null;
  spouse_name?:        string | null;
  spouse_dob?:         string | null;
  child1_name?:        string | null;
  child1_gender?:      Gender | null;
  child1_dob?:         string | null;
  child2_name?:        string | null;
  child2_gender?:      Gender | null;
  child2_dob?:         string | null;
  child3_name?:        string | null;
  child3_gender?:      Gender | null;
  child3_dob?:         string | null;
  father_salutation:   FatherSalutation;
  father_name:         string;
  father_dob?:         string | null;
  father_occupation?:  string | null;
  mother_salutation:   MotherSalutation;
  mother_name:         string;
  mother_dob?:         string | null;
  mother_occupation?:  string | null;
}

// Repeatable "Other Family Members" (brother, sister, other relatives).
export interface FamilyMemberDto {
  id?:                 number;
  name:                string;
  relationship?:       string | null;
  relationship_other?: string | null;
  salutation?:         string | null;
  dob?:                string | null;
  occupation?:         string | null;
}

// ─── Step 10 (Candidate): Emergency Contact ────────────────────────────────────
// Repeatable list — first entry is the primary contact.
export interface EmergencyContactDto {
  contact_name:        string;
  contact_number:      string;
  email?:              string | null;
  relationship:        string;
  relationship_other?: string | null;
  is_primary?:         boolean;
}

// ─── Step 11 (Candidate): IDs & Bank ──────────────────────────────────────────
export interface StatutoryDto {
  // Aadhaar (required)
  aadhaar_number:            string;
  aadhaar_name:               string;
  aadhaar_dob:                string;
  aadhaar_address:            string;
  aadhaar_scan_url?:          string | null;
  // PAN (optional)
  pan_number?:                string | null;
  pan_full_name?:             string | null;
  pan_dob?:                   string | null;
  pan_parent_spouse_name?:    string | null;
  pan_scan_url?:               string | null;
  // Passport (optional)
  passport_number?:           string | null;
  passport_full_name?:        string | null;
  passport_nationality?:      string | null;
  passport_issue_date?:       string | null;
  passport_expiry?:           string | null;
  passport_place_of_issue?:   string | null;
  passport_scan_url?:         string | null;
  // Driving licence (optional)
  driving_license_number?:    string | null;
  driving_license_name?:      string | null;
  driving_license_issue_date?: string | null;
  driving_license_expiry?:    string | null;
  driving_license_authority?: string | null;
  driving_license_scan_url?:  string | null;
  // Travel Document Details, sheet row 123 — DB columns already existed
  // (yellow_fever / yellow_fever_date) but were never wired through this
  // DTO, buildPayload, or routeStep.
  yellow_fever?:               boolean;
  yellow_fever_date?:          string | null;
}

export interface VaccinationDto {
  id?:            number;
  vaccine_name:   string;
  date?:          string | null;
  notes?:         string | null;
}

export interface DocumentDto {
  id?:             number;
  doc_type:        string;
  doc_type_other?: string | null;
  file_url:        string;
}

export interface BankDto {
  personal_bank_name:     string;
  personal_bank_account:  string;
  personal_ifsc:          string;
  personal_bank_branch?:  string | null;
}

// ─── Step 12 (Candidate): Experience & Education ─────────────────────────────
export interface ExperienceDto {
  id?:                       number;
  last_company_name?:       string | null;
  last_designation?:        string | null;
  last_working_day?:        string | null;
  exp_contact_name?:        string | null;
  exp_contact_number?:      string | null;
  exp_contact_designation?: string | null;
  last_inhand_salary?:      number | null;
}

export interface EducationDto {
  id?:                    number;
  highest_education:      string;
  education_stream?:      string | null;
  education_mode?:        string | null;
  institute_name?:        string | null;
  education_marks?:       string | null;
  education_start_year?:  number | null;
  education_end_year?:    number | null;
  is_pursuing?:           boolean;
}

export interface ExperienceEducationDto {
  is_experienced: boolean;
  experience:     ExperienceDto[];
  education:      EducationDto[];
}

// ─── Step 6 (HR): Compensation ────────────────────────────────────────────────
// deduction_months is now a plain number (was a "12 Months"-style string
// dropdown label). deduction_from IS the Salary/AMDB/N/A enum — confirmed
// against the source spreadsheet's actual Excel data validation on cell
// B213 (list "Salary,AMDB,N/A"), which matches DEDUCTION_FROM in
// employee_constants.ts and what StepCompensation.tsx's FormSelect already
// sends. A prior edit here incorrectly retyped this as a date string; that
// was the bug — reverted back to the enum to match the real UI and sheet.
export interface SalaryDto {
  salary_mode:          SalaryMode;
  current_basic:        number;
  current_hra:          number;
  current_allowance1:   number;
  current_amdb:         number;
  joining_basic:        number;
  joining_hra:          number;
  joining_allowance1:   number;
  joining_amdb:         number;
  asset_deduction_applicable: boolean;
  security_amount?:     number | null;
  deduction_months?:    number | null;
  deduction_from?:      DeductionFrom | null;
  monthly_deduction?:   number | null;
  final_monthly_deduction?: number | null;
}

// ─── Step 7 (HR): HR Joining Checklist ────────────────────────────────────────
export interface OnboardingDocsDto {
  offer_letter:               boolean;
  address_verification:       boolean;
  service_agreement:          boolean;
  indemnity_bond:             boolean;
  asset_deduction_letter:     boolean;
  account_opening_letter:     boolean;
  nda:                        boolean;
  remarks?:                   string | null;
}

// ─── Transfer Record (optional, up to 5) ─────────────────────────────────────
export interface TransferDto {
  transfer_order:    number;
  transferred_on?:   string | null;
  new_company?:      string | null;
  new_joining_date?: string | null;
  new_location?:     string | null;
  new_department?:   string | null;
  new_job_title?:    string | null;
  old_company?:      string | null;
  exit_date?:        string | null;
  old_location?:     string | null;
  old_department?:   string | null;
  old_job_title?:    string | null;
  old_emp_code?:     string | null;
}

// ─── Exit Details ─────────────────────────────────────────────────────────────
export interface ExitDto {
  resignation_submitted?:  boolean;
  resignation_date?:       string | null;
  notice_period?:          string | null;
  last_working_day?:       string | null;
  exit_formalities_done?:  boolean;
  exit_status?:            string | null;
  exit_remarks?:           string | null;
}

// ─── Step update union ────────────────────────────────────────────────────────
export type StepUpdateDto =
  | RoleIdentityDto
  | LocationAttendanceDto
  | ManagersWorkContactDto
  | CommitmentProbationDto
  | SchemesDto
  | SalaryDto
  | OnboardingDocsDto
  | PersonalDto
  | AddressDto
  | (FamilyDto & { family_members?: FamilyMemberDto[]; emergency_contacts?: EmergencyContactDto[] })
  | (StatutoryDto & { vaccinations?: VaccinationDto[]; documents?: DocumentDto[] } & BankDto)
  | ExperienceEducationDto
  | { transfers: TransferDto[] }
  | ExitDto;

// ─── Full employee response ───────────────────────────────────────────────────
// Matches the flat shape produced by employee.service.ts's flattenEmployee() —
// Steps 2 & 3's fields are merged back to the top level from their child tables
// (EmployeeLocationAttendance, EmployeeManagersWorkContact) so this response
// contract stays flat despite that part of the table split. Role & Identity
// (Step 1) lives directly on the root Employee table again — no merging needed.
export interface EmployeeFullResponse {
  id:                  number;
  employee_code:       string | null;   // null/pending until HR+Candidate both reach 100%
  reference_code:      string | null;   // tracking-only, traces back to the source Candidate record
  avatar_url?:         string | null;
  status:              EmployeeStatus;
  record_status:       'Draft' | 'Final';

  // ── Step 1 · Role & Identity (directly on the root Employee table) ───────
  first_name:          string;
  middle_name?:        string | null;
  last_name:           string;
  full_name:           string;
  company_id?:         number | null;
  employment_type:     EmploymentType;
  department_id?:      number | null;
  sub_department_id?:  number | null;
  designation_id?:     number | null;
  sub_designation_id?: number | null;
  email:               string | null;
  phone:                string;

  // ── Step 2 · Location & Attendance (from EmployeeLocationAttendance) ────
  working_state_country?: number | null;   // dropdown ID now, not a name
  working_city?:           number | null;
  working_site?:           number | null;
  pay_register_location?:  number | null;
  actual_doj?:             string | null;
  current_doj?:            string | null;
  weekly_off?:             string | null;
  shift_category?:        'Shift' | 'Duration' | null;
  shift_id?:               number | null;
  grace_minutes?:          number | null;

  // ── Step 3 · Managers & Work Contact (from EmployeeManagersWorkContact) ─
  l1_manager_id?:      number | null;
  l2_manager_id?:      number | null;
  official_email?:      string | null;
  official_mobile?:     string | null;

  form_completion_pct: number;          // overall (average of hr/candidate)
  hr_completion_pct?:    number;
  candidate_completion_pct?: number;

  // ── Resolved lookups ──────────────────────────────────────────────────────
  department?:         { id: number; name: string } | null;
  designation?:        { id: number; name: string } | null;
  company?:            { id: number; name: string } | null;
  l1Manager?:          { id: number; employee_code: string | null; first_name: string; last_name: string } | null;
  l2Manager?:          { id: number; employee_code: string | null; first_name: string; last_name: string } | null;

  commitment_probation?: CommitmentProbationDto;
  schemes?:            SchemesDto;
  salary?:             Partial<SalaryDto>;     // may be masked
  onboarding_docs?:    OnboardingDocsDto;
  personal?:           PersonalDto;
  addresses?:          AddressDto[];
  family?:             FamilyDto;
  emergency_contacts?: EmergencyContactDto[];
  family_members?:     FamilyMemberDto[];
  statutory?:          Partial<StatutoryDto>;  // may be masked
  vaccinations?:       VaccinationDto[];
  documents?:          DocumentDto[];
  bank?:               Partial<BankDto>;       // may be masked
  experience_education?: ExperienceEducationDto;
  transfers?:          TransferDto[];
  exit?:               ExitDto;
  created_at:          string;
  updated_at:          string;
}

// ─── Field permission types ───────────────────────────────────────────────────
export interface FieldPermEntry {
  can_view:     boolean;
  can_edit:     boolean;
  can_copy:     boolean;
  can_download: boolean;
  is_masked:    boolean;
}

export type FieldPermissionMap = Record<string, FieldPermEntry>;

// ─── Bulk upload ─────────────────────────────────────────────────────────────
export interface BulkUploadRow {
  first_name:       string;
  last_name:        string;
  employment_type?: string;
  working_city?:    string;
  actual_doj?:      string;
  department?:      string;
  designation?:     string;
  [key: string]:    unknown;
}

export interface BulkUploadResult {
  total:    number;
  success:  number;
  failed:   number;
  errors:   Array<{ row: number; name: string; reason: string }>;
  created:  number[];
}