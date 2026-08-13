'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Modal } from '../../../../components/ui/Modal';
import { usePermission } from '../../../../hooks/usePermission';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../services/api/client';
import { authService } from '../../../../services/api/auth.service';
import { showToast } from '../../../../utils/toast';
import { formatDate } from '../../../../utils/formatters';
import { setCredentials } from '../../../../store/slices/authSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: number;
  name: string;
  slug: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  industry?: string | null;
  email?: string | null;
  employee_code_start?: number | null;
  employee_code_end?: number | null;
  employee_code_skip?: number | null;
  employee_count: number;
  is_active: boolean;
  onboarding_step: number;
  created_at: string;
  primary_manager?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  } | null;
}

interface EligibleEmployee {
  id: number;
  full_name: string;
  email: string;
  employee_code: string;
  is_super_admin: boolean;
}

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalEmployees: number;
  plans: Record<string, number>;
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatusBadge({ c }: { c: Company }) {
  if (!c.is_active) return <span className="badge-red">Suspended</span>;
  if (c.onboarding_step < 5) return <span className="badge-amber">Setup</span>;
  return <span className="badge-green">Active</span>;
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, React.CSSProperties> = {
    starter: { background: 'var(--surface2)', color: 'var(--ink4)' },
    growth: { background: 'var(--blue-lt)', color: 'var(--blue)' },
    enterprise: { background: 'var(--purple-lt)', color: 'var(--purple)' },
  };
  const s = styles[plan] || styles.starter;
  return (
    <span style={{
      ...s, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      textTransform: 'uppercase', letterSpacing: '.05em', border: '1px solid transparent', whiteSpace: 'nowrap'
    }}>
      {plan}
    </span>
  );
}

