import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const optStr = z.string().optional().or(z.literal('')).nullable();
const optDate = z.string().optional().or(z.literal('')).nullable();
const reqStr = (msg: string) => z.string({ required_error: msg }).min(1, msg).trim();
const yesNo = z.boolean().optional().nullable();  
const optNum = z.number({ coerce: true }).nonnegative().optional().nullable();
const optInt = z.union([z.number({ coerce: true }).int().min(1), z.literal(''), z.null(), z.undefined()]).optional();
const reqInt = (msg: string) => z.union([
  z.number({ coerce: true, invalid_type_error: msg }).int().min(1, msg),
  z.literal(''),
  z.null(),
  z.undefined(),
]).refine(v => v !== '' && v !== null && v !== undefined && Number(v) >= 1, { message: msg });
const reqIntRange = (msg: string, max: number) => z.union([
  z.number({ coerce: true, invalid_type_error: msg }).int().min(1, msg).max(max, msg),
  z.literal(''),
  z.null(),
  z.undefined(),
]).refine(v => v !== '' && v !== null && v !== undefined && Number(v) >= 1 && Number(v) <= max, { message: msg });

// ─── Step 1 (HR): Role & Identity ─────────────────────────────────────────────
export const roleIdentitySchema = z.object({
  company_id: z.number({ required_error: 'Company is required', coerce: true }).int().positive('Company is required'),
  avatar_url: optStr,
  reference_code: optStr,
  first_name: reqStr('First name is required').max(100),
  middle_name: optStr,
  last_name: reqStr('Last name is required').max(100),
  status: z.enum(['Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive']).default('Active'),
  employment_type: z.enum(['Permanent', 'Contract', 'Intern', 'Consultant', 'Probation']).default('Permanent'),
  department_id: reqInt('Department is required'),
  sub_department_id: optInt,
  designation_id: reqInt('Designation is required'),
  sub_designation_id: optInt,
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  phone: reqStr('Personal mobile number is required').regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number'),
});

// ─── Step 2 (HR): Location & Attendance ───────────────────────────────────────
export const locationAttendanceSchema = z.object({
  working_state_country: optInt,
  working_city: optInt,
  working_site: optInt,
  pay_register_location: optInt,
  actual_doj: reqStr('Date of Joining is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Joining must be in YYYY-MM-DD format')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid Date of Joining'),
  weekly_off: optInt,
  shift_category: z.enum(['Shift', 'Duration']).optional().nullable(),
  shift_id: optInt,
  grace_minutes: optInt,
});

// ─── Step 3 (HR): Managers & Work Contact ─────────────────────────────────────
// Nothing carries a * in the UI.
export const managersWorkContactSchema = z.object({
  l1_manager_id: z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  l2_manager_id: z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  official_email: z.string().email().optional().or(z.literal('')).nullable(),
  official_mobile: z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')).nullable(),
});

// ─── Step 4 (HR): Commitment & Probation ──────────────────────────────────────
// Nothing carries a * in the UI. commitment/on_probation stay boolean per the
// confirmed schema decision — the UI's Yes/No/Not Applicable dropdown must
// map to true/false/null before this schema sees it.
export const commitmentProbationSchema = z.object({
  commitment: yesNo,

  commitment_term: z
    .enum(['36 Months', '60 Months', 'N/A'])
    .optional()
    .nullable(),

  commitment_entered_on: optDate,

  commitment_end_date: optDate,

  on_probation: yesNo,

  probation_period: optStr,

  probation_end_date: optDate,

  probation_status: z
    .enum(['Confirmed', 'Failed', 'Not Applicable'])
    .optional()
    .nullable(),
});

