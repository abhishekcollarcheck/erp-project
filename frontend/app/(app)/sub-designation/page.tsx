'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
import { SubDesignationFormModal } from '../../../features/sub-designations/components/SubDesignationFormModal';
import {
  useSubDesignations, useSubDesignationStats,
  useDeleteSubDesignation, useToggleSubDesignation,
} from '../../../features/sub-designations/hooks/useSubDesignations';
import { usePermission } from '../../../features/auth/hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import type { SubDesignation } from '../../../features/sub-designations/types/subdesignation.types';
import { PermissionGuard } from '../../../utils/permissionGuard';

export default function SubDesignationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canEdit, canView, canDelete, canCreate } = usePermission();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'true' | 'false' | 'all'>('true');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubDesignation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubDesignation | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const deleteMutation = useDeleteSubDesignation();
  const toggleMutation = useToggleSubDesignation();

  const { data: subDesignations = [], isLoading } = useSubDesignations({
    search: debouncedSearch || undefined,
    is_active: statusFilter,
  });

  const { data: stats } = useSubDesignationStats();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Sub-Designations', breadcrumb: 'Organisation' }));
  }, [dispatch]);

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (sd: SubDesignation) => { setEditTarget(sd); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <PermissionGuard permission='sub-designation:view'>
      <AppShell onAddNew={canEdit('sub-designation') ? openCreate : undefined}>
        <div className="pg-enter">

          {/* Header */}
          <div className="ph">
            <div>
              <h1>Sub-Designations</h1>
              <p>Role specializations and levels across your organisation · Linked to employees</p>
            </div>
            <div className="ph-r">
              {/* View toggle */}
              <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2, gap: 2 }}>
                {(['table', 'cards'] as const).map((v) => (
                  <button key={v} onClick={() => setViewMode(v)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: viewMode === v ? 'var(--surface)' : 'transparent', color: viewMode === v ? 'var(--ink)' : 'var(--ink4)', boxShadow: viewMode === v ? 'var(--sh)' : 'none', fontFamily: 'var(--font)', transition: 'all .1s' }}>
                    {v === 'table' ? '☰ Table' : '⊞ Cards'}
                  </button>
                ))}
              </div>
              {canCreate('sub-designation') && (
                <button className="btn btn-pri btn-sm" onClick={openCreate}>+ Add Sub-Designation</button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="g4 mb14">
            <StatCard label="Total" value={stats?.total ?? '…'} color="var(--blue)" />
            <StatCard label="Active" value={stats?.active ?? '…'} color="var(--green)" />
            <StatCard label="Inactive" value={stats?.inactive ?? '…'} color="var(--red)" />
          </div>

          {/* Top sub-designation banner */}
          {stats?.topSubDesignation && (
            <div style={{ background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', borderRadius: 'var(--r)', padding: '10px 16px', marginBottom: 16, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🏆</span>
              <span style={{ color: 'var(--ink3)' }}>
                Most populated sub-designation: <strong style={{ color: 'var(--blue)' }}>{stats.topSubDesignation.name}</strong>
                <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--blue)', color: '#fff', padding: '1px 8px', borderRadius: 99 }}>{stats.topSubDesignation.count} employees</span>
              </span>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ maxWidth: 280 }}>
              <span style={{ color: 'var(--ink4)' }}>⌕</span>
              <input type="text" placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}
            >
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
              <option value="all">All</option>
            </select>
            <span style={{ fontSize: 11, color: 'var(--ink4)', alignSelf: 'center', marginLeft: 4 }}>
              {subDesignations.length} result{subDesignations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ─── TABLE VIEW ─── */}
          {viewMode === 'table' && (
            <div className="card">
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Sub-Designation</th>
                      <th>Employees</th>
                      <th>Status</th>
                      {canEdit('sub-designation') && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {[140, 40, 60, 80].map((w, j) => (
                            <td key={j}><div className="skeleton" style={{ height: 14, width: w }} /></td>
                          ))}
                        </tr>
                      ))
                      : subDesignations.length === 0
                        ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--ink4)' }}>
                              No sub-designations found. {canEdit('sub-designation') && <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={openCreate}>Create the first one →</span>}
                            </td>
                          </tr>
                        )
                        : subDesignations.map((sd) => (
                          <tr key={sd.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/sub-designations/${sd.id}`)}>
                            <td>
                              <strong style={{ color: 'var(--ink)' }}>{sd.name}</strong>
                            </td>
                            <td style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: (sd.employee_count ?? 0) > 0 ? 'var(--blue)' : 'var(--ink4)', textAlign: 'center' }}>
                              {sd.employee_count ?? 0}
                            </td>
                            <td>
                              <Chip variant={sd.is_active ? 'green' : 'gray'}>{sd.is_active ? 'Active' : 'Inactive'}</Chip>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {canEdit('sub-designation') && (
                                  <>
                                    <Chip variant="gray" onClick={() => openEdit(sd)}>Edit</Chip>
                                    <Chip variant={sd.is_active ? 'amber' : 'green'} onClick={() => toggleMutation.mutate(sd.id)}>
                                      {sd.is_active ? 'Deactivate' : 'Activate'}
                                    </Chip>
                                  </>
                                )}
                                {canDelete('sub-designation') && (
                                  <Chip variant="red" onClick={() => setDeleteTarget(sd)}>Delete</Chip>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── CARDS VIEW ─── */}
          {viewMode === 'cards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card cp">
                    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  </div>
                ))
                : subDesignations.length === 0
                  ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--ink4)' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No sub-designations found</div>
                      {canEdit('sub-designation') && (
                        <button className="btn btn-pri btn-sm" style={{ marginTop: 8 }} onClick={openCreate}>+ Add Sub-Designation</button>
                      )}
                    </div>
                  )
                  : subDesignations.map((sd) => (
                    <div
                      key={sd.id}
                      className="card"
                      style={{ overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .12s' }}
                      onClick={() => router.push(`/sub-designations/${sd.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--sh2)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--sh)'; }}
                    >
                      <div style={{ height: 3, background: sd.is_active ? 'var(--blue)' : 'var(--border2)' }} />
                      <div className="cp">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', flex: 1, marginRight: 8 }}>{sd.name}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink4)' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: (sd.employee_count ?? 0) > 0 ? 'var(--blue)' : 'var(--ink4)' }}>
                            {sd.employee_count ?? 0} employees
                          </span>
                          <Chip variant={sd.is_active ? 'green' : 'gray'}>{sd.is_active ? 'Active' : 'Inactive'}</Chip>
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
                          {canEdit('sub-designation') && (
                            <Chip variant="gray" onClick={() => openEdit(sd)}>Edit</Chip>
                          )}
                          {canDelete('sub-designation') && (
                            <Chip variant="red" onClick={() => setDeleteTarget(sd)}>Delete</Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>

        {/* Create / Edit modal */}
        <SubDesignationFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
          subDesignation={editTarget}
        />

        {/* Delete confirmation */}
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Sub-Designation"
          subtitle={`Delete "${deleteTarget?.name}"?`}
          footer={
            <>
              <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </>
          }
        >
          <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
            ⚠ If active employees hold this sub-designation, deletion will be blocked. Reassign them first.
          </div>
        </Modal>
      </AppShell>
    </PermissionGuard>
  );
}