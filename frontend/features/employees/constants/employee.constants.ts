// Helper: convert constant arrays to Select options
export const toOpts = (arr: readonly string[]) => arr.map(v => ({ value: v, label: v }));

// ─── Wizard steps — 3 parts: HR (7) → Candidate self-service (5) → Finalize (1)
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

// Step completion weights — two independent pools, each summing to 100
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
export const PROBATION_PERIOD     = ['1 Month', '2 Months', '3 Months', '6 Months', '12 Months', 'N/A'] as const;
export const RD_TERM              = ['6 Months', '12 Months', '18 Months', '24 Months', '30 Months', '36 Months', 'N/A'] as const;
export const HOUSE_TYPE           = ['Owned', 'Rented', 'Company Provided', 'PG / Hostel', 'Other'] as const;
export const PERM_ADDRESS_TYPE    = ['Same as Present', 'Different', 'Not Applicable'] as const;
export const FATHER_SALUTATION    = ['Mr.', 'Dr.', 'Late'] as const;
export const MOTHER_SALUTATION    = ['Mrs.', 'Ms.', 'Dr.', 'Late'] as const;
// DEPRECATED — father_status column dropped; mother_occupation is now free text.
// Left exported in case other files still reference these types.
export const PARENT_STATUS        = ['Working', 'Retired', 'Not Applicable'] as const;
export const MOTHER_STATUS        = ['Working', 'Retired', 'Not Applicable', 'House Wife'] as const;
export const SALARY_MODE          = ['Bank Transfer', 'Cash', 'Cheque'] as const;
export const DEDUCTION_FROM       = ['Salary', 'AMDB', 'N/A'] as const;
export const DEDUCTION_MONTHS     = ['3 Months','6 Months','9 Months','12 Months','15 Months','18 Months','21 Months','24 Months','27 Months','30 Months','33 Months','36 Months','40 Months','N/A'] as const;
export const GENDER               = ['Male', 'Female'] as const;
export const BLOOD_GROUP          = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Available'] as const;
export const MARITAL_STATUS       = ['Unmarried', 'Married', 'Divorced', 'Widow', 'Widower'] as const;
export const AMDB_PERCENTAGE      = 0.30;

// ─── Static lookup lists (UNG CollarCheck master data) ───────────────────────
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
  { value: '', label: 'Not Applicable' },
] as const;

export const WORKING_SITE_OPTIONS = [
  { label: 'Head Office', value: 'Head Office' },
  { label: 'SIC', value: 'SIC' },
  { label: 'RML Hospital', value: 'RML Hospital' },
  { label: 'LBS Hospital', value: 'LBS Hospital' },
  { label: 'LNJP Hospital', value: 'LNJP Hospital' },
  { label: 'AIIMS Bhatinda', value: 'AIIMS Bhatinda' },
  { label: 'AIIMS Manglagiri', value: 'AIIMS Manglagiri' },
  { label: 'AIIMS Nagpur', value: 'AIIMS Nagpur' },
  { label: 'GMC Ratlam', value: 'GMC Ratlam' },
  { label: 'Warehouse', value: 'Warehouse' },
  { label: 'AIIMS Bilaspur', value: 'AIIMS Bilaspur' },
  { label: 'GMC Bhopal', value: 'GMC Bhopal' },
  { label: 'AIIMS Delhi', value: 'AIIMS Delhi' },
  { label: 'CNCI Kolkata', value: 'CNCI Kolkata' },
  { label: 'Marwad Daman', value: 'Marwad Daman' },
  { label: 'GMC Chapra', value: 'GMC Chapra' },
  { label: 'NIUM', value: 'NIUM' },
  { label: 'AIIMS Deoghar', value: 'AIIMS Deoghar' },
  { label: 'SKMCH', value: 'SKMCH' },
  { label: 'SCB Medical College And Hospital', value: 'SCB Medical College And Hospital' },
  { label: 'Victoria Hospital', value: 'Victoria Hospital' },
  { label: 'Amrita Hospital', value: 'Amrita Hospital' },
  { label: 'Acharya Shree Bhikshu Hospital', value: 'Acharya Shree Bhikshu Hospital' },
  { label: 'Central Vista', value: 'Central Vista' },
  { label: 'PGIMER Una', value: 'PGIMER Una' },
  { label: 'SMS Hospital', value: 'SMS Hospital' },
  { label: 'Bawana', value: 'Bawana' },
  { label: 'A4 Moti Bagh', value: 'A4 Moti Bagh' },
  { label: 'UMCH Dhaka', value: 'UMCH Dhaka' },
  { label: 'Maharaja Agrasen Hospital', value: 'Maharaja Agrasen Hospital' },
  { label: 'NA 45', value: 'NA 45' },
  { label: 'BDD Chawl', value: 'BDD Chawl' },
  { label: 'SCTIMST Thiruvananthapuram', value: 'SCTIMST Thiruvananthapuram' },
  { label: 'Not Fixed', value: 'Not Fixed' },
] as const;

