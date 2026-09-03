'use client';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { fullEmployeeSchema, STEP_SCHEMA_MAP, type FullEmployeeForm, type StepSchemaKey } from '../validations/employee.schema';
import { WIZARD_STEPS } from '../constants/employee.constants';
import { useCreateEmployee, useUpdateStep, useSaveDraft } from '../hooks/useEmployees';
import { employeeService } from '../../../services/api/employee.service';
import { showToast } from '../../../utils/toast';
import { usePermission } from '../../auth/hooks/usePermission';

import { StepRoleIdentity }        from './steps/StepRoleIdentity';
import { StepLocationAttendance }  from './steps/StepLocationAttendance';
import { StepManagersWorkContact } from './steps/StepManagersWorkContact';
import { StepCommitmentProbation } from './steps/StepCommitmentProbation';
import { StepStatutorySchemes }    from './steps/StepStatutorySchemes';
import { StepCompensation }        from './steps/StepCompensation';
import { StepHrJoiningChecklist }  from './steps/StepHrJoiningChecklist';
import { StepPersonalProfile }     from './steps/StepPersonalProfile';
import { StepAddress }             from './steps/StepAddress';
import { StepFamilyEmergency }     from './steps/StepFamilyEmergency';
import { StepIdsBank }             from './steps/StepIdsBank';
import { StepExperienceEducation } from './steps/StepExperienceEducation';
import { StepReview }              from './steps/StepReview';

import type { Employee, CommitmentProbation, EmployeePersonal, EmployeeFamily,
  EmployeeStatutory, EmployeeSchemes, EmployeeBankDetail, EmployeeSalary,
  EmployeeAssetDeduction, OnboardingDocs,
  EmployeeAddress } from '../types/employee.types';

const getOrCreateSid = () => {
  if (typeof window === 'undefined') return 'ssr';
  const k = 'ung_emp_wizard_sid';
  let id = sessionStorage.getItem(k);
  if (!id) { id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; sessionStorage.setItem(k, id); }
  return id;
};

interface Props { mode: 'create' | 'edit'; employee?: Employee; onSuccess?: (emp: Employee) => void; }

