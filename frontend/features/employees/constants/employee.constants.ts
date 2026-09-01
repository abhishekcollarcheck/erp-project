export const toOpts = (arr: readonly string[]) => arr.map(v => ({ value: v, label: v }));
export const WIZARD_STEPS = [
  { key: 'role_identity',        label: 'Role & Identity',         icon: 'user',         part: 'hr',        required: true, sensitive: false },
  { key: 'location_attendance',  label: 'Location & Attendance',   icon: 'briefcase',    part: 'hr',        required: true, sensitive: false },
  { key: 'managers_work_contact',label: 'Managers & Work Contact', icon: 'users',        part: 'hr',        required: true, sensitive: false },
  { key: 'commitment_probation', label: 'Commitment & Probation',  icon: 'calendar',     part: 'hr',        required: true, sensitive: false },
  { key: 'statutory_schemes',    label: 'Statutory Schemes',       icon: 'shield',       part: 'hr',        required: true, sensitive: false },
  { key: 'compensation',         label: 'Compensation',            icon: 'indian-rupee', part: 'hr',        required: true, sensitive: true  },
  { key: 'hr_joining_checklist', label: 'HR Joining Checklist',    icon: 'check-square', part: 'hr',        required: true, sensitive: false },
  { key: 'personal_profile',     label: 'Personal Profile',        icon: 'heart',        part: 'candidate', required: true, sensitive: false },
  { key: 'address',              label: 'Address',                 icon: 'map-pin',      part: 'candidate', required: true, sensitive: false },
  { key: 'family_emergency',     label: 'Family & Emergency',      icon: 'users',        part: 'candidate', required: true, sensitive: false },
  { key: 'ids_bank',             label: 'IDs & Bank',              icon: 'credit-card',  part: 'candidate', required: true, sensitive: true  },
  { key: 'experience_education', label: 'Experience & Education',  icon: 'book',         part: 'candidate', required: true, sensitive: false },
  { key: 'review',               label: 'Review & Submit',         icon: 'check-circle', part: 'review',    required: true, sensitive: false },
] as const;

export type StepKey = typeof WIZARD_STEPS[number]['key'];
export type WizardPart = typeof WIZARD_STEPS[number]['part'];

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
  address:                15,
  family_emergency:      20,
  ids_bank:                30,
  experience_education:  15,
};

// ─── Enums (synced to schema + real product UI) ───────────────────────────────
export const EMPLOYEE_STATUS      = ['Active', 'Left', 'Retired', 'On Notice', 'Relieved', 'Absconded', 'Inactive'] as const;
export const EMPLOYMENT_TYPE      = ['Permanent', 'Contract', 'Intern', 'Consultant', 'Probation'] as const;
export const COMMITMENT_TERM      = ['36 Months', '60 Months', 'N/A'] as const;
export const CONFIRMATION_STATUS  = ['Confirmed', 'Failed', 'Not Applicable'] as const;
export const PF_EMPLOYER_FROM     = ['Employee', 'Employer', 'N/A'] as const;
export const MEDICLAIM_STATUS     = ['Yes', 'No', 'Not Applicable'] as const;
export const PROBATION_PERIOD     = ['3 Months', '4 Months', '6 Months', '9 Months', '12 Months', 'Not Applicable'] as const;
export const RD_TERM              = ['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A'] as const;
export const HOUSE_TYPE           = ['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other'] as const;
export const PERM_ADDRESS_TYPE    = ['Same as Present', 'Different', 'Not Applicable'] as const;
export const FATHER_SALUTATION    = ['Mr.', 'Dr.', 'Late'] as const;
export const MOTHER_SALUTATION    = ['Mrs.', 'Ms.', 'Dr.', 'Late'] as const;
export const PARENT_STATUS        = ['Working', 'Retired', 'Not Applicable'] as const;
export const MOTHER_STATUS        = ['Working', 'Retired', 'Not Applicable', 'House Wife'] as const;
export const SALARY_MODE          = ['Bank Transfer', 'Cash', 'Cheque'] as const;
export const DEDUCTION_FROM       = ['Salary', 'AMDB', 'N/A'] as const;
export const DEDUCTION_MONTHS     = ['3 Months','6 Months','9 Months','12 Months','15 Months','18 Months','21 Months','24 Months','27 Months','30 Months','33 Months','36 Months','40 Months','N/A'] as const;
export const GENDER               = ['Male', 'Female'] as const;
export const BLOOD_GROUP          = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available'] as const;
export const MARITAL_STATUS       = ['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower'] as const;
export const AMDB_PERCENTAGE      = 0.30;

