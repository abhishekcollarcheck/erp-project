'use client';
/**
 * /employees/[id] — Employee View / Details (tabbed)
 */
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { EmployeeDetailView } from '../../../../features/employees/components/EmployeeDetailView';
import { useEmployee } from '../../../../features/employees/hooks/useEmployees';
import { PermissionGuard } from '../../../../utils/permissionGuard';

export default function EmployeeViewPage() {
  const params   = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const id = Number(params.id);

  const { data: employee } = useEmployee(id);

  useEffect(() => {
    if (employee) {
      dispatch(setPageTitle({
        title: `${employee.first_name} ${employee.last_name}`,
        breadcrumb: 'Employee Directory',
      }));
    }
  }, [employee, dispatch]);

  return (
    <PermissionGuard permission="employees:view">
      <AppShell>
        <EmployeeDetailView id={id} />
      </AppShell>
    </PermissionGuard>
  );
}
