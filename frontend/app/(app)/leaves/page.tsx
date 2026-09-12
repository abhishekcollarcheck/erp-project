'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip, statusToVariant } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
import { DataTable } from '../../../components/ui/DataTable';
import { Select as UISelect } from '../../../components/ui/Select';
import { usePermission } from '../../../features/auth/hooks/usePermission';
// import { ApplyLeaveModal } from '../../../features/leaves/components/ApplyLeaveModal';
import {
  usePendingLeaves,
  useApproveLeave,
  useRejectLeave,
  useCancelLeave,
  useMyLeaves,
  useLeaves,
  useLeaveBalances,
  useCompanyLeaveBalances,
  useLeaveTypes,
  useUpdateLeaveType,
  useLeavePolicy,
  useUpdateLeavePolicy,
  useLeaveCredits,
  useCreditSpecialLeave,
  useHolidayList,
  useCreateHoliday,
  useDeleteHoliday,
  useMyManagedEmployees,
} from '../../../features/leaves/hooks/useLeaves';
import type { Holiday, LeaveRequest } from '../../../services/api/leave.service';
import { ApplyLeaveModal } from '@/features/leaves/components/ApplyLeaveModal';

// ============================================================================
// ASSUMPTIONS THAT NEED VERIFYING AGAINST YOUR ACTUAL PROJECT
// ----------------------------------------------------------------------------
// 1. Sandwich days / per-day breakdown: the backend's `apply()`/`edit()`
//    currently trust whatever `days` the client computes and sends — nothing
//    server-side computes sandwich days or writes LeaveRequestDay rows yet.
//    The "Charge preview" in the Apply/Edit modal is therefore a plain
//    calendar-day count, not a sandwich/holiday-aware calculation.
// 2. Editing/applying on behalf of another employee is out of scope for the
//    new modal — it's self-service only (see ApplyLeaveModal.tsx for why).
// 3. "Triggers" tab: left out — nothing in any file shared so far defines
//    what it should show.
// ============================================================================

const LEAVE_TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'amber'> = {
  CL: 'blue', SHORT: 'purple', EL: 'green', SPECIAL: 'amber', HALF: 'amber',
};

