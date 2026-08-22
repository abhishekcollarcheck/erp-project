'use client';
import type { ModuleDef } from '../types/permissions.types';
import { PERMS, PERM_ICONS, PERM_LABELS } from '../constants/rolePermissionsConstants';
import type { ModulePerms } from '../constants/rolePermissionsConstants';
import { countPerm, distinctModuleCount } from '../utils/rolePermissionsUtils';

type CompanyModPerms = {
  companyId: number;
  companyName: string;
  shortName: string;
  modPerms: ModulePerms;
};

export function PermSummary({ modPerms, modules, isOverrideMode = false, perCompanyModPerms }: {
  modPerms: ModulePerms;
  modules: ModuleDef[];
  isOverrideMode?: boolean;
  perCompanyModPerms?: CompanyModPerms[];
}) {
  // Company-wise breakdown — this group's permissions can legitimately
  // differ per company, so a single count only ever told the truth for
  // whichever one company companyFilter happened to be on. Falls back to
  // the single-block view below for override mode (a per-employee
  // exception, not a per-company grant) or when there's only one company
  // to show anyway. Same row-list look as before, just repeated per company
  // under a small heading rather than one flat list.
  const showPerCompany = !isOverrideMode && perCompanyModPerms && perCompanyModPerms.length > 1;

  if (showPerCompany) {
    return (
      <div className="card cp">
        <div className="ct" style={{ marginBottom: 12 }}>Permission Summary</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {perCompanyModPerms!.map((co, i) => {
            const rows = PERMS.map(p => ({ p, count: countPerm(co.modPerms, p, modules) })).filter(x => x.count > 0);
            return (
              <div
                key={co.companyId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  padding: '8px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)' }}>
                  {co.companyName}
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {rows.length === 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic' }}>None assigned</span>
                  ) : rows.map(({ p, count }) => (
                    <span key={p} title={`${PERM_LABELS[p]}: ${count} modules`}
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ink3)', borderRadius: 99 }}>
                      {PERM_ICONS[p]} {count}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink4)' }}>
          Grants can differ per company this group applies to.
        </div>
      </div>
    );
  }

  return (
    <div className="card cp">
      <div className="ct" style={{ marginBottom: 12 }}>Permission Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {PERMS.map(p => {
          const count = countPerm(modPerms, p, modules);
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>{PERM_ICONS[p]} {PERM_LABELS[p]}</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: count > 0 ? 'var(--blue)' : 'var(--ink4)' }}>
                {count} / {distinctModuleCount(modules)}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink4)' }}>
        {isOverrideMode
          ? 'Overrides differ from group defaults only where toggled.'
          : 'This company\u2019s permissions.'}
      </div>
    </div>
  );
}