export const SHIFT_CATEGORY = ['Shift', 'Duration'] as const;
export type ShiftCategory = typeof SHIFT_CATEGORY[number];

export const DEPARTMENT_OPTIONS = [
  { value: 1,  label: 'Commercial' },
  { value: 2,  label: 'Accounts' },
  { value: 3,  label: 'Automation' },
  { value: 4,  label: 'HR' },
  { value: 5,  label: 'Graphics' },
  { value: 6,  label: 'Admin' },
  { value: 7,  label: 'Project' },
  { value: 8,  label: 'Service' },
  { value: 9,  label: 'IT' },
  { value: 10, label: 'Estimation' },
  { value: 11, label: 'Management' },
  { value: 12, label: 'Purchase' },
  { value: 13, label: 'Tender' },
  { value: 14, label: 'Sales' },
  { value: 15, label: 'Technical' },
  { value: 16, label: 'Legal' },
  { value: 17, label: 'Regulatory Affairs' },
  { value: 18, label: 'Store' },
  { value: 19, label: 'Ortho' },
  { value: 20, label: 'Maintenance' },
  { value: 21, label: 'Design' },
  { value: 22, label: 'Quality' },
  { value: 23, label: 'Credit Control' },
  { value: 24, label: 'International Marketing' },
  { value: 25, label: 'Field' },
  { value: 26, label: 'Projects' },
  { value: 27, label: 'Facility Management (Operations)' },
  { value: 28, label: 'PTS and Project' },
  { value: 29, label: 'CSSD' },
  { value: 30, label: 'Quality Control' },
  { value: 31, label: 'Marketing' },
  { value: 32, label: 'Operations' },
] as const;

export const SUB_DEPARTMENT_OPTIONS = [
  { value: 1,  label: 'CSSD' },
  { value: 2,  label: 'MOT' },
  { value: 3,  label: 'Automation' },
  { value: 4,  label: 'NCS' },
  { value: 5,  label: 'PTS' },
  { value: 6,  label: 'Help Desk / IT Support' },
  { value: 7,  label: 'UI / UX / Frontend' },
  { value: 8,  label: 'PWLCS' },
  { value: 9,  label: 'Domestic' },
  { value: 10, label: 'Backend' },
  { value: 11, label: 'SEO' },
  { value: 12, label: 'International' },
  { value: 13, label: 'MGPS' },
  { value: 14, label: 'Whatsapp & Email' },
  { value: 15, label: 'Not Applicable' },
  { value: 16, label: 'Electrical' },
] as const;

