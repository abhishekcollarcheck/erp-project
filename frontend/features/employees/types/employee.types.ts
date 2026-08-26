'use client';

// ─── Primitive enums from spreadsheet + real product UI ──────────────────────
export type EmployeeStatus      = 'Active' | 'Left' | 'Retired' | 'On Notice' | 'Relieved' | 'Absconded' | 'Inactive';
export type EmploymentType      = 'Permanent' | 'Contract' | 'Intern' | 'Consultant' | 'Probation';
export type Gender              = 'Male' | 'Female';
export type BloodGroup          = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Not Available';
export type MaritalStatus       = 'Unmarried' | 'Married' | 'Divorced' | 'Widow' | 'Widower';
export type HouseType           = 'Owned' | 'Rented' | 'Company Provided' | 'PG / Hostel' | 'Other';
export type PermAddressType     = 'Same as Present' | 'Different' | 'Not Applicable';
export type MediclaimStatus     = 'Yes' | 'No' | 'Not Applicable';
export type SalaryMode          = 'Bank Transfer' | 'Cash' | 'Cheque';
export type ConfirmationStatus  = 'Confirmed' | 'Failed' | 'Not Applicable';

// ─── Core employee (list + card view) ────────────────────────────────────────
export interface Employee {
  id:                     number;
  employee_code:          string | null;   // null/pending until HR+Candidate parts both reach 100%
  company_id:             number | null;
  first_name:             string;
  middle_name?:           string | null;
  last_name:              string;
  status:                 EmployeeStatus;
  record_status:          'Draft' | 'Final';
  employment_type:        EmploymentType;
  email:                  string;          // "Personal Email" — required
  phone:                  string;          // "Personal Mobile Number" — required
  official_email?:        string | null;   // "Work Email" — optional
  official_mobile?:       string | null;   // "Work Mobile" — optional
  department_id?:         number | null;
  sub_department_id?:     number | null;
  designation_id?:        number | null;
  sub_designation_id?:    number | null;
  l1_manager_id?:         number | null;
  l2_manager_id?:         number | null;
  actual_doj?:            string | null;
  current_doj?:           string | null;
  working_site?:          string | null;
  working_city?:          string | null;
  working_state_country?: string | null;
  pay_register_location?: string | null;
  shift_id?:              number | null;
  weekly_off:              string | null;
  grace_minutes:          number | null;
  form_completion_pct:    number;          // overall — average of hr_completion_pct/candidate_completion_pct
  hr_completion_pct?:      number;
  candidate_completion_pct?: number;
  avatar_url?:            string | null;
  // Auth fields (read-only in wizard)
  portal_access:          boolean;
  is_super_admin:         boolean;
  last_login_at?:         string | null;
  // Associations (from includes)
  l1Manager?:             ManagerRef | null;
  company?:               { id: number; name: string } | null;
  department?:            { id: number; name: string } | null;
  designation?:           { id: number; name: string } | null;
  l2Manager?:             ManagerRef | null;
  commitmentProbation?:   CommitmentProbation | null;
  schemes?:               EmployeeSchemes | null;
  personal?:              EmployeePersonal | null;
  family?:                EmployeeFamily | null;
  familyMembers?:         FamilyMember[];
  addresses?:             EmployeeAddress[];
  emergencyContacts?:     EmergencyContact[];
  statutory?:              EmployeeStatutory | null;
  vaccinations?:           Vaccination[];
  documents?:              EmployeeDocument[];
  bankDetails?:            EmployeeBankDetail[];
  salaries?:               EmployeeSalary[];
  assetDeduction?:        EmployeeAssetDeduction | null;
  experienceFlag?:        { is_experienced: boolean } | null;
  experience?:             EmployeeExperience[];
  education?:               EmployeeEducation[];
  onboardingDocs?:         OnboardingDocs | null;
  transfers?:              EmployeeTransfer[];
  exit?:                   EmployeeExit | null;
  created_at:              string;
  updated_at:              string;
}

export interface ManagerRef {
  id:             number;
  employee_code:  string | null;
  first_name:     string;
  last_name:      string;
  email?: string | null;
}

