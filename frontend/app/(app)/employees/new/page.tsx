'use client';
/**
 * /employees/new — Create Employee Page
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { EmployeeWizard } from '../../../../features/employees/components/EmployeeWizard';
import { usePermission } from '../../../../features/auth/hooks/usePermission';
import type { Employee } from '../../../../features/employees/types/employee.types';
import { PermissionGuard } from '../../../../utils/permissionGuard';

export default function NewEmployeePage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { canCreate } = usePermission();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Add Employee', breadcrumb: 'Employee Directory' }));
  }, [dispatch]);

  // Guard — redirect if no permission
  if (!canCreate('employees')) {
    return (
      <PermissionGuard permission="employees:view">
      <AppShell>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Access Denied</h2>
          <p style={{ color: 'var(--ink4)', marginBottom: 20 }}>You don't have permission to create employees.</p>
          <button className="btn btn-sec" onClick={() => router.back()}>← Go Back</button>
        </div>
      </AppShell>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="employees:view">
    <AppShell>
      <div className="pg-enter">
        <div className="ph">
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 4, cursor: 'pointer' }}
              onClick={() => router.push('/employees')}>← Employee Directory</div>
            <h1>Add New Employee</h1>
            <p>Complete the UNG Master Data Form — fields auto-save as you go</p>
          </div>
        </div>

        <EmployeeWizard
          mode="create"
          onSuccess={(emp: Employee) => {
            router.push(`/employees/${emp.id}`);
          }}
        />
      </div>
    </AppShell>
    </PermissionGuard>
  );
}