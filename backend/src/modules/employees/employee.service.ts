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
import { FormBuilderService } from '../form-builder/formBuilder.service';

const fbSvc = new FormBuilderService();

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
  // Group by field_key, then OR across all matching groups (most-permissive)
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

// export function clearFpCache(roleId?: number) {
//   roleId ? fpCache.delete(roleId) : fpCache.clear();
// }

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

// ─────────────────────────────────────────────────────────────────────────────
export class EmployeeService {

  async getAll(params: EmployeeQueryParams, companyId: number, isSuperAdmin: boolean) {
    const result = await repo.findAll(params, companyId);
    const perms  = isSuperAdmin ? {} : '';
    return {
      ...result,
      rows: result.rows.map(e => applyMasking(e.toJSON() as any, perms, isSuperAdmin)),
    };
  }

  async getById(id: number, companyId: number, isSuperAdmin: boolean) {
    const canSeeSensitive = isSuperAdmin;
    const emp = await repo.findById(id, companyId, canSeeSensitive);
    if (!emp) throw new AppError('Employee not found', 404);

    const perms = isSuperAdmin ? {} : '';
    const json  = emp.toJSON() as any;
    // Apply masking to sensitive sub-objects
    if (json.statutory)   json.statutory   = applyMasking(json.statutory,  perms, isSuperAdmin);
    if (json.salaries)    json.salaries     = json.salaries.map((s: any) => applyMasking(s, perms, isSuperAdmin));
    if (json.bankDetails) json.bankDetails  = json.bankDetails.map((b: any) => applyMasking(b, perms, isSuperAdmin));
    return json;
  }