// ─── Step 5 (HR): Statutory Schemes ────────────────────────────────────────────
export const statutorySchemesSchema = z.object({
  pf_status: yesNo,
  uan_number: z.string().regex(/^\d{12}$/, 'UAN must be 12 digits').optional().or(z.literal('')).nullable(),
  epfo_member_id: optStr,
  pf_contribution_pct: optNum,
  pf_employer_from: z.enum(['Employee', 'Employer', 'N/A']).optional().nullable(),
  pf_employee_12: optNum,
  eps_employer_833: optNum,
  epf_eps_diff_367: optNum,
  esic_status: yesNo,
  esic_number: optStr,
  esi_employee_pct: optNum,
  esi_employer_pct: optNum,
  mediclaim_status: z.enum(['Yes', 'No', 'Not Applicable']).optional().nullable(),
  mediclaim_number: optStr,
  mediclaim_amount: z.enum(['150000', '250000', '400000', '500000', 'Not Applicable']).optional().nullable(),
  rd_scheme: yesNo,
  rd_term: z.enum(['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A']).optional().nullable(),
  rd_opening_date: optDate,
  rd_account_number: optStr,
  rd_deduction_from: z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  rd_amount_employee: optNum,
  rd_amount_employer: optNum,
  ttl_m_contribution: optNum,
  // Auto-computed server-side — kept lenient so legacy values ('Active'/'Inactive')
  // don't fail step validation on edit-load.
  rd_maturity_date: optDate,
  rd_maturity_amount: optNum,
  rd_status: z.string().optional().nullable(),
});

// ─── Step 6 (HR): Compensation ────────────────────────────────────────────────
// Nothing carries a * in the UI. deduction_months is now a plain number (was
// a "12 Months"-style dropdown label). deduction_from IS the Salary/AMDB/N/A
// enum — confirmed against the source spreadsheet's actual Excel data
// validation on cell B213 (list "Salary,AMDB,N/A"), matching DEDUCTION_FROM
// in employee.constants.ts and what StepCompensation.tsx's FormSelect already
// sends. A prior edit here mistakenly retyped this as a date; reverted.
export const compensationSchema = z.object({
  salary_mode: z.enum(['Bank Transfer', 'Cash', 'Cheque']).optional().nullable(),
  current_basic: optNum,
  current_hra: optNum,
  current_allowance1: optNum,
  current_amdb: optNum,
  joining_basic: optNum,
  joining_hra: optNum,
  joining_allowance1: optNum,
  joining_amdb: optNum,
  asset_deduction_applicable: yesNo,
  security_amount: optNum,
  deduction_months: z.number({ coerce: true }).int().min(0).optional().nullable(),
  deduction_from: z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  monthly_deduction: optNum,
  final_monthly_deduction: optNum,
});

// ─── Step 7 (HR): HR Joining Checklist ────────────────────────────────────────
// Nothing carries a * in the UI. remarks is new.
export const hrJoiningChecklistSchema = z.object({
  offer_letter: yesNo,
  address_verification: yesNo,
  service_agreement: yesNo,
  indemnity_bond: yesNo,
  asset_deduction_letter: yesNo,
  account_opening_letter: yesNo,
  nda: yesNo,
  remarks: optStr,
});

// ─── Step 8 (Candidate): Personal Profile ─────────────────────────────────────
// Nothing carries a * in the UI. personal_email/personal_mobile removed —
// those are now employees.email/phone (validated on Role & Identity instead).
// marital_status/marriage_date/spouse/children moved to Family & Emergency
// (Step 10) — they're all shown on that screen in the UI, matching the
// backend's routeStep('family_emergency') which reads them there.
export const personalProfileSchema = z.object({
  date_of_birth: optDate,
  gender: z.enum(['Male', 'Female']).optional().nullable(),
  shirt_size: optStr,
  tshirt_size: optStr,
  nationality: optStr,
  religion: optStr,
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available']).optional().nullable(),
});

// ─── Step 9 (Candidate): Address ──────────────────────────────────────────────
// Nothing carries a * in the UI.
export const addressSchema = z.object({
  present_house_type: z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  present_house_no: optStr,
  present_area: optStr,
  present_district: optStr,
  present_city: optStr,
  present_state: optStr,
  present_country: optStr,
  present_pincode: z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),
  perm_address_type: z.enum(['Same as Present', 'Different', 'Not Applicable']).optional().nullable(),
  perm_house_type: z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  perm_house_no: optStr,
  perm_area: optStr,
  perm_district: optStr,
  perm_city: optStr,
  perm_state: optStr,
  perm_country: optStr,
  perm_pincode: z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),
});