export const DESIGNATION_OPTIONS = [
  { value: 1,  label: 'Accountant' },
  { value: 2,  label: 'Advisor' },
  { value: 3,  label: 'Asst. General Manager' },
  { value: 4,  label: 'Asst. Manager' },
  { value: 5,  label: 'CMD' },
  { value: 6,  label: 'Computer Operator' },
  { value: 7,  label: 'Cook' },
  { value: 8,  label: 'Coordinator' },
  { value: 9,  label: 'Deputy Manager' },
  { value: 10, label: 'Director' },
  { value: 11, label: 'Driver' },
  { value: 12, label: 'Electrician' },
  { value: 13, label: 'Engineer' },
  { value: 14, label: 'Executive' },
  { value: 15, label: 'Executive Assistant' },
  { value: 16, label: 'Field Assistant' },
  { value: 17, label: 'Fitter' },
  { value: 18, label: 'General Manager' },
  { value: 19, label: 'Guard' },
  { value: 20, label: 'Helper' },
  { value: 21, label: 'Jr. Accountant' },
  { value: 22, label: 'Jr. Executive' },
  { value: 23, label: 'Jr. Operator' },
  { value: 24, label: 'Jr. Technician' },
  { value: 25, label: 'Manager' },
  { value: 26, label: 'MIS Executive' },
  { value: 27, label: 'Office Attendant' },
  { value: 28, label: 'Operator' },
  { value: 29, label: 'Plumber' },
  { value: 30, label: 'Receptionist' },
  { value: 31, label: 'Sales Officer' },
  { value: 32, label: 'Senior Deputy Manager' },
  { value: 33, label: 'Site Engineer' },
  { value: 34, label: 'Sr. Computer Operator' },
  { value: 35, label: 'Sr. Coordinator' },
  { value: 36, label: 'Sr. Engineer' },
  { value: 37, label: 'Sr. Executive' },
  { value: 38, label: 'Sr. Field Assistant' },
  { value: 39, label: 'Sr. Fitter' },
  { value: 40, label: 'Sr. Helper' },
  { value: 41, label: 'Sr. Manager' },
  { value: 42, label: 'Sr. MIS Executive' },
  { value: 43, label: 'Sr. Sales Officer' },
  { value: 44, label: 'Supervisor' },
  { value: 45, label: 'Technician' },
  { value: 46, label: 'Data Entry Operator' },
  { value: 47, label: 'Security Guard' },
  { value: 48, label: 'Field Executive' },
  { value: 49, label: 'Site Supervisor' },
  { value: 50, label: 'Housekeeper' },
  { value: 51, label: 'Jr. Engineer' },
  { value: 52, label: 'Semi Fitter' },
  { value: 53, label: 'Sr. Developer' },
  { value: 54, label: 'Vice President' },
  { value: 55, label: 'Social Media Video Editor' },
  { value: 56, label: 'Quality Assurance Engineer' },
  { value: 57, label: 'Recruiter' },
  { value: 58, label: 'Sr. Site Engineer' },
  { value: 59, label: 'Jr. Site Engineer' },
  { value: 60, label: 'Site Manager' },
  { value: 61, label: 'Flutter Developer' },
  { value: 62, label: 'Incharge' },
  { value: 63, label: 'Sr. Recruiter' },
  { value: 64, label: 'Jr. Recruiter' },
  { value: 65, label: 'PSO' },
  { value: 66, label: 'Social Media Manager' },
  { value: 67, label: 'Fullstack Developer' },
  { value: 68, label: 'Software Engineer' },
  { value: 69, label: 'Dispatch Clerk Cum Engineer' },
  { value: 70, label: 'Jr. Fitter' },
  { value: 71, label: 'Deputy General Manager' },
  { value: 72, label: 'Jr. Electrician' },
  { value: 73, label: 'Social Media Executive' },
  { value: 74, label: 'Sr. Data Analyst' },
  { value: 75, label: 'Sr. Supervisor' },
  { value: 76, label: 'Sr. Software Engineer' },
] as const;

// TODO: placeholder only — sub_designation_id is a real FK lookup now
// (previously free text). Replace with API-driven options once the
// sub_designations table exists and is populated.
export const SUB_DESIGNATION_OPTIONS = [
  { value: '1', label: 'Not Applicable' },
] as const;

export const WORKING_SITE_OPTIONS = [
  { value: 1, label: 'Head Office' },
  { value: 2, label: 'SIC' },
  { value: 3, label: 'RML Hospital' },
  { value: 4, label: 'LBS Hospital' },
  { value: 5, label: 'LNJP Hospital' },
  { value: 6, label: 'AIIMS Bhatinda' },
  { value: 7, label: 'AIIMS Manglagiri' },
  { value: 8, label: 'AIIMS Nagpur' },
  { value: 9, label: 'GMC Ratlam' },
  { value: 10, label: 'Warehouse' },
  { value: 11, label: 'AIIMS Bilaspur' },
  { value: 12, label: 'GMC Bhopal' },
  { value: 13, label: 'AIIMS Delhi' },
  { value: 14, label: 'CNCI Kolkata' },
  { value: 15, label: 'Marwad Daman' },
  { value: 16, label: 'GMC Chapra' },
  { value: 17, label: 'NIUM' },
  { value: 18, label: 'AIIMS Deoghar' },
  { value: 19, label: 'SKMCH' },
  { value: 20, label: 'SCB Medical College And Hospital' },
  { value: 21, label: 'Victoria Hospital' },
  { value: 22, label: 'Amrita Hospital' },
  { value: 23, label: 'Acharya Shree Bhikshu Hospital' },
  { value: 24, label: 'Central Vista' },
  { value: 25, label: 'PGIMER Una' },
  { value: 26, label: 'SMS Hospital' },
  { value: 27, label: 'Bawana' },
  { value: 28, label: 'A4 Moti Bagh' },
  { value: 29, label: 'UMCH Dhaka' },
  { value: 30, label: 'Maharaja Agrasen Hospital' },
  { value: 31, label: 'NA 45' },
  { value: 32, label: 'BDD Chawl' },
  { value: 33, label: 'SCTIMST Thiruvananthapuram' },
  { value: 34, label: 'Not Fixed' },
] as const;