export function EmployeeWizard({ mode, employee, onSuccess }: Props) {
  const router = useRouter();
  const { isHR, isAdmin, isSuperAdmin } = usePermission();
  const canSeeSensitive = isHR || isAdmin || isSuperAdmin;

  const sidRef        = useRef(getOrCreateSid());
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingAvatarRef = useRef<File | null>(null);

  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [savedId,      setSavedId]      = useState<number | null>(employee?.id ?? null);
  // Populated from real per-step completion below (edit/draft) or as the user
  // advances (create) — never pre-filled just because the record exists.
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
  const [errorSet,     setErrorSet]     = useState<Set<number>>(new Set());
  const [isDirty,      setIsDirty]      = useState(false);
  const [draftSaving,  setDraftSaving]  = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  const visibleSteps = useMemo(() => WIZARD_STEPS.filter(s => !s.sensitive || canSeeSensitive), [canSeeSensitive]);
  const step    = visibleSteps[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast  = currentIdx === visibleSteps.length - 1;

  // HR/Candidate dual progress — matches the "0% · HR 0/7 · Candidate 0/5" UI
  const hrSteps        = useMemo(() => visibleSteps.filter(s => s.part === 'hr'), [visibleSteps]);
  const candidateSteps = useMemo(() => visibleSteps.filter(s => s.part === 'candidate'), [visibleSteps]);
  const hrDone        = useMemo(() => [...completedSet].filter(i => visibleSteps[i]?.part === 'hr').length, [completedSet, visibleSteps]);
  const candidateDone = useMemo(() => [...completedSet].filter(i => visibleSteps[i]?.part === 'candidate').length, [completedSet, visibleSteps]);

  const createMutation  = useCreateEmployee();
  const updateMutation  = useUpdateStep(savedId ?? 0);
  const draftMutation   = useSaveDraft();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<FullEmployeeForm>({
    resolver: zodResolver(fullEmployeeSchema),
    mode: 'onTouched',
    defaultValues: {
      status: 'Active', employment_type: 'Permanent', weekly_off: '',
      perm_address_type: 'Same as Present', commitment: false, on_probation: false,
      pf_status: false, esic_status: false, mediclaim_status: 'No', rd_scheme: false,
      is_experienced: false, asset_deduction_applicable: false, yellow_fever: false,
      offer_letter: false, address_verification: false, service_agreement: false,
      indemnity_bond: false, asset_deduction_letter: false, account_opening_letter: false, nda: false,
      company_id:        undefined as number | undefined,
      avatar_url:        null as string | null,
      email:             '',
      phone:             '',
      official_email:    '',
      official_mobile:   '',
      department_id:     null,
      sub_department_id: null,
      family_members:     [],
      emergency_contacts: [],
      vaccinations:        [],
      documents:            [],
      experience:           [],
      education:            [],
    },
  });

  // Populate form on edit
  useEffect(() => {
    if (!employee) return;
    const p   = (employee.personal            ?? {}) as Partial<EmployeePersonal>;
    const fam = (employee.family              ?? {}) as Partial<EmployeeFamily>;
    const st  = (employee.statutory           ?? {}) as Partial<EmployeeStatutory>;
    const cp  = (employee.commitmentProbation ?? {}) as Partial<CommitmentProbation>;
    const sch = (employee.schemes             ?? {}) as Partial<EmployeeSchemes>;
    const pb  = (employee.bankDetails?.find((b: any) => b.bank_type === 'personal') ?? {}) as Partial<EmployeeBankDetail>;
    const cur = (employee.salaries?.find((s: any) => s.salary_type === 'current')   ?? {}) as Partial<EmployeeSalary>;
    const joi = (employee.salaries?.find((s: any) => s.salary_type === 'joining')   ?? {}) as Partial<EmployeeSalary>;
    const ad  = (employee.assetDeduction      ?? {}) as Partial<EmployeeAssetDeduction>;
    const doc = (employee.onboardingDocs      ?? {}) as Partial<OnboardingDocs>;
    const pAddr = (employee.addresses?.find((a: any) => a.address_type === 'present')   ?? {}) as Partial<EmployeeAddress>;
    const xAddr = (employee.addresses?.find((a: any) => a.address_type === 'permanent') ?? {}) as Partial<EmployeeAddress>;

    methods.reset({
      // ── Role & Identity ──────────────────────────────────────────────────
      first_name: employee.first_name, middle_name: employee.middle_name ?? '',
      last_name: employee.last_name, status: employee.status as any,
      employment_type: employee.employment_type,
      company_id:        employee.company_id,
      avatar_url:        employee.avatar_url ?? null,
      email:             employee.email ?? '',      // "Personal Email"
      phone:             employee.phone ?? '',       // "Personal Mobile Number"
      employee_code:     employee.employee_code ?? null,
      department_id:     employee.department_id ?? undefined,
      sub_department_id: employee.sub_department_id ?? undefined,
      designation_id:    employee.designation_id ?? undefined,
      sub_designation_id: employee.sub_designation_id ?? undefined,

      // ── Location & Attendance ────────────────────────────────────────────
      working_site: employee.working_site ?? undefined, working_city: employee.working_city ?? undefined,
      working_state_country: employee.working_state_country ?? undefined,
      pay_register_location: employee.pay_register_location ?? undefined,
      actual_doj: employee.actual_doj ?? '', current_doj: (employee as any).current_doj ?? '',
      weekly_off: employee.weekly_off ?? '',
      shift_category: (employee as any).shift_category ?? undefined,
      shift_id: employee.shift_id ?? undefined,
      grace_minutes: employee.grace_minutes ?? undefined,

      // ── Managers & Work Contact ──────────────────────────────────────────
      l1_manager_id: employee.l1_manager_id ?? null, l2_manager_id: employee.l2_manager_id ?? null,
      official_email:  employee.official_email ?? '',
      official_mobile: employee.official_mobile ?? '',

      // ── Commitment & Probation ───────────────────────────────────────────
      commitment: cp.commitment ?? false, commitment_term: (cp.commitment_term as any) ?? undefined,
      commitment_entered_on: cp.commitment_entered_on ?? '',
      commitment_end_date: cp.commitment_end_date ?? null,
      on_probation: cp.on_probation ?? false, probation_period: cp.probation_period ?? '',
      probation_end_date: cp.probation_end_date ?? null,
      probation_extended_period: cp.probation_extended_period ?? '',
      confirmation_status: (cp.confirmation_status as any) ?? null, confirmed_on: cp.confirmed_on ?? '',

      // ── Statutory Schemes ────────────────────────────────────────────────
      pf_status: sch.pf_status ?? false, uan_number: sch.uan_number ?? '',
      epfo_member_id: sch.epfo_member_id ?? '', pf_contribution_pct: sch.pf_contribution_pct ?? undefined,
      pf_employer_from: (sch.pf_employer_from as any) ?? undefined,
      pf_employee_12: sch.pf_employee_12 ?? undefined,
      eps_employer_833: sch.eps_employer_833 ?? undefined,
      epf_eps_diff_367: sch.epf_eps_diff_367 ?? undefined,
      esic_status: sch.esic_status ?? false,
      esic_number: sch.esic_number ?? '',
      esi_employee_pct: (sch as any).esi_employee_pct ?? undefined,
      esi_employer_pct: (sch as any).esi_employer_pct ?? undefined,
      mediclaim_status: sch.mediclaim_status ?? 'No',
      mediclaim_number: sch.mediclaim_number ?? '', mediclaim_amount: sch.mediclaim_amount ?? undefined,
      rd_scheme: sch.rd_scheme ?? false, rd_term: (sch.rd_term as any) ?? undefined,
      rd_opening_date: sch.rd_opening_date ?? '', rd_account_number: sch.rd_account_number ?? '',
      rd_deduction_from: (sch.rd_deduction_from as any) ?? undefined,
      rd_amount_employee: sch.rd_amount_employee ?? undefined, rd_amount_employer: sch.rd_amount_employer ?? undefined,
      rd_maturity_date: sch.rd_maturity_date ?? null,
      rd_maturity_amount: sch.rd_maturity_amount ?? null,
      rd_status: sch.rd_status ?? null,

      // ── Personal Profile (personal_email/mobile removed — now email/phone above)
      date_of_birth: p.date_of_birth ?? '', gender: p.gender ?? undefined,
      shirt_size: p.shirt_size ?? '', tshirt_size: p.tshirt_size ?? '',
      nationality: p.nationality ?? '', religion: p.religion ?? '',
      blood_group: p.blood_group ?? undefined,

      // ── Address ───────────────────────────────────────────────────────────
      present_house_type: pAddr.house_type ?? undefined, present_house_no: pAddr.house_no ?? '',
      present_area: pAddr.area ?? '', present_district: pAddr.district ?? '',
      present_city: pAddr.city ?? '', present_state: pAddr.state ?? '',
      present_country: pAddr.country ?? 'India', present_pincode: pAddr.pincode ?? '',
      perm_address_type: (xAddr as any).perm_address_type ?? (xAddr.house_no ? 'Different' : 'Not Applicable'),
      perm_house_type: xAddr.house_type ?? undefined,
      perm_house_no: xAddr.house_no ?? '',
      perm_area: xAddr.area ?? '',
      perm_district: xAddr.district ?? '',
      perm_city: xAddr.city ?? '',
      perm_state: xAddr.state ?? '', perm_country: xAddr.country ?? '',
      perm_pincode: xAddr.pincode ?? '',

      // ── Family & Emergency (marital_status + spouse + children moved here from Personal Profile) ─────
      marital_status: p.marital_status ?? undefined,
      marriage_date: p.marriage_date ?? '', spouse_name: p.spouse_name ?? '',
      spouse_dob: p.spouse_dob ?? '',
      child1_name: p.child1_name ?? '', child1_gender: (p as any).child1_gender ?? undefined, child1_dob: p.child1_dob ?? '',
      child2_name: p.child2_name ?? '', child2_gender: (p as any).child2_gender ?? undefined, child2_dob: p.child2_dob ?? '',
      child3_name: p.child3_name ?? '', child3_gender: (p as any).child3_gender ?? undefined, child3_dob: p.child3_dob ?? '',
      father_salutation: (fam.father_salutation as any) ?? undefined, father_name: fam.father_name ?? '',
      father_dob: fam.father_dob ?? '', father_occupation: fam.father_occupation ?? '',
      mother_salutation: (fam.mother_salutation as any) ?? undefined, mother_name: fam.mother_name ?? '',
      mother_dob: fam.mother_dob ?? '',
      mother_occupation: fam.mother_occupation ?? '',
      family_members:     (employee.familyMembers ?? []) as any,
      emergency_contacts: (employee.emergencyContacts ?? []) as any,

      // ── IDs & Bank ────────────────────────────────────────────────────────
      aadhaar_number: st.aadhaar_number ?? '', aadhaar_name: st.aadhaar_name ?? '',
      aadhaar_dob: st.aadhaar_dob ?? '', aadhaar_address: st.aadhaar_address ?? '',
      aadhaar_scan_url: st.aadhaar_scan_url ?? '',
      pan_number: st.pan_number ?? '', pan_full_name: st.pan_full_name ?? '',
      pan_dob: st.pan_dob ?? '', pan_parent_spouse_name: st.pan_parent_spouse_name ?? '',
      pan_scan_url: st.pan_scan_url ?? '',
      passport_number: st.passport_number ?? '', passport_full_name: st.passport_full_name ?? '',
      passport_nationality: st.passport_nationality ?? '',
      passport_issue_date: st.passport_issue_date ?? '', passport_expiry: st.passport_expiry ?? '',
      passport_place_of_issue: st.passport_place_of_issue ?? '',
      passport_scan_url: st.passport_scan_url ?? '',
      yellow_fever: (st as any).yellow_fever ?? false,
      yellow_fever_date: (st as any).yellow_fever_date ?? '',
      driving_license_number: st.driving_license_number ?? '',
      driving_license_name: st.driving_license_name ?? '',
      driving_license_issue_date: st.driving_license_issue_date ?? '',
      driving_license_expiry: st.driving_license_expiry ?? '',
      driving_license_authority: st.driving_license_authority ?? '',
      driving_license_scan_url: st.driving_license_scan_url ?? '',
      vaccinations: (employee.vaccinations ?? []) as any,
      documents:    (employee.documents ?? []) as any,
      personal_bank_name: pb.bank_name ?? '', personal_bank_account: pb.account_number ?? '',
      personal_ifsc: pb.ifsc_code ?? '', personal_bank_branch: pb.branch_name ?? '',

      // ── Experience & Education (both arrays now) ──────────────────────────
      is_experienced: (employee as any).experienceFlag?.is_experienced ?? false,
      experience: (employee.experience ?? []) as any,
      education:  (employee.education ?? []) as any,

      // ── Compensation ──────────────────────────────────────────────────────
      salary_mode: cur.salary_mode ?? undefined,
      current_basic: cur.basic ?? undefined, current_hra: cur.hra ?? undefined,
      current_allowance1: cur.allowance1 ?? undefined, current_amdb: cur.amdb_pm ?? undefined,
      joining_basic: joi.basic ?? undefined, joining_hra: joi.hra ?? undefined,
      joining_allowance1: joi.allowance1 ?? undefined, joining_amdb: joi.amdb_pm ?? undefined,
      asset_deduction_applicable: ad.asset_deduction_applicable ?? false,
      security_amount: ad.security_amount ?? undefined,
      deduction_months: ad.deduction_months ?? undefined,
      deduction_from: ad.deduction_from ?? undefined,
      monthly_deduction: ad.monthly_deduction ?? undefined,
      final_monthly_deduction: ad.final_monthly_deduction ?? undefined,

      // ── HR Joining Checklist ──────────────────────────────────────────────
      offer_letter: doc.offer_letter ?? false, address_verification: doc.address_verification ?? false,
      service_agreement: doc.service_agreement ?? false, indemnity_bond: doc.indemnity_bond ?? false,
      asset_deduction_letter: doc.asset_deduction_letter ?? false,
      account_opening_letter: doc.account_opening_letter ?? false, nda: doc.nda ?? false,
      remarks: (doc as any).remarks ?? '',
    } as FullEmployeeForm);

    // Mark a step "done" only when its REQUIRED fields are actually filled —
    // reuse the same STEP_SCHEMA_MAP the wizard validates each step against, so
    // an incomplete edit/draft no longer shows 100%.
    const values = methods.getValues();
    const done = new Set<number>();
    visibleSteps.forEach((s, idx) => {
      if (s.key === 'review') return;
      const schema = STEP_SCHEMA_MAP[s.key as StepSchemaKey];
      if (!schema || (schema as any).safeParse(values).success) done.add(idx);
    });
    setCompletedSet(done);
  }, [employee, methods, visibleSteps]);

  // Unsaved changes guard
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (!isDirty) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [isDirty]);

  // Track dirty state so the unsaved-changes guard works. (Timed auto-save is
  // intentionally disabled — draft saving is manual via the "Save Draft" button.)
  useEffect(() => {
    const sub = methods.watch((_v, { type }) => { if (type === 'change') setIsDirty(true); });
    return () => sub.unsubscribe();
  }, [methods]);

  const triggerAutoSave = useCallback((manual = false) => {
    if (!step) return;
    setDraftSaving(true);
    draftMutation.mutate({ employee_id: savedId, step: step.key, form_data: methods.getValues(), session_id: sidRef.current },
      {
        onSuccess: (res: any) => {
          const newId = res?.data?.employeeId;
          if (newId && !savedId) setSavedId(newId); // draft silently created the employee — pick up the id
          if (manual && !res?.data?.persisted && res?.data?.reason) {
            showToast(res.data.reason);
          }
        },
        onSettled: () => { setDraftSaving(false); setDraftSavedAt(new Date()); },
      });
  }, [step, savedId, methods, draftMutation]);

  // Per-step validation
  const validateStep = useCallback(async (): Promise<boolean> => {
    if (!step || step.key === 'review') return true;
    const schema = STEP_SCHEMA_MAP[step.key as StepSchemaKey];
    if (!schema) return true;
    const result = (schema as any).safeParse(methods.getValues());
    if (!result.success) {
      await methods.trigger(Object.keys(result.error.flatten().fieldErrors) as any);
      setErrorSet(prev => new Set([...prev, currentIdx]));
      return false;
    }
    setErrorSet(prev => { const n = new Set(prev); n.delete(currentIdx); return n; });
    return true;
  }, [step, currentIdx, methods]);

  // Build payload per step
  const buildPayload = useCallback((key: string): object => {
    const v = methods.getValues();
    const c = (x: any) => (x === '' || x === undefined) ? null : x;
    const n = (x: any) => (x === '' || x === undefined || x === null) ? null : Number(x);
    switch (key) {
      case 'role_identity':
        return { company_id: n(v.company_id), first_name: v.first_name?.trim(), middle_name: c(v.middle_name), last_name: v.last_name?.trim(), status: v.status, employment_type: v.employment_type, department_id: n(v.department_id), sub_department_id: n(v.sub_department_id), designation_id: n(v.designation_id), sub_designation_id: n(v.sub_designation_id), email: v.email?.toLowerCase().trim() ?? null, phone: v.phone?.trim() ?? null };

      case 'location_attendance':
        return { working_state_country: n(v.working_state_country), working_city: n(v.working_city), working_site: n(v.working_site), pay_register_location: n(v.pay_register_location), actual_doj: c(v.actual_doj), current_doj: c((v as any).current_doj), weekly_off: c(v.weekly_off), shift_category: c((v as any).shift_category), shift_id: n(v.shift_id), grace_minutes: n(v.grace_minutes) };

      case 'managers_work_contact':
        return { l1_manager_id: n(v.l1_manager_id), l2_manager_id: n(v.l2_manager_id), official_email: v.official_email?.toLowerCase().trim() || null, official_mobile: v.official_mobile?.trim() || null };

      case 'commitment_probation':
        return { commitment: v.commitment ?? false, commitment_term: c(v.commitment_term), commitment_entered_on: c(v.commitment_entered_on), on_probation: v.on_probation ?? false, probation_period: c(v.probation_period), probation_status: c(v.probation_status) };

      case 'statutory_schemes':
        return { pf_status: v.pf_status ?? false, uan_number: c(v.uan_number), epfo_member_id: c(v.epfo_member_id), pf_contribution_pct: n(v.pf_contribution_pct), pf_employer_from: c(v.pf_employer_from), pf_employee_12: n(v.pf_employee_12), eps_employer_833: n(v.eps_employer_833), epf_eps_diff_367: n(v.epf_eps_diff_367), esic_status: v.esic_status ?? false, esic_number: c(v.esic_number), esi_employee_pct: n((v as any).esi_employee_pct), esi_employer_pct: n((v as any).esi_employer_pct), mediclaim_status: v.mediclaim_status ?? 'No', mediclaim_number: c(v.mediclaim_number), mediclaim_amount: c(v.mediclaim_amount), rd_scheme: v.rd_scheme ?? false, rd_term: c(v.rd_term), rd_opening_date: c(v.rd_opening_date), rd_account_number: c(v.rd_account_number), rd_deduction_from: c(v.rd_deduction_from), rd_amount_employee: n(v.rd_amount_employee), rd_amount_employer: n(v.rd_amount_employer), rd_maturity_date: c(v.rd_maturity_date), rd_maturity_amount: n(v.rd_maturity_amount), rd_status: c(v.rd_status) };

      case 'compensation':
        return { salary_mode: v.salary_mode, current_basic: n(v.current_basic), current_hra: n(v.current_hra), current_allowance1: n(v.current_allowance1), current_amdb: n(v.current_amdb), joining_basic: n(v.joining_basic), joining_hra: n(v.joining_hra), joining_allowance1: n(v.joining_allowance1), joining_amdb: n(v.joining_amdb), asset_deduction_applicable: v.asset_deduction_applicable ?? false, security_amount: n(v.security_amount), deduction_months: n(v.deduction_months), deduction_from: c(v.deduction_from), monthly_deduction: n(v.monthly_deduction), final_monthly_deduction: n(v.final_monthly_deduction) };

      case 'hr_joining_checklist':
        return { offer_letter: v.offer_letter ?? false, address_verification: v.address_verification ?? false, service_agreement: v.service_agreement ?? false, indemnity_bond: v.indemnity_bond ?? false, asset_deduction_letter: v.asset_deduction_letter ?? false, account_opening_letter: v.account_opening_letter ?? false, nda: v.nda ?? false, remarks: c(v.remarks) };

      case 'personal_profile':
        return { date_of_birth: c(v.date_of_birth), gender: c(v.gender), shirt_size: c(v.shirt_size), tshirt_size: c(v.tshirt_size), nationality: c(v.nationality), religion: c(v.religion), blood_group: c(v.blood_group) };

      case 'address':
        return { present_house_type: c(v.present_house_type), present_house_no: c(v.present_house_no), present_area: c(v.present_area), present_district: c(v.present_district), present_city: c(v.present_city), present_state: c(v.present_state), present_country: c(v.present_country), present_pincode: c(v.present_pincode), perm_address_type: c(v.perm_address_type), perm_house_type: c(v.perm_house_type), perm_house_no: c(v.perm_house_no), perm_area: c(v.perm_area), perm_district: c(v.perm_district), perm_city: c(v.perm_city), perm_state: c(v.perm_state), perm_country: c(v.perm_country), perm_pincode: c(v.perm_pincode) };

      case 'family_emergency':
        return { marital_status: c(v.marital_status), marriage_date: c((v as any).marriage_date), spouse_name: c((v as any).spouse_name), spouse_dob: c((v as any).spouse_dob), child1_name: c((v as any).child1_name), child1_gender: c((v as any).child1_gender), child1_dob: c((v as any).child1_dob), child2_name: c((v as any).child2_name), child2_gender: c((v as any).child2_gender), child2_dob: c((v as any).child2_dob), child3_name: c((v as any).child3_name), child3_gender: c((v as any).child3_gender), child3_dob: c((v as any).child3_dob), father_salutation: c(v.father_salutation), father_name: c(v.father_name), father_dob: c(v.father_dob), father_occupation: c(v.father_occupation), mother_salutation: c(v.mother_salutation), mother_name: c(v.mother_name), mother_dob: c(v.mother_dob), mother_occupation: c(v.mother_occupation),
          // drop the always-present blank rows — only send rows the user actually filled
          family_members: (v.family_members ?? []).filter((m: any) => m && String(m.name ?? '').trim()),
          emergency_contacts: (v.emergency_contacts ?? []).filter((cn: any) => cn && (String(cn.contact_name ?? '').trim() || String(cn.contact_number ?? '').trim())) };

      case 'ids_bank':
        return { aadhaar_number: c(v.aadhaar_number), aadhaar_name: c(v.aadhaar_name), aadhaar_dob: c(v.aadhaar_dob), aadhaar_address: c(v.aadhaar_address), pan_number: v.pan_number?.toUpperCase() || null, pan_full_name: c(v.pan_full_name), pan_dob: c(v.pan_dob), pan_parent_spouse_name: c(v.pan_parent_spouse_name), passport_number: c(v.passport_number), passport_full_name: c(v.passport_full_name), passport_nationality: c(v.passport_nationality), passport_issue_date: c(v.passport_issue_date), passport_expiry: c(v.passport_expiry), passport_place_of_issue: c(v.passport_place_of_issue), yellow_fever: (v as any).yellow_fever ?? false, yellow_fever_date: c((v as any).yellow_fever_date), driving_license_number: c(v.driving_license_number), driving_license_name: c(v.driving_license_name), driving_license_issue_date: c(v.driving_license_issue_date), driving_license_expiry: c(v.driving_license_expiry), driving_license_authority: c(v.driving_license_authority),
          vaccinations: (v.vaccinations ?? []).filter((x: any) => x && String(x.vaccine_name ?? '').trim()),
          documents: (v.documents ?? []).filter((x: any) => x && String(x.file_url ?? '').trim()),
          personal_bank_name: c(v.personal_bank_name), personal_bank_account: c(v.personal_bank_account), personal_ifsc: v.personal_ifsc?.toUpperCase() || null, personal_bank_branch: c(v.personal_bank_branch) };

      case 'experience_education':
        return {
          is_experienced: v.is_experienced ?? false,
          experience: (v.experience ?? []).filter((e: any) => e && String(e.last_company_name ?? '').trim()),
          education:  (v.education ?? []).filter((e: any) => e && String(e.highest_education ?? '').trim()),
        };

      default: return {};
    }
  }, [methods]);

  const handleNext = async () => {
    const valid = await validateStep();
    if (!valid || !step) return;
    if (mode === 'create' && currentIdx === 0 && !savedId) {
      const v = methods.getValues();
      const res: any = await createMutation.mutateAsync({
        first_name: v.first_name?.trim(), middle_name: v.middle_name?.trim() || null, last_name: v.last_name?.trim(),
        status: v.status, employment_type: v.employment_type,
        department_id: v.department_id ? Number(v.department_id) : undefined,
        sub_department_id: v.sub_department_id ? Number(v.sub_department_id) : undefined,
        designation_id: v.designation_id ? Number(v.designation_id) : undefined,
        sub_designation_id: v.sub_designation_id ? Number(v.sub_designation_id) : undefined,
        email: v.email?.toLowerCase().trim() || undefined,
        phone: v.phone?.trim() || undefined,
        company_id: v.company_id ? Number(v.company_id) : undefined,
      } as Partial<Employee>);
      // employee_code is never sent — it's generated automatically once HR + Candidate parts both reach 100%
      const newId = res.data?.id ?? res.id;
      setSavedId(newId);

      if (pendingAvatarRef.current) {
        try {
          await employeeService.uploadAvatar(newId, pendingAvatarRef.current);
        } catch (e) {
          // Non-fatal — employee creation already succeeded. The photo can
          // still be added later from Step 1 in edit mode.
        }
        pendingAvatarRef.current = null;
      }
    } else if (savedId && step.key !== 'review') {
      await updateMutation.mutateAsync({ step: step.key as StepSchemaKey, data: buildPayload(step.key) });
    }
    setCompletedSet(prev => new Set([...prev, currentIdx]));
    setCurrentIdx(p => p + 1);
    setIsDirty(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const valid = await validateStep();
    if (!valid || !savedId) return;
    if (step && step.key !== 'review') await updateMutation.mutateAsync({ step: step.key as StepSchemaKey, data: buildPayload(step.key) });
    draftMutation.mutate({ employee_id: savedId, step: 'completed', form_data: {}, session_id: sidRef.current });
    onSuccess ? onSuccess({ id: savedId } as Employee) : router.push(`/employees/${savedId}`);
  };

  // % over the data steps only (the final Review step is never a "completed" step)
  const dataStepCount = visibleSteps.filter(s => s.key !== 'review').length;
  const overallPct = dataStepCount ? Math.round((completedSet.size / dataStepCount) * 100) : 0;

  const handlePhotoSelected = async (file: File) => {
    if (savedId) {
      try {
        const res: any = await employeeService.uploadAvatar(savedId, file);
        methods.setValue('avatar_url', res.data?.avatar_url ?? URL.createObjectURL(file), { shouldDirty: false });
      } catch {
        showToast('Photo upload failed — please try again');
      }
    } else {
      pendingAvatarRef.current = file;
      methods.setValue('avatar_url', URL.createObjectURL(file), { shouldDirty: false }); // local preview only, not sent to the server
    }
  };

  function renderStep() {
    if (!step) return null;
    const p = { isEdit: mode === 'edit', employeeId: savedId };
    switch (step.key) {
      case 'role_identity':          return <StepRoleIdentity {...p} avatarUrl={methods.watch('avatar_url')} onPhotoSelected={handlePhotoSelected} />;
      case 'location_attendance':    return <StepLocationAttendance {...p} />;
      case 'managers_work_contact':  return <StepManagersWorkContact {...p} />;
      case 'commitment_probation':   return <StepCommitmentProbation {...p} />;
      case 'statutory_schemes':      return <StepStatutorySchemes {...p} />;
      case 'compensation':           return <StepCompensation {...p} />;
      case 'hr_joining_checklist':   return <StepHrJoiningChecklist {...p} />;
      case 'personal_profile':       return <StepPersonalProfile {...p} />;
      case 'address':                return <StepAddress {...p} />;
      case 'family_emergency':       return <StepFamilyEmergency {...p} />;
      case 'ids_bank':                return <StepIdsBank {...p} />;
      case 'experience_education':   return <StepExperienceEducation {...p} />;
      case 'review':                  return <StepReview employeeId={savedId} methods={methods} onEdit={(key) => {
        const i = visibleSteps.findIndex(s => s.key === key);
        if (i >= 0) { setCurrentIdx(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      }} />;
      default:                        return null;
    }
  }

  return (
    <FormProvider {...methods}>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Sidebar */}
        <aside className="card" style={{ padding: 0, position: 'sticky', top: 76, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{mode === 'edit' ? 'Edit Employee' : 'New Employee'}</div>
            <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? 'var(--green)' : 'var(--blue)', borderRadius: 4, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{overallPct}% · HR {hrDone}/{hrSteps.length} · Candidate {candidateDone}/{candidateSteps.length}</div>
          </div>

          <nav>
            {(['hr', 'candidate', 'review'] as const).map(part => (
              <div key={part}>
                <div style={{ padding: '10px 18px 4px', fontSize: 10, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {part === 'hr' ? 'Part 1 · HR' : part === 'candidate' ? 'Part 2 · Candidate' : 'Finalize'}
                </div>
                {visibleSteps.map((s, idx) => {
                  if (s.part !== part) return null;
                  const isActive = idx === currentIdx;
                  const isDone   = completedSet.has(idx);
                  const hasErr   = errorSet.has(idx);
                  return (
                    <div key={s.key} role="button" tabIndex={0}
                      aria-current={isActive ? 'step' : undefined}
                      onClick={() => setCurrentIdx(idx)}
                      onKeyDown={e => e.key === 'Enter' && setCurrentIdx(idx)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', cursor: 'pointer', background: isActive ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'transparent'}`, opacity: 1, transition: 'all .15s', userSelect: 'none' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: hasErr ? 'var(--red-lt)' : isDone ? 'var(--green-lt)' : isActive ? 'var(--blue-lt)' : 'var(--surface2)', color: hasErr ? 'var(--red)' : isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--ink4)', border: `1.5px solid ${hasErr ? 'var(--red-bd)' : isDone ? 'var(--green-bd)' : isActive ? 'var(--blue-md)' : 'var(--border)'}` }}>
                        {hasErr ? '✕' : isDone ? '✓' : idx + 1}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--blue)' : isDone ? 'var(--ink2)' : 'var(--ink3)', flex: 1, lineHeight: 1.3 }}>{s.label}</span>
                      {s.sensitive && <span style={{ fontSize: 10, color: 'var(--ink4)' }} title="Sensitive data">🔒</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink4)', minHeight: 36, display: 'flex', alignItems: 'center', gap: 6 }}>
            {draftSaving ? <>⟳ Saving draft…</> : draftSavedAt ? <>✓ Saved {draftSavedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</> : <>Use “Save Draft” to save progress</>}
          </div>
        </aside>

        {/* Content */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>{currentIdx + 1}</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{step?.label}</h2>
              {step?.sensitive && <div style={{ marginTop: 5, fontSize: 11, color: 'var(--amber)', background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)', padding: '3px 10px', display: 'inline-block' }}>⚠️ Sensitive data</div>}
            </div>
          </div>

          {renderStep()}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-sec" disabled={isFirst || isSaving} onClick={() => setCurrentIdx(p => p - 1)}>← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-sec btn-sm" onClick={() => triggerAutoSave(true)} disabled={draftSaving} style={{ fontSize: 11 }}>{draftSaving ? 'Saving…' : 'Save Draft'}</button>
              {!isLast
                ? <button type="button" className="btn btn-pri" onClick={handleNext} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save & Continue →'}</button>
                : <button type="button" className="btn btn-pri" onClick={handleSubmit} disabled={isSaving || !savedId} style={{ background: 'var(--green)', minWidth: 155 }}>{isSaving ? 'Submitting…' : mode === 'edit' ? '✓ Update Employee' : '✓ Create Employee'}</button>}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}