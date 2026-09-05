/**
 * seedEmpLookups.ts
 *
 * One-time import of the legacy "employee master format.xlsx" lookup catalog
 * (data/emp-lookups.json, exported from the working sheet) into this
 * project's master-data tables.
 *
 * Run with:  npx ts-node -r tsconfig-paths/register src/database/seeders/seedEmpLookups.ts
 *
 * Idempotent — every table it touches has a DB-level unique constraint on the
 * column(s) this script writes (see the 2026-09-05 unique-index cleanup), so
 * re-running finds existing rows, counts them as skipped duplicates, and adds
 * nothing new. The one exception is `designations`, which has no DB-level
 * unique constraint on `name` (pre-existing, unrelated to this script) — this
 * script pre-filters those against existing names itself, case-insensitively.
 *
 * Existing app data and behavior are untouched: this only INSERTs rows into
 * currently-empty (or partially-empty) tables, and enriches the one existing
 * company row (id 1) by filling fields that are currently blank — no existing
 * value is ever overwritten, no row is ever deleted or renamed.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Model, ModelStatic, Op } from 'sequelize';
import { sequelize } from '../../config/database';
import '../models/Associations';

import { Gender } from '../models/gender.model';
import { BloodGroup } from '../models/bloodGroup';
import { MaritalStatus } from '../models/marital-status';
import { Religion } from '../models/religion.model';
import { InsuredAmount } from '../models/insuredAmount.model';
import { Bond } from '../models/bond.model';
import { ProbationPeriod } from '../models/probationPeriod.model';
import { Salutation } from '../models/salutation.model';
import { HouseType } from '../models/house-type.model';
import { ShirtSize } from '../models/shirt-size.model';
import { EducationMode } from '../models/education-mode.model';
import { NoticePeriod } from '../models/noticePeriod.model';
import { ProbationStatus } from '../models/probationStatus.model';
import { Nationality } from '../models/nationality.model';
import { ModeOfPayment } from '../models/mode-of-payment.model';
import { Bank } from '../models/bank.model';
import { Qualification } from '../models/qualification.model';
import { EmergencyRelationship } from '../models/emergency-relationship.model';
import { EmployeeStatus } from '../models/employeeStatus.model';
import { EmployeeType } from '../models/EmployeeType';
import { ExitStatus } from '../models/exitStatus.model';
import { Country, State, City, Site, PayRegister } from '../models/Location';
import { AttendanceType, GraceMinute, SaturdayRule } from '../models/AttendanceRules';
import { Department } from '../models/Department';
import { Designation, SubDesignation } from '../models/Designation';
import { SubDepartment } from '../models/Subdepartment';
import { Company } from '../models/Company';
import { WeeklyOffPreset, WeekDay, NthRule } from '../models/weeklyOffPreset';
import { Shift } from '../models/Shift';

// ─── Load the source catalog ────────────────────────────────────────────────

const raw = fs.readFileSync(path.join(__dirname, 'data', 'emp-lookups.json'), 'utf-8');
const LOOKUPS: {
  catalogs: Record<string, string[]>;
  cityStateLinks: Record<string, string[]>;
  stateCountryLinks: Record<string, string[]>;
  weeklyOffDefinitions: Array<{ id: string; name: string; days: string[]; nthRules: Array<{ weekday: string; pattern: string }> }>;
  companyDefinitions: Array<Record<string, string>>;
  shiftDefinitions: Array<{ id: string; name: string; start: string; end: string; halfAt: string; daySpan: string }>;
} = JSON.parse(raw);

// ─── Small helpers ───────────────────────────────────────────────────────────

/** "Company Provided" -> "COMPANY_PROVIDED"; "PG / Hostel" -> "PG_HOSTEL" */
function toCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** "12 Months" -> "12"; "No" / "Not Applicable" -> null */
function extractNumber(name: string): string | null {
  const m = name.match(/\d+/);
  return m ? m[0] : null;
}

