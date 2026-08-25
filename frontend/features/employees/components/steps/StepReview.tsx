'use client';
import { useEmployee } from '../../hooks/useEmployees';

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
  const docs = emp.onboardingDocs ?? {};
  const fmt  = (n: number) => n ? `₹${new Intl.NumberFormat('en-IN').format(n)}` : '—';

  // HR/Candidate breakdown — falls back gracefully if the API hasn't been
  // updated to return these two fields yet (older responses just have
  // form_completion_pct).
  const hrPct        = emp.hr_completion_pct ?? emp.form_completion_pct ?? 0;
  const candidatePct = emp.candidate_completion_pct ?? emp.form_completion_pct ?? 0;
  const overallPct   = emp.form_completion_pct ?? Math.round((hrPct + candidatePct) / 2);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ background: 'var(--blue-lt)', borderRadius: 'var(--r2)', padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 32 }}>{overallPct >= 90 ? '✅' : '⚠️'}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{overallPct}% Complete</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            {emp.employee_code ?? 'Code pending'} · {emp.first_name} {emp.last_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>HR {hrPct}% · Candidate {candidatePct}%</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Portal Access</div>
          <div style={{ fontWeight: 600, color: emp.portal_access ? 'var(--green)' : 'var(--red)' }}>{emp.portal_access ? '✓ Enabled' : '✗ Disabled'}</div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700 }}>Employment</div>
      <Row label="Employee Code"    value={emp.employee_code ?? 'Pending — issued at 100% completion'} />
      <Row label="Status"           value={emp.status} />
      <Row label="Employment Type"  value={emp.employment_type} />
      <Row label="Working City"     value={emp.working_city} />
      <Row label="L1 Manager"       value={emp.l1Manager ? `${emp.l1Manager.first_name} ${emp.l1Manager.last_name} (${emp.l1Manager.employee_code ?? 'code pending'})` : '—'} />
      <Row label="Date of Joining"  value={emp.actual_doj} />
      <Row label="Probation"        value={cp.on_probation ? `Yes — ${cp.probation_period ?? 'period not set'}` : 'No'} />

      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>Salary (Current)</div>
      <Row label="Basic"           value={fmt(salary?.basic)} />
      <Row label="HRA"             value={fmt(salary?.hra)} />
      <Row label="Allowance"       value={fmt(salary?.allowance1)} />
      <Row label="Gross"           value={fmt(salary?.gross_salary_pm)} />
      <Row label="AMDB"            value={fmt(salary?.amdb_pm)} />
      <Row label="Total Earning"   value={fmt(salary?.total_earning_pm)} />

      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>HR Joining Checklist</div>
      {['offer_letter','address_verification','service_agreement','indemnity_bond','asset_deduction_letter','account_opening_letter','nda'].map(k => (
        <Row key={k} label={k.replace(/_/g,' ')} value={docs[k] ? '✓ Received' : '✗ Pending'} />
      ))}

      <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--r2)', fontSize: 12, color: 'var(--ink3)' }}>
        HR reviews both parts, then submits. Candidate sections can stay incomplete until the self-portal is finished. The employee code is issued automatically once every HR and Candidate step is complete.
      </div>
    </div>
  );
}
