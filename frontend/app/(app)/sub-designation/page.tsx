'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Select } from '../../../components/ui/Select';
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
  const [selected, setSelected] = useState<SubDesignation[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    for (const sd of selected) {
      try { await deleteMutation.mutateAsync(sd.id); } catch { /* keep going */ }
    }
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    setSelected([]);
  };

  const tableColumns: Column<SubDesignation>[] = [
    {
      key: 'name', header: 'Sub-Designation',
      render: (sd) => <strong style={{ color: 'var(--ink)' }}>{sd.name}</strong>,
    },
    {
      key: 'employees', header: 'Employees', align: 'center',
      render: (sd) => (
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: (sd.employee_count ?? 0) > 0 ? 'var(--blue)' : 'var(--ink4)' }}>
          {sd.employee_count ?? 0}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (sd) => <Chip variant={sd.is_active ? 'green' : 'gray'}>{sd.is_active ? 'Active' : 'Inactive'}</Chip>,
    },
    ...(canEdit('sub-designation') || canDelete('sub-designation') ? [{
      key: 'actions', header: 'Actions',
      render: (sd: SubDesignation) => (
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
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
      ),
    }] : []),
  ];

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
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as 'true' | 'false' | 'all')}
              options={[
                { value: 'true', label: 'Active only' },
                { value: 'false', label: 'Inactive only' },
                { value: 'all', label: 'All' },
              ]}
              ariaLabel="Filter by status"
            />
            <span style={{ fontSize: 11, color: 'var(--ink4)', alignSelf: 'center', marginLeft: 4 }}>
              {subDesignations.length} result{subDesignations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ─── TABLE VIEW ─── */}
          {viewMode === 'table' && (
            <DataTable
              columns={tableColumns}
              data={subDesignations}
              isLoading={isLoading}
              rowKey={(sd) => sd.id}
              minWidth="560px"
              emptyText="No sub-designations found."
              onRowClick={(sd) => router.push(`/sub-designations/${sd.id}`)}
              selectable={canDelete('sub-designation')}
              selection={selected}
              onSelectionChange={setSelected}
              selectionBar={(rows, clear) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '7px 12px',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{rows.length} selected</span>
                  <button className="btn btn-danger btn-sm" onClick={() => setBulkDeleteOpen(true)}>Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>
                </div>
              )}
            />
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

        <Modal
          open={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          title="Delete Sub-Designations"
          subtitle={`Delete ${selected.length} selected sub-designation${selected.length === 1 ? '' : 's'}?`}
          footer={
            <>
              <button className="btn btn-sec" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Deleting…' : `Yes, Delete ${selected.length}`}
              </button>
            </>
          }
        >
          <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
            ⚠ Sub-designations held by active employees will be skipped.
          </div>
        </Modal>
      </AppShell>
    </PermissionGuard>
  );
}