function Av({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,var(--blue),var(--purple))',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * .34, fontWeight: 700, flexShrink: 0
    }}>
      {initials}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'var(--ink)' }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 150, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r3)', padding: '16px 20px', boxShadow: 'var(--sh)'
    }}>
      <div style={{ fontSize: 26, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Create Company Modal ─────────────────────────────────────────────────────

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [pendingEmps, setPendingEmps] = useState<{ employee_id: number; role_slug: string; }[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [selEmpId, setSelEmpId] = useState<number | null>(null);
  const [selRoleSlug, setSelRoleSlug] = useState<string>('hr_manager');
  const [moduleIds, setModuleIds] = useState<number[]>([]);

  const [f, setF] = useState({ name: '', city: '', state: '', country: 'India', industry: '', email: '', employee_code_start: 0, employee_code_end: 0, employee_code_skip: '', theme_color: null });
  const F = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (open) {
      setStep(1); setEmpSearch(''); setSelEmpId(null); setSelRoleSlug('hr_manager');
      setPendingEmps([]); setModuleIds([]);
      setF({ name: '', city: '', state: '', country: 'India', industry: '', email: '', employee_code_start: 0, employee_code_end: 0, employee_code_skip: '', theme_color: null });
    }
  }, [open]);

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['all-active-employees'],
    queryFn: () => apiClient.get<any, any>('/employees?limit=100&status=Active'),
    enabled: open && step === 2,
    select: (r: any) => (r.data?.rows ?? r.data ?? []) as any[],
  });

  // Module catalog — Employee, Payroll, Sales, etc. Nothing is auto-selected;
  // admin explicitly picks what this company needs.
  const { data: moduleCatalog = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['module-catalog'],
    queryFn: () => apiClient.get<any, any>('/rbac/modules/catalog'),
    enabled: open && step === 3,
    select: (r: any) => (r.data ?? []) as { id: number; name: string; slug: string; icon: string | null; is_active: boolean }[],
    staleTime: 30_000,
  });
  const toggleModule = (id: number) =>
    setModuleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const ROLES = [
    { slug: 'super_admin', name: 'Super Admin' },
    { slug: 'hr_manager', name: 'HR Manager' },
    { slug: 'finance_manager', name: 'Finance Manager' },
    { slug: 'recruiter', name: 'Recruiter' },
    { slug: 'dept_manager', name: 'Dept. Manager' },
    { slug: 'it_admin', name: 'IT Admin' },
    { slug: 'employee', name: 'Employee' },
  ];

  const pendingIds = new Set(pendingEmps.map(p => p.employee_id));
  const filteredEmps = useMemo(() =>
    allEmployees.filter((e: any) => {
      if (pendingIds.has(e.id)) return false;
      const name = e.full_name ?? `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim();
      return !empSearch || name.toLowerCase().includes(empSearch.toLowerCase()) ||
        (e.email ?? '').toLowerCase().includes(empSearch.toLowerCase()) ||
        (e.employee_code ?? '').includes(empSearch);
    }), [allEmployees, empSearch, pendingIds]);

  const handleAddEmployee = () => {
    if (!selEmpId) return;
    const emp = allEmployees.find((e: any) => e.id === selEmpId);
    const role = ROLES.find(r => r.slug === selRoleSlug);
    if (!emp || !role) return;
    setPendingEmps(prev => [...prev, { employee_id: selEmpId, role_slug: selRoleSlug }]);
    setSelEmpId(null);
    setEmpSearch('');
  };

  const handleRemovePending = (empId: number) =>
    setPendingEmps(prev => prev.filter(p => p.employee_id !== empId));

  const mutation = useMutation({
    mutationFn: () => apiClient.post<any, any>('/companies', {
      name: f.name,
      city: f.city || undefined,
      state: f.state || undefined,
      industry: f.industry || undefined,
      email: f.email || undefined,
      employee_code_start: f.employee_code_start || null,
      employee_code_end: f.employee_code_end || null,
      employee_code_skip: f.employee_code_skip?.trim()
        ? JSON.stringify(
          f.employee_code_skip
            .split(',')
            .map(v => Number(v.trim()))
            .filter(v => !Number.isNaN(v))
        )
        : '[]',
      theme_color: f.theme_color || null,
      employees: pendingEmps.map(p => ({ employee_id: p.employee_id, role_slug: p.role_slug })),
      module_ids: moduleIds,
    }),
    onSuccess: async (r: any) => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['company-stats'] });
      try {
        // Refresh session so new company appears in managedCompanies immediately
        const res = await authService.getMe();
        const user = (res as any)?.data ?? res;
        const store = await import('../../../../store');
        const token = store.store.getState().auth.accessToken ?? '';
        if (user) dispatch(setCredentials({ user, accessToken: token }));
      } catch { /* non-fatal */ }
      showToast(`✓ ${r.data.name} created`);
      onClose();
    },
    onError: (e: any) => showToast((e as any)?.message || 'Failed to create company'),
  });

  const step1Valid = f.name.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Create New Company" width={580}
      footer={
        step === 1 ? (
          <>
            <button className="btn btn-sec" onClick={onClose}>Cancel</button>
            <button className="btn btn-pri" onClick={() => setStep(2)} disabled={!step1Valid}>
              Next: Assign Employees →
            </button>
          </>
        ) : step === 2 ? (
          <>
            <button className="btn btn-sec" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-pri" onClick={() => setStep(3)}>
              Next: Modules →
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sec" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-pri" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : '✓ Create Company'}
            </button>
          </>
        )
      }>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, marginTop: -4 }}>
        {['Company Details', 'Assign Employees', 'Modules'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                background: i < step ? 'var(--green)' : i + 1 === step ? 'var(--blue)' : 'var(--surface2)',
                color: i + 1 <= step ? '#fff' : 'var(--ink4)',
                border: `2px solid ${i + 1 <= step ? (i + 1 === step ? 'var(--blue)' : 'var(--green)') : 'var(--border2)'}`,
              }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: i + 1 === step ? 600 : 400, color: i + 1 === step ? 'var(--blue)' : i + 1 < step ? 'var(--green)' : 'var(--ink4)' }}>
                {label}
              </span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? 'var(--green)' : 'var(--border)', margin: '0 12px', borderRadius: 99 }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Company Details ─────────────────────────── */}
      {step === 1 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink4)', marginBottom: 10 }}>Company Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="fg" style={{ gridColumn: '1/-1' }}>
              <label>Company Name *</label>
              <input autoFocus value={f.name} onChange={F('name')} placeholder="e.g. Nexgen Solutions Pvt Ltd" />
            </div>
            <div className="fg"><label>City</label><input value={f.city} onChange={F('city')} /></div>
            <div className="fg"><label>State</label><input value={f.state} onChange={F('state')} /></div>
            <div className="fg"><label>Industry</label>
              <select value={f.industry} onChange={F('industry')}>
                <option value="">— Select —</option>
                {['Technology', 'Manufacturing', 'Finance', 'Healthcare', 'Education', 'Retail', 'Logistics', 'Media', 'Real Estate', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="fg"><label>Company Email</label><input type="email" value={f.email} onChange={F('email')} /></div>
            <div className="fg"><label>Employee Code Start</label><input type='number' value={f.employee_code_start} onChange={F('employee_code_start')} /></div>
            <div className="fg"><label>Employee Code End</label><input type='number' value={f.employee_code_end} onChange={F('employee_code_end')} /></div>
            <div className="fg"><label>Employee Code Skip</label><input value={f.employee_code_skip} onChange={F('employee_code_skip')} placeholder="36,40,68" /></div>
          </div>
        </>
      )}

      {/* ── Step 2: Assign Employees (optional, multiple allowed) ── */}
      {step === 2 && (
        <>
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 11, color: 'var(--ink3)', marginBottom: 12 }}>
            You are automatically <strong>Super Admin</strong>. Add more employees below (optional). Same role can be given to multiple employees.
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '7px 10px', marginBottom: 8 }}>
            <span style={{ color: 'var(--ink4)' }}>⌕</span>
            <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search by name, email or code…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, fontFamily: 'var(--font)', flex: 1, color: 'var(--ink)' }} />
          </div>

          {/* Employee list */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden', maxHeight: 150, overflowY: 'auto', marginBottom: 10 }}>
            {filteredEmps.length === 0
              ? <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>No employees found</div>
              : filteredEmps.slice(0, 50).map((emp: any) => {
                const name = emp.full_name ?? `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
                const sel = selEmpId === emp.id;
                return (
                  <div key={emp.id} onClick={() => setSelEmpId(sel ? null : emp.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: sel ? 'var(--blue-lt)' : 'transparent' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? 'var(--blue)' : 'var(--border2)'}`, background: sel ? 'var(--blue)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: sel ? 'var(--blue)' : 'var(--ink)' }}>{name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{emp.employee_code} · {emp.email || emp.official_email}</div>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Role + Add — only when employee selected */}
          {selEmpId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
              <div className="fg" style={{ flex: 1, marginBottom: 0 }}>
                <label style={{ fontSize: 11 }}>Role *</label>
                <select value={selRoleSlug} onChange={e => setSelRoleSlug(e.target.value)} style={{ marginTop: 4 }}>
                  {ROLES.map(r => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                </select>
              </div>
              <button className="btn btn-pri btn-sm" onClick={handleAddEmployee} style={{ flexShrink: 0 }}>
                + Add to List
              </button>
            </div>
          )}

          {/* Pending assignments */}
          {pendingEmps.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink4)', marginBottom: 6 }}>
                Will be assigned ({pendingEmps.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pendingEmps.map(p => (
                  <div key={p.employee_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink4)', margin: '0 6px' }}>→</span>
                    </div>
                    <button onClick={() => handleRemovePending(p.employee_id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14, padding: '0 4px' }}>✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Step 3: Modules (optional — can be enabled later) ── */}
      {step === 3 && (
        <>
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 11, color: 'var(--ink3)', marginBottom: 12 }}>
            Select the modules this company needs. Forms, fields, and field permissions are
            shared across every company with a module enabled — this only controls access.
            You can change this later from the company's settings.
          </div>

          {modulesLoading ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>Loading modules…</div>
          ) : moduleCatalog.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>No modules in the catalog yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {moduleCatalog.map(m => {
                const sel = moduleIds.includes(m.id);
                return (
                  <div key={m.id} onClick={() => m.is_active && toggleModule(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      cursor: m.is_active ? 'pointer' : 'not-allowed', opacity: m.is_active ? 1 : 0.5,
                      border: `1px solid ${sel ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 'var(--r2)',
                      background: sel ? 'var(--blue-lt)' : 'transparent',
                    }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${sel ? 'var(--blue)' : 'var(--border2)'}`, background: sel ? 'var(--blue)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? 'var(--blue)' : 'var(--ink)' }}>
                      {m.icon} {m.name}{!m.is_active && ' (inactive)'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();
  const { canEdit, isSuperAdmin } = usePermission();

  useEffect(() => { dispatch(setPageTitle({ title: 'Companies', breadcrumb: 'Settings' })); }, [dispatch]);

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['company-stats'],
    queryFn: () => apiClient.get<any, any>('/companies/platform-stats'),
    enabled: isSuperAdmin,
    select: (r: any) => r.data as PlatformStats,
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', search, planFilter],
    queryFn: () => apiClient.get<any, any>(`/companies?${new URLSearchParams({ ...(search ? { search } : {}), ...(planFilter ? { plan: planFilter } : {}) })}`),
    select: (r: any) => r.data?.rows ?? r.data ?? [],
  });

  const suspendMut = useMutation({
    mutationFn: (id: number) => apiClient.post<any, any>(`/companies/${id}/suspend`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); showToast('Company suspended'); },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });
  const activateMut = useMutation({
    mutationFn: (id: number) => apiClient.post<any, any>(`/companies/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); showToast('✓ Company activated'); },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  return (
    <AppShell>
      <div className="pg-enter">
        {/* Header */}
        <div className="ph">
          <div>
            <h1>Companies</h1>
            <p>{isSuperAdmin ? 'Manage all companies on the platform' : 'Companies you manage'}</p>
          </div>
          {canEdit('companies') && (
            <button className="btn btn-pri" onClick={() => setCreateOpen(true)}>+ New Company</button>
          )}
        </div>
        {isSuperAdmin && stats && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatCard label="Total Companies" value={stats.totalCompanies} color="var(--ink)" />
            <StatCard label="Active" value={stats.activeCompanies} color="var(--green)" />
            <StatCard label="Suspended" value={stats.suspendedCompanies} color="var(--red)" />
            <StatCard label="Total Employees" value={stats.totalEmployees} color="var(--blue)" />
            {Object.entries(stats.plans || {}).map(([plan, count]) => (
              <StatCard key={plan} label={plan} value={count} sub="companies" />
            ))}
          </div>
        )}

        {/* Filters */}
        {/* <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px' }}>
            <span style={{ color: 'var(--ink4)' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, fontFamily: 'var(--font)', flex: 1, color: 'var(--ink)' }} />
          </div>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--font)', background: 'var(--surface)', color: 'var(--ink)' }}>
            <option value="">All plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div> */}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 'var(--r3)', background: 'var(--surface)', border: '1px solid var(--border)' }}><div className="skeleton" style={{ height: '100%', borderRadius: 'var(--r3)' }} /></div>)}
          </div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No companies yet</div>
            {canEdit('companies') && <button className="btn btn-pri btn-sm" onClick={() => setCreateOpen(true)}>+ Create First Company</button>}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', overflow: 'hidden', boxShadow: 'var(--sh)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Company', 'Plan', 'Employees', 'Manager', 'Status', 'Created', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink4)',
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((co: Company) => (
                  <tr key={co.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => router.push(`/settings/companies/${co.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 'var(--r)', background: 'linear-gradient(135deg,var(--blue),var(--purple))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0
                        }}>
                          {co.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{co.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1 }}>
                            {co.slug} {co.city ? `· ${co.city}` : ''} {co.state ? `, ${co.state}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {co.primary_manager ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Av name={`${co.primary_manager.first_name} ${co.primary_manager.last_name}`} size={26} />
                          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{co.primary_manager.first_name} {co.primary_manager.last_name}</span>
                        </div>
                      ) : <span style={{ fontSize: 11, color: 'var(--ink4)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge c={co} /></td>
                    <td style={{ padding: '12px 14px', color: 'var(--ink4)' }}>{formatDate(co.created_at)}</td>
                    <td style={{ padding: '12px 14px', display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sec btn-sm" style={{ fontSize: 11 }}
                        onClick={() => router.push(`/settings/companies/${co.id}`)}>
                        Open →
                      </button>
                      {canEdit('companies') && (
                        co.is_active
                          ? <button className="btn btn-sec btn-sm" style={{ fontSize: 11, color: 'var(--amber)' }}
                            onClick={() => { if (window.confirm(`Suspend ${co.name}?`)) suspendMut.mutate(co.id); }}>
                            ⏸
                          </button>
                          : <button className="btn btn-sec btn-sm" style={{ fontSize: 11, color: 'var(--green)' }}
                            onClick={() => activateMut.mutate(co.id)}>
                            ▶
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppShell >
  );
}