function formatDateRange(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const f = new Date(from + 'T00:00:00').toLocaleDateString('en-IN', opts);
  if (from === to) return f;
  const t = new Date(to + 'T00:00:00').toLocaleDateString('en-IN', opts);
  return `${f} – ${t}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

// ============================================================================
// Self-contained form primitives — NOT dependent on "form-field" / "field-label" /
// "form-input" / "form-select" classes.
// ============================================================================

const inputBaseStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 11px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--ink)',
  background: 'var(--surface)',
  outline: 'none',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>{label}</label>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ink4)', lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBaseStyle, ...props.style }} />;
}

// Backed by the shared PrimeReact <Select>. Keeps the native-select call
// signature (value + onChange({target:{value}}) + <option> children) so the
// existing call sites don't change.
function Select({ value, onChange, style, disabled, children }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const options = React.Children.toArray(children)
    .filter((c: any) => c && c.type === 'option')
    .map((c: any) => ({
      value: c.props.value ?? '',
      label: Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children ?? ''),
    }));
  return (
    <UISelect
      value={(value as any) ?? ''}
      onChange={(v) => onChange?.({ target: { value: v } } as any)}
      options={options}
      disabled={disabled}
      style={style as any}
    />
  );
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--ink2)',
        padding: '9px 10px', borderRadius: 8, background: 'var(--surface2)', cursor: 'pointer',
      }}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, flexShrink: 0 }} />
      {label}
    </label>
  );
}

const TABS = ['Overview', 'All Requests', 'Balances', 'Holidays & Special', 'Policy'] as const;
type Tab = typeof TABS[number];

type ApplyModalState = { mode: 'create' } | { mode: 'edit'; leave: LeaveRequest } | null;

export default function LeavesPage() {
  const dispatch = useAppDispatch();
  const { canApprove, user } = usePermission();
  // const hasApprovePermission = canApprove('leaves');
  const hasApprovePermission = true;
  const employeeId: number | undefined =
    (user as any)?.employeeId ?? (user as any)?.employee_id ?? (user as any)?.id;

  const [tab, setTab] = useState<Tab>('Overview');
  const [applyModal, setApplyModal] = useState<ApplyModalState>(null);
  const openApplyModal = () => setApplyModal({ mode: 'create' });
  const openEditModal = (leave: LeaveRequest) => setApplyModal({ mode: 'edit', leave });
  const closeApplyModal = () => setApplyModal(null);

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Leave Management', breadcrumb: 'Operations' }));
  }, [dispatch]);

  const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaves(hasApprovePermission);
  const { data: myLeaves } = useMyLeaves(employeeId);
  const { data: myBalances } = useLeaveBalances(employeeId);
  const { data: leaveTypes } = useLeaveTypes();
  const { data: policy } = useLeavePolicy(hasApprovePermission);
  const { data: holidaysData, isLoading: holidaysLoading } = useHolidayList();
  const holidays = holidaysData ?? [];
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const cancelLeave = useCancelLeave();

  const {
    data: managedEmployees = [],
    isLoading: managedEmployeesLoading,
    error: managedEmployeesError,
  } = useMyManagedEmployees(hasApprovePermission);

  const pendingCount = pendingLeaves?.length ?? 0;
  const todayIso = new Date().toISOString().slice(0, 10);

  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const closeRejectModal = () => { setRejectTargetId(null); setRejectReason(''); };
  const confirmReject = () => {
    if (!rejectTargetId || !rejectReason.trim()) return;
    rejectLeave.mutate({ id: rejectTargetId, reason: rejectReason.trim() }, { onSuccess: closeRejectModal });
  };

  const subtitleParts = [
    'EL', 'CL', 'Short (1h)', 'Special', 'Half day',
    `Sandwich ${policy?.sandwich_enabled ? 'on' : 'off'}`,
    `${pendingCount} pending`,
  ];

  return (
    <AppShell>
      <div className="pg-enter">
        <div className="ph" style={{ alignItems: 'flex-end', justifyContent: 'space-between', display: 'flex' }}>
          <div>
            <h1 style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Leave Management</h1>
            <p style={{ color: 'var(--ink4)', fontSize: 12.5 }}>{subtitleParts.join(' · ')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sec btn-sm" onClick={() => setTab('Policy')}>Policy</button>
            {/* CHANGED — used to router.push('/leaves/new'); now opens an
                in-page modal instead. */}
            <button className="btn btn-pri btn-sm" onClick={openApplyModal}>+ Apply Leave</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, margin: '12px 0 14px', background: 'var(--surface2)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {TABS.map((t) => (
            <button
              key={t}
              className="btn btn-sm"
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--ink)' : 'var(--ink4)',
                boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                fontWeight: tab === t ? 600 : 500,
                border: 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <OverviewTab
            hasApprovePermission={hasApprovePermission}
            pendingLeaves={pendingLeaves}
            pendingLoading={pendingLoading}
            pendingCount={pendingCount}
            myLeaves={myLeaves}
            myBalances={myBalances}
            holidays={holidays}
            todayIso={todayIso}
            approveLeave={approveLeave}
            cancelLeave={cancelLeave}
            setRejectTargetId={setRejectTargetId}
            rejectTargetId={rejectTargetId}
            onEditRequest={openEditModal}
          />
        )}

        {tab === 'All Requests' && (
          <AllRequestsTab
            canApprove={hasApprovePermission}
            employeeId={employeeId}
            approveLeave={approveLeave}
            cancelLeave={cancelLeave}
            setRejectTargetId={setRejectTargetId}
            onEditRequest={openEditModal}
          />
        )}

        {tab === 'Balances' && (
          <BalancesTab hasApprovePermission={hasApprovePermission} myBalances={myBalances} />
        )}

        {tab === 'Holidays & Special' && (
          <HolidaysSpecialTab
            canManage={hasApprovePermission}
            holidays={holidays}
            holidaysLoading={holidaysLoading}
            managedEmployees={managedEmployees}
            managedEmployeesLoading={managedEmployeesLoading}
            managedEmployeesError={managedEmployeesError}
          />
        )}

        {tab === 'Policy' && <PolicyTab canManage={hasApprovePermission} leaveTypes={leaveTypes} policy={policy} />}
      </div>

      <Modal
        open={rejectTargetId !== null}
        onClose={closeRejectModal}
        title="Reject Leave Request"
        subtitle="This reason will be shared with the employee."
        footer={
          <>
            <button className="btn btn-sec" onClick={closeRejectModal} disabled={rejectLeave.isPending}>Cancel</button>
            <button className="btn btn-pri" onClick={confirmReject} disabled={rejectLeave.isPending || !rejectReason.trim()}>
              {rejectLeave.isPending ? 'Rejecting…' : 'OK'}
            </button>
          </>
        }
      >
        <Field label="Reason for Rejection">
          <textarea
            rows={3}
            autoFocus
            placeholder="Explain why this leave request is being rejected…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ ...inputBaseStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>
      </Modal>

      {/* NEW — Apply / Edit modal, in-page (no navigation to /leaves/new) */}
      <ApplyLeaveModal
        open={applyModal !== null}
        onClose={closeApplyModal}
        employeeId={employeeId}
        mode={applyModal?.mode ?? 'create'}
        editingLeave={applyModal?.mode === 'edit' ? applyModal.leave : null}
      />
    </AppShell>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function OverviewTab({
  hasApprovePermission, pendingLeaves, pendingLoading, pendingCount, myLeaves, myBalances,
  holidays, todayIso, approveLeave, cancelLeave, setRejectTargetId, rejectTargetId, onEditRequest,
}: any) {
  const { data: companyBalances } = useCompanyLeaveBalances(undefined, hasApprovePermission);
  const { data: approvedToday } = useLeaves(
    hasApprovePermission ? { status: 'Approved', limit: 200 } : undefined,
  );

  const onLeaveToday = useMemo(() => {
    if (!hasApprovePermission || !approvedToday) return 0;
    return approvedToday.filter((r: any) => r.from_date <= todayIso && r.to_date >= todayIso).length;
  }, [approvedToday, todayIso, hasApprovePermission]);

  const avgEl = useMemo(() => {
    if (hasApprovePermission && companyBalances?.length) {
      return (companyBalances.reduce((s: number, b: any) => s + Number(b.EL || 0), 0) / companyBalances.length).toFixed(1);
    }
    const own = (myBalances ?? []).find((b: any) => b.code === 'EL');
    return own ? Number(own.available).toFixed(1) : '—';
  }, [companyBalances, myBalances, hasApprovePermission]);

  const holidaysRemaining = useMemo(
    () => holidays.filter((h: Holiday) => h.date >= todayIso).length,
    [holidays, todayIso],
  );

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const holidayDates = new Set(holidays.map((h: Holiday) => h.date));
  const leaveDates = new Set(
    (myLeaves ?? [])
      .filter((l: any) => l.status !== 'Cancelled')
      .flatMap((l: any) => {
        const out: string[] = [];
        let d = new Date(l.from_date + 'T00:00:00');
        const end = new Date(l.to_date + 'T00:00:00');
        while (d <= end) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
        return out;
      }),
  );
  const goPrev = () => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); };
  const goNext = () => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); };

  return (
    <>
      <div className="g4 mb14">
        <StatCard label="Pending Approvals" value={pendingCount} color="var(--amber)" />
        <StatCard label="On Leave Today" value={onLeaveToday} color="var(--green)" />
        <StatCard label="Avg EL Balance" value={`${avgEl}d`} color="var(--blue)" />
        <StatCard label="Holidays Remaining" value={holidaysRemaining} color="var(--pink)" />
      </div>

      <div className="g2">
        <div className="card">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
            Pending Approvals
            <span style={{ fontWeight: 400, color: 'var(--ink4)', marginLeft: 6 }}>— requests from your direct reports (as L1 or L2 manager)</span>
          </div>
          {!hasApprovePermission ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>You don't have permission to approve leave requests.</div>
          ) : pendingLoading ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
          ) : pendingCount === 0 ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
          ) : (
            <DataTable
              bare
              minWidth="640px"
              data={pendingLeaves}
              rowKey={(req: any) => req.id}
              columns={[
                { key: 'employee', header: 'Employee', render: (req: any) => <strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong> },
                { key: 'type', header: 'Type', render: (req: any) => <Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip> },
                { key: 'dates', header: 'Dates', render: (req: any) => <span style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</span> },
                { key: 'days', header: 'Days', render: (req: any) => <span style={{ color: 'var(--ink3)' }}>{req.days}</span> },
                { key: 'reason', header: 'Reason', render: (req: any) => <span style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</span> },
                {
                  key: 'actions', header: '', align: 'right',
                  render: (req: any) => {
                    const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
                    const rowBusy = approvingThis || rejectTargetId === req.id;
                    return (
                      <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.55 : 1, justifyContent: 'flex-end' }}>
                        <Chip variant="green" onClick={() => { if (!rowBusy) approveLeave.mutate(req.id); }}>{approvingThis ? '…' : 'Approve'}</Chip>
                        <Chip variant="red" onClick={() => { if (!rowBusy) setRejectTargetId(req.id); }}>Reject</Chip>
                      </div>
                    );
                  },
                },
              ]}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>Balances</span>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 11.5, color: 'var(--blue)' }}>View all</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {(myBalances ?? []).map((b: any) => (
                <div key={b.leave_type_id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.02em' }}>{b.code}</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{b.available}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card cp">
            <div className="ct" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-sec btn-sm" onClick={goPrev} aria-label="Previous month">‹</button>
              <span style={{ fontWeight: 500, fontSize: 12.5 }}>{monthLabel}</span>
              <button type="button" className="btn btn-sec btn-sm" onClick={goNext} aria-label="Next month">›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginTop: 9, marginBottom: 6 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink4)', padding: 3 }}>{d}</div>
              ))}
              {[
                ...Array(firstWeekday).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ].map((day, i) => {
                if (day === null) return <div key={i} />;
                const iso = `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`;
                const isToday = iso === todayIso;
                const isHoliday = holidayDates.has(iso);
                const isLeave = leaveDates.has(iso);
                const bg = isLeave ? 'var(--green-lt)' : isHoliday ? 'var(--purple-lt)' : 'transparent';
                return (
                  <div key={i} style={{
                    textAlign: 'center', fontSize: 11, fontWeight: isToday ? 600 : 400,
                    padding: '6px 0', borderRadius: 6, background: bg,
                    boxShadow: isToday ? 'inset 0 0 0 1.5px var(--blue)' : undefined,
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5, flexWrap: 'wrap' }}>
              <LegendDot color="var(--green-lt)" label="Leave" />
              <LegendDot color="var(--purple-lt)" label="Holiday" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, boxShadow: 'inset 0 0 0 1.5px var(--blue)' }} />
                <span style={{ color: 'var(--ink4)' }}>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW — the employee's own requests, clearly separate from the
          approvals list above: nothing here can be approved/rejected by the
          viewer, only edited (if still Pending) or cancelled. */}
      <MyLeaveRequestsCard myLeaves={myLeaves} cancelLeave={cancelLeave} onEditRequest={onEditRequest} />
    </>
  );
}

function MyLeaveRequestsCard({ myLeaves, cancelLeave, onEditRequest }: any) {
  const sorted = useMemo(
    () => [...(myLeaves ?? [])].sort((a: any, b: any) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [myLeaves],
  );

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
        My Leave Requests
        <span style={{ fontWeight: 400, color: 'var(--ink4)', marginLeft: 6 }}>— your own submissions; edit is available while Pending</span>
      </div>
      {!sorted.length ? (
        <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>You haven't applied for any leave yet.</div>
      ) : (
        <div className="tw">
          <table>
            <thead>
              <tr>
                {['Type', 'Dates', 'Days', 'Reason', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((req: any) => {
                const cancellingThis = cancelLeave.isPending && cancelLeave.variables === req.id;
                return (
                  <tr key={req.id} style={{ opacity: cancellingThis ? 0.55 : 1 }}>
                    <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
                    <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
                    <td style={{ color: 'var(--ink3)' }}>{req.leaveType?.unit === 'minutes' ? `${req.minutes} min` : req.days}</td>
                    <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
                    <td><Chip variant={statusToVariant(req.status)}>{req.status}</Chip></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {req.status === 'Pending' && (
                          <a href="#" onClick={(e) => { e.preventDefault(); onEditRequest(req); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>
                            Edit
                          </a>
                        )}
                        {['Pending', 'Approved'].includes(req.status) && (
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (!cancellingThis) cancelLeave.mutate(req.id); }}
                            style={{ fontSize: 11.5, color: 'var(--blue)' }}
                          >
                            {cancellingThis ? '…' : 'Cancel'}
                          </a>
                        )}
                        {!['Pending', 'Approved'].includes(req.status) && <span style={{ color: 'var(--ink4)' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ color: 'var(--ink4)' }}>{label}</span>
    </div>
  );
}

// ============================================================================
// ALL REQUESTS TAB
// ============================================================================
function AllRequestsTab({ canApprove, employeeId, approveLeave, cancelLeave, setRejectTargetId, onEditRequest }: any) {
  const [status, setStatus] = useState<string>('');
  const [typeId, setTypeId] = useState<string>('');
  const { data: leaveTypes } = useLeaveTypes();
  const { data: leaves, isLoading } = useLeaves({
    status: (status || undefined) as any,
    leave_type_id: typeId ? Number(typeId) : undefined,
    limit: 100,
  });

  return (
    <div className="card">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>Leave requests</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 150 }}>
            <option value="">All statuses</option>
            {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value)} style={{ width: 130 }}>
            <option value="">All types</option>
            {(leaveTypes ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.code}</option>)}
          </Select>
        </div>
      </div>
      {isLoading ? (
        <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
      ) : !leaves?.length ? (
        <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No leave requests match.</div>
      ) : (
        <DataTable
          bare
          minWidth="900px"
          data={leaves}
          rowKey={(req: any) => req.id}
          columns={[
            {
              key: 'employee', header: 'Employee',
              render: (req: any) => (
                <>
                  <strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong>
                  <div style={{ fontSize: 10.5, color: 'var(--ink4)' }}>{req.ref_no}</div>
                </>
              ),
            },
            { key: 'type', header: 'Type', render: (req: any) => <Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip> },
            { key: 'dates', header: 'Dates', render: (req: any) => <span style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</span> },
            {
              key: 'days', header: 'Days',
              render: (req: any) => (
                <span style={{ color: 'var(--ink3)' }}>
                  {req.leaveType?.unit === 'minutes' ? `${req.minutes} min` : req.days}
                  {req.sandwich_days > 0 && <span style={{ color: 'var(--amber)', marginLeft: 6, fontSize: 11 }}>sandwich {req.sandwich_days}</span>}
                </span>
              ),
            },
            { key: 'reason', header: 'Reason', render: (req: any) => <span style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</span> },
            { key: 'status', header: 'Status', render: (req: any) => <Chip variant={statusToVariant(req.status)}>{req.status}</Chip> },
            { key: 'applied', header: 'Applied', render: (req: any) => <span style={{ color: 'var(--ink3)' }}>{req.applied_at ? formatDateRange(req.applied_at, req.applied_at) : '—'}</span> },
            {
              key: 'action', header: 'Action',
              render: (req: any) => {
                const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
                const cancellingThis = cancelLeave.isPending && cancelLeave.variables === req.id;
                const isOwn = employeeId && req.employee_id === employeeId;
                return (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong>
                      <div style={{ fontSize: 10.5, color: 'var(--ink4)' }}>{req.ref_no}</div>
                    </td>
                    <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
                    <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
                    <td style={{ color: 'var(--ink3)' }}>
                      {req.leaveType?.unit === 'minutes' ? `${req.minutes} min` : req.days}
                      {req.sandwich_days > 0 && <span style={{ color: 'var(--amber)', marginLeft: 6, fontSize: 11 }}>sandwich {req.sandwich_days}</span>}
                    </td>
                    <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
                    <td><Chip variant={statusToVariant(req.status)}>{req.status}</Chip></td>
                    <td style={{ color: 'var(--ink3)' }}>{req.applied_at ? formatDateRange(req.applied_at, req.applied_at) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {req.status === 'Pending' && canApprove && (
                          <>
                            <a href="#" onClick={(e) => { e.preventDefault(); approveLeave.mutate(req.id); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>{approvingThis ? '…' : 'Approve'}</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setRejectTargetId(req.id); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>Reject</a>
                          </>
                        )}
                        {req.status === 'Pending' && isOwn && (
                          <a href="#" onClick={(e) => { e.preventDefault(); onEditRequest(req); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>Edit</a>
                        )}
                        {['Pending', 'Approved'].includes(req.status) && (
                          <a href="#" onClick={(e) => { e.preventDefault(); if (!cancellingThis) cancelLeave.mutate(req.id); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>
                            {cancellingThis ? '…' : 'Cancel'}
                          </a>
                        )}
                        {!(req.status === 'Pending' || req.status === 'Approved') && <span style={{ color: 'var(--ink4)' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}

// ============================================================================
// BALANCES TAB
// ============================================================================
function BalancesTab({ hasApprovePermission, myBalances }: any) {
  const { data: companyBalances, isLoading } = useCompanyLeaveBalances(undefined, hasApprovePermission);

  if (!hasApprovePermission) {
    return (
      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
          Leave balances
        </div>
        <div style={{ padding: 24, fontSize: 12, color: 'var(--ink3)' }}>
          {(myBalances ?? []).map((b: any) => (
            <div key={b.leave_type_id} style={{ marginBottom: 6 }}>{b.code} — {b.available} of {b.allocated}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
        Leave balances (calendar year)
      </div>
      {isLoading ? (
        <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
      ) : !companyBalances?.length ? (
        <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No employees found.</div>
      ) : (
        <DataTable
          bare
          minWidth="640px"
          data={companyBalances}
          rowKey={(row: any) => row.employee_id}
          columns={[
            {
              key: 'employee', header: 'Employee',
              render: (row: any) => (
                <>
                  <strong style={{ fontWeight: 500 }}>{row.name}</strong>
                  <div style={{ fontSize: 10.5, color: 'var(--ink4)' }}>{row.employee_code}</div>
                </>
              ),
            },
            { key: 'EL', header: 'EL', render: (row: any) => <>{row.EL}</> },
            { key: 'CL', header: 'CL', render: (row: any) => <>{row.CL}</> },
            { key: 'special', header: 'Special', render: (row: any) => <span style={{ color: row.SPECIAL > 0 ? 'var(--blue)' : undefined }}>{row.SPECIAL}</span> },
            { key: 'short', header: 'Short Leave (this month)', render: (row: any) => <>{Math.max(0, row.short_allocated_minutes - row.short_used_minutes)} / {row.short_allocated_minutes} min</> },
          ]}
        />
      )}
    </div>
  );
}

// ============================================================================
// HOLIDAYS & SPECIAL TAB
// ============================================================================
function HolidaysSpecialTab({ canManage, holidays, holidaysLoading, managedEmployees, managedEmployeesLoading, managedEmployeesError, }: any) {
  const [holDate, setHolDate] = useState('');
  const [holName, setHolName] = useState('');
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const [splEmployee, setSplEmployee] = useState<number | ''>('');
  const [splDate, setSplDate] = useState('');
  const [splDays, setSplDays] = useState('1');
  const [splNote, setSplNote] = useState('');
  const { data: leaveTypes } = useLeaveTypes();
  const specialLeaveType = (leaveTypes ?? []).find((t: any) => t.code === 'SPECIAL');
  const creditSpecialLeave = useCreditSpecialLeave();
  const { data: credits } = useLeaveCredits(undefined, canManage);

  const todayIso = new Date().toISOString().slice(0, 10);
  const sortedHolidays = [...holidays].sort((a: Holiday, b: Holiday) => a.date.localeCompare(b.date));

  const submitHoliday = () => {
    if (!holDate || !holName.trim()) return;
    createHoliday.mutate(
      { date: holDate, name: holName.trim() },
      { onSuccess: () => { setHolDate(''); setHolName(''); } },
    );
  };

  const submitCredit = () => {
    if (!splEmployee || !specialLeaveType || !splDate || Number(splDays) <= 0) return;
    creditSpecialLeave.mutate({
      employee_id: Number(splEmployee),
      leave_type_id: specialLeaveType.id,
      credit_date: splDate,
      days: Number(splDays),
      note: splNote || undefined,
    });
  };

  return (
    <div className="g2">
      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
          Company holidays
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 10, padding: 14, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <TextInput type="date" value={holDate} onChange={(e) => setHolDate(e.target.value)} style={{ width: 160, flexShrink: 0 }} disabled={createHoliday.isPending} />
            <TextInput type="text" placeholder="Holiday name" value={holName} onChange={(e) => setHolName(e.target.value)} style={{ flex: 1 }} disabled={createHoliday.isPending} />
            <button
              className="btn btn-pri btn-sm"
              onClick={submitHoliday}
              disabled={createHoliday.isPending || !holDate || !holName.trim()}
              style={{ flexShrink: 0 }}
            >
              {createHoliday.isPending ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
        <DataTable
          bare
          minWidth="440px"
          data={sortedHolidays}
          isLoading={holidaysLoading && !sortedHolidays.length}
          rowKey={(h: Holiday) => h.id}
          emptyText="No holidays configured."
          columns={[
            { key: 'date', header: 'Date', render: (h: Holiday) => <>{formatDateRange(h.date, h.date)}</> },
            { key: 'name', header: 'Name', render: (h: Holiday) => <strong style={{ fontWeight: 500 }}>{h.name}</strong> },
            { key: 'status', header: 'Status', render: (h: Holiday) => <Chip variant={h.date >= todayIso ? 'green' : 'gray'}>{h.date >= todayIso ? 'Upcoming' : 'Past'}</Chip> },
            ...(canManage ? [{
              key: 'action', header: '',
              render: (h: Holiday) => {
                const removingThis = deleteHoliday.isPending && deleteHoliday.variables === h.id;
                return (
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (!removingThis) deleteHoliday.mutate(h.id); }}
                    style={{ fontSize: 11.5, color: 'var(--blue)', pointerEvents: removingThis ? 'none' : 'auto' }}
                  >
                    {removingThis ? 'Removing…' : 'Remove'}
                  </a>
                );
              },
            }] : []),
          ]}
        />
      </div>

      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
          Credit special leave
        </div>
        {canManage ? (
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--ink4)', margin: '0 0 18px', lineHeight: 1.5 }}>
              Employees who work on a holiday earn special leave. Credit days here; they can apply them as Special Leave.
            </p>
            {managedEmployeesError && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '9px 11px',
                  borderRadius: 8,
                  background: 'rgba(220,38,38,.08)',
                  color: 'var(--danger)',
                  fontSize: 11.5,
                }}
              >
                Couldn't load your managed employees. Please try again.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field
                label="Employee"
                hint="Only employees who report to you as L1 or L2 are shown."
              >
                <Select
                  value={splEmployee}
                  onChange={(e) =>
                    setSplEmployee(
                      e.target.value ? Number(e.target.value) : '',
                    )
                  }
                  disabled={managedEmployeesLoading}
                >
                  <option value="">
                    {managedEmployeesLoading
                      ? 'Loading employees…'
                      : managedEmployees.length
                        ? 'Select employee…'
                        : 'No managed employees found'}
                  </option>

                  {managedEmployees.map((employee: any) => (
                    <option key={employee.id} value={employee.id}>
                      {[
                        employee.first_name,
                        employee.middle_name,
                        employee.last_name,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      {' — '}
                      {employee.employee_code}
                      {' · '}
                      {employee.manager_type?.join('/')}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Holiday worked">
                <TextInput type="date" value={splDate} onChange={(e) => setSplDate(e.target.value)} />
              </Field>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Field label="Days earned">
                <TextInput type="number" min={0.5} step={0.5} value={splDays} onChange={(e) => setSplDays(e.target.value)} />
              </Field>
            </div>
            <div style={{ marginBottom: 18 }}>
              <Field label="Note">
                <TextInput type="text" placeholder="e.g. Worked on Republic Day" value={splNote} onChange={(e) => setSplNote(e.target.value)} />
              </Field>
            </div>
            <button
              className="btn btn-pri btn-sm"
              onClick={submitCredit}
              disabled={creditSpecialLeave.isPending || !specialLeaveType}
            >
              {creditSpecialLeave.isPending ? 'Crediting…' : 'Credit special leave'}
            </button>
            {!specialLeaveType && (
              <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 10 }}>
                No leave type with code "SPECIAL" found for this company — create one under the Policy tab first.
              </p>
            )}
          </div>
        ) : (
          <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>You don't have permission to credit special leave.</div>
        )}

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
          Credit history
        </div>
        <DataTable
          bare
          minWidth="480px"
          data={credits ?? []}
          rowKey={(c: any) => c.id}
          emptyText="No special leave credits yet."
          columns={[
            {
              key: 'employee', header: 'Employee',
              render: (c: any) => {
                const emp = managedEmployees.find((e: any) => e.id === c.employee_id);
                return emp
                  ? [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ')
                  : `#${c.employee_id}`;
              },
            },
            { key: 'holiday', header: 'Holiday', render: (c: any) => <>{formatDateRange(c.credit_date, c.credit_date)}{c.holiday_name ? ` · ${c.holiday_name}` : ''}</> },
            { key: 'days', header: 'Days', render: (c: any) => <>{c.days}</> },
            { key: 'note', header: 'Note', render: (c: any) => <span style={{ color: 'var(--ink3)' }}>{c.note || '—'}</span> },
          ]}
        />
      </div>
    </div>
  );
}