export const WORKING_CITY_OPTIONS = [
  { value: 1, label: 'New Delhi' },
  { value: 2, label: 'Mumbai' },
  { value: 3, label: 'Una' },
  { value: 4, label: 'Jaipur' },
  { value: 5, label: 'Bhatinda' },
  { value: 6, label: 'Bilaspur' },
  { value: 7, label: 'Deoghar' },
  { value: 8, label: 'Guntur' },
  { value: 9, label: 'Nagpur' },
  { value: 10, label: 'Faridabad' },
  { value: 11, label: 'Kolkata' },
  { value: 12, label: 'Bhopal' },
  { value: 13, label: 'Chapra' },
  { value: 14, label: 'Ratlam' },
  { value: 15, label: 'Daman' },
  { value: 16, label: 'Ghaziabad' },
  { value: 17, label: 'Cuttack' },
  { value: 18, label: 'Muzaffarpur' },
  { value: 19, label: 'Bangalore' },
  { value: 20, label: 'Dhaka' },
  { value: 21, label: 'Bahadurgarh' },
  { value: 22, label: 'Thiruvananthapuram' },
  { value: 23, label: 'Hyderabad' },
  { value: 24, label: 'Not Fixed' },
] as const;

export const WORKING_STATE_COUNTRY_OPTIONS = [
  { value: 1, label: 'Andaman & Nicobar, India' },
  { value: 2, label: 'Andhra Pradesh, India' },
  { value: 3, label: 'Arunachal Pradesh, India' },
  { value: 4, label: 'Assam, India' },
  { value: 5, label: 'Bihar, India' },
  { value: 6, label: 'Chandigarh, India' },
  { value: 7, label: 'Chhattisgarh, India' },
  { value: 8, label: 'Delhi, India' },
  { value: 9, label: 'Goa, India' },
  { value: 10, label: 'Gujarat, India' },
  { value: 11, label: 'Haryana, India' },
  { value: 12, label: 'Himachal Pradesh, India' },
  { value: 13, label: 'Jammu & Kashmir, India' },
  { value: 14, label: 'Jharkhand, India' },
  { value: 15, label: 'Karnataka, India' },
  { value: 16, label: 'Kerala, India' },
  { value: 17, label: 'Madhya Pradesh, India' },
  { value: 18, label: 'Maharashtra, India' },
  { value: 19, label: 'Manipur, India' },
  { value: 20, label: 'Meghalaya, India' },
  { value: 21, label: 'Mizoram, India' },
  { value: 22, label: 'Nagaland, India' },
  { value: 23, label: 'Odisha, India' },
  { value: 24, label: 'Puducherry, India' },
  { value: 25, label: 'Punjab, India' },
  { value: 26, label: 'Rajasthan, India' },
  { value: 27, label: 'Sikkim, India' },
  { value: 28, label: 'Tamil Nadu, India' },
  { value: 29, label: 'Telangana, India' },
  { value: 30, label: 'Tripura, India' },
  { value: 31, label: 'Uttar Pradesh, India' },
  { value: 32, label: 'Uttarakhand, India' },
  { value: 33, label: 'West Bengal, India' },
  { value: 34, label: 'Dadra and Nagar Haveli and Daman and Diu, India' },
  { value: 35, label: 'Dhaka, Bangladesh' },
] as const;

