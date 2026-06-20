'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter }          from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../../../store';
import { setPageTitle }                  from '../../../../../store/slices/uiSlice';
import { selectUser }                    from '../../../../../store/slices/authSlice';
import { AppShell }                      from '../../../../../layouts/AppLayout';
import { Modal }                         from '../../../../../components/ui/Modal';
import { usePermission }                 from '../../../../../features/auth/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient                         from '../../../../../services/api/client';
import { showToast }                     from '../../../../../utils/toast';
import { formatDate }                    from '../../../../../utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SuperAdmin {
  id:              number;
  email:           string;
  full_name:       string;
  employee_code:   string;
  avatar_url?:     string | null;
  is_platform_sa:  boolean;
  is_primary:      boolean;
  assigned_at:     string;
  is_current_user: boolean;
}

interface Manager {
  employee: { id:number; first_name:string; last_name:string; email:string; employee_code:string; avatar_url?:string|null; is_super_admin:boolean; };
  role:        { id:number; name:string; slug:string } | null;
  is_primary:  boolean;
  assigned_at: string;
  is_company_super_admin: boolean;
}

interface EligibleData {
  employees: { id:number; full_name:string; email:string; employee_code:string; is_super_admin:boolean }[];
  roles:     { id:number; name:string; slug:string }[];
}

interface PermGroup {
  id:           number;
  name:         string;
  slug:         string;
  description?: string | null;
  color?:       string | null;
  is_system:    boolean;
  member_count: number;
}

interface GroupMember {
  id:            number;
  first_name:    string;
  last_name:     string;
  employee_code: string;
  official_email?: string;
}

interface CompanyDetail {
  id:number; name:string; slug:string; email?:string; phone?:string;
  city?:string; state?:string; country?:string; industry?:string;
    employee_count:number; is_active:boolean; super_admin_count:number;
  managers:Manager[];
  roles: { id:number; name:string; slug:string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Av({ name, size=36 }: { name:string; size?:number }) {
  const i = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--purple))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.32, fontWeight:700, flexShrink:0 }}>
      {i}
    </div>
  );
}

function Badge({ label, color='blue' }: { label:string; color?:string }) {
  const map: Record<string,{bg:string;text:string;bd:string}> = {
    blue:   { bg:'var(--blue-lt)',   text:'var(--blue)',   bd:'var(--blue-md)'   },
    purple: { bg:'var(--purple-lt)', text:'var(--purple)', bd:'var(--purple-bd)' },
    amber:  { bg:'var(--amber-lt)',  text:'var(--amber)',  bd:'var(--amber-bd)'  },
    green:  { bg:'var(--green-lt)',  text:'var(--green)',  bd:'var(--green-bd)'  },
    red:    { bg:'var(--red-lt)',    text:'var(--red)',    bd:'var(--red-bd)'    },
  };
  const c = map[color] || map.blue;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:c.bg, color:c.text, border:`1px solid ${c.bd}` }}>
      {label}
    </span>
  );
}

// ─── Permission groups in this company ────────────────────────────────────────

