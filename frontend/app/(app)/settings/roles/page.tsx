'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { selectManagedCompanies } from '../../../../store/slices/authSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Modal } from '../../../../components/ui/Modal';
import { useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { showToast } from '../../../../utils/toast';
import { usePermission } from '../../../../features/auth/hooks/useAuth';
import { PageHeaderWithCompany } from '../../../../components/company/CompanySelector';
import { PermissionGuard } from '../../../../utils/permissionGuard';
import { useCompanyModulesMap } from '../../../../hooks/useCompanyModulesMap';
import { pgApi } from '../../../../features/setting/services/permissions.services';
import type { PermGroup, View } from '../../../../features/setting/types/permissions.types';
import { useEmployees, useGroups, useModuleList } from '../../../../features/setting/hooks/useRolePermissions';
import { GroupSidebar } from '../../../../features/setting/components/GroupSidebar';
import { GroupDetail } from '../../../../features/setting/components/GroupDetail';
import { EditView } from '../../../../features/setting/components/EditView';

export default function RolesPermissionsPage() {
  const dispatch = useAppDispatch();
  const { canEdit, canCreate, canDelete } = usePermission();
  const managedCompanies = useAppSelector(selectManagedCompanies);

  const assignedCompanies = useMemo(() =>
    managedCompanies.map((co: any) => ({
      id: co.id,
      name: co.name,
      shortName: co.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4),
    })),
    [managedCompanies],
  );
  const qc = useQueryClient();

  const { data: groups = [], isLoading } = useGroups();
  const { data: modules = [], isLoading: modulesLoading } = useModuleList();

  // View state
  const [view, setView] = useState<View>('groups');
  const [editGroup, setEditGroup] = useState<PermGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PermGroup | null>(null);

  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const selectedGroup = groups.find(g => g.id === activeGroupId) ?? groups[0] ?? null;
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [memberOverrides, setMemberOverrides] = useState<Record<number, boolean>>({});

  // Override mode — opens EditView for a specific member
  const [overrideMemberId, setOverrideMemberId] = useState<number | undefined>();
  const [overrideMemberName, setOverrideMemberName] = useState<string | undefined>();
  const [overrideMemberCompanyId, setOverrideMemberCompanyId] = useState<number | undefined>();
  const [overrideMemberCompanyIds, setOverrideMemberCompanyIds] = useState<number[]>([]);

  const { data: employees = [] } = useEmployees();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Roles & Permissions', breadcrumb: 'Settings' }));
  }, [dispatch]);

  const memberQueries = useQueries({
    queries: groups.map(g => ({
      queryKey: ['rp', 'group-members', g.id],
      queryFn: () => pgApi.getMembers(g.id),
      enabled: !!g.id,
    })),
  });

  const groupMembersMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    groups.forEach((g, i) => { map[g.id] = memberQueries[i]?.data?.data || []; });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, memberQueries.map(q => q.dataUpdatedAt).join(',')]);

  useEffect(() => {
    if (groups.length && !activeGroupId) setActiveGroupId(groups[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const totalAssigned = groups.reduce((s, g) => s + (groupMembersMap[g.id]?.length || 0), 0);
  const totalPermRules = groups.reduce((s, g) => s + (g.permissions?.length || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pgApi.delete(id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ['rp'] });
      showToast('Group deleted');
      setDeleteTarget(null);
      if (activeGroupId === deletedId) setActiveGroupId(null);
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, empId, companyIds }: { groupId: number; empId: number; companyIds: number[] }) =>
      pgApi.addMember(groupId, empId, companyIds.length > 0 ? companyIds : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rp', 'group-members'] });
      qc.invalidateQueries({ queryKey: ['group-company-scope'] });
      setMemberOverrides({});
      showToast('✓ Saved');
      setAddPersonOpen(false);
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, empId, companyIds }: { groupId: number; empId: number; companyIds: number[] }) => {
      const results = await Promise.allSettled(
        companyIds.map(companyId => pgApi.removeMember(groupId, companyId, empId))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed) throw new Error(`Removed from ${companyIds.length - failed} of ${companyIds.length} companies`);
    },
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      qc.invalidateQueries({ queryKey: ['group-company-scope'] });
      showToast('Member removed');
    },
    onError: (e: any) => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      showToast(e?.message || 'Failed');
    },
  });

  const handleToggleOverrides = (memberId: number) => {
    setMemberOverrides(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleEditOverride = (memberId: number, companyId?: number) => {
    const member = groupMembersMap[selectedGroup?.id || 0]?.find((m: any) => m.id === memberId);
    const name = member ? `${member.first_name} ${member.last_name}`.trim() : '';
    const resolvedCompanyId = companyId ?? member?.assigned_company_ids?.[0];
    setOverrideMemberId(memberId);
    setOverrideMemberName(name);
    setOverrideMemberCompanyId(resolvedCompanyId);
    setOverrideMemberCompanyIds(member?.assigned_company_ids || []);
    setView('edit');
  };

  const moduleCompanyMap = useCompanyModulesMap(assignedCompanies);

  const closeEdit = () => {
    setView('groups');
    setEditGroup(null);
    setOverrideMemberId(undefined);
    setOverrideMemberName(undefined);
    setOverrideMemberCompanyId(undefined);
    setOverrideMemberCompanyIds([]);
  };

  // ── Edit / override view ──
  if (view === 'edit') return (
    <PermissionGuard permission="settings:edit">
      <AppShell>
        <div className="pg-enter">
          <EditView
            group={overrideMemberId ? selectedGroup : editGroup}
            onBack={closeEdit}
            overrideMemberId={overrideMemberId}
            overrideMemberName={overrideMemberName}
            overrideMemberCompanyId={overrideMemberCompanyId}
            overrideMemberCompanyIds={overrideMemberCompanyIds}
            groupName={selectedGroup?.name}
            moduleCompanyMap={moduleCompanyMap}
            assignedCompanies={assignedCompanies}
            modules={modules}
          />
        </div>
      </AppShell>
    </PermissionGuard>
  );

  // ── Groups list view ──
  return (
    <PermissionGuard permission="settings:view">
      <AppShell>
        <div className="pg-enter">

          <PageHeaderWithCompany
            title="Roles & Permissions"
            description="Permission groups · Employee assignment · Field-level access control"
            actions={
              canCreate('settings') ? (
                <div className="ph-r">
                  <button className="btn btn-pri btn-sm" onClick={() => { setEditGroup(null); setView('edit'); }}>
                    + New Group
                  </button>
                </div>
              ) : undefined
            }
          />

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Permission Groups', value: groups.length, color: 'var(--blue)' },
              { label: 'Employees Assigned', value: totalAssigned, color: 'var(--green)' },
              { label: 'Module Rules', value: totalPermRules, color: 'var(--purple)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '14px 18px', boxShadow: 'var(--sh)' }}>
                <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {isLoading || modulesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', height: 100, marginBottom: 12 }}>
                <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--r3)' }} />
              </div>
            ))
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink4)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No permission groups yet</div>
              <div style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>Create your first group</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {canCreate('settings') && (
                  <>
                    <button className="btn btn-pri" onClick={() => { setEditGroup(null); setView('edit'); }}>+ New Group</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, alignItems: 'start' }}>

              <GroupSidebar
                groups={groups}
                selectedId={selectedGroup?.id ?? null}
                onSelect={g => { setActiveGroupId(g.id); setAddPersonOpen(false); setMemberOverrides({}); }}
                onNew={canCreate('settings') ? () => { setEditGroup(null); setView('edit'); } : undefined}
                membersMap={groupMembersMap}
              />

              {selectedGroup ? (
                <GroupDetail
                  group={selectedGroup}
                  members={groupMembersMap[selectedGroup.id] || []}
                  onEdit={canEdit('settings') ? () => { setEditGroup(selectedGroup); setView('edit'); } : undefined}
                  onDelete={canDelete('settings') ? () => setDeleteTarget(selectedGroup) : undefined}
                  addPersonOpen={addPersonOpen}
                  setAddPersonOpen={setAddPersonOpen}
                  onAddMember={(empId, companyIds) => addMemberMutation.mutate({ groupId: selectedGroup.id, empId, companyIds })}
                  onRemoveMember={(empId) => {
                    const member = (groupMembersMap[selectedGroup.id] || []).find((m: any) => m.id === empId);
                    const nm = `${member?.first_name ?? ''} ${member?.last_name ?? ''}`.trim() || 'this member';
                    if (!window.confirm(`Remove ${nm} from ${selectedGroup.name} in all companies?`)) return;
                    removeMemberMutation.mutate({ groupId: selectedGroup.id, empId, companyIds: member?.assigned_company_ids || [] });
                  }}
                  employees={employees}
                  assignedCompanies={assignedCompanies}
                  overrides={memberOverrides}
                  onToggleOverrides={handleToggleOverrides}
                  onEditOverride={handleEditOverride}
                  modules={modules}
                />
              ) : null}
            </div>
          )}

        </div>
      </AppShell>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title={`Delete "${deleteTarget.name}"?`}>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 16 }}>
            This will permanently delete the group, its module and field permissions, and all member
            assignments{(groupMembersMap[deleteTarget.id]?.length || 0) > 0
              ? ` (${groupMembersMap[deleteTarget.id].length} member${groupMembersMap[deleteTarget.id].length === 1 ? '' : 's'})`
              : ''}. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-pri" style={{ background: 'var(--red)' }}
              onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? '…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </PermissionGuard>
  );
}