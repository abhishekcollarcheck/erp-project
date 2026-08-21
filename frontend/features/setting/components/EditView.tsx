'use client';
import { useEffect, useState, useRef } from 'react';
import { useAppDispatch } from '../../../store';
import { updateToken, setPermissions } from '../../../store/slices/authSlice';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../../utils/toast';
import { pgApi } from '../../../features/setting/services/permissions.services';
import type { PermGroup, ModuleDef } from '../../../features/setting/types/permissions.types';
import { useGroupPerms, useEmployeeOverrides } from '../../../features/setting/hooks/useRolePermissions';
import { PERMS, COLOR_OPTS } from '../constants/rolePermissionsConstants';
import type { ModulePerms } from '../constants/rolePermissionsConstants';
import { slugsToModulePerms, modulePermsToSlugs } from '../utils/rolePermissionsUtils';
import { Avatar } from '../components/Avatar';
import { ModuleMatrix } from '../components/ModuleMatrix';
import { PermSummary } from '../components/PermSummary';
import { FieldPermissionsPanel } from '../components/FieldPermissionsPanel';

export function EditView({
  group, onBack,
  overrideMemberId, overrideMemberName, overrideMemberCompanyId, overrideMemberCompanyIds,
  groupName, moduleCompanyMap, assignedCompanies, modules,
}: {
  group: PermGroup | null;
  onBack: () => void;
  overrideMemberId?: number;
  overrideMemberName?: string;
  overrideMemberCompanyId?: number;
  overrideMemberCompanyIds?: number[];
  groupName?: string;
  moduleCompanyMap: Record<string, { label: string; companies: { id: number; name: string; shortName: string }[] }>;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  modules: ModuleDef[];
}) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const isNew = !group;
  const isOverrideMode = !!overrideMemberId;

  const [name, setName] = useState(group?.name || '');
  const [desc, setDesc] = useState(group?.description || '');
  const [colorKey, setColorKey] = useState(group?.color || 'blue');
  const [modPerms, setModPerms] = useState<ModulePerms>({});
  const [baseModPerms, setBaseModPerms] = useState<ModulePerms>({});
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<number | 'all'>('all');
  const { data: scopeCompanyIds = [] } = useQuery({
    queryKey: ['group-company-scope', group?.id],
    queryFn: () => pgApi.groupCompanyScope(group!.id),
    enabled: !!group?.id,
    select: (r: any): number[] => r.data ?? [],
  });
  const baseModPermsCompanyId = isOverrideMode
    ? overrideMemberCompanyId
    : (companyFilter !== 'all' ? Number(companyFilter) : (scopeCompanyIds[0] ?? assignedCompanies[0]?.id));
  const { data: existingSlugs = [] } = useGroupPerms(group?.id || 0, baseModPermsCompanyId);
  const { data: savedOverrides = [] } = useEmployeeOverrides(group?.id || 0, overrideMemberId, overrideMemberCompanyId);

  // Companies to show in the Permission Summary breakdown — the group's own
  // scope once it has one, or every company this admin manages while it's
  // still a draft with no scope yet.
  const companiesForSummary = scopeCompanyIds.length ? scopeCompanyIds : assignedCompanies.map(c => c.id);
  const perCompanySlugQueries = useQueries({
    queries: companiesForSummary.map(cid => ({
      // Same key shape useGroupPerms uses internally — shares its cache, so
      // the currently-filtered company doesn't get fetched twice.
      queryKey: ['rp', 'group-perms', group?.id, cid],
      queryFn: () => pgApi.getPerms(group!.id, cid),
      enabled: !!group?.id && !isOverrideMode,
      select: (r: any): string[] => r.data ?? [],
    })),
  });
  const perCompanyModPerms = isOverrideMode ? [] : companiesForSummary.map((cid, i) => {
    const co = assignedCompanies.find(c => c.id === cid);
    const mp = cid === baseModPermsCompanyId ? modPerms : slugsToModulePerms(perCompanySlugQueries[i]?.data || [], modules);
    return {
      companyId: cid,
      companyName: co?.name || `Company ${cid}`,
      shortName: co?.shortName || String(cid),
      modPerms: mp,
    };
  });

  const [selectedOverrideCompanyIds, setSelectedOverrideCompanyIds] = useState<number[]>(
    overrideMemberCompanyId ? [overrideMemberCompanyId] : []
  );

  // Field-permission save is registered by the panel and flushed by this view's save.
  const fieldSaveRef = useRef<null | ((createdGroupId?: number) => Promise<any>)>(null);

  useEffect(() => {
    if (overrideMemberCompanyId) {
      setSelectedOverrideCompanyIds([overrideMemberCompanyId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideMemberId]);

  useEffect(() => {
    if (!modules.length) return;
    if (!group) { setBaseModPerms({}); setModPerms({}); setBaseLoaded(true); return; }
    const mp = slugsToModulePerms(existingSlugs || [], modules);
    setBaseModPerms(mp);
    setModPerms(mp);
    setBaseLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, existingSlugs.join(','), modules, baseModPermsCompanyId]);

  useEffect(() => {
    if (!baseLoaded || !isOverrideMode) return;
    const viewingSingleLoadedCompany =
      selectedOverrideCompanyIds.length === 1 &&
      selectedOverrideCompanyIds[0] === overrideMemberCompanyId;

    setModPerms(() => {
      const mp: ModulePerms = {};
      for (const k of Object.keys(baseModPerms)) mp[k] = { ...baseModPerms[k] };
      if (viewingSingleLoadedCompany) {
        for (const o of savedOverrides) {
          if (mp[o.module]) {
            mp[o.module] = { ...mp[o.module], [o.permission]: o.granted };
          }
        }
      }
      return mp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedOverrides.map((o: any) => `${o.module}:${o.permission}:${o.granted}`).join(','), baseLoaded, isOverrideMode, selectedOverrideCompanyIds.join(','), baseModPerms]);

  const targetCompanyIds =
  companyFilter === "all"
    ? assignedCompanies.map(c => c.id)
    : [Number(companyFilter)];


  const saveMutation = useMutation({
    mutationFn: async () => {

      // ── OVERRIDE MODE: update only THIS employee's overrides, never the group ──
      if (isOverrideMode) {
        const overrides: { module: string; field_name: null; permission: string; granted: boolean }[] = [];
        for (const mod of modules) {
          const currentModule = modPerms[mod.key] || {};
          const baseModule = baseModPerms[mod.key] || {};

          for (const perm of PERMS) {
            const currentValue = !!currentModule[perm];
            const baseValue = !!baseModule[perm];
            if (currentValue !== baseValue) {
              overrides.push({ module: mod.key, field_name: null, permission: perm, granted: currentValue });
            }
          }
        }

        const targetCompanyIds = selectedOverrideCompanyIds.length > 0
          ? selectedOverrideCompanyIds
          : (overrideMemberCompanyId ? [overrideMemberCompanyId] : []);

        if (targetCompanyIds.length === 0) {
          throw new Error('Select at least one company to save overrides for');
        }
        await pgApi.setOverrides(group!.id, overrideMemberId!, targetCompanyIds, overrides);
        await fieldSaveRef.current?.();
        return;
      }

      // ── NORMAL GROUP EDIT ──
      // existingSlugs passthrough keeps permissions for modules not in the UI list.
      const slugs = modulePermsToSlugs(modPerms, modules, existingSlugs);
      if (isNew) {
        const r = await pgApi.create({ name, description: desc, color: colorKey });
        const newId = r.data.id;
        await pgApi.setPerms(newId, slugs, targetCompanyIds);
        // Field rules were staged before the group existed — apply them now.
        await fieldSaveRef.current?.(newId);
        return r;
      }
      await pgApi.update(group!.id, { name, description: desc, color: colorKey });
      await pgApi.setPerms(group!.id, slugs, targetCompanyIds);
      await fieldSaveRef.current?.();
    },
    onSuccess: (data: any) => {
      if (isOverrideMode && group?.id && overrideMemberId) {
        if (data?.accessToken) dispatch(updateToken(data.accessToken));
        if (data?.permissions) dispatch(setPermissions(data.permissions));

        const targetCompanyIds = selectedOverrideCompanyIds.length > 0
          ? selectedOverrideCompanyIds
          : (overrideMemberCompanyId ? [overrideMemberCompanyId] : []);

        for (const cid of targetCompanyIds) {
          qc.refetchQueries({ queryKey: ['rp', 'employee-overrides', group.id, overrideMemberId, cid] });
          qc.invalidateQueries({ queryKey: ['group-overrides', group.id, overrideMemberId, cid] });
        }
        // Field overrides are saved by the panel, which unmounts on onBack() —
        // invalidate here so the group list reflects them straight away.
        qc.invalidateQueries({ queryKey: ['field-overrides'] });
        qc.invalidateQueries({ queryKey: ['group-field-overrides'] });

        showToast('✓ Employee override saved');
        onBack();
        return;
      }

      qc.refetchQueries({ queryKey: ['rp', 'groups'] });
      qc.refetchQueries({ queryKey: ['rp', 'group-perms', group?.id] });
      qc.invalidateQueries({ queryKey: ['group-field-perms'] });
      qc.invalidateQueries({ queryKey: ['field-perm-matrix'] });

      showToast(isNew ? '✓ Group created' : '✓ Group updated');
      onBack();
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });


  const effectiveModPerms = modPerms;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', flex: 1 }} id="rp-edit-title">
          {isOverrideMode
            ? `Overrides for ${overrideMemberName}`
            : isNew ? 'New Permission Group' : `Editing: ${group!.name}`}
        </div>
        <button className="btn btn-sec btn-sm" onClick={onBack}>Cancel</button>
        <button
          className="btn btn-pri btn-sm"
          onClick={() => saveMutation.mutate()}
          disabled={
            (isOverrideMode ? selectedOverrideCompanyIds.length === 0 : !name.trim())
            || !baseLoaded
            || saveMutation.isPending
          }
        >
          {saveMutation.isPending ? '…' : isOverrideMode ? '✓ Save Overrides' : '✓ Save Group'}
        </button>
      </div>

      {/* 3-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 264px', gap: 14, alignItems: 'flex-start' }}>

        {/* Col 1 */}
        {isOverrideMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card cp">
              <div className="ct" style={{ marginBottom: 12 }}>Member Override</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <Avatar name={overrideMemberName || ''} size={32} fontSize={12} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{overrideMemberName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Individual override</div>
                </div>
              </div>
              {overrideMemberCompanyIds && overrideMemberCompanyIds.length > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 8 }}>
                    Override applies to
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span
                      onClick={() => {
                        const allSelected = selectedOverrideCompanyIds.length === overrideMemberCompanyIds.length;
                        setSelectedOverrideCompanyIds(allSelected ? [] : [...overrideMemberCompanyIds]);
                      }}
                      style={{
                        cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                        border: '1px solid var(--purple)',
                        background: selectedOverrideCompanyIds.length === overrideMemberCompanyIds.length ? 'var(--purple)' : 'var(--surface)',
                        color: selectedOverrideCompanyIds.length === overrideMemberCompanyIds.length ? '#fff' : 'var(--purple)',
                      }}
                    >
                      🌐 All assigned companies
                    </span>

                    {overrideMemberCompanyIds.map((cid) => {
                      const co = assignedCompanies.find(c => c.id === cid);
                      const isSelected = selectedOverrideCompanyIds.includes(cid);
                      return (
                        <span
                          key={cid}
                          onClick={() => {
                            setSelectedOverrideCompanyIds(prev =>
                              isSelected ? prev.filter(id => id !== cid) : [...prev, cid]
                            );
                          }}
                          style={{
                            cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                            border: isSelected ? '1px solid var(--blue)' : '1px solid var(--border2)',
                            background: isSelected ? 'var(--blue-lt)' : 'var(--surface)',
                            color: isSelected ? 'var(--blue)' : 'var(--ink3)',
                          }}
                        >
                          {co?.name || cid}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 6, lineHeight: 1.5 }}>
                    Editing overrides for: {selectedOverrideCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'none selected'}.
                    {(selectedOverrideCompanyIds.length !== 1 || selectedOverrideCompanyIds[0] !== overrideMemberCompanyId) && (
                      <> Showing group defaults here — toggle only the exceptions you want applied to <em>all</em> selected companies; existing per-company overrides aren't shown when multiple companies are selected.</>
                    )}
                  </div>
                </div>
              )}
              <div className="info" style={{ fontSize: 11, marginTop: 10, background: 'var(--amber-lt)', borderColor: 'var(--amber-bd)', color: 'var(--amber)' }}>
                Changes apply only to this person. Everyone else in <strong>{groupName}</strong> keeps the group defaults.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card cp">
              <div className="ct" style={{ marginBottom: 12 }}>Group Details</div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label htmlFor="rp-group-name">Group Name *</label>
                <input id="rp-group-name" type="text" value={name} maxLength={80}
                  onChange={e => setName(e.target.value)} placeholder="e.g. Senior HR" autoFocus />
              </div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label>Colour Tag</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLOR_OPTS.map(c => (
                    <div key={c.key} onClick={() => setColorKey(c.key)} title={c.key}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c.css, cursor: 'pointer', border: `3px solid ${colorKey === c.key ? 'var(--ink)' : 'transparent'}`, transform: colorKey === c.key ? 'scale(1.2)' : 'scale(1)', transition: 'all .12s' }} />
                  ))}
                </div>
              </div>
              <div className="fg">
                <label htmlFor="rp-group-desc">Description</label>
                <textarea id="rp-group-desc" value={desc} maxLength={255}
                  onChange={e => setDesc(e.target.value)} rows={2} placeholder="What can this group do?" />
              </div>
            </div>
          </div>
        )}

        {/* Col 2 */}
        <ModuleMatrix
          modPerms={modPerms}
          onChange={setModPerms}
          isOverrideMode={isOverrideMode}
          moduleCompanyMap={moduleCompanyMap}
          assignedCompanies={assignedCompanies}
          overrideTargetCompanyIds={selectedOverrideCompanyIds}
          modules={modules}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
        />

        {/* Col 3 */}
        <PermSummary modPerms={modPerms} modules={modules} isOverrideMode={isOverrideMode} perCompanyModPerms={perCompanyModPerms} />
      </div>

      {!isOverrideMode || group ? (
        <div style={{ marginTop: 20 }}>
          <FieldPermissionsPanel
            groupId={group?.id ?? 0}
            assignedCompanies={assignedCompanies}
            isOverrideMode={isOverrideMode}
            overrideMemberId={overrideMemberId}
            selectedOverrideCompanyIds={selectedOverrideCompanyIds}
            modPerms={effectiveModPerms}
            moduleCompanyMap={moduleCompanyMap}
            companyFilter={companyFilter}
            onRegisterSave={fn => { fieldSaveRef.current = fn; }}
          />
        </div>
      ) : null}
    </div>
  );
}