function PermissionGroupsTab({ companyId }: { companyId:number }) {
  const [expanded, setExpanded] = useState<number|null>(null);

  const { data: groups=[], isLoading } = useQuery({
    queryKey: ['company-perm-groups', companyId],
    queryFn:  () => apiClient.get<any,any>(`/permission-groups?company_id=${companyId}`),
    select:   (r:any) => (r.data ?? []) as PermGroup[],
  });

  const { data: members={} } = useQuery({
    queryKey: ['company-group-members', companyId, expanded],
    queryFn:  () => apiClient.get<any,any>(`/permission-groups/${expanded}/members`),
    enabled:  !!expanded,
    select:   (r:any) => ({ [expanded!]: (r.data ?? []) as GroupMember[] }),
  });

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'var(--ink4)' }}>Loading…</div>;

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Permission Groups</div>
      <div style={{ fontSize:12, color:'var(--ink4)', marginBottom:16 }}>
        Each group defines what its members can access in this company.
        Manage groups in <strong>Settings → Roles & Permissions</strong>.
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {groups.map(g => {
          const color = g.color || 'var(--blue)';
          const open  = expanded === g.id;
          const mems  = members[g.id] ?? [];
          return (
            <div key={g.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r3)', overflow:'hidden', boxShadow:'var(--sh)' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', cursor:'pointer', borderBottom: open ? '1px solid var(--border)' : 'none' }}
                onClick={() => setExpanded(open ? null : g.id)}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{g.name}</div>
                  <div style={{ fontSize:11, color:'var(--ink4)', marginTop:1 }}>{g.description || 'No description'}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 9px', borderRadius:99, background:`${color}20`, color, border:`1px solid ${color}40` }}>
                  {g.member_count} member{g.member_count!==1?'s':''}
                </span>
                {g.is_system && <Badge label="System" color="purple" />}
                <span style={{ color:'var(--ink4)', fontSize:13, marginLeft:4 }}>{open?'▴':'▾'}</span>
              </div>
              {/* Member list */}
              {open && (
                <div style={{ padding:'10px 18px', background:'var(--surface2)' }}>
                  {mems.length === 0 ? (
                    <div style={{ fontSize:12, color:'var(--ink4)', fontStyle:'italic' }}>No members in this group</div>
                  ) : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {mems.map(m => (
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:5, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:99, padding:'3px 10px 3px 4px', fontSize:11 }}>
                          <Av name={`${m.first_name} ${m.last_name}`} size={20}/>
                          <span style={{ fontWeight:500, color:'var(--ink2)' }}>{m.first_name}</span>
                          <span style={{ fontSize:9, color:'var(--ink4)' }}>{m.employee_code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {groups.length===0 && (
          <div style={{ padding:40, textAlign:'center', color:'var(--ink4)', fontSize:12 }}>
            No permission groups found. Go to <strong>Settings → Roles & Permissions</strong> to create them.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Promote to SA Modal (unchanged) ─────────────────────────────────────────

function PromoteModal({ companyId, currentSAs, onClose }: { companyId:number; currentSAs:number; onClose:()=>void }) {
  const qc = useQueryClient();
  const [selEmp, setSelEmp] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data: managers=[] } = useQuery({
    queryKey: ['managers', companyId],
    queryFn:  () => apiClient.get<any,any>(`/companies/${companyId}/managers`),
    select:   (r:any) => (r.data as Manager[]).filter(m => !m.is_company_super_admin),
  });

  const filtered = managers.filter(m =>
    !search || m.employee.first_name.toLowerCase().includes(search.toLowerCase()) ||
    m.employee.email.toLowerCase().includes(search.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: () => apiClient.post<any,any>(`/companies/${companyId}/super-admins/${selEmp!.id}/promote`),
    onSuccess: (r:any) => { qc.invalidateQueries({ queryKey:['company',companyId] }); qc.invalidateQueries({ queryKey:['company-super-admins',companyId] }); showToast(`✓ ${r.data.message}`); onClose(); },
    onError: (e:any) => showToast(e?.message||'Failed'),
  });

  return (
    <Modal open={true} onClose={onClose} title="Promote to Company Super Admin" width={460}
      footer={<><button className="btn btn-sec" onClick={onClose}>Cancel</button><button className="btn btn-pri" onClick={()=>mutation.mutate()} disabled={!selEmp||mutation.isPending}>{mutation.isPending?'Promoting…':'⚡ Promote'}</button></>}>
      <div style={{ background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', padding:'8px 12px', fontSize:11, color:'var(--amber)', marginBottom:12 }}>
        Currently <strong>{currentSAs}</strong> super admin{currentSAs!==1?'s':''}.
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', marginBottom:10 }}>
        <span style={{ color:'var(--ink4)' }}>⌕</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus placeholder="Search managers…"
          style={{ border:'none', background:'transparent', outline:'none', fontSize:12, fontFamily:'var(--font)', flex:1, color:'var(--ink)' }} />
      </div>
      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
        {filtered.length===0
          ? <div style={{ padding:20, textAlign:'center', color:'var(--ink4)', fontSize:12 }}>All managers are already super admins.</div>
          : filtered.map(m => (
            <div key={m.employee.id} onClick={()=>setSelEmp(m.employee)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', background:selEmp?.id===m.employee.id?'var(--blue-lt)':'transparent' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${selEmp?.id===m.employee.id?'var(--blue)':'var(--border2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {selEmp?.id===m.employee.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--blue)' }} />}
              </div>
              <Av name={`${m.employee.first_name} ${m.employee.last_name}`} size={28} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{m.employee.first_name} {m.employee.last_name}</div>
                <div style={{ fontSize:10, color:'var(--ink4)' }}>{m.employee.employee_code} · {m.role?.name||'No role'}</div>
              </div>
            </div>
          ))
        }
      </div>
    </Modal>
  );
}

// ─── Super Admins Tab (unchanged) ─────────────────────────────────────────────

function SuperAdminsTab({ companyId, companyName }: { companyId:number; companyName:string }) {
  const qc          = useQueryClient();
  const currentUser = useAppSelector(selectUser);
  const [promoteOpen, setPromoteOpen] = useState(false);

  const { data:superAdmins=[], isLoading } = useQuery({
    queryKey: ['company-super-admins', companyId],
    queryFn:  () => apiClient.get<any,any>(`/companies/${companyId}/super-admins`),
    select:   (r:any) => r.data as SuperAdmin[],
  });

  const demoteMut = useMutation({
    mutationFn: (empId:number) => apiClient.post<any,any>(`/companies/${companyId}/super-admins/${empId}/demote`),
    onSuccess:  (r:any) => { qc.invalidateQueries({ queryKey:['company-super-admins',companyId] }); qc.invalidateQueries({ queryKey:['company',companyId] }); showToast(r.data.message); },
    onError:    (e:any) => showToast(e?.message||'Failed'),
  });

  const saCount = superAdmins.length;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Company Super Admins</div>
          <div style={{ fontSize:12, color:'var(--ink4)', marginTop:2 }}>Full access to manage <strong>{companyName}</strong>. At least 1 required.</div>
        </div>
        <button className="btn btn-pri btn-sm" onClick={()=>setPromoteOpen(true)}>⚡ Promote Manager</button>
      </div>
      {saCount===1 && (
        <div style={{ background:'var(--amber-lt)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', padding:'10px 14px', fontSize:12, color:'var(--amber)', marginBottom:14 }}>
          ⚠ Only 1 super admin. Promote another before removing.
        </div>
      )}
      {isLoading ? <div style={{ padding:40, textAlign:'center', color:'var(--ink4)' }}>Loading…</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {superAdmins.map(sa => (
            <div key={sa.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:'3px solid var(--purple)', borderRadius:'var(--r3)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, boxShadow:'var(--sh)' }}>
              <Av name={sa.full_name} size={44} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{sa.full_name}</span>
                  <Badge label="⚡ Super Admin" color="purple" />
                  {sa.is_platform_sa && <Badge label="Platform SA" color="red" />}
                  {sa.is_primary     && <Badge label="★ Primary"   color="amber" />}
                  {sa.is_current_user && <Badge label="YOU"         color="blue" />}
                </div>
                <div style={{ fontSize:11, color:'var(--ink4)', marginTop:3 }}>{sa.employee_code} · {sa.email} · Since {formatDate(sa.assigned_at)}</div>
              </div>
              {!sa.is_current_user && !sa.is_platform_sa && (
                <button className="btn btn-sec btn-sm" style={{ fontSize:11, color:saCount<=1?'var(--ink4)':'var(--amber)', flexShrink:0 }}
                  disabled={saCount<=1}
                  onClick={()=>{ if(window.confirm(`Demote ${sa.full_name}?`)) demoteMut.mutate(sa.id); }}>
                  ↓ Demote
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {promoteOpen && <PromoteModal companyId={companyId} currentSAs={saCount} onClose={()=>setPromoteOpen(false)} />}
    </div>
  );
}

// ─── Assign Manager Modal — updated to use permission group ───────────────────

const PERMISSION_GROUPS = [
  { slug:'hr_manager',        name:'HR Manager',           description:'Full HR operations' },
  { slug:'finance_manager',   name:'Finance Manager',      description:'Payroll, expenses and financial reports' },
  { slug:'payroll_executive', name:'Payroll Executive',    description:'Process and manage payroll' },
  { slug:'recruiter',         name:'Recruiter',            description:'End-to-end recruitment and ATS' },
  { slug:'dept_manager',      name:'Department Manager',   description:'Manage team, approve leave' },
  { slug:'it_admin',          name:'IT Admin',             description:'Asset management, system settings' },
  { slug:'employee_self',     name:'Employee Self-Service',description:'View own data, apply for leaves' },
] as const;

function AssignManagerModal({ companyId, onClose }: { companyId:number; onClose:()=>void }) {
  const qc = useQueryClient();
  const [search,     setSearch]     = useState('');
  const [selEmp,     setSelEmp]     = useState<any>(null);
  const [groupSlug,  setGroupSlug]  = useState<string>('hr_manager');

  // Load all active employees (not just eligible managers)
  const { data:employees=[], isLoading } = useQuery({
    queryKey: ['all-active-employees'],
    queryFn:  () => apiClient.get<any,any>('/employees?limit=500&status=Active'),
    select:   (r:any) => r.data?.rows ?? r.data ?? [],
  });

  const filtered = useMemo(() =>
    employees.filter((e:any) => {
      const name = e.full_name ?? `${e.first_name} ${e.last_name}`.trim();
      return !search || name.toLowerCase().includes(search.toLowerCase()) || (e.email||'').toLowerCase().includes(search.toLowerCase());
    }), [employees, search]);

  const mutation = useMutation({
    mutationFn: () => apiClient.post<any,any>(`/companies/${companyId}/managers`, {
      employee_id: selEmp!.id,
      group_slug:  groupSlug,
    }),
    onSuccess: (r:any) => {
      qc.invalidateQueries({ queryKey:['company',companyId] });
      qc.invalidateQueries({ queryKey:['company-perm-groups',companyId] });
      showToast(`✓ ${r.data?.message || 'Manager assigned'}`);
      onClose();
    },
    onError: (e:any) => showToast(e?.message||'Failed'),
  });

  return (
    <Modal open={true} onClose={onClose} title="Give Company Access" width={520}
      footer={<>
        <button className="btn btn-sec" onClick={onClose}>Cancel</button>
        <button className="btn btn-pri" onClick={()=>mutation.mutate()} disabled={!selEmp||!groupSlug||mutation.isPending}>
          {mutation.isPending?'Assigning…':'✓ Give Access'}
        </button>
      </>}>

      <div style={{ background:'var(--blue-lt)', border:'1px solid var(--blue-md)', borderRadius:'var(--r)', padding:'8px 12px', fontSize:11, color:'var(--blue)', marginBottom:14 }}>
        ℹ The selected employee keeps their home company unchanged. They get access to this company via the chosen permission group.
      </div>

      {/* Employee search */}
      <div style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', marginBottom:6 }}>Employee</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'7px 10px', marginBottom:8 }}>
        <span style={{ color:'var(--ink4)' }}>⌕</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus placeholder="Search by name, email, code…"
          style={{ border:'none', background:'transparent', outline:'none', fontSize:12, fontFamily:'var(--font)', flex:1, color:'var(--ink)' }} />
      </div>
      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden', maxHeight:180, overflowY:'auto', marginBottom:16 }}>
        {isLoading ? <div style={{ padding:16, textAlign:'center', color:'var(--ink4)', fontSize:12 }}>Loading…</div>
        : filtered.slice(0,50).map((emp:any) => {
          const name = emp.full_name ?? `${emp.first_name} ${emp.last_name}`.trim();
          const sel  = selEmp?.id===emp.id;
          return (
            <div key={emp.id} onClick={()=>setSelEmp(sel?null:emp)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)', background:sel?'var(--blue-lt)':'transparent' }}>
              <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${sel?'var(--blue)':'var(--border2)'}`, background:sel?'var(--blue)':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {sel && <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }} />}
              </div>
              <Av name={name} size={26} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:sel?'var(--blue)':'var(--ink)' }}>{name}</div>
                <div style={{ fontSize:10, color:'var(--ink4)' }}>{emp.employee_code} · {emp.email||emp.official_email}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission group select */}
      <div style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', marginBottom:8 }}>Permission Group</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
        {PERMISSION_GROUPS.map(g => {
          const sel = groupSlug===g.slug;
          return (
            <div key={g.slug} onClick={()=>setGroupSlug(g.slug)}
              style={{ padding:'10px 12px', cursor:'pointer', border:`1px solid ${sel?'var(--blue)':'var(--border)'}`, borderRadius:'var(--r)', background:sel?'var(--blue-lt)':'var(--surface)', transition:'all .1s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', border:`2px solid ${sel?'var(--blue)':'var(--border2)'}`, background:sel?'var(--blue)':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {sel && <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff' }} />}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:sel?'var(--blue)':'var(--ink)' }}>{g.name}</div>
              </div>
              <div style={{ fontSize:10, color:'var(--ink4)', marginTop:3, paddingLeft:19 }}>{g.description}</div>
            </div>
          );
        })}
      </div>

      {/* Confirmation */}
      {selEmp && groupSlug && (
        <div style={{ padding:'8px 12px', background:'var(--green-lt,#f0fdf4)', border:'1px solid var(--green-bd,#bbf7d0)', borderRadius:'var(--r)', fontSize:11, color:'var(--green)' }}>
          ✓ <strong>{selEmp.full_name ?? `${selEmp.first_name} ${selEmp.last_name}`.trim()}</strong> → <strong>{PERMISSION_GROUPS.find(g=>g.slug===groupSlug)?.name}</strong>
        </div>
      )}
    </Modal>
  );
}

// ─── Edit Company Modal ────────────────────────────────────────────────────────

function EditCompanyModal({ company, onClose }: { company:CompanyDetail; onClose:()=>void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name:              company.name,
    city:              company.city   || '',
    state:             company.state  || '',
    country:           company.country|| 'India',
    email:             company.email  || '',
    phone:             company.phone  || '',
    industry:          company.industry || '',
  });
  const F = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setF(p=>({...p,[k]:e.target.value}));

  const mutation = useMutation({
    mutationFn: () => apiClient.put<any,any>(`/companies/${company.id}`, {
      ...f,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['company',company.id] });
      showToast('✓ Company updated');
      onClose();
    },
    onError: (e:any) => showToast(e?.message||'Failed to update'),
  });

  return (
    <Modal open={true} onClose={onClose} title={`Edit ${company.name}`} width={540}
      footer={<>
        <button className="btn btn-sec" onClick={onClose}>Cancel</button>
        <button className="btn btn-pri" onClick={()=>mutation.mutate()} disabled={!f.name.trim()||mutation.isPending}>
          {mutation.isPending?'Saving…':'✓ Save Changes'}
        </button>
      </>}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        <div className="fg" style={{ gridColumn:'1/-1' }}>
          <label>Company Name *</label>
          <input value={f.name} onChange={F('name')} autoFocus />
        </div>
        <div className="fg"><label>City</label><input value={f.city} onChange={F('city')} /></div>
        <div className="fg"><label>State</label><input value={f.state} onChange={F('state')} /></div>
        <div className="fg"><label>Country</label><input value={f.country} onChange={F('country')} /></div>
        <div className="fg"><label>Industry</label>
          <select value={f.industry} onChange={F('industry')}>
            <option value="">— Select —</option>
            {['Technology','Manufacturing','Finance','Healthcare','Education','Retail','Logistics','Media','Real Estate','Other'].map(i=><option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="fg"><label>Company Email</label><input type="email" value={f.email} onChange={F('email')} /></div>
        <div className="fg"><label>Phone</label><input value={f.phone} onChange={F('phone')} /></div>

      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { id }    = useParams();
  const companyId = Number(id);
  const dispatch  = useAppDispatch();
  const router    = useRouter();
  const qc        = useQueryClient();
  const { canEdit } = usePermission();

  const [tab,        setTab]        = useState<'overview'|'groups'|'managers'|'super-admins'|'settings'>('overview');
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);

  const removeMgr = useMutation({
    mutationFn: (empId:number) => apiClient.delete<any,any>(`/companies/${companyId}/managers/${empId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['company',companyId] }); showToast('Manager removed'); },
    onError:   (e:any) => showToast(e?.message||'Failed'),
  });

  const { data:company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn:  () => apiClient.get<any,any>(`/companies/${companyId}`),
    select:   (r:any) => r.data as CompanyDetail,
  });

  useEffect(() => { if (company) dispatch(setPageTitle({ title:company.name, breadcrumb:'Companies' })); }, [company,dispatch]);

  if (isLoading) return <AppShell><div style={{ padding:40, textAlign:'center', color:'var(--ink4)' }}>Loading…</div></AppShell>;
  if (!company)  return <AppShell><div style={{ padding:40, textAlign:'center', color:'var(--ink4)' }}>Not found</div></AppShell>;

  const tabs = [
    { id:'overview',     label:'Overview'                                },
    { id:'groups',       label:'Permission Groups'                       },
    { id:'managers',     label:`Managers (${company.managers?.length||0})`},
    { id:'super-admins', label:`Super Admins (${company.super_admin_count||0})`},
    { id:'settings',     label:'Settings'                                },
  ];

  return (
    <AppShell>
      <div className="pg-enter">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="ph" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={()=>router.push('/settings/companies')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink4)', fontSize:14, padding:4 }}>←</button>
            <div style={{ width:44, height:44, borderRadius:'var(--r2)', background:'linear-gradient(135deg,var(--blue),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700 }}>
              {company.name[0].toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <h1 style={{ fontSize:20 }}>{company.name}</h1>
                <Badge label={company.is_active?'Active':'Suspended'} color={company.is_active?'green':'red'} />
                <Badge label={`⚡ ${company.super_admin_count} SA`} color="purple" />
              </div>
              <div style={{ fontSize:12, color:'var(--ink4)', marginTop:2 }}>
                /{company.slug} · {company.employee_count} employees
              </div>
            </div>
            {canEdit('companies') && (
              <button className="btn btn-sec btn-sm" onClick={()=>setEditOpen(true)}>✎ Edit</button>
            )}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:24, overflowX:'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              style={{ padding:'10px 20px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'var(--font)', fontSize:13, whiteSpace:'nowrap',
                fontWeight: tab===t.id?600:400,
                color:      tab===t.id?'var(--blue)':'var(--ink4)',
                borderBottom: tab===t.id?'2px solid var(--blue)':'2px solid transparent',
                marginBottom:-2 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ──────────────────────────────────────── */}
        {tab==='overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r3)', padding:20, boxShadow:'var(--sh)' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--ink4)', marginBottom:14 }}>Company Info</div>
              {([
                ['Name',      company.name],
                ['Email',     company.email||'—'],
                ['Phone',     company.phone||'—'],
                ['City',      company.city ||'—'],
                ['State',     company.state||'—'],
                ['Country',   company.country||'—'],
                ['Industry',  company.industry||'—'],
                        ['Employees', `${company.employee_count}`],
                ['Super Admins',`${company.super_admin_count}`],
              ] as [string,string][]).map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <span style={{ color:'var(--ink4)' }}>{l}</span>
                  <span style={{ fontWeight:500, color:'var(--ink)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r3)', padding:20, boxShadow:'var(--sh)' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--ink4)', marginBottom:14 }}>System Roles</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {company.roles?.map(r => (
                  <span key={r.id} style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:r.slug==='super_admin'?'var(--purple-lt)':'var(--surface2)', color:r.slug==='super_admin'?'var(--purple)':'var(--ink3)', border:'1px solid var(--border)' }}>
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Permission Groups ──────────────────────────────── */}
        {tab==='groups' && <PermissionGroupsTab companyId={companyId} />}

        {/* ── Managers ──────────────────────────────────────── */}
        {tab==='managers' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Company Access</div>
                <div style={{ fontSize:12, color:'var(--ink4)', marginTop:2 }}>Employees who can access this company via permission groups.</div>
              </div>
              {canEdit('companies') && (
                <button className="btn btn-pri btn-sm" onClick={()=>setAssignOpen(true)}>+ Give Access</button>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(company.managers||[]).map(m => (
                <div key={m.employee.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:`3px solid ${m.is_company_super_admin?'var(--purple)':'var(--blue)'}`, borderRadius:'var(--r3)', padding:'12px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'var(--sh)' }}>
                  <Av name={`${m.employee.first_name} ${m.employee.last_name}`} size={38} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{m.employee.first_name} {m.employee.last_name}</span>
                      {m.role && <Badge label={`${m.is_company_super_admin?'⚡ ':''}${m.role.name}`} color={m.is_company_super_admin?'purple':'blue'} />}
                      {m.is_primary && <Badge label="★ Primary" color="amber" />}
                    </div>
                    <div style={{ fontSize:10, color:'var(--ink4)', marginTop:2 }}>{m.employee.employee_code} · {m.employee.email}</div>
                  </div>
                  {canEdit('companies') && !m.is_company_super_admin && (
                    <button className="btn btn-sec btn-sm" style={{ fontSize:11, color:'var(--red)' }}
                      onClick={()=>{ if(window.confirm(`Remove ${m.employee.first_name}?`)) removeMgr.mutate(m.employee.id); }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {!company.managers?.length && (
                <div style={{ padding:40, textAlign:'center', color:'var(--ink4)', fontSize:12 }}>
                  No one assigned yet. Click <strong>"+ Give Access"</strong> to assign an employee.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Super Admins ───────────────────────────────────── */}
        {tab==='super-admins' && <SuperAdminsTab companyId={companyId} companyName={company.name} />}

        {/* ── Settings ──────────────────────────────────────── */}
        {tab==='settings' && (
          <div style={{ maxWidth:520, display:'flex', flexDirection:'column', gap:16 }}>
            {/* Quick edit shortcut */}
            {canEdit('companies') && (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r3)', padding:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', marginBottom:6 }}>Company Details</div>
                <div style={{ fontSize:12, color:'var(--ink4)', marginBottom:12 }}>Update name, contact, subscription plan and limits.</div>
                <button className="btn btn-sec btn-sm" onClick={()=>setEditOpen(true)}>✎ Edit Company Details</button>
              </div>
            )}
            {/* Danger zone */}
            {canEdit('companies') && (
              <div style={{ background:'var(--red-lt)', border:'1px solid var(--red-bd)', borderRadius:'var(--r3)', padding:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--red)', marginBottom:6 }}>Danger Zone</div>
                {company.is_active
                  ? <button className="btn btn-sec btn-sm" style={{ fontSize:11, color:'var(--red)', borderColor:'var(--red-bd)' }}
                      onClick={()=>{ if(window.confirm(`Suspend ${company.name}?`)) apiClient.post<any,any>(`/companies/${companyId}/suspend`).then(()=>{ qc.invalidateQueries({ queryKey:['company',companyId] }); showToast('Company suspended'); }); }}>
                      ⏸ Suspend Company
                    </button>
                  : <button className="btn btn-sec btn-sm" style={{ fontSize:11, color:'var(--green)', borderColor:'var(--green-bd)' }}
                      onClick={()=>apiClient.post<any,any>(`/companies/${companyId}/activate`).then(()=>{ qc.invalidateQueries({ queryKey:['company',companyId] }); showToast('✓ Activated'); })}>
                      ▶ Activate Company
                    </button>
                }
              </div>
            )}
          </div>
        )}

      </div>

      {assignOpen && <AssignManagerModal companyId={companyId} onClose={()=>setAssignOpen(false)} />}
      {editOpen   && <EditCompanyModal   company={company}      onClose={()=>setEditOpen(false)} />}
    </AppShell>
  );
}