export const WORKING_CITY_OPTIONS = [
  { label: 'New Delhi', value: 'New Delhi' },
  { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Una', value: 'Una' },
  { label: 'Jaipur', value: 'Jaipur' },
  { label: 'Bhatinda', value: 'Bhatinda' },
  { label: 'Bilaspur', value: 'Bilaspur' },
  { label: 'Deoghar', value: 'Deoghar' },
  { label: 'Guntur', value: 'Guntur' },
  { label: 'Nagpur', value: 'Nagpur' },
  { label: 'Faridabad', value: 'Faridabad' },
  { label: 'Kolkata', value: 'Kolkata' },
  { label: 'Bhopal', value: 'Bhopal' },
  { label: 'Chapra', value: 'Chapra' },
  { label: 'Ratlam', value: 'Ratlam' },
  { label: 'Daman', value: 'Daman' },
  { label: 'Ghaziabad', value: 'Ghaziabad' },
  { label: 'Cuttack', value: 'Cuttack' },
  { label: 'Muzaffarpur', value: 'Muzaffarpur' },
  { label: 'Bangalore', value: 'Bangalore' },
  { label: 'Dhaka', value: 'Dhaka' },
  { label: 'Bahadurgarh', value: 'Bahadurgarh' },
  { label: 'Thiruvananthapuram', value: 'Thiruvananthapuram' },
  { label: 'Hyderabad', value: 'Hyderabad' },
  { label: 'Not Fixed', value: 'Not Fixed' },
] as const;

export const WORKING_STATE_COUNTRY_OPTIONS = [
  { label: 'Andaman & Nicobar, India', value: 'Andaman & Nicobar, India' },
  { label: 'Andhra Pradesh, India', value: 'Andhra Pradesh, India' },
  { label: 'Arunachal Pradesh, India', value: 'Arunachal Pradesh, India' },
  { label: 'Assam, India', value: 'Assam, India' },
  { label: 'Bihar, India', value: 'Bihar, India' },
  { label: 'Chandigarh, India', value: 'Chandigarh, India' },
  { label: 'Chhattisgarh, India', value: 'Chhattisgarh, India' },
  { label: 'Delhi, India', value: 'Delhi, India' },
  { label: 'Goa, India', value: 'Goa, India' },
  { label: 'Gujarat, India', value: 'Gujarat, India' },
  { label: 'Haryana, India', value: 'Haryana, India' },
  { label: 'Himachal Pradesh, India', value: 'Himachal Pradesh, India' },
  { label: 'Jammu & Kashmir, India', value: 'Jammu & Kashmir, India' },
  { label: 'Jharkhand, India', value: 'Jharkhand, India' },
  { label: 'Karnataka, India', value: 'Karnataka, India' },
  { label: 'Kerala, India', value: 'Kerala, India' },
  { label: 'Madhya Pradesh, India', value: 'Madhya Pradesh, India' },
  { label: 'Maharashtra, India', value: 'Maharashtra, India' },
  { label: 'Manipur, India', value: 'Manipur, India' },
  { label: 'Meghalaya, India', value: 'Meghalaya, India' },
  { label: 'Mizoram, India', value: 'Mizoram, India' },
  { label: 'Nagaland, India', value: 'Nagaland, India' },
  { label: 'Odisha, India', value: 'Odisha, India' },
  { label: 'Puducherry, India', value: 'Puducherry, India' },
  { label: 'Punjab, India', value: 'Punjab, India' },
  { label: 'Rajasthan, India', value: 'Rajasthan, India' },
  { label: 'Sikkim, India', value: 'Sikkim, India' },
  { label: 'Tamil Nadu, India', value: 'Tamil Nadu, India' },
  { label: 'Telangana, India', value: 'Telangana, India' },
  { label: 'Tripura, India', value: 'Tripura, India' },
  { label: 'Uttar Pradesh, India', value: 'Uttar Pradesh, India' },
  { label: 'Uttarakhand, India', value: 'Uttarakhand, India' },
  { label: 'West Bengal, India', value: 'West Bengal, India' },
  { label: 'Dadra and Nagar Haveli and Daman and Diu, India', value: 'Dadra and Nagar Haveli and Daman and Diu, India' },
  { label: 'Dhaka, Bangladesh', value: 'Dhaka, Bangladesh' },
] as const;

export const REGISTRATION_LOCATION_OPTIONS = [
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Kolkata', value: 'Kolkata' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Nagpur (MH)', value: 'Nagpur (MH)' },
  { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
  { label: 'Jharkhand', value: 'Jharkhand' },
] as const;

// Weekly off presets — weekly_off is a free-text lookup column, values match
// the real product UI exactly (replaces the old, differently-shaped
// SATURDAY_OFF_OPTIONS list which didn't match what's actually shown).
export const WEEKLY_OFF_OPTIONS = [
  { value: 'All Sundays', label: 'All Sundays' },
  { value: 'Sunday + 4th Saturday', label: 'Sunday + 4th Saturday' },
  { value: 'Sunday + 2nd & 4th Saturday', label: 'Sunday + 2nd & 4th Saturday' },
  { value: '2nd & 4th Sunday', label: '2nd & 4th Sunday' },
  { value: 'All Saturdays & Sundays', label: 'All Saturdays & Sundays' },
  { value: 'No Weekly Off', label: 'No Weekly Off' },
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