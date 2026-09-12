// features/rbac/hooks/useFieldPermissions.ts
//
// ONE shared file for field-level permissions, used by every module
// (Shifts, Employees, and all future master-data modules). Add a new module
// by calling useFieldPermissions('your_module') wherever you need it —
// nothing in this file changes per module.
//
// Backed by the real, confirmed endpoint: GET /employees/field-permissions?module=<module>
// (defined in employee.service.ts as fieldPermissions(module), but it serves
// every module via the `module` param — not employee-specific despite the route path).

'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import type { ApiResponse } from '@/types/api.types';
import type { FieldPermissionEntry } from '@/features/rbac/types/rbac.types';
import { FULL_PERM, DEFAULT_PERM } from '@/features/rbac/types/rbac.types';

export type FieldPermMap = Record<string, Partial<FieldPermissionEntry> | undefined>;

// ─── 1. Fetch layer — one hook per module, parameterized by module name ───────

/**
 * Fetches this user's resolved field permissions for ANY module.
 * Usage: const { data: fp } = useFieldPermissions('shifts');
 *        const { data: fp } = useFieldPermissions('employees');
 *
 * The raw response is nested by form_id (a module can have multiple forms/
 * steps, e.g. Employees has one per wizard step):
 *   { "1": { avatar_url: {...}, first_name: {...} }, "2": { ... } }
 * We flatten every form's field map into one — callers just want
 * field_key -> permission and don't need to know which form it came from.
 */
export function useFieldPermissions(module: string) {
  return useQuery({
    queryKey: ['field-permissions', module],
    queryFn: async () => {
      const res = await apiClient.get<unknown, ApiResponse<Record<string, FieldPermMap>>>(
        '/employees/field-permissions',
        { params: { module } }
      );
      return Object.values(res.data ?? {}).reduce<FieldPermMap>(
        (flat, formFields) => ({ ...flat, ...formFields }),
        {}
      );
    },
    enabled: !!module,
  });
}

// ─── 2. Resolve layer — completion-% + masking + bypass rules, module-agnostic ─

/** Resolve one field's effective permissions (completion-folded, bypass-aware). */
export function resolveFieldPerm(
  fp: FieldPermMap | undefined,
  name: string,
  opts: { completionPct?: number; bypass?: boolean } = {},
): FieldPermissionEntry {
  if (opts.bypass) return FULL_PERM;
  // No map at all (loading, or a module that was never field-configured) ⇒
  // don't lock anything — the backend applies the real gate on read/write.
  if (!fp || Object.keys(fp).length === 0) return FULL_PERM;

  const raw = fp[name];
  if (!raw) return { ...DEFAULT_PERM };

  const entry: FieldPermissionEntry = { ...DEFAULT_PERM, ...raw };
  const pct = opts.completionPct ?? 100;
  const is_partial_masked = entry.is_masked ? false : entry.is_partial_masked;
  if (entry.is_masked || is_partial_masked) {
    return { ...entry, is_partial_masked, can_add: false, can_edit: false, can_copy: false, can_download: false };
  }
  // Onboarding rule: "Add" grants temporary edit access while a record isn't
  // yet complete. Master-data callers should pass completionPct: 100, which
  // naturally disables this bonus.
  const can_edit = entry.can_edit || (entry.can_add && pct < 100);
  return { ...entry, can_edit, is_partial_masked };
}

// ─── 3. Context layer — lets deep children call useFieldPerm() without prop-drilling ─

interface FieldPermCtx {
  fp: FieldPermMap | undefined;
  completionPct: number;
  bypass: boolean;
}

const Ctx = createContext<FieldPermCtx>({ fp: {}, completionPct: 100, bypass: true });

export function FieldPermProvider({
  fp, completionPct, bypass, children,
}: FieldPermCtx & { children: ReactNode }) {
  return <Ctx.Provider value={{ fp, completionPct, bypass }}>{children}</Ctx.Provider>;
}

/** const f = useFieldPerm(); f('field_key') — works in any module wrapped by FieldPermProvider. */
export function useFieldPerm() {
  const { fp, completionPct, bypass } = useContext(Ctx);
  return useCallback(
    (name: string) => resolveFieldPerm(fp, name, { completionPct, bypass }),
    [fp, completionPct, bypass],
  );
}