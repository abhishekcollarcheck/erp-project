'use client';
import type { ModuleDef } from '../types/permissions.types';
import { PERMS, PERM_ICONS, PERM_LABELS } from '../constants/rolePermissionsConstants';
import type { ModulePerms } from '../constants/rolePermissionsConstants';
import { countPerm, distinctModuleCount } from '../utils/rolePermissionsUtils';

export function PermSummary({ modPerms, modules, isOverrideMode = false }: {
  modPerms: ModulePerms; modules: ModuleDef[]; isOverrideMode?: boolean;
}) {
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
          : 'Shared baseline across all companies this group applies to.'}
      </div>
    </div>
  );
}
