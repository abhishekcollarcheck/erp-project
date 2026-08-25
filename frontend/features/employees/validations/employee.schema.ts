/**
 * employee.schema.ts
 * Zod schemas for all 13 wizard steps (7 HR + 5 Candidate + Review).
 * Required/optional matches the actual UI exactly — only fields carrying a
 * visible `*` are required. See employee.validation.ts (backend) for the
 * mirrored express-validator rules; keep both in sync.
 */

import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const optStr  = z.string().optional().or(z.literal('')).nullable();
const optDate = z.string().optional().or(z.literal('')).nullable();
const reqStr  = (msg: string) => z.string({ required_error: msg }).min(1, msg).trim();
const yesNo   = z.boolean().optional().nullable();   // UI's Yes/No/NA dropdowns need mapping to true/false/null before submit
const optNum  = z.number({ coerce: true }).nonnegative().optional().nullable();
const optInt  = z.union([z.number({ coerce: true }).int().min(1), z.literal(''), z.null(), z.undefined()]).optional();
const reqInt  = (msg: string) => z.union([
  z.number({ coerce: true, invalid_type_error: msg }).int().min(1, msg),
  z.literal(''),
  z.null(),
  z.undefined(),
]).refine(v => v !== '' && v !== null && v !== undefined && Number(v) >= 1, { message: msg });

// ─── Step 1 (HR): Role & Identity ─────────────────────────────────────────────
// employee_code removed — system-generated only, never client-supplied.
// email/phone ARE "Personal Email"/"Personal Mobile Number" — required here.
export const roleIdentitySchema = z.object({
  company_id:        z.number({ required_error: 'Company is required', coerce: true }).int().positive('Company is required'),
  first_name:        reqStr('First name is required').max(100),
  middle_name:       optStr,
  last_name:         reqStr('Last name is required').max(100),
  status:            z.enum(['Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive']).default('Active'),
  employment_type:   z.enum(['Permanent', 'Contract', 'Intern', 'Consultant', 'Probation']).default('Permanent'),
  department_id:     reqInt('Department is required'),
  sub_department_id: optInt,
  designation_id:    reqInt('Designation is required'),
  sub_designation_id: optInt,
  email:             z.string({ required_error: 'Personal email is required' }).email('Valid email is required').toLowerCase().trim(),
  phone:             reqStr('Personal mobile number is required').regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number'),
  reference_code:    optStr,   // display-only, auto-generated
});

// ─── Step 2 (HR): Location & Attendance ───────────────────────────────────────
// Only Date of Joining carries a * in the UI.
export const locationAttendanceSchema = z.object({
  working_state_country: optStr,
  working_city:            optStr,
  working_site:            optStr,
  pay_register_location:   optStr,
  actual_doj:              reqStr('Date of Joining is required'),
  weekly_off:              optStr,
  shift_id:                optInt,
  grace_minutes:           z.number({ coerce: true }).int().min(0).max(120).optional().nullable(),
});

// ─── Step 3 (HR): Managers & Work Contact ─────────────────────────────────────
// Nothing carries a * in the UI.
export const managersWorkContactSchema = z.object({
  l1_manager_id:    z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  l2_manager_id:    z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  official_email:   z.string().email().optional().or(z.literal('')).nullable(),
  official_mobile:  z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')).nullable(),
});

// ─── Step 4 (HR): Commitment & Probation ──────────────────────────────────────
// Nothing carries a * in the UI. commitment/on_probation stay boolean per the
// confirmed schema decision — the UI's Yes/No/Not Applicable dropdown must
// map to true/false/null before this schema sees it.
export const commitmentProbationSchema = z.object({
  commitment:                yesNo,
  commitment_term:           z.enum(['36 Months', '60 Months', 'N/A']).optional().nullable(),
  commitment_entered_on:     optDate,
  on_probation:              yesNo,
  probation_period:          optStr,
  probation_extended_period: optStr,
  confirmation_status:       z.enum(['Confirmed', 'Failed', 'Not Applicable']).optional().nullable(),
  confirmed_on:              optDate,
  // Auto-computed display fields — set by StepCommitment, read-only in UI
  commitment_end_date:       optDate,
  probation_end_date:        optDate,
});

