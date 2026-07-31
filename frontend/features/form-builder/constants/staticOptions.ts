export interface FieldOption {
  label: string;
  value: string | number | boolean | null;
}

export const FORM_FIELD_OPTIONS: Record<string, FieldOption[]> = {
EMPLOYMENT_TYPE : [
  { label: 'Permanent', value: 'Permanent' },
  { label: 'Contractual', value: 'Contractual' },
],
COMMITMENT_TERM : [
  { label: '36 Months', value: '36 Months' },
  { label: '60 Months', value: '60 Months' },
],
CONFIRMATION_STATUS : [
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Not Applicable', value: 'Not Applicable' },
],

PF_EMPLOYER_FROM : [
  { label: 'Employee', value: 'Employee' },
  { label: 'Employer', value: 'Employer' },
],

MEDICLAIM_STATUS : [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: 'Deactivate', value: 'Deactivate' },
],

PROBATION_PERIOD : [
  { label: '1 Month', value: '1 Month' },
  { label: '2 Months', value: '2 Months' },
  { label: '3 Months', value: '3 Months' },
  { label: '6 Months', value: '6 Months' },
  { label: '12 Months', value: '12 Months' },
],

RD_TERM : [
  { label: '6 Months', value: '6 Months' },
  { label: '12 Months', value: '12 Months' },
  { label: '18 Months', value: '18 Months' },
  { label: '24 Months', value: '24 Months' },
  { label: '30 Months', value: '30 Months' },
  { label: '36 Months', value: '36 Months' },
],

HOUSE_TYPE : [
  { label: 'Own', value: 'Own' },
  { label: 'Rent', value: 'Rent' },
],

PERM_ADDRESS_TYPE : [
  { label: 'Same as Present', value: 'Same as Present' },
  { label: 'Other', value: 'Other' },
],

FATHER_SALUTATION : [
  { label: 'Mr.', value: 'Mr.' },
  { label: 'Late', value: 'Late' },
],

MOTHER_SALUTATION : [
  { label: 'Mrs.', value: 'Mrs.' },
  { label: 'Late', value: 'Late' },
],

PARENT_STATUS : [
  { label: 'Working', value: 'Working' },
  { label: 'Retired', value: 'Retired' },
  { label: 'Not Applicable', value: 'Not Applicable' },
],

MOTHER_STATUS : [
  { label: 'Working', value: 'Working' },
  { label: 'Retired', value: 'Retired' },
  { label: 'Not Applicable', value: 'Not Applicable' },
  { label: 'House Wife', value: 'House Wife' },
],

SALARY_MODE : [
  { label: 'Transfer', value: 'Transfer' },
  { label: 'Cheque', value: 'Cheque' },
],

DEDUCTION_FROM : [
  { label: 'Salary', value: 'Salary' },
  { label: 'AMDB', value: 'AMDB' },
  { label: 'N/A', value: 'N/A' },
],

DEDUCTION_MONTHS : [
  { label: '3 Months', value: '3 Months' },
  { label: '6 Months', value: '6 Months' },
  { label: '9 Months', value: '9 Months' },
  { label: '12 Months', value: '12 Months' },
  { label: '15 Months', value: '15 Months' },
  { label: '18 Months', value: '18 Months' },
  { label: '21 Months', value: '21 Months' },
  { label: '24 Months', value: '24 Months' },
  { label: '27 Months', value: '27 Months' },
  { label: '30 Months', value: '30 Months' },
  { label: '33 Months', value: '33 Months' },
  { label: '36 Months', value: '36 Months' },
  { label: '40 Months', value: '40 Months' },
  { label: 'N/A', value: 'N/A' },
],

GENDER : [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
],

BLOOD_GROUP : [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
],

MARITAL_STATUS : [
  { label: 'Single', value: 'Single' },
  { label: 'Married', value: 'Married' },
  { label: 'Divorced', value: 'Divorced' },
  { label: 'Widowed', value: 'Widowed' },
  { label: 'Separated', value: 'Separated' },
],

WORKING_SITE_OPTIONS : [
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
  {
    label: 'SCB Medical College And Hospital',
    value: 'SCB Medical College And Hospital',
  },
  { label: 'Victoria Hospital', value: 'Victoria Hospital' },
  { label: 'Amrita Hospital', value: 'Amrita Hospital' },
  {
    label: 'Acharya Shree Bhikshu Hospital',
    value: 'Acharya Shree Bhikshu Hospital',
  },
  { label: 'Central Vista', value: 'Central Vista' },
  { label: 'PGIMER Una', value: 'PGIMER Una' },
  { label: 'SMS Hospital', value: 'SMS Hospital' },
  { label: 'Bawana', value: 'Bawana' },
  { label: 'A4 Moti Bagh', value: 'A4 Moti Bagh' },
  { label: 'UMCH Dhaka', value: 'UMCH Dhaka' },
  {
    label: 'Maharaja Agrasen Hospital',
    value: 'Maharaja Agrasen Hospital',
  },
  { label: 'NA 45', value: 'NA 45' },
  { label: 'BDD Chawl', value: 'BDD Chawl' },
  {
    label: 'SCTIMST Thiruvananthapuram',
    value: 'SCTIMST Thiruvananthapuram',
  },
],

WORKING_CITY_OPTIONS : [
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
],
}


