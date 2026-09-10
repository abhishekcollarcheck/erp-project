'use client';
/**
 * Field-permission context for the employee wizard.
 *
 * The wizard wraps its steps in <FieldPermProvider>, passing the resolved
 * per-field permission map, the live completion % of the record being edited,
 * and a `bypass` flag (super admins skip enforcement entirely).
 *
 * Each step calls `const f = useFieldPerm()` and then `f('field_key')` to get a
 * fully-resolved FieldPermissionEntry — with `can_edit` already folded to
 * `can_edit || (can_add && completionPct < 100)` (the Add / onboarding rule).
 *
 * Used with no provider (e.g. a step reused in a read-only context) it defaults
 * to full access, matching the pre-enforcement behaviour.
 */
import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { FieldPermissionEntry } from '../../rbac/types/rbac.types';
import { FULL_PERM, DEFAULT_PERM } from '../../rbac/types/rbac.types';

export type FieldPermMap = Record<string, Partial<FieldPermissionEntry>> | undefined;

interface FieldPermCtx {
  fp: FieldPermMap;
  completionPct: number;
  bypass: boolean;
}

const Ctx = createContext<FieldPermCtx>({ fp: undefined, completionPct: 100, bypass: true });

export function FieldPermProvider({
  fp, completionPct, bypass, children,
}: FieldPermCtx & { children: ReactNode }) {
  return <Ctx.Provider value={{ fp, completionPct, bypass }}>{children}</Ctx.Provider>;
}

/** Resolve one field's effective permissions (completion-folded, bypass-aware). */
export function resolveFieldPerm(
  fp: FieldPermMap,
  name: string,
  opts: { completionPct?: number; bypass?: boolean } = {},
): FieldPermissionEntry {
  if (opts.bypass) return FULL_PERM;
  // No map at all (loading, or a group that was never field-configured) ⇒
  // don't lock anything — the backend applies the real gate on read/write.
  if (!fp || Object.keys(fp).length === 0) return FULL_PERM;

  const raw = fp[name];
  if (!raw) return { ...DEFAULT_PERM };

  const entry: FieldPermissionEntry = { ...DEFAULT_PERM, ...raw };
  const pct = opts.completionPct ?? 100;
  // Full mask wins over partial.
  const is_partial_masked = entry.is_masked ? false : entry.is_partial_masked;
  // Masking takes precedence over every other grant.
  if (entry.is_masked || is_partial_masked) {
    return { ...entry, is_partial_masked, can_add: false, can_edit: false, can_copy: false, can_download: false };
  }
  const can_edit = entry.can_edit || (entry.can_add && pct < 100);
  return { ...entry, can_edit, is_partial_masked };
}

/** Wizard-scoped helper: `const f = useFieldPerm(); f('field_key')`. */
export function useFieldPerm() {
  const { fp, completionPct, bypass } = useContext(Ctx);
  return useCallback(
    (name: string) => resolveFieldPerm(fp, name, { completionPct, bypass }),
    [fp, completionPct, bypass],
  );
}
