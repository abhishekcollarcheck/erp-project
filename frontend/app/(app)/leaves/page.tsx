// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAppDispatch } from '../../../store';
// import { setPageTitle } from '../../../store/slices/uiSlice';
// import { AppShell } from '../../../layouts/AppLayout';
// import { StatCard } from '../../../components/ui/StatCard';
// import { Chip, statusToVariant } from '../../../components/ui/Chip';
// import { Modal } from '../../../components/ui/Modal';
// import { usePermission } from '../../../features/auth/hooks/usePermission';
// import { usePendingLeaves, useApproveLeave, useRejectLeave, useMyLeaves, useLeaveBalances } from '../../../features/leaves/hooks/useLeaves';
// import { useMyCombinedAttendance } from '../../../features/attendance/hooks/useAttendance';

// const LEAVE_TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'amber'> = {
//   CL: 'blue', ShL: 'purple', EL: 'green',
// };

// const LEAVE_TYPE_COLOR: Record<string, string> = {
//   CL: 'var(--blue)', EL: 'var(--green)', ShL: 'var(--purple)',
// };

// const LEAVE_APPLICATION_TYPE_LABELS: Record<string, string> = {
//   arrival_late: 'Arrival Late',
//   leaving_early: 'Leaving Early',
//   first_half: '1st Half',
//   second_half: '2nd Half',
//   full_day: 'Full Day',
// };

// function formatDateRange(from: string, to: string) {
//   const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
//   const f = new Date(from + 'T00:00:00').toLocaleDateString('en-IN', opts);
//   if (from === to) return f;
//   const t = new Date(to + 'T00:00:00').toLocaleDateString('en-IN', opts);
//   return `${f} – ${t}`;
// }

// type DayKind = 'leave-approved' | 'leave-pending' | 'leave-rejected' | 'holiday' | 'weekly-off' | 'present' | 'absent' | 'none';

// const DAY_STYLE: Record<DayKind, { bg: string; bd: string; fg: string }> = {
//   'leave-approved': { bg: 'var(--blue-lt)',   bd: 'var(--blue)',      fg: 'var(--blue)' },
//   'leave-pending':  { bg: 'var(--amber-lt)',  bd: 'var(--amber-bd)',  fg: 'var(--amber)' },
//   'leave-rejected': { bg: 'var(--pink-lt)',   bd: 'var(--pink-bd)',   fg: 'var(--pink)' },
//   holiday:          { bg: 'var(--purple-lt)', bd: 'var(--purple-bd)', fg: 'var(--purple)' },
//   'weekly-off':     { bg: 'var(--surface2)',  bd: 'var(--border)',   fg: 'var(--ink4)' },
//   present:          { bg: 'var(--green-lt)',  bd: 'var(--green-bd)', fg: 'var(--green)' },
//   absent:           { bg: 'rgba(220,38,38,.08)', bd: 'var(--danger)', fg: 'var(--danger)' },
//   none:             { bg: 'transparent',      bd: 'transparent',     fg: 'var(--ink3)' },
// };

// const CALENDAR_LEGEND: { kind: DayKind; label: string }[] = [
//   { kind: 'present',        label: 'Present' },
//   { kind: 'absent',         label: 'Absent' },
//   { kind: 'leave-approved', label: 'Leave Approved' },
//   { kind: 'leave-pending',  label: 'Leave Pending' },
//   { kind: 'leave-rejected', label: 'Leave Rejected' },
//   { kind: 'holiday',        label: 'Holiday' },
// ];

// const pad2 = (n: number) => String(n).padStart(2, '0');

// export default function LeavesPage() {
//   const dispatch = useAppDispatch();
//   const router   = useRouter();
//   const { canApprove, user } = usePermission();
//   const hasApprovePermission = canApprove('leaves');

