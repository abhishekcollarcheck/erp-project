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
import { SubDepartmentFormModal } from '../../../features/sub-departments/components/SubDepartmentFormModal';
import { useSubDepartments, useDeleteSubDepartment } from '../../../features/sub-departments/hooks/useSubDepartments';
import { usePermission } from '../../../features/auth/hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { useEmployees } from '../../../features/employees/hooks/useEmployees';
import type { SubDepartment } from '../../../services/api/subDepartment.service';
import { getInitials } from '../../../utils/formatters';
import { PermissionGuard } from '../../../utils/permissionGuard';

export default function SubDepartmentsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canEdit, canCreate, canDelete, canView } = usePermission();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubDepartment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubDepartment | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selected, setSelected] = useState<SubDepartment[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const deleteMutation = useDeleteSubDepartment();

  const { data: subDepartments = [], isLoading } = useSubDepartments({
    search: debouncedSearch || undefined,
  });
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.data ?? [];

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Sub-Departments', breadcrumb: 'Organisation' }));
  }, [dispatch]);

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (sd: SubDepartment) => { setEditTarget(sd); setFormOpen(true); };

  const deptOptions = subDepartments.map((sd) => ({ value: sd.id, label: sd.name }));
  const managerOpts = employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }));

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

  const tableColumns: Column<SubDepartment>[] = [
    {
      key: 'name', header: 'Sub-Department',
      render: (sd) => (
        <strong style={{ cursor: 'pointer', color: 'var(--blue)' }}
          onClick={() => router.push(`/sub-department/${sd.id}`)}>
          {sd.name}
        </strong>
      ),
    },
    {
      key: 'employees', header: 'Employees',
      render: (sd) => <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--blue)' }}>{sd.employee_count ?? 0}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (sd) => <Chip variant={sd.is_active ? 'green' : 'gray'}>{sd.is_active ? 'Active' : 'Inactive'}</Chip>,
    },
    ...(canEdit('sub-department') || canDelete('sub-department') ? [{
      key: 'actions', header: 'Actions',
      render: (sd: SubDepartment) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {canEdit('sub-department') && <Chip variant="gray" onClick={() => openEdit(sd)}>Edit</Chip>}
          {canDelete('sub-department') && <Chip variant="red" onClick={() => setDeleteTarget(sd)}>Delete</Chip>}
        </div>
      ),
    }] : []),
  ];

  return (
    <PermissionGuard permission='sub-department:view'>
      <AppShell onAddNew={canView('sub-department') ? openCreate : undefined}>
        <div className="pg-enter">

          {/* Header */}
          <div className="ph">
            <div>
              <h1>Sub-Departments</h1>
              <p>Team structure · Manager hierarchy · Team member assignments</p>
            </div>
            <div className="ph-r">
              {/* View toggle */}
              <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2, gap: 2 }}>
                {(['cards', 'table'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    style={{
                      padding: '4px 12px', border: 'none', borderRadius: 6,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: viewMode === v ? 'var(--surface)' : 'transparent',
                      color: viewMode === v ? 'var(--ink)' : 'var(--ink4)',
                      boxShadow: viewMode === v ? 'var(--sh)' : 'none',
                      fontFamily: 'var(--font)',
                    }}
                  >
                    {v === 'cards' ? '⊞ Cards' : '☰ Table'}
                  </button>
                ))}
              </div>
              {canCreate('sub-department') && (
                <button className="btn btn-pri btn-sm" onClick={openCreate}>+ Add Sub-Department</button>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
            <div className="search-bar" style={{ maxWidth: 300 }}>
              <span style={{ color: 'var(--ink4)' }}>⌕</span>
              <input
                type="text"
                placeholder="Search sub-department name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ─── CARDS VIEW ─── */}
          {viewMode === 'cards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card cp">
                    <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  </div>
                ))
                : subDepartments.length === 0
                  ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--ink4)' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No sub-departments yet</div>
                      <div style={{ fontSize: 12 }}>Create your first sub-department to start organising your teams</div>
                      {canCreate('sub-department') && (
                        <button className="btn btn-pri btn-sm" style={{ marginTop: 16 }} onClick={openCreate}>
                          + Add Sub-Department
                        </button>
                      )}
                    </div>
                  )
                  : subDepartments.map((subDept) => (
                    <div key={subDept.id} className="card" style={{ overflow: 'hidden' }}>
                      {/* Colour top bar */}
                      <div style={{ height: 4, background: subDept.is_active ? 'var(--blue)' : 'var(--border2)' }} />

                      <div className="cp">
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.2px' }}>
                              {subDept.name}
                            </div>
                          </div>
                          <Chip variant={subDept.is_active ? 'green' : 'gray'}>
                            {subDept.is_active ? 'Active' : 'Inactive'}
                          </Chip>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>
                              {subDept.employee_count ?? 0}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Employees</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <Chip variant="blue" onClick={() => router.push(`/sub-department/${subDept.id}`)}>View</Chip>
                          {canEdit('sub-department') && (
                            <Chip variant="gray" onClick={() => openEdit(subDept)}>Edit</Chip>
                          )}
                          {canDelete('sub-department') && (
                            <Chip variant="red" onClick={() => setDeleteTarget(subDept)}>Delete</Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}

          {/* ─── TABLE VIEW ─── */}
          {viewMode === 'table' && (
            <DataTable
              columns={tableColumns}
              data={subDepartments}
              isLoading={isLoading}
              rowKey={(sd) => sd.id}
              minWidth="560px"
              emptyText="No sub-departments found."
              selectable={canDelete('sub-department')}
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

        </div>

        {/* Create / Edit modal */}
        <SubDepartmentFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
          subDepartment={editTarget}
          departments={deptOptions}
          managers={managerOpts}
        />

        {/* Delete confirmation */}
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Sub-Department"
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
            ⚠ Sub-departments with active employees cannot be deleted.
            Reassign them first.
          </div>
        </Modal>

        <Modal
          open={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          title="Delete Sub-Departments"
          subtitle={`Delete ${selected.length} selected sub-department${selected.length === 1 ? '' : 's'}?`}
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
            ⚠ Sub-departments with active employees will be skipped.
          </div>
        </Modal>
      </AppShell>
    </PermissionGuard>
  );
}