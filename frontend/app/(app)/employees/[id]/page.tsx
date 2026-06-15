'use client';
/**
 * /employees/[id] — Employee Detail Page
 * Full read-only profile with all 15 sections, tabbed layout, masking-aware display.
 */
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Chip } from '../../../../components/ui/Chip';
import { useEmployee, useDeleteEmployee } from '../../../../features/employees/hooks/useEmployees';
import { usePermission } from '../../../../features/auth/hooks/usePermission';
import { Modal } from '../../../../components/ui/Modal';
import { showToast } from '../../../../utils/toast';
import {
  formatDate, formatINR, formatINRShort, getTenure,
  getInitials, getFullName, statusVariant, onboardingPct,
} from '../../../../features/employees/utils/employee.utils';
import type { EmployeeAddress, EmployeeBankDetail, EmployeeSalary, EmployeeTransfer } from '../../../../features/employees/types/employee.types';

// ── Field row ──────────────────────────────────────────────────────────────
const Field = ({ label, value, mono = false }: { label: string; value?: any; mono?: boolean }) => (
  <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ width: 190, flexShrink: 0, fontSize: 11, color: 'var(--ink4)' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--mono)' : 'var(--font)', color: 'var(--ink2)', wordBreak: 'break-word' }}>
      {value || <span style={{ color: 'var(--ink4)', fontStyle: 'italic' }}>—</span>}
    </span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink4)', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--border)' }}>{title}</div>
    {children}
  </div>
);

const TABS = ['Overview', 'Personal', 'Family', 'Address', 'Schemes', 'Documents & IDs', 'Bank', 'Salary', 'Experience', 'Onboarding', 'Transfers'] as const;
type Tab = typeof TABS[number];

