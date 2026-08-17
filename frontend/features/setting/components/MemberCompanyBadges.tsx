'use client';

export function MemberCompanyBadges({ member, assignedCompanies, onRemoveCompany }: {
  member: any;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  onRemoveCompany: (companyId: number) => void;
}) {
  if (!member.assigned_company_ids?.length) return null;

  const companies = member.assigned_company_ids
    .map((id: number) => assignedCompanies.find(ac => ac.id === id))
    .filter(Boolean) as { id: number; name: string; shortName: string }[];

  if (!companies.length) return null;

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 200 }}>
      {companies.map(c => (
        <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 6px 2px 9px', fontSize: 10, fontWeight: 600, color: 'var(--ink3)' }} title={c.name}>
          {c.shortName}
          <span
            onClick={(e) => { e.stopPropagation(); onRemoveCompany(c.id); }}
            style={{ cursor: 'pointer', color: 'var(--ink4)', fontWeight: 700, padding: '0 2px' }}
            title={`Remove from ${c.name}`}
          >
            ✕
          </span>
        </span>
      ))}
    </div>
  );
}
