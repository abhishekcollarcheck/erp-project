/**
 * employeeOverrides.service.ts
 *
 * Frontend API calls for employee-level permission overrides.
 * No user IDs anywhere — everything is employeeId.
 *
 * UI handlers → these functions:
 *   rpToggleMemberOverrides(groupId, memberId)        → loadOverridesForMember()
 *   rpOpenMemberOverrides(groupId, memberId)          → loadOverridesForMember()
 *   rpRemoveFieldOverride(gId, mId, module, field)    → deleteOverrideById()
 *   rpSaveEdit() in member-override editor mode       → setOverrides()
 */

import apiClient from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeOverride {
  id:          number;
  group_id:    number;
  employee_id: number;   // no user_id — employee IS the identity
  module:      string;
  field_name:  string | null;
  permission:  string;
  granted:     boolean;
}

// Valid module-level permissions — field-level (mask, copy, print) not in scope yet
export const MODULE_PERMISSIONS = ['view', 'create', 'edit', 'delete', 'download'] as const;
export type ModulePermission = typeof MODULE_PERMISSIONS[number];
const MODULE_PERMISSION_SET = new Set<string>(MODULE_PERMISSIONS);

export interface OverridePayload {
  module:     string;
  field_name: null;           // always null — module-level only for now
  permission: ModulePermission;
  granted:    boolean;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Called by rpToggleMemberOverrides / rpOpenMemberOverrides */
export async function loadOverridesForMember(
  groupId:    number,
  employeeId: number,   // memberId in the UI = employeeId
): Promise<EmployeeOverride[]> {
  const res = await apiClient.get<{ data: EmployeeOverride[] }>(
    `/permission-groups/${groupId}/members/${employeeId}/overrides`,
  );
  return res.data.data;
}

/** Called by rpSaveEdit() in member-override mode */
export async function setOverrides(
  groupId:    number,
  employeeId: number,
  overrides:  OverridePayload[],
): Promise<{ updated: number }> {
  const res = await apiClient.put<{ data: { updated: number } }>(
    `/permission-groups/${groupId}/members/${employeeId}/overrides`,
    { overrides },
  );
  return res.data.data;
}

/** Called by rpRemoveFieldOverride — needs overrideId from the loaded list */
export async function deleteOverrideById(
  groupId:    number,
  employeeId: number,
  overrideId: number,
): Promise<{ deleted: boolean }> {
  const res = await apiClient.delete<{ data: { deleted: boolean } }>(
    `/permission-groups/${groupId}/members/${employeeId}/overrides/${overrideId}`,
  );
  return res.data.data;
}

/**
 * Members list enriched with override_count for the amber badge.
 * Use instead of GET /:id/members when rendering the members panel.
 */
export async function getMembersWithOverrideCounts(
  groupId: number,
): Promise<any[]> {
  const res = await apiClient.get<{ data: any[] }>(
    `/permission-groups/${groupId}/members-with-overrides`,
  );
  return res.data.data;
}

/**
 * buildModuleOverrides
 *
 * Converts the UI permission-matrix toggles into OverridePayload[].
 * Only module-level overrides — field_name is always null.
 *
 * Call inside rpSaveEdit() when in member-override mode:
 *
 *   const payload = buildModuleOverrides({
 *     employees: { view: true, edit: false },
 *     payroll:   { view: false },
 *   });
 *   await setOverrides(groupId, memberId, payload);
 *
 * Invalid permissions are silently skipped (backend also validates).
 */

function isModulePermission(
  value: string,
): value is ModulePermission {
  return MODULE_PERMISSION_SET.has(value);
}
export function buildModuleOverrides(
  moduleMatrix: Record<string, Record<string, boolean>>,
): OverridePayload[] {
  const out: OverridePayload[] = [];

  for (const [module, perms] of Object.entries(moduleMatrix)) {
    for (const [permission, granted] of Object.entries(perms)) {
      // Skip unsupported permissions
      if (!isModulePermission(permission)) continue;

      out.push({
        module,
        field_name: null,
        permission,
        granted,
      });
    }
  }

  return out;
}