//   const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaves(hasApprovePermission);
//   const { data: myLeaves, isLoading: myLeavesLoading } = useMyLeaves(user?.employeeId ?? undefined);
//   const { data: balances } = useLeaveBalances();
//   const approveLeave = useApproveLeave();
//   const rejectLeave   = useRejectLeave();

//   const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
//   const [rejectReason, setRejectReason] = useState('');

//   const closeRejectModal = () => {
//     setRejectTargetId(null);
//     setRejectReason('');
//   };

//   const confirmReject = () => {
//     if (!rejectTargetId || !rejectReason.trim()) return;
//     rejectLeave.mutate(
//       { id: rejectTargetId, reason: rejectReason.trim() },
//       { onSuccess: closeRejectModal },
//     );
//   };

//   useEffect(() => {
//     dispatch(setPageTitle({ title: 'Leave Management', breadcrumb: 'Operations' }));
//   }, [dispatch]);

//   const pendingCount = pendingLeaves?.length ?? 0;

//   // ── Live calendar: my own attendance (Biometric + Trakola, already merged
//   // server-side) overlaid with my leave requests, colored by status ─────────
//   const now = new Date();
//   const [calYear, setCalYear] = useState(now.getFullYear());
//   const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

//   const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
//   const dateFrom = `${calYear}-${pad2(calMonth + 1)}-01`;
//   const dateTo   = `${calYear}-${pad2(calMonth + 1)}-${pad2(daysInMonth)}`;
//   const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
//   const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

//   const { data: attendanceRows } = useMyCombinedAttendance({ date_from: dateFrom, date_to: dateTo });
//   const attendanceByDate = new Map((attendanceRows ?? []).map(r => [r.date, r]));

//   const goPrevMonth = () => {
//     if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
//     else setCalMonth(m => m - 1);
//   };
//   const goNextMonth = () => {
//     if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
//     else setCalMonth(m => m + 1);
//   };

//   function dayKind(iso: string): DayKind {
//     const leave = (myLeaves ?? []).find(
//       l => l.status !== 'Cancelled' && iso >= l.from_date && iso <= l.to_date,
//     );
//     if (leave) {
//       if (leave.status === 'Approved') return 'leave-approved';
//       if (leave.status === 'Pending')  return 'leave-pending';
//       if (leave.status === 'Rejected') return 'leave-rejected';
//     }
//     const att = attendanceByDate.get(iso);
//     if (att?.finalStatus === 'Holiday')     return 'holiday';
//     if (att?.finalStatus === 'Weekly Off')  return 'weekly-off';
//     if (att?.finalStatus === 'Full Day Present' || att?.finalStatus === 'First Half Present' || att?.finalStatus === 'Second Half Present') return 'present';
//     if (att?.finalStatus === 'Full Day Absent') return 'absent';
//     // No shift assigned yet, so the rule engine never set finalStatus — fall
//     // back to the raw punch-merge status so real check-ins still show up.
//     if (!att?.finalStatus && att?.status === 'Present') return 'present';
//     return 'none';
//   }

//   const firstWeekday = new Date(calYear, calMonth, 1).getDay(); // 0 = Sunday
//   const calendarCells: (number | null)[] = [
//     ...Array(firstWeekday).fill(null),
//     ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
//   ];
//   while (calendarCells.length % 7 !== 0) calendarCells.push(null);

//   return (
//     <AppShell>
//       <div className="pg-enter">
//         <div className="ph">
//           <div>
//             <h1>Leave Management</h1>
//             <p>Policy-based · Multi-level approvals · Holiday calendar · {pendingCount} pending</p>
//           </div>
//           <button className="btn btn-pri btn-sm" onClick={() => router.push('/leaves/new')}>+ Apply Leave</button>
//         </div>

//         {/* Stats — leave balance per type, plus pending approvals */}
//         <div className="g4 mb14">
//           <StatCard label="Pending Approvals" value={pendingCount} color="var(--amber)" />
//           {(balances ?? []).map((b) => (
//             <StatCard
//               key={b.leave_type_id}
//               label={`${b.code} (${b.name})`}
//               value={b.remaining}
//               sub={`of ${b.allocated} days`}
//               color={LEAVE_TYPE_COLOR[b.code] ?? 'var(--blue)'}
//             />
//           ))}
//         </div>