const ORDINAL_WORDS: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5 };
const FULL_TO_SHORT_DAY: Record<string, WeekDay> = {
  Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};

/** "2nd & 4th" -> [2, 4]; "1st, 2nd & 3rd" -> [1, 2, 3]; "All"/"All4" -> [1,2,3,4] */
function parseOrdinalPattern(pattern: string): number[] {
  if (/^all4?$/i.test(pattern.trim())) return [1, 2, 3, 4];
  const weeks = pattern
    .split(/,|&/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ORDINAL_WORDS[s])
    .filter((n): n is number => !!n);
  return [...new Set(weeks)].sort();
}

interface SeedResult {
  table: string;
  attempted: number;
  inserted: number;
  skippedDuplicate: number;
  failed: Array<{ value: string; error: string }>;
}

function newResult(table: string): SeedResult {
  return { table, attempted: 0, inserted: 0, skippedDuplicate: 0, failed: [] };
}

/** Generic seeder for the simple lookup tables (name[, code], display_order, is_active). */
async function seedSimpleLookup<T extends Model>(
  ModelClass: ModelStatic<T>,
  table: string,
  rows: Array<Record<string, unknown>>,
): Promise<SeedResult> {
  const result = newResult(table);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    result.attempted++;
    try {
      await ModelClass.create({ display_order: i, is_active: true, ...row } as any);
      result.inserted++;
    } catch (e: any) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        result.skippedDuplicate++;
      } else {
        result.failed.push({ value: JSON.stringify(row), error: e.message });
      }
    }
  }
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Seeds the legacy Excel master-data catalog. Safe to call repeatedly (every
 * table it writes has a DB-level unique constraint the seeder relies on to
 * detect and skip duplicates — see the file header) and safe to call from
 * within another process's already-authenticated Sequelize connection (this
 * only calls `sequelize.authenticate()` again, which is a cheap no-op ping).
 */