// ============================================================================
// POLICY TAB
// ============================================================================
function PolicyTab({ canManage, leaveTypes, policy }: any) {
  const updatePolicy = useUpdateLeavePolicy();
  const updateType = useUpdateLeaveType();

  const [sandwichEnabled, setSandwichEnabled] = useState(policy?.sandwich_enabled ?? true);
  const [includeWO, setIncludeWO] = useState(policy?.sandwich_include_weekly_off ?? true);
  const [includeHol, setIncludeHol] = useState(policy?.sandwich_include_holidays ?? true);

  useEffect(() => {
    if (!policy) return;
    setSandwichEnabled(policy.sandwich_enabled);
    setIncludeWO(policy.sandwich_include_weekly_off);
    setIncludeHol(policy.sandwich_include_holidays);
  }, [policy]);

  if (!canManage) {
    return (
      <div className="card" style={{ padding: 24, fontSize: 12.5, color: 'var(--ink4)' }}>
        You don't have permission to view or edit leave policy.
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: 'var(--blue-lt)', color: 'var(--blue)', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
        Super Admin / HR can set advance notice, backdating limits, quotas, and sandwich rules per leave type.
        Weekly offs come from each employee's assigned Weekly Off master (not a company-wide day list).
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sandwich policy</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <CheckboxRow checked={sandwichEnabled} onChange={setSandwichEnabled} label="Enable sandwich policy globally" />
          <CheckboxRow checked={includeWO} onChange={setIncludeWO} label="Count weekly offs between leave days" />
          <CheckboxRow checked={includeHol} onChange={setIncludeHol} label="Count holidays between leave days" />
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, fontSize: 11.5, color: 'var(--ink4)', marginBottom: 12, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>Weekly offs are per employee</strong>
          Each employee's assigned <strong>Weekly Off</strong> master preset is used for sandwich and chargeable-day
          calculation. Presets like "Sunday + 2nd & 4th Saturday" are evaluated per date.
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 16 }}>
          Example: employee with Sat+Sun off takes leave Fri–Mon → 4 days charged when sandwich is on.
        </p>

        <button
          className="btn btn-pri btn-sm"
          disabled={updatePolicy.isPending}
          onClick={() => updatePolicy.mutate({
            sandwich_enabled: sandwichEnabled,
            sandwich_include_weekly_off: includeWO,
            sandwich_include_holidays: includeHol,
          })}
        >
          {updatePolicy.isPending ? 'Saving…' : 'Save sandwich policy'}
        </button>
      </div>

      {(leaveTypes ?? []).map((type: any) => (
        <LeaveTypePolicyCard key={type.id} type={type} onSave={(patch: any) => updateType.mutate({ id: type.id, data: patch })} saving={updateType.isPending} />
      ))}
    </div>
  );
}

