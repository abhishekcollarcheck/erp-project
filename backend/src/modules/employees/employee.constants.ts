/**
 * employees.constants.ts
 * Every dropdown value sourced directly from spreadsheet data validations.
 * Cell references included for traceability.
 */

// F6
export const EMPLOYEE_STATUS = ['Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive'] as const;
export type EmployeeStatus = typeof EMPLOYEE_STATUS[number];

// E15
export const EMPLOYMENT_TYPE = ['Permanent', 'Contract', 'Intern', 'Consultant', 'Probation'] as const;
export type EmploymentType = typeof EMPLOYMENT_TYPE[number];

// B50 (Yes/No fields — used across many cells)
export const YES_NO = ['Yes', 'No'] as const;

// E50
export const COMMITMENT_TERM = ['36 Months', '60 Months', 'N/A'] as const;
export type CommitmentTerm = typeof COMMITMENT_TERM[number];

// Master Data Form, cells E56/E58 — validated against Working Sheet col N.
// Was imported by StepCommitmentProbation.tsx but never exported here.
export const PROBATION_PERIOD = ['3 Months', '4 Months', '6 Months', '9 Months', '12 Months', 'Not Applicable'] as const;
export type ProbationPeriod = typeof PROBATION_PERIOD[number];

// B60
export const PROBATION_STATUS = ['Confirmed', 'Failed', 'Not Applicable'] as const;
export type ProbationStatus = typeof PROBATION_STATUS[number];

// H67
export const PF_EMPLOYER_FROM = ['Employee', 'Employer', 'N/A'] as const;
export type PfEmployerFrom = typeof PF_EMPLOYER_FROM[number];

// E75
export const MEDICLAIM_STATUS = ['Yes', 'No', 'Not Applicable'] as const;
export type MediclaimStatus = typeof MEDICLAIM_STATUS[number];

// E81
export const RD_TERM = ['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A'] as const;
export type RdTerm = typeof RD_TERM[number];

// B97 / F97
export const HOUSE_TYPE = ['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other'] as const;
export type HouseType = typeof HOUSE_TYPE[number];

// F95
export const PERM_ADDRESS_TYPE = ['Same as Present', 'Different', 'Not Applicable'] as const;
export type PermAddressType = typeof PERM_ADDRESS_TYPE[number];

// B152
export const FATHER_SALUTATION = ['Mr.', 'Dr.', 'Late'] as const;
export type FatherSalutation = typeof FATHER_SALUTATION[number];

// E154 — Mother's salutation
export const MOTHER_SALUTATION = ['Mrs.', 'Ms.', 'Dr.', 'Late'] as const;
export type MotherSalutation = typeof MOTHER_SALUTATION[number];

// B154 — DEPRECATED: father_status column was dropped from employee_family
// (schema now uses a single free-text father_occupation field, matching the UI).
// Left exported in case other files still reference this type.
export const PARENT_OCCUPATION_STATUS = ['Working', 'Retired', 'Not Applicable'] as const;
export type ParentOccupationStatus = typeof PARENT_OCCUPATION_STATUS[number];

// E156 — DEPRECATED: mother_occupation is now free text in the schema (matching
// the UI's plain text input), not this constrained enum. Left exported in case
// other files still reference this type.
export const MOTHER_OCCUPATION_STATUS = ['Working', 'Retired', 'Not Applicable', 'House Wife'] as const;
export type MotherOccupationStatus = typeof MOTHER_OCCUPATION_STATUS[number];

// B197
export const SALARY_MODE = ['Bank Transfer', 'Cash', 'Cheque'] as const;
export type SalaryMode = typeof SALARY_MODE[number];

// B213, E83
export const DEDUCTION_FROM = ['Salary', 'AMDB', 'N/A'] as const;
export type DeductionFrom = typeof DEDUCTION_FROM[number];

// H211 — DEPRECATED: Asset deduction's deduction_months is now a plain
// INTEGER on the schema (was this "12 Months"-style dropdown label). Left
// exported in case other files still reference the type.
export const DEDUCTION_MONTHS = [
  '3 Months', '6 Months', '9 Months', '12 Months', '15 Months',
  '18 Months', '21 Months', '24 Months', '27 Months', '30 Months',
  '33 Months', '36 Months', '40 Months', 'N/A',
] as const;
export type DeductionMonths = typeof DEDUCTION_MONTHS[number];

