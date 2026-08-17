'use client';
import type { ModuleDef } from '../types/permissions.types';
import { PERMS, PERM_LABELS } from '../constants/rolePermissionsConstants';
import type { ModulePerms } from '../constants/rolePermissionsConstants';
import { initModulePerms } from '../utils/rolePermissionsUtils';
import { PermToggle } from './PermToggle';

export function ModuleMatrix({ modPerms, onChange, isOverrideMode = false, moduleCompanyMap, assignedCompanies, overrideTargetCompanyIds, modules, companyFilter, setCompanyFilter }: {
  modPerms: ModulePerms;
  onChange: (mp: ModulePerms) => void;
  isOverrideMode?: boolean;
  moduleCompanyMap: Record<string, { label: string; companies: any[] }>;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  overrideTargetCompanyIds?: number[];
  modules: ModuleDef[];
  companyFilter: number | 'all';
  setCompanyFilter: (f: number | 'all') => void;
}) {
 
  const toggle = (mod: string, perm: string) => {
    const current = modPerms[mod] || {};

    const next: Record<string, boolean> = {
      ...current,
      [perm]: !current[perm],
    };

    // Any permission except View automatically enables View
    if (perm !== 'view' && next[perm]) {
      next.view = true;
    }

    // Turning View OFF removes every dependent permission
    if (perm === 'view' && !next.view) {
      next.create = false;
      next.edit = false;
      next.delete = false;
      next.download = false;
    }

    onChange({ ...modPerms, [mod]: next });
  };

  const toggleRow = (modKey: string) => {
    const current = modPerms[modKey] || {};
    const allEnabled = PERMS.every(p => current[p]);
    const next: Record<string, boolean> = allEnabled
      ? { view: false, create: false, edit: false, delete: false, download: false }
      : { view: true, create: true, edit: true, delete: true, download: true };

    onChange({ ...modPerms, [modKey]: next });
  };

  const setAll = (on: boolean) => onChange(initModulePerms(modules, on));

  const visibleModules = modules.filter(m => {
    if (companyFilter === 'all') return true;
    return (moduleCompanyMap[m.key]?.companies || []).some(co => co.id === companyFilter);
  });


  return (
    <div className="card cp">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="ct">
          {isOverrideMode ? 'Module Permissions (group-granted)' : 'Module Permissions'}
        </div>
        {!isOverrideMode && (
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAll(true)}>All On</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAll(false)}>All Off</button>
          </div>
        )}
      </div>

      {isOverrideMode && overrideTargetCompanyIds && overrideTargetCompanyIds.length > 0 && (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', marginBottom: 10, padding: '6px 10px', background: 'var(--purple-lt, #f3e8ff)', borderRadius: 'var(--r)' }}>
          Modules for: {overrideTargetCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.shortName || id).join(', ')}
        </div>
      )}

      {!isOverrideMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', marginRight: 4 }}>
            Company
          </span>
          <span
            onClick={() => setCompanyFilter('all')}
            style={{
              cursor: 'pointer', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600,
              border: companyFilter === 'all' ? '1px solid var(--blue)' : '1px solid var(--border2)',
              background: companyFilter === 'all' ? 'var(--blue-lt)' : 'var(--surface)',
              color: companyFilter === 'all' ? 'var(--blue)' : 'var(--ink3)',
            }}
          >
            🌐 All companies
          </span>
          {assignedCompanies.map(co => (
            <span
              key={co.id}
              onClick={() => setCompanyFilter(co.id)}
              style={{
                cursor: 'pointer', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                border: companyFilter === co.id ? '1px solid var(--blue)' : '1px solid var(--border2)',
                background: companyFilter === co.id ? 'var(--blue-lt)' : 'var(--surface)',
                color: companyFilter === co.id ? 'var(--blue)' : 'var(--ink3)',
              }}
            >
              {co.shortName}
            </span>
          ))}
          <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}>
            (filters the list — permissions are shared across companies)
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>Module</th>
              <th style={{ padding: '7px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', textAlign: 'center', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }} title="Toggle all for this module">
                All
              </th>
              {PERMS.map(p => (
                <th key={p} style={{ padding: '7px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {PERM_LABELS[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleModules.map(m => {
              const cur = modPerms[m.key] || {};
              const allOn = PERMS.every(p => cur[p]);
              const companiesForModule = moduleCompanyMap[m.key]?.companies || [];
              return (
                <tr key={m.key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                    {m.label}
                    {companiesForModule.map(co => (
                      <span
                        key={co.id}
                        title={co.name}
                        style={{
                          marginLeft: 5, fontSize: 9, fontWeight: 700,
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 4, padding: '1px 5px', color: 'var(--ink4)',
                        }}
                      >
                        {co.shortName}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                    <PermToggle on={allOn} onClick={() => toggleRow(m.key)} />
                  </td>
                  {PERMS.map(p => (
                    <td key={p} style={{ padding: '7px 6px', textAlign: 'center' }}>
                      <PermToggle on={!!cur[p]} onClick={() => toggle(m.key, p)} />
                    </td>
                  ))}
                </tr>
              );
            })}
            {visibleModules.length === 0 && (
              <tr>
                <td colSpan={PERMS.length + 2} style={{ padding: 20, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>
                  No modules available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