export const REGISTRATION_LOCATION_OPTIONS = [
  { value: 1, label: 'Delhi' },
  { value: 2, label: 'Haryana' },
  { value: 3, label: 'Uttar Pradesh' },
  { value: 4, label: 'Madhya Pradesh' },
  { value: 5, label: 'Bihar' },
  { value: 6, label: 'Kerala' },
  { value: 7, label: 'Gujarat' },
  { value: 8, label: 'Kolkata' },
  { value: 9, label: 'Punjab' },
  { value: 10, label: 'Andhra Pradesh' },
  { value: 11, label: 'Nagpur (MH)' },
  { value: 12, label: 'Himachal Pradesh' },
  { value: 13, label: 'Jharkhand' },
] as const;

// Weekly-off presets — stored as a numeric code (0-5) until a dedicated
// weekly_off_policies master table exists. Codes are arbitrary IDs, not a
// day-of-week index; actual off-day calculation happens later off this code.
// Do not reassign existing codes without a data migration.
export const WEEKLY_OFF_OPTIONS = [
  { value: 1, label: 'All Sundays' },
  { value: 2, label: 'Sunday + 4th Saturday' },
  { value: 3, label: 'Sunday + 2nd & 4th Saturday' },
  { value: 4, label: '2nd & 4th Sunday' },
  { value: 5, label: 'All Saturdays & Sundays' },
  { value: 6, label: 'No Weekly Off' },
] as const;

// Grace minutes presets — stored as a number, shown as friendly labels
export const GRACE_MINUTES_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
] as const;

export const SHIFT_TIMING_OPTIONS = [
  { label: 'Shift (7.0 A - 3.0 P)', value: 1 },
  { label: 'Shift (8.0 A - 2.0 P)', value: 2 },
  { label: 'Shift (8.0 A - 4.3 P)', value: 3 },
  { label: 'Shift (8.0 A - 5.0 P)', value: 4 },
  { label: 'Shift (9.0 A - 5.3 P)', value: 5 },
  { label: 'Shift (9.0 A - 6.0 P)', value: 6 },
  { label: 'Shift (9.0 A - 7.0 P)', value: 7 },
  { label: 'Shift (9.15 A - 7.0 P)', value: 8 },
  { label: 'Shift (10.0 A - 6.0 P)', value: 9 },
  { label: 'Shift (10.0 A - 6.3 P)', value: 10 },
  { label: 'Shift (10.0 A -7.0 P)', value: 11 },
  { label: 'Shift (10.3 A - 7.3 P)', value: 12 },
  { label: 'Shift (11.0 A - 7.0 P)', value: 13 },
  { label: 'Shift (11.0 A - 8.0 P)', value: 14 },
  { label: 'Shift (11.3 A - 8.0 P)', value: 15 },
  { label: 'Shift (12.3 P - 9.0 P)', value: 16 },
  { label: 'Shift (1.0 P - 9.0 P)', value: 17 },
  { label: 'Shift (1.0 P - 9.3 P)', value: 18 },
  { label: 'Shift (2.0 P - 8.0 P)', value: 19 },
  { label: 'Shift (2.0 P - 9.0 P)', value: 20 },
  { label: 'Shift (2.0 P - 10.0 P)', value: 21 },
  { label: 'Shift (3.0 P - 11.0 P)', value: 22 },
  { label: 'Shift (5.0 P - 9.0 A)', value: 23 },
  { label: 'Shift (8.0 P - 6.0 A)', value: 24 },
  { label: 'Shift (8.0 P - 8.0 A)', value: 25 },
  { label: 'Shift (9.0 P - 5.3 A)', value: 26 },
  { label: 'Shift (11.0 P - 7.0 A)', value: 27 },
] as const;

// ─── Personal Profile options ─────────────────────────────────────────────────
export const NATIONALITY_OPTIONS = [
  { value: 'Indian', label: 'Indian' },
  { value: 'Bangladeshi', label: 'Bangladeshi' },
  { value: 'Nepalese', label: 'Nepalese' },
  { value: 'Other', label: 'Other' },
] as const;