//         <div className="g2">
//           {/* Pending Approvals Table */}
//           <div className="card">
//             <div style={{ padding: '13px 17px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
//               Pending Approvals
//             </div>
//             {!hasApprovePermission ? (
//               <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>
//                 You don't have permission to approve leave requests.
//               </div>
//             ) : pendingLoading ? (
//               <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//             ) : pendingCount === 0 ? (
//               <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
//             ) : (
//               <div className="tw">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Employee</th>
//                       <th>Type</th>
//                       <th>Dates</th>
//                       <th>Days</th>
//                       <th>Reason</th>
//                       <th>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {pendingLeaves!.map((req) => {
//                       const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
//                       const rejectingThis = rejectLeave.isPending && rejectLeave.variables?.id === req.id;
//                       const rowBusy = approvingThis || rejectingThis || rejectTargetId === req.id;
//                       return (
//                         <tr key={req.id}>
//                           <td><strong>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong></td>
//                           <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
//                           <td>{formatDateRange(req.from_date, req.to_date)}</td>
//                           <td>{req.days}</td>
//                           <td>{req.reason || '—'}</td>
//                           <td>
//                             <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.6 : 1 }}>
//                               <Chip
//                                 variant="green"
//                                 onClick={() => { if (!rowBusy) approveLeave.mutate(req.id); }}
//                               >
//                                 {approvingThis ? '…' : 'Approve'}
//                               </Chip>
//                               <Chip
//                                 variant="red"
//                                 onClick={() => { if (!rowBusy) setRejectTargetId(req.id); }}
//                               >
//                                 {rejectingThis ? '…' : 'Reject'}
//                               </Chip>
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>

//           {/* Live Calendar — attendance (Biometric + Trakola) + my leaves */}
//           <div className="card cp">
//             <div className="ct" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <button type="button" className="btn btn-sec btn-sm" onClick={goPrevMonth} aria-label="Previous month">‹</button>
//               <span>{monthLabel}</span>
//               <button type="button" className="btn btn-sec btn-sm" onClick={goNextMonth} aria-label="Next month">›</button>
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 9, marginTop: 9 }}>
//               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
//                 <div
//                   key={i}
//                   style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--ink4)', padding: 3 }}
//                 >
//                   {d}
//                 </div>
//               ))}
//               {calendarCells.map((day, i) => {
//                 if (day === null) return <div key={i} />;
//                 const iso = `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`;
//                 const kind = dayKind(iso);
//                 const style = DAY_STYLE[kind];
//                 const isToday = iso === todayIso;

