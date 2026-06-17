'use client';
import { useEmployee } from '../../hooks/useEmployees';
import { SectionTitle } from '../../../../components/form/SectionTitle';

interface Props { employeeId: number | null; methods: any }

const Row = ({ label, value }: { label: string; value: any }) => (
  <div style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
    <span style={{ width: 180, flexShrink: 0, color: 'var(--ink4)' }}>{label}</span>
    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{value ?? '—'}</span>
  </div>
);

export function StepReview({ employeeId }: Props) {
  const { data: emp } = useEmployee(employeeId ?? 0);
  if (!emp) return <div style={{ color: 'var(--ink4)', textAlign: 'center', padding: 40 }}>Save previous steps first to see the review.</div>;

  const cp = emp.commitmentProbation ?? {};
  const salary = emp.salaries?.find((s: any) => s.salary_type === 'current');
  const bank = emp.bankDetails?.find((b: any) => b.bank_type === 'personal');
  const docs = emp.onboardingDocs ?? {};
  const fmt  = (n: number) => n ? `₹${new Intl.NumberFormat('en-IN').format(n)}` : '—';

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ background: 'var(--blue-lt)', borderRadius: 'var(--r2)', padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 32 }}>{emp.form_completion_pct >= 90 ? '✅' : '⚠️'}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{emp.form_completion_pct}% Complete</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{emp.employee_code} · {emp.first_name} {emp.last_name}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Portal Access</div>
          <div style={{ fontWeight: 600, color: emp.portal_access ? 'var(--green)' : 'var(--red)' }}>{emp.portal_access ? '✓ Enabled' : '✗ Disabled'}</div>
        </div>
      </div>

      <SectionTitle title="Employment" />
      <Row label="Employee Code"    value={emp.employee_code} />
      <Row label="Status"           value={emp.status} />
      <Row label="Employment Type"  value={emp.employment_type} />
      <Row label="Working City"     value={emp.working_city} />
      <Row label="L1 Manager"       value={emp.l1Manager ? `${emp.l1Manager.first_name} ${emp.l1Manager.last_name} (${emp.l1Manager.employee_code})` : '—'} />
      <Row label="Actual DOJ"       value={emp.actual_doj} />
      <Row label="Probation"        value={cp.on_probation ? `Yes — ${cp.probation_period ?? 'period not set'}` : 'No'} />

      <SectionTitle title="Salary (Current)" />
      <Row label="Basic"           value={fmt(salary?.basic)} />
      <Row label="HRA"             value={fmt(salary?.hra)} />
      <Row label="Allowance"       value={fmt(salary?.allowance1)} />
      <Row label="Gross"           value={fmt(salary?.gross_salary_pm)} />
      <Row label="AMDB"            value={fmt(salary?.amdb_pm)} />
      <Row label="Total Earning"   value={fmt(salary?.total_earning_pm)} />

      <SectionTitle title="Onboarding Documents" />
      {['offer_letter','address_verification','service_agreement','indemnity_bond','asset_deduction_letter','account_opening_letter','nda'].map(k => (
        <Row key={k} label={k.replace(/_/g,' ')} value={docs[k] ? '✓ Received' : '✗ Pending'} />
      ))}

      <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--r2)', fontSize: 12, color: 'var(--ink3)' }}>
        <strong>Note:</strong> Clicking "Create Employee" will finalize the record. Portal access is automatically enabled once Offer Letter, Address Verification, and Service Agreement are all confirmed.
      </div>
    </div>
  );
}
