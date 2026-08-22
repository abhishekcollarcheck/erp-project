'use client';
import { useState } from 'react';
import { Avatar } from './Avatar';

export function AddPersonForm({ notMembers, search, setSearch, assignedCompanies, onAdd }: {
  notMembers: any[];
  search: string;
  setSearch: (s: string) => void;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  onAdd: (empId: number, companyIds: number[]) => void;
}) {

  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
  const [allCompanies, setAllCompanies] = useState(false);

  const toggleChip = (id: number) => {
    setAllCompanies(false);
    setSelectedCompanies(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setAllCompanies(v => !v);
    setSelectedCompanies(new Set());
  };

  const chipStyle = (active: boolean, purple?: boolean): React.CSSProperties => ({
    cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 600,
    transition: 'all .1s', userSelect: 'none',
    border: active ? `1px solid ${purple ? 'var(--purple)' : 'var(--blue)'}` : '1px solid var(--border2)',
    background: active ? (purple ? 'var(--purple-lt, #f3e8ff)' : 'var(--blue-lt)') : 'var(--surface)',
    color: active ? (purple ? 'var(--purple)' : 'var(--blue)') : 'var(--ink3)',
  });

  const handleAdd = () => {
    if (!selectedEmp) return;
    const ids = allCompanies ? assignedCompanies.map(c => c.id) : [...selectedCompanies];
    onAdd(selectedEmp, ids);
    setSelectedEmp(null);
    setSelectedCompanies(new Set());
    setAllCompanies(false);
    setSearch('');
  };

  const canAdd = selectedEmp && (allCompanies || selectedCompanies.size > 0);
  const visible = notMembers.slice(0, 20);

  return (
    <div style={{ marginBottom: 12, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>

      {/* Employee search + select */}
      <div className="fg" style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 4, display: 'block' }}>Employee</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', marginBottom: 6 }}>
          <span style={{ color: 'var(--ink4)', fontSize: 14 }}>⌕</span>
          <input type="text" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} autoFocus
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--ink)', width: '100%', fontFamily: 'var(--font)' }} />
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visible.map((e: any) => {
            const eName = `${e.first_name} ${e.last_name}`;
            const isSelected = selectedEmp === e.id;
            return (
              <div key={e.id} onClick={() => setSelectedEmp(isSelected ? null : e.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--r)', cursor: 'pointer', background: isSelected ? 'var(--blue-lt)' : 'transparent', border: isSelected ? '1px solid var(--blue-md)' : '1px solid transparent' }}>
                <Avatar name={eName} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--blue)' : 'var(--ink)' }}>{eName}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink4)' }}>
                    {e.employee_code}
                    {e.company_id && assignedCompanies.find(c => c.id === e.company_id) && (
                      <span style={{ marginLeft: 5, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 6px', fontSize: 9, fontWeight: 600, color: 'var(--ink3)' }}>
                        {assignedCompanies.find(c => c.id === e.company_id)?.shortName}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && <span style={{ fontSize: 11, color: 'var(--blue)' }}>✓</span>}
              </div>
            );
          })}
          {notMembers.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink4)', textAlign: 'center', padding: '10px 0' }}>No matching employees</div>}
          {notMembers.length > visible.length && (
            <div style={{ fontSize: 10, color: 'var(--ink4)', textAlign: 'center', padding: '6px 0' }}>
              Showing {visible.length} of {notMembers.length} — refine your search
            </div>
          )}
        </div>
      </div>

      {/* Company scope chips */}
      <div className="fg" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 6, display: 'block' }}>Company Scope</label>
        {assignedCompanies.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic' }}>
            No companies available — you don&apos;t manage any company yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {assignedCompanies.map(co => (
              <span key={co.id} onClick={() => toggleChip(co.id)}
                style={chipStyle(!allCompanies && selectedCompanies.has(co.id))}>
                {co.name}
              </span>
            ))}
            <span onClick={toggleAll} style={chipStyle(allCompanies, true)}>
              🌐 All companies
            </span>
          </div>
        )}
      </div>

      <button className="btn btn-pri btn-sm" onClick={handleAdd} disabled={!canAdd}
        style={{ opacity: canAdd ? 1 : 0.5 }}>
        ✓ Add to Group
      </button>
    </div>
  );
}
