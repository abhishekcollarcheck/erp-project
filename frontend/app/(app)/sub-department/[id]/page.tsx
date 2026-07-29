'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Chip } from '../../../../components/ui/Chip';
import { Modal } from '../../../../components/ui/Modal';
import { SubDepartmentFormModal } from '../../../../features/sub-departments/components/SubDepartmentFormModal';
import { useSubDepartment, useDeleteSubDepartment } from '../../../../features/sub-departments/hooks/useSubDepartments';
import { useSubDepartments } from '../../../../features/sub-departments/hooks/useSubDepartments';
import { useDepartments } from '../../../../features/departments/hooks/useDepartments';
import { useEmployees } from '../../../../features/employees/hooks/useEmployees';
import { usePermission } from '../../../../features/auth/hooks/useAuth';
import { formatDate, getInitials } from '../../../../utils/formatters';
import { PermissionGuard } from '@/utils/permissionGuard';

export default function SubDepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = parseInt(params.id as string, 10);
  const { canEdit, canDelete } = usePermission();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: subDept, isLoading, isError } = useSubDepartment(id);
  const { data: subDepartments = [] } = useSubDepartments();
  const { data: departments = [] } = useDepartments();
  const { data: empData } = useEmployees({ limit: 100 });
  const deleteMutation = useDeleteSubDepartment();

  const employees = empData?.data ?? [];
  const sdOpts = subDepartments.map((sd) => ({ value: sd.id, label: sd.name }));
  const managerOpts = employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }));

  useEffect(() => {
    if (subDept) dispatch(setPageTitle({ title: subDept.name, breadcrumb: 'Sub-Departments' }));
  }, [subDept, dispatch]);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/sub-department');
  };

  if (isLoading) {
    return (
      <PermissionGuard permission='sub-department:view'>
        <AppShell>
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink4)', fontSize: 13 }}>Loading sub-department…</div>
        </AppShell>
      </PermissionGuard>
    );
  }

  if (isError || !subDept) {
    return (
      <PermissionGuard permission='sub-department:view'>
        <AppShell>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>Sub-department not found</div>
            <button className="btn btn-sec btn-sm" onClick={() => router.push('/sub-department')}>← Back to Sub-Departments</button>
          </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission='sub-department:view'>
      <AppShell>
        <div className="pg-enter">

          {/* Page header */}
          <div className="ph">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <h1 style={{ marginBottom: 4 }}>{subDept.name}</h1>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* {subDept.code && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}>{subDept.code}</span>
                  )} */}
                  <Chip variant={subDept.is_active ? 'green' : 'gray'}>{subDept.is_active ? 'Active' : 'Inactive'}</Chip>
                  {/* {subDept.department && (
                    <span style={{ fontSize: 11, color: 'var(--ink4)' }}>
                      Part of <strong style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => router.push(`/departments/${subDept.department!.id}`)}>{subDept.department.name}</strong>
                    </span>
                  )} */}
                </div>
              </div>
            </div>
            <div className="ph-r">
              <button className="btn btn-sec btn-sm" onClick={() => router.push('/sub-department')}>← Back</button>
              <>
                {canEdit('sub-department') && (
                  <button className="btn btn-sec btn-sm" onClick={() => setEditOpen(true)}>Edit</button>
                )}
                {canDelete('sub-department') && (
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>Delete</button>
                )}
              </>
            </div>
          </div>

          <div className="g2">
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Overview card */}
              <div className="card cp">
                <div className="ct">Overview</div>
                {[
                  { label: 'Sub-Department Name', value: subDept.name },
                  { label: 'Status', value: <Chip variant={subDept.is_active ? 'green' : 'gray'}>{subDept.is_active ? 'Active' : 'Inactive'}</Chip> },
                  // { label: 'Employees', value: String(subDept.employee_count ?? subDept.employees?.length ?? 0) },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--ink4)', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Manager */}
              {/* <div className="card cp">
                <div className="ct">Manager</div>
                {subDept.head ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(`${subDept.head.first_name} ${subDept.head.last_name}`)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {subDept.head.first_name} {subDept.head.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Sub-Department Manager</div>
                    </div>
                    <button
                      className="btn btn-sec btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => router.push(`/employees/${subDept.head!.id}`)}
                    >
                      View Profile
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink4)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>👤</div>
                    <div style={{ fontSize: 12 }}>No manager assigned yet</div>
                    {canEdit('sub-department') && (
                      <button className="btn btn-sec btn-sm" style={{ marginTop: 12 }} onClick={() => setEditOpen(true)}>
                        Assign Manager
                      </button>
                    )}
                  </div>
                )}
              </div> */}

              {/* Parent Department */}
              {/* {subDept.department && (
                <div className="card cp">
                  <div className="ct">Parent Department</div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}
                    onClick={() => router.push(`/departments/${subDept.department!.id}`)}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                      {(subDept.department.code?.[0] || subDept.department.name[0]).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', flex: 1 }}>{subDept.department.name}</span>
                    {subDept.department.code && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink4)' }}>{subDept.department.code}</span>}
                    <span style={{ color: 'var(--ink4)', fontSize: 12 }}>→</span>
                  </div>
                </div>
              )} */}
            </div>

            {/* Right column — employees */}
            {/* <div className="card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Team Members
                  <span style={{ fontSize: 11, color: 'var(--ink4)', fontWeight: 400, marginLeft: 6 }}>
                    {subDept.employees?.length ?? 0} active
                  </span>
                </div>
                <button className="btn btn-sec btn-sm" onClick={() => router.push(`/employees?sub_department_id=${id}`)}>
                  View all →
                </button>
              </div>
              {subDept.employees && subDept.employees.length > 0 ? (
                subDept.employees.map((emp) => (
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
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink4)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                  <div style={{ fontSize: 12 }}>No active employees in this sub-department</div>
                </div>
              )}
            </div> */}
          </div>
        </div>

        {/* Edit modal */}
        <SubDepartmentFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          subDepartment={subDept}
          departments={subDepartments.map((sd) => ({ value: sd.id, label: sd.name }))}
          managers={managerOpts}
        />

        {/* Delete confirmation */}
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Sub-Department"
          subtitle={`Delete "${subDept.name}"? This cannot be undone.`}
          footer={
            <>
              <button className="btn btn-sec" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </>
          }
        >
          <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
            ⚠ Active employees block deletion. Reassign them first.
          </div>
        </Modal>
      </AppShell>
    </PermissionGuard>
  );
}