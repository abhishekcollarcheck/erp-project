/**
 * employee.masterOptions.ts
 * Backend copy of the numeric-coded option lists that, until now, lived ONLY in
 * frontend/features/employees/constants/employee.constants.ts.
 *
 * These are NOT database tables — the wizard's dropdowns emit the numeric `code`
 * directly and the step validators only check `isInt`. Bulk import receives the
 * human label from the spreadsheet, so it needs this lookup to turn
 * "Head Office" → 1 the same way the UI does.
 *
 * Keep in sync with the frontend file. A future improvement is to promote these
 * to an `employee_master_options` table served by an API that both sides read.
 */

export interface CodedOption { code: number; label: string }

export const WORKING_SITE_OPTIONS: CodedOption[] = [
  { code: 1, label: 'Head Office' }, { code: 2, label: 'SIC' }, { code: 3, label: 'RML Hospital' },
  { code: 4, label: 'LBS Hospital' }, { code: 5, label: 'LNJP Hospital' }, { code: 6, label: 'AIIMS Bhatinda' },
  { code: 7, label: 'AIIMS Manglagiri' }, { code: 8, label: 'AIIMS Nagpur' }, { code: 9, label: 'GMC Ratlam' },
  { code: 10, label: 'Warehouse' }, { code: 11, label: 'AIIMS Bilaspur' }, { code: 12, label: 'GMC Bhopal' },
  { code: 13, label: 'AIIMS Delhi' }, { code: 14, label: 'CNCI Kolkata' }, { code: 15, label: 'Marwad Daman' },
  { code: 16, label: 'GMC Chapra' }, { code: 17, label: 'NIUM' }, { code: 18, label: 'AIIMS Deoghar' },
  { code: 19, label: 'SKMCH' }, { code: 20, label: 'SCB Medical College And Hospital' }, { code: 21, label: 'Victoria Hospital' },
  { code: 22, label: 'Amrita Hospital' }, { code: 23, label: 'Acharya Shree Bhikshu Hospital' }, { code: 24, label: 'Central Vista' },
  { code: 25, label: 'PGIMER Una' }, { code: 26, label: 'SMS Hospital' }, { code: 27, label: 'Bawana' },
  { code: 28, label: 'A4 Moti Bagh' }, { code: 29, label: 'UMCH Dhaka' }, { code: 30, label: 'Maharaja Agrasen Hospital' },
  { code: 31, label: 'NA 45' }, { code: 32, label: 'BDD Chawl' }, { code: 33, label: 'SCTIMST Thiruvananthapuram' },
  { code: 34, label: 'Not Fixed' },
];

export const WORKING_CITY_OPTIONS: CodedOption[] = [
  { code: 1, label: 'New Delhi' }, { code: 2, label: 'Mumbai' }, { code: 3, label: 'Una' }, { code: 4, label: 'Jaipur' },
  { code: 5, label: 'Bhatinda' }, { code: 6, label: 'Bilaspur' }, { code: 7, label: 'Deoghar' }, { code: 8, label: 'Guntur' },
  { code: 9, label: 'Nagpur' }, { code: 10, label: 'Faridabad' }, { code: 11, label: 'Kolkata' }, { code: 12, label: 'Bhopal' },
  { code: 13, label: 'Chapra' }, { code: 14, label: 'Ratlam' }, { code: 15, label: 'Daman' }, { code: 16, label: 'Ghaziabad' },
  { code: 17, label: 'Cuttack' }, { code: 18, label: 'Muzaffarpur' }, { code: 19, label: 'Bangalore' }, { code: 20, label: 'Dhaka' },
  { code: 21, label: 'Bahadurgarh' }, { code: 22, label: 'Thiruvananthapuram' }, { code: 23, label: 'Hyderabad' }, { code: 24, label: 'Not Fixed' },
];