// ─── Sub-entities ─────────────────────────────────────────────────────────────
export interface CommitmentProbation {
  commitment:                boolean;
  commitment_term?:          string | null;
  commitment_entered_on?:    string | null;
  commitment_end_date?:      string | null;
  commitment_status?:        string | null;
  on_probation:              boolean;
  probation_period?:         string | null;
  probation_end_date?:       string | null;
  probation_status?:         string | null;
  probation_extended_period?:string | null;
  probation_final_status?:   string | null;
  confirmation_status?:      ConfirmationStatus | null;
  confirmed_on?:             string | null;
}

export interface EmployeeSchemes {
  pf_status:            boolean;
  uan_number?:          string | null;
  epfo_member_id?:      string | null;
  pf_contribution_pct?: number | null;
  pf_employer_from?:    string | null;
  pf_employee_12?:      number | null;
  eps_employer_833?:    number | null;
  epf_eps_diff_367?:    number | null;
  esic_status:          boolean;
  esic_number?:         string | null;
  mediclaim_status:     MediclaimStatus;
  mediclaim_number?:    string | null;
  mediclaim_amount?:    number | null;
  rd_scheme:            boolean;
  rd_term?:             string | null;
  rd_opening_date?:     string | null;
  rd_account_number?:   string | null;
  rd_deduction_from?:   string | null;
  rd_amount_employee?:  number | null;
  rd_amount_employer?:  number | null;
  rd_maturity_date?:    string | null;
  rd_maturity_amount?:  number | null;
  rd_status?:           string | null;
}

