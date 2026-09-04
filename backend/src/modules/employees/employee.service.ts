import { sequelize } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';
import { employeeRepository as repo } from './employee.repo';
import {
  generateEmployeeCode,
  computeSalary, computeWorkingDuration, computeCommitmentEndDate,
  computeProbationEndDate, computeRdMaturity, computeAssetDeduction,
  computeCompletionPct, parseDdMmYyyy,
} from './employee.helper';
import { FieldPermissionV2, DynamicField } from '../../database/models/FormBuilder';
import { UserGroup } from '../../database/models/PermissionGroups';
import type {
  EmployeeQueryParams, RoleIdentityDto, LocationAttendanceDto, ManagersWorkContactDto,
  CommitmentProbationDto, SchemesDto, PersonalDto, AddressDto,
  FamilyDto, FamilyMemberDto, EmergencyContactDto, StatutoryDto, BankDto,
  VaccinationDto, DocumentDto, ExperienceEducationDto, SalaryDto, OnboardingDocsDto,
  FieldPermissionMap, BulkUploadRow, BulkUploadResult,
} from './employee.types';
import type { StepKey } from './employee.constants';
import { WIZARD_STEPS } from './employee.constants';
import { SENSITIVE_FIELDS } from './employee.constants';
import { Transaction } from 'sequelize';
import { normalizePhone } from '../../utils/normalizeNumber';
import { getEmployeeFieldOverrides } from '../permission-groups/permissionGroupOverrides';
import { Company } from '../../database/models/Company';
import { Department } from '../../database/models/Department';
import { Designation } from '../../database/models/Designation';
import { FormBuilderService } from '../form-builder/formBuilder.service';
import { EmployeeLocationAttendance, EmployeeCommitmentProbation } from '../../database/models/Employee';

const fbSvc = new FormBuilderService();

/** Drop PK / audit columns from a child-row JSON so it can be merged as a step payload. */
function stripRowMeta<T extends Record<string, any>>(row: T): Partial<T> {
  const { employee_id, id, created_at, updated_at, createdAt, updatedAt, ...rest } = row as any;
  return rest;
}

// ─── Field permission cache ───────────────────────────────────────────────────
const fpCache = new Map<string, { data: FieldPermissionMap; ts: number }>();
const FP_TTL = 0 * 60 * 1000;

async function loadFieldPerms(groupIds: number[], companyId: number): Promise<FieldPermissionMap> {
  if (!groupIds.length) return {};

  const cacheKey = `${companyId}:${[...groupIds].sort((a, b) => a - b).join(',')}`;
  const cached = fpCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FP_TTL) return cached.data;

  const perms = await FieldPermissionV2.findAll({
    where: { company_id: companyId, group_id: groupIds },
    include: [{ model: DynamicField, as: 'field', attributes: ['field_key'] }],
  });

  const map: FieldPermissionMap = {};
  const byFieldKey = new Map<string, typeof perms>();
  for (const p of perms) {
    const key = (p as any).field?.field_key;
    if (!key) continue;
    if (!byFieldKey.has(key)) byFieldKey.set(key, []);
    byFieldKey.get(key)!.push(p);
  }

  for (const [fieldKey, rows] of byFieldKey) {
    const can_view     = rows.some(r => r.can_view);
    const can_edit     = rows.some(r => r.can_edit);
    const can_copy     = rows.some(r => r.can_copy);
    const can_download = rows.some(r => r.can_download);
    const viewGranting = rows.filter(r => r.can_view);
    const is_masked     = viewGranting.length > 0 ? viewGranting.every(r => r.is_masked) : false;
    map[fieldKey] = { can_view, can_edit, can_copy, can_download, is_masked };
  }

  fpCache.set(cacheKey, { data: map, ts: Date.now() });
  return map;
}

// is_super_admin bypasses masking entirely
function applyMasking<T extends Record<string, unknown>>(
  data: T,
  perms: FieldPermissionMap,
  isSuperAdmin: boolean,
): Partial<T> {
  if (isSuperAdmin || !Object.keys(perms).length) return data;
  const result = { ...data };
  for (const [field, p] of Object.entries(perms)) {
    if (!(field in result)) continue;
    if (!p.can_view) { delete result[field as keyof T]; continue; }
    if (p.is_masked) {
      const v = result[field as keyof T];
      if (typeof v === 'string' && v.length > 4) (result as any)[field] = '•'.repeat(v.length - 4) + v.slice(-4);
      else if (typeof v === 'string') (result as any)[field] = '••••';
    }
  }
  return result;
}