export const WORKING_STATE_COUNTRY_OPTIONS: CodedOption[] = [
  { code: 1, label: 'Andaman & Nicobar, India' }, { code: 2, label: 'Andhra Pradesh, India' }, { code: 3, label: 'Arunachal Pradesh, India' },
  { code: 4, label: 'Assam, India' }, { code: 5, label: 'Bihar, India' }, { code: 6, label: 'Chandigarh, India' },
  { code: 7, label: 'Chhattisgarh, India' }, { code: 8, label: 'Delhi, India' }, { code: 9, label: 'Goa, India' },
  { code: 10, label: 'Gujarat, India' }, { code: 11, label: 'Haryana, India' }, { code: 12, label: 'Himachal Pradesh, India' },
  { code: 13, label: 'Jammu & Kashmir, India' }, { code: 14, label: 'Jharkhand, India' }, { code: 15, label: 'Karnataka, India' },
  { code: 16, label: 'Kerala, India' }, { code: 17, label: 'Madhya Pradesh, India' }, { code: 18, label: 'Maharashtra, India' },
  { code: 19, label: 'Manipur, India' }, { code: 20, label: 'Meghalaya, India' }, { code: 21, label: 'Mizoram, India' },
  { code: 22, label: 'Nagaland, India' }, { code: 23, label: 'Odisha, India' }, { code: 24, label: 'Puducherry, India' },
  { code: 25, label: 'Punjab, India' }, { code: 26, label: 'Rajasthan, India' }, { code: 27, label: 'Sikkim, India' },
  { code: 28, label: 'Tamil Nadu, India' }, { code: 29, label: 'Telangana, India' }, { code: 30, label: 'Tripura, India' },
  { code: 31, label: 'Uttar Pradesh, India' }, { code: 32, label: 'Uttarakhand, India' }, { code: 33, label: 'West Bengal, India' },
  { code: 34, label: 'Dadra and Nagar Haveli and Daman and Diu, India' }, { code: 35, label: 'Dhaka, Bangladesh' },
];

export const REGISTRATION_LOCATION_OPTIONS: CodedOption[] = [
  { code: 1, label: 'Delhi' }, { code: 2, label: 'Haryana' }, { code: 3, label: 'Uttar Pradesh' }, { code: 4, label: 'Madhya Pradesh' },
  { code: 5, label: 'Bihar' }, { code: 6, label: 'Kerala' }, { code: 7, label: 'Gujarat' }, { code: 8, label: 'Kolkata' },
  { code: 9, label: 'Punjab' }, { code: 10, label: 'Andhra Pradesh' }, { code: 11, label: 'Nagpur (MH)' }, { code: 12, label: 'Himachal Pradesh' },
  { code: 13, label: 'Jharkhand' },
];

export const WEEKLY_OFF_OPTIONS: CodedOption[] = [
  { code: 1, label: 'All Sundays' },
  { code: 2, label: 'Sunday + 4th Saturday' },
  { code: 3, label: 'Sunday + 2nd & 4th Saturday' },
  { code: 4, label: '2nd & 4th Sunday' },
  { code: 5, label: 'All Saturdays & Sundays' },
  { code: 6, label: 'No Weekly Off' },
];

export const GRACE_MINUTES_OPTIONS: CodedOption[] = [
  { code: 15, label: '15 minutes' },
  { code: 30, label: '30 minutes' },
  { code: 45, label: '45 minutes' },
  { code: 60, label: '1 hour' },
];

export const MASTER_OPTION_GROUPS = {
  working_site:          WORKING_SITE_OPTIONS,
  working_city:          WORKING_CITY_OPTIONS,
  working_state_country: WORKING_STATE_COUNTRY_OPTIONS,
  pay_register_location: REGISTRATION_LOCATION_OPTIONS,
  weekly_off:            WEEKLY_OFF_OPTIONS,
  grace_minutes:         GRACE_MINUTES_OPTIONS,
} as const;

export type MasterOptionGroup = keyof typeof MASTER_OPTION_GROUPS;

/**
 * Resolve a spreadsheet cell (label string OR raw numeric code) to its code.
 * Returns undefined if the value is blank; returns null if it was provided but
 * doesn't match any option (caller turns that into a row error).
 */
export function resolveMasterOption(group: MasterOptionGroup, value: unknown): number | null | undefined {
  if (value === null || value === undefined || String(value).trim() === '') return undefined;
  const raw = String(value).trim();
  const list = MASTER_OPTION_GROUPS[group];

  const asNum = Number(raw);
  if (Number.isFinite(asNum) && list.some(o => o.code === asNum)) return asNum;

  const hit = list.find(o => o.label.toLowerCase() === raw.toLowerCase());
  return hit ? hit.code : null;
}