// ─── Step 10 (Candidate): Family & Emergency ───────────────────────────────────
// Merged step. Nothing carries a * in the UI. father_status dropped,
// mother_occupation is free text now. marital_status + spouse + children now
// live here (moved from Personal Profile — matches the backend exactly).
// family_members and emergency_contacts are repeatable lists — emergency
// contacts' first entry is the primary. Nothing on this step carries a * in the
// UI, and the form always renders one blank primary-contact row, so a fully
// blank row must validate. Blank rows are stripped in buildPayload before the
// API sees them; a row the user starts filling still gets format-checked, and
// its anchor field (name) is required via the superRefine on each list below.
const nameMax = (msg: string) => z.string().max(200, msg).optional().or(z.literal('')).nullable();

const familyMemberSchema = z.object({
  id: z.number().optional(),
  name: nameMax('Name cannot exceed 200 characters'),
  relationship: optStr,
  relationship_other: optStr,
  salutation: optStr,
  dob: optDate,
  occupation: optStr,
}).superRefine((m, ctx) => {
  const hasData = [m.relationship, m.salutation, m.dob, m.occupation].some(v => v && String(v).trim());
  if (hasData && !(m.name && String(m.name).trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Name is required' });
  }
});

const emergencyContactSchema = z.object({
  id: z.number().optional(),
  contact_name: nameMax('Contact name cannot exceed 200 characters'),
  contact_number: z.string().regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')).nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  relationship: optStr,
  relationship_other: optStr,
  is_primary: z.boolean().optional(),
}).superRefine((c, ctx) => {
  const name = c.contact_name && String(c.contact_name).trim();
  const num  = c.contact_number && String(c.contact_number).trim();
  const hasData = name || num || (c.email && String(c.email).trim()) || (c.relationship && String(c.relationship).trim());
  // blank row is fine; a started row needs both name and number (they go together)
  if (hasData && !name) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contact_name'], message: 'Contact name is required' });
  if (hasData && !num)  ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contact_number'], message: 'Contact number is required' });
});

export const familyEmergencySchema = z.object({
  marital_status: z.enum(['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower']).optional().nullable(),
  marriage_date: optDate,
  spouse_name: optStr,
  spouse_dob: optDate,
  child1_name: optStr,
  child1_gender: z.enum(['Male', 'Female']).optional().nullable(),
  child1_dob: optDate,
  child2_name: optStr,
  child2_gender: z.enum(['Male', 'Female']).optional().nullable(),
  child2_dob: optDate,
  child3_name: optStr,
  child3_gender: z.enum(['Male', 'Female']).optional().nullable(),
  child3_dob: optDate,
  father_salutation: z.enum(['Mr.', 'Dr.', 'Late']).optional().nullable(),
  father_name: optStr,
  father_dob: optDate,
  father_occupation: optStr,
  mother_salutation: z.enum(['Mrs.', 'Ms.', 'Dr.', 'Late']).optional().nullable(),
  mother_name: optStr,
  mother_dob: optDate,
  mother_occupation: optStr,
  family_members: z.array(familyMemberSchema).optional().default([]),
  emergency_contacts: z.array(emergencyContactSchema).optional().default([]),
});

// ─── Step 11 (Candidate): IDs & Bank ──────────────────────────────────────────
// Merged step. Aadhaar (4 fields) + personal bank (3 of 4 fields) are the
// ONLY required fields in this entire wizard outside Role & Identity and
// Date of Joining — matches the UI's "0/2 required · Aadhaar & bank".
// PAN, Passport, and Driving Licence are all fully optional.
// Repeatable, all-optional. A blank row (user clicked "+ Add" then stopped)
// must validate; a started row needs its anchor field. Blank rows are stripped
// in buildPayload before submit.
const vaccinationSchema = z.object({
  id: z.number().optional(),
  vaccine_name: z.string().max(100).optional().or(z.literal('')).nullable(),
  date: optDate,
  notes: optStr,
}).superRefine((v, ctx) => {
  if ((v.date || v.notes) && !(v.vaccine_name && String(v.vaccine_name).trim()))
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vaccine_name'], message: 'Vaccine name is required' });
});

const documentSchema = z.object({
  id: z.number().optional(),
  doc_type: z.string().max(100).optional().or(z.literal('')).nullable(),
  doc_type_other: optStr,
  file_url: optStr,
}).superRefine((d, ctx) => {
  if (d.doc_type && String(d.doc_type).trim() && !(d.file_url && String(d.file_url).trim()))
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['file_url'], message: 'File is required' });
});

