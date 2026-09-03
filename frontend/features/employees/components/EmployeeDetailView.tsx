'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Chip } from '../../../components/ui/Chip';
import apiClient from '../../../services/api/client';
import { useEmployee } from '../hooks/useEmployees';
import { useShifts } from '../../shift/hooks/useShift';
import { useEmployeeAttendance } from '../../attendance/hooks/useAttendance';
import { usePermission } from '../../auth/hooks/usePermission';
import { formatDate, getInitials, getTenure, statusVariant, displayStatus } from '../utils/employee.utils';
import {
  DEPARTMENT_OPTIONS, SUB_DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS, SUB_DESIGNATION_OPTIONS,
  WORKING_SITE_OPTIONS, WORKING_CITY_OPTIONS, WORKING_STATE_COUNTRY_OPTIONS,
  REGISTRATION_LOCATION_OPTIONS, WEEKLY_OFF_OPTIONS, GRACE_MINUTES_OPTIONS,
} from '../constants/employee.constants';

const TABS = [
  'Overview', 'Work', 'Leave & Attendance', 'Compensation',
  'Personal', 'IDs & Bank', 'Experience & Education', 'Documents', 'Assets',
] as const;
type Tab = typeof TABS[number];

type Row = [label: string, value: any];

const labelFrom = (list: readonly { value: any; label: string }[], v: any) =>
  v == null || v === '' ? undefined : (list.find(o => String(o.value) === String(v))?.label ?? v);
const yn = (v: any) => (v === true || v === 'Yes' ? 'Yes' : v === false || v === 'No' ? 'No' : v == null || v === '' ? undefined : v);
const money = (n: any) => (n == null || n === '' || Number(n) === 0 || Number.isNaN(Number(n)) ? undefined : `₹${new Intl.NumberFormat('en-IN').format(Number(n))}`);
const date = (d: any) => (d ? formatDate(d) : undefined);

// ─── Presentational bits ─────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', wordBreak: 'break-word' }}>{String(value)}</div>
    </div>
  );
}

function InfoCard({ title, rows, action }: { title: string; rows: Row[]; action?: React.ReactNode }) {
  const filled = rows.filter(([, v]) => v != null && v !== '');
  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: filled.length ? 12 : 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        {action}
      </div>
      {filled.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--ink4)' }}>No data entered</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px 22px' }}>
          {filled.map(([label, value]) => <Field key={label} label={label} value={value} />)}
        </div>
      )}
    </div>
  );
}

function TableCard<T>({ title, columns, data, empty }: {
  title: string;
  columns: { key: string; header: string; render: (r: T) => any }[];
  data: T[];
  empty?: string;
}) {
  return (
    <div className="card" style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ fontSize: 13, fontWeight: 700, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '14px 16px' }}>{empty ?? 'No records'}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.key} style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', color: 'var(--ink2)' }}>{c.render(r) ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Restricted({ what }: { what: string }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 14, fontSize: 12, color: 'var(--ink4)' }}>
      🔒 {what} is not available with your current access level.
    </div>
  );
}

const fileLink = (url: any) =>
  url ? <a href={String(url)} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Open</a> : null;

