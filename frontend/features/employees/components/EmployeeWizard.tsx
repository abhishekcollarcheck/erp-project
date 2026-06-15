'use client';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { fullEmployeeSchema, STEP_SCHEMA_MAP, type FullEmployeeForm, type StepSchemaKey } from '../validations/employee.schema';
import { WIZARD_STEPS } from '../constants/employee.constants';
import { useCreateEmployee, useUpdateStep, useSaveDraft, useNextCode } from '../hooks/useEmployees';
import { usePermission } from '../../auth/hooks/usePermission';

import { StepBasic }          from './steps/StepBasic';
import { StepEmployment }     from './steps/StepEmployment';
import { StepReporting }      from './steps/StepReporting';
import { StepCommitment }     from './steps/StepCommitment';
import { StepSchemes }        from './steps/StepSchemes';
import { StepPersonal }       from './steps/StepPersonal';
import { StepAddress }        from './steps/StepAddress';
import { StepFamily }         from './steps/StepFamily';
import { StepEmergency }      from './steps/StepEmergency';
import { StepStatutory }      from './steps/StepStatutory';
import { StepBank }           from './steps/StepBank';
import { StepExperience }     from './steps/StepExperience';
import { StepSalary }         from './steps/StepSalary';
import { StepOnboardingDocs } from './steps/StepOnboardingDocs';
import { StepReview }         from './steps/StepReview';