//                 return (
//                   <div
//                     key={i}
//                     title={kind !== 'none' ? kind.replace('-', ' ') : undefined}
//                     style={{
//                       textAlign: 'center', fontSize: 11, fontWeight: isToday ? 700 : 500,
//                       padding: '6px 0', borderRadius: 5,
//                       background: style.bg,
//                       color: style.fg,
//                       border: `1px solid ${style.bd}`,
//                       boxShadow: isToday ? 'inset 0 0 0 2px var(--blue)' : undefined,
//                     }}
//                   >
//                     {day}
//                   </div>
//                 );
//               })}
//             </div>
//             <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap' }}>
//               {CALENDAR_LEGEND.map((item) => (
//                 <div key={item.kind} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                   <div
//                     style={{
//                       width: 9, height: 9, borderRadius: 2,
//                       background: DAY_STYLE[item.kind].bg, border: `1px solid ${DAY_STYLE[item.kind].bd}`,
//                     }}
//                   />
//                   <span style={{ color: 'var(--ink4)' }}>{item.label}</span>
//                 </div>
//               ))}
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <div style={{ width: 9, height: 9, borderRadius: 2, boxShadow: 'inset 0 0 0 2px var(--blue)' }} />
//                 <span style={{ color: 'var(--ink4)' }}>Today</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* My Leave Requests */}
//         <div className="card" style={{ marginTop: 14 }}>
//           <div style={{ padding: '13px 17px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
//             My Leave Requests
//           </div>
//           {myLeavesLoading ? (
//             <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//           ) : !myLeaves || myLeaves.length === 0 ? (
//             <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>
//               You haven't applied for any leave yet.
//             </div>
//           ) : (
//             <div className="tw">
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Type</th>
//                     <th>Application Type</th>
//                     <th>Dates</th>
//                     <th>Days</th>
//                     <th>Status</th>
//                     <th>Reason</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {myLeaves.map((req) => (
//                     <tr key={req.id}>
//                       <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
//                       <td>{LEAVE_APPLICATION_TYPE_LABELS[req.leave_application_type] ?? '—'}</td>
//                       <td>{formatDateRange(req.from_date, req.to_date)}</td>
//                       <td>{req.days}</td>
//                       <td>
//                         <Chip variant={statusToVariant(req.status)}>{req.status}</Chip>
//                       </td>
//                       <td>
//                         {req.reason || '—'}
//                         {req.status === 'Rejected' && req.rejection_reason && (
//                           <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
//                             Rejected: {req.rejection_reason}
//                           </div>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       <Modal
//         open={rejectTargetId !== null}
//         onClose={closeRejectModal}
//         title="Reject Leave Request"
//         subtitle="This reason will be shared with the employee."
//         footer={
//           <>
//             <button className="btn btn-sec" onClick={closeRejectModal} disabled={rejectLeave.isPending}>
//               Cancel
//             </button>
//             <button
//               className="btn btn-pri"
//               onClick={confirmReject}
//               disabled={rejectLeave.isPending || !rejectReason.trim()}
//             >
//               {rejectLeave.isPending ? 'Rejecting…' : 'OK'}
//             </button>
//           </>
//         }
//       >
//         <div className="form-field fg">
//           <label className="field-label">
//             Reason for Rejection<span className="req-mark" aria-hidden="true">*</span>
//           </label>
//           <textarea
//             className="form-textarea"
//             rows={3}
//             autoFocus
//             placeholder="Explain why this leave request is being rejected…"
//             value={rejectReason}
//             onChange={(e) => setRejectReason(e.target.value)}
//           />
//         </div>
//       </Modal>
//     </AppShell>
//   );
// }



'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { LeaveBalanceCard } from '../../../components/ui/LeaveBalanceCard';
import { Chip, statusToVariant } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
import { usePermission } from '../../../features/auth/hooks/usePermission';
import {
  usePendingLeaves,
  useApproveLeave,
  useRejectLeave,
  useMyLeaves,
  useLeaveBalances,
  useTestMonthlyLeaveCredit,
} from '../../../features/leaves/hooks/useLeaves';
import { useMyCombinedAttendance } from '../../../features/attendance/hooks/useAttendance';

const LEAVE_TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'amber'> = {
  CL: 'blue', ShL: 'purple', EL: 'green',
};

const LEAVE_TYPE_COLOR: Record<string, string> = {
  CL: 'var(--blue)', EL: 'var(--green)', ShL: 'var(--purple)',
};

const LEAVE_APPLICATION_TYPE_LABELS: Record<string, string> = {
  arrival_late: 'Arrival Late',
  leaving_early: 'Leaving Early',
  first_half: '1st Half',
  second_half: '2nd Half',
  full_day: 'Full Day',
};

function formatDateRange(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const f = new Date(from + 'T00:00:00').toLocaleDateString('en-IN', opts);
  if (from === to) return f;
  const t = new Date(to + 'T00:00:00').toLocaleDateString('en-IN', opts);
  return `${f} – ${t}`;
}