export const idsBankSchema = z.object({
  // Aadhaar — required
  aadhaar_number: z.string({ required_error: 'Aadhaar is required' }).regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  aadhaar_name: reqStr('Name as on Aadhaar is required').max(200),
  aadhaar_dob: reqStr('Date of birth (Aadhaar) is required'),
  aadhaar_address: reqStr('Address as on Aadhaar is required'),
  aadhaar_scan_url: optStr,
  // PAN — optional
  pan_number: z.string().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (ABCDE1234F)').optional().or(z.literal('')).nullable(),
  pan_full_name: optStr,
  pan_dob: optDate,
  pan_parent_spouse_name: optStr,
  pan_scan_url: optStr,
  // Passport — optional
  passport_number: optStr,
  passport_full_name: optStr,
  passport_nationality: optStr,
  passport_issue_date: optDate,
  passport_expiry: optDate,
  passport_place_of_issue: optStr,
  passport_scan_url: optStr,
  // Travel Document Details, sheet row 123 — Yellow Fever Injection status
  yellow_fever: yesNo,
  yellow_fever_date: optDate,
  // Driving licence — optional
  driving_license_number: optStr,
  driving_license_name: optStr,
  driving_license_issue_date: optDate,
  driving_license_expiry: optDate,
  driving_license_authority: optStr,
  driving_license_scan_url: optStr,
  // Vaccinations & additional documents — repeatable, optional
  vaccinations: z.array(vaccinationSchema).optional().default([]),
  documents: z.array(documentSchema).optional().default([]),
  // Personal bank — required (3 of 4 fields; branch is optional)
  personal_bank_name: reqStr('Bank name is required').max(200),
  personal_bank_account: z.string({ required_error: 'Account number is required' }).regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  personal_ifsc: z.string({ required_error: 'IFSC is required' }).toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (ABCD0123456)'),
  personal_bank_branch: optStr,
});

// ─── Step 12 (Candidate): Experience & Education ──────────────────────────────
// Nothing carries a * in the UI. Both now arrays (repeatable). passing_year
// replaced with education_start_year/education_end_year + is_pursuing.
const experienceEntrySchema = z.object({
  id: z.number().optional(),
  last_company_name: optStr,
  last_designation: optStr,
  last_working_day: optDate,
  exp_contact_name: optStr,
  exp_contact_number: z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')).nullable(),
  exp_contact_designation: optStr,
  last_inhand_salary: optNum,
});

const educationEntrySchema = z.object({
  id: z.number().optional(),
  highest_education: optStr,
  education_stream: optStr,
  education_mode: optStr,
  institute_name: optStr,
  education_marks: optStr,
  education_start_year: z.number({ coerce: true }).int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  education_end_year: z.number({ coerce: true }).int().min(1950).max(new Date().getFullYear() + 10).optional().nullable(),
  is_pursuing: z.boolean().optional(),
});

export const experienceEducationSchema = z.object({
  is_experienced: yesNo,
  experience: z.array(experienceEntrySchema).optional().default([]),
  education: z.array(educationEntrySchema).optional().default([]),
});


// ─── Step schema map ──────────────────────────────────────────────────────────
export const STEP_SCHEMA_MAP = {
  role_identity: roleIdentitySchema,
  location_attendance: locationAttendanceSchema,
  managers_work_contact: managersWorkContactSchema,
  commitment_probation: commitmentProbationSchema,
  statutory_schemes: statutorySchemesSchema,
  compensation: compensationSchema,
  hr_joining_checklist: hrJoiningChecklistSchema,
  personal_profile: personalProfileSchema,
  address: addressSchema,
  family_emergency: familyEmergencySchema,
  ids_bank: idsBankSchema,
  experience_education: experienceEducationSchema,
  review: z.object({}).optional(),
} as const;