export async function seedEmpLookups(): Promise<void> {
  const results: SeedResult[] = [];
  const skippedTables: Array<{ table: string; reason: string }> = [];

  await sequelize.authenticate();
  const c = LOOKUPS.catalogs;

  // 1. Simple {name, code} master tables ------------------------------------
  results.push(await seedSimpleLookup(Gender, 'genders', [
    { name: 'Male', code: 'M' },
    { name: 'Female', code: 'F' },
  ]));

  results.push(await seedSimpleLookup(BloodGroup, 'blood_groups', c.bloodGroup.map((name) => ({
    // "AB+" -> "AB_POS" (leading letters, not just the first char — "A+" and
    // "AB+" must not collide on the same code).
    name, code: name === 'Not Available' ? 'NA' : `${name.match(/^[A-Z]+/)![0]}_${name.endsWith('+') ? 'POS' : 'NEG'}`,
  }))));

  results.push(await seedSimpleLookup(MaritalStatus, 'marital_statuses', c.maritalStatus.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(Religion, 'religions', c.religion.map((name) => ({ name, code: name === 'Not Available' ? 'NA' : toCode(name) }))));

  results.push(await seedSimpleLookup(InsuredAmount, 'insured_amounts', c.mediclaimAmount.map((name) => ({
    name, code: name === 'Not Applicable' ? 'NA' : name,
  }))));

  results.push(await seedSimpleLookup(Bond, 'bonds', c.commitmentTerm.map((name) => ({ name, code: extractNumber(name) }))));
  results.push(await seedSimpleLookup(ProbationPeriod, 'probation_periods', c.probationPeriod.map((name) => ({ name, code: extractNumber(name) }))));

  results.push(await seedSimpleLookup(Salutation, 'salutations', c.salutation.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(HouseType, 'house_types', c.houseType.map((name) => ({ name, code: toCode(name) }))));

  results.push(await seedSimpleLookup(ShirtSize, 'shirt_sizes', c.shirtSize.map((name) => ({
    name, code: (name.match(/^([^\s(]+)/) ?? [null, toCode(name)])[1],
  }))));

  results.push(await seedSimpleLookup(EducationMode, 'education_modes', c.educationMode.map((name) => ({ name, code: name === 'Not Applicable' ? 'NA' : toCode(name) }))));

  results.push(await seedSimpleLookup(NoticePeriod, 'notice_periods', c.noticePeriod.map((name) => ({
    name, code: name === 'No' ? '0' : extractNumber(name),
  }))));

  results.push(await seedSimpleLookup(ProbationStatus, 'probation_statuses', c.probationStatus.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(Nationality, 'nationalities', c.nationality.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(ModeOfPayment, 'modes_of_payment', c.modeOfPayment.map((name) => ({ name, code: toCode(name) }))));

  // Bank has NOT NULL+unique on both name and code; the catalog gives no
  // separate bank code, so code mirrors name (both are already unique here).
  results.push(await seedSimpleLookup(Bank, 'banks', c.bankName.map((name) => ({ name, code: name }))));

  results.push(await seedSimpleLookup(Qualification, 'qualifications', c.highestEducation.map((name) => ({ name, code: name === 'Not Applicable' ? 'NA' : toCode(name) }))));
  results.push(await seedSimpleLookup(EmergencyRelationship, 'emergency_relationships', c.relationship.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(EmployeeStatus, 'employee_statuses', c.status.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(EmployeeType, 'employee_types', c.employeeType.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(ExitStatus, 'exit_statuses', c.exitStatus.map((name) => ({ name, code: toCode(name) }))));

  // Attendance-rule tables (paranoid, name unique)
  results.push(await seedSimpleLookup(AttendanceType, 'attendance_types', c.attendanceType.map((name) => ({ name, code: toCode(name) }))));
  results.push(await seedSimpleLookup(GraceMinute, 'grace_minutes', c.graceMinutes.map((name) => ({
    name, minutes: name.includes('hour') ? parseInt(name, 10) * 60 : parseInt(name, 10),
  }))));
  results.push(await seedSimpleLookup(SaturdayRule, 'saturday_rules', c.saturdayOff.map((name) => ({ name }))));

  // 2. Countries -> States -> Cities (FK chain) ------------------------------
  const countryResult = await seedSimpleLookup(Country, 'countries', c.country.map((name) => ({
    name, code: name === 'India' ? 'IN' : name === 'Bangladesh' ? 'BD' : name === 'Nepal' ? 'NP' : null,
  })));
  results.push(countryResult);

  const countryIdByName = new Map<string, number>();
  for (const row of await Country.findAll({ attributes: ['id', 'name'] })) countryIdByName.set(row.name, row.id);

  // Neither State nor City has a DB-level unique constraint on `name` (only
  // non-unique indexes on country_id/state_id/is_active), so — unlike every
  // other table here — duplicates must be pre-filtered by this script rather
  // than left to a unique-constraint catch, or a re-run would insert twice.
  const stateResult = newResult('states');
  const stateIdByName = new Map<string, number>();
  for (const row of await State.findAll({ attributes: ['id', 'name'] })) stateIdByName.set(row.name, row.id);
  for (const name of c.state) {
    stateResult.attempted++;
    if (stateIdByName.has(name)) {
      stateResult.skippedDuplicate++;
      continue;
    }
    const countryName = LOOKUPS.stateCountryLinks[name]?.[0] ?? 'India';
    const countryId = countryIdByName.get(countryName);
    if (!countryId) {
      stateResult.failed.push({ value: name, error: `Unknown country "${countryName}"` });
      continue;
    }
    try {
      const row = await State.create({ name, country_id: countryId, is_active: true } as any);
      stateResult.inserted++;
      stateIdByName.set(name, row.id);
    } catch (e: any) {
      stateResult.failed.push({ value: name, error: e.message });
    }
  }
  results.push(stateResult);

  const cityResult = newResult('cities');
  const existingCityNames = new Set((await City.findAll({ attributes: ['name'] })).map((r) => r.name));
  for (const name of c.city) {
    cityResult.attempted++;
    if (existingCityNames.has(name)) {
      cityResult.skippedDuplicate++;
      continue;
    }
    const stateWithCountry = LOOKUPS.cityStateLinks[name]?.[0]; // e.g. "Delhi, India"
    const stateName = stateWithCountry?.split(',')[0]?.trim();
    const stateId = stateName ? stateIdByName.get(stateName) : undefined;
    if (!stateId) {
      cityResult.failed.push({ value: name, error: `Could not resolve state for city "${name}" (linked state "${stateName}")` });
      continue;
    }
    try {
      await City.create({ name, state_id: stateId, is_active: true } as any);
      cityResult.inserted++;
      existingCityNames.add(name);
    } catch (e: any) {
      cityResult.failed.push({ value: name, error: e.message });
    }
  }
  results.push(cityResult);

  // 2b. Sites & Pay Registers — dummy master data for the Employee wizard's
  //     Working Site / Pay Register Location dropdowns (previously hardcoded
  //     numeric-coded lists in employee.masterOptions.ts / employee.constants.ts).
  //     No unique constraint on `name`, so dedupe by pre-fetching existing rows.
  //     city_id/state_id are nullable ("all cities/states" scope) — best-effort
  //     matched from the label text; left null when nothing matches.
  const siteResult = newResult('sites');
  const existingSiteNames = new Set((await Site.findAll({ attributes: ['name'] })).map((s) => s.name));
  const cityRowsForMatch = await City.findAll({ attributes: ['id', 'name'] });
  for (const label of c.workingSite) {
    siteResult.attempted++;
    if (existingSiteNames.has(label)) {
      siteResult.skippedDuplicate++;
      continue;
    }
    const matchedCity = cityRowsForMatch.find((city) => label.toUpperCase().includes(city.name.toUpperCase()));
    try {
      await Site.create({ name: label, company_id: 1, city_id: matchedCity?.id ?? null, is_active: true } as any);
      siteResult.inserted++;
      existingSiteNames.add(label);
    } catch (e: any) {
      siteResult.failed.push({ value: label, error: e.message });
    }
  }
  results.push(siteResult);

  const payRegisterResult = newResult('pay_registers');
  const existingPayRegisterNames = new Set((await PayRegister.findAll({ attributes: ['name'] })).map((p) => p.name));
  const stateRowsForMatch = await State.findAll({ attributes: ['id', 'name'] });
  for (const label of c.payRegisterLocation) {
    payRegisterResult.attempted++;
    if (existingPayRegisterNames.has(label)) {
      payRegisterResult.skippedDuplicate++;
      continue;
    }
    const matchedState = stateRowsForMatch.find((state) => label.toUpperCase() === state.name.toUpperCase());
    try {
      await PayRegister.create({ name: label, company_id: 1, state_id: matchedState?.id ?? null, is_active: true } as any);
      payRegisterResult.inserted++;
      existingPayRegisterNames.add(label);
    } catch (e: any) {
      payRegisterResult.failed.push({ value: label, error: e.message });
    }
  }
  results.push(payRegisterResult);

  // 3. Departments (unique department_name — DB enforces dedupe) ------------
  const deptResult = newResult('departments');
  for (const name of c.department) {
    deptResult.attempted++;
    try {
      await Department.create({ department_name: name, is_active: true } as any);
      deptResult.inserted++;
    } catch (e: any) {
      if (e.name === 'SequelizeUniqueConstraintError') deptResult.skippedDuplicate++;
      else deptResult.failed.push({ value: name, error: e.message });
    }
  }
  results.push(deptResult);

  // 4. Designations — NO unique constraint on `name` at the DB level, so this
  //    script must dedupe case-insensitively itself against what's already there.
  const desigResult = newResult('designations');
  const existingDesigNames = new Set(
    (await Designation.findAll({ attributes: ['name'] })).map((d) => d.name.trim().toLowerCase()),
  );
  for (const name of c.designation) {
    desigResult.attempted++;
    const key = name.trim().toLowerCase();
    if (existingDesigNames.has(key)) {
      desigResult.skippedDuplicate++;
      continue;
    }
    try {
      // Store in the same Title Case convention as the existing 76 rows,
      // rather than the catalog's ALL CAPS, so lists render consistently.
      const titleCase = name.replace(/\w\S*/g, (w) => w[0] + w.slice(1).toLowerCase());
      await Designation.create({ name: titleCase, is_active: true } as any);
      desigResult.inserted++;
      existingDesigNames.add(key);
    } catch (e: any) {
      desigResult.failed.push({ value: name, error: e.message });
    }
  }
  results.push(desigResult);

  // 5. Sub-departments / sub-designations (global, name unique — neither
  //    table has a display_order column, so the generic helper's default is
  //    silently dropped by Sequelize as an unknown attribute).
  results.push(await seedSimpleLookup(SubDepartment, 'sub_departments', c.subDepartment.map((name) => ({ name }))));
  results.push(await seedSimpleLookup(SubDesignation, 'sub_designations', c.subDesignation.map((name) => ({ name }))));

  // 6. Weekly-off presets -----------------------------------------------------
  const wopResult = newResult('weekly_off_preset');
  for (const def of LOOKUPS.weeklyOffDefinitions) {
    wopResult.attempted++;
    const always_off: WeekDay[] = def.days.map((d) => FULL_TO_SHORT_DAY[d]).filter(Boolean);
    const nth_off_rules: NthRule[] = def.nthRules.map((r) => ({
      weeks: parseOrdinalPattern(r.pattern),
      day: FULL_TO_SHORT_DAY[r.weekday],
    }));
    try {
      const existing = await WeeklyOffPreset.findOne({ where: { name: def.name } });
      if (existing) {
        wopResult.skippedDuplicate++;
        continue;
      }
      await WeeklyOffPreset.create({ name: def.name, always_off, nth_off_rules, is_active: true } as any);
      wopResult.inserted++;
    } catch (e: any) {
      wopResult.failed.push({ value: def.name, error: e.message });
    }
  }
  results.push(wopResult);

  // 7. Companies — enrich the existing row, insert the other 3 --------------
  const companyResult = newResult('companies');
  for (const def of LOOKUPS.companyDefinitions) {
    companyResult.attempted++;
    try {
      // Match by name OR slug/code — someone may have already created a
      // placeholder company row (e.g. via the admin UI) using the slug-style
      // id ("collarcheck") rather than the full display name before this
      // catalog ran; that's still "this company", so enrich it instead of
      // colliding on the slug/code unique constraint trying to insert a
      // second row for it.
      const existing = await Company.findOne({
        where: { [Op.or]: [{ name: def.name }, { slug: def.id }, { code: def.code }] },
      });
      const fields: Record<string, unknown> = {
        legal_name: def.legalName || null,
        code: def.code || null,
        address: def.address || null,
        google_maps_link: def.googleMapUrl || null,
        about: def.about || null,
        since_year: def.since ? parseInt(def.since, 10) : null,
        logo_url: def.logo || null,
        gstin: def.gstNumber || null,
        pan: def.panNumber || null,
        cin: def.cin || null,
        email: def.email || null,
        phone: def.phone || null,
        website: def.website || null,
        hr_email: def.hrEmail || null,
        is_active: def.status !== 'Inactive',
      };
      if (existing) {
        // Enrich only currently-empty fields — never overwrite a value that's
        // already set, so nothing this app already depends on changes.
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(fields)) {
          const current = (existing as any)[k];
          if ((current === null || current === '' || current === undefined) && v !== null) patch[k] = v;
        }
        if (Object.keys(patch).length > 0) {
          await existing.update(patch);
          companyResult.inserted++; // counted as "populated" (enriched), not a fresh row
        } else {
          companyResult.skippedDuplicate++;
        }
      } else {
        await Company.create({ name: def.name, slug: def.id, ...fields } as any);
        companyResult.inserted++;
      }
    } catch (e: any) {
      companyResult.failed.push({ value: def.name, error: e.message });
    }
  }
  results.push(companyResult);

  // 8. Shifts — `Shift.label` has no DB-level unique constraint, so (like
  //    states/cities) dedupe by pre-fetching existing labels rather than
  //    relying on a unique-constraint catch.
  const shiftResult = newResult('shift');
  const existingShiftLabels = new Set((await Shift.findAll({ attributes: ['label'] })).map((s) => s.label));
  for (const def of LOOKUPS.shiftDefinitions) {
    shiftResult.attempted++;
    if (existingShiftLabels.has(def.name)) {
      shiftResult.skippedDuplicate++;
      continue;
    }
    try {
      await Shift.create({
        label: def.name,
        start_time: def.start || null,
        end_time: def.end || null,
        half_day_time: def.halfAt || null,
        day_span: def.daySpan === '2 day' ? '2 days' : '1 day',
      } as any);
      shiftResult.inserted++;
      existingShiftLabels.add(def.name);
    } catch (e: any) {
      shiftResult.failed.push({ value: def.name, error: e.message });
    }
  }
  results.push(shiftResult);

  // ─── Tables intentionally NOT seeded, and why ────────────────────────────
  skippedTables.push(
    { table: 'applicability_statuses (yesNo/yesNoNa)', reason: 'Table does not exist yet — it is part of the master-data refactor plan\'s Phase 0, which has not been executed.' },
    { table: 'designation_departments / company_departments / sub_department/sub_designation links', reason: 'Pivot tables — the catalog\'s link maps (desigDeptLinks, deptCompanyLinks, subDeptLinks, subDesigLinks) are all empty, so there is no reliable mapping to populate them from.' },
    { table: 'perm_address_type / address_type (addressType)', reason: 'Kept as free-text/ENUM by design (master-data plan) — no master table exists for this field.' },
    { table: 'vaccineType, attendanceDesignation', reason: 'No corresponding master table exists in this schema.' },
    { table: 'pfStatus/esiStatus/mediclaimStatus/rdScheme/commitment/probation/confirmation/experienced/docStatus', reason: 'These are boolean/ENUM fields on employee_schemes, not master-data tables, by current design.' },
    { table: 'workingShift/shiftStart/shiftEnd/halfShift/shiftDay', reason: 'Redundant with the already-seeded `shift` table.' },
    { table: 'workingCity/workingStateCountry (duplicates of city/state)', reason: 'Same values already seeded via the `city`/`state` catalogs into cities/states.' },
  );

  // ─── Report ──────────────────────────────────────────────────────────────
  console.log('\n================ SEED REPORT ================');
  for (const r of results) {
    const status = r.failed.length > 0 ? 'PARTIAL' : r.inserted > 0 ? 'OK' : 'NO-OP (all already present)';
    console.log(
      `${r.table.padEnd(28)} ${status.padEnd(28)} inserted=${r.inserted} skipped_dup=${r.skippedDuplicate} failed=${r.failed.length}/${r.attempted}`,
    );
    if (r.failed.length > 0) {
      for (const f of r.failed.slice(0, 5)) console.log(`    FAIL "${f.value}": ${f.error}`);
      if (r.failed.length > 5) console.log(`    ... and ${r.failed.length - 5} more`);
    }
  }
  console.log('\n--- Skipped tables (not touched) ---');
  for (const s of skippedTables) console.log(`${s.table}: ${s.reason}`);
  console.log('===============================================\n');
}

// Standalone CLI usage only — when imported by seeder.ts (or anything else)
// the caller owns the connection lifecycle, so this must not close it out
// from under them.
if (require.main === module) {
  seedEmpLookups()
    .then(() => sequelize.close())
    .catch(async (e) => {
      console.error(e);
      await sequelize.close();
      process.exit(1);
    });
}
