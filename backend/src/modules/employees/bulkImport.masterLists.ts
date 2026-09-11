/**
 * bulkImport.masterLists.ts
 * Loads the option lists shown as dropdowns in the bulk-import template — the
 * SAME master rows the Employee wizard's own selects load, so a value picked
 * from the template is always a value the importer (bulkImport.mapper →
 * buildResolvers) can resolve.
 *
 * Nothing here is hardcoded: every list is a live read of the master table /
 * catalogue the wizard uses. Pure enums with no master table are served from
 * the shared `employee.constants.ts` arrays (see bulkImport.fields.ts →
 * `enumValues`), which is the same source the validators enforce.
 */

import { Department } from '../../database/models/Department';
import { Designation, SubDesignation } from '../../database/models/Designation';
import { Company } from '../../database/models/Company';
import { SubDepartment } from '../../database/models/Subdepartment';
import { Shift } from '../../database/models/Shift';
import { State, City, Site, PayRegister } from '../../database/models/Location';
import { WeeklyOffPreset } from '../../database/models/weeklyOffPreset';
import { GraceMinute } from '../../database/models/AttendanceRules';
import { Salutation } from '../../database/models/salutation.model';
import { Nationality } from '../../database/models/nationality.model';
import { Religion } from '../../database/models/religion.model';
import { ShirtSize } from '../../database/models/shirt-size.model';
import { Bank } from '../../database/models/bank.model';
import { Qualification } from '../../database/models/qualification.model';
import { EducationMode } from '../../database/models/education-mode.model';
import { EmergencyRelationship } from '../../database/models/emergency-relationship.model';

/** Distinct, order-preserving, blank-stripped. */
const clean = (xs: (string | null | undefined)[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const s = (x ?? '').toString().trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
};

/** A standard `{ name, display_order, is_active }` catalogue master → active names. */
async function catalogNames(model: any): Promise<string[]> {
  const rows = await model.findAll({
    attributes: ['name', 'display_order'],
    where: { is_active: true },
    order: [['display_order', 'ASC'], ['name', 'ASC']],
    raw: true,
  });
  return clean(rows.map((r: any) => r.name));
}

/**
 * All dropdown lists the template needs, keyed by the logical source name that
 * `bulkImport.fields.ts` → `COLUMN_OPTION_SOURCE` points a column at.
 *
 * Location lists carry the combined "<name>, <parent>" label (matching the
 * Master → Location list and the wizard dropdowns); the importer's `locMap`
 * accepts that label, the bare name, or the row id.
 */
export async function getMasterLists(): Promise<Record<string, string[]>> {
  const [
    depts, desigs, subDepts, subDesigs, comps, shifts, weeklyOffs, grace,
    sites, cities, states, payRegisters,
    salutations, nationalities, religions, shirtSizes, banks, qualifications, eduModes, relationships,
  ] = await Promise.all([
    Department.findAll({ attributes: ['department_name'], raw: true }),
    Designation.findAll({ attributes: ['name'], raw: true }),
    SubDepartment.findAll({ attributes: ['name'], raw: true }),
    SubDesignation.findAll({ attributes: ['name'], raw: true }),
    Company.findAll({ attributes: ['name'], order: [['name', 'ASC']], raw: true }),
    Shift.findAll({ attributes: ['label'], raw: true }),
    WeeklyOffPreset.findAll({ attributes: ['name'], raw: true }),
    GraceMinute.findAll({ attributes: ['name', 'minutes'], raw: true }),
    Site.findAll({ attributes: ['name'], include: [{ association: 'city', attributes: ['name'] }], raw: true, nest: true }),
    City.findAll({ attributes: ['name'], include: [{ association: 'state', attributes: ['name'] }], raw: true, nest: true }),
    State.findAll({ attributes: ['name'], include: [{ association: 'country', attributes: ['name'] }], raw: true, nest: true }),
    PayRegister.findAll({ attributes: ['name'], include: [{ association: 'state', attributes: ['name'] }], raw: true, nest: true }),
    catalogNames(Salutation),
    catalogNames(Nationality),
    catalogNames(Religion),
    catalogNames(ShirtSize),
    catalogNames(Bank),
    catalogNames(Qualification),
    catalogNames(EducationMode),
    catalogNames(EmergencyRelationship),
  ]);

  const withParent = (rows: any[], parentKey: string): string[] =>
    clean(rows.map((r: any) => {
      const parent = r?.[parentKey]?.name;
      return parent ? `${r.name}, ${parent}` : r.name;
    }));

  return {
    company:        clean(comps.map((c: any) => c.name)),
    department:     clean(depts.map((d: any) => d.department_name)),
    designation:    clean(desigs.map((d: any) => d.name)),
    sub_department: clean(subDepts.map((d: any) => d.name)),
    sub_designation:clean(subDesigs.map((d: any) => d.name)),
    shift:          clean(shifts.map((s: any) => s.label)),
    weekly_off:     clean(weeklyOffs.map((w: any) => w.name)),
    grace_minutes:  clean(grace.map((g: any) => g.name)),
    state:          withParent(states, 'country'),
    city:           withParent(cities, 'state'),
    site:           withParent(sites, 'city'),
    pay_register:   withParent(payRegisters, 'state'),

    salutation:     salutations,
    nationality:    nationalities,
    religion:       religions,
    shirt_size:     shirtSizes,
    bank:           banks,
    qualification:  qualifications,
    education_mode: eduModes,
    relationship:   relationships,
  };
}