function LeaveTypePolicyCard({ type, onSave, saving }: any) {
  const [enabled, setEnabled] = useState(type.is_active);
  const [minAdvance, setMinAdvance] = useState(type.min_advance_days);
  const [maxBackdate, setMaxBackdate] = useState(type.max_backdate_days);
  const [quota, setQuota] = useState(type.days_per_year);
  const [monthlyQuota, setMonthlyQuota] = useState(type.monthly_quota_minutes);
  const [sandwichApplies, setSandwichApplies] = useState(type.sandwich_applies);

  const isDayType = type.unit === 'day' && !type.is_earned && type.code !== 'HALF';
  const isShort = type.unit === 'minutes';
  const isHalf = type.code === 'HALF';

  return (
    <div className="card" style={{ padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Chip variant={LEAVE_TYPE_VARIANT[type.code] ?? 'blue'}>{type.code}</Chip>
          <strong style={{ fontSize: 14 }}>{type.name}</strong>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 15, height: 15 }} />
          Enabled
        </label>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink4)', margin: '0 0 18px', lineHeight: 1.5 }}>
        {isShort ? '1 hour / month — full 60 min or two 30-min slots.'
          : isHalf ? 'First half or second half. Deducts 0.5 day from the linked leave type.'
            : type.is_earned ? 'Earned by working on holidays. Balance is credited by HR/Admin.'
              : 'Must be applied within the configured advance/backdate window.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, marginBottom: 18 }}>
        <Field label="Min advance days" hint="Leave start must be at least this many days after today">
          <TextInput type="number" min={0} value={minAdvance} onChange={(e) => setMinAdvance(Number(e.target.value))} />
        </Field>
        <Field label="Max backdate days" hint="0 = cannot apply after taking leave">
          <TextInput type="number" min={0} value={maxBackdate} onChange={(e) => setMaxBackdate(Number(e.target.value))} />
        </Field>
        {isDayType && (
          <Field label="Annual quota (days)">
            <TextInput type="number" min={0} step={0.5} value={quota} onChange={(e) => setQuota(Number(e.target.value))} />
          </Field>
        )}
        {isShort && (
          <Field label="Monthly quota (minutes)">
            <TextInput type="number" min={0} value={monthlyQuota} onChange={(e) => setMonthlyQuota(Number(e.target.value))} />
          </Field>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <CheckboxRow checked={sandwichApplies} onChange={setSandwichApplies} label="Sandwich policy applies" />
      </div>

      <button
        className="btn btn-sec btn-sm"
        disabled={saving}
        onClick={() => onSave({
          is_active: enabled,
          min_advance_days: minAdvance,
          max_backdate_days: maxBackdate,
          days_per_year: isDayType ? quota : undefined,
          monthly_quota_minutes: isShort ? monthlyQuota : undefined,
          sandwich_applies: sandwichApplies,
        })}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}