type DayKind = 'leave-approved' | 'leave-pending' | 'leave-rejected' | 'holiday' | 'weekly-off' | 'present' | 'absent' | 'none';

const DAY_STYLE: Record<DayKind, { bg: string; bd: string; fg: string }> = {
  'leave-approved': { bg: 'var(--blue-lt)', bd: 'var(--blue)', fg: 'var(--blue)' },
  'leave-pending': { bg: 'var(--amber-lt)', bd: 'var(--amber-bd)', fg: 'var(--amber)' },
  'leave-rejected': { bg: 'var(--pink-lt)', bd: 'var(--pink-bd)', fg: 'var(--pink)' },
  holiday: { bg: 'var(--purple-lt)', bd: 'var(--purple-bd)', fg: 'var(--purple)' },
  'weekly-off': { bg: 'var(--surface2)', bd: 'var(--border)', fg: 'var(--ink4)' },
  present: { bg: 'var(--green-lt)', bd: 'var(--green-bd)', fg: 'var(--green)' },
  absent: { bg: 'rgba(220,38,38,.08)', bd: 'var(--danger)', fg: 'var(--danger)' },
  none: { bg: 'transparent', bd: 'transparent', fg: 'var(--ink3)' },
};

const CALENDAR_LEGEND: { kind: DayKind; label: string }[] = [
  { kind: 'present', label: 'Present' },
  { kind: 'absent', label: 'Absent' },
  { kind: 'leave-approved', label: 'Leave Approved' },
  { kind: 'leave-pending', label: 'Leave Pending' },
  { kind: 'leave-rejected', label: 'Leave Rejected' },
  { kind: 'holiday', label: 'Holiday' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function LeavesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canApprove, user } = usePermission();
  const hasApprovePermission = canApprove('leaves');

  // NOTE: `user.employeeId` is what the original code relied on — if that
  // field doesn't exist on your auth user object this is why "My Leave
  // Requests" rendered nothing: useMyLeaves() never fires when its id arg is
  // falsy, and that fails silently (no error, no loading state, just empty).
  // Falling back across the likely field names here; confirm the real one
  // against usePermission()/your auth slice and drop the fallback once known.
  const employeeId: number | undefined =
    (user as any)?.employeeId ?? (user as any)?.employee_id ?? (user as any)?.id;

  const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaves(hasApprovePermission);
  const { data: myLeaves, isLoading: myLeavesLoading } = useMyLeaves(employeeId);
  const { data: balances } = useLeaveBalances();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const testCredit = useTestMonthlyLeaveCredit();

  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const closeRejectModal = () => {
    setRejectTargetId(null);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectTargetId || !rejectReason.trim()) return;
    rejectLeave.mutate(
      { id: rejectTargetId, reason: rejectReason.trim() },
      { onSuccess: closeRejectModal },
    );
  };

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Leave Management', breadcrumb: 'Operations' }));
  }, [dispatch]);

  const pendingCount = pendingLeaves?.length ?? 0;

  // ── Live calendar: my own attendance (Biometric + Trakola, already merged
  // server-side) overlaid with my leave requests, colored by status ─────────
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const dateFrom = `${calYear}-${pad2(calMonth + 1)}-01`;
  const dateTo = `${calYear}-${pad2(calMonth + 1)}-${pad2(daysInMonth)}`;
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  const { data: attendanceRows } = useMyCombinedAttendance({ date_from: dateFrom, date_to: dateTo });
  const attendanceByDate = new Map((attendanceRows ?? []).map(r => [r.date, r]));

  const goPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  function dayKind(iso: string): DayKind {
    const leave = (myLeaves ?? []).find(
      l => l.status !== 'Cancelled' && iso >= l.from_date && iso <= l.to_date,
    );
    if (leave) {
      if (leave.status === 'Approved') return 'leave-approved';
      if (leave.status === 'Pending') return 'leave-pending';
      if (leave.status === 'Rejected') return 'leave-rejected';
    }
    const att = attendanceByDate.get(iso);
    if (att?.finalStatus === 'Holiday') return 'holiday';
    if (att?.finalStatus === 'Weekly Off') return 'weekly-off';
    if (att?.finalStatus === 'Full Day Present' || att?.finalStatus === 'First Half Present' || att?.finalStatus === 'Second Half Present') return 'present';
    if (att?.finalStatus === 'Full Day Absent') return 'absent';
    // No shift assigned yet, so the rule engine never set finalStatus — fall
    // back to the raw punch-merge status so real check-ins still show up.
    if (!att?.finalStatus && att?.status === 'Present') return 'present';
    return 'none';
  }

  const firstWeekday = new Date(calYear, calMonth, 1).getDay(); // 0 = Sunday
  const calendarCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const runTestCredit = () => {
    if (!employeeId) return;
    testCredit.mutate({ employeeId, year: calYear, month: calMonth + 1 });
  };

  return (
    <AppShell>
      <div className="pg-enter">
        <div className="ph" style={{ alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Leave Management</h1>
            <p style={{ color: 'var(--ink4)', fontSize: 12.5 }}>
              {pendingCount === 0 ? 'All caught up' : `${pendingCount} pending approval${pendingCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-sec btn-sm"
              onClick={runTestCredit}
              disabled={!employeeId || testCredit.isPending}
              title={`Run the monthly CL/EL/ShL credit job for ${monthLabel}`}
            >
              {testCredit.isPending ? 'Crediting…' : 'Test Leave Credit'}
            </button>
            <button className="btn btn-pri btn-sm" onClick={() => router.push('/leaves/new')}>
              + Apply Leave
            </button>
          </div>
        </div>

        {/* Balances — straight off the API, no placeholders */}
        {/* <div className="g4 mb14">
          <StatCard label="Pending Approvals" value={pendingCount} color="var(--amber)" />
          {(balances ?? []).map((b) => (
            <StatCard
              key={b.leave_type_id}
              label={`${b.code} · ${b.name}`}
              value={b.remaining}
              sub={`of ${b.allocated} days`}
              color={LEAVE_TYPE_COLOR[b.code] ?? 'var(--blue)'}
            />
          ))}

          
          {balances && balances.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink4)', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              No leave balances set up yet.
            </div>
          )}
        </div> */}

        <div className="g4 mb14">
          {/* <StatCard
            label="Pending Approvals"
            value={pendingCount}
            color="var(--amber)"
          /> */}

          {(balances ?? []).map((b) => (
            <LeaveBalanceCard
              key={b.leave_type_id}
              balance={b}
              color={LEAVE_TYPE_COLOR[b.code] ?? 'var(--blue)'}
            />
          ))}

          {balances && balances.length === 0 && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--ink4)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
              }}
            >
              No leave balances set up yet.
            </div>
          )}
        </div>

        <div className="g2">
          {/* Pending Approvals Table */}
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
              Pending Approvals
            </div>
            {!hasApprovePermission ? (
              <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>
                You don't have permission to approve leave requests.
              </div>
            ) : pendingLoading ? (
              <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
            ) : pendingCount === 0 ? (
              <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
            ) : (
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Employee</th>
                      <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Type</th>
                      <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Dates</th>
                      <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Days</th>
                      <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Reason</th>
                      <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves!.map((req) => {
                      const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
                      const rejectingThis = rejectLeave.isPending && rejectLeave.variables?.id === req.id;
                      const rowBusy = approvingThis || rejectingThis || rejectTargetId === req.id;
                      return (
                        <tr key={req.id}>
                          <td><strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong></td>
                          <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
                          <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
                          <td style={{ color: 'var(--ink3)' }}>{req.days}</td>
                          <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.55 : 1, justifyContent: 'flex-end' }}>
                              <Chip
                                variant="green"
                                onClick={() => { if (!rowBusy) approveLeave.mutate(req.id); }}
                              >
                                {approvingThis ? '…' : 'Approve'}
                              </Chip>
                              <Chip
                                variant="red"
                                onClick={() => { if (!rowBusy) setRejectTargetId(req.id); }}
                              >
                                {rejectingThis ? '…' : 'Reject'}
                              </Chip>
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

          {/* Live Calendar — attendance (Biometric + Trakola) + my leaves */}
          <div className="card cp">
            <div className="ct" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-sec btn-sm" onClick={goPrevMonth} aria-label="Previous month">‹</button>
              <span style={{ fontWeight: 500, fontSize: 12.5 }}>{monthLabel}</span>
              <button type="button" className="btn btn-sec btn-sm" onClick={goNextMonth} aria-label="Next month">›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 9, marginTop: 9 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div
                  key={i}
                  style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink4)', padding: 3 }}
                >
                  {d}
                </div>
              ))}
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const iso = `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`;
                const kind = dayKind(iso);
                const style = DAY_STYLE[kind];
                const isToday = iso === todayIso;

                return (
                  <div
                    key={i}
                    title={kind !== 'none' ? kind.replace('-', ' ') : undefined}
                    style={{
                      textAlign: 'center', fontSize: 11, fontWeight: isToday ? 600 : 400,
                      padding: '6px 0', borderRadius: 6,
                      background: style.bg,
                      color: style.fg,
                      border: `1px solid ${style.bd}`,
                      boxShadow: isToday ? 'inset 0 0 0 1.5px var(--blue)' : undefined,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5, flexWrap: 'wrap' }}>
              {CALENDAR_LEGEND.map((item) => (
                <div key={item.kind} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: 2,
                      background: DAY_STYLE[item.kind].bg, border: `1px solid ${DAY_STYLE[item.kind].bd}`,
                    }}
                  />
                  <span style={{ color: 'var(--ink4)' }}>{item.label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, boxShadow: 'inset 0 0 0 1.5px var(--blue)' }} />
                <span style={{ color: 'var(--ink4)' }}>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Leave Requests */}
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
            My Leave Requests
          </div>
          {!employeeId ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>
              Couldn't resolve your employee id from the session — check the <code>employeeId</code> field on the auth user object.
            </div>
          ) : myLeavesLoading ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
          ) : !myLeaves || myLeaves.length === 0 ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>
              You haven't applied for any leave yet.
            </div>
          ) : (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Type</th>
                    <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Application</th>
                    <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Dates</th>
                    <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Days</th>
                    <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Status</th>
                    <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.map((req) => (
                    <tr key={req.id}>
                      <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
                      <td style={{ color: 'var(--ink3)' }}>{LEAVE_APPLICATION_TYPE_LABELS[req.leave_application_type] ?? '—'}</td>
                      <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
                      <td style={{ color: 'var(--ink3)' }}>{req.days}</td>
                      <td>
                        <Chip variant={statusToVariant(req.status)}>{req.status}</Chip>
                      </td>
                      <td style={{ color: 'var(--ink3)' }}>
                        {req.reason || '—'}
                        {req.status === 'Rejected' && req.rejection_reason && (
                          <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                            Rejected: {req.rejection_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={rejectTargetId !== null}
        onClose={closeRejectModal}
        title="Reject Leave Request"
        subtitle="This reason will be shared with the employee."
        footer={
          <>
            <button className="btn btn-sec" onClick={closeRejectModal} disabled={rejectLeave.isPending}>
              Cancel
            </button>
            <button
              className="btn btn-pri"
              onClick={confirmReject}
              disabled={rejectLeave.isPending || !rejectReason.trim()}
            >
              {rejectLeave.isPending ? 'Rejecting…' : 'OK'}
            </button>
          </>
        }
      >
        <div className="form-field fg">
          <label className="field-label">
            Reason for Rejection<span className="req-mark" aria-hidden="true">*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            autoFocus
            placeholder="Explain why this leave request is being rejected…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </AppShell>
  );
}