// ─── Step 5 (HR): Statutory Schemes ────────────────────────────────────────────
// Nothing carries a * in the UI. Added the 3 PF breakdown fields.
export const statutorySchemesSchema = z.object({
  pf_status:             yesNo,
  uan_number:            z.string().regex(/^\d{12}$/, 'UAN must be 12 digits').optional().or(z.literal('')).nullable(),
  epfo_member_id:        optStr,
  pf_contribution_pct:   optNum,
  pf_employer_from:      z.enum(['Employee', 'Employer', 'N/A']).optional().nullable(),
  pf_employee_12:        optNum,
  eps_employer_833:      optNum,
  epf_eps_diff_367:      optNum,
  esic_status:           yesNo,
  esic_number:           optStr,
  mediclaim_status:      z.enum(['Yes', 'No', 'Not Applicable']).optional().nullable(),
  mediclaim_number:      optStr,
  mediclaim_amount:      optNum,
  rd_scheme:             yesNo,
  rd_term:               z.enum(['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A']).optional().nullable(),
  rd_opening_date:       optDate,
  rd_account_number:     optStr,
  rd_deduction_from:     z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  rd_amount_employee:    optNum,
  rd_amount_employer:    optNum,
  // Auto-computed
  rd_maturity_date:      optDate,
  rd_maturity_amount:    optNum,
  rd_status:             z.string().optional().nullable(),
});

// ─── Step 6 (HR): Compensation ────────────────────────────────────────────────
// Nothing carries a * in the UI.
export const compensationSchema = z.object({
  salary_mode:                z.enum(['Bank Transfer', 'Cash', 'Cheque']).optional().nullable(),
  current_basic:               optNum,
  current_hra:                  optNum,
  current_allowance1:           optNum,
  current_amdb:                 optNum,
  joining_basic:                optNum,
  joining_hra:                  optNum,
  joining_allowance1:           optNum,
  joining_amdb:                 optNum,
  asset_deduction_applicable:  yesNo,
  security_amount:              optNum,
  deduction_months:             z.string().optional().nullable(),
  deduction_from:                z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  monthly_deduction:             optNum,
  final_monthly_deduction:       optNum,
});

// ─── Step 7 (HR): HR Joining Checklist ────────────────────────────────────────
// Nothing carries a * in the UI. remarks is new.
export const hrJoiningChecklistSchema = z.object({
  offer_letter:           yesNo,
  address_verification:   yesNo,
  service_agreement:      yesNo,
  indemnity_bond:         yesNo,
  asset_deduction_letter: yesNo,
  account_opening_letter: yesNo,
  nda:                    yesNo,
  remarks:                optStr,
});

// ─── Step 8 (Candidate): Personal Profile ─────────────────────────────────────
// Nothing carries a * in the UI. personal_email/personal_mobile removed —
// those are now employees.email/phone (validated on Role & Identity instead).
export const personalProfileSchema = z.object({
  date_of_birth:    optDate,
  gender:           z.enum(['Male', 'Female']).optional().nullable(),
  shirt_size:       optStr,
  tshirt_size:      optStr,
  nationality:      optStr,
  religion:         optStr,
  blood_group:      z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available']).optional().nullable(),
  marriage_date:    optDate,
  spouse_name:      optStr,
  spouse_dob:       optDate,
  child1_name:      optStr,
  child1_dob:       optDate,
  child2_name:      optStr,
  child2_dob:       optDate,
  child3_name:      optStr,
  child3_dob:       optDate,
});