export default function EmployeeDetailPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { canEdit, canDelete, isHR, isAdmin, isSuperAdmin } = usePermission();

  const [activeTab,    setActiveTab]    = useState<Tab>('Overview');
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const canSeeSensitive = isHR || isAdmin || isSuperAdmin;

  const { data: employee, isLoading, isError } = useEmployee(Number(params.id));
  const deleteMutation = useDeleteEmployee();

  useEffect(() => {
    if (employee) dispatch(setPageTitle({ title: `${employee.first_name} ${employee.last_name}`, breadcrumb: 'Employee Directory' }));
  }, [employee, dispatch]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(Number(params.id));
      showToast('Employee removed');
      router.push('/employees');
    } catch (err: any) {
      showToast(err?.message || 'Delete failed');
    }
  };

  if (isLoading) return <AppShell><div style={{ padding: 48, textAlign: 'center', color: 'var(--ink4)' }}>Loading…</div></AppShell>;
  if (isError || !employee) return (
    <AppShell>
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--red)' }}>Employee not found.</p>
        <button className="btn btn-sec" style={{ marginTop: 16 }} onClick={() => router.push('/employees')}>← Back</button>
      </div>
    </AppShell>
  );

  const emp  = employee;
  const cp   = emp.commitmentProbation ?? {};
  const sch  = emp.schemes ?? {};
  const pers = emp.personal ?? {};
  const fam  = emp.family ?? {};
  const st   = emp.statutory ?? {};
  const pBank = emp.bankDetails?.find((b: EmployeeBankDetail) => b.bank_type === 'personal');
  const oBank = emp.bankDetails?.find((b: EmployeeBankDetail) => b.bank_type === 'official');
  const curSal = emp.salaries?.find((s: EmployeeSalary) => s.salary_type === 'current');
  const joiSal = emp.salaries?.find((s: EmployeeSalary) => s.salary_type === 'joining');
  const ad   = emp.assetDeduction ?? {};
  const exp  = emp.experience ?? {};
  const edu  = emp.education ?? {};
  const doc  = emp.onboardingDocs ?? {};
  const pAddr = emp.addresses?.find((a: EmployeeAddress) => a.address_type === 'present');
  const xAddr = emp.addresses?.find((a: EmployeeAddress) => a.address_type === 'permanent');
  const emg  = emp.emergencyContacts?.[0];
  const xfer = emp.transfers ?? [];
  const exit = emp.exit ?? {};

  const docPct = onboardingPct(doc as any);

  return (
    <AppShell>
      <div className="pg-enter">
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 14, cursor: 'pointer' }}
          onClick={() => router.push('/employees')}>← Employee Directory</div>

        {/* Profile header */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            {emp.avatar_url ? (
              <Image src={emp.avatar_url} alt={getFullName(emp)} width={72} height={72}
                style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 16, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                {getInitials(getFullName(emp))}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{getFullName(emp)}</h1>
                <Chip variant={statusVariant(emp.status)}>{emp.status}</Chip>
                {emp.portal_access && <Chip variant="teal">Portal Active</Chip>}
                {emp.is_super_admin && <Chip variant="purple">Super Admin</Chip>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 2, fontFamily: 'var(--mono)' }}>{emp.employee_code} · {emp.reference_code ?? ''}</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>
                {emp.employment_type} · {emp.working_city || '—'} · {emp.working_site || '—'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--ink4)' }}>
                {emp.email && <span>{emp.email}</span>}
                {emp.phone && <span>{emp.phone}</span>}
                {emp.actual_doj && <span>Joined {formatDate(emp.actual_doj)} ({getTenure(emp.actual_doj)})</span>}
              </div>
            </div>

            {/* Actions + completion */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {canEdit('employees') && <button className="btn btn-sec btn-sm" onClick={() => router.push(`/employees/${emp.id}/edit`)}>✏ Edit</button>}
                {canDelete('employees') && <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>🗑 Remove</button>}
              </div>
              {/* Profile completion */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 4 }}>Profile completion</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 120, height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${emp.form_completion_pct}%`, background: emp.form_completion_pct === 100 ? 'var(--green)' : emp.form_completion_pct >= 60 ? 'var(--blue)' : 'var(--amber)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: emp.form_completion_pct === 100 ? 'var(--green)' : 'var(--blue)' }}>{emp.form_completion_pct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* L1/L2 manager strip */}
          {(emp.l1Manager || emp.l2Manager) && (
            <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {emp.l1Manager && (
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: 'var(--ink4)' }}>L1 Manager: </span>
                  <span style={{ fontWeight: 500 }}>{emp.l1Manager.first_name} {emp.l1Manager.last_name}</span>
                  <span style={{ color: 'var(--ink4)', fontFamily: 'var(--mono)', marginLeft: 4 }}>({emp.l1Manager.employee_code})</span>
                </div>
              )}
              {emp.l2Manager && (
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: 'var(--ink4)' }}>L2 Manager: </span>
                  <span style={{ fontWeight: 500 }}>{emp.l2Manager.first_name} {emp.l2Manager.last_name}</span>
                  <span style={{ color: 'var(--ink4)', fontFamily: 'var(--mono)', marginLeft: 4 }}>({emp.l2Manager.employee_code})</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab} type="button"
              onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? 'var(--blue)' : 'var(--ink4)', borderBottom: activeTab === tab ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap', transition: 'all .15s' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card" style={{ padding: 24 }}>
          {/* ── Overview ── */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <Section title="Employment Details">
                  <Field label="Employee Code"     value={emp.employee_code} mono />
                  <Field label="Reference Code"    value={emp.reference_code} mono />
                  <Field label="Status"            value={<Chip variant={statusVariant(emp.status)}>{emp.status}</Chip>} />
                  <Field label="Employment Type"   value={emp.employment_type} />
                  <Field label="Actual DOJ"        value={formatDate(emp.actual_doj)} />
                  <Field label="Current DOJ"       value={formatDate(emp.current_doj)} />
                  <Field label="Tenure"            value={getTenure(emp.actual_doj)} />
                  <Field label="Working Site"      value={emp.working_site} />
                  <Field label="Working City"      value={emp.working_city} />
                  <Field label="State / Country"   value={emp.working_state_country} />
                  <Field label="Pay Register Loc." value={emp.pay_register_location} />
                  <Field label="Saturday Off"      value={emp.saturday_off ? 'Yes' : 'No'} />
                  <Field label="Grace Minutes"     value={emp.grace_minutes ? `${emp.grace_minutes} min` : '0 min'} />
                </Section>
                <Section title="Emergency Contact">
                  <Field label="Name"         value={emg?.contact_name} />
                  <Field label="Phone"        value={emg?.contact_number} />
                  <Field label="Relationship" value={emg?.relationship} />
                </Section>
              </div>
              <div>
                <Section title="Commitment & Probation">
                  <Field label="Commitment"       value={cp.commitment ? 'Yes' : 'No'} />
                  {cp.commitment && <>
                    <Field label="Term"            value={cp.commitment_term} />
                    <Field label="Entered On"      value={formatDate(cp.commitment_entered_on)} />
                    <Field label="End Date"        value={formatDate(cp.commitment_end_date)} />
                    <Field label="Status"          value={cp.commitment_status} />
                  </>}
                  <Field label="On Probation"     value={cp.on_probation ? 'Yes' : 'No'} />
                  {cp.on_probation && <>
                    <Field label="Probation Period"value={cp.probation_period} />
                    <Field label="Probation End"   value={formatDate(cp.probation_end_date)} />
                    <Field label="Probation Status"value={cp.probation_status} />
                    {cp.probation_extended_period && <Field label="Extended Period" value={cp.probation_extended_period} />}
                  </>}
                  <Field label="Confirmation"     value={cp.confirmation_status} />
                  {cp.confirmed_on && <Field label="Confirmed On" value={formatDate(cp.confirmed_on)} />}
                </Section>
                {exit.resignation_submitted && (
                  <Section title="Exit Details">
                    <Field label="Resignation Date"    value={formatDate(exit.resignation_date)} />
                    <Field label="Notice Period"       value={exit.notice_period} />
                    <Field label="Last Working Day"    value={formatDate(exit.last_working_day)} />
                    <Field label="Exit Status"         value={exit.exit_status} />
                    <Field label="Formalities Done"    value={exit.exit_formalities_done ? 'Yes' : 'No'} />
                  </Section>
                )}
              </div>
            </div>
          )}

          {/* ── Personal ── */}
          {activeTab === 'Personal' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <Section title="Personal Details">
                <Field label="Personal Email"   value={pers.personal_email} />
                <Field label="Personal Mobile"  value={pers.personal_mobile} />
                <Field label="Date of Birth"    value={formatDate(pers.date_of_birth)} />
                <Field label="Gender"           value={pers.gender} />
                <Field label="Blood Group"      value={pers.blood_group} />
                <Field label="Shirt Size"       value={pers.shirt_size} />
                <Field label="T-Shirt Size"     value={pers.tshirt_size} />
                <Field label="Nationality"      value={pers.nationality} />
                <Field label="Religion"         value={pers.religion} />
                <Field label="Marital Status"   value={pers.marital_status} />
                {pers.marital_status === 'Married' && <>
                  <Field label="Marriage Date"  value={formatDate(pers.marriage_date)} />
                  <Field label="Spouse Name"    value={pers.spouse_name} />
                  <Field label="Spouse DOB"     value={formatDate(pers.spouse_dob)} />
                  {pers.child1_name && <Field label="Child 1" value={`${pers.child1_name} (${formatDate(pers.child1_dob)})`} />}
                  {pers.child2_name && <Field label="Child 2" value={`${pers.child2_name} (${formatDate(pers.child2_dob)})`} />}
                  {pers.child3_name && <Field label="Child 3" value={`${pers.child3_name} (${formatDate(pers.child3_dob)})`} />}
                </>}
              </Section>
              <Section title="Education & Experience">
                <Field label="Highest Education" value={edu.highest_education} />
                <Field label="Stream"            value={edu.education_stream} />
                <Field label="Mode"              value={edu.education_mode} />
                <Field label="Institute"         value={edu.institute_name} />
                <Field label="Passing Year"      value={edu.passing_year} />
                <Field label="Marks / Grade"     value={edu.education_marks} />
                {exp.is_experienced && <>
                  <div style={{ height: 12 }} />
                  <Field label="Previous Company"  value={exp.last_company_name} />
                  <Field label="Last Designation"  value={exp.last_designation} />
                  <Field label="Last Working Day"  value={formatDate(exp.last_working_day)} />
                  <Field label="Last Salary"       value={formatINR(exp.last_inhand_salary ?? 0)} />
                  <Field label="Reference Contact" value={exp.exp_contact_name} />
                  <Field label="Reference Phone"   value={exp.exp_contact_number} />
                </>}
              </Section>
            </div>
          )}

          {/* ── Family ── */}
          {activeTab === 'Family' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <Section title="Father's Details">
                <Field label="Salutation"   value={fam.father_salutation} />
                <Field label="Name"         value={fam.father_name} />
                <Field label="Age / DOB"    value={fam.father_age_dob} />
                <Field label="Occupation"   value={fam.father_occupation} />
                <Field label="Status"       value={fam.father_status} />
              </Section>
              <Section title="Mother's Details">
                <Field label="Salutation"   value={fam.mother_salutation} />
                <Field label="Name"         value={fam.mother_name} />
                <Field label="Age / DOB"    value={fam.mother_age_dob} />
                <Field label="Occupation"   value={fam.mother_occupation} />
              </Section>
            </div>
          )}

          {/* ── Address ── */}
          {activeTab === 'Address' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <Section title="Present Address">
                <Field label="House Type"   value={pAddr?.house_type} />
                <Field label="House No."    value={pAddr?.house_no} />
                <Field label="Area"         value={pAddr?.area} />
                <Field label="District"     value={pAddr?.district} />
                <Field label="City"         value={pAddr?.city} />
                <Field label="State"        value={pAddr?.state} />
                <Field label="Country"      value={pAddr?.country} />
                <Field label="Pin Code"     value={pAddr?.pincode} mono />
              </Section>
              <Section title="Permanent Address">
                {xAddr?.is_same_as_present ? (
                  <div style={{ padding: '10px 14px', background: 'var(--blue-lt)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--blue)' }}>✓ Same as present address</div>
                ) : <>
                  <Field label="House Type"   value={xAddr?.house_type} />
                  <Field label="House No."    value={xAddr?.house_no} />
                  <Field label="Area"         value={xAddr?.area} />
                  <Field label="District"     value={xAddr?.district} />
                  <Field label="City"         value={xAddr?.city} />
                  <Field label="State"        value={xAddr?.state} />
                  <Field label="Country"      value={xAddr?.country} />
                  <Field label="Pin Code"     value={xAddr?.pincode} mono />
                </>}
              </Section>
            </div>
          )}

          {/* ── Schemes ── */}
          {activeTab === 'Schemes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <Section title="PF (Provident Fund)">
                  <Field label="PF Status"          value={sch.pf_status ? <Chip variant="green">Active</Chip> : <Chip variant="gray">Inactive</Chip>} />
                  {sch.pf_status && <>
                    <Field label="UAN Number"       value={sch.uan_number} mono />
                    <Field label="EPFO Member ID"   value={sch.epfo_member_id} mono />
                    <Field label="Contribution %"   value={sch.pf_contribution_pct ? `${sch.pf_contribution_pct}%` : '—'} />
                    <Field label="Employer From"    value={sch.pf_employer_from} />
                  </>}
                </Section>
                <Section title="ESIC">
                  <Field label="ESIC Status"  value={sch.esic_status ? <Chip variant="green">Active</Chip> : <Chip variant="gray">Inactive</Chip>} />
                  {sch.esic_status && <Field label="ESIC Number" value={sch.esic_number} mono />}
                </Section>
                <Section title="Mediclaim">
                  <Field label="Status"        value={sch.mediclaim_status} />
                  {sch.mediclaim_status === 'Yes' && <>
                    <Field label="Policy No."  value={sch.mediclaim_number} mono />
                    <Field label="Amount"      value={formatINR(sch.mediclaim_amount ?? 0)} />
                  </>}
                </Section>
              </div>
              <Section title="RD Scheme (Retention)">
                <Field label="RD Scheme"        value={sch.rd_scheme ? <Chip variant="green">Active</Chip> : <Chip variant="gray">Inactive</Chip>} />
                {sch.rd_scheme && <>
                  <Field label="Term"           value={sch.rd_term} />
                  <Field label="Opening Date"   value={formatDate(sch.rd_opening_date)} />
                  <Field label="Account No."    value={sch.rd_account_number} mono />
                  <Field label="Deduction From" value={sch.rd_deduction_from} />
                  <Field label="Emp. Amount"    value={formatINR(sch.rd_amount_employee ?? 0)} />
                  <Field label="Empl. Amount"   value={formatINR(sch.rd_amount_employer ?? 0)} />
                  <Field label="Maturity Date"  value={formatDate(sch.rd_maturity_date)} />
                  <Field label="Maturity Amt."  value={formatINR(sch.rd_maturity_amount ?? 0)} />
                  <Field label="Status"         value={sch.rd_status} />
                </>}
              </Section>
            </div>
          )}

          {/* ── Documents & IDs ── */}
          {activeTab === 'Documents & IDs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <Section title="Travel Documents">
                  <Field label="Passport No."        value={st.passport_number} mono />
                  <Field label="Passport Expiry"     value={formatDate(st.passport_expiry)} />
                  <Field label="Yellow Fever"        value={st.yellow_fever ? 'Yes' : 'No'} />
                  {st.yellow_fever && <Field label="Injection Date" value={formatDate(st.yellow_fever_date)} />}
                  <Field label="Driving License No." value={st.driving_license_number} mono />
                  <Field label="DL Expiry"           value={formatDate(st.driving_license_expiry)} />
                </Section>
              </div>
              <Section title="Government IDs">
                {canSeeSensitive ? <>
                  <Field label="Aadhaar No."    value={st.aadhaar_number} mono />
                  <Field label="Aadhaar Address"value={st.aadhaar_address} />
                  <Field label="PAN No."        value={st.pan_number} mono />
                  <Field label="Name as per PAN"value={st.pan_full_name} />
                  <Field label="DOB in PAN"     value={formatDate(st.pan_dob)} />
                  <Field label="Parent / Spouse"value={st.pan_parent_spouse_name} />
                </> : (
                  <div style={{ padding: '12px 14px', background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--amber)' }}>
                    🔒 Govt ID details are restricted to HR and Admin roles.
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ── Bank ── */}
          {activeTab === 'Bank' && (
            canSeeSensitive ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <Section title="Personal Bank (Salary Account)">
                  <Field label="Bank Name"      value={pBank?.bank_name} />
                  <Field label="Account No."    value={pBank?.account_number} mono />
                  <Field label="IFSC Code"      value={pBank?.ifsc_code} mono />
                  <Field label="Branch"         value={pBank?.branch_name} />
                </Section>
                <Section title="Official Bank (Expense Account)">
                  {oBank ? <>
                    <Field label="Bank Name"    value={oBank.bank_name} />
                    <Field label="Account No."  value={oBank.account_number} mono />
                    <Field label="IFSC Code"    value={oBank.ifsc_code} mono />
                    <Field label="Branch"       value={oBank.branch_name} />
                  </> : <p style={{ fontSize: 12, color: 'var(--ink4)', fontStyle: 'italic' }}>No official bank account on file.</p>}
                </Section>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                <p style={{ fontSize: 13, color: 'var(--ink4)' }}>Bank details are restricted to HR and Admin roles.</p>
              </div>
            )
          )}

          {/* ── Salary ── */}
          {activeTab === 'Salary' && (
            canSeeSensitive ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <div>
                  <Section title="Current Salary">
                    <Field label="Mode of Payment"  value={curSal?.salary_mode} />
                    <Field label="Basic"             value={formatINR(curSal?.basic ?? 0)} />
                    <Field label="HRA"               value={formatINR(curSal?.hra ?? 0)} />
                    <Field label="Allowance 1"       value={formatINR(curSal?.allowance1 ?? 0)} />
                    <Field label="Gross PM"          value={<strong style={{ color: 'var(--blue)' }}>{formatINR(curSal?.gross_salary_pm ?? 0)}</strong>} />
                    <Field label="AMDB PM"           value={formatINR(curSal?.amdb_pm ?? 0)} />
                    <Field label="Total Earning PM"  value={<strong style={{ color: 'var(--green)', fontSize: 14 }}>{formatINR(curSal?.total_earning_pm ?? 0)}</strong>} />
                  </Section>
                  <Section title="Asset Deduction">
                    <Field label="Applicable"        value={ad.asset_deduction_applicable ? 'Yes' : 'No'} />
                    {ad.asset_deduction_applicable && <>
                      <Field label="Security Amount" value={formatINR(ad.security_amount ?? 0)} />
                      <Field label="Months"          value={ad.deduction_months} />
                      <Field label="From"            value={ad.deduction_from} />
                      <Field label="Monthly Dedn."   value={formatINR(ad.monthly_deduction ?? 0)} />
                      <Field label="Last Installment"value={formatINR(ad.last_installment ?? 0)} />
                    </>}
                  </Section>
                </div>
                <Section title="Joining Salary">
                  <Field label="Basic"             value={formatINR(joiSal?.basic ?? 0)} />
                  <Field label="HRA"               value={formatINR(joiSal?.hra ?? 0)} />
                  <Field label="Allowance 1"       value={formatINR(joiSal?.allowance1 ?? 0)} />
                  <Field label="Gross PM"          value={<strong>{formatINR(joiSal?.gross_salary_pm ?? 0)}</strong>} />
                  <Field label="AMDB PM"           value={formatINR(joiSal?.amdb_pm ?? 0)} />
                  <Field label="Total Earning PM"  value={<strong>{formatINR(joiSal?.total_earning_pm ?? 0)}</strong>} />
                </Section>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                <p style={{ fontSize: 13, color: 'var(--ink4)' }}>Salary details are restricted to HR and Admin roles.</p>
              </div>
            )
          )}

          {/* ── Onboarding ── */}
          {activeTab === 'Onboarding' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 200, height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${docPct}%`, background: docPct === 100 ? 'var(--green)' : 'var(--amber)', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: docPct === 100 ? 'var(--green)' : 'var(--amber)' }}>{docPct}% documents received</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { key: 'offer_letter',           label: 'Offer Letter' },
                  { key: 'address_verification',   label: 'Address Verification' },
                  { key: 'service_agreement',      label: 'Service Agreement' },
                  { key: 'indemnity_bond',         label: 'Indemnity Bond' },
                  { key: 'asset_deduction_letter', label: 'Asset Deduction Letter' },
                  { key: 'account_opening_letter', label: 'Account Opening Letter' },
                  { key: 'nda',                    label: 'Non-Disclosure Agreement' },
                ].map(d => (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: (doc as any)[d.key] ? 'var(--green-lt)' : 'transparent' }}>
                    <span style={{ fontSize: 16 }}>{(doc as any)[d.key] ? '✅' : '⬜'}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</span>
                    {(doc as any)[d.key]
                      ? <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--green)' }}>Received</span>
                      : <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink4)' }}>Pending</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Transfers ── */}
          {activeTab === 'Transfers' && (
            xfer.length > 0 ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {xfer.map((t:EmployeeTransfer) => (
                  <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--ink)' }}>Transfer #{t.transfer_order}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Assignment</div>
                        <Field label="Transferred On"  value={formatDate(t.transferred_on)} />
                        <Field label="New Company"     value={t.new_company} />
                        <Field label="Joining Date"    value={formatDate(t.new_joining_date)} />
                        <Field label="New Location"    value={t.new_location} />
                        <Field label="New Department"  value={t.new_department} />
                        <Field label="New Job Title"   value={t.new_job_title} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Assignment</div>
                        <Field label="Exit Date"       value={formatDate(t.exit_date)} />
                        <Field label="Old Company"     value={t.old_company} />
                        <Field label="Old Location"    value={t.old_location} />
                        <Field label="Old Department"  value={t.old_department} />
                        <Field label="Old Job Title"   value={t.old_job_title} />
                        <Field label="Old Emp. Code"   value={t.old_emp_code} mono />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏢</div>
                <p>No transfer history on record.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}
        title="Remove Employee"
        subtitle={`Remove ${getFullName(emp)} (${emp.employee_code})?`}
        footer={<>
          <button className="btn btn-sec" onClick={() => setDeleteOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Removing…' : 'Yes, Remove'}
          </button>
        </>}
      >
        <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
          ⚠ Soft delete — record is preserved in audit logs. Portal access will be revoked immediately.
        </div>
      </Modal>
    </AppShell>
  );
}