// ─── Full form schema ─────────────────────────────────────────────────────────
// Flat z.object() (not a .merge() chain) — TypeScript loses inference on deep
// merge chains and collapses the type to {}. All 13 steps' fields combined.
export const fullEmployeeSchema = z.object({
  // ── Role & Identity ──────────────────────────────────────────────────────
  company_id: z.number({ required_error: 'Company is required', coerce: true }).int().positive('Company is required'),
  avatar_url: optStr,
  reference_code: optStr,
  first_name: reqStr('First name is required').max(100),
  middle_name: optStr,
  last_name: reqStr('Last name is required').max(100),
  status: z.enum(['Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive']).default('Active'),
  employment_type: z.enum(['Permanent', 'Contract', 'Intern', 'Consultant', 'Probation']).default('Permanent'),
  department_id: reqInt('Department is required'),
  sub_department_id: optStr,
  designation_id: reqInt('Designation is required'),
  sub_designation_id: optStr,
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  phone: reqStr('Personal mobile number is required').regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number'),

  // ── Location & Attendance ────────────────────────────────────────────────
  working_state_country: optInt,
  working_city: optInt,
  working_site: optInt,
  pay_register_location: optInt,
  actual_doj: reqStr('Date of Joining is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Joining must be in YYYY-MM-DD format')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid Date of Joining'),
  weekly_off: optInt,
  shift_category: z.enum(['Shift', 'Duration']).optional().nullable(),
  shift_id: optInt,
  grace_minutes: optInt,

  // ── Managers & Work Contact ──────────────────────────────────────────────
  l1_manager_id: z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  l2_manager_id: z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  official_email: z.string().email().optional().or(z.literal('')).nullable(),
  official_mobile: z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')).nullable(),

  // ── Commitment & Probation ───────────────────────────────────────────────
  commitment: yesNo,

  commitment_term: z
    .enum(['36 Months', '60 Months', 'N/A'])
    .optional()
    .nullable(),

  commitment_entered_on: optDate,

  commitment_end_date: optDate,

  on_probation: yesNo,

  probation_period: optStr,

  probation_end_date: optDate,

  probation_status: z
    .enum(['Confirmed', 'Failed', 'Not Applicable'])
    .optional()
    .nullable(),

  // ── Statutory Schemes ────────────────────────────────────────────────────
  pf_status: yesNo,
  uan_number: z.string().regex(/^\d{12}$/, 'UAN must be 12 digits').optional().or(z.literal('')).nullable(),
  epfo_member_id: optStr,
  pf_contribution_pct: optNum,
  pf_employer_from: z.enum(['Employee', 'Employer', 'N/A']).optional().nullable(),
  pf_employee_12: optNum,
  eps_employer_833: optNum,
  epf_eps_diff_367: optNum,
  esic_status: yesNo,
  esic_number: optStr,
  esi_employee_pct: optNum,
  esi_employer_pct: optNum,
  mediclaim_status: z.enum(['Yes', 'No', 'Not Applicable']).optional().nullable(),
  mediclaim_number: optStr,
  mediclaim_amount: z.enum(['150000', '250000', '400000', '500000', 'Not Applicable']).optional().nullable(),
  rd_scheme: yesNo,
  rd_term: z.enum(['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A']).optional().nullable(),
  rd_opening_date: optDate,
  rd_account_number: optStr,
  rd_deduction_from: z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  rd_amount_employee: optNum,
  rd_amount_employer: optNum,
  ttl_m_contribution: optNum,
  rd_maturity_date: optDate,
  rd_maturity_amount: optNum,
  rd_status: z.string().optional().nullable(),

  // ── Compensation ─────────────────────────────────────────────────────────
  salary_mode: z.enum(['Bank Transfer', 'Cash', 'Cheque']).optional().nullable(),
  current_basic: optNum,
  current_hra: optNum,
  current_allowance1: optNum,
  current_amdb: optNum,
  joining_basic: optNum,
  joining_hra: optNum,
  joining_allowance1: optNum,
  joining_amdb: optNum,
  asset_deduction_applicable: yesNo,
  security_amount: optNum,
  deduction_months: z.number({ coerce: true }).int().min(0).optional().nullable(),
  deduction_from: z.enum(['Salary', 'AMDB', 'N/A']).optional().nullable(),
  monthly_deduction: optNum,
  final_monthly_deduction: optNum,

  // ── HR Joining Checklist ─────────────────────────────────────────────────
  offer_letter: yesNo,
  address_verification: yesNo,
  service_agreement: yesNo,
  indemnity_bond: yesNo,
  asset_deduction_letter: yesNo,
  account_opening_letter: yesNo,
  nda: yesNo,
  remarks: optStr,

  // ── Personal Profile ─────────────────────────────────────────────────────
  date_of_birth: optDate,
  gender: z.enum(['Male', 'Female']).optional().nullable(),
  shirt_size: optStr,
  tshirt_size: optStr,
  nationality: optStr,
  religion: optStr,
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available']).optional().nullable(),

  // ── Address ───────────────────────────────────────────────────────────────
  present_house_type: z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  present_house_no: optStr,
  present_area: optStr,
  present_district: optStr,
  present_city: optStr,
  present_state: optStr,
  present_country: optStr,
  present_pincode: z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),
  perm_address_type: z.enum(['Same as Present', 'Different', 'Not Applicable']).optional().nullable(),
  perm_house_type: z.enum(['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other']).optional().nullable(),
  perm_house_no: optStr,
  perm_area: optStr,
  perm_district: optStr,
  perm_city: optStr,
  perm_state: optStr,
  perm_country: optStr,
  perm_pincode: z.string().regex(/^\d{4,10}$/).optional().or(z.literal('')).nullable(),

  // ── Family & Emergency (marital_status/spouse/children moved here) ───────
  marital_status: z.enum(['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower']).optional().nullable(),
  marriage_date: optDate,
  spouse_name: optStr,
  spouse_dob: optDate,
  child1_name: optStr,
  child1_gender: z.enum(['Male', 'Female']).optional().nullable(),
  child1_dob: optDate,
  child2_name: optStr,
  child2_gender: z.enum(['Male', 'Female']).optional().nullable(),
  child2_dob: optDate,
  child3_name: optStr,
  child3_gender: z.enum(['Male', 'Female']).optional().nullable(),
  child3_dob: optDate,
  father_salutation: z.enum(['Mr.', 'Dr.', 'Late']).optional().nullable(),
  father_name: optStr,
  father_dob: optDate,
  father_occupation: optStr,
  mother_salutation: z.enum(['Mrs.', 'Ms.', 'Dr.', 'Late']).optional().nullable(),
  mother_name: optStr,
  mother_dob: optDate,
  mother_occupation: optStr,
  family_members: z.array(familyMemberSchema).optional().default([]),
  emergency_contacts: z.array(emergencyContactSchema).optional().default([]),

  // ── IDs & Bank ────────────────────────────────────────────────────────────
  aadhaar_number: z.string({ required_error: 'Aadhaar is required' }).regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  aadhaar_name: reqStr('Name as on Aadhaar is required').max(200),
  aadhaar_dob: reqStr('Date of birth (Aadhaar) is required'),
  aadhaar_address: reqStr('Address as on Aadhaar is required'),
  aadhaar_scan_url: optStr,
  pan_number: z.string().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (ABCDE1234F)').optional().or(z.literal('')).nullable(),
  pan_full_name: optStr,
  pan_dob: optDate,
  pan_parent_spouse_name: optStr,
  pan_scan_url: optStr,
  passport_number: optStr,
  passport_full_name: optStr,
  passport_nationality: optStr,
  passport_issue_date: optDate,
  passport_expiry: optDate,
  passport_place_of_issue: optStr,
  passport_scan_url: optStr,
  yellow_fever: yesNo,
  yellow_fever_date: optDate,
  driving_license_number: optStr,
  driving_license_name: optStr,
  driving_license_issue_date: optDate,
  driving_license_expiry: optDate,
  driving_license_authority: optStr,
  driving_license_scan_url: optStr,
  vaccinations: z.array(vaccinationSchema).optional().default([]),
  documents: z.array(documentSchema).optional().default([]),
  personal_bank_name: reqStr('Bank name is required').max(200),
  personal_bank_account: z.string({ required_error: 'Account number is required' }).regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  personal_ifsc: z.string({ required_error: 'IFSC is required' }).toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (ABCD0123456)'),
  personal_bank_branch: optStr,

  // ── Experience & Education ───────────────────────────────────────────────
  is_experienced: yesNo,
  experience: z.array(experienceEntrySchema).optional().default([]),
  education: z.array(educationEntrySchema).optional().default([]),
});

export type FullEmployeeForm = z.infer<typeof fullEmployeeSchema>;
export type StepSchemaKey = keyof typeof STEP_SCHEMA_MAP;

/** Alias kept for backward compatibility with existing step components */
export type FullEmployeeFormData = FullEmployeeForm;