  async create(dto: RoleIdentityDto, actorId: number, ipAddress?: string) {
    if (dto.email) {
      const dupEmail = await repo.findByEmail(dto.email);
      if (dupEmail) throw new AppError(
        `Email "${dto.email}" is already registered to ${dupEmail.first_name} ${dupEmail.last_name} (${dupEmail.employee_code ?? 'code pending'}) — employee_code and email are globally unique across all companies`,
        409,
      );
    }

    if (dto.phone) {
      const dupMobile = await repo.findByMobile(dto.phone);
      if (dupMobile) throw new AppError(
        `Phone "${dto.phone}" is already registered to ${dupMobile.first_name} ${dupMobile.last_name} (${dupMobile.employee_code ?? 'code pending'}) — employee_code and phone are globally unique across all companies`,
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
        // Auth defaults
        portal_access:   true,        // enabled on creation — employee can log in immediately
        is_super_admin:  false,
        otp_attempts:    0,
        must_change_password: false,
        form_completion_pct: 0,       // recalculated on the first step save
        created_by:      actorId,
      }, t);

      await logActivity({ companyId: dto.company_id, employeeId: actorId, action: 'EMPLOYEE_CREATED', module: 'employees', entityId: emp.id, newValues: { name: emp.fullName }, ipAddress });
      return emp;
    });
  }

  async updateStep(id: number, companyId: number, step: StepKey, dto: any, actorId: number, ipAddress?: string) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);

    return sequelize.transaction(async (t) => {
      await this.routeStep(id, companyId, step, dto, actorId, t);

      // Recalculate HR/Candidate/overall completion
      const fresh = await repo.findById(id, companyId, true);
      const breakdown = computeCompletionPct(fresh?.toJSON());
      await repo.updateCompletionPct(id, breakdown.overallPct, t);

      // Generate employee_code the instant overall completion reaches 100%,
      // if it hasn't already been assigned. This is the one place this fires.
      // record_status flips from Draft to Final at the same moment.
      if (breakdown.overallPct === 100 && !fresh?.employee_code) {
        const newCode = await generateEmployeeCode(companyId);
        await repo.update(id, companyId, { employee_code: newCode, record_status: 'Final' }, t);
        await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_CODE_GENERATED', module: 'employees', entityId: id, newValues: { employee_code: newCode }, ipAddress });
      }

      await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_STEP_SAVED', module: 'employees', entityId: id, newValues: { step, hrPct: breakdown.hrPct, candidatePct: breakdown.candidatePct }, ipAddress });
      return repo.findById(id, companyId, false);
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
        await repo.update(id, companyId, {
          working_state_country: d.working_state_country ?? null,
          working_city:           d.working_city ?? null,
          working_site:            d.working_site ?? null,
          pay_register_location:   d.pay_register_location ?? null,
          actual_doj:              d.actual_doj ? parseDdMmYyyy(d.actual_doj) : null,
          weekly_off:              d.weekly_off ?? null,
          shift_id:                d.shift_id || null,
          grace_minutes:           d.grace_minutes ?? null,
          updated_by:              actorId,
        }, t);
        break;
      }

      case 'managers_work_contact': {
        const d = dto as ManagersWorkContactDto;
        // l1_manager_id and l2_manager_id are employee_id integers
        const l1Id = d.l1_manager_id ? Number(d.l1_manager_id) : null;
        const l2Id = d.l2_manager_id ? Number(d.l2_manager_id) : null;

        if (l1Id) {
          const mgr = await repo.findManagerById(l1Id, companyId);
          if (!mgr) throw new AppError('L1 Manager not found in this company', 404);
          if (mgr.id === id) throw new AppError('Employee cannot be their own manager', 400);
        }

        await repo.update(id, companyId, {
          l1_manager_id:   l1Id,
          l2_manager_id:   l2Id,
          official_email:  d.official_email?.toLowerCase().trim() || null,
          official_mobile: d.official_mobile ? normalizePhone(d.official_mobile) : null,
          updated_by:      actorId,
        }, t);
        break;
      }

      case 'commitment_probation': {
        const d = dto as CommitmentProbationDto;
        const emp = await repo.findById(id, companyId);

        const commitEndDate = (d.commitment && d.commitment_term && d.commitment_entered_on)
          ? computeCommitmentEndDate(d.commitment_entered_on, d.commitment_term)
          : null;
        const commitStatus = commitEndDate
          ? (new Date() < commitEndDate ? 'Active' : 'Completed')
          : 'N/A';

const probationEndDate = (d.on_probation && d.probation_period && emp?.actual_doj)
  ? computeProbationEndDate(String(emp.actual_doj), d.probation_period)
  : null;

        await repo.upsertCommitmentProbation(id, {
          commitment:               d.commitment,
          commitment_term:          d.commitment_term || null,
          commitment_entered_on:    d.commitment_entered_on ? parseDdMmYyyy(d.commitment_entered_on) : null,
          commitment_end_date:      commitEndDate,
          commitment_status:        commitStatus,
          on_probation:             d.on_probation,
          probation_period:         d.probation_period || null,
          probation_end_date:       probationEndDate,
          probation_status:         probationEndDate ? (new Date() < probationEndDate ? 'On Probation' : 'Completed') : 'N/A',
          probation_extended_period:d.probation_extended_period || null,
          probation_final_status:   d.on_probation ? 'Pending' : 'N/A',
          confirmation_status:      d.confirmation_status || null,
          confirmed_on:             d.confirmed_on ? parseDdMmYyyy(d.confirmed_on) : null,
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
          rd_status: d.rd_scheme ? 'Active' : 'Inactive',
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
        }, t);
        await repo.upsertAddress(id, 'permanent', {
          is_same_as_present: d.perm_address_type === 'Same as Present',
          house_type: d.perm_house_type || null, house_no: d.perm_house_no || null,
          area: d.perm_area || null, district: d.perm_district || null,
          city: d.perm_city || null, state: d.perm_state || null,
          country: d.perm_country || null, pincode: d.perm_pincode || null,
        }, t);
        break;
      }

      case 'family_emergency': {
        const d = dto as FamilyDto & { family_members?: FamilyMemberDto[]; emergency_contacts?: EmergencyContactDto[] };

        // marital_status is shown on this screen in the UI but still belongs
        // to employee_personal (avoids duplicating the column across tables).
        if (d.marital_status) {
          await repo.upsertPersonal(id, { marital_status: d.marital_status } as any, t);
        }

        await repo.upsertFamily(id, {
          father_salutation: d.father_salutation, father_name: d.father_name,
          father_dob: d.father_dob || null, father_occupation: d.father_occupation || null,
          mother_salutation: d.mother_salutation, mother_name: d.mother_name,
          mother_dob: d.mother_dob || null, mother_occupation: d.mother_occupation || null,
        } as any, t);

        if (d.family_members) {
          await repo.replaceFamilyMembers(id, d.family_members, t);
        }
        if (d.emergency_contacts) {
          await repo.replaceEmergencyContacts(id, d.emergency_contacts, t);
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
        }, t);

        await repo.upsertBank(id, 'personal', {
          bank_name:      d.personal_bank_name,
          account_number: d.personal_bank_account,
          ifsc_code:      d.personal_ifsc?.toUpperCase(),
          branch_name:    d.personal_bank_branch || null,
        }, t);

        if (d.vaccinations) await repo.replaceVaccinations(id, d.vaccinations, t);
        if (d.documents)    await repo.replaceDocuments(id, d.documents, t);
        break;
      }

      case 'experience_education': {
        const d = dto as ExperienceEducationDto;
        await repo.setExperienceFlag(id, d.is_experienced, t);

        if (d.experience) {
          await repo.replaceExperience(id, d.experience.map(e => ({
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
          await repo.replaceEducation(id, d.education.map(ed => ({
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

        const { monthlyDeduction, lastInstallment } = (d.asset_deduction_applicable && d.security_amount)
          ? computeAssetDeduction(d.security_amount, d.deduction_months || 'N/A', d.monthly_deduction || undefined)
          : { monthlyDeduction: 0, lastInstallment: 0 };
        await repo.upsertAssetDeduction(id, {
          asset_deduction_applicable: d.asset_deduction_applicable,
          security_amount:   d.security_amount || null,
          deduction_months:  d.deduction_months || null,
          deduction_from:    d.deduction_from || null,
          monthly_deduction: monthlyDeduction || null,
          final_monthly_deduction: d.final_monthly_deduction || null,
          last_installment:  lastInstallment || null,
        }, t);
        break;
      }

      case 'hr_joining_checklist': {
        await repo.upsertOnboardingDocs(id, dto as OnboardingDocsDto, t);
        // Enable portal access once onboarding docs are confirmed
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

  // ─── Portal access management ─────────────────────────────────────────────
  async setPortalAccess(id: number, companyId: number, enabled: boolean, actorId: number) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);
    await repo.updateAuthFields(id, {
      portal_access: enabled,
      // Reset OTP state when disabling
      ...(enabled ? {} : { otp_hash: null, otp_expires: null, otp_attempts: 0, otp_locked_until: null, refresh_token: null }),
    });
    await logActivity({ companyId, employeeId: actorId, action: enabled ? 'PORTAL_ENABLED' : 'PORTAL_DISABLED', module: 'employees', entityId: id });
  }

  // ─── Misc ──────────────────────────────────────────────────────────────────
  async delete(id: number, companyId: number, actorId: number) {
    const emp = await repo.softDelete(id, companyId, actorId);
    if (!emp) throw new AppError('Employee not found', 404);
    await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_DELETED', module: 'employees', entityId: id });
  }

  // Search managers by ID or name (returns list for async dropdown)
  async searchManagers(query: string, companyId: number, excludeId?: number) {
    return repo.searchManagers(query, companyId, excludeId);
  }

  async getManagerById(managerId: number, companyId: number) {
    const mgr = await repo.findManagerById(managerId, companyId);
    if (!mgr) throw new AppError('Manager not found', 404);
    return mgr;
  }

  async saveDraft(data: { employeeId?: number | null; companyId: number; actorId: number; step: string; formData: any; sessionId: string }) {
    const { employeeId, companyId, actorId, step, formData, sessionId } = data;
    
    await repo.upsertDraft({ employeeId, createdBy: actorId, step, formData, sessionId });

    const firstName = String(formData.first_name || '').trim();
    const phone = String(formData.phone || '').trim();
    if (!firstName || !phone) {
      return { employeeId: employeeId ?? null, persisted: false };
    }

    return sequelize.transaction(async (t) => {
      let id = employeeId;

      if (!id) {
        const emp = await repo.create({
          company_id: companyId,
          first_name: firstName,
          middle_name: formData.middle_name || null,
          last_name: formData.last_name?.trim() || '',
          status: formData.status || 'Active',
          record_status: 'Draft',
          employment_type: formData.employment_type || 'Permanent',
          department_id: formData.department_id ? Number(formData.department_id) : null,
          sub_department_id: formData.sub_department_id ? Number(formData.sub_department_id) : null,
          designation_id: formData.designation_id ? Number(formData.designation_id) : null,
          sub_designation_id: formData.sub_designation_id ? Number(formData.sub_designation_id) : null,
          email: formData.email?.toLowerCase().trim() || null,
          phone: normalizePhone(phone),
          employee_code: null,
          portal_access: true,
          is_super_admin: false,
          otp_attempts: 0,
          must_change_password: false,
          form_completion_pct: 0,
          created_by: actorId,
        }, t);
        id = emp.id;
        await logActivity({ companyId, employeeId: actorId, action: 'EMPLOYEE_DRAFT_CREATED', module: 'employees', newValues: { name: emp.fullName } });
      } else {
        // Employee already exists — lenient partial update of whichever
        // role_identity-type fields are present, no required-field checks.
        const roleFields = ['first_name', 'middle_name', 'last_name', 'status', 'employment_type', 'department_id', 'sub_department_id', 'designation_id', 'sub_designation_id', 'email', 'phone'];
        const partial: any = {};
        for (const k of roleFields) {
          if (formData[k] !== undefined) partial[k] = k === 'phone' ? normalizePhone(String(formData[k])) : formData[k];
        }
        if (Object.keys(partial).length) await repo.update(id, companyId, partial, t);
      }

      // Route whatever step-specific fields are present into the real child
      // table too — reuses routeStep()'s upsert logic, just without the
      // strict validators that normally gate PATCH /:id/step/:step. A draft
      // save should never hard-fail just because a step's data is partial.
      if (step && step !== 'role_identity' && WIZARD_STEPS.some(s => s.key === step)) {
        try {
          await this.routeStep(id!, companyId, step as StepKey, formData, actorId, t);
        } catch {
          // swallow — see comment above
        }
      }

      const fresh = await repo.findById(id!, companyId, true);
      const breakdown = computeCompletionPct(fresh?.toJSON());
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


// moduleKey defaults to 'employees' so the Employee wizard's own existing
// calls (no module passed) keep working exactly as before. Any OTHER form
// (Department, Designation, etc.) reusing this same endpoint must pass its
// own module key — previously this was hardcoded to 'employees' everywhere.
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

    // ── Layer employee-specific field overrides on top — override wins ──
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


  // ─── Role & Identity: profile photo upload ─────────────────────────────────
  async uploadProfilePhoto(id: number, companyId: number, avatarUrl: string, actorId: number) {
    const emp = await repo.findById(id, companyId);
    if (!emp) throw new AppError('Employee not found', 404);
    return sequelize.transaction(async (t) => {
      await repo.update(id, companyId, { avatar_url: avatarUrl, updated_by: actorId }, t);
      await logActivity({ companyId, employeeId: actorId, action: 'PROFILE_PHOTO_UPLOADED', module: 'employees', entityId: id, newValues: { avatar_url: avatarUrl } });
    });
  }

  // ─── IDs & Bank: document uploads ──────────────────────────────────────────
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

  // ✅ FIXED bulkUpload METHOD - Handles all required fields
  async bulkUpload(rows: BulkUploadRow[], companyId: number, actorId: number): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    // ✅ Map for converting labels to IDs
    const departmentMap: Record<string, number> = {
      'Commercial': 1,
      'Accounts': 2,
      'Automation': 3,
      'HR': 4,
      'Graphics': 5,
      'Admin': 6,
      'Project': 7,
      'Service': 8,
      'IT': 9,
      'Estimation': 10,
      'Management': 11,
      'Purchase': 12,
      'Tender': 13,
      'Sales': 14,
      'Technical': 15,
      'Legal': 16,
      'Regulatory Affairs': 17,
      'Store': 18,
      'Ortho': 19,
      'Maintenance': 20,
      'Design': 21,
      'Quality': 22,
      'Credit Control': 23,
      'International Marketing': 24,
      'Field': 25,
      'Projects': 26,
      'Facility Management (Operations)': 27,
      'PTS and Project': 28,
      'CSSD': 29,
      'Quality Control': 30,
      'Marketing': 31,
      'Operations': 32,
    };

    const designationMap: Record<string, number> = {
      'Accountant': 1,
      'Manager': 2,
      'Senior Manager': 3,
      'Executive': 4,
      'Engineer': 5,
      'Developer': 6,
      'Coordinator': 7,
      'Supervisor': 8,
    };

    const companyMapBulk: Record<string, number> = {
      'Narula Exports': 1,
      'Med Freshe': 4,
      'Greenvac Solutions': 2,
      'Collarcheck': 3,
    };

    // ✅ Helper function to safely convert to string
    const getString = (value: any): string => {
      if (!value) return '';
      return String(value).trim();
    };

    // ✅ Helper function to safely convert to number
    const getNumber = (value: any): number | undefined => {
      if (!value) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // ✅ Validate Required Fields
        const firstName = getString(row.first_name);
        if (!firstName) {
          throw new Error('first_name is required');
        }

        const lastName = getString(row.last_name);
        if (!lastName) {
          throw new Error('last_name is required');
        }

        const email = getString(row.email);
        if (!email) {
          throw new Error('email is required');
        }

        const phone = getString(row.phone);
        if (!phone) {
          throw new Error('phone is required');
        }

        const departmentStr = getString(row.department_id);
        if (!departmentStr) {
          throw new Error('department_id is required');
        }

        const designationStr = getString(row.designation_id);
        if (!designationStr) {
          throw new Error('designation_id is required');
        }

        // ✅ Convert department label to ID
        let departmentId: number;
        const deptNum = getNumber(departmentStr);
        if (deptNum) {
          departmentId = deptNum;
        } else {
          departmentId = departmentMap[departmentStr];
          if (!departmentId) {
            throw new Error(`Invalid department: ${departmentStr}`);
          }
        }

        // ✅ Convert designation label to ID
        let designationId: number;
        const designNum = getNumber(designationStr);
        if (designNum) {
          designationId = designNum;
        } else {
          designationId = designationMap[designationStr];
          if (!designationId) {
            throw new Error(`Invalid designation: ${designationStr}`);
          }
        }

        // ✅ Convert company label to ID if provided
        let finalCompanyId = companyId;
        if (row.company_id) {
          const companyStr = getString(row.company_id);
          const compNum = getNumber(companyStr);
          if (compNum) {
            finalCompanyId = compNum;
          } else {
            const mappedCompanyId = companyMapBulk[companyStr];
            if (mappedCompanyId) {
              finalCompanyId = mappedCompanyId;
            }
          }
        }

        // ✅ Create Employee with ALL required fields
        const emp = await this.create(
          {
            company_id: finalCompanyId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            department_id: departmentId,
            designation_id: designationId,
            // Optional fields
            date_of_birth: row.date_of_birth ? getString(row.date_of_birth) : undefined,
            gender: row.gender ? getString(row.gender) : undefined,
            date_of_joining: row.date_of_joining ? getString(row.date_of_joining) : undefined,
            salary: row.salary ? getNumber(row.salary) : undefined,
            working_site: row.working_site ? getString(row.working_site) : undefined,
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

// private async hasSensitiveAccess(employeeId: number, companyId: number): Promise<boolean> {
//   const perms = await this.getFieldPermissions(employeeId, companyId);
//   return SENSITIVE_FIELDS.some(f => perms[f]?.can_view !== false);
// }
}

export const employeeService = new EmployeeService();