// ─── Main ────────────────────────────────────────────────────────────────────
export function EmployeeDetailView({ id }: { id: number }) {
  const router = useRouter();
  const { data: emp, isLoading, isError } = useEmployee(id);
  const { data: shifts = [] } = useShifts();
  const { canEdit } = usePermission();
  const [tab, setTab] = useState<Tab>('Overview');

  const shiftLabel = useMemo(
    () => (sid: any) => (sid == null ? undefined : (shifts.find((s: any) => String(s.value ?? s.id) === String(sid))?.label ?? `Shift #${sid}`)),
    [shifts],
  );

  const { data: attendance = [] } = useEmployeeAttendance(id) as any;
  const { data: leaves = [] } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: () => apiClient.get<any, any>('/leaves', { params: { employee_id: id, limit: 50 } }),
    enabled: id > 0 && tab === 'Leave & Attendance',
    select: (r: any) => (Array.isArray(r?.data) ? r.data : (r?.data?.data ?? r?.data?.rows ?? [])),
  });

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink4)' }}>Loading employee…</div>;
  if (isError || !emp) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--red)' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
        <p>Employee not found.</p>
        <button className="btn btn-sec" style={{ marginTop: 14 }} onClick={() => router.push('/employees')}>← Back to Directory</button>
      </div>
    );
  }

  const e: any = emp;
  const cp = e.commitmentProbation ?? {};
  const sc = e.schemes ?? {};
  const p = e.personal ?? {};
  const fam = e.family ?? {};
  const ad = e.assetDeduction ?? {};
  const cur = e.salaries?.find((s: any) => s.salary_type === 'current');
  const joi = e.salaries?.find((s: any) => s.salary_type === 'joining');
  const pb = e.bankDetails?.find((b: any) => b.bank_type === 'personal') ?? {};
  const st = e.statutory ?? {};
  const pres = e.addresses?.find((a: any) => a.address_type === 'present') ?? {};
  const perm = e.addresses?.find((a: any) => a.address_type === 'permanent') ?? {};
  const docs = e.onboardingDocs ?? {};

  const deptName = labelFrom(DEPARTMENT_OPTIONS, e.department_id) ?? e.department?.name;
  const desigName = labelFrom(DESIGNATION_OPTIONS, e.designation_id) ?? e.designation?.name;
  const managerName = (m: any) => (m ? (m.employee_code ?? `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim()) : undefined);
  const st2 = displayStatus(e);

  // ── Tab content ────────────────────────────────────────────────────────────
  const content = () => {
    switch (tab) {
      case 'Overview':
        return (
          <>
            <InfoCard title="Identity" rows={[
              ['Employee Code', e.employee_code ?? (e.record_status === 'Draft' ? 'Pending — issued at 100%' : '—')],
              ['Reference Code', e.reference_code],
              ['Status', st2],
              ['Record', e.record_status],
              ['Employment Type', e.employment_type],
              ['Company', e.company?.name],
              ['Department', deptName],
              ['Sub Department', e.subDepartment?.name ?? labelFrom(SUB_DEPARTMENT_OPTIONS, e.sub_department_id)],
              ['Designation', desigName],
              ['Sub Designation', e.subDesignation?.name ?? labelFrom(SUB_DESIGNATION_OPTIONS, e.sub_designation_id)],
              ['Date of Joining', date(e.actual_doj)],
              ['Tenure', e.actual_doj ? getTenure(e.actual_doj) : undefined],
              ['Profile Completion', `${e.form_completion_pct ?? 0}%`],
            ]} />
            <InfoCard title="Contact" rows={[
              ['Personal Email', e.email],
              ['Personal Mobile', e.phone],
              ['Official Email', e.official_email],
              ['Official Mobile', e.official_mobile],
              ['L1 Manager', managerName(e.l1Manager)],
              ['L2 Manager', managerName(e.l2Manager)],
            ]} />
            <InfoCard title="Probation" rows={[
              ['On Probation', yn(cp.on_probation)],
              ['Probation Period', cp.probation_period],
              ['Probation End Date', date(cp.probation_end_date)],
              ['Probation Status', cp.probation_status],
            ]} />
          </>
        );

      case 'Work':
        return (
          <>
            <InfoCard title="Location & Attendance" rows={[
              ['State / Country', labelFrom(WORKING_STATE_COUNTRY_OPTIONS, e.working_state_country)],
              ['Working City', labelFrom(WORKING_CITY_OPTIONS, e.working_city)],
              ['Working Site', labelFrom(WORKING_SITE_OPTIONS, e.working_site)],
              ['Pay Register Location', labelFrom(REGISTRATION_LOCATION_OPTIONS, e.pay_register_location)],
              ['Date of Joining', date(e.actual_doj)],
              ['Weekly Off', labelFrom(WEEKLY_OFF_OPTIONS, e.weekly_off)],
              ['Shift Category', e.shift_category],
              ['Working Shift', shiftLabel(e.shift_id)],
              ['Grace Minutes', labelFrom(GRACE_MINUTES_OPTIONS, e.grace_minutes)],
            ]} />
            <InfoCard title="Managers & Work Contact" rows={[
              ['L1 Manager', managerName(e.l1Manager)],
              ['L2 Manager', managerName(e.l2Manager)],
              ['Official Email', e.official_email],
              ['Official Mobile', e.official_mobile],
            ]} />
            <InfoCard title="Commitment & Probation" rows={[
              ['Commitment', yn(cp.commitment)],
              ['Commitment Term', cp.commitment_term],
              ['Commitment Entered On', date(cp.commitment_entered_on)],
              ['Commitment End Date', date(cp.commitment_end_date)],
              ['On Probation', yn(cp.on_probation)],
              ['Probation Period', cp.probation_period],
              ['Probation End Date', date(cp.probation_end_date)],
              ['Probation Status', cp.probation_status],
            ]} />
            <InfoCard title="Statutory Schemes" rows={[
              ['PF Applicable', yn(sc.pf_status)],
              ['UAN', sc.uan_number],
              ['EPFO Member ID', sc.epfo_member_id],
              ['PF Contribution %', sc.pf_contribution_pct],
              ['PF Employee (12%)', money(sc.pf_employee_12)],
              ['EPS Employer (8.33%)', money(sc.eps_employer_833)],
              ['EPF/EPS Diff (3.67%)', money(sc.epf_eps_diff_367)],
              ['ESI Applicable', yn(sc.esic_status)],
              ['ESI Number', sc.esic_number],
              ['ESI Employee %', sc.esi_employee_pct],
              ['ESI Employer %', sc.esi_employer_pct],
              ['Mediclaim Status', sc.mediclaim_status && sc.mediclaim_status !== 'No' ? sc.mediclaim_status : undefined],
              ['Mediclaim Number', sc.mediclaim_number],
              ['Mediclaim Amount', money(sc.mediclaim_amount)],
              ['RD Scheme', yn(sc.rd_scheme)],
              ['RD Term', sc.rd_term],
              ['RD Account Number', sc.rd_account_number],
              ['RD Opening Date', date(sc.rd_opening_date)],
              ['RD Amount (Employee)', money(sc.rd_amount_employee)],
              ['RD Amount (Employer)', money(sc.rd_amount_employer)],
              ['RD Maturity Date', date(sc.rd_maturity_date)],
              ['RD Maturity Amount', money(sc.rd_maturity_amount)],
            ]} />
          </>
        );

      case 'Leave & Attendance':
        return (
          <>
            <TableCard
              title="Recent Attendance"
              empty="No attendance records"
              data={(attendance ?? []).slice(0, 20)}
              columns={[
                { key: 'date', header: 'Date', render: (r: any) => date(r.date ?? r.attendance_date) },
                { key: 'status', header: 'Status', render: (r: any) => r.status },
                { key: 'in', header: 'Check In', render: (r: any) => r.check_in ?? r.in_time ?? '—' },
                { key: 'out', header: 'Check Out', render: (r: any) => r.check_out ?? r.out_time ?? '—' },
                { key: 'src', header: 'Source', render: (r: any) => r.source ?? '—' },
              ]}
            />
            <TableCard
              title="Leave History"
              empty="No leave applications"
              data={(leaves ?? []).slice(0, 30)}
              columns={[
                { key: 'type', header: 'Type', render: (r: any) => r.leaveType?.name ?? r.leave_type?.name ?? r.type ?? '—' },
                { key: 'from', header: 'From', render: (r: any) => date(r.from_date) },
                { key: 'to', header: 'To', render: (r: any) => date(r.to_date) },
                { key: 'days', header: 'Days', render: (r: any) => r.days },
                { key: 'status', header: 'Status', render: (r: any) => <Chip variant={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : r.status === 'Cancelled' ? 'gray' : 'amber'}>{r.status}</Chip> },
              ]}
            />
          </>
        );

      case 'Compensation':
        if (!e.salaries) return <><Restricted what="Compensation" />
          <InfoCard title="Asset Deduction" rows={assetDeductionRows(ad)} /></>;
        return (
          <>
            <InfoCard title="Current Salary" rows={[
              ['Salary Mode', cur?.salary_mode],
              ['Basic', money(cur?.basic)], ['HRA', money(cur?.hra)], ['Allowance 1', money(cur?.allowance1)],
              ['Gross (PM)', money(cur?.gross_salary_pm)], ['AMDB (PM)', money(cur?.amdb_pm)], ['Total Earning (PM)', money(cur?.total_earning_pm)],
            ]} />
            <InfoCard title="Joining Salary" rows={[
              ['Basic', money(joi?.basic)], ['HRA', money(joi?.hra)], ['Allowance 1', money(joi?.allowance1)],
              ['Gross (PM)', money(joi?.gross_salary_pm)], ['AMDB (PM)', money(joi?.amdb_pm)], ['Total Earning (PM)', money(joi?.total_earning_pm)],
            ]} />
            <InfoCard title="Asset Deduction" rows={assetDeductionRows(ad)} />
          </>
        );

      case 'Personal':
        return (
          <>
            <InfoCard title="Personal Profile" rows={[
              ['Date of Birth', date(p.date_of_birth)],
              ['Gender', p.gender],
              ['Blood Group', p.blood_group],
              ['Shirt Size', p.shirt_size],
              ['T-shirt Size', p.tshirt_size],
              ['Nationality', p.nationality],
              ['Religion', p.religion],
            ]} />
            <InfoCard title="Marital & Children" rows={[
              ['Marital Status', p.marital_status],
              ['Marriage Date', date(p.marriage_date)],
              ['Spouse Name', p.spouse_name],
              ['Spouse DOB', date(p.spouse_dob)],
              ['Child 1', [p.child1_name, p.child1_gender, date(p.child1_dob)].filter(Boolean).join(' · ') || undefined],
              ['Child 2', [p.child2_name, p.child2_gender, date(p.child2_dob)].filter(Boolean).join(' · ') || undefined],
              ['Child 3', [p.child3_name, p.child3_gender, date(p.child3_dob)].filter(Boolean).join(' · ') || undefined],
            ]} />
            <InfoCard title="Parents" rows={[
              ['Father', [fam.father_salutation, fam.father_name].filter(Boolean).join(' ') || undefined],
              ['Father DOB', date(fam.father_dob)],
              ['Father Occupation', fam.father_occupation],
              ['Mother', [fam.mother_salutation, fam.mother_name].filter(Boolean).join(' ') || undefined],
              ['Mother DOB', date(fam.mother_dob)],
              ['Mother Occupation', fam.mother_occupation],
            ]} />
            <InfoCard title="Present Address" rows={addressRows(pres)} />
            <InfoCard title="Permanent Address" rows={[['Type', perm.perm_address_type], ...addressRows(perm)]} />
            <TableCard
              title="Other Family Members"
              empty="None added"
              data={e.familyMembers ?? []}
              columns={[
                { key: 'name', header: 'Name', render: (r: any) => r.name },
                { key: 'rel', header: 'Relationship', render: (r: any) => r.relationship ?? r.relationship_other },
                { key: 'dob', header: 'DOB', render: (r: any) => date(r.dob) },
                { key: 'occ', header: 'Occupation', render: (r: any) => r.occupation },
              ]}
            />
            <TableCard
              title="Emergency Contacts"
              empty="None added"
              data={e.emergencyContacts ?? []}
              columns={[
                { key: 'name', header: 'Name', render: (r: any) => r.contact_name },
                { key: 'num', header: 'Number', render: (r: any) => r.contact_number },
                { key: 'email', header: 'Email', render: (r: any) => r.email },
                { key: 'rel', header: 'Relationship', render: (r: any) => r.relationship ?? r.relationship_other },
              ]}
            />
          </>
        );

      case 'IDs & Bank':
        if (!e.statutory && !e.bankDetails) return <Restricted what="IDs & Bank details" />;
        return (
          <>
            <InfoCard title="Aadhaar" rows={[
              ['Aadhaar Number', st.aadhaar_number], ['Name as on Aadhaar', st.aadhaar_name],
              ['DOB', date(st.aadhaar_dob)], ['Address', st.aadhaar_address], ['Scan', fileLink(st.aadhaar_scan_url)],
            ]} />
            <InfoCard title="PAN" rows={[
              ['PAN Number', st.pan_number], ['Full Name', st.pan_full_name], ['DOB', date(st.pan_dob)],
              ['Parent / Spouse Name', st.pan_parent_spouse_name], ['Scan', fileLink(st.pan_scan_url)],
            ]} />
            <InfoCard title="Passport" rows={[
              ['Passport Number', st.passport_number], ['Full Name', st.passport_full_name], ['Nationality', st.passport_nationality],
              ['Issue Date', date(st.passport_issue_date)], ['Expiry', date(st.passport_expiry)],
              ['Place of Issue', st.passport_place_of_issue], ['Scan', fileLink(st.passport_scan_url)],
            ]} />
            <InfoCard title="Driving Licence" rows={[
              ['Number', st.driving_license_number], ['Name', st.driving_license_name],
              ['Issue Date', date(st.driving_license_issue_date)], ['Expiry', date(st.driving_license_expiry)],
              ['Authority', st.driving_license_authority], ['Scan', fileLink(st.driving_license_scan_url)],
            ]} />
            <InfoCard title="Travel / Vaccination" rows={[
              ['Yellow Fever', yn(st.yellow_fever)], ['Yellow Fever Date', date(st.yellow_fever_date)],
            ]} />
            <InfoCard title="Personal Bank" rows={[
              ['Bank Name', pb.bank_name], ['Account Number', pb.account_number],
              ['IFSC', pb.ifsc_code], ['Branch', pb.branch_name],
            ]} />
            <TableCard
              title="Vaccinations"
              empty="No records"
              data={e.vaccinations ?? []}
              columns={[
                { key: 'v', header: 'Vaccine', render: (r: any) => r.vaccine_name },
                { key: 'd', header: 'Date', render: (r: any) => date(r.date) },
                { key: 'n', header: 'Notes', render: (r: any) => r.notes },
              ]}
            />
          </>
        );

      case 'Experience & Education':
        return (
          <>
            <InfoCard title="Experience" rows={[['Is Experienced', yn(e.experienceFlag?.is_experienced)]]} />
            <TableCard
              title="Work Experience"
              empty="No experience entries"
              data={e.experience ?? []}
              columns={[
                { key: 'co', header: 'Company', render: (r: any) => r.last_company_name },
                { key: 'des', header: 'Designation', render: (r: any) => r.last_designation },
                { key: 'lwd', header: 'Last Working Day', render: (r: any) => date(r.last_working_day) },
                { key: 'ct', header: 'Contact', render: (r: any) => [r.exp_contact_name, r.exp_contact_number].filter(Boolean).join(' · ') },
                { key: 'sal', header: 'Last In-hand', render: (r: any) => money(r.last_inhand_salary) },
              ]}
            />
            <TableCard
              title="Education"
              empty="No education entries"
              data={e.education ?? []}
              columns={[
                { key: 'h', header: 'Qualification', render: (r: any) => r.highest_education },
                { key: 's', header: 'Stream', render: (r: any) => r.education_stream },
                { key: 'm', header: 'Mode', render: (r: any) => r.education_mode },
                { key: 'i', header: 'Institute', render: (r: any) => r.institute_name },
                { key: 'mk', header: 'Marks', render: (r: any) => r.education_marks },
                { key: 'y', header: 'Years', render: (r: any) => [r.education_start_year, r.education_end_year].filter(Boolean).join(' – ') + (r.is_pursuing ? ' (pursuing)' : '') },
              ]}
            />
          </>
        );

      case 'Documents':
        return (
          <>
            <InfoCard title="HR Joining Checklist" rows={[
              ['Offer Letter', docs.offer_letter ? 'Received' : undefined],
              ['Address Verification', docs.address_verification ? 'Received' : undefined],
              ['Service Agreement', docs.service_agreement ? 'Received' : undefined],
              ['Indemnity Bond', docs.indemnity_bond ? 'Received' : undefined],
              ['Asset Deduction Letter', docs.asset_deduction_letter ? 'Received' : undefined],
              ['Account Opening Letter', docs.account_opening_letter ? 'Received' : undefined],
              ['NDA', docs.nda ? 'Received' : undefined],
              ['Remarks', docs.remarks],
            ]} />
            <InfoCard title="ID Scans" rows={[
              ['Aadhaar', fileLink(st.aadhaar_scan_url)],
              ['PAN', fileLink(st.pan_scan_url)],
              ['Passport', fileLink(st.passport_scan_url)],
              ['Driving Licence', fileLink(st.driving_license_scan_url)],
            ]} />
            {!e.documents ? <Restricted what="Additional documents" /> : (
              <TableCard
                title="Additional Documents"
                empty="No documents uploaded"
                data={e.documents ?? []}
                columns={[
                  { key: 't', header: 'Type', render: (r: any) => r.doc_type_other || r.doc_type },
                  { key: 'f', header: 'File', render: (r: any) => fileLink(r.file_url) },
                ]}
              />
            )}
          </>
        );

      case 'Assets':
        return (
          <>
            <InfoCard title="Asset Security / Deduction" rows={assetDeductionRows(ad)} />
            <TableCard
              title="Assigned Company Assets"
              empty="No assets assigned to this employee"
              data={[]}
              columns={[
                { key: 'a', header: 'Asset', render: () => '—' },
                { key: 's', header: 'Status', render: () => '—' },
              ]}
            />
          </>
        );
    }
  };

  return (
    <div className="pg-enter">
      {/* Header */}
      <div className="card" style={{ padding: 16, marginBottom: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}>
          {e.avatar_url ? <img src={e.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(`${e.first_name} ${e.last_name}`)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>
            {[e.first_name, e.middle_name, e.last_name].filter(Boolean).join(' ')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 2 }}>
            {[e.employee_code ?? 'Code pending', desigName ?? 'No designation', deptName ?? 'No department', e.company?.name].filter(Boolean).join(' · ')}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip variant={statusVariant(st2)}>{st2}</Chip>
            {e.actual_doj && <span style={{ fontSize: 11, color: 'var(--ink4)' }}>Joined {formatDate(e.actual_doj)} · {getTenure(e.actual_doj)}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sec btn-sm" onClick={() => router.push('/employees')}>← Directory</button>
          {canEdit('employees') && (
            <button className="btn btn-pri btn-sm" onClick={() => router.push(`/employees/${id}/edit`)}>
              {e.record_status === 'Draft' ? 'Continue' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(t => (
          <div key={t} className={`tab${t === tab ? ' on' : ''}`} onClick={() => setTab(t)} style={{ whiteSpace: 'nowrap' }}>
            {t}
          </div>
        ))}
      </div>

      {content()}
    </div>
  );
}

// ─── row helpers ─────────────────────────────────────────────────────────────
function assetDeductionRows(ad: any): Row[] {
  return [
    ['Applicable', yn(ad.asset_deduction_applicable)],
    ['Security Amount', money(ad.security_amount)],
    ['Deduction Months', ad.deduction_months],
    ['Deduction From', ad.deduction_from],
    ['Monthly Deduction', money(ad.monthly_deduction)],
    ['Final Monthly Deduction', money(ad.final_monthly_deduction)],
    ['Last Installment', money(ad.last_installment)],
  ];
}
function addressRows(a: any): Row[] {
  return [
    ['House Type', a.house_type],
    ['House No', a.house_no],
    ['Area', a.area],
    ['District', a.district],
    ['City', a.city],
    ['State', a.state],
    ['Country', a.country],
    ['Pincode', a.pincode],
  ];
}