export const RELIGION_OPTIONS = [
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Muslim', label: 'Muslim' },
  { value: 'Sikh', label: 'Sikh' },
  { value: 'Christian', label: 'Christian' },
  { value: 'Not Available', label: 'Not Available' },
] as const;

export const SHIRT_SIZE_OPTIONS = [
  { value: 'XS (36)', label: 'XS (36)' },
  { value: 'S (38)', label: 'S (38)' },
  { value: 'M (40)', label: 'M (40)' },
  { value: 'L (42)', label: 'L (42)' },
  { value: 'XL (44)', label: 'XL (44)' },
  { value: 'XXL (46)', label: 'XXL (46)' },
  { value: 'XXXL (48)', label: 'XXXL (48)' },
] as const;

// ─── Family & Emergency options ───────────────────────────────────────────────
export const RELATIONSHIP_OPTIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Other', label: 'Other' },
] as const;

// ─── IDs & Bank options ────────────────────────────────────────────────────────
// Condensed list of major Indian banks — UI has a much longer list; expand as needed
export const BANK_NAME_OPTIONS = [
  { value: 'State Bank of India', label: 'State Bank of India' },
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Punjab National Bank', label: 'Punjab National Bank' },
  { value: 'Bank of Baroda', label: 'Bank of Baroda' },
  { value: 'Canara Bank', label: 'Canara Bank' },
  { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
  { value: 'Yes Bank', label: 'Yes Bank' },
  { value: 'IndusInd Bank', label: 'IndusInd Bank' },
  { value: 'Not Available', label: 'Not Available' },
] as const;

export const VACCINE_OPTIONS = [
  { value: 'COVID-19 (Dose 1)',        label: 'COVID-19 (Dose 1)' },
  { value: 'COVID-19 (Dose 2)',        label: 'COVID-19 (Dose 2)' },
  { value: 'COVID-19 Booster',         label: 'COVID-19 Booster' },
  { value: 'Yellow Fever',             label: 'Yellow Fever' },
  { value: 'Hepatitis B',              label: 'Hepatitis B' },
  { value: 'Typhoid',                  label: 'Typhoid' },
  { value: 'Tetanus / Tdap',           label: 'Tetanus / Tdap' },
  { value: 'MMR',                      label: 'MMR' },
  { value: 'Influenza',                label: 'Influenza' },
  { value: 'Polio',                    label: 'Polio' },
  { value: 'Varicella (Chickenpox)',   label: 'Varicella (Chickenpox)' },
  { value: 'Other',                    label: 'Other' },
] as const;

export const DOC_TYPE_OPTIONS = [
  { value: 'Degree / Marksheet', label: 'Degree / Marksheet' },
  { value: 'Provisional certificate', label: 'Provisional certificate' },
  { value: 'Relieving letter', label: 'Relieving letter' },
  { value: 'Experience letter', label: 'Experience letter' },
  { value: 'Appointment / Offer letter', label: 'Appointment / Offer letter' },
  { value: 'Salary slip', label: 'Salary slip' },
  { value: 'Photograph', label: 'Photograph' },
  { value: 'Address proof', label: 'Address proof' },
  { value: 'Cancelled cheque', label: 'Cancelled cheque' },
  { value: 'Form 16', label: 'Form 16' },
  { value: 'Birth certificate', label: 'Birth certificate' },
  { value: 'Marriage certificate', label: 'Marriage certificate' },
  { value: 'Other', label: 'Other' },
] as const;

// ─── Experience & Education options ───────────────────────────────────────────
export const HIGHEST_EDUCATION_OPTIONS = [
  '8th', '9th', '10th', '11th', '12th', 'Graduate', 'Masters', 'Doctorate',
  'Post Graduate', 'Illiterate', 'Not Applicable', 'Diploma',
].map(v => ({ value: v, label: v }));

export const EDUCATION_MODE_OPTIONS = [
  { value: 'Regular', label: 'Regular' },
  { value: 'Non Regular', label: 'Non Regular' },
  { value: 'Not Applicable', label: 'Not Applicable' },
] as const;