// ─── Step 8 (Candidate): Address ──────────────────────────────────────────────
// Nothing carries a * in the UI.
export const addressSchema = z.object({
  present_house_type:  z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  present_house_no:    optStr,
  present_area:        optStr,
  present_district:    optStr,
  present_city:        optStr,
  present_state:       optStr,
  present_country:     optStr,
  present_pincode:     z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),
  perm_address_type:   z.enum(['Same as Present', 'Different', 'Not Applicable']).optional().nullable(),
  perm_house_type:     z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  perm_house_no:       optStr,
  perm_area:           optStr,
  perm_district:       optStr,
  perm_city:           optStr,
  perm_state:          optStr,
  perm_country:        optStr,
  perm_pincode:        z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),
});

// ─── Step 9 (Candidate): Family & Emergency ───────────────────────────────────
// Merged step. Nothing carries a * in the UI. father_age_dob/mother_age_dob
// renamed to father_dob/mother_dob (real dates now). father_status dropped.
// mother_occupation is free text now, not a constrained enum. marital_status
// lives on this screen in the UI (still writes to employee_personal).
const familyMemberSchema = z.object({
  id:            z.number().optional(),
  name:          reqStr('Name is required').max(200),
  relationship:  optStr,
  dob:           optDate,
  occupation:    optStr,
});

const emergencyContactSchema = z.object({
  id:              z.number().optional(),
  contact_name:    reqStr('Contact name is required').max(200),
  contact_number:  reqStr('Contact number is required').regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number'),
  email:           z.string().email().optional().or(z.literal('')).nullable(),
  relationship:    optStr,
  is_primary:      z.boolean().optional(),
});

export const familyEmergencySchema = z.object({
  marital_status:      z.enum(['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower']).optional().nullable(),
  father_salutation:   z.enum(['Mr.', 'Dr.', 'Late']).optional().nullable(),
  father_name:         optStr,
  father_dob:          optDate,
  father_occupation:   optStr,
  mother_salutation:   z.enum(['Mrs.', 'Ms.', 'Dr.', 'Late']).optional().nullable(),
  mother_name:         optStr,
  mother_dob:          optDate,
  mother_occupation:   optStr,
  family_members:      z.array(familyMemberSchema).optional().default([]),
  emergency_contacts:  z.array(emergencyContactSchema).optional().default([]),
});

// ─── Step 10 (Candidate): IDs & Bank ──────────────────────────────────────────
// Merged step. Aadhaar (4 fields) + personal bank (3 of 4 fields) are the
// ONLY required fields in this entire wizard outside Role & Identity and
// Date of Joining — matches the UI's "0/2 required · Aadhaar & bank".
// PAN, Passport, and Driving Licence are all fully optional.
const vaccinationSchema = z.object({
  id:            z.number().optional(),
  vaccine_name:  reqStr('Vaccine name is required').max(100),
  date:          optDate,
  notes:         optStr,
});

const documentSchema = z.object({
  id:              z.number().optional(),
  doc_type:        reqStr('Document type is required').max(100),
  doc_type_other:  optStr,
  file_url:        reqStr('File is required'),
});