// ─── Flatten the 2 remaining split-out step tables back onto the top level ───
// Employee is the root table again (Role Identity merged back in — that data
// is used by nearly every query in the system, unlike the genuinely-optional
// step tables). EmployeeLocationAttendance (Step 2) and
// EmployeeManagersWorkContact (Step 3) remain separate child tables and still
// need flattening for API/frontend consistency.
export function flattenEmployee(json: any): any {
  if (!json) return json;
  const { locationAttendance, managersWorkContact, ...rest } = json;
  return {
    ...rest,
    ...(locationAttendance || {}),
    ...(managersWorkContact || {}),
    l1Manager: managersWorkContact?.l1Manager ?? null,
    l2Manager: managersWorkContact?.l2Manager ?? null,
    company: rest.company ?? null,
    department: rest.department ?? null,
    designation: rest.designation ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export class EmployeeService {

  async getAll(params: EmployeeQueryParams, companyId: number, isSuperAdmin: boolean) {
    const result = await repo.findAll(params, companyId);
    const perms  = isSuperAdmin ? {} : '';
    return {
      ...result,
      rows: result.rows.map(e => applyMasking(flattenEmployee(e.toJSON()), perms as any, isSuperAdmin)),
    };
  }

  // `canSeeSensitive` — super admin, or anyone who can edit employees (if you
  // can edit salary / KYC / bank you can view it). Controls both which child
  // rows are loaded and whether masking is bypassed.
  async getById(id: number, companyId: number, canSeeSensitive: boolean) {
    const emp = await repo.findById(id, companyId, canSeeSensitive);
    if (!emp) throw new AppError('Employee not found', 404);

    const perms = canSeeSensitive ? {} : '';
    const raw   = emp.toJSON() as any;
    const json  = flattenEmployee(raw);
    if (json.statutory)   json.statutory   = applyMasking(json.statutory,  perms as any, canSeeSensitive);
    if (json.salaries)    json.salaries     = json.salaries.map((s: any) => applyMasking(s, perms as any, canSeeSensitive));
    if (json.bankDetails) json.bankDetails  = json.bankDetails.map((b: any) => applyMasking(b, perms as any, canSeeSensitive));

    // Completion — recompute from the record we just loaded so the detail view
    // and the Edit wizard always show the true, current percentage (never a
    // stale or seeded form_completion_pct). Only safe when the sensitive child
    // rows are actually loaded — otherwise ids_bank / compensation would read
    // as incomplete. Self-heal the stored column when it has drifted.
    if (canSeeSensitive) {
      const breakdown = computeCompletionPct(raw);
      json.form_completion_pct = breakdown.overallPct;
      json.completion = breakdown;
      if ((emp.get('form_completion_pct') ?? 0) !== breakdown.overallPct) {
        try { await repo.updateCompletionPctSilent(id, breakdown.overallPct); } catch { /* non-fatal on a read */ }
      }
    }
    return json;
  }

  async create(dto: RoleIdentityDto, actorId: number, ipAddress?: string) {
    if (dto.email) {
      const dupEmail = await repo.findByEmail(dto.email);
      if (dupEmail) throw new AppError(
        `Email "${dto.email}" is already registered to ${(dupEmail as any).first_name} ${(dupEmail as any).last_name} (${(dupEmail as any).employee_code ?? 'code pending'}) — employee_code and email are globally unique across all companies`,
        409,
      );
    }

    if (dto.phone) {
      const dupMobile = await repo.findByMobile(dto.phone);
      if (dupMobile) throw new AppError(
        `Phone "${dto.phone}" is already registered to ${(dupMobile as any).first_name} ${(dupMobile as any).last_name} (${(dupMobile as any).employee_code ?? 'code pending'}) — employee_code and phone are globally unique across all companies`,
        409,
      );
    }

    return sequelize.transaction(async (t) => {
      const emp = await repo.create({
        company_id:      dto.company_id,
        employee_code:   null,   // generated automatically once HR + Candidate parts both reach 100%
        status:          dto.status || 'Active',
        record_status:   'Draft',   // flips to 'Final' at 100% completion, same trigger as employee_code generation
        first_name:      dto.first_name.trim(),
        middle_name:     dto.middle_name?.trim() || null,
        last_name:       dto.last_name.trim(),
        employment_type: dto.employment_type || 'Permanent',
        department_id:   dto.department_id,
        sub_department_id: dto.sub_department_id || null,
        designation_id:  dto.designation_id,
        sub_designation_id: dto.sub_designation_id || null,
        email:  dto.email.toLowerCase().trim(),
        phone:  normalizePhone(dto.phone),
        portal_access:   true,        // enabled on creation — employee can log in immediately
        is_super_admin:  false,
        otp_attempts:    0,
        must_change_password: false,
        form_completion_pct: 0,       // recalculated on the first step save
        created_by:      actorId,
      }, t);

      await logActivity({ companyId: dto.company_id, employeeId: actorId, action: 'EMPLOYEE_CREATED', module: 'employees', entityId: emp.id, newValues: { name: `${dto.first_name} ${dto.last_name}` }, ipAddress });
      return repo.findById(emp.id, dto.company_id, false);
    });
  }

  async updateStep(id: number, companyId: number, step: StepKey, dto: any, actorId: number, ipAddress?: string) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);

    return sequelize.transaction(async (t) => {
      await this.routeStep(id, companyId, step, dto, actorId, t);

      // pass `t` so completion is computed against THIS step's just-written rows
      // (without it, form_completion_pct always lagged one step behind and the
      // employee_code only caught up on the final submit)
      const fresh = await repo.findById(id, companyId, true, t);

      // raw JSON (child rows stay nested) — computeCompletionPct reads assocs directly
      const breakdown = computeCompletionPct(fresh?.toJSON() ?? {});
      await repo.updateCompletionPct(id, breakdown.overallPct, t);

      if (breakdown.overallPct === 100 && !fresh?.employee_code) {
        const newCode = await generateEmployeeCode(companyId);
        await repo.update(id, companyId, { employee_code: newCode, record_status: 'Final' }, t);
        await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_CODE_GENERATED', module: 'employees', entityId: id, newValues: { employee_code: newCode }, ipAddress });
      }

      await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_STEP_SAVED', module: 'employees', entityId: id, newValues: { step, hrPct: breakdown.hrPct, candidatePct: breakdown.candidatePct }, ipAddress });
      const out = flattenEmployee((await repo.findById(id, companyId, false))?.toJSON());
      // Return the authoritative completion (computed above with full data) so
      // the Edit wizard's progress bar stays in lock-step with the list.
      return { ...out, form_completion_pct: breakdown.overallPct, completion: breakdown };
    });
  }

  private async routeStep(id: number, companyId: number, step: StepKey, dto: any, actorId: number, t: Transaction) {
    switch (step) {

      case 'role_identity': {
        const d = dto as RoleIdentityDto;
        await repo.update(id, companyId, {
          first_name:     d.first_name?.trim(),
          middle_name:    d.middle_name?.trim() || null,
          last_name:      d.last_name?.trim(),
          status:         d.status,
          employment_type: d.employment_type,
          department_id:  d.department_id,
          sub_department_id: d.sub_department_id || null,
          designation_id: d.designation_id,
          sub_designation_id: d.sub_designation_id || null,
          updated_by:     actorId,
        }, t);
        break;
      }

      case 'location_attendance': {
        const d = dto as LocationAttendanceDto;
        const locData: any = {
          working_state_country: d.working_state_country != null ? Number(d.working_state_country) : null,
          working_city:           d.working_city != null ? Number(d.working_city) : null,
          working_site:            d.working_site != null ? Number(d.working_site) : null,
          pay_register_location:   d.pay_register_location != null ? Number(d.pay_register_location) : null,
          actual_doj:              d.actual_doj ? parseDdMmYyyy(d.actual_doj) : null,
          weekly_off:              d.weekly_off ?? null,
          // shift_category is NOT NULL in the DB but carries no `*` in the UI —
          // default it (fixed shift ⇒ 'Shift', otherwise 'Duration') so leaving
          // it blank never blocks the step save.
          shift_category:          (d as any).shift_category || (d.shift_id ? 'Shift' : 'Duration'),
          shift_id:                d.shift_id || null,
          grace_minutes:           d.grace_minutes ?? null,
        };
        // Only write current_doj when a real value is supplied (bulk import
        // "Current Joining Date"). The wizard has no input for it and always
        // sends null — omitting the key from the upsert then preserves any
        // value a transfer / bulk import already set.
        if (d.current_doj) locData.current_doj = parseDdMmYyyy(d.current_doj);
        await repo.upsertLocationAttendance(id, locData, t);
        break;
      }

      case 'managers_work_contact': {
        const d = dto as ManagersWorkContactDto;
        const l1Id = d.l1_manager_id ? Number(d.l1_manager_id) : null;
        const l2Id = d.l2_manager_id ? Number(d.l2_manager_id) : null;

        if (l1Id) {
          const mgr = await repo.findManagerById(l1Id, companyId);
          if (!mgr) throw new AppError('L1 Manager not found in this company', 404);
          if (mgr.id === id) throw new AppError('Employee cannot be their own manager', 400);
        }

        await repo.upsertManagersWorkContact(id, {
          l1_manager_id:   l1Id,
          l2_manager_id:   l2Id,
          official_email:  d.official_email?.toLowerCase().trim() || null,
          official_mobile: d.official_mobile ? normalizePhone(d.official_mobile) : null,
        }, t);
        break;
      }

      case 'commitment_probation': {
        const d = dto as CommitmentProbationDto;
        // pass `t` so this read sees rows written earlier in the same
        // transaction (matters for bulk import, where actual_doj was just set
        // one step earlier; harmless for the wizard where it's already committed)
        const emp = flattenEmployee((await repo.findById(id, companyId, false, t))?.toJSON());

        // An explicit commitment_end_date (bulk import) wins; otherwise it's
        // auto-computed from the term + entered-on date, as before.
        const commitEndDate = d.commitment_end_date
          ? parseDdMmYyyy(d.commitment_end_date)
          : (d.commitment && d.commitment_term && d.commitment_entered_on)
            ? computeCommitmentEndDate(d.commitment_entered_on, d.commitment_term)
            : null;

        const probationEndDate = (d.on_probation && d.probation_period && emp?.actual_doj)
          ? computeProbationEndDate(String(emp.actual_doj), d.probation_period)
          : null;

        await repo.upsertCommitmentProbation(id, {
          commitment:               d.commitment,
          commitment_term:          d.commitment_term || null,
          commitment_entered_on:    d.commitment_entered_on ? parseDdMmYyyy(d.commitment_entered_on) : null,
          commitment_end_date:      commitEndDate,
          on_probation:             d.on_probation,
          probation_period:         d.probation_period || null,
          probation_end_date:       probationEndDate,
          // User-selected outcome (Confirmed / Failed / Not Applicable) — the
          // lifecycle "still on probation vs. done" is derivable from
          // probation_end_date and is not stored here.
          probation_status:         d.probation_status || null,
        }, t);
        break;
      }

      case 'statutory_schemes': {
        const d = dto as SchemesDto;
        let rdMaturityDate = null, rdMaturityAmount = 0;
        if (d.rd_scheme && d.rd_opening_date && d.rd_term) {
          const m = computeRdMaturity(d.rd_opening_date, d.rd_term, d.rd_amount_employee || 0, d.rd_amount_employer || 0);
          rdMaturityDate = m.maturityDate;
          rdMaturityAmount = m.maturityAmount;
        }
        await repo.upsertSchemes(id, {
          ...d,
          rd_maturity_date:   rdMaturityDate,
          rd_maturity_amount: rdMaturityAmount,
          rd_status: d.rd_scheme ? 'Yes' : 'Not Applicable',
        }, t);
        break;
      }

      case 'personal_profile': {
        await repo.upsertPersonal(id, dto as PersonalDto, t);
        break;
      }

      case 'address': {
        const d = dto as AddressDto;
        await repo.upsertAddress(id, 'present', {
          house_type: d.present_house_type, house_no: d.present_house_no,
          area: d.present_area || null, district: d.present_district,
          city: d.present_city, state: d.present_state,
          country: d.present_country, pincode: d.present_pincode,
          perm_address_type: d.perm_address_type || null,
        }, t);
        await repo.upsertAddress(id, 'permanent', {
          perm_address_type: d.perm_address_type || null,
          house_type: d.perm_house_type || null, house_no: d.perm_house_no || null,
          area: d.perm_area || null, district: d.perm_district || null,
          city: d.perm_city || null, state: d.perm_state || null,
          country: d.perm_country || null, pincode: d.perm_pincode || null,
        }, t);
        break;
      }

      case 'family_emergency': {
        const d = dto as FamilyDto & { family_members?: FamilyMemberDto[]; emergency_contacts?: EmergencyContactDto[] };

        const personalFields: any = {};
        if (d.marital_status !== undefined) personalFields.marital_status = d.marital_status;
        if ((d as any).marriage_date !== undefined) personalFields.marriage_date = (d as any).marriage_date || null;
        if ((d as any).spouse_name !== undefined) personalFields.spouse_name = (d as any).spouse_name || null;
        if ((d as any).spouse_dob !== undefined) personalFields.spouse_dob = (d as any).spouse_dob || null;
        for (const n of [1, 2, 3]) {
          if ((d as any)[`child${n}_name`] !== undefined) personalFields[`child${n}_name`] = (d as any)[`child${n}_name`] || null;
          if ((d as any)[`child${n}_gender`] !== undefined) personalFields[`child${n}_gender`] = (d as any)[`child${n}_gender`] || null;
          if ((d as any)[`child${n}_dob`] !== undefined) personalFields[`child${n}_dob`] = (d as any)[`child${n}_dob`] || null;
        }
        if (Object.keys(personalFields).length) await repo.upsertPersonal(id, personalFields, t);

        await repo.upsertFamily(id, {
          father_salutation: d.father_salutation, father_name: d.father_name,
          father_dob: d.father_dob || null, father_occupation: d.father_occupation || null,
          mother_salutation: d.mother_salutation, mother_name: d.mother_name,
          mother_dob: d.mother_dob || null, mother_occupation: d.mother_occupation || null,
        } as any, t);

        if (d.family_members) {
          // ignore fully-blank rows (the UI can submit a placeholder row)
          const members = d.family_members.filter((m: any) => m && String(m.name ?? '').trim());
          await repo.replaceFamilyMembers(id, members.map((m: any) => ({
            name: String(m.name).trim(),
            relationship: m.relationship || null,
            relationship_other: m.relationship_other || null,
            salutation: m.salutation || null,
            dob: m.dob || null,
            occupation: m.occupation || null,
          })), t);
        }
        if (d.emergency_contacts) {
          // keep only rows with both a name and a number (model requires both);
          // fully-blank / half-filled placeholder rows are dropped
          const contacts = d.emergency_contacts.filter((c: any) =>
            c && String(c.contact_name ?? '').trim() && String(c.contact_number ?? '').trim());
          await repo.replaceEmergencyContacts(id, contacts.map((c: any) => ({
            contact_name: String(c.contact_name).trim(),
            contact_number: String(c.contact_number).trim(),
            email: c.email || null,
            relationship: c.relationship || 'Other',
            relationship_other: c.relationship_other || null,
          })), t);
        }
        break;
      }

      case 'ids_bank': {
        const d = dto as StatutoryDto & BankDto & { vaccinations?: VaccinationDto[]; documents?: DocumentDto[] };

        await repo.upsertStatutory(id, {
          aadhaar_number:  d.aadhaar_number,
          aadhaar_name:    d.aadhaar_name,
          aadhaar_dob:     d.aadhaar_dob ? parseDdMmYyyy(d.aadhaar_dob) : null,
          aadhaar_address: d.aadhaar_address,
          pan_number:              d.pan_number?.toUpperCase() || null,
          pan_full_name:           d.pan_full_name || null,
          pan_dob:                 d.pan_dob ? parseDdMmYyyy(d.pan_dob) : null,
          pan_parent_spouse_name:  d.pan_parent_spouse_name || null,
          passport_number:         d.passport_number || null,
          passport_full_name:      d.passport_full_name || null,
          passport_nationality:    d.passport_nationality || null,
          passport_issue_date:     d.passport_issue_date ? parseDdMmYyyy(d.passport_issue_date) : null,
          passport_expiry:         d.passport_expiry ? parseDdMmYyyy(d.passport_expiry) : null,
          passport_place_of_issue: d.passport_place_of_issue || null,
          driving_license_number:    d.driving_license_number || null,
          driving_license_name:      d.driving_license_name || null,
          driving_license_issue_date: d.driving_license_issue_date ? parseDdMmYyyy(d.driving_license_issue_date) : null,
          driving_license_expiry:    d.driving_license_expiry ? parseDdMmYyyy(d.driving_license_expiry) : null,
          driving_license_authority: d.driving_license_authority || null,
          yellow_fever:              d.yellow_fever ?? false,
          yellow_fever_date:         d.yellow_fever_date ? parseDdMmYyyy(d.yellow_fever_date) : null,
        }, t);

        await repo.upsertBank(id, 'personal', {
          bank_name:      d.personal_bank_name,
          account_number: d.personal_bank_account,
          ifsc_code:      d.personal_ifsc?.toUpperCase(),
          branch_name:    d.personal_bank_branch || null,
        }, t);

        if (d.vaccinations) {
          const vax = d.vaccinations.filter((v: any) => v && String(v.vaccine_name ?? '').trim());
          await repo.replaceVaccinations(id, vax, t);
        }
        if (d.documents) {
          const docs = d.documents.filter((x: any) => x && String(x.file_url ?? '').trim());
          await repo.replaceDocuments(id, docs, t);
        }
        break;
      }

      case 'experience_education': {
        const d = dto as ExperienceEducationDto;
        await repo.setExperienceFlag(id, d.is_experienced, t);

        if (d.experience) {
          const exp = d.experience.filter((e: any) => e && String(e.last_company_name ?? '').trim());
          await repo.replaceExperience(id, exp.map(e => ({
            last_company_name:       e.last_company_name || null,
            last_designation:        e.last_designation || null,
            last_working_day:        e.last_working_day ? parseDdMmYyyy(e.last_working_day) : null,
            exp_contact_name:        e.exp_contact_name || null,
            exp_contact_number:      e.exp_contact_number || null,
            exp_contact_designation: e.exp_contact_designation || null,
            last_inhand_salary:      e.last_inhand_salary || null,
          })), t);
        }

        if (d.education) {
          const edu = d.education.filter((e: any) => e && String(e.highest_education ?? '').trim());
          await repo.replaceEducation(id, edu.map(ed => ({
            highest_education:    ed.highest_education,
            education_stream:     ed.education_stream || null,
            education_mode:       ed.education_mode || null,
            institute_name:       ed.institute_name || null,
            education_marks:      ed.education_marks || null,
            education_start_year: ed.education_start_year || null,
            education_end_year:   ed.education_end_year || null,
            is_pursuing:          ed.is_pursuing ?? false,
          })), t);
        }
        break;
      }

      case 'compensation': {
        const d = dto as SalaryDto;
        const cur = computeSalary(d.current_basic, d.current_hra, d.current_allowance1, d.current_amdb);
        await repo.upsertSalary(id, 'current', { salary_mode: d.salary_mode, ...cur, effective_from: new Date() }, t);
        const joi = computeSalary(d.joining_basic, d.joining_hra, d.joining_allowance1, d.joining_amdb);
        await repo.upsertSalary(id, 'joining', { salary_mode: d.salary_mode, ...joi }, t);

        const deductionMonthsNum = d.deduction_months ? Number(d.deduction_months) : 0;
        const { monthlyDeduction, lastInstallment } = (d.asset_deduction_applicable && d.security_amount && deductionMonthsNum > 0)
          ? computeAssetDeduction(d.security_amount, String(deductionMonthsNum), d.monthly_deduction || undefined)
          : { monthlyDeduction: 0, lastInstallment: 0 };
        await repo.upsertAssetDeduction(id, {
          asset_deduction_applicable: d.asset_deduction_applicable,
          security_amount:   d.security_amount || null,
          deduction_months:  deductionMonthsNum || null,
          // deduction_from is the Salary/AMDB/N/A enum — see the type comment
          // on SalaryDto. NOT a date; do not parseDdMmYyyy() it.
          deduction_from:    d.deduction_from || null,
          monthly_deduction: monthlyDeduction || null,
          final_monthly_deduction: d.final_monthly_deduction || null,
          last_installment:  lastInstallment || null,
        }, t);
        break;
      }

      case 'hr_joining_checklist': {
        await repo.upsertOnboardingDocs(id, dto as OnboardingDocsDto, t);
        const docs = dto as OnboardingDocsDto;
        const allDone = docs.offer_letter && docs.address_verification && docs.service_agreement;
        if (allDone) {
          await repo.update(id, companyId, { portal_access: true }, t);
        }
        break;
      }

      case 'review': {
        if (dto.transfers) await repo.replaceTransfers(id, dto.transfers, t);
        if (dto.exit)      await repo.upsertExit(id, dto.exit, t);
        break;
      }

      default:
        throw new AppError(`Unknown step: ${step}`, 400);
    }
  }

  async setPortalAccess(id: number, companyId: number, enabled: boolean, actorId: number) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);
    await repo.updateAuthFields(id, {
      portal_access: enabled,
      ...(enabled ? {} : { otp_hash: null, otp_expires: null, otp_attempts: 0, otp_locked_until: null, refresh_token: null }),
    });
    await logActivity({ companyId, employeeId: actorId, action: enabled ? 'PORTAL_ENABLED' : 'PORTAL_DISABLED', module: 'employees', entityId: id });
  }

  async delete(id: number, companyId: number, actorId: number) {
    const emp = await repo.softDelete(id, companyId, actorId);
    if (!emp) throw new AppError('Employee not found', 404);
    await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_DELETED', module: 'employees', entityId: id });
  }

  /**
   * Inter-company transfer. Relieves the source employee and creates a fresh
   * employee record in the destination company under a new employee_code,
   * copying personal / KYC / bank / family / education / experience details.
   * A transfer-history row links the two.
   */
  async transferEmployee(
    sourceId: number,
    companyId: number,
    dto: {
      new_employee_code: string;
      new_company_id: number;
      transfer_date: string;
      new_department_id?: number | null;
      new_sub_department_id?: number | null;
      new_designation_id?: number | null;
      new_working_site?: number | null;
    },
    actorId: number,
    ipAddress?: string,
  ): Promise<{ newEmployeeId: number; newEmployeeCode: string }> {
    const src = await repo.findById(sourceId, companyId, true);
    if (!src) throw new AppError('Employee not found', 404);
    const s = src.toJSON() as any;

    if (s.status === 'Relieved') throw new AppError('This employee has already been relieved / transferred', 400);
    if (Number(dto.new_company_id) === Number(s.company_id)) {
      throw new AppError('Destination company must be different from the current company', 400);
    }

    const newCompany = await Company.findByPk(dto.new_company_id, { attributes: ['id', 'name'] });
    if (!newCompany) throw new AppError('Destination company not found', 404);

    const code = String(dto.new_employee_code).trim();
    if (!code) throw new AppError('New employee code is required', 400);
    if (await repo.findByCode(code)) throw new AppError(`Employee code "${code}" is already in use`, 409);

    const doj = parseDdMmYyyy(dto.transfer_date);

    const deptId  = dto.new_department_id  ?? s.department_id;
    const desigId = dto.new_designation_id ?? s.designation_id;
    const [srcCompany, srcDept, srcDesig, newDept, newDesig] = await Promise.all([
      s.company_id ? Company.findByPk(s.company_id, { attributes: ['name'] }) : null,
      s.department_id ? Department.findByPk(s.department_id, { attributes: ['department_name'] }) : null,
      s.designation_id ? Designation.findByPk(s.designation_id, { attributes: ['designation_name'] }) : null,
      deptId  ? Department.findByPk(deptId,  { attributes: ['department_name'] })  : null,
      desigId ? Designation.findByPk(desigId, { attributes: ['designation_name'] }) : null,
    ]);
    const nm = (x: any, k: string) => (x ? (x as any)[k] as string : null);

    return sequelize.transaction(async (t) => {
      const loc = s.locationAttendance ?? {};

      const newEmp = await repo.create({
        company_id:         newCompany.id,
        employee_code:      code,
        reference_code:     null,
        status:             'Active',
        record_status:      'Final',
        first_name:         s.first_name,
        middle_name:        s.middle_name ?? null,
        last_name:          s.last_name,
        employment_type:    s.employment_type,
        department_id:      deptId,
        sub_department_id:  dto.new_sub_department_id ?? s.sub_department_id ?? null,
        designation_id:     desigId,
        sub_designation_id: s.sub_designation_id ?? null,
        email:             s.email,
        phone:             s.phone,
        portal_access:     s.portal_access,
        is_super_admin:    false,
        otp_attempts:      0,
        must_change_password: false,
        form_completion_pct: s.form_completion_pct ?? 0,
        created_by:        actorId,
      } as any, t);

      // Copy personal / KYC / bank / family / education / experience
      await repo.cloneEmployeeChildren(sourceId, newEmp.id, t);

      // Location & Attendance — new joining date + optional new site, rest copied
      await repo.upsertLocationAttendance(newEmp.id, {
        actual_doj:            doj,
        working_site:          dto.new_working_site != null ? Number(dto.new_working_site) : (loc.working_site ?? null),
        working_city:          loc.working_city ?? null,
        working_state_country: loc.working_state_country ?? null,
        pay_register_location: loc.pay_register_location ?? null,
        weekly_off:            loc.weekly_off ?? null,
        shift_category:        loc.shift_category ?? 'Duration',
        shift_id:              loc.shift_id ?? null,
        grace_minutes:         loc.grace_minutes ?? null,
      }, t);

      // Transfer history on the NEW record
      await repo.replaceTransfers(newEmp.id, [{
        transferred_on:   doj,
        new_company:      newCompany.name,
        new_joining_date: doj,
        new_department:   nm(newDept, 'department_name'),
        new_job_title:    nm(newDesig, 'designation_name'),
        old_company:      nm(srcCompany, 'name'),
        exit_date:        doj,
        old_department:   nm(srcDept, 'department_name'),
        old_job_title:    nm(srcDesig, 'designation_name'),
        old_emp_code:     s.employee_code ?? null,
      }], t);

      // Close out the source employee
      await repo.update(sourceId, companyId, { status: 'Relieved', portal_access: false, updated_by: actorId }, t);
      await repo.upsertExit(sourceId, {
        last_working_day:      doj,
        exit_status:           'Transferred',
        exit_remarks:          `Transferred to ${newCompany.name} — new code ${code}`,
        exit_formalities_done: true,
      }, t);

      await logActivity({
        companyId, employeeId: actorId, action: 'EMPLOYEE_TRANSFERRED', module: 'employees',
        entityId: sourceId,
        newValues: { newEmployeeId: newEmp.id, newEmployeeCode: code, newCompany: newCompany.name },
        ipAddress,
      });

      return { newEmployeeId: newEmp.id, newEmployeeCode: code };
    });
  }

  async searchManagers(query: string, companyId: number, excludeId?: number) {
    const rows = await repo.searchManagers(query, companyId, excludeId);
    return rows.map(r => flattenEmployee(r.toJSON()));
  }

  async getManagerById(managerId: number, companyId: number) {
    const mgr = await repo.findManagerById(managerId, companyId);
    if (!mgr) throw new AppError('Manager not found', 404);
    return flattenEmployee(mgr.toJSON());
  }

  async saveDraft(data: { employeeId?: number | null; companyId: number; actorId: number; step: string; formData: any; sessionId: string }) {
    const { employeeId, companyId, actorId, step, formData, sessionId } = data;

    await repo.upsertDraft({ employeeId, createdBy: actorId, step, formData, sessionId });

    const firstName = String(formData.first_name || '').trim();
    const phone = String(formData.phone || '').trim();
    const email = String(formData.email || '').trim();

    if (!employeeId && (!firstName || !phone || !email)) {
      const missing: string[] = [];
      if (!firstName) missing.push('First Name');
      if (!phone) missing.push('Personal Mobile Number');
      if (!email) missing.push('Personal Email');
      // employees.email / employees.phone are NOT NULL — a brand-new draft
      // can't be persisted to the employees table until all three are
      // filled. The draft data is still saved to employee_drafts above
      // regardless, so nothing typed is lost — this row just isn't visible
      // in the Employee List yet. Told the caller *why*, not just that it
      // didn't happen, so this doesn't look like a silent failure.
      return { employeeId: null, persisted: false, reason: `Fill in ${missing.join(', ')} to save this as a draft employee` };
    }
    if (!firstName) {
      return { employeeId: employeeId ?? null, persisted: false };
    }

    return sequelize.transaction(async (t) => {
      let id = employeeId;

      const roleIdentityFields = {
        company_id: formData.company_id ? Number(formData.company_id) : companyId,
        first_name: firstName,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name?.trim() || '',
        employment_type: formData.employment_type || 'Permanent',
        department_id: formData.department_id ? Number(formData.department_id) : null,
        sub_department_id: formData.sub_department_id ? Number(formData.sub_department_id) : null,
        designation_id: formData.designation_id ? Number(formData.designation_id) : null,
        sub_designation_id: formData.sub_designation_id ? Number(formData.sub_designation_id) : null,
        email: email || null,
        phone: phone ? normalizePhone(phone) : null,
      };

      if (!id) {
        const emp = await repo.create({
          ...roleIdentityFields,
          employee_code: null,
          status: formData.status || 'Active',
          record_status: 'Draft',
          portal_access: true,
          is_super_admin: false,
          otp_attempts: 0,
          must_change_password: false,
          form_completion_pct: 0,
          created_by: actorId,
        }, t);
        id = emp.id;
        await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_DRAFT_CREATED', module: 'employees', entityId: id, newValues: { name: `${firstName} ${roleIdentityFields.last_name}` } });
      } else {
        const partial: any = {};
        const NEVER_CLEAR = new Set(['email', 'phone']);
        for (const [k, v] of Object.entries(roleIdentityFields)) {
          if (formData[k] === undefined) continue;
          if (NEVER_CLEAR.has(k) && (v === null || v === '')) continue;
          partial[k] = v;
        }
        if (formData.status !== undefined) partial.status = formData.status;
        if (Object.keys(partial).length) await repo.update(id, companyId, partial, t);
      }

      if (step && step !== 'role_identity' && WIZARD_STEPS.some(s => s.key === step)) {
        try {
          await this.routeStep(id!, companyId, step as StepKey, formData, actorId, t);
        } catch {
          // swallow — a draft save should never hard-fail on partial step data
        }
      }

      const fresh = await repo.findById(id!, companyId, true, t);
      if (!fresh) {
        // Should not happen — `id` was either just created in this same
        // transaction or was passed in as an existing employeeId — but
        // guard anyway so a stale/bad id fails gracefully instead of
        // crashing computeCompletionPct() on `undefined.first_name`.
        throw new AppError('Employee not found while finalizing draft save', 404);
      }
      const breakdown = computeCompletionPct(fresh.toJSON());
      await repo.updateCompletionPct(id!, breakdown.overallPct, t);

      if (breakdown.overallPct === 100 && !fresh?.employee_code) {
        const newCode = await generateEmployeeCode(companyId);
        await repo.update(id!, companyId, { employee_code: newCode, record_status: 'Final' }, t);
        await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_CODE_GENERATED', module: 'employees', entityId: id!, newValues: { employee_code: newCode } });
      }

      return { employeeId: id, persisted: true };
    });
  }

  async getDraft(sessionId: string, actorId: number) { return repo.getDraft(sessionId, actorId); }
  async discardDraft(sessionId: string, actorId: number) { return repo.deleteDraft(sessionId, actorId); }

  async getFieldPermissions(employeeId: number, moduleKey: string = 'employees') {
    const memberships = await UserGroup.findAll({ where: { employee_id: employeeId } });
    const byCompany: Record<number, number[]> = {};
    for (const m of memberships) {
      (byCompany[m.company_id] ??= []).push(m.group_id);
    }

    const DENY_ALL_FIELDS: FieldPermissionMap = {};

    const result: Record<number, FieldPermissionMap> = {};
    for (const [companyIdStr, groupIds] of Object.entries(byCompany)) {
      const companyId = +companyIdStr;

      const moduleSlugs = await fbSvc.resolveModuleSlugs(employeeId, companyId, groupIds);
      if (!moduleSlugs.has(`${moduleKey}:view`)) {
        result[companyId] = DENY_ALL_FIELDS;
        continue;
      }

      const groupPerms = await loadFieldPerms(groupIds, companyId);

      const fieldOverrides = await getEmployeeFieldOverrides(employeeId, companyId, moduleKey);
      const merged: FieldPermissionMap = { ...groupPerms };

      for (const [fieldName, permMap] of Object.entries(fieldOverrides)) {
        const base = merged[fieldName] || { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
        merged[fieldName] = {
          can_view: permMap.view !== undefined ? permMap.view : base.can_view,
          can_edit: permMap.edit !== undefined ? permMap.edit : base.can_edit,
          can_copy: permMap.copy !== undefined ? permMap.copy : base.can_copy,
          can_download: permMap.download !== undefined ? permMap.download : base.can_download,
          is_masked: permMap.mask !== undefined ? permMap.mask : base.is_masked,
        };
      }

      result[companyId] = merged;
    }
    return result;
  }

  async uploadProfilePhoto(id: number, companyId: number, avatarUrl: string, actorId: number) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);
    return sequelize.transaction(async (t) => {
      await repo.update(id, companyId, { avatar_url: avatarUrl, updated_by: actorId }, t);
      await logActivity({ companyId, employeeId: actorId, action: 'PROFILE_PHOTO_UPLOADED', module: 'employees', entityId: id, newValues: { avatar_url: avatarUrl } });
    });
  }

  async uploadIdDocument(id: number, companyId: number, docType: 'aadhaar' | 'pan' | 'passport' | 'drivingLicense', fileUrl: string, actorId: number) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);
    const column: Record<string, string> = {
      aadhaar: 'aadhaar_scan_url', pan: 'pan_scan_url',
      passport: 'passport_scan_url', drivingLicense: 'driving_license_scan_url',
    };
    if (!column[docType]) throw new AppError('Invalid document type', 400);
    return sequelize.transaction(async (t) => {
      await repo.upsertStatutory(id, { [column[docType]]: fileUrl } as any, t);
      await logActivity({ companyId, employeeId: actorId, action: 'ID_DOCUMENT_UPLOADED', module: 'employees', entityId: id, newValues: { docType } });
    });
  }

  async addExtraDocument(id: number, companyId: number, docType: string, docTypeOther: string | null, fileUrl: string, actorId: number) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);
    const doc = await repo.addDocument(id, { doc_type: docType, doc_type_other: docTypeOther, file_url: fileUrl });
    await logActivity({ companyId, employeeId: actorId, action: 'DOCUMENT_UPLOADED', module: 'employees', entityId: id, newValues: { docType } });
    return doc;
  }

  async getSummary(companyId: number) { return repo.getSummary(companyId); }

  async bulkUpload(rows: BulkUploadRow[], companyId: number, actorId: number): Promise<BulkUploadResult> {
    const result: BulkUploadResult = { total: rows.length, success: 0, failed: 0, errors: [], created: [] };

    // Resolved by name against the real tables, not a hardcoded stand-in
    // list — a hardcoded map goes stale the moment a department/designation/
    // company is added, renamed, or reordered, and previously didn't even
    // match what seeder.ts actually creates. Cached per-upload since the
    // same names repeat across rows.
    const departmentCache = new Map<string, number | null>();
    const designationCache = new Map<string, number | null>();
    const companyCache = new Map<string, number | null>();

    const resolveDepartmentId = async (name: string): Promise<number | null> => {
      if (departmentCache.has(name)) return departmentCache.get(name)!;
      const dept = await Department.findOne({ where: { department_name: name } });
      const id = dept ? dept.get('id') as number : null;
      departmentCache.set(name, id);
      return id;
    };
    const resolveDesignationId = async (name: string): Promise<number | null> => {
      if (designationCache.has(name)) return designationCache.get(name)!;
      const desig = await Designation.findOne({ where: { designation_name: name } });
      const id = desig ? desig.get('id') as number : null;
      designationCache.set(name, id);
      return id;
    };
    const resolveCompanyId = async (name: string): Promise<number | null> => {
      if (companyCache.has(name)) return companyCache.get(name)!;
      const comp = await Company.findOne({ where: { name } });
      const id = comp ? comp.get('id') as number : null;
      companyCache.set(name, id);
      return id;
    };

    const getString = (value: any): string => !value ? '' : String(value).trim();
    const getNumber = (value: any): number | undefined => {
      if (!value) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const firstName = getString(row.first_name);
        if (!firstName) throw new Error('first_name is required');

        const lastName = getString(row.last_name);
        if (!lastName) throw new Error('last_name is required');

        const email = getString(row.email);
        if (!email) throw new Error('email is required');

        const phone = getString(row.phone);
        if (!phone) throw new Error('phone is required');

        // Template columns are "department"/"designation"/"company" (name
        // strings), not "*_id" — matches BulkUploadModal.tsx's actual
        // generated headers.
        const departmentStr = getString(row.department);
        if (!departmentStr) throw new Error('department is required');

        const designationStr = getString(row.designation);
        if (!designationStr) throw new Error('designation is required');

        let departmentId: number;
        const deptNum = getNumber(departmentStr);
        if (deptNum) {
          departmentId = deptNum;
        } else {
          const resolved = await resolveDepartmentId(departmentStr);
          if (!resolved) throw new Error(`Invalid department: ${departmentStr}`);
          departmentId = resolved;
        }

        let designationId: number;
        const designNum = getNumber(designationStr);
        if (designNum) {
          designationId = designNum;
        } else {
          const resolved = await resolveDesignationId(designationStr);
          if (!resolved) throw new Error(`Invalid designation: ${designationStr}`);
          designationId = resolved;
        }

        let finalCompanyId = companyId;
        if (row.company) {
          const companyStr = getString(row.company);
          const compNum = getNumber(companyStr);
          if (compNum) {
            finalCompanyId = compNum;
          } else {
            const resolved = await resolveCompanyId(companyStr);
            if (!resolved) throw new Error(`Invalid company: ${companyStr}`);
            finalCompanyId = resolved;
          }
        }

        const emp: any = await this.create(
          {
            company_id: finalCompanyId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            department_id: departmentId,
            designation_id: designationId,
            sub_department_id: row.sub_department_id ? getNumber(row.sub_department_id) : undefined,
            sub_designation_id: row.sub_designation_id ? getNumber(row.sub_designation_id) : undefined,
            employment_type: (row.employment_type as any) || 'Permanent',
            status: row.status ? getString(row.status) : 'Active',
          } as any,
          actorId
        );

        result.created.push(emp.id);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          name: `${getString(row.first_name)} ${getString(row.last_name)}`.trim(),
          reason: err.message || 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Bulk-import path (used by bulkImport.service). Creates an employee and
   * applies every provided wizard step in ONE transaction, reusing routeStep()
   * — the same persistence + calculations the wizard uses — and the same
   * completion / employee_code logic as updateStep(). The caller has already
   * validated the payloads and resolved all master data.
   *
   * Any failure rolls the whole row back, so a partially-imported employee can
   * never exist. Existing single-step flows are untouched.
   */
  async bulkCreateEmployee(
    base: {
      company_id: number; first_name: string; middle_name: string | null; last_name: string;
      status: string; employment_type: string; department_id: number; designation_id: number;
      sub_department_id: number | null; sub_designation_id: number | null; email: string; phone: string;
      employee_code?: string | null; reference_code?: string | null; avatar_url?: string | null; avatar?: string | null;
      reporting_manager_id?: number | null;
    },
    steps: Partial<Record<StepKey, any>>,
    actorId: number,
  ): Promise<{ employeeId: number; employeeCode: string | null; completionPct: number; warnings: string[] }> {
    const STEP_ORDER: StepKey[] = [
      'location_attendance', 'managers_work_contact', 'commitment_probation', 'statutory_schemes',
      'compensation', 'hr_joining_checklist', 'personal_profile', 'address', 'family_emergency',
      'ids_bank', 'experience_education',
    ];
    // For optional steps the sheet didn't fill, create the empty child row anyway
    // — same as an empty "Save & Continue" in the wizard — so completion (and
    // therefore employee_code) is gated by required fields only. `location_
    // attendance` and `ids_bank` are omitted: they carry required fields, so if
    // the sheet skipped them the employee is genuinely incomplete.
    const EMPTY_PAYLOAD: Partial<Record<StepKey, any>> = {
      managers_work_contact: {},
      commitment_probation:  { commitment: false, on_probation: false },
      statutory_schemes:     { pf_status: false, esic_status: false, rd_scheme: false },
      compensation:          { asset_deduction_applicable: false },
      hr_joining_checklist:  {},
      personal_profile:      {},
      address:               {},
      family_emergency:      {},
      experience_education:  { is_experienced: false },
    };

    // A manually-supplied employee_code (existing-staff migration) is kept as-is;
    // a blank one is still auto-generated once the profile hits 100%.
    const manualCode = base.employee_code?.trim() || null;

    return sequelize.transaction(async (t) => {
      const emp = await repo.create({
        company_id:         base.company_id,
        employee_code:      manualCode,
        reference_code:     base.reference_code?.trim() || null,
        avatar_url:         base.avatar_url?.trim() || null,
        reporting_manager_id: base.reporting_manager_id ?? null,
        status:             (base.status as any) || 'Active',
        record_status:      manualCode ? 'Final' : 'Draft',
        first_name:         base.first_name.trim(),
        middle_name:        base.middle_name?.trim() || null,
        last_name:          base.last_name.trim(),
        employment_type:    (base.employment_type as any) || 'Permanent',
        department_id:      base.department_id,
        sub_department_id:  base.sub_department_id ?? null,
        designation_id:     base.designation_id,
        sub_designation_id: base.sub_designation_id ?? null,
        email:              base.email.toLowerCase().trim(),
        phone:              normalizePhone(base.phone),
        portal_access:      true,
        is_super_admin:     false,
        otp_attempts:       0,
        must_change_password: false,
        form_completion_pct: 0,
        created_by:         actorId,
      } as any, t);

      for (const step of STEP_ORDER) {
        const payload = steps[step] ?? EMPTY_PAYLOAD[step];
        if (payload === undefined) continue;   // location_attendance / ids_bank not in the sheet
        await this.routeStep(emp.id, base.company_id, step, payload, actorId, t);
      }

      const fresh = await repo.findById(emp.id, base.company_id, true, t);
      const breakdown = computeCompletionPct(fresh?.toJSON() ?? {});
      await repo.updateCompletionPct(emp.id, breakdown.overallPct, t);

      const warnings: string[] = [];
      let employeeCode: string | null = manualCode;
      if (breakdown.overallPct === 100 && !manualCode && !fresh?.employee_code) {
        try {
          employeeCode = await generateEmployeeCode(base.company_id);
          await repo.update(emp.id, base.company_id, { employee_code: employeeCode, record_status: 'Final' }, t);
        } catch (e: any) {
          warnings.push(`Reached 100% but employee_code was not generated: ${e.message}`);
        }
      }

      await logActivity({
        companyId: base.company_id, employeeId: actorId, action: 'EMPLOYEE_BULK_IMPORTED',
        module: 'employees', entityId: emp.id,
        newValues: { name: `${base.first_name} ${base.last_name}`, completionPct: breakdown.overallPct },
      });

      return { employeeId: emp.id, employeeCode, completionPct: breakdown.overallPct, warnings };
    });
  }

  /**
   * Bulk-import UPDATE path — the row carried an Employee Code that matched an
   * existing employee. Applies the row's base identity/role fields and only the
   * wizard steps the sheet actually filled (never wipes untouched sections),
   * then recomputes completion. An existing employee_code is preserved; a
   * still-missing one is generated if the profile now reaches 100%.
   *
   * `currentCompanyId` is the employee's company right now; `base.company_id` is
   * where the row places them (they differ on a transfer row).
   */
  async bulkUpdateEmployee(
    existingId: number,
    currentCompanyId: number,
    base: {
      company_id: number; first_name: string; middle_name: string | null; last_name: string;
      status: string; employment_type: string; department_id: number; designation_id: number;
      sub_department_id: number | null; sub_designation_id: number | null; email: string; phone: string;
      employee_code?: string | null; reference_code?: string | null; avatar_url?: string | null; avatar?: string | null;
      reporting_manager_id?: number | null;
    },
    steps: Partial<Record<StepKey, any>>,
    actorId: number,
  ): Promise<{ employeeId: number; employeeCode: string | null; completionPct: number; warnings: string[] }> {
    const STEP_ORDER: StepKey[] = [
      'location_attendance', 'managers_work_contact', 'commitment_probation', 'statutory_schemes',
      'compensation', 'hr_joining_checklist', 'personal_profile', 'address', 'family_emergency',
      'ids_bank', 'experience_education',
    ];

    return sequelize.transaction(async (t) => {
      const existing = await repo.findAnyById(existingId, t);
      if (!existing) throw new AppError('Employee to update not found', 404);

      const targetCompanyId = base.company_id;

      const baseUpdate: any = {
        company_id:         targetCompanyId,
        first_name:         base.first_name.trim(),
        middle_name:        base.middle_name?.trim() || null,
        last_name:          base.last_name.trim(),
        status:             (base.status as any) || existing.status,
        employment_type:    (base.employment_type as any) || existing.employment_type,
        department_id:      base.department_id,
        sub_department_id:  base.sub_department_id ?? null,
        designation_id:     base.designation_id,
        sub_designation_id: base.sub_designation_id ?? null,
        email:              base.email.toLowerCase().trim(),
        phone:              normalizePhone(base.phone),
        updated_by:         actorId,
      };
      if (base.reference_code?.trim()) baseUpdate.reference_code = base.reference_code.trim();
      if (base.avatar_url?.trim())     baseUpdate.avatar_url = base.avatar_url.trim();
      if (base.reporting_manager_id != null) baseUpdate.reporting_manager_id = base.reporting_manager_id;

      // scope the write by the CURRENT company so the row is found, then the
      // update itself moves company_id to the target
      await repo.update(existingId, currentCompanyId, baseUpdate, t);

      // `location_attendance` and `commitment_probation` (the two sections that
      // carry the transfer date fields) map 1:1 to a single child row, and
      // routeStep rewrites every column of that row. Merge the current values
      // underneath the sheet's so a partial edit — e.g. only Current Joining
      // Date — doesn't blank the rest of the section.
      if (steps.location_attendance) {
        const cur = await EmployeeLocationAttendance.findByPk(existingId, { transaction: t });
        if (cur) steps.location_attendance = { ...stripRowMeta(cur.toJSON()), ...steps.location_attendance };
      }
      if (steps.commitment_probation) {
        const cur = await EmployeeCommitmentProbation.findByPk(existingId, { transaction: t });
        if (cur) steps.commitment_probation = { ...stripRowMeta(cur.toJSON()), ...steps.commitment_probation };
      }

      // Apply only the steps present in the sheet — untouched sections are left
      // exactly as they were (unlike create, which seeds empty child rows).
      for (const step of STEP_ORDER) {
        const payload = steps[step];
        if (payload === undefined) continue;
        await this.routeStep(existingId, targetCompanyId, step, payload, actorId, t);
      }

      const fresh = await repo.findById(existingId, targetCompanyId, true, t);
      const breakdown = computeCompletionPct(fresh?.toJSON() ?? {});
      await repo.updateCompletionPct(existingId, breakdown.overallPct, t);

      const warnings: string[] = [];
      let employeeCode: string | null = fresh?.employee_code ?? existing.employee_code ?? null;
      if (breakdown.overallPct === 100 && !employeeCode) {
        try {
          employeeCode = await generateEmployeeCode(targetCompanyId);
          await repo.update(existingId, targetCompanyId, { employee_code: employeeCode, record_status: 'Final' }, t);
        } catch (e: any) {
          warnings.push(`Reached 100% but employee_code was not generated: ${e.message}`);
        }
      }

      await logActivity({
        companyId: targetCompanyId, employeeId: actorId, action: 'EMPLOYEE_BULK_UPDATED',
        module: 'employees', entityId: existingId,
        newValues: { name: `${base.first_name} ${base.last_name}`, completionPct: breakdown.overallPct },
      });

      return { employeeId: existingId, employeeCode, completionPct: breakdown.overallPct, warnings };
    });
  }
}

export const employeeService = new EmployeeService();