// personal_email/personal_mobile removed — those ARE employees.email/phone now.
export interface EmployeePersonal {
  date_of_birth?:   string | null;
  gender?:          Gender | null;
  shirt_size?:      string | null;
  tshirt_size?:     string | null;
  nationality?:     string | null;
  religion?:        string | null;
  blood_group?:     BloodGroup | null;
  marital_status?:  MaritalStatus | null;   // shown on the Family & Emergency screen, still lives here
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

// father_status dropped, father_age_dob/mother_age_dob renamed to real dates,
// mother_occupation is now free text (not a constrained enum).
export interface EmployeeFamily {
  father_salutation?:  string | null;
  father_name?:        string | null;
  father_dob?:         string | null;
  father_occupation?:  string | null;
  mother_salutation?:  string | null;
  mother_name?:        string | null;
  mother_dob?:         string | null;
  mother_occupation?:  string | null;
}

// NEW — repeatable "Other Family Members"
export interface FamilyMember {
  id:            number;
  name:          string;
  relationship?: string | null;
  dob?:          string | null;
  occupation?:   string | null;
}

export interface EmployeeAddress {
  id:                  number;
  address_type:        'present' | 'permanent';
  house_type?:         HouseType | null;
  house_no?:           string | null;
  area?:               string | null;
  district?:           string | null;
  city?:               string | null;
  state?:              string | null;
  country?:            string | null;
  pincode?:            string | null;
  is_same_as_present:  boolean;
}

// Added email; supports multiple contacts via is_primary
export interface EmergencyContact {
  id:             number;
  contact_name:   string;
  contact_number: string;
  email?:         string | null;
  relationship:   string;
  is_primary:     boolean;
}

// Substantially expanded — name-as-on-document, DOB, issue date, place of
// issue, and scan URL added per ID type.
export interface EmployeeStatutory {
  aadhaar_number?:            string | null; // will be masked
  aadhaar_name?:               string | null;
  aadhaar_dob?:                string | null;
  aadhaar_address?:            string | null;
  aadhaar_scan_url?:           string | null;
  pan_number?:                 string | null; // will be masked
  pan_full_name?:              string | null;
  pan_dob?:                    string | null;
  pan_parent_spouse_name?:     string | null;
  pan_scan_url?:                string | null;
  passport_number?:            string | null;
  passport_full_name?:         string | null;
  passport_nationality?:       string | null;
  passport_issue_date?:        string | null;
  passport_expiry?:            string | null;
  passport_place_of_issue?:    string | null;
  passport_scan_url?:          string | null;
  driving_license_number?:     string | null;
  driving_license_name?:       string | null;
  driving_license_issue_date?: string | null;
  driving_license_expiry?:     string | null;
  driving_license_authority?:  string | null;
  driving_license_scan_url?:   string | null;
  // Legacy single flag — superseded by the Vaccination[] list below
  yellow_fever?:               boolean;
  yellow_fever_date?:          string | null;
}

// NEW — repeatable vaccinations list
export interface Vaccination {
  id:            number;
  vaccine_name:  string;
  date?:         string | null;
  notes?:        string | null;
}

// NEW — repeatable "additional documents" list
export interface EmployeeDocument {
  id:              number;
  doc_type:        string;
  doc_type_other?: string | null;
  file_url:        string;
}

export interface EmployeeBankDetail {
  id:              number;
  bank_type:       'personal' | 'official';
  bank_name?:      string | null;
  account_number?: string | null; // may be masked
  ifsc_code?:      string | null;
  branch_name?:    string | null;
}

export interface EmployeeSalary {
  id:               number;
  salary_type:      'current' | 'joining';
  salary_mode?:     SalaryMode | null;
  basic?:           number | null;
  hra?:             number | null;
  allowance1?:      number | null;
  gross_salary_pm?: number | null;
  amdb_pm?:         number | null;
  total_earning_pm?:number | null;
  effective_from?:  string | null;
}

export interface EmployeeAssetDeduction {
  asset_deduction_applicable: boolean;
  security_amount?:           number | null;
  deduction_months?:          string | null;
  deduction_from?:            string | null;
  monthly_deduction?:         number | null;
  final_monthly_deduction?:   number | null;
  last_installment?:          number | null;
}

// Now one-to-many — repeatable "add earlier ones if needed"
export interface EmployeeExperience {
  id:                        number;
  last_company_name?:       string | null;
  last_designation?:        string | null;
  last_working_day?:        string | null;
  exp_contact_name?:        string | null;
  exp_contact_number?:      string | null;
  exp_contact_designation?: string | null;
  last_inhand_salary?:      number | null;
}

// Now one-to-many — repeatable "+ Add qualification". passing_year replaced
// with start/end year + is_pursuing.
export interface EmployeeEducation {
  id:                     number;
  highest_education?:    string | null;
  education_stream?:     string | null;
  education_mode?:       string | null;
  institute_name?:       string | null;
  education_marks?:      string | null;
  education_start_year?: number | null;
  education_end_year?:   number | null;
  is_pursuing?:           boolean;
}

export interface OnboardingDocs {
  offer_letter:             boolean;
  address_verification:     boolean;
  service_agreement:        boolean;
  indemnity_bond:           boolean;
  asset_deduction_letter:   boolean;
  account_opening_letter:   boolean;
  nda:                      boolean;
  remarks?:                 string | null;
}

export interface EmployeeTransfer {
  id:               number;
  transfer_order:   number;
  transferred_on?:  string | null;
  new_company?:     string | null;
  new_joining_date?:string | null;
  new_location?:    string | null;
  new_department?:  string | null;
  new_job_title?:   string | null;
  old_company?:     string | null;
  exit_date?:       string | null;
  old_location?:    string | null;
  old_department?:  string | null;
  old_job_title?:   string | null;
  old_emp_code?:    string | null;
}

export interface EmployeeExit {
  resignation_submitted?:  boolean;
  resignation_date?:       string | null;
  notice_period?:          string | null;
  last_working_day?:       string | null;
  exit_formalities_done?:  boolean;
  exit_status?:            string | null;
  exit_remarks?:           string | null;
  verified?:               boolean;
  verified_by?:            string | null;
  verification_remarks?:   string | null;
}

// Extended to all 7 statuses + draft (employee_code still pending)
export interface EmployeeSummary {
  total:      number;
  active:     number;
  left:       number;
  retired:    number;
  onNotice:   number;
  relieved:   number;
  absconded:  number;
  inactive:   number;
  draft:      number;
}

export interface BulkUploadResult {
  total: number; success: number; failed: number;
  errors: { row: number; name: string; reason: string }[]; inserted: number[];
}