export const idsBankSchema = z.object({
  // Aadhaar — required
  aadhaar_number:   z.string({ required_error: 'Aadhaar is required' }).regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  aadhaar_name:      reqStr('Name as on Aadhaar is required').max(200),
  aadhaar_dob:       reqStr('Date of birth (Aadhaar) is required'),
  aadhaar_address:   reqStr('Address as on Aadhaar is required'),
  aadhaar_scan_url:  optStr,
  // PAN — optional
  pan_number:              z.string().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (ABCDE1234F)').optional().or(z.literal('')).nullable(),
  pan_full_name:            optStr,
  pan_dob:                  optDate,
  pan_parent_spouse_name:   optStr,
  pan_scan_url:             optStr,
  // Passport — optional
  passport_number:            optStr,
  passport_full_name:         optStr,
  passport_nationality:       optStr,
  passport_issue_date:        optDate,
  passport_expiry:            optDate,
  passport_place_of_issue:    optStr,
  passport_scan_url:          optStr,
  // Driving licence — optional
  driving_license_number:      optStr,
  driving_license_name:        optStr,
  driving_license_issue_date:  optDate,
  driving_license_expiry:      optDate,
  driving_license_authority:   optStr,
  driving_license_scan_url:    optStr,
  // Vaccinations & additional documents — repeatable, optional
  vaccinations:  z.array(vaccinationSchema).optional().default([]),
  documents:     z.array(documentSchema).optional().default([]),
  // Personal bank — required (3 of 4 fields; branch is optional)
  personal_bank_name:     reqStr('Bank name is required').max(200),
  personal_bank_account:  z.string({ required_error: 'Account number is required' }).regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  personal_ifsc:           z.string({ required_error: 'IFSC is required' }).toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (ABCD0123456)'),
  personal_bank_branch:    optStr,
});

// ─── Step 11 (Candidate): Experience & Education ──────────────────────────────
// Nothing carries a * in the UI. Both now arrays (repeatable). passing_year
// replaced with education_start_year/education_end_year + is_pursuing.
const experienceEntrySchema = z.object({
  id:                        z.number().optional(),
  last_company_name:        optStr,
  last_designation:         optStr,
  last_working_day:         optDate,
  exp_contact_name:         optStr,
  exp_contact_number:       z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')).nullable(),
  exp_contact_designation:  optStr,
  last_inhand_salary:       optNum,
});

const educationEntrySchema = z.object({
  id:                     z.number().optional(),
  highest_education:      optStr,
  education_stream:       optStr,
  education_mode:         optStr,
  institute_name:         optStr,
  education_marks:        optStr,
  education_start_year:   z.number({ coerce: true }).int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  education_end_year:     z.number({ coerce: true }).int().min(1950).max(new Date().getFullYear() + 10).optional().nullable(),
  is_pursuing:            z.boolean().optional(),
});

export const experienceEducationSchema = z.object({
  is_experienced: yesNo,
  experience:     z.array(experienceEntrySchema).optional().default([]),
  education:      z.array(educationEntrySchema).optional().default([]),
});

// ─── Step schema map ──────────────────────────────────────────────────────────
export const STEP_SCHEMA_MAP = {
  role_identity:          roleIdentitySchema,
  location_attendance:    locationAttendanceSchema,
  managers_work_contact:  managersWorkContactSchema,
  commitment_probation:   commitmentProbationSchema,
  statutory_schemes:      statutorySchemesSchema,
  compensation:            compensationSchema,
  hr_joining_checklist:   hrJoiningChecklistSchema,
  personal_profile:       personalProfileSchema,
  address:                 addressSchema,
  family_emergency:       familyEmergencySchema,
  ids_bank:                idsBankSchema,
  experience_education:   experienceEducationSchema,
  review:                  z.object({}).optional(),
} as const;

