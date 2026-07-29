'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch }       from '../../../../store';
import { setPageTitle }         from '../../../../store/slices/uiSlice';
import { AppShell }             from '../../../../layouts/AppLayout';
import { Chip }                 from '../../../../components/ui/Chip';
import { Modal }                from '../../../../components/ui/Modal';
import { SubDesignationFormModal } from '../../../../features/sub-designations/components/SubDesignationFormModal';
import {
  useSubDesignation, useDeleteSubDesignation, useToggleSubDesignation,
} from '../../../../features/sub-designations/hooks/useSubDesignations';
import { usePermission }        from '../../../../features/auth/hooks/usePermission';
import { getInitials }          from '../../../../utils/formatters';

export default function SubDesignationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = parseInt(params.id as string, 10);
  const { canManageEmployees } = usePermission();

  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: subDesignation, isLoading, isError } = useSubDesignation(id);
  const deleteMutation = useDeleteSubDesignation();
  const toggleMutation = useToggleSubDesignation();

  useEffect(() => {
    if (subDesignation) dispatch(setPageTitle({ title: subDesignation.name, breadcrumb: 'Sub-Designations' }));
  }, [subDesignation, dispatch]);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/sub-designations');
  };

  if (isLoading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink4)', fontSize: 13 }}>
          Loading sub-designation…
        </div>
      </AppShell>
    );
  }

  if (isError || !subDesignation) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>Sub-Designation not found</div>
          <button className="btn btn-sec btn-sm" onClick={() => router.push('/sub-designations')}>
            ← Back to Sub-Designations
          </button>
        </div>
      </AppShell>
    );
  }

  const employeeCount = subDesignation.employees?.length ?? 0;

  return (
    <AppShell>
      <div className="pg-enter">

        {/* Header */}
        <div className="ph">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 13,
              background: subDesignation.is_active
                ? 'linear-gradient(135deg, var(--blue), var(--purple))'
                : 'var(--surface3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: subDesignation.is_active ? '#fff' : 'var(--ink4)',
              fontSize: 20, fontWeight: 700, flexShrink: 0,
            }}>
              🎯
            </div>
            <div>
              <h1 style={{ marginBottom: 6 }}>{subDesignation.name}</h1>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip variant={subDesignation.is_active ? 'green' : 'gray'}>
                  {subDesignation.is_active ? 'Active' : 'Inactive'}
                </Chip>
              </div>
            </div>
          </div>

          <div className="ph-r">
            <button className="btn btn-sec btn-sm" onClick={() => router.push('/sub-designations')}>← Back</button>
            {canManageEmployees && (
              <>
                <button
                  className="btn btn-sec btn-sm"
                  onClick={() => toggleMutation.mutate(id)}
                  disabled={toggleMutation.isPending}
                >
                  {subDesignation.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn btn-sec btn-sm" onClick={() => setEditOpen(true)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>Delete</button>
              </>
            )}
          </div>
        </div>

        <div className="g2">
          {/* Left column — details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Overview */}
            <div className="card cp">
              <div className="ct">Sub-Designation Details</div>
              {[
                { label: 'Name',           value: subDesignation.name },
                { label: 'Status',         value: <Chip variant={subDesignation.is_active ? 'green' : 'gray'}>{subDesignation.is_active ? 'Active' : 'Inactive'}</Chip> },
                { label: 'Active Employees', value: <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: employeeCount > 0 ? 'var(--blue)' : 'var(--ink4)', fontSize: 14 }}>{employeeCount}</span> },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink4)', fontWeight: 500 }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            {canManageEmployees && (
              <div className="card cp">
                <div className="ct">Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-sec" style={{ justifyContent: 'flex-start' }} onClick={() => setEditOpen(true)}>
                    ✏️ Edit sub-designation
                  </button>
                  <button
                    className="btn btn-sec"
                    style={{ justifyContent: 'flex-start', color: subDesignation.is_active ? 'var(--amber)' : 'var(--green)', borderColor: subDesignation.is_active ? 'var(--amber-bd)' : 'var(--green-bd)' }}
                    onClick={() => toggleMutation.mutate(id)}
                    disabled={toggleMutation.isPending}
                  >
                    {subDesignation.is_active ? '⏸ Deactivate sub-designation' : '▶ Activate sub-designation'}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => setDeleteOpen(true)}
                    disabled={employeeCount > 0}
                    title={employeeCount > 0 ? `Cannot delete — ${employeeCount} employees are assigned` : ''}
                  >
                    🗑 Delete sub-designation
                    {employeeCount > 0 && <span style={{ marginLeft: 6, fontSize: 10, opacity: .7 }}>(reassign employees first)</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right column — employees */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Employees with this sub-designation
                <span style={{ fontSize: 11, color: 'var(--ink4)', fontWeight: 400, marginLeft: 6 }}>
                  {employeeCount} active
                </span>
              </div>
              <button
                className="btn btn-sec btn-sm"
                onClick={() => router.push(`/employees?sub_designation_id=${id}`)}
              >
                View all →
              </button>
            </div>

            {employeeCount > 0 ? (
              subDesignation.employees!.map((emp) => (
                <div
                  key={emp.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .1s' }}
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(`${emp.first_name} ${emp.last_name}`)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{emp.employee_code}</div>
                  </div>
                  <Chip variant={emp.status === 'Active' ? 'green' : 'amber'}>{emp.status}</Chip>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink4)' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>👥</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No employees yet</div>
                <div style={{ fontSize: 12 }}>Employees will appear here when assigned this sub-designation</div>
                <button
                  className="btn btn-sec btn-sm"
                  style={{ marginTop: 14 }}
                  onClick={() => router.push('/employees')}
                >
                  Go to Employees →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <SubDesignationFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        subDesignation={subDesignation}
      />

      {/* Delete confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Sub-Designation"
        subtitle={`Delete "${subDesignation.name}"? This cannot be undone.`}
        footer={
          <>
            <button className="btn btn-sec" onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending || employeeCount > 0}>
              {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
          {employeeCount > 0
            ? `⚠ Cannot delete — ${employeeCount} employee(s) currently hold this sub-designation. Reassign them first.`
            : '⚠ This action permanently removes the sub-designation from the system.'}
        </div>
      </Modal>
    </AppShell>
  );
}