import type { ModuleDef } from '../types/permissions.types';
import { PERMS, COLOR_OPTS } from '../constants/rolePermissionsConstants';
import type { ModulePerms } from '../constants/rolePermissionsConstants';

// Fallback when a field's label isn't in the loaded form data:
// department_name → Department Name
export function humanizeFieldKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function cssForKey(key: string | null | undefined): string {
  return COLOR_OPTS.find((c) => c.key === key)?.css || key || 'var(--blue)';
}




// ─── slug ↔ modPerms helpers ──────────────────────────────────────────────────

export function initModulePerms(modules: ModuleDef[], on = false): ModulePerms {
  const out: ModulePerms = {};
  for (const m of modules) {
    out[m.key] = {};
    for (const p of PERMS) out[m.key][p] = on;
  }
  return out;
}

// Counts DISTINCT module keys with `perm` on — not array entries. Two
// different HrModule catalog rows can share the same key (permission_key
// collisions via HR_MODULE_TO_PERM_KEY, or two modules whose slugs both
// resolve to the same passthrough key), and modulePermsToSlugs already
// dedupes by key when saving (`new Set(out)`) — this makes counting match
// what actually gets saved instead of over-counting duplicates.
export function countPerm(mp: ModulePerms, perm: string, modules: ModuleDef[]) {
  const keys = new Set(modules.map(m => m.key));
  let n = 0;
  for (const key of keys) if (mp[key]?.[perm]) n++;
  return n;
}

// Distinct module count — same dedup basis as countPerm, so a "X / Y" denominator
// never shows more slots than actually exist as distinct permission keys.
export function distinctModuleCount(modules: ModuleDef[]) {
  return new Set(modules.map(m => m.key)).size;
}

export function slugsToModulePerms(slugs: string[], modules: ModuleDef[]): ModulePerms {
  const mp = initModulePerms(modules, false);
  for (const slug of slugs) {
    const [mod, action] = slug.split(':');
    if (mp[mod] && action) mp[mod][action] = true;
  }
  return mp;
}

// originalSlugs passthrough: never drop permissions for modules the client
// doesn't know about — setPermissions destroys-then-recreates from this array.
export function modulePermsToSlugs(
  mp: ModulePerms, modules: ModuleDef[], originalSlugs: string[] = [],
): string[] {
  const known = new Set(modules.map(m => m.key));
  const out = originalSlugs.filter(s => !known.has(s.split(':')[0]));
  for (const m of modules) {
    for (const p of PERMS) if (mp[m.key]?.[p]) out.push(`${m.key}:${p}`);
  }
  return [...new Set(out)];
}