// ─── Full form schema ─────────────────────────────────────────────────────────
// Flat z.object() (not a .merge() chain) — TypeScript loses inference on deep
// merge chains and collapses the type to {}. All 13 steps' fields combined.
export const fullEmployeeSchema = z.object({
  // ── Role & Identity ──────────────────────────────────────────────────────
  company_id:        z.number({ required_error: 'Company is required', coerce: true }).int().positive('Company is required'),
  first_name:        reqStr('First name is required').max(100),
  middle_name:       optStr,
  last_name:         reqStr('Last name is required').max(100),
  status:            z.enum(['Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive']).default('Active'),
  employment_type:   z.enum(['Permanent', 'Contract', 'Intern', 'Consultant', 'Probation']).default('Permanent'),
  department_id:     reqInt('Department is required'),
  sub_department_id: optInt,
  designation_id:    reqInt('Designation is required'),
  sub_designation_id: optInt,
  email:             z.string({ required_error: 'Personal email is required' }).email('Valid email is required').toLowerCase().trim(),
  phone:             reqStr('Personal mobile number is required').regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number'),
  reference_code:    optStr,

  // ── Location & Attendance ────────────────────────────────────────────────
  working_state_country: optStr,
  working_city:            optStr,
  working_site:            optStr,
  pay_register_location:   optStr,
  actual_doj:              reqStr('Date of Joining is required'),
  weekly_off:              optStr,
  shift_id:                optInt,
  grace_minutes:           z.number({ coerce: true }).int().min(0).max(120).optional().nullable(),

  // ── Managers & Work Contact ──────────────────────────────────────────────
  l1_manager_id:    z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  l2_manager_id:    z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  official_email:   z.string().email().optional().or(z.literal('')).nullable(),
  official_mobile:  z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')).nullable(),

  // ── Commitment & Probation ───────────────────────────────────────────────
  commitment:                yesNo,
  commitment_term:           z.enum(['36 Months', '60 Months', 'N/A']).optional().nullable(),
  commitment_entered_on:     optDate,
  on_probation:              yesNo,
  probation_period:          optStr,
  probation_extended_period: optStr,
  confirmation_status:       z.enum(['Confirmed', 'Failed', 'Not Applicable']).optional().nullable(),
  confirmed_on:              optDate,
  commitment_end_date:       optDate,
  probation_end_date:        optDate,

  // ── Statutory Schemes ────────────────────────────────────────────────────
  pf_status:           yesNo,
  uan_number:          z.string().regex(/^\d{12}$/, 'UAN must be 12 digits').optional().or(z.literal('')).nullable(),
  epfo_member_id:      optStr,
  pf_contribution_pct: optNum,
  pf_employer_from:    z.enum(['Employee', 'Employer', 'N/A']).optional().nullable(),
  pf_employee_12:      optNum,
  eps_employer_833:    optNum,
  epf_eps_diff_367:    optNum,
  esic_status:         yesNo,
  esic_number:         optStr,
  mediclaim_status:    z.enum(['Yes', 'No', 'Not Applicable']).optional().nullable(),
  mediclaim_number:    optStr,
  mediclaim_amount:    optNum,
  rd_scheme:           yesNo,
  rd_term:             z.enum(['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A']).optional().nullable(),
  rd_opening_date:     optDate,
  rd_account_number:   optStr,
  rd_deduction_from:   z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  rd_amount_employee:  optNum,
  rd_amount_employer:  optNum,
  rd_maturity_date:    optDate,
  rd_maturity_amount:  optNum,
  rd_status:           z.string().optional().nullable(),

  // ── Compensation ─────────────────────────────────────────────────────────
  salary_mode:                z.enum(['Bank Transfer', 'Cash', 'Cheque']).optional().nullable(),
  current_basic:               optNum,
  current_hra:                  optNum,
  current_allowance1:           optNum,
  current_amdb:                 optNum,
  joining_basic:                optNum,
  joining_hra:                  optNum,
  joining_allowance1:           optNum,
  joining_amdb:                 optNum,
  asset_deduction_applicable:  yesNo,
  security_amount:              optNum,
  deduction_months:             z.string().optional().nullable(),
  deduction_from:                z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  monthly_deduction:             optNum,
  final_monthly_deduction:       optNum,

  // ── HR Joining Checklist ─────────────────────────────────────────────────
  offer_letter:           yesNo,
  address_verification:   yesNo,
  service_agreement:      yesNo,
  indemnity_bond:         yesNo,
  asset_deduction_letter: yesNo,
  account_opening_letter: yesNo,
  nda:                    yesNo,
  remarks:                optStr,

  // ── Personal Profile ─────────────────────────────────────────────────────
  date_of_birth:    optDate,
  gender:           z.enum(['Male', 'Female']).optional().nullable(),
  shirt_size:       optStr,
  tshirt_size:      optStr,
  nationality:      optStr,
  religion:         optStr,
  blood_group:      z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available']).optional().nullable(),
  marriage_date:    optDate,
  spouse_name:      optStr,
  spouse_dob:       optDate,
  child1_name:      optStr,
  child1_dob:       optDate,
  child2_name:      optStr,
  child2_dob:       optDate,
  child3_name:      optStr,
  child3_dob:       optDate,

  // ── Address ───────────────────────────────────────────────────────────────
  present_house_type: z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  present_house_no:   optStr,
  present_area:       optStr,
  present_district:   optStr,
  present_city:       optStr,
  present_state:      optStr,
  present_country:    optStr,
  present_pincode:    z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),
  perm_address_type:  z.enum(['Same as Present', 'Different', 'Not Applicable']).optional().nullable(),
  perm_house_type:    z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  perm_house_no:      optStr,
  perm_area:          optStr,
  perm_district:      optStr,
  perm_city:          optStr,
  perm_state:         optStr,
  perm_country:       optStr,
  perm_pincode:       z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),

  // ── Family & Emergency ───────────────────────────────────────────────────
  marital_status:      z.enum(['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower']).optional().nullable(),
  father_salutation:   z.enum(['Mr.', 'Dr.', 'Late']).optional().nullable(),
  father_name:         optStr,
  father_dob:          optDate,
  father_occupation:   optStr,
  mother_salutation:   z.enum(['Mrs.', 'Ms.', 'Dr.', 'Late']).optional().nullable(),
  mother_name:         optStr,
  mother_dob:          optDate,
  mother_occupation:   optStr,
  family_members:      z.array(familyMemberSchema).optional().default([]),
  emergency_contacts:  z.array(emergencyContactSchema).optional().default([]),

  // ── IDs & Bank ────────────────────────────────────────────────────────────
  aadhaar_number:   z.string({ required_error: 'Aadhaar is required' }).regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  aadhaar_name:      reqStr('Name as on Aadhaar is required').max(200),
  aadhaar_dob:       reqStr('Date of birth (Aadhaar) is required'),
  aadhaar_address:   reqStr('Address as on Aadhaar is required'),
  aadhaar_scan_url:  optStr,
  pan_number:              z.string().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (ABCDE1234F)').optional().or(z.literal('')).nullable(),
  pan_full_name:            optStr,
  pan_dob:                  optDate,
  pan_parent_spouse_name:   optStr,
  pan_scan_url:             optStr,
  passport_number:            optStr,
  passport_full_name:         optStr,
  passport_nationality:       optStr,
  passport_issue_date:        optDate,
  passport_expiry:            optDate,
  passport_place_of_issue:    optStr,
  passport_scan_url:          optStr,
  driving_license_number:      optStr,
  driving_license_name:        optStr,
  driving_license_issue_date:  optDate,
  driving_license_expiry:      optDate,
  driving_license_authority:   optStr,
  driving_license_scan_url:    optStr,
  vaccinations:  z.array(vaccinationSchema).optional().default([]),
  documents:     z.array(documentSchema).optional().default([]),
  personal_bank_name:     reqStr('Bank name is required').max(200),
  personal_bank_account:  z.string({ required_error: 'Account number is required' }).regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  personal_ifsc:           z.string({ required_error: 'IFSC is required' }).toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (ABCD0123456)'),
  personal_bank_branch:    optStr,

  // ── Experience & Education ───────────────────────────────────────────────
  is_experienced: yesNo,
  experience:     z.array(experienceEntrySchema).optional().default([]),
  education:      z.array(educationEntrySchema).optional().default([]),
});

export type FullEmployeeForm = z.infer<typeof fullEmployeeSchema>;
export type StepSchemaKey = keyof typeof STEP_SCHEMA_MAP;

/** Alias kept for backward compatibility with existing step components */
export type FullEmployeeFormData = FullEmployeeForm;