export const REGISTRATION_LOCATION_OPTIONS = [
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Ratlam, Madhya Pradesh', value: 'Ratlam, Madhya Pradesh' },
  { label: 'Chhindwara, Madhya Pradesh', value: 'Chhindwara, Madhya Pradesh' },
  { label: 'Vidisha, Madhya Pradesh', value: 'Vidisha, Madhya Pradesh' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Khandwa, Madhya Pradesh', value: 'Khandwa, Madhya Pradesh' },
  { label: 'Almora, Uttarakhand', value: 'Almora, Uttarakhand' },
  { label: 'Daman, Gujarat', value: 'Daman, Gujarat' },
  { label: 'CNCI Kolkata', value: 'CNCI Kolkata' },
  { label: 'Bilaspur', value: 'Bilaspur' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Bathinda', value: 'Bathinda' },
  { label: 'Mangalagiri', value: 'Mangalagiri' },
  { label: 'Jharkhand', value: 'Jharkhand' },
  { label: 'Nagpur, Mumbai', value: 'Nagpur, Mumbai' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Una, Himachal Pradesh', value: 'Una, Himachal Pradesh' },
  { label: 'Kerala', value: 'Kerala' },
] as const;

export const SATURDAY_OFF_OPTIONS = [
  { label: '1st', value: '1st' },
  { label: '2nd', value: '2nd' },
  { label: '3rd', value: '3rd' },
  { label: '4th', value: '4th' },
  { label: '5th', value: '5th' },
  { label: '1st & 3rd', value: '1st & 3rd' },
  { label: '2nd & 4th', value: '2nd & 4th' },
  { label: '1st & 4th', value: '1st & 4th' },
  { label: '2nd & 3rd', value: '2nd & 3rd' },
  { label: '3rd & 4th', value: '3rd & 4th' },
  { label: '1st & 2nd', value: '1st & 2nd' },
  { label: '1st, 2nd & 3rd', value: '1st, 2nd & 3rd' },
  { label: '1st, 2nd & 4th', value: '1st, 2nd & 4th' },
  { label: '1st, 3rd & 4th', value: '1st, 3rd & 4th' },
  { label: '2nd, 3rd & 4th', value: '2nd, 3rd & 4th' },
  { label: 'All 4 Saturdays', value: 'All 4 Saturdays' },
  { label: 'All Saturdays', value: 'All Saturdays' },
  { label: 'No Saturday Off', value: 'No Saturday Off' },
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

  { label: 'NAT (7.0 A - 3.0 P)', value: 28 },
  { label: 'NAT (8.0 A - 2.0 P)', value: 29 },
  { label: 'NAT (8.0 A - 4.3 P)', value: 30 },
  { label: 'NAT (8.0 A - 5.0 P)', value: 31 },
  { label: 'NAT (9.0 A - 5.3 P)', value: 32 },
  { label: 'NAT (9.0 A - 6.0 P)', value: 33 },
  { label: 'NAT (9.0 A - 7.0 P)', value: 34 },
  { label: 'NAT (9.15 A - 7.0 P)', value: 35 },
  { label: 'NAT (10.0 A - 6.0 P)', value: 36 },
  { label: 'NAT (10.0 A - 6.3 P)', value: 37 },
  { label: 'NAT (10.0 A -7.0 P)', value: 38 },
  { label: 'NAT (10.3 A - 7.3 P)', value: 39 },
  { label: 'NAT (11.0 A - 7.0 P)', value: 40 },
  { label: 'NAT (11.0 A - 8.0 P)', value: 41 },
  { label: 'NAT (11.3 A - 8.0 P)', value: 42 },
  { label: 'NAT (12.3 P - 9.0 P)', value: 43 },
  { label: 'NAT (1.0 P - 9.0 P)', value: 44 },
  { label: 'NAT (1.0 P - 9.3 P)', value: 45 },
  { label: 'NAT (2.0 P - 8.0 P)', value: 46 },
  { label: 'NAT (2.0 P - 9.0 P)', value: 47 },
  { label: 'NAT (2.0 P - 10.0 P)', value: 48 },
  { label: 'NAT (3.0 P - 11.0 P)', value: 49 },
  { label: 'NAT (5.0 P - 9.0 A)', value: 50 },
  { label: 'NAT (8.0 P - 6.0 A)', value: 51 },
  { label: 'NAT (8.0 P - 8.0 A)', value: 52 },
  { label: 'NAT (9.0 P - 5.3 A)', value: 53 },
  { label: 'NAT (11.0 P - 7.0 A)', value: 54 },

  { label: 'NAT (7.0 A - 5.0 P)', value: 55 },
  { label: 'Shift (7.0 A - 5.0 P)', value: 56 },
  { label: 'NAT (9.45 A - 7.0 P)', value: 57 },
  { label: 'Shift (9.45 A - 7.0 P)', value: 58 },
  { label: 'Shift (9.0 A - 9.0 P)', value: 59 },
  { label: 'NAT (9.0 A - 9.0 P)', value: 60 },
  { label: 'Shift (9.0 A - 5.0 P)', value: 61 },
  { label: 'NAT (9.0 A - 5.0 P)', value: 62 },
  { label: 'Shift (12.0 P - 8.0 P)', value: 63 },
  { label: 'NAT (12.0 P - 8.0 P)', value: 64 },
] as const;

export const getStaticOptions = (fieldKey: string): FieldOption[] => {
  return FORM_FIELD_OPTIONS[fieldKey] || [];
};