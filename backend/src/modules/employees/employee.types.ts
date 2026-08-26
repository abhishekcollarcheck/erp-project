/**
 * employees.types.ts
 * All DTOs and interfaces derived from the UNG Master Data Form spreadsheet.
 * 204 fields mapped across 15 normalized tables.
 */

import type {
  EmployeeStatus, EmploymentType, CommitmentTerm, ConfirmationStatus,
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
  email:            string;   // "Personal Email" — required
  phone:            string;   // "Personal Mobile Number" — required
  department_id:    number;
  sub_department_id?: number | null;
  designation_id:   number;
  sub_designation_id?: number | null;
}

// ─── Step 2 (HR): Location & Attendance ───────────────────────────────────────
export interface LocationAttendanceDto {
  working_state_country?:   string | null;
  working_city?:             string | null;
  working_site?:             string | null;
  pay_register_location?:    string | null;
  actual_doj:                string;         // "Date of Joining" — required
  weekly_off?:                string | null;
  shift_id?:                  number | null;
  grace_minutes?:             number | null;
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
  commitment:                  boolean;           
  commitment_term?:            CommitmentTerm;
  commitment_entered_on?:      string | null;  
  on_probation:                boolean;           
  probation_period?:           string | null;
  probation_extended_period?:  string | null;
  confirmation_status?:        ConfirmationStatus; 
  confirmed_on?:               string | null;
}

// ─── Step 5 (HR): Statutory Schemes ────────────────────────────────────────────
export interface SchemesDto {
  // PF
  pf_status:              boolean;               
  uan_number?:            string | null;
  epfo_member_id?:        string | null;
  pf_contribution_pct?:   number | null;
  pf_employer_from?:      PfEmployerFrom;
  pf_employee_12?:        number | null;
  eps_employer_833?:      number | null;
  epf_eps_diff_367?:      number | null;
  // ESIC
  esic_status:            boolean;               
  esic_number?:           string | null;
  // Mediclaim
  mediclaim_status:       MediclaimStatus;       
  mediclaim_number?:      string | null;
  mediclaim_amount?:      number | null;
  // RD
  rd_scheme:              boolean;               
  rd_term?:               RdTerm;
  rd_opening_date?:       string | null;
  rd_account_number?:     string | null;
  rd_deduction_from?:     DeductionFrom;
  rd_amount_employee?:    number | null;
  rd_amount_employer?:    number | null;
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
  marital_status:   MaritalStatus;    
  marriage_date?:   string | null;
  spouse_name?:     string | null;
  spouse_dob?:      string | null;
  child1_name?:     string | null;
  child1_dob?:      string | null;
  child2_name?:     string | null;
  child2_dob?:      string | null;
  child3_name?:     string | null;
  child3_dob?:      string | null;
}

// ─── Step 7: Address ─────────────────────────────────────────────────────────
export interface AddressDto {
  // Present (all MANDATORY)
  present_house_type:   HouseType;
  present_house_no:     string;
  present_area?:        string | null;
  present_district:     string;
  present_city:         string;
  present_state:        string;
  present_country:      string;
  present_pincode:      string;
  // Permanent
  perm_address_type:    PermAddressType;  
  perm_house_type?:     HouseType;
  perm_house_no?:       string | null;
  perm_area?:           string | null;
  perm_district?:       string | null;
  perm_city?:           string | null;
  perm_state?:          string | null;
  perm_country?:        string | null;
  perm_pincode?:        string | null;
}

// ─── Step 9 (Candidate): Family & Emergency ───────────────────────────────────
export interface FamilyDto {
  marital_status:      MaritalStatus;
  father_salutation:   FatherSalutation;        
  father_name:         string;                  
  father_dob?:         string | null;
  father_occupation?:  string | null;
  mother_salutation:   MotherSalutation;        
  mother_name:         string;                  
  mother_dob?:         string | null;
  mother_occupation?:  string | null;
}

// NEW — repeatable "Other Family Members" (brother, sister, other relatives)
export interface FamilyMemberDto {
  id?:            number;
  name:           string;
  relationship?:  string | null;
  dob?:           string | null;
  occupation?:    string | null;
}

// ─── Step 9 (Candidate): Emergency Contact ────────────────────────────────────
export interface EmergencyContactDto {
  contact_name:    string;           
  contact_number:  string;
  email?:          string | null;
  relationship:    string;
  is_primary?:     boolean;
}

// ─── Step 10 (Candidate): IDs & Bank ──────────────────────────────────────────
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
}

// NEW — repeatable vaccinations list
export interface VaccinationDto {
  id?:            number;
  vaccine_name:   string;
  date?:          string | null;
  notes?:         string | null;
}

// NEW — repeatable "additional documents" list
export interface DocumentDto {
  id?:             number;
  doc_type:        string;
  doc_type_other?: string | null;
  file_url:        string;
}

export interface BankDto {
  // Personal bank (required — the "Needed" pill in the UI)
  personal_bank_name:     string;
  personal_bank_account:  string;
  personal_ifsc:          string;
  personal_bank_branch?:  string | null;
}

// ─── Step 11 (Candidate): Experience & Education ─────────────────────────────
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
export interface SalaryDto {
  salary_mode:          SalaryMode;    
  // Current salary
  current_basic:        number;
  current_hra:          number;
  current_allowance1:   number;
  current_amdb:         number;
  // Salary at joining
  joining_basic:        number;
  joining_hra:          number;
  joining_allowance1:   number;
  joining_amdb:         number;
  // Asset deduction
  asset_deduction_applicable: boolean; 
  security_amount?:     number | null;
  deduction_months?:    DeductionMonths;
  deduction_from?:      DeductionFrom;
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
  transfer_order:    number;    // 1-5
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
export interface EmployeeFullResponse {
  id:                  number;
  employee_code:       string | null;   // null/pending until HR+Candidate both reach 100%
  avatar_url?:         string | null;
  status:              EmployeeStatus;
  record_status:       'Draft' | 'Final';
  first_name:          string;
  middle_name?:        string | null;
  last_name:           string;
  full_name:           string;
  employment_type:     EmploymentType;
  email:               string | null;
  phone:                string;
  official_email?:      string | null;
  official_mobile?:     string | null;
  form_completion_pct: number;          // overall (average of hr/candidate)
  hr_completion_pct:    number;
  candidate_completion_pct: number;
  department?:         { id: number; name: string };
  designation?:        { id: number; name: string };
  company?:            { id: number; name: string };
  l1_manager?:         { id: number; first_name: string; last_name: string; };
  shift?:              { id: number; name: string; start_time: string; end_time: string };
  commitment_probation?: CommitmentProbationDto;
  schemes?:            SchemesDto;
  salary?:             Partial<SalaryDto>;     // may be masked
  onboarding_docs?:    OnboardingDocsDto;
  personal?:           PersonalDto;
  addresses?:          AddressDto[];
  family?:             FamilyDto;
  family_members?:     FamilyMemberDto[];
  emergency_contacts?: EmergencyContactDto[];
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