// Standard enums not in data validations but implied by form
export const GENDER = ['Male', 'Female'] as const;
export type Gender = typeof GENDER[number];

export const BLOOD_GROUP = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available'] as const;
export type BloodGroup = typeof BLOOD_GROUP[number];

export const MARITAL_STATUS = ['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower'] as const;
export type MaritalStatus = typeof MARITAL_STATUS[number];

// AMDB % from salary calculator (Row 5, cell K5 = 0.3)
export const AMDB_PERCENTAGE = 0.30;

// Location & Attendance — whether this employee is tracked against a fixed
// shift (via shift_id) or a plain duration requirement.
export const SHIFT_CATEGORY = ['Shift', 'Duration'] as const;
export type ShiftCategory = typeof SHIFT_CATEGORY[number];

// Wizard steps — 3 parts: HR (7 steps) → Candidate self-service (5 steps) → Finalize (1 step)
export const WIZARD_STEPS = [
  // ── Part 1 · HR ────────────────────────────────────────────────────────────
  { key: 'role_identity',        label: 'Role & Identity',         icon: 'user',         part: 'hr',        required: true, sensitive: false },
  { key: 'location_attendance',  label: 'Location & Attendance',   icon: 'briefcase',    part: 'hr',        required: true, sensitive: false },
  { key: 'managers_work_contact',label: 'Managers & Work Contact', icon: 'users',        part: 'hr',        required: true, sensitive: false },
  { key: 'commitment_probation', label: 'Commitment & Probation',  icon: 'calendar',     part: 'hr',        required: true, sensitive: false },
  { key: 'statutory_schemes',    label: 'Statutory Schemes',       icon: 'shield',       part: 'hr',        required: true, sensitive: false },
  { key: 'compensation',         label: 'Compensation',            icon: 'indian-rupee', part: 'hr',        required: true, sensitive: true  },
  { key: 'hr_joining_checklist', label: 'HR Joining Checklist',    icon: 'check-square', part: 'hr',        required: true, sensitive: false },
  // ── Part 2 · Candidate (self-service portal) ──────────────────────────────
  { key: 'personal_profile',     label: 'Personal Profile',        icon: 'heart',        part: 'candidate', required: true, sensitive: false },
  { key: 'address',              label: 'Address',                 icon: 'map-pin',      part: 'candidate', required: true, sensitive: false },
  { key: 'family_emergency',     label: 'Family & Emergency',      icon: 'users',        part: 'candidate', required: true, sensitive: false },
  { key: 'ids_bank',             label: 'IDs & Bank',              icon: 'credit-card',  part: 'candidate', required: true, sensitive: true  },
  { key: 'experience_education', label: 'Experience & Education',  icon: 'book',         part: 'candidate', required: true, sensitive: false },
  // ── Finalize ───────────────────────────────────────────────────────────────
  { key: 'review',               label: 'Review & Submit',         icon: 'check-circle', part: 'review',    required: true, sensitive: false },
] as const;

export type StepKey = typeof WIZARD_STEPS[number]['key'];
export type WizardPart = typeof WIZARD_STEPS[number]['part'];

// Masked fields for field-level permissions
export const SENSITIVE_FIELDS = [
  'aadhaar_number', 'pan_number', 'passport_number',
  'account_number', 'ifsc_code',
  'basic', 'hra', 'allowance1', 'gross_salary_pm', 'amdb_pm', 'total_earning_pm',
  'last_inhand_salary',
] as const;

// Step completion weights — two independent pools, each summing to 100:
// HR part (7 steps) and Candidate part (5 steps). 'review' carries no weight
// in either pool since it's the finalize step, not a data-entry step.
export const HR_STEP_WEIGHTS: Record<string, number> = {
  role_identity:         25,
  location_attendance:   20,
  managers_work_contact: 15,
  commitment_probation:  10,
  statutory_schemes:     15,
  compensation:          10,
  hr_joining_checklist:  5,
};

export const CANDIDATE_STEP_WEIGHTS: Record<string, number> = {
  personal_profile:      20,
  address:               15,
  family_emergency:      20,
  ids_bank:               30,
  experience_education:  15,
};