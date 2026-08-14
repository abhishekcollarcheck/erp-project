'use client';
/**
 * /employees/[id]/edit — Edit Employee Page
 */
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../../../store';
import { setPageTitle } from '../../../../../store/slices/uiSlice';
import { AppShell } from '../../../../../layouts/AppLayout';
import { EmployeeWizard } from '../../../../../features/employees/components/EmployeeWizard';
import { useEmployee } from '../../../../../features/employees/hooks/useEmployees';
import { usePermission } from '../../../../../features/auth/hooks/usePermission';
import type { Employee } from '../../../../../features/employees/types/employee.types';
import { PermissionGuard } from '../../../../../utils/permissionGuard';

export default function EditEmployeePage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { canEdit } = usePermission();

  const { data: employee, isLoading, isError } = useEmployee(Number(params.id));

  useEffect(() => {
    if (employee) {
      dispatch(setPageTitle({
        title: `Edit — ${employee.first_name} ${employee.last_name}`,
        breadcrumb: 'Employee Directory',
      }));
    }
  }, [employee, dispatch]);

  if (!canEdit('employees')) {
    return (
      <AppShell>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Access Denied</h2>
          <p style={{ color: 'var(--ink4)', marginBottom: 20 }}>You don't have permission to edit employees.</p>
          <button className="btn btn-sec" onClick={() => router.back()}>← Go Back</button>
        </div>
      </AppShell>
    );
  }

  if (isLoading) return (
    <AppShell>
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink4)' }}>Loading employee data…</div>
    </AppShell>
  );

  if (isError || !employee) return (
    <AppShell>
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--red)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p>Employee not found.</p>
        <button className="btn btn-sec" style={{ marginTop: 16 }} onClick={() => router.push('/employees')}>← Back to Directory</button>
      </div>
    </AppShell>
  );

  return (
    <PermissionGuard permission="employees:view">
    <AppShell>
      <div className="pg-enter">
        <div className="ph">
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 4, cursor: 'pointer' }}
              onClick={() => router.push(`/employees/${params.id}`)}>← {employee.first_name} {employee.last_name}</div>
            <h1>Edit Employee</h1>
            <p>Update profile — {employee.employee_code} · Changes save per step</p>
          </div>
        </div>

        <EmployeeWizard
          mode="edit"
          employee={employee as Employee}
          onSuccess={() => router.push(`/employees/${params.id}`)}
        />
      </div>
    </AppShell>
    </PermissionGuard>
  );
}