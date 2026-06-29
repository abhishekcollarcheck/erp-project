'use client';
/**
 * /employees — Employee Directory Page
 * Matches existing project patterns: AppShell, DataTable, Chip, StatCard, Modal.
 */

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Chip } from '../../../components/ui/Chip';
import { StatCard } from '../../../components/ui/StatCard';
import { Modal } from '../../../components/ui/Modal';
import { useEmployees, useEmployeeSummary, useDeleteEmployee } from '../../../features/employees/hooks/useEmployees';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermission } from '../../../features/auth/hooks/useAuth';
import { formatDate, getTenure, getInitials, statusVariant } from '../../../features/employees/utils/employee.utils';
import { showToast } from '../../../utils/toast';
import type { Employee, EmployeeStatus } from '../../../features/employees/types/employee.types';
import { EMPLOYEE_STATUS, EMPLOYMENT_TYPE } from '../../../features/employees/constants/employee.constants';
import { BulkUploadModal } from '../../../features/employees/components/BulkUploadModal';

type StatusFilter     = EmployeeStatus | '';
type EmpTypeFilter    = 'Permanent' | 'Contractual' | '';

export default function EmployeesPage() {
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const { canCreate, canEdit, canDelete, canDownload } = usePermission();

  // ── State ────────────────────────────────────────────────────────────────
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [typeFilter,   setTypeFilter]   = useState<EmpTypeFilter>('');
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useEmployees({
    page,
    limit:  20,
    search: debouncedSearch || undefined,
    status: statusFilter    || undefined,
    employment_type: typeFilter || undefined,
  });

  const { data: summary }  = useEmployeeSummary();
  const deleteMutation     = useDeleteEmployee();

  // ── Page title ────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(setPageTitle({ title: 'Employee Directory', breadcrumb: 'People & Performance' }));
  }, [dispatch]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(Number(deleteTarget.id));
      showToast('Employee removed successfully');
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove employee');
    }
  };

  // ── Completion badge ──────────────────────────────────────────────────────
  const CompletionBadge = ({ pct }: { pct: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : pct >= 60 ? 'var(--blue)' : 'var(--amber)', borderRadius: 2, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--ink4)', minWidth: 28 }}>{pct}%</span>
    </div>
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<Employee>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: row => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {row.avatar_url ? (
            <Image src={row.avatar_url} alt={`${row.first_name} ${row.last_name}`} width={32} height={32}
              style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {getInitials(`${row.first_name} ${row.last_name}`)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--blue)', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); router.push(`/employees/${row.id}`); }}>
              {row.first_name} {row.middle_name ? `${row.middle_name[0]}. ` : ''}{row.last_name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{row.employee_code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: row => (
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{row.email || '—'}</div>
          <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{row.phone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'work',
      header: 'Work',
      render: row => (
        <div>
          <div style={{ fontSize: 11 }}>{row.working_city || '—'}</div>
          <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{row.working_site || '—'}</div>
        </div>
      ),
    },
    {
      key: 'manager',
      header: 'Manager (L1)',
      render: row => row.l1Manager ? (
        <div>
          <div style={{ fontSize: 11 }}>{row.l1Manager.first_name} {row.l1Manager.last_name}</div>
          <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{row.l1Manager.employee_code}</div>
        </div>
      ) : <span style={{ color: 'var(--ink4)', fontSize: 12 }}>—</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: row => <Chip variant="blue">{row.employment_type}</Chip>,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <Chip variant={statusVariant(row.status)}>{row.status}</Chip>,
    },
    {
      key: 'doj',
      header: 'Joined',
      render: row => (
        <div>
          <div style={{ fontSize: 11 }}>{formatDate(row.actual_doj)}</div>
          {row.actual_doj && <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{getTenure(row.actual_doj)}</div>}
        </div>
      ),
    },
    {
      key: 'portal',
      header: 'Portal',
      render: row => (
        <span style={{ fontSize: 11, color: row.portal_access ? 'var(--green)' : 'var(--ink4)' }}>
          {row.portal_access ? '✓ Active' : '✗ Off'}
        </span>
      ),
    },
    {
      key: 'completion',
      header: 'Profile',
      render: row => <CompletionBadge pct={row.form_completion_pct ?? 0} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <Chip variant="blue" onClick={() => router.push(`/employees/${row.id}`)}>View</Chip>
          {canEdit('employees') && <Chip variant="gray" onClick={() => router.push(`/employees/${row.id}/edit`)}>Edit</Chip>}
          {canDelete('employees') && <Chip variant="red" onClick={() => setDeleteTarget(row)}>Remove</Chip>}
        </div>
      ),
    },
  ];

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const toolbar = (
    <>
      <div style={{ fontWeight: 700, fontSize: 13 }}>
        All Employees
        <span style={{ fontSize: 11, color: 'var(--ink4)', fontWeight: 400, marginLeft: 6 }}>
          {data?.meta?.total ?? '…'} total
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="filter-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}>
          <option value="">All Status</option>
          {EMPLOYEE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value as EmpTypeFilter); setPage(1); }}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}>
          <option value="">All Types</option>
          {EMPLOYMENT_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className="search-bar">
          <span style={{ color: 'var(--ink4)' }}>⌕</span>
          <input type="text" placeholder="Search name, email, code…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
    </>
  );

  if (isError) return (
    <AppShell>
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Failed to load employees.</div>
    </AppShell>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppShell onAddNew={canCreate('employees') ? () => router.push('/employees/new') : undefined}>
      <div className="pg-enter">

        {/* Page header */}
        <div className="ph">
          <div>
            <h1>Employee Directory</h1>
            <p>All employees · Multi-company · Role-based access control</p>
          </div>
          <div className="ph-r">
            {/* <button className="btn btn-sec btn-sm" disabled>↓ Export</button> */}
              {canDownload('employees') && (
                <button className="btn btn-sec btn-sm" onClick={() => setBulkOpen(true)}>↑ Bulk Import</button>
              )}            
            {canCreate('employees') && (
              <button className="btn btn-pri btn-sm" onClick={() => router.push('/employees/new')}>
                + Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="g4 mb14">
          <StatCard label="Total Employees" value={summary?.total ?? '…'} color="var(--blue)" />
          <StatCard label="Active"           value={summary?.active ?? '…'}  color="var(--green)" />
          <StatCard label="Left / Alumni"    value={summary?.left ?? '…'}    color="var(--red)" />
          <StatCard label="Retired"          value={summary?.retired ?? '…'} color="var(--ink4)" />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={data?.rows ?? []}
          isLoading={isLoading}
          rowKey={row => row.id}
          toolbar={toolbar}
          page={page}
          totalPages={data?.meta?.totalPages}
          total={data?.meta?.total}
          limit={20}
          onPageChange={setPage}
          onRowClick={row => router.push(`/employees/${row.id}`)}
          emptyText="No employees found. Add your first employee to get started."
        />
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Employee"
        subtitle={`Remove ${deleteTarget?.first_name} ${deleteTarget?.last_name} (${deleteTarget?.employee_code})?`}
        footer={
          <>
            <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Removing…' : 'Yes, Remove'}
            </button>
          </>
        }
      >
        <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
          ⚠ Soft delete — record is preserved in audit logs and can be restored by an Admin.
          Portal access will be revoked immediately.
        </div>
      </Modal>

      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </AppShell>
  );
}