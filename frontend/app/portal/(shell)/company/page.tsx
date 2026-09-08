'use client';
import { usePortalCompany } from '../../../../features/candidates/hooks/usePortal';

const TEAM = [
  { initials: 'SA', name: 'Siddharth A.', role: 'Design Lead' },
  { initials: 'MK', name: 'Meera K.', role: 'Sr. UX Designer' },
  { initials: 'AR', name: 'Aarav Rao', role: 'HR — your recruiter' },
];

export default function PortalCompany() {
  const { data: company } = usePortalCompany();

  return (
    <>
      <h1 className="pc-h1">Company &amp; team</h1>
      <div className="pc-lead">A quick look at where you&rsquo;re headed and who you&rsquo;ll work with.</div>

      <div className="pc-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {company?.logo_url
            ? <img src={company.logo_url} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'contain', border: '1px solid #e6e9ef' }} />
            : <div style={{ width: 46, height: 46, borderRadius: 10, background: '#1e56d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }}>
                {(company?.name || 'C').slice(0, 2).toUpperCase()}
              </div>}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{company?.name || 'Company'}</div>
            {company?.address && <div className="pc-muted">{company.address}</div>}
          </div>
        </div>
      </div>

      <div className="pc-card">
        <div className="pc-ct">The team you&rsquo;ll meet</div>
        {TEAM.map(p => (
          <div key={p.initials} className="pc-row" style={{ alignItems: 'center' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#6c31d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginRight: 10 }}>{p.initials}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
              <div className="pc-muted">{p.role}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
