'use client';
import { Fragment, useEffect, useState, useMemo, useRef } from 'react';
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

  // Group fields by their dynamic_fields.section column, preserving the field
  // order (backend returns them by sort_order) and first-occurrence section
  // order — i.e. the exact section structure of the Employee form/wizard.
  const sectionGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const f of fields) {
      const s = (f.section && String(f.section).trim()) || 'Other';
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(f);
    }
    return [...map.entries()].map(([section, sectionFields]) => ({ section, fields: sectionFields }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.map((f: any) => `${f.id}:${f.section}`).join(',')]);

  const scrollToSection = (section: string) => {
    document.getElementById(`fp-sec-${section.replace(/[^a-z0-9]+/gi, '-')}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fieldSaveCompanyIds: number[] =
    moduleCompanies.length ? moduleCompanies : (matrixCompanyId ? [matrixCompanyId] : []);

  const { data: groupPermsData, refetch: refetchGroupPerms } = useGroupFieldPermissions(
    selectedFormId || 0, groupId, matrixCompanyId || 0
  );

  const [localPerms, setLocalPerms] = useState<Record<number, any>>({});
  const [dirty, setDirty] = useState(false);
  const [touchedFieldIds, setTouchedFieldIds] = useState<Set<number>>(new Set());

  // Tracks the module View/Edit/Download state as of the last merge run, so
  // the effect below can tell "this is the first time we're populating this
  // field-set" (respect whatever was saved, as-is) apart from "the admin
  // just toggled the module checkbox in THIS session" (cascade that change
  // onto every untouched field, even ones with an existing saved row).
  // null means "not established yet" — reset on every company/form switch
  // so a fresh context never gets misread as an in-session toggle.
  const prevModuleViewRef = useRef<boolean | null>(null);
  const prevModuleEditRef = useRef<boolean | null>(null);
  const prevModuleDownloadRef = useRef<boolean | null>(null);

  useEffect(() => {
    prevModuleViewRef.current = null;
    prevModuleEditRef.current = null;
    prevModuleDownloadRef.current = null;
  }, [groupId, selectedFormId, matrixCompanyId]);

  const displayCompanyId = isOverrideMode ? selectedOverrideCompanyIds?.[0] : undefined;
  const { data: overrideData, refetch: refetchOverrides } = useEmployeeFieldOverrides(
    groupId, overrideMemberId, displayCompanyId, selectedModuleKey || ''
  );

  useEffect(() => {
    if (isOverrideMode) return; // override mode has its own merge below; don't fight it
    if (!fields.length) return;

    const moduleView     = !!(selectedModuleKey && modPerms[selectedModuleKey]?.view);
    const moduleEdit     = !!(selectedModuleKey && modPerms[selectedModuleKey]?.edit);
    const moduleDownload = !!(selectedModuleKey && modPerms[selectedModuleKey]?.download);

    const viewChanged     = prevModuleViewRef.current !== null && prevModuleViewRef.current !== moduleView;
    const editChanged     = prevModuleEditRef.current !== null && prevModuleEditRef.current !== moduleEdit;
    const downloadChanged = prevModuleDownloadRef.current !== null && prevModuleDownloadRef.current !== moduleDownload;

    setLocalPerms(prev => {
      const merged: Record<number, any> = { ...prev };
      for (const f of fields) {
        if (touchedFieldIds.has(f.id)) continue; // admin already set this one manually — leave it alone
        const saved = groupPermsData?.perms?.[f.id] || matrixData?.matrix?.[groupId]?.[f.id];

        if (!saved) {
          // Never configured at all — always follows the live module state.
          merged[f.id] = moduleView
            ? { can_view: true, can_add: false, can_edit: moduleEdit, can_copy: false, can_download: moduleDownload, is_masked: !!f.is_hidden, is_partial_masked: false }
            : { can_view: false, can_add: false, can_edit: false, can_copy: false, can_download: false, is_masked: false, is_partial_masked: false };
        } else if (viewChanged || editChanged || downloadChanged) {
          // A saved row exists, but the admin just changed the module grant
          // THIS session — apply that change on top of the saved baseline,
          // consistent in both directions (checking OR unchecking).
          merged[f.id] = {
            ...saved,
            can_view: viewChanged ? moduleView : saved.can_view,
            can_edit: editChanged ? moduleEdit : saved.can_edit,
            can_download: downloadChanged ? moduleDownload : saved.can_download,
          };
        } else {
          // First population of this field-set — show the saved baseline
          // exactly as persisted, untouched by the current module state.
          merged[f.id] = saved;
        }
      }
      return merged;
    });

    prevModuleViewRef.current = moduleView;
    prevModuleEditRef.current = moduleEdit;
    prevModuleDownloadRef.current = moduleDownload;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    groupId, selectedFormId, matrixCompanyId, groupPermsData, matrixData,
    isOverrideMode, selectedModuleKey, modPerms, fields.map((f: any) => f.id).join(','),
  ]);

  useEffect(() => {
    if (!isOverrideMode) return;
    if (dirty) return;
    if (!fields.length) return;

    const merged: Record<number, any> = {};
    for (const f of fields) {
      const groupBase =
        groupPermsData?.perms?.[f.id] ||
        matrixData?.matrix?.[groupId]?.[f.id] ||
        { can_view: false, can_add: false, can_edit: false, can_copy: false, can_download: false, is_masked: false, is_partial_masked: false };
      const ov = overrideData?.[f.field_key] || {};
      merged[f.id] = {
        can_view: ov.view !== undefined ? ov.view : groupBase.can_view,
        can_add: ov.add !== undefined ? ov.add : groupBase.can_add,
        can_edit: ov.edit !== undefined ? ov.edit : groupBase.can_edit,
        can_copy: ov.copy !== undefined ? ov.copy : groupBase.can_copy,
        can_download: ov.download !== undefined ? ov.download : groupBase.can_download,
        is_masked: ov.mask !== undefined ? ov.mask : groupBase.is_masked,
        is_partial_masked: ov.partial_mask !== undefined ? ov.partial_mask : groupBase.is_partial_masked,
      };
    }
    setLocalPerms(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, selectedFormId, matrixCompanyId, groupPermsData, matrixData, isOverrideMode, overrideData]);

  // Mirrors the backend's module-edit ceiling so the admin UI never shows or
  // saves a field-level Edit grant the runtime would ignore anyway.
  const effectiveCanEdit = (fp: any) => moduleEditGranted && !!fp?.can_edit;

  // Boolean toggle columns (masking is a separate 3-way dropdown).
  const TOGGLE_COLS = ['can_view', 'can_add', 'can_edit', 'can_copy', 'can_download'] as const;
  const colLabel = (p: string) => p.replace('can_', '');
  const maskModeOf = (fp: any): 'none' | 'partial' | 'full' =>
    fp?.is_masked ? 'full' : fp?.is_partial_masked ? 'partial' : 'none';
  const isMaskLocked = (fp: any) => !!fp?.is_masked || !!fp?.is_partial_masked;

  const EMPTY_FP = { can_view: false, can_add: false, can_edit: false, can_copy: false, can_download: false, is_masked: false, is_partial_masked: false };
  const grantedFP = () => ({ can_view: true, can_add: true, can_edit: moduleEditGranted, can_copy: true, can_download: true, is_masked: false, is_partial_masked: false });

  // Masking takes precedence over every other field permission: a masked field
  // can't be added / edited / copied / downloaded. View stays on so the mask
  // (•••• or first-2/last-2) can actually render. Setting mode 'none' only
  // clears the mask flags and leaves the rest untouched.
  const applyMask = (cur: any, mode: 'none' | 'partial' | 'full') => {
    const base = cur || EMPTY_FP;
    if (mode === 'none') return { ...base, is_masked: false, is_partial_masked: false };
    return {
      ...base,
      can_view: true,
      can_add: false, can_edit: false, can_copy: false, can_download: false,
      is_masked: mode === 'full',
      is_partial_masked: mode === 'partial',
    };
  };

  const markTouched = (ids: number[]) =>
    setTouchedFieldIds(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n; });

  const toggleFP = (
    fieldId: number,
    perm: 'can_view' | 'can_add' | 'can_edit' | 'can_copy' | 'can_download'
  ) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};
      if (perm !== 'can_view' && isMaskLocked(current)) return prev; // masking wins — toggle is inert
      const next: Record<string, boolean> = { ...current, [perm]: !current[perm] };

      // Any permission except View requires View
      if (perm !== 'can_view' && next[perm]) {
        next.can_view = true;
      }

      // Turning View OFF clears all dependent permissions (and any mask)
      if (perm === 'can_view' && !next.can_view) {
        next.can_add = false;
        next.can_edit = false;
        next.can_copy = false;
        next.can_download = false;
        next.is_masked = false;
        next.is_partial_masked = false;
      }

      return { ...prev, [fieldId]: next };
    });
    markTouched([fieldId]);
    setDirty(true);
  };

  // Mask is a 3-way choice (none / partial / full) — mutually exclusive flags.
  const setMaskMode = (fieldId: number, mode: 'none' | 'partial' | 'full') => {
    setLocalPerms(prev => ({ ...prev, [fieldId]: applyMask(prev[fieldId], mode) }));
    markTouched([fieldId]);
    setDirty(true);
  };

  // Per-field "All" — grants the full set INCLUDING Add. Masking is left out
  // (granting everything shouldn't also hide the value); a masked field's All
  // toggle is inert.
  const toggleFieldRow = (fieldId: number) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};
      if (isMaskLocked(current)) return prev;
      const allEnabled = current.can_view && current.can_add && effectiveCanEdit(current) && current.can_copy && current.can_download;
      return { ...prev, [fieldId]: allEnabled ? { ...EMPTY_FP } : grantedFP() };
    });
    markTouched([fieldId]);
    setDirty(true);
  };

  const applyToFields = (fieldList: any[], fn: (cur: any) => any) => {
    const ids = fieldList.map(f => f.id);
    setLocalPerms(prev => {
      const n = { ...prev };
      for (const id of ids) n[id] = fn(n[id]);
      return n;
    });
    markTouched(ids);
    setDirty(true);
  };

  // Header + per-section bulk actions.
  const grantAll   = (list = fields) => applyToFields(list, () => grantedFP());
  const revokeAll  = (list = fields) => applyToFields(list, () => ({ ...EMPTY_FP }));
  const maskAll    = (mode: 'none' | 'partial' | 'full', list = fields) => applyToFields(list, cur => applyMask(cur, mode));

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
          const locked = isMaskLocked(cur);
          (['view', 'add', 'edit', 'copy', 'download'] as const).forEach(p => {
            const key = `can_${p}` as const;
            // Masking wins — a masked field grants nothing but view.
            const curVal = p === 'view' ? !!cur.can_view : locked ? false : (p === 'edit' ? effectiveCanEdit(cur) : !!cur[key]);
            if (curVal !== !!groupBase[key]) overrides.push({ field_name: f.field_key, permission: p, granted: curVal });
          });
          if (!!cur.is_masked !== !!groupBase.is_masked) overrides.push({ field_name: f.field_key, permission: 'mask', granted: !!cur.is_masked });
          if (!!cur.is_partial_masked !== !!groupBase.is_partial_masked) overrides.push({ field_name: f.field_key, permission: 'partial_mask', granted: !!cur.is_partial_masked });
        }

        await pgApi.setFieldOverrides(targetGroupId, overrideMemberId, selectedOverrideCompanyIds, selectedModuleKey, overrides);
      } else {
        if (companyFilterMismatch) throw new Error('Selected company does not have this module enabled — pick a different company or "All companies"');
        if (!fieldSaveCompanyIds.length) throw new Error('No company in scope for this group');
        const permissions = fields.map((f: any) => {
          const fp = localPerms[f.id] || {};
          const is_masked = !!fp.is_masked;
          const is_partial_masked = !is_masked && !!fp.is_partial_masked;
          const locked = is_masked || is_partial_masked;
          return {
            field_id: f.id,
            // Masking takes precedence — a masked field keeps only View.
            can_view: !!fp.can_view || locked,
            can_add: locked ? false : !!fp.can_add,
            can_edit: locked ? false : effectiveCanEdit(fp),
            can_copy: locked ? false : !!fp.can_copy,
            can_download: locked ? false : !!fp.can_download,
            is_masked,
            is_partial_masked,
          };
        });
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
      setTouchedFieldIds(new Set());
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

            <div className="card" style={{ overflow: 'hidden', maxHeight: '66vh', overflowY: 'auto' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)' }}>Forms &amp; Sections</div>
              <div style={{ padding: '6px 0' }}>
                {visibleForms.map((f: any) => (
                  <div key={`${f.moduleId}-${f.id}`}>
                    <div onClick={() => switchForm(f.id)}
                      style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedFormId === f.id ? 600 : 400, color: selectedFormId === f.id ? 'var(--blue)' : 'var(--ink3)', background: selectedFormId === f.id ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${selectedFormId === f.id ? 'var(--blue)' : 'transparent'}` }}>
                      {f.name}
                      <div style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 400 }}>
                        {f.moduleName} • {f.fields?.length || 0} fields
                      </div>
                    </div>
                    {selectedFormId === f.id && sectionGroups.length > 0 && (
                      <div style={{ padding: '2px 0 6px' }}>
                        {sectionGroups.map(({ section, fields: sf }) => (
                          <div key={section} onClick={() => scrollToSection(section)}
                            style={{ padding: '5px 14px 5px 22px', cursor: 'pointer', fontSize: 11, color: 'var(--ink4)', display: 'flex', justifyContent: 'space-between', gap: 6 }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink4)')}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{section}</span>
                            <span style={{ fontFamily: 'var(--mono)', flexShrink: 0 }}>{sf.length}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink3)' }}>{selectedForm?.name || '...'}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={() => grantAll()}>Grant all</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={() => revokeAll()}>Revoke all</button>
                  <span style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, color: 'var(--amber)' }} onClick={() => maskAll('partial')} title="Partial-mask every field (first 2 + last 2 chars visible)">Partial mask all</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, color: 'var(--amber)' }} onClick={() => maskAll('full')} title="Full-mask every field (value hidden)">Full mask all</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={() => maskAll('none')} title="Clear masking on every field">Clear masks</button>
                </div>
              </div>
              <div style={{ maxHeight: '58vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '7px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 3 }}>
                    Field
                  </th>
                  <th style={{ padding: '7px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 3 }}>
                    All
                  </th>
                  {TOGGLE_COLS.map(p => {
                    const editGated = p === 'can_edit' && !moduleEditGranted;
                    return (
                      <th
                        key={p}
                        title={
                          editGated ? 'Module-level Edit is off — enable it above to allow field-level Edit'
                          : p === 'can_add' ? 'Add: can edit this field only while the employee profile is under 100% complete'
                          : undefined
                        }
                        style={{
                          padding: '7px 8px', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', color: editGated ? 'var(--ink5, var(--ink4))' : 'var(--ink4)',
                          borderBottom: '1px solid var(--border)', textAlign: 'center',
                          opacity: editGated ? 0.6 : 1,
                          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 3,
                        }}
                      >
                        {colLabel(p)}
                      </th>
                    );
                  })}
                  <th style={{ padding: '7px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)', textAlign: 'center', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 3 }}>
                    Mask
                  </th>
                </tr>
                </thead>
                <tbody>
                  {sectionGroups.map(({ section, fields: sFields }) => (
                    <Fragment key={section}>
                      <tr id={`fp-sec-${section.replace(/[^a-z0-9]+/gi, '-')}`}>
                        <td colSpan={8} style={{
                          padding: '6px 14px', background: 'var(--surface2)',
                          borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                          position: 'sticky', top: 28, zIndex: 2,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink3)' }}>{section}</span>
                            <span style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{sFields.length}</span>
                            <span style={{ flex: 1 }} />
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => grantAll(sFields)}>Grant</button>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => revokeAll(sFields)}>Revoke</button>
                            <select
                              value=""
                              onChange={e => { if (e.target.value) maskAll(e.target.value as 'none' | 'partial' | 'full', sFields); e.currentTarget.value = ''; }}
                              style={{ fontSize: 9, padding: '1px 3px', borderRadius: 3, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--amber)' }}
                              title="Set masking for every field in this section"
                            >
                              <option value="">Mask…</option>
                              <option value="partial">Partial</option>
                              <option value="full">Full</option>
                              <option value="none">Clear</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                      {sFields.map((f: any) => {
                        const fp = localPerms[f.id] || { can_view: false, can_add: false, can_edit: false, can_copy: false, can_download: false, is_masked: false, is_partial_masked: false };
                        const maskLocked = isMaskLocked(fp);
                        const allOn = fp.can_view && fp.can_add && effectiveCanEdit(fp) && fp.can_copy && fp.can_download;
                        return (
                          <tr key={f.id} style={{ borderBottom: '1px solid var(--border)', background: maskLocked ? 'var(--amber-lt)' : undefined }}>
                            <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                              {f.label}
                            </td>
                            <td style={{ padding: '7px 6px', textAlign: 'center', opacity: maskLocked ? 0.35 : 1 }}>
                              <PermToggle on={allOn} onClick={maskLocked ? undefined : () => toggleFieldRow(f.id)} />
                            </td>
                            {TOGGLE_COLS.map(p => {
                              const editGated = p === 'can_edit' && !moduleEditGranted;
                              const gated = editGated || (maskLocked && p !== 'can_view');
                              const on = p === 'can_edit' ? effectiveCanEdit(fp) : !!fp[p];
                              return (
                                <td key={p} style={{ padding: '7px 6px', textAlign: 'center', opacity: gated ? 0.35 : 1 }}
                                  title={
                                    maskLocked && p !== 'can_view' ? 'Masking takes precedence — clear the mask to grant this'
                                    : editGated ? 'Module-level Edit is off — enable it above to allow field-level Edit'
                                    : undefined
                                  }>
                                  <PermToggle on={on} onClick={gated ? undefined : () => toggleFP(f.id, p)} />
                                </td>
                              );
                            })}
                            <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                              <select
                                value={maskModeOf(fp)}
                                disabled={!fp.can_view && !maskLocked}
                                onChange={e => setMaskMode(f.id, e.target.value as 'none' | 'partial' | 'full')}
                                style={{
                                  fontSize: 11, padding: '3px 4px', borderRadius: 4,
                                  border: `1px solid ${maskLocked ? 'var(--amber)' : 'var(--border2)'}`, background: 'var(--surface)',
                                  color: maskModeOf(fp) === 'none' ? 'var(--ink4)' : 'var(--amber)',
                                  fontWeight: maskLocked ? 700 : 400,
                                }}
                              >
                                <option value="none">—</option>
                                <option value="partial">Partial</option>
                                <option value="full">Full</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                  {fields.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>No fields found for this form.</td></tr>}
                </tbody>
              </table>
              </div>
            </div>

            <div className="card cp">
              <div className="ct" style={{ marginBottom: 10 }}>Stats</div>
              {TOGGLE_COLS.map(p => {
                const on = fields.filter((f: any) => p === 'can_edit' ? effectiveCanEdit(localPerms[f.id]) : localPerms[f.id]?.[p]).length;
                return (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--ink3)' }}>{colLabel(p)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: on > 0 ? 'var(--blue)' : 'var(--ink4)' }}>{on}/{fields.length}</span>
                  </div>
                );
              })}
              {(() => {
                const masked = fields.filter((f: any) => localPerms[f.id]?.is_masked || localPerms[f.id]?.is_partial_masked).length;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--ink3)' }}>masked</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: masked > 0 ? 'var(--amber)' : 'var(--ink4)' }}>{masked}/{fields.length}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink4)', lineHeight: 1.6, marginTop: 14, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
            {isOverrideMode ? (
              <>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 5 }}>🔒 Member overrides</strong>
                Choose which companies this override applies to above. You can set different overrides per company or apply one rule to all assigned companies.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Partial</strong> shows first 2 + last 2 chars; <strong style={{ color: 'var(--amber)' }}>Full</strong> hides the value. Masking a field disables its other permissions.
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 5 }}>🔒 How it works</strong>
                Field rules sit under module rules. A field blocked here won&apos;t show even if the module is visible, and no field is visible without module view access. The <strong>Edit</strong> column follows the same rule — it&apos;s greyed out here whenever the module&apos;s own Edit permission is off.<br />
                <strong>Add</strong> lets the field be edited only while the employee profile is under 100% complete. <strong>Grant all</strong> turns on View · Add · Edit · Copy · Download.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Mask takes precedence.</strong> <strong>Partial</strong> shows the first 2 and last 2 characters (<code>AB••••••4F</code>); <strong>Full</strong> hides the value entirely (••••). Choosing either disables Add / Edit / Copy / Download for that field. Use <strong>Partial mask all</strong> / <strong>Full mask all</strong> in the header to apply it to every field.
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}