import type { Employee, CommitmentProbation, EmployeePersonal, EmployeeFamily,
  EmployeeStatutory, EmployeeSchemes, EmployeeBankDetail, EmployeeSalary,
  EmployeeAssetDeduction, EmployeeExperience, EmployeeEducation, OnboardingDocs,
  EmployeeAddress, EmergencyContact } from '../types/employee.types';

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

  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [savedId,      setSavedId]      = useState<number | null>(employee?.id ?? null);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set(mode === 'edit' ? WIZARD_STEPS.map((_,i)=>i) : []));
  const [errorSet,     setErrorSet]     = useState<Set<number>>(new Set());
  const [isDirty,      setIsDirty]      = useState(false);
  const [draftSaving,  setDraftSaving]  = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  const visibleSteps = useMemo(() => WIZARD_STEPS.filter(s => !s.sensitive || canSeeSensitive), [canSeeSensitive]);
  const step    = visibleSteps[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast  = currentIdx === visibleSteps.length - 1;

  const { data: nextCodeData }  = useNextCode();
  const createMutation  = useCreateEmployee();
  const updateMutation  = useUpdateStep(savedId ?? 0);
  const draftMutation   = useSaveDraft();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<FullEmployeeForm>({
    resolver: zodResolver(fullEmployeeSchema),
    mode: 'onTouched',
    defaultValues: {
      reference_code: '',
      status: 'Active', employment_type: 'Permanent', saturday_off: '',
      perm_address_type: 'Same as Present', commitment: false, on_probation: true,
      pf_status: false, esic_status: false, mediclaim_status: 'No', rd_scheme: false,
      yellow_fever: false, is_experienced: false, asset_deduction_applicable: false,
      offer_letter: false, address_verification: false, service_agreement: false,
      indemnity_bond: false, asset_deduction_letter: false, account_opening_letter: false, nda: false,
      company_id:        undefined as number | undefined,
      email:             '',
      phone:             '',
      department_id:     undefined as number | undefined,
      sub_department_id: undefined as number | undefined,
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
    const pb  = (employee.bankDetails?.find(b => b.bank_type === 'personal') ?? {}) as Partial<EmployeeBankDetail>;
    const ob  = (employee.bankDetails?.find(b => b.bank_type === 'official') ?? {}) as Partial<EmployeeBankDetail>;
    const cur = (employee.salaries?.find(s => s.salary_type === 'current')   ?? {}) as Partial<EmployeeSalary>;
    const joi = (employee.salaries?.find(s => s.salary_type === 'joining')   ?? {}) as Partial<EmployeeSalary>;
    const ad  = (employee.assetDeduction      ?? {}) as Partial<EmployeeAssetDeduction>;
    const exp = (employee.experience          ?? {}) as Partial<EmployeeExperience>;
    const edu = (employee.education           ?? {}) as Partial<EmployeeEducation>;
    const doc = (employee.onboardingDocs      ?? {}) as Partial<OnboardingDocs>;
    const pAddr = (employee.addresses?.find(a => a.address_type === 'present')   ?? {}) as Partial<EmployeeAddress>;
    const xAddr = (employee.addresses?.find(a => a.address_type === 'permanent') ?? {}) as Partial<EmployeeAddress>;
    const emg   = (employee.emergencyContacts?.[0] ?? {}) as Partial<EmergencyContact>;

    methods.reset({
      reference_code: employee.reference_code,
      first_name: employee.first_name, middle_name: employee.middle_name ?? '',
      last_name: employee.last_name, status: employee.status as any,
      employment_type: employee.employment_type, employee_code: employee.employee_code,
      company_id: employee.company_id,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      department_id: employee.department_id ?? undefined,
      sub_department_id: employee.sub_department_id ?? undefined,
      designation_id: employee.designation_id ?? undefined, sub_designation: employee.sub_designation ?? '',
      working_site: employee.working_site ?? '', working_city: employee.working_city ?? '',
      working_state_country: employee.working_state_country ?? '',
      pay_register_location: employee.pay_register_location ?? '',
      saturday_off: employee.saturday_off ?? undefined, shift_id: employee.shift_id ?? null,
      grace_minutes: employee.grace_minutes ?? undefined,
      l1_manager_id: employee.l1_manager_id ?? undefined, l2_manager_id: employee.l2_manager_id ?? undefined,
      actual_doj: employee.actual_doj ?? '', current_doj: employee.current_doj ?? '',
      commitment: cp.commitment ?? false, commitment_term: (cp.commitment_term as any) ?? undefined,
      commitment_entered_on: cp.commitment_entered_on ?? '',
      on_probation: cp.on_probation ?? true, probation_period: cp.probation_period ?? '',
      probation_extended_period: cp.probation_extended_period ?? '',
      confirmation_status: (cp.confirmation_status as any) ?? undefined, confirmed_on: cp.confirmed_on ?? '',
      pf_status: sch.pf_status ?? false, uan_number: sch.uan_number ?? '',
      epfo_member_id: sch.epfo_member_id ?? '', pf_contribution_pct: sch.pf_contribution_pct ?? undefined,
      pf_employer_from: (sch.pf_employer_from as any) ?? undefined, esic_status: sch.esic_status ?? false,
      esic_number: sch.esic_number ?? '', mediclaim_status: sch.mediclaim_status ?? 'No',
      mediclaim_number: sch.mediclaim_number ?? '', mediclaim_amount: sch.mediclaim_amount ?? undefined,
      rd_scheme: sch.rd_scheme ?? false, rd_term: (sch.rd_term as any) ?? undefined,
      rd_opening_date: sch.rd_opening_date ?? '', rd_account_number: sch.rd_account_number ?? '',
      rd_deduction_from: (sch.rd_deduction_from as any) ?? undefined,
      rd_amount_employee: sch.rd_amount_employee ?? undefined, rd_amount_employer: sch.rd_amount_employer ?? undefined,
      personal_email: p.personal_email ?? '', personal_mobile: p.personal_mobile ?? '',
      date_of_birth: p.date_of_birth ?? '', gender: p.gender ?? undefined,
      shirt_size: p.shirt_size ?? '', tshirt_size: p.tshirt_size ?? '',
      nationality: p.nationality ?? 'Indian', religion: p.religion ?? '',
      blood_group: p.blood_group ?? undefined, marital_status: p.marital_status ?? undefined,
      marriage_date: p.marriage_date ?? '', spouse_name: p.spouse_name ?? '',
      spouse_dob: p.spouse_dob ?? '',
      child1_name: p.child1_name ?? '', child1_dob: p.child1_dob ?? '',
      child2_name: p.child2_name ?? '', child2_dob: p.child2_dob ?? '',
      child3_name: p.child3_name ?? '', child3_dob: p.child3_dob ?? '',
      present_house_type: pAddr.house_type ?? undefined, present_house_no: pAddr.house_no ?? '',
      present_area: pAddr.area ?? '', present_district: pAddr.district ?? '',
      present_city: pAddr.city ?? '', present_state: pAddr.state ?? '',
      present_country: pAddr.country ?? 'India', present_pincode: pAddr.pincode ?? '',
      perm_address_type: xAddr.is_same_as_present ? 'Same as Present' : 'Other',
      perm_house_type: xAddr.house_type ?? undefined,
      perm_house_no: xAddr.house_no ?? '',
      perm_area: xAddr.area ?? '',
      perm_district: xAddr.district ?? '',
      perm_city: xAddr.city ?? '',
      perm_state: xAddr.state ?? '', perm_country: xAddr.country ?? '',
      perm_pincode: xAddr.pincode ?? '',
      father_salutation: (fam.father_salutation as any) ?? undefined, father_name: fam.father_name ?? '',
      father_age_dob: fam.father_age_dob ?? '', father_occupation: fam.father_occupation ?? '',
      father_status: (fam.father_status as any) ?? undefined,
      mother_salutation: (fam.mother_salutation as any) ?? undefined, mother_name: fam.mother_name ?? '',
      mother_age_dob: fam.mother_age_dob ?? '',
      mother_occupation: (fam.mother_occupation as any) ?? undefined,
      contact_name: emg.contact_name ?? '', contact_number: emg.contact_number ?? '',
      relationship: emg.relationship ?? '',
      passport_number: st.passport_number ?? '', passport_expiry: st.passport_expiry ?? '',
      yellow_fever: st.yellow_fever ?? false, yellow_fever_date: st.yellow_fever_date ?? '',
      driving_license_number: st.driving_license_number ?? '',
      driving_license_expiry: st.driving_license_expiry ?? '',
      aadhaar_number: st.aadhaar_number ?? '', aadhaar_address: st.aadhaar_address ?? '',
      pan_number: st.pan_number ?? '', pan_full_name: st.pan_full_name ?? '',
      pan_dob: st.pan_dob ?? '', pan_parent_spouse_name: st.pan_parent_spouse_name ?? '',
      personal_bank_name: pb.bank_name ?? '', personal_bank_account: pb.account_number ?? '',
      personal_ifsc: pb.ifsc_code ?? '', personal_bank_branch: pb.branch_name ?? '',
      official_bank_name: ob.bank_name ?? '', official_bank_account: ob.account_number ?? '',
      official_ifsc: ob.ifsc_code ?? '', official_bank_branch: ob.branch_name ?? '',
      is_experienced: exp.is_experienced ?? false, last_company_name: exp.last_company_name ?? '',
      last_designation: exp.last_designation ?? '', last_working_day: exp.last_working_day ?? '',
      exp_contact_name: exp.exp_contact_name ?? '', exp_contact_number: exp.exp_contact_number ?? '',
      exp_contact_designation: exp.exp_contact_designation ?? '',
      last_inhand_salary: exp.last_inhand_salary ?? undefined,
      highest_education: edu.highest_education ?? '', education_stream: edu.education_stream ?? '',
      education_mode: edu.education_mode ?? '',
      institute_name: edu.institute_name ?? '', passing_year: edu.passing_year ?? undefined,
      education_marks: edu.education_marks ?? '',
      salary_mode: cur.salary_mode ?? undefined,
      current_basic: cur.basic ?? 0, current_hra: cur.hra ?? 0,
      current_allowance1: cur.allowance1 ?? 0, current_amdb: cur.amdb_pm ?? 0,
      joining_basic: joi.basic ?? 0, joining_hra: joi.hra ?? 0,
      joining_allowance1: joi.allowance1 ?? 0, joining_amdb: joi.amdb_pm ?? 0,
      asset_deduction_applicable: ad.asset_deduction_applicable ?? false,
      security_amount: ad.security_amount ?? undefined,
      deduction_months: ad.deduction_months ?? undefined,
      deduction_from: ad.deduction_from ?? undefined,
      monthly_deduction: ad.monthly_deduction ?? undefined,
      offer_letter: doc.offer_letter ?? false, address_verification: doc.address_verification ?? false,
      service_agreement: doc.service_agreement ?? false, indemnity_bond: doc.indemnity_bond ?? false,
      asset_deduction_letter: doc.asset_deduction_letter ?? false,
      account_opening_letter: doc.account_opening_letter ?? false, nda: doc.nda ?? false,
    } as FullEmployeeForm);
  }, [employee, methods]);

  // Auto-fill code
  useEffect(() => {
    if (mode === 'create' && nextCodeData && !methods.getValues('employee_code'))
      methods.setValue('employee_code', nextCodeData?.code, { shouldDirty: false });
  }, [nextCodeData, mode, methods]);

  // Unsaved changes guard
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (!isDirty) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [isDirty]);

  // Auto-save
  useEffect(() => {
    const sub = methods.watch(() => {
      setIsDirty(true);
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => triggerAutoSave(), 3000);
    });
    return () => { sub.unsubscribe(); clearTimeout(autoSaveTimer.current); };
  }, [methods, savedId]); // eslint-disable-line

  const triggerAutoSave = useCallback(() => {
    if (!step) return;
    setDraftSaving(true);
    draftMutation.mutate({ employee_id: savedId, step: step.key, form_data: methods.getValues(), session_id: sidRef.current },
      { onSettled: () => { setDraftSaving(false); setDraftSavedAt(new Date()); } });
  }, [step, savedId, methods, draftMutation]);

  // Per-step validation
  const validateStep = useCallback(async (): Promise<boolean> => {
    if (!step || step.key === 'review') return true;
    const schema = STEP_SCHEMA_MAP[step.key as StepSchemaKey];
     console.log("CURRENT STEP:", step.key);
  console.log("SCHEMA:", schema);
  const values = methods.getValues();

  console.log("FORM VALUES:", values);
    if (!schema) return true;
    const result = (schema as any).safeParse(methods.getValues());
    if (!result.success) {
      if (!result.success) {

  console.log(
    "ZOD ERROR FULL:",
    result.error
  );

  console.log(
    "ZOD FLATTEN:",
    result.error.flatten()
  );

  console.log(
    "ZOD FIELD ERRORS:",
    result.error.flatten().fieldErrors
  );

  await methods.trigger(
    Object.keys(result.error.flatten().fieldErrors) as any
  );

  setErrorSet(prev => new Set([...prev, currentIdx]));

  return false;
}
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
      case 'basic': return { reference_code: c(v.reference_code), first_name: v.first_name?.trim(), middle_name: c(v.middle_name), last_name: v.last_name?.trim(), status: v.status, employment_type: v.employment_type, employee_code: c(v.employee_code), department_id: n(v.department_id), sub_department_id: n(v.sub_department_id), designation_id: n(v.designation_id), sub_designation: c(v.sub_designation), email: v.email?.toLowerCase().trim() ?? null, phone: v.phone?.trim() ?? null, company_id: n(v.company_id) };
      case 'employment': return { working_site: v.working_site?.trim(), working_city: v.working_city?.trim(), working_state_country: v.working_state_country?.trim(), pay_register_location: v.pay_register_location?.trim(), saturday_off: v.saturday_off ?? false, shift_id: n(v.shift_id), grace_minutes: n(v.grace_minutes) ?? 0 };
      case 'reporting': return { l1_manager_id: n(v.l1_manager_id), l2_manager_id: n(v.l2_manager_id), actual_doj: c(v.actual_doj), current_doj: c(v.current_doj) };
      case 'commitment': return { commitment: v.commitment ?? false, commitment_term: c(v.commitment_term), commitment_entered_on: c(v.commitment_entered_on), on_probation: v.on_probation ?? true, probation_period: c(v.probation_period), probation_extended_period: c(v.probation_extended_period), confirmation_status: c(v.confirmation_status), confirmed_on: c(v.confirmed_on) };
      case 'schemes': return { pf_status: v.pf_status ?? false, uan_number: c(v.uan_number), epfo_member_id: c(v.epfo_member_id), pf_contribution_pct: n(v.pf_contribution_pct), pf_employer_from: c(v.pf_employer_from), esic_status: v.esic_status ?? false, esic_number: c(v.esic_number), mediclaim_status: v.mediclaim_status ?? 'No', mediclaim_number: c(v.mediclaim_number), mediclaim_amount: n(v.mediclaim_amount), rd_scheme: v.rd_scheme ?? false, rd_term: c(v.rd_term), rd_opening_date: c(v.rd_opening_date), rd_account_number: c(v.rd_account_number), rd_deduction_from: c(v.rd_deduction_from), rd_amount_employee: n(v.rd_amount_employee), rd_amount_employer: n(v.rd_amount_employer) };
      case 'personal': return { personal_email: c(v.personal_email), personal_mobile: c(v.personal_mobile), date_of_birth: c(v.date_of_birth), gender: c(v.gender), shirt_size: c(v.shirt_size), tshirt_size: c(v.tshirt_size), nationality: c(v.nationality), religion: c(v.religion), blood_group: c(v.blood_group), marital_status: c(v.marital_status), marriage_date: c(v.marriage_date), spouse_name: c(v.spouse_name), spouse_dob: c(v.spouse_dob), child1_name: c(v.child1_name), child1_dob: c(v.child1_dob), child2_name: c(v.child2_name), child2_dob: c(v.child2_dob), child3_name: c(v.child3_name), child3_dob: c(v.child3_dob) };
      case 'address': return { present_house_type: v.present_house_type, present_house_no: v.present_house_no, present_area: c(v.present_area), present_district: v.present_district, present_city: v.present_city, present_state: v.present_state, present_country: v.present_country, present_pincode: v.present_pincode, perm_address_type: v.perm_address_type, perm_house_type: c(v.perm_house_type), perm_house_no: c(v.perm_house_no), perm_area: c(v.perm_area), perm_district: c(v.perm_district), perm_city: c(v.perm_city), perm_state: c(v.perm_state), perm_country: c(v.perm_country), perm_pincode: c(v.perm_pincode) };
      case 'family': return { father_salutation: c(v.father_salutation), father_name: c(v.father_name), father_age_dob: c(v.father_age_dob), father_occupation: c(v.father_occupation), father_status: c(v.father_status), mother_salutation: c(v.mother_salutation), mother_name: c(v.mother_name), mother_age_dob: c(v.mother_age_dob), mother_occupation: c(v.mother_occupation) };
      case 'emergency': return { contact_name: v.contact_name?.trim(), contact_number: v.contact_number?.trim(), relationship: v.relationship?.trim() };
      case 'statutory': return { passport_number: c(v.passport_number), passport_expiry: c(v.passport_expiry), yellow_fever: v.yellow_fever ?? false, yellow_fever_date: c(v.yellow_fever_date), driving_license_number: c(v.driving_license_number), driving_license_expiry: c(v.driving_license_expiry), aadhaar_number: c(v.aadhaar_number), aadhaar_address: c(v.aadhaar_address), pan_number: v.pan_number?.toUpperCase() ?? null, pan_full_name: c(v.pan_full_name), pan_dob: c(v.pan_dob), pan_parent_spouse_name: c(v.pan_parent_spouse_name) };
      case 'bank': return { personal_bank_name: c(v.personal_bank_name), personal_bank_account: c(v.personal_bank_account), personal_ifsc: v.personal_ifsc?.toUpperCase() ?? null, personal_bank_branch: c(v.personal_bank_branch), official_bank_name: c(v.official_bank_name), official_bank_account: c(v.official_bank_account), official_ifsc: v.official_ifsc?.toUpperCase() ?? null, official_bank_branch: c(v.official_bank_branch) };
      case 'experience': return { is_experienced: v.is_experienced ?? false, last_company_name: c(v.last_company_name), last_designation: c(v.last_designation), last_working_day: c(v.last_working_day), exp_contact_name: c(v.exp_contact_name), exp_contact_number: c(v.exp_contact_number), exp_contact_designation: c(v.exp_contact_designation), last_inhand_salary: n(v.last_inhand_salary), highest_education: c(v.highest_education), education_stream: c(v.education_stream), education_mode: c(v.education_mode), institute_name: c(v.institute_name), passing_year: n(v.passing_year), education_marks: c(v.education_marks) };
      case 'salary': return { salary_mode: v.salary_mode, current_basic: n(v.current_basic) ?? 0, current_hra: n(v.current_hra) ?? 0, current_allowance1: n(v.current_allowance1) ?? 0, current_amdb: n(v.current_amdb) ?? 0, joining_basic: n(v.joining_basic) ?? 0, joining_hra: n(v.joining_hra) ?? 0, joining_allowance1: n(v.joining_allowance1) ?? 0, joining_amdb: n(v.joining_amdb) ?? 0, asset_deduction_applicable: v.asset_deduction_applicable ?? false, security_amount: n(v.security_amount), deduction_months: c(v.deduction_months), deduction_from: c(v.deduction_from), monthly_deduction: n(v.monthly_deduction) };
      case 'onboarding_docs': return { offer_letter: v.offer_letter ?? false, address_verification: v.address_verification ?? false, service_agreement: v.service_agreement ?? false, indemnity_bond: v.indemnity_bond ?? false, asset_deduction_letter: v.asset_deduction_letter ?? false, account_opening_letter: v.account_opening_letter ?? false, nda: v.nda ?? false };
      default: return {};
    }
  }, [methods]);

  const handleNext = async () => {
      console.log("========== NEXT CLICK ==========");
  console.log("currentIdx:", currentIdx);
  console.log("step:", step);
    const valid = await validateStep();
    console.log("validate result:", valid);
  console.log("form errors:", methods.formState.errors);
  console.log("current values:", methods.getValues());
    if (!valid || !step) return;
    if (mode === 'create' && currentIdx === 0 && !savedId) {
      const v = methods.getValues();
      const res: any = await createMutation.mutateAsync({ reference_code: v.reference_code || undefined, first_name: v.first_name?.trim(), middle_name: v.middle_name?.trim() || null, last_name: v.last_name?.trim(), status: v.status, employment_type: v.employment_type, employee_code: v.employee_code || undefined, department_id: v.department_id ? Number(v.department_id) : undefined, sub_department_id: v.sub_department_id ? Number(v.sub_department_id) : undefined, designation_id: v.designation_id || undefined, sub_designation: v.sub_designation || undefined, email: v.email?.toLowerCase().trim() || undefined, phone: v.phone?.trim() || undefined, company_id: v.company_id ? Number(v.company_id) : undefined } as Partial<Employee>);
      setSavedId(res.data?.id ?? res.id);
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

  const overallPct = Math.round((completedSet.size / visibleSteps.length) * 100);

  function renderStep() {
    if (!step) return null;
    const p = { isEdit: mode === 'edit', employeeId: savedId };
    switch (step.key) {
      case 'basic':           return <StepBasic {...p} />;
      case 'employment':      return <StepEmployment {...p} />;
      case 'reporting':       return <StepReporting {...p} />;
      case 'commitment':      return <StepCommitment {...p} />;
      case 'schemes':         return <StepSchemes {...p} />;
      case 'personal':        return <StepPersonal {...p} />;
      case 'address':         return <StepAddress {...p} />;
      case 'family':          return <StepFamily {...p} />;
      case 'emergency':       return <StepEmergency {...p} />;
      case 'statutory':       return <StepStatutory {...p} />;
      case 'bank':            return <StepBank {...p} />;
      case 'experience':      return <StepExperience {...p} />;
      case 'salary':          return <StepSalary {...p} />;
      case 'onboarding_docs': return <StepOnboardingDocs {...p} />;
      case 'review':          return <StepReview employeeId={savedId} methods={methods} />;
      default:                return null;
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
            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{overallPct}% complete</div>
          </div>

          <nav>
            {visibleSteps.map((s, idx) => {
              const isActive = idx === currentIdx;
              const isDone   = completedSet.has(idx);
              const hasErr   = errorSet.has(idx);
              const canGo    = idx === 0 || savedId !== null || isDone;
              return (
                <div key={s.key} role="button" tabIndex={canGo ? 0 : -1}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => canGo && setCurrentIdx(idx)}
                  onKeyDown={e => e.key === 'Enter' && canGo && setCurrentIdx(idx)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', cursor: canGo ? 'pointer' : 'default', background: isActive ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'transparent'}`, opacity: canGo ? 1 : 0.45, transition: 'all .15s', userSelect: 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: hasErr ? 'var(--red-lt)' : isDone ? 'var(--green-lt)' : isActive ? 'var(--blue-lt)' : 'var(--surface2)', color: hasErr ? 'var(--red)' : isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--ink4)', border: `1.5px solid ${hasErr ? 'var(--red-bd)' : isDone ? 'var(--green-bd)' : isActive ? 'var(--blue-md)' : 'var(--border)'}` }}>
                    {hasErr ? '✕' : isDone ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--blue)' : isDone ? 'var(--ink2)' : 'var(--ink3)', flex: 1, lineHeight: 1.3 }}>{s.label}</span>
                  {s.sensitive && <span style={{ fontSize: 10, color: 'var(--ink4)' }} title="HR only">🔒</span>}
                </div>
              );
            })}
          </nav>

          <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink4)', minHeight: 36, display: 'flex', alignItems: 'center', gap: 6 }}>
            {draftSaving ? <>⟳ Saving draft…</> : draftSavedAt ? <>✓ Saved {draftSavedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</> : <>Auto-save enabled</>}
          </div>
        </aside>

        {/* Content */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>{currentIdx + 1}</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{step?.label}</h2>
              {step?.sensitive && <div style={{ marginTop: 5, fontSize: 11, color: 'var(--amber)', background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)', padding: '3px 10px', display: 'inline-block' }}>⚠️ Sensitive — HR/Admin only</div>}
            </div>
          </div>

          {renderStep()}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-sec" disabled={isFirst || isSaving} onClick={() => setCurrentIdx(p => p - 1)}>← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {isDirty && <button type="button" className="btn btn-sec btn-sm" onClick={triggerAutoSave} disabled={draftSaving} style={{ fontSize: 11 }}>{draftSaving ? 'Saving…' : 'Save Draft'}</button>}
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