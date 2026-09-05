'use client';
import { useMemo } from 'react';
import { useEmployee } from '../../hooks/useEmployees';
import { useShifts } from '../../../../features/shift/hooks/useShift';
import { useGraceMinutesData } from '../../../attendance-rule/hooks/useAttendanceRules';
import { WIZARD_STEPS } from '../../constants/employee.constants';

interface Props {
  employeeId: number | null;
  methods: any;
  onEdit?: (stepKey: string) => void;
}

type Field = [label: string, value: any];

const yn = (v: any) => (v === true || v === 'Yes' ? 'Yes' : v === false || v === 'No' ? 'No' : v == null || v === '' ? undefined : v);
const money = (n: any) => (n == null || n === '' || Number(n) === 0 ? undefined : `₹${new Intl.NumberFormat('en-IN').format(Number(n))}`);
const count = (arr: any[] | undefined, noun: string) => (arr && arr.length ? `${arr.length} ${noun}${arr.length > 1 ? 's' : ''}` : undefined);

export function StepReview({ employeeId, onEdit }: Props) {
  const { data: emp } = useEmployee(employeeId ?? 0);
  const { data: shifts = [] } = useShifts();
  const { data: graceMinutesResponse } = useGraceMinutesData();
  const graceMinutes = graceMinutesResponse?.data ?? [];

  const shiftLabel = useMemo(
    () => (id: any) => (id == null ? undefined : (shifts.find((s: any) => String(s.value ?? s.id) === String(id))?.label ?? `Shift #${id}`)),
    [shifts],
  );
  const graceMinutesLabel = useMemo(
    () => (minutes: any) => (minutes == null || minutes === '' ? undefined : (graceMinutes.find((g: any) => String(g.minutes) === String(minutes))?.name ?? `${minutes} min`)),
    [graceMinutes],
  );

  if (!emp) {
    return <div style={{ color: 'var(--ink4)', textAlign: 'center', padding: 40 }}>Save the earlier steps first to see the review.</div>;
  }

  const cp: any = emp.commitmentProbation ?? {};
  const sc: any = emp.schemes ?? {};
  const p: any = emp.personal ?? {};
  const fam: any = emp.family ?? {};
  const st: any = emp.statutory ?? {};
  const docs: any = emp.onboardingDocs ?? {};
  const cur: any = emp.salaries?.find((s: any) => s.salary_type === 'current') ?? {};
  const joi: any = emp.salaries?.find((s: any) => s.salary_type === 'joining') ?? {};
  const pb: any = emp.bankDetails?.find((b: any) => b.bank_type === 'personal') ?? {};
  const pres: any = emp.addresses?.find((a: any) => a.address_type === 'present') ?? {};
  const perm: any = emp.addresses?.find((a: any) => a.address_type === 'permanent') ?? {};
  const ad: any = emp.assetDeduction ?? {};
  const isExperienced = (emp as any).experienceFlag?.is_experienced;

  const SECTIONS: Record<string, Field[]> = {
    role_identity: [
      ['First Name', emp.first_name], ['Middle Name', emp.middle_name], ['Last Name', emp.last_name],
      ['Status', emp.status], ['Employment Type', emp.employment_type],
      ['Department', emp.department?.name],
      ['Sub Department', (emp as any).subDepartment?.name],
      ['Designation', emp.designation?.name],
      ['Sub Designation', (emp as any).subDesignation?.name],
      ['Personal Email', emp.email], ['Personal Mobile', emp.phone],
    ],
    location_attendance: [
      ['State / Country', (emp as any).workingState?.name],
      ['Working City', (emp as any).workingCity?.name],
      ['Working Site', (emp as any).workingSite?.name],
      ['Pay Register Location', (emp as any).payRegister?.name],
      ['Date of Joining', emp.actual_doj],
      ['Weekly Off', (emp as any).weeklyOffPreset?.name],
      ['Shift Category', (emp as any).shift_category],
      ['Working Shift', shiftLabel(emp.shift_id)],
      ['Grace Minutes', graceMinutesLabel((emp as any).grace_minutes)],
    ],
    managers_work_contact: [
      ['L-1 Manager', emp.l1Manager ? (emp.l1Manager.employee_code ?? `${emp.l1Manager.first_name} ${emp.l1Manager.last_name}`) : undefined],
      ['L-2 Manager', emp.l2Manager ? (emp.l2Manager.employee_code ?? `${emp.l2Manager.first_name} ${emp.l2Manager.last_name}`) : undefined],
      ['Official Email', emp.official_email], ['Official Mobile', emp.official_mobile],
    ],
    commitment_probation: [
      ['Commitment', yn(cp.commitment)], ['Commitment Term', cp.commitment_term],
      ['Commitment Entered On', cp.commitment_entered_on], ['Commitment End Date', cp.commitment_end_date],
      ['Probation', yn(cp.on_probation)], ['Probation Period', cp.probation_period],
      ['Probation End Date', cp.probation_end_date], ['Probation Status', cp.probation_status],
    ],
    statutory_schemes: [
      ['PF Status', yn(sc.pf_status)], ['UAN', sc.uan_number], ['EPFO Member Id', sc.epfo_member_id],
      ['PF Contribution On % of Basic', sc.pf_contribution_pct], ['Employee Contribution (12%)', sc.pf_employee_12],
      ['EPS Employer (8.33%)', sc.eps_employer_833], ['EPF/EPS Diff (3.67%)', sc.epf_eps_diff_367],
      ['ESI Status', yn(sc.esic_status)], ['ESI Number', sc.esic_number],
      ['Mediclaim Status', sc.mediclaim_status && sc.mediclaim_status !== 'No' ? sc.mediclaim_status : undefined],
      ['Mediclaim Number', sc.mediclaim_number], ['Mediclaim Amount', money(sc.mediclaim_amount)],
      ['RD Scheme', yn(sc.rd_scheme)], ['RD Term', sc.rd_term], ['RD Amount (Employee)', money(sc.rd_amount_employee)],
    ],
    compensation: [
      ['Salary Mode', cur.salary_mode],
      ['Current Basic', money(cur.basic)], ['Current HRA', money(cur.hra)], ['Current Allowance', money(cur.allowance1)],
      ['Current Gross', money(cur.gross_salary_pm)], ['Current AMDB', money(cur.amdb_pm)], ['Total Earning', money(cur.total_earning_pm)],
      ['Joining Basic', money(joi.basic)], ['Joining Gross', money(joi.gross_salary_pm)],
      ['Asset Deduction', yn(ad.asset_deduction_applicable)], ['Security Amount', money(ad.security_amount)],
      ['Deduction Months', ad.deduction_months], ['Deduction From', ad.deduction_from],
    ],
    hr_joining_checklist: [
      ['Offer Letter', docs.offer_letter ? 'Received' : undefined],
      ['Address Verification', docs.address_verification ? 'Received' : undefined],
      ['Service Agreement', docs.service_agreement ? 'Received' : undefined],
      ['Indemnity Bond', docs.indemnity_bond ? 'Received' : undefined],
      ['Asset Deduction Letter', docs.asset_deduction_letter ? 'Received' : undefined],
      ['Account Opening Letter', docs.account_opening_letter ? 'Received' : undefined],
      ['NDA', docs.nda ? 'Received' : undefined],
      ['Remarks', docs.remarks],
    ],
    personal_profile: [
      ['Date of Birth', p.date_of_birth], ['Gender', p.gender], ['Blood Group', p.blood_group],
      ['Shirt Size', p.shirt_size], ['T-shirt Size', p.tshirt_size],
      ['Nationality', p.nationality], ['Religion', p.religion],
    ],
    address: [
      ['Present House Type', pres.house_type], ['Present House No', pres.house_no],
      ['Present Area', pres.area], ['Present City', pres.city], ['Present State', pres.state],
      ['Present Pincode', pres.pincode], ['Permanent Address', perm.perm_address_type],
      ['Permanent City', perm.city], ['Permanent Pincode', perm.pincode],
    ],
    family_emergency: [
      ['Marital Status', p.marital_status], ['Spouse Name', p.spouse_name],
      ['Father Name', fam.father_name], ['Father Occupation', fam.father_occupation],
      ['Mother Name', fam.mother_name], ['Mother Occupation', fam.mother_occupation],
      ['Children', [p.child1_name, p.child2_name, p.child3_name].filter(Boolean).join(', ') || undefined],
      ['Other Family Members', count(emp.familyMembers, 'member')],
      ['Emergency Contacts', count(emp.emergencyContacts, 'contact')],
    ],
    ids_bank: [
      ['Aadhaar Number', st.aadhaar_number], ['Name as on Aadhaar', st.aadhaar_name],
      ['PAN Number', st.pan_number], ['Passport Number', st.passport_number],
      ['Driving Licence', st.driving_license_number],
      ['Bank Name', pb.bank_name], ['Account Number', pb.account_number], ['IFSC', pb.ifsc_code],
      ['Vaccinations', count(emp.vaccinations, 'record')], ['Documents', count(emp.documents, 'file')],
    ],
    experience_education: [
      ['Experienced', yn(isExperienced)],
      ['Work Experience', count(emp.experience, 'entry')],
      ['Education', count(emp.education, 'entry')],
    ],
  };

  const hrSteps  = WIZARD_STEPS.filter(s => s.part === 'hr');
  const candSteps = WIZARD_STEPS.filter(s => s.part === 'candidate');
  const filled = (key: string) => (SECTIONS[key] ?? []).filter(([, v]) => v != null && v !== '');
  const hrDone   = hrSteps.filter(s => filled(s.key).length > 0).length;
  const candDone = candSteps.filter(s => filled(s.key).length > 0).length;

  const initials = `${(emp.first_name?.[0] ?? '')}${(emp.last_name?.[0] ?? '')}`.toUpperCase() || 'NE';
  const meta = [
    emp.employee_code ?? 'Code pending',
    emp.designation?.name ?? 'No designation',
    emp.department?.name ?? 'No department',
    emp.record_status ?? 'Draft',
  ].join(' · ');

  const Card = ({ step, idx }: { step: (typeof WIZARD_STEPS)[number]; idx: number }) => {
    const rows = filled(step.key);
    const partLabel = step.part === 'hr' ? 'HR' : 'Candidate';
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', background: 'var(--surface2)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--blue-lt)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx}</span>
          <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{step.label}</span>
          {onEdit && (
            <button type="button" onClick={() => onEdit(step.key)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Edit</button>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: rows.length ? 12 : 8 }}>
          {rows.length} fields filled · {partLabel}
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink4)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>No data entered</div>
        ) : (
          <div>
            {rows.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '6px 0', borderTop: '1px dotted var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--ink4)', flex: 1 }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Group = ({ title, steps }: { title: string; steps: (typeof WIZARD_STEPS)[number][] }) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {steps.map(s => {
          const idx = WIZARD_STEPS.findIndex(w => w.key === s.key) + 1;
          return <Card key={s.key} step={s} idx={idx} />;
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Info banner */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: '12px 16px', fontSize: 12, color: 'var(--ink3)' }}>
        HR reviews both parts, then submits. Candidate sections can stay incomplete until the self-portal is finished.
      </div>

      {/* Summary header */}
      <div style={{ background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', borderRadius: 'var(--r2)', padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--blue)', color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{[emp.first_name, emp.last_name].filter(Boolean).join(' ') || 'New Employee'}</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{meta}</div>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4 }}>HR {hrDone}/{hrSteps.length} · Candidate {candDone}/{candSteps.length}</div>
        </div>
      </div>

      <Group title="Part 1 · HR" steps={hrSteps as any} />
      <Group title="Part 2 · Candidate" steps={candSteps as any} />
    </div>
  );
}
