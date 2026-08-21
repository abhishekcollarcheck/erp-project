'use client';
/**
 * /leaves/new — Apply for Leave
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { ApplyLeaveForm } from '../../../../features/leaves/components/ApplyLeaveForm';

export default function NewLeavePage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Apply Leave', breadcrumb: 'Leave Management' }));
  }, [dispatch]);

  return (
    <AppShell>
      <div className="pg-enter">
        <div className="ph">
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 4, cursor: 'pointer' }}
              onClick={() => router.push('/leaves')}>← Leave Management</div>
            <h1>Apply for Leave</h1>
          </div>
        </div>
        <ApplyLeaveForm onSuccess={() => router.push('/leaves')} />
      </div>
    </AppShell>
  );
}
