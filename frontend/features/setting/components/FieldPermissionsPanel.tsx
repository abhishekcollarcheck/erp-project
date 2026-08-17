'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAppSelector } from '../../../store';
import { selectActiveCompanyId } from '../../../store/slices/authSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../../utils/toast';
import { Download } from 'lucide-react';
import { pgApi } from '../../../features/setting/services/permissions.services';
import type { Form } from '../../../features/setting/types/permissions.types';
import {
  useHrModules, useAllModuleForms, useEmployeeFieldOverrides,
  useGroupFieldPermissionMatrix, useGroupFieldPermissions,
} from '../../../features/setting/hooks/useRolePermissions';
import type { ModulePerms } from '../constants/rolePermissionsConstants';
import { PermToggle } from './PermToggle';

export function FieldPermissionsPanel({
  groupId, assignedCompanies, isOverrideMode = false,
  overrideMemberId, selectedOverrideCompanyIds, modPerms, moduleCompanyMap, companyFilter, onRegisterSave,
}: {
  groupId: number;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  isOverrideMode?: boolean;
  overrideMemberId?: number;
  selectedOverrideCompanyIds?: number[];
  modPerms: ModulePerms;
  moduleCompanyMap: Record<string, { label: string; companies: { id: number; name: string; shortName: string }[] }>;
  companyFilter?: number | 'all';
  onRegisterSave?: (fn: (createdGroupId?: number) => Promise<any>) => void;
}) {

  const isDraft = !(groupId > 0);

  const qc = useQueryClient();

  const { data: modules = [] } = useHrModules();
  
  const allFormsQueries = useAllModuleForms(modules);
  const allForms = allFormsQueries.flatMap((query, moduleIndex) => {
    const mod = modules[moduleIndex];
    if (!mod) return [];
    return (query.data || []).map((form: Form) => ({
      ...form,
      moduleId: mod.id,
      moduleName: mod.name,
      moduleKey: mod.permission_key ?? mod.slug,
    }));
  });

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  const visibleForms = useMemo(
    () => allForms.filter((f: any) => {
      if (!f.moduleKey || !modPerms[f.moduleKey]?.view) return false;
      if (companyFilter != null && companyFilter !== 'all') {
        return (moduleCompanyMap[f.moduleKey]?.companies || []).some((co: any) => Number(co.id) === Number(companyFilter));
      }
      return true;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allForms.map((f: any) => f.id).join(','), modPerms, companyFilter, moduleCompanyMap],
  );

  useEffect(() => { setSelectedFormId(null); }, [groupId]);

  // Keep the selection inside the visible set — unchecking a module must not
  // leave a stale form selected and editable.
  useEffect(() => {
    if (!visibleForms.length) { if (selectedFormId !== null) setSelectedFormId(null); return; }
    if (!selectedFormId || !visibleForms.some((f: any) => f.id === selectedFormId)) {
      setSelectedFormId(visibleForms[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleForms.map((f: any) => f.id).join(','), selectedFormId]);

  const selectedForm = visibleForms.find((f: any) => f.id === selectedFormId);
  const selectedModuleKey: string | undefined = selectedForm?.moduleKey;
  const moduleAccessGranted = visibleForms.length > 0 && !!selectedModuleKey;

  const moduleEditGranted = !!selectedModuleKey && !!modPerms[selectedModuleKey]?.edit;

  const { data: scopeCompanyIds = [] } = useQuery({
    queryKey: ['group-company-scope', groupId],
    queryFn: () => pgApi.groupCompanyScope(groupId),
    enabled: !isDraft,
    select: (r: any): number[] => r.data ?? [],
  });

  const groupCompanyIds: number[] = isDraft ? assignedCompanies.map(c => c.id) : scopeCompanyIds;

  const moduleCompaniesAll: number[] =
    (selectedModuleKey && moduleCompanyMap[selectedModuleKey]?.companies?.map(c => Number(c.id))) || [];

  const filterCompanyId: number | null =
    companyFilter != null && companyFilter !== 'all' ? Number(companyFilter) : null;
  const companyFilterMismatch: boolean =
    filterCompanyId != null && !moduleCompaniesAll.includes(filterCompanyId);

  const moduleCompanies: number[] =
    filterCompanyId != null
      ? (companyFilterMismatch ? [] : [filterCompanyId])
      : (moduleCompaniesAll.length ? moduleCompaniesAll : groupCompanyIds);

  const activeCompanyId = useAppSelector(selectActiveCompanyId);
  const matrixCompanyId = isOverrideMode
    ? selectedOverrideCompanyIds?.[0]
    : (activeCompanyId != null && moduleCompanies.includes(activeCompanyId) ? activeCompanyId : moduleCompanies[0]);
  const { data: matrixData, refetch } = useGroupFieldPermissionMatrix(selectedFormId || 0, matrixCompanyId || 0);
  const fields = matrixData?.fields || [];

  const fieldSaveCompanyIds: number[] =
    moduleCompanies.length ? moduleCompanies : (matrixCompanyId ? [matrixCompanyId] : []);

  const { data: groupPermsData, refetch: refetchGroupPerms } = useGroupFieldPermissions(
    selectedFormId || 0, groupId, matrixCompanyId || 0
  );
  console.log("FieldPermissionsPanel RENDER", { groupPermsData});

  const [localPerms, setLocalPerms] = useState<Record<number, any>>({});
  const [dirty, setDirty] = useState(false);

  const displayCompanyId = isOverrideMode ? selectedOverrideCompanyIds?.[0] : undefined;
  const { data: overrideData, refetch: refetchOverrides } = useEmployeeFieldOverrides(
    groupId, overrideMemberId, displayCompanyId, selectedModuleKey || ''
  );

  console.log("FieldPermissionsPanel RENDER 2", { overrideData });

  useEffect(() => {
    if (isOverrideMode) return; // override mode has its own merge below; don't fight it
    if (dirty) return;
    if (!fields.length) return;

    const moduleView     = !!(selectedModuleKey && modPerms[selectedModuleKey]?.view);
    const moduleEdit     = !!(selectedModuleKey && modPerms[selectedModuleKey]?.edit);
    const moduleDownload = !!(selectedModuleKey && modPerms[selectedModuleKey]?.download);

    const merged: Record<number, any> = {};
    for (const f of fields) {
      const saved = groupPermsData?.perms?.[f.id] || matrixData?.matrix?.[groupId]?.[f.id];
      merged[f.id] = saved
        ? saved
        : (moduleView
            ? { can_view: true, can_edit: moduleEdit, can_copy: false, can_download: moduleDownload, is_masked: !!f.is_hidden }
            : { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false });
    }
    setLocalPerms(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    groupId, selectedFormId, matrixCompanyId, groupPermsData, matrixData,
    isOverrideMode, selectedModuleKey, modPerms, fields.map((f: any) => f.id).join(','),
  ]);

  // Employee-override mode has its own merge, kept separate since it layers
  // per-employee overrides on top of the group baseline rather than falling
  // back to module defaults for an unsaved field.
  useEffect(() => {
    if (!isOverrideMode) return;
    if (dirty) return;
    if (!fields.length) return;

    const merged: Record<number, any> = {};
    for (const f of fields) {
      const groupBase =
        groupPermsData?.perms?.[f.id] ||
        matrixData?.matrix?.[groupId]?.[f.id] ||
        { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
      const ov = overrideData?.[f.field_key] || {};
      merged[f.id] = {
        can_view: ov.view !== undefined ? ov.view : groupBase.can_view,
        can_edit: ov.edit !== undefined ? ov.edit : groupBase.can_edit,
        can_copy: ov.copy !== undefined ? ov.copy : groupBase.can_copy,
        can_download: ov.download !== undefined ? ov.download : groupBase.can_download,
        is_masked: ov.mask !== undefined ? ov.mask : groupBase.is_masked,
      };
    }
    setLocalPerms(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, selectedFormId, matrixCompanyId, groupPermsData, matrixData, isOverrideMode, overrideData]);

  // Mirrors the backend's module-edit ceiling so the admin UI never shows or
  // saves a field-level Edit grant the runtime would ignore anyway.
  const effectiveCanEdit = (fp: any) => moduleEditGranted && !!fp?.can_edit;

  const toggleFP = (
    fieldId: number,
    perm: 'can_view' | 'can_edit' | 'can_copy' | 'can_download' | 'is_masked'
  ) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};
      const next: Record<string, boolean> = { ...current, [perm]: !current[perm] };

      // Any permission except View requires View
      if (perm !== 'can_view' && next[perm]) {
        next.can_view = true;
      }

      // Turning View OFF clears all dependent permissions
      if (perm === 'can_view' && !next.can_view) {
        next.can_edit = false;
        next.can_copy = false;
        next.can_download = false;
        next.is_masked = false;
      }

      return { ...prev, [fieldId]: next };
    });
    setDirty(true);
  };

  // "All" covers the four grants — masking is an independent concern and is
  // deliberately left out, otherwise granting everything would also hide it.
  const toggleFieldRow = (fieldId: number) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};
      const allEnabled = current.can_view && effectiveCanEdit(current) && current.can_copy && current.can_download;
      const next = allEnabled
        ? { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false }
        : { can_view: true, can_edit: moduleEditGranted, can_copy: true, can_download: true, is_masked: !!current.is_masked };
      return { ...prev, [fieldId]: next };
    });
    setDirty(true);
  };

  const grantAll = () => {
    setLocalPerms(prev => {
      const n = { ...prev };
      for (const f of fields) {
        n[f.id] = { can_view: true, can_edit: moduleEditGranted, can_copy: true, can_download: true, is_masked: false };
      }
      return n;
    });
    setDirty(true);
  };

  const revokeAll = () => {
    setLocalPerms(prev => {
      const n = { ...prev };
      for (const f of fields) {
        n[f.id] = { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
      }
      return n;
    });
    setDirty(true);
  };

  // Switching sections used to just call setSelectedFormId directly — with
  // no save in between, any unsaved edits on the OUTGOING form were either
  // silently discarded (once the incoming form's baseline-merge effect ran)
  // or, worse, never sent at all: the panel's Save only ever submits
  // whichever form is selected at the moment the admin clicks the overall
  // Save button. If they'd already moved on to a different module's fields,
  // the previous module's customization was quietly lost. Auto-saving the
  // outgoing form here (when it has actual local edits) closes that gap.
  // Draft groups have no id yet to save against — same as before, their
  // field rules only get applied once, at group-creation time.
  const switchForm = async (newFormId: number) => {
    if (newFormId === selectedFormId) return;
    if (dirty && !isDraft) {
      try {
        await saveMutation.mutateAsync(undefined);
      } catch {
        return; // save failed (toast already shown) — stay put so nothing more is lost
      }
    }
    setSelectedFormId(newFormId);
  };

  const saveMutation = useMutation({
    mutationFn: async (createdGroupId?: number) => {
      if (!selectedModuleKey) throw new Error('No form selected');

      // For a new group the id only exists once the parent has created it.
      const targetGroupId = createdGroupId ?? groupId;
      if (!(targetGroupId > 0)) throw new Error('Group not saved yet');

      if (isOverrideMode) {
        if (!selectedOverrideCompanyIds?.length) throw new Error('Select at least one company to save overrides for');
        if (!overrideMemberId) throw new Error('No member selected');

        // Only send what differs from the group baseline — sending everything
        // would create override rows for untouched fields.
        const overrides: { field_name: string; permission: string; granted: boolean }[] = [];
        for (const f of fields) {
          const groupBase = groupPermsData?.perms?.[f.id] || {};
          const cur = localPerms[f.id] || {};
          (['view', 'edit', 'copy', 'download'] as const).forEach(p => {
            const key = `can_${p}` as const;
            const curVal = p === 'edit' ? effectiveCanEdit(cur) : !!cur[key];
            if (curVal !== !!groupBase[key]) overrides.push({ field_name: f.field_key, permission: p, granted: curVal });
          });
          if (!!cur.is_masked !== !!groupBase.is_masked) overrides.push({ field_name: f.field_key, permission: 'mask', granted: !!cur.is_masked });
        }

        await pgApi.setFieldOverrides(targetGroupId, overrideMemberId, selectedOverrideCompanyIds, selectedModuleKey, overrides);
      } else {
        if (companyFilterMismatch) throw new Error('Selected company does not have this module enabled — pick a different company or "All companies"');
        if (!fieldSaveCompanyIds.length) throw new Error('No company in scope for this group');
        const permissions = fields.map((f: any) => ({
          field_id: f.id,
          can_view: !!localPerms[f.id]?.can_view,
          can_edit: effectiveCanEdit(localPerms[f.id]),
          can_copy: !!localPerms[f.id]?.can_copy,
          can_download: !!localPerms[f.id]?.can_download,
          is_masked: !!localPerms[f.id]?.is_masked,
        }));
        // Writes to every company that has this module enabled for the
        // group — matches what the Module Permissions matrix shows for
        // this module's company badges, so field rules stay consistent
        // with which companies actually have the module in the first place.
        await pgApi.bulkSetFieldPermissions(targetGroupId, fieldSaveCompanyIds, permissions);
      }
    },
    onSuccess: () => {
      showToast(isOverrideMode ? '✓ Field overrides saved' : '✓ Field permissions saved');
      setDirty(false);
      refetch();
      refetchGroupPerms();
      if (isOverrideMode) refetchOverrides();
      // The group list reads the same rows under a different key — invalidate
      // both, or the inline override panel stays stale until a page reload.
      qc.invalidateQueries({ queryKey: ['field-overrides'] });
      qc.invalidateQueries({ queryKey: ['group-field-overrides'] });
      qc.invalidateQueries({ queryKey: ['group-field-perms'] });
      qc.invalidateQueries({ queryKey: ['field-perm-matrix'] });
    },
    onError: (e: any) => showToast(e?.message || 'Failed to save'),
  });

  // The parent's Save flushes this — one save button for the whole screen.
  useEffect(() => {
    onRegisterSave?.((createdGroupId?: number) =>
      (dirty ? saveMutation.mutateAsync(createdGroupId) : Promise.resolve()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saveMutation, onRegisterSave]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="ct" style={{ flex: 1 }}>{isOverrideMode ? 'Field-Level Overrides' : 'Field-Level Permissions'}</div>
        {moduleAccessGranted && (
          isOverrideMode
            ? selectedOverrideCompanyIds && selectedOverrideCompanyIds.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Applies to: {selectedOverrideCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              </div>
            )
            : !!matrixCompanyId && (
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Editing: {assignedCompanies.find(c => c.id === matrixCompanyId)?.name || `Company ${matrixCompanyId}`}
              </div>
            )
        )}
        {moduleAccessGranted && !isOverrideMode && companyFilterMismatch && (
          <div style={{ fontSize: 11, color: 'var(--red, #dc2626)', fontWeight: 600 }}>
            ⚠ Selected company doesn't have this module enabled
          </div>
        )}
        {moduleAccessGranted && dirty && (
          <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>
            Unsaved — use Save above
          </span>
        )}
      </div>

      {!moduleAccessGranted ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
          {!allForms.length
            ? 'No forms configured yet — nothing to set field rules on.'
            : isOverrideMode
              ? 'This group has no modules with field-level forms — there are no fields to override for this person.'
              : (companyFilter != null && companyFilter !== 'all' && allForms.some((f: any) => f.moduleKey && modPerms[f.moduleKey]?.view))
                ? <>None of this group's modules have <strong>{assignedCompanies.find(c => c.id === companyFilter)?.name || 'the selected company'}</strong> enabled.<br /><span style={{ fontSize: 11 }}>Pick a different company, or switch the filter above to "All companies".</span></>
                : <>No modules with field-level forms selected.<br /><span style={{ fontSize: 11 }}>Tick <strong>View</strong> on a module above to configure its fields.</span></>}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 14 }}>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)' }}>Sections</div>
              <div style={{ padding: '6px 0' }}>
                {visibleForms.map((f: any) => (
                  <div key={`${f.moduleId}-${f.id}`} onClick={() => switchForm(f.id)}
                    style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedFormId === f.id ? 600 : 400, color: selectedFormId === f.id ? 'var(--blue)' : 'var(--ink3)', background: selectedFormId === f.id ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${selectedFormId === f.id ? 'var(--blue)' : 'transparent'}` }}>
                    {f.name}
                    <div style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 400 }}>
                      {f.moduleName} • {f.fields?.length || 0} fields
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink3)' }}>{selectedForm?.name || '...'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={grantAll}>Grant all</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={revokeAll}>Revoke all</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ textAlign: 'left', padding: '7px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)' }}>
                    Field
                  </th>
                  <th style={{ padding: '7px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)' }}>
                    All
                  </th>
                  {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => {
                    const editGated = p === 'can_edit' && !moduleEditGranted;
                    return (
                      <th
                        key={p}
                        title={editGated ? 'Module-level Edit is off — enable it above to allow field-level Edit' : undefined}
                        style={{
                          padding: '7px 8px', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', color: editGated ? 'var(--ink5, var(--ink4))' : 'var(--ink4)',
                          borderBottom: '1px solid var(--border)', textAlign: 'center',
                          opacity: editGated ? 0.6 : 1,
                        }}
                      >
                        {p.replace('can_', '').replace('is_', '')}
                      </th>
                    );
                  })}
                </tr></thead>
                <tbody>
                  {fields.map((f: any) => {
                    const fp = localPerms[f.id] || { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
                    const allOn = fp.can_view && effectiveCanEdit(fp) && fp.can_copy && fp.can_download;
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                          {f.label}
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                          <PermToggle on={allOn} onClick={() => toggleFieldRow(f.id)} />
                        </td>
                        {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => {
                          const editGated = p === 'can_edit' && !moduleEditGranted;
                          const on = p === 'can_edit' ? effectiveCanEdit(fp) : !!fp[p];
                          return (
                            <td key={p} style={{ padding: '7px 6px', textAlign: 'center', opacity: editGated ? 0.45 : 1 }}
                              title={editGated ? 'Module-level Edit is off — enable it above to allow field-level Edit' : undefined}>
                              <PermToggle on={on} onClick={editGated ? undefined : () => toggleFP(f.id, p)} />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {fields.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>No fields found for this form.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="card cp">
              <div className="ct" style={{ marginBottom: 10 }}>Stats</div>
              {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => {
                const on = fields.filter((f: any) => p === 'can_edit' ? effectiveCanEdit(localPerms[f.id]) : localPerms[f.id]?.[p]).length;
                return (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--ink3)' }}>{p.replace('can_', '').replace('is_', '')}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: on > 0 ? 'var(--blue)' : 'var(--ink4)' }}>{on}/{fields.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink4)', lineHeight: 1.6, marginTop: 14, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
            {isOverrideMode ? (
              <>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 5 }}>🔒 Member overrides</strong>
                Choose which companies this override applies to above. You can set different overrides per company or apply one rule to all assigned companies.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Mask</strong> shows the value as •••• — useful for salary &amp; ID numbers.
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 5 }}>🔒 How it works</strong>
                Field rules sit under module rules. A field blocked here won&apos;t show even if the module is visible, and no field is visible without module view access. The <strong>Edit</strong> column follows the same rule — it&apos;s greyed out here whenever the module&apos;s own Edit permission is off.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Mask</strong> shows the value as •••• — useful for salary &amp; ID numbers.
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}