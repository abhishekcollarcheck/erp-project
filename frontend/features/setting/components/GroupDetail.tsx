'use client';
import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { showToast } from '../../../utils/toast';
import { pgApi } from '../../../features/setting/services/permissions.services';
import type { PermGroup, Form, Module, ModuleDef } from '../../../features/setting/types/permissions.types';
import { useHrModules, useAllModuleForms, useGroupPerms } from '../../../features/setting/hooks/useRolePermissions';
import { PERMS, PERM_ICONS, PERM_LABELS } from '../constants/rolePermissionsConstants';
import { humanizeFieldKey, cssForKey, countPerm, slugsToModulePerms } from '../utils/rolePermissionsUtils';
import { Avatar } from '../components/Avatar';
import { AddPersonForm } from '../components/AddPersonForm';
import { MemberCompanyBadges } from '../components/MemberCompanyBadges';

export function GroupDetail({
  group, members, onEdit, onDelete,
  addPersonOpen, setAddPersonOpen,
  onAddMember, onRemoveMember, employees, assignedCompanies,
  overrides, onToggleOverrides, onEditOverride, modules,
}: {
  group: PermGroup;
  members: any[];
  onEdit?: () => void;
  onDelete?: () => void;
  addPersonOpen: boolean;
  setAddPersonOpen: (v: boolean) => void;
  onAddMember: (empId: number, companyIds: number[]) => void;
  onRemoveMember: (empId: number) => void;
  employees: any[];
  assignedCompanies: { id: number; name: string; shortName: string }[];
  overrides: Record<string, boolean>;
  onToggleOverrides: (memberId: number) => void;
  onEditOverride: (memberId: number, companyId?: number) => void;
  modules: ModuleDef[];
}) {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const [addCompanyFor, setAddCompanyFor] = useState<number | null>(null);
  const [selectedNewCompanies, setSelectedNewCompanies] = useState<Set<number>>(new Set());

  const { data: scopeCompanyIds = [] } = useQuery({
    queryKey: ['group-company-scope', group?.id],
    queryFn: () => pgApi.groupCompanyScope(group.id),
    enabled: !!group?.id,
    select: (r: any): number[] => r.data ?? [],
  });
  const summaryCompanyId = scopeCompanyIds[0] ?? assignedCompanies[0]?.id;

  const { data: groupSlugs = [] } = useGroupPerms(group.id, summaryCompanyId);
  const groupBaseModPerms = useMemo(() => slugsToModulePerms(groupSlugs, modules), [groupSlugs, modules]);
  const { data: hrModules = [] } = useHrModules();

  const companiesForSummary = scopeCompanyIds.length ? scopeCompanyIds : assignedCompanies.map(c => c.id);
  const perCompanySlugQueries = useQueries({
    queries: companiesForSummary.map(cid => ({
      queryKey: ['rp', 'group-perms', group.id, cid],
      queryFn: () => pgApi.getPerms(group.id, cid),
      enabled: !!group?.id,
      select: (r: any): string[] => r.data ?? [],
    })),
  });
  const perCompanyModPerms = companiesForSummary.map((cid, i) => {
    const co = assignedCompanies.find(c => c.id === cid);
    return {
      companyId: cid,
      companyName: co?.name || `Company ${cid}`,
      shortName: co?.shortName || String(cid),
      modPerms: slugsToModulePerms(perCompanySlugQueries[i]?.data || [], modules),
    };
  });

  const permSummary = useMemo(
    () => PERMS.map(p => ({ p, count: countPerm(groupBaseModPerms, p, modules) })).filter(x => x.count > 0),
    [groupSlugs.join(','), modules],
  );

  const notMembers = useMemo(() => {
    const memberIds = new Set(members.map((m: any) => m.id));
    const q = search.trim().toLowerCase();
    return employees.filter((e: any) => !memberIds.has(e.id) && (
      !q ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      `${e.employee_code || ''}`.toLowerCase().includes(q)
    ));
  }, [employees, members, search]);

  const memberCompanyPairs = useMemo(() =>
    members.flatMap((m: any) =>
      (m.assigned_company_ids || []).map((cid: number) => ({ memberId: m.id, companyId: cid }))
    ),
    [members]
  );

  const overrideQueries = useQueries({
    queries: memberCompanyPairs.map(({ memberId, companyId }) => ({
      queryKey: ['group-overrides', group?.id, memberId, companyId],
      queryFn: () => pgApi.getOverrides(group!.id, memberId, companyId),
      enabled: !!group && overrides[memberId] === true,
    })),
  });

  const memberOverridesMap = useMemo(() => {
    const map: Record<number, Record<number, any[]>> = {};
    memberCompanyPairs.forEach((pair, idx) => {
      if (!map[pair.memberId]) map[pair.memberId] = {};
      map[pair.memberId][pair.companyId] = overrideQueries[idx]?.data?.data || [];
    });
    return map;
  }, [memberCompanyPairs, overrideQueries.map(q => q.dataUpdatedAt).join(',')]);

  const grantedModules = useMemo(
    () => hrModules.filter((m: Module) => {
      const k = (m.permission_key ?? m.slug) as string;
      return !!k && !!groupBaseModPerms[k]?.view;
    }),
    [hrModules, groupBaseModPerms],
  );

  const grantedModuleKeys = useMemo(
    () => grantedModules.map((m: Module) => (m.permission_key ?? m.slug) as string),
    [grantedModules],
  );

  // Only fetch form/field metadata once a panel is actually expanded.
  const anyOverridePanelOpen = Object.values(overrides).some(Boolean);
  const grantedFormsQueries = useAllModuleForms(grantedModules, anyOverridePanelOpen);

  // field_key → human label, sourced from the same forms the field panel uses.
  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of grantedFormsQueries) {
      for (const form of ((q.data || []) as Form[])) {
        for (const fl of (form.fields || [])) {
          if (fl?.field_key) map[fl.field_key] = (fl as any).label || fl.name || fl.field_key;
        }
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantedFormsQueries.map(q => q.dataUpdatedAt).join(',')]);

  const fieldOverrideTargets = useMemo(
    () => memberCompanyPairs.flatMap(pair =>
      grantedModuleKeys.map(moduleKey => ({ ...pair, moduleKey }))
    ),
    [memberCompanyPairs, grantedModuleKeys],
  );

  const fieldOverrideQueries = useQueries({
    queries: fieldOverrideTargets.map(({ memberId, companyId, moduleKey }) => ({
      queryKey: ['group-field-overrides', group?.id, memberId, companyId, moduleKey],
      queryFn: () => pgApi.listFieldOverrides(group!.id, memberId, companyId, moduleKey),
      enabled: !!group && overrides[memberId] === true,
    })),
  });

  

  // An override row only exists because it differs from the group baseline,
  // so `previous` is always the inverse of the stored value — no extra fetch.
  const memberFieldOverridesMap = useMemo(() => {
    const map: Record<number, Record<number, { moduleKey: string; fields: { fieldKey: string; fieldLabel: string; changes: { permission: string; previous: boolean; current: boolean }[] }[] }[]>> = {};
    fieldOverrideTargets.forEach((target, idx) => {
      const raw = (fieldOverrideQueries[idx]?.data as any)?.data || {};
      const fields = Object.entries(raw).map(([fieldKey, perms]) => ({
        fieldKey,
        fieldLabel: fieldLabelMap[fieldKey] || humanizeFieldKey(fieldKey),
        changes: Object.entries(perms as Record<string, boolean>).map(([permission, granted]) => ({
          permission, previous: !granted, current: !!granted,
        })),
      })).filter(f => f.changes.length > 0);
      if (!fields.length) return;
      if (!map[target.memberId]) map[target.memberId] = {};
      if (!map[target.memberId][target.companyId]) map[target.memberId][target.companyId] = [];
      map[target.memberId][target.companyId].push({ moduleKey: target.moduleKey, fields });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldOverrideTargets, fieldLabelMap, fieldOverrideQueries.map(q => q.dataUpdatedAt).join(',')]);

  const deleteModuleOverridesMutation = useMutation({
    mutationFn: async ({ memberId, companyId, overrideIds }: { memberId: number; companyId: number; overrideIds: number[] }) => {
      await Promise.all(overrideIds.map((overrideId) => pgApi.deleteOverride(group!.id, memberId, overrideId)));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['group-overrides', group!.id, vars.memberId, vars.companyId] });
      qc.invalidateQueries({ queryKey: ['rp', 'employee-overrides', group!.id, vars.memberId, vars.companyId] });
      showToast('✓ Override removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed to remove override'),
  });

  const removeMemberCompanyMutation = useMutation({
    mutationFn: async ({ empId, companyId }: { empId: number; companyId: number }) => {
      await pgApi.removeMember(group.id, companyId, empId);
    },
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      showToast('✓ Company removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const handleRemoveCompany = (member: any, companyId: number) => {
    const isLastCompany = (member.assigned_company_ids?.length || 0) <= 1;
    const companyName = assignedCompanies.find(c => c.id === companyId)?.name || 'this company';
    const confirmMsg = isLastCompany
      ? `This is ${member.first_name}'s only company in this group — removing it will remove them from the group entirely. Continue?`
      : `Remove ${member.first_name} from ${companyName} for this group?`;
    if (window.confirm(confirmMsg)) {
      removeMemberCompanyMutation.mutate({ empId: member.id, companyId });
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: cssForKey(group.color), flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{group.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 2 }}>{group.description || 'No description'}</div>
        </div>
        {onEdit && <button className="btn btn-sec btn-sm" onClick={onEdit}>✎ Edit Permissions</button>}
        {onDelete && !group.is_system && (
          <button className="btn btn-sec btn-sm" onClick={onDelete} style={{ color: 'var(--red)' }}>🗑</button>
        )}
      </div>

      {/* Permission summary */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', marginBottom: 8 }}>Permission Summary</div>
        {perCompanyModPerms.length > 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {perCompanyModPerms.map(co => {
              const rows = PERMS.map(p => ({ p, count: countPerm(co.modPerms, p, modules) })).filter(x => x.count > 0);
              return (
                <div key={co.companyId} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink4)', minWidth: 32 }} title={co.companyName}>
                    {co.shortName}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {rows.length === 0 ? (
                      <span style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic' }}>None assigned</span>
                    ) : rows.map(({ p, count }) => (
                      <span key={p} title={`${PERM_LABELS[p]}: ${count} modules`}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 9px', fontSize: 11, fontWeight: 600, color: 'var(--ink3)', borderRadius: 99 }}>
                        {PERM_ICONS[p]} {count}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {permSummary.length === 0 ? (
              <span style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic' }}>None assigned</span>
            ) : permSummary.map(({ p, count }) => (
              <span key={p} title={`${PERM_LABELS[p]}: ${count} modules`}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 9px', fontSize: 11, fontWeight: 600, color: 'var(--ink3)', borderRadius: 99 }}>
                {PERM_ICONS[p]} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)' }}>
            Members ({members.length})
          </div>
          <button className="btn btn-sec btn-sm" onClick={() => setAddPersonOpen(!addPersonOpen)}>
            {addPersonOpen ? '✕ Cancel' : '+ Add Person'}
          </button>
        </div>

        {/* Add person picker — with company multi-select chips */}
        {addPersonOpen && (
          <AddPersonForm
            notMembers={notMembers}
            search={search}
            setSearch={setSearch}
            assignedCompanies={assignedCompanies}
            onAdd={onAddMember}
          />
        )}

        {/* Member rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((m: any) => {
            const name = `${m.first_name || ''} ${m.last_name || ''}`.trim();
            const memberId = m.id;
            const showOvrd = overrides[memberId] === true;
            const overridesByCompany = memberOverridesMap[memberId] || {};
            const groupedOverridesByCompany = Object.entries(overridesByCompany).map(([companyIdStr, rows]) => {
              const companyId = Number(companyIdStr);
              const co = assignedCompanies.find(c => c.id === companyId);
              const grouped = Object.values(
                (rows as any[]).reduce((acc: any, row: any) => {
                  if (!acc[row.module]) {
                    acc[row.module] = { module: row.module, overrideIds: [], changes: [] };
                  }
                  acc[row.module].overrideIds.push(row.id);
                  acc[row.module].changes.push({
                    permission: row.permission,
                    previous: !!groupBaseModPerms[row.module]?.[row.permission],
                    current: row.granted,
                  });
                  return acc;
                }, {})
              );
              const fieldRows = (memberFieldOverridesMap[memberId] || {})[companyId] || [];
              return { companyId, companyName: co?.name || `Company ${companyId}`, moduleRows: grouped, fieldRows };
            });

            const memberAssignedIds = new Set(m.assigned_company_ids || []);
            const availableToAdd = assignedCompanies.filter((co) => !memberAssignedIds.has(co.id));
            return (
              <div key={memberId} id={`rp-mrow-${memberId}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={name} size={30} fontSize={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{m.designation || m.employee_code}</div>
                  </div>

                  <MemberCompanyBadges member={m} assignedCompanies={assignedCompanies} onRemoveCompany={(companyId) => handleRemoveCompany(m, companyId)} />

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onToggleOverrides(memberId)}
                    title="View permission overrides"
                    aria-label={`View permission overrides for ${name}`}
                    style={{ fontSize: 11 }}
                  >
                    ☷ Overrides
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onRemoveMember(memberId)}
                    style={{ color: 'var(--red)', fontSize: 11 }}
                    title="Remove from group"
                    aria-label={`Remove ${name} from group`}
                  >
                    ✕
                  </button>
                </div>

                {/* Inline override panel */}
                {showOvrd && (
                  <div style={{ margin: '6px 0 10px 38px', padding: '12px 14px', background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                      ☷ Permission overrides for {name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 10 }}>
                      These exceptions apply only to {m.first_name} — everyone else in <strong>{group.name}</strong> keeps the group&apos;s default permissions.
                    </div>
                    {groupedOverridesByCompany.map(({ companyId, companyName, moduleRows, fieldRows }) => (
                      (moduleRows.length > 0 || fieldRows.length > 0) && (
                        <div key={companyId} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                            {companyName}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {moduleRows.map((mod: any) => (
                              <div key={mod.module} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: 11 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                    {modules.find(x => x.key === mod.module)?.label || mod.module}
                                  </div>
                                  <div style={{ color: 'var(--ink3)', marginTop: 2 }}>
                                    {mod.changes.map((c: any, idx: number) => (
                                      <span key={c.permission}>
                                        <strong style={{ textTransform: 'capitalize' }}>{c.permission}</strong>
                                        {': '}
                                        <span style={{ color: c.previous ? 'var(--green)' : 'var(--red)' }}>
                                          {c.previous ? 'allowed' : 'denied'}
                                        </span>
                                        {' → '}
                                        <span style={{ color: c.current ? 'var(--green)' : 'var(--red)' }}>
                                          {c.current ? 'allowed' : 'denied'}
                                        </span>
                                        {idx < mod.changes.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: 10 }}
                                  onClick={() => onEditOverride(memberId, companyId)}
                                  title="Edit this override"
                                  aria-label="Edit this override"
                                >
                                  ✎
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--red)' }}
                                  title="Delete this override"
                                  aria-label="Delete this override"
                                  disabled={deleteModuleOverridesMutation.isPending}
                                  onClick={() => { deleteModuleOverridesMutation.mutate({ memberId, companyId, overrideIds: mod.overrideIds }); }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            {fieldRows.map(({ moduleKey, fields }) => (
                              <div key={`f-${moduleKey}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: 11 }}>
                                <div style={{ fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--ink4)' }}>
                                    Field
                                  </span>
                                  {modules.find(x => x.key === moduleKey)?.label || moduleKey}
                                </div>
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {fields.map(f => (
                                    <div key={f.fieldKey} style={{ color: 'var(--ink3)' }}>
                                      <strong style={{ color: 'var(--ink2)' }} title={f.fieldKey}>{f.fieldLabel}</strong>
                                      {' — '}
                                      {f.changes.map((c, idx) => (
                                        <span key={c.permission}>
                                          <strong style={{ textTransform: 'capitalize' }}>{c.permission}</strong>
                                          {': '}
                                          <span style={{ color: c.previous ? 'var(--green)' : 'var(--red)' }}>
                                            {c.previous ? 'allowed' : 'denied'}
                                          </span>
                                          {' → '}
                                          <span style={{ color: c.current ? 'var(--green)' : 'var(--red)' }}>
                                            {c.current ? 'allowed' : 'denied'}
                                          </span>
                                          {idx < f.changes.length - 1 ? ', ' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: 10 }}
                                    onClick={() => onEditOverride(memberId, companyId)}
                                    title="Edit field overrides"
                                    aria-label="Edit field overrides"
                                  >
                                    ✎
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                    {availableToAdd.length > 0 && (
                      <button
                        className="btn btn-sec btn-sm"
                        style={{ fontSize: 11, marginLeft: 6 }}
                        onClick={() => {
                          const next = addCompanyFor === memberId ? null : memberId;
                          setAddCompanyFor(next);
                          setSelectedNewCompanies(new Set());
                        }}
                      >
                        {addCompanyFor === memberId ? '✕ Cancel' : '+ Add Company'}
                      </button>
                    )}

                    {addCompanyFor === memberId && (
                      <div style={{ marginTop: 8, padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink3)', marginBottom: 6 }}>
                          Select companies to add:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {availableToAdd.map((co) => {
                            const isSelected = selectedNewCompanies.has(co.id);
                            return (
                              <span
                                key={co.id}
                                onClick={() => {
                                  setSelectedNewCompanies(prev => {
                                    const n = new Set(prev);
                                    isSelected ? n.delete(co.id) : n.add(co.id);
                                    return n;
                                  });
                                }}
                                style={{
                                  cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                                  border: isSelected ? '1px solid var(--blue)' : '1px solid var(--border2)',
                                  background: isSelected ? 'var(--blue-lt)' : 'var(--surface2)',
                                  color: isSelected ? 'var(--blue)' : 'var(--ink3)',
                                }}
                              >
                                {co.name}
                              </span>
                            );
                          })}
                        </div>
                        <button
                          className="btn btn-pri btn-sm"
                          disabled={selectedNewCompanies.size === 0}
                          style={{ opacity: selectedNewCompanies.size === 0 ? 0.5 : 1 }}
                          onClick={() => {
                            onAddMember(memberId, [...selectedNewCompanies]);
                            setAddCompanyFor(null);
                            setSelectedNewCompanies(new Set());
                          }}
                        >
                          ✓ Add Selected
                        </button>
                      </div>
                    )}
                    <button className="btn btn-sec btn-sm" onClick={() => onEditOverride(memberId)} style={{ fontSize: 11 }}>
                      + Edit Override
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink4)', fontStyle: 'italic', padding: '10px 0' }}>No members yet</div>
          )}
        </div>
      </div>
    </div>
  );
}