// // 'use client';
// // import { useEffect, useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { useAppDispatch } from '../../../store';
// // import { setPageTitle } from '../../../store/slices/uiSlice';
// // import { AppShell } from '../../../layouts/AppLayout';
// // import { StatCard } from '../../../components/ui/StatCard';
// // import { Chip, statusToVariant } from '../../../components/ui/Chip';
// // import { Modal } from '../../../components/ui/Modal';
// // import { usePermission } from '../../../features/auth/hooks/usePermission';
// // import { usePendingLeaves, useApproveLeave, useRejectLeave, useMyLeaves, useLeaveBalances } from '../../../features/leaves/hooks/useLeaves';
// // import { useMyCombinedAttendance } from '../../../features/attendance/hooks/useAttendance';

// // const LEAVE_TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'amber'> = {
// //   CL: 'blue', ShL: 'purple', EL: 'green',
// // };

// // const LEAVE_TYPE_COLOR: Record<string, string> = {
// //   CL: 'var(--blue)', EL: 'var(--green)', ShL: 'var(--purple)',
// // };

// // const LEAVE_APPLICATION_TYPE_LABELS: Record<string, string> = {
// //   arrival_late: 'Arrival Late',
// //   leaving_early: 'Leaving Early',
// //   first_half: '1st Half',
// //   second_half: '2nd Half',
// //   full_day: 'Full Day',
// // };

// // function formatDateRange(from: string, to: string) {
// //   const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
// //   const f = new Date(from + 'T00:00:00').toLocaleDateString('en-IN', opts);
// //   if (from === to) return f;
// //   const t = new Date(to + 'T00:00:00').toLocaleDateString('en-IN', opts);
// //   return `${f} – ${t}`;
// // }

// // type DayKind = 'leave-approved' | 'leave-pending' | 'leave-rejected' | 'holiday' | 'weekly-off' | 'present' | 'absent' | 'none';

// // const DAY_STYLE: Record<DayKind, { bg: string; bd: string; fg: string }> = {
// //   'leave-approved': { bg: 'var(--blue-lt)',   bd: 'var(--blue)',      fg: 'var(--blue)' },
// //   'leave-pending':  { bg: 'var(--amber-lt)',  bd: 'var(--amber-bd)',  fg: 'var(--amber)' },
// //   'leave-rejected': { bg: 'var(--pink-lt)',   bd: 'var(--pink-bd)',   fg: 'var(--pink)' },
// //   holiday:          { bg: 'var(--purple-lt)', bd: 'var(--purple-bd)', fg: 'var(--purple)' },
// //   'weekly-off':     { bg: 'var(--surface2)',  bd: 'var(--border)',   fg: 'var(--ink4)' },
// //   present:          { bg: 'var(--green-lt)',  bd: 'var(--green-bd)', fg: 'var(--green)' },
// //   absent:           { bg: 'rgba(220,38,38,.08)', bd: 'var(--danger)', fg: 'var(--danger)' },
// //   none:             { bg: 'transparent',      bd: 'transparent',     fg: 'var(--ink3)' },
// // };

// // const CALENDAR_LEGEND: { kind: DayKind; label: string }[] = [
// //   { kind: 'present',        label: 'Present' },
// //   { kind: 'absent',         label: 'Absent' },
// //   { kind: 'leave-approved', label: 'Leave Approved' },
// //   { kind: 'leave-pending',  label: 'Leave Pending' },
// //   { kind: 'leave-rejected', label: 'Leave Rejected' },
// //   { kind: 'holiday',        label: 'Holiday' },
// // ];

// // const pad2 = (n: number) => String(n).padStart(2, '0');

// // export default function LeavesPage() {
// //   const dispatch = useAppDispatch();
// //   const router   = useRouter();
// //   const { canApprove, user } = usePermission();
// //   const hasApprovePermission = canApprove('leaves');

// //   const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaves(hasApprovePermission);
// //   const { data: myLeaves, isLoading: myLeavesLoading } = useMyLeaves(user?.employeeId ?? undefined);
// //   const { data: balances } = useLeaveBalances();
// //   const approveLeave = useApproveLeave();
// //   const rejectLeave   = useRejectLeave();

// //   const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
// //   const [rejectReason, setRejectReason] = useState('');

// //   const closeRejectModal = () => {
// //     setRejectTargetId(null);
// //     setRejectReason('');
// //   };

// //   const confirmReject = () => {
// //     if (!rejectTargetId || !rejectReason.trim()) return;
// //     rejectLeave.mutate(
// //       { id: rejectTargetId, reason: rejectReason.trim() },
// //       { onSuccess: closeRejectModal },
// //     );
// //   };

// //   useEffect(() => {
// //     dispatch(setPageTitle({ title: 'Leave Management', breadcrumb: 'Operations' }));
// //   }, [dispatch]);

// //   const pendingCount = pendingLeaves?.length ?? 0;

// //   // ── Live calendar: my own attendance (Biometric + Trakola, already merged
// //   // server-side) overlaid with my leave requests, colored by status ─────────
// //   const now = new Date();
// //   const [calYear, setCalYear] = useState(now.getFullYear());
// //   const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

// //   const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
// //   const dateFrom = `${calYear}-${pad2(calMonth + 1)}-01`;
// //   const dateTo   = `${calYear}-${pad2(calMonth + 1)}-${pad2(daysInMonth)}`;
// //   const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
// //   const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

// //   const { data: attendanceRows } = useMyCombinedAttendance({ date_from: dateFrom, date_to: dateTo });
// //   const attendanceByDate = new Map((attendanceRows ?? []).map(r => [r.date, r]));

// //   const goPrevMonth = () => {
// //     if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
// //     else setCalMonth(m => m - 1);
// //   };
// //   const goNextMonth = () => {
// //     if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
// //     else setCalMonth(m => m + 1);
// //   };

// //   function dayKind(iso: string): DayKind {
// //     const leave = (myLeaves ?? []).find(
// //       l => l.status !== 'Cancelled' && iso >= l.from_date && iso <= l.to_date,
// //     );
// //     if (leave) {
// //       if (leave.status === 'Approved') return 'leave-approved';
// //       if (leave.status === 'Pending')  return 'leave-pending';
// //       if (leave.status === 'Rejected') return 'leave-rejected';
// //     }
// //     const att = attendanceByDate.get(iso);
// //     if (att?.finalStatus === 'Holiday')     return 'holiday';
// //     if (att?.finalStatus === 'Weekly Off')  return 'weekly-off';
// //     if (att?.finalStatus === 'Full Day Present' || att?.finalStatus === 'First Half Present' || att?.finalStatus === 'Second Half Present') return 'present';
// //     if (att?.finalStatus === 'Full Day Absent') return 'absent';
// //     // No shift assigned yet, so the rule engine never set finalStatus — fall
// //     // back to the raw punch-merge status so real check-ins still show up.
// //     if (!att?.finalStatus && att?.status === 'Present') return 'present';
// //     return 'none';
// //   }

// //   const firstWeekday = new Date(calYear, calMonth, 1).getDay(); // 0 = Sunday
// //   const calendarCells: (number | null)[] = [
// //     ...Array(firstWeekday).fill(null),
// //     ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
// //   ];
// //   while (calendarCells.length % 7 !== 0) calendarCells.push(null);

// //   return (
// //     <AppShell>
// //       <div className="pg-enter">
// //         <div className="ph">
// //           <div>
// //             <h1>Leave Management</h1>
// //             <p>Policy-based · Multi-level approvals · Holiday calendar · {pendingCount} pending</p>
// //           </div>
// //           <button className="btn btn-pri btn-sm" onClick={() => router.push('/leaves/new')}>+ Apply Leave</button>
// //         </div>

// //         {/* Stats — leave balance per type, plus pending approvals */}
// //         <div className="g4 mb14">
// //           <StatCard label="Pending Approvals" value={pendingCount} color="var(--amber)" />
// //           {(balances ?? []).map((b) => (
// //             <StatCard
// //               key={b.leave_type_id}
// //               label={`${b.code} (${b.name})`}
// //               value={b.remaining}
// //               sub={`of ${b.allocated} days`}
// //               color={LEAVE_TYPE_COLOR[b.code] ?? 'var(--blue)'}
// //             />
// //           ))}
// //         </div>

// //         <div className="g2">
// //           {/* Pending Approvals Table */}
// //           <div className="card">
// //             <div style={{ padding: '13px 17px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
// //               Pending Approvals
// //             </div>
// //             {!hasApprovePermission ? (
// //               <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>
// //                 You don't have permission to approve leave requests.
// //               </div>
// //             ) : pendingLoading ? (
// //               <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
// //             ) : pendingCount === 0 ? (
// //               <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
// //             ) : (
// //               <div className="tw">
// //                 <table>
// //                   <thead>
// //                     <tr>
// //                       <th>Employee</th>
// //                       <th>Type</th>
// //                       <th>Dates</th>
// //                       <th>Days</th>
// //                       <th>Reason</th>
// //                       <th>Action</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {pendingLeaves!.map((req) => {
// //                       const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
// //                       const rejectingThis = rejectLeave.isPending && rejectLeave.variables?.id === req.id;
// //                       const rowBusy = approvingThis || rejectingThis || rejectTargetId === req.id;
// //                       return (
// //                         <tr key={req.id}>
// //                           <td><strong>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong></td>
// //                           <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
// //                           <td>{formatDateRange(req.from_date, req.to_date)}</td>
// //                           <td>{req.days}</td>
// //                           <td>{req.reason || '—'}</td>
// //                           <td>
// //                             <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.6 : 1 }}>
// //                               <Chip
// //                                 variant="green"
// //                                 onClick={() => { if (!rowBusy) approveLeave.mutate(req.id); }}
// //                               >
// //                                 {approvingThis ? '…' : 'Approve'}
// //                               </Chip>
// //                               <Chip
// //                                 variant="red"
// //                                 onClick={() => { if (!rowBusy) setRejectTargetId(req.id); }}
// //                               >
// //                                 {rejectingThis ? '…' : 'Reject'}
// //                               </Chip>
// //                             </div>
// //                           </td>
// //                         </tr>
// //                       );
// //                     })}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             )}
// //           </div>

// //           {/* Live Calendar — attendance (Biometric + Trakola) + my leaves */}
// //           <div className="card cp">
// //             <div className="ct" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
// //               <button type="button" className="btn btn-sec btn-sm" onClick={goPrevMonth} aria-label="Previous month">‹</button>
// //               <span>{monthLabel}</span>
// //               <button type="button" className="btn btn-sec btn-sm" onClick={goNextMonth} aria-label="Next month">›</button>
// //             </div>
// //             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 9, marginTop: 9 }}>
// //               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
// //                 <div
// //                   key={i}
// //                   style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--ink4)', padding: 3 }}
// //                 >
// //                   {d}
// //                 </div>
// //               ))}
// //               {calendarCells.map((day, i) => {
// //                 if (day === null) return <div key={i} />;
// //                 const iso = `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`;
// //                 const kind = dayKind(iso);
// //                 const style = DAY_STYLE[kind];
// //                 const isToday = iso === todayIso;

// //                 return (
// //                   <div
// //                     key={i}
// //                     title={kind !== 'none' ? kind.replace('-', ' ') : undefined}
// //                     style={{
// //                       textAlign: 'center', fontSize: 11, fontWeight: isToday ? 700 : 500,
// //                       padding: '6px 0', borderRadius: 5,
// //                       background: style.bg,
// //                       color: style.fg,
// //                       border: `1px solid ${style.bd}`,
// //                       boxShadow: isToday ? 'inset 0 0 0 2px var(--blue)' : undefined,
// //                     }}
// //                   >
// //                     {day}
// //                   </div>
// //                 );
// //               })}
// //             </div>
// //             <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap' }}>
// //               {CALENDAR_LEGEND.map((item) => (
// //                 <div key={item.kind} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
// //                   <div
// //                     style={{
// //                       width: 9, height: 9, borderRadius: 2,
// //                       background: DAY_STYLE[item.kind].bg, border: `1px solid ${DAY_STYLE[item.kind].bd}`,
// //                     }}
// //                   />
// //                   <span style={{ color: 'var(--ink4)' }}>{item.label}</span>
// //                 </div>
// //               ))}
// //               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
// //                 <div style={{ width: 9, height: 9, borderRadius: 2, boxShadow: 'inset 0 0 0 2px var(--blue)' }} />
// //                 <span style={{ color: 'var(--ink4)' }}>Today</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* My Leave Requests */}
// //         <div className="card" style={{ marginTop: 14 }}>
// //           <div style={{ padding: '13px 17px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
// //             My Leave Requests
// //           </div>
// //           {myLeavesLoading ? (
// //             <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
// //           ) : !myLeaves || myLeaves.length === 0 ? (
// //             <div style={{ padding: 20, fontSize: 12, color: 'var(--ink4)' }}>
// //               You haven't applied for any leave yet.
// //             </div>
// //           ) : (
// //             <div className="tw">
// //               <table>
// //                 <thead>
// //                   <tr>
// //                     <th>Type</th>
// //                     <th>Application Type</th>
// //                     <th>Dates</th>
// //                     <th>Days</th>
// //                     <th>Status</th>
// //                     <th>Reason</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {myLeaves.map((req) => (
// //                     <tr key={req.id}>
// //                       <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
// //                       <td>{LEAVE_APPLICATION_TYPE_LABELS[req.leave_application_type] ?? '—'}</td>
// //                       <td>{formatDateRange(req.from_date, req.to_date)}</td>
// //                       <td>{req.days}</td>
// //                       <td>
// //                         <Chip variant={statusToVariant(req.status)}>{req.status}</Chip>
// //                       </td>
// //                       <td>
// //                         {req.reason || '—'}
// //                         {req.status === 'Rejected' && req.rejection_reason && (
// //                           <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
// //                             Rejected: {req.rejection_reason}
// //                           </div>
// //                         )}
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <Modal
// //         open={rejectTargetId !== null}
// //         onClose={closeRejectModal}
// //         title="Reject Leave Request"
// //         subtitle="This reason will be shared with the employee."
// //         footer={
// //           <>
// //             <button className="btn btn-sec" onClick={closeRejectModal} disabled={rejectLeave.isPending}>
// //               Cancel
// //             </button>
// //             <button
// //               className="btn btn-pri"
// //               onClick={confirmReject}
// //               disabled={rejectLeave.isPending || !rejectReason.trim()}
// //             >
// //               {rejectLeave.isPending ? 'Rejecting…' : 'OK'}
// //             </button>
// //           </>
// //         }
// //       >
// //         <div className="form-field fg">
// //           <label className="field-label">
// //             Reason for Rejection<span className="req-mark" aria-hidden="true">*</span>
// //           </label>
// //           <textarea
// //             className="form-textarea"
// //             rows={3}
// //             autoFocus
// //             placeholder="Explain why this leave request is being rejected…"
// //             value={rejectReason}
// //             onChange={(e) => setRejectReason(e.target.value)}
// //           />
// //         </div>
// //       </Modal>
// //     </AppShell>
// //   );
// // }



// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAppDispatch } from '../../../store';
// import { setPageTitle } from '../../../store/slices/uiSlice';
// import { AppShell } from '../../../layouts/AppLayout';
// import { StatCard } from '../../../components/ui/StatCard';
// import { LeaveBalanceCard } from '../../../components/ui/LeaveBalanceCard';
// import { Chip, statusToVariant } from '../../../components/ui/Chip';
// import { Modal } from '../../../components/ui/Modal';
// import { usePermission } from '../../../features/auth/hooks/usePermission';
// import {
//   usePendingLeaves,
//   useApproveLeave,
//   useRejectLeave,
//   useMyLeaves,
//   useLeaveBalances,
//   useTestMonthlyLeaveCredit,
// } from '../../../features/leaves/hooks/useLeaves';
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
//   'leave-approved': { bg: 'var(--blue-lt)', bd: 'var(--blue)', fg: 'var(--blue)' },
//   'leave-pending': { bg: 'var(--amber-lt)', bd: 'var(--amber-bd)', fg: 'var(--amber)' },
//   'leave-rejected': { bg: 'var(--pink-lt)', bd: 'var(--pink-bd)', fg: 'var(--pink)' },
//   holiday: { bg: 'var(--purple-lt)', bd: 'var(--purple-bd)', fg: 'var(--purple)' },
//   'weekly-off': { bg: 'var(--surface2)', bd: 'var(--border)', fg: 'var(--ink4)' },
//   present: { bg: 'var(--green-lt)', bd: 'var(--green-bd)', fg: 'var(--green)' },
//   absent: { bg: 'rgba(220,38,38,.08)', bd: 'var(--danger)', fg: 'var(--danger)' },
//   none: { bg: 'transparent', bd: 'transparent', fg: 'var(--ink3)' },
// };

// const CALENDAR_LEGEND: { kind: DayKind; label: string }[] = [
//   { kind: 'present', label: 'Present' },
//   { kind: 'absent', label: 'Absent' },
//   { kind: 'leave-approved', label: 'Leave Approved' },
//   { kind: 'leave-pending', label: 'Leave Pending' },
//   { kind: 'leave-rejected', label: 'Leave Rejected' },
//   { kind: 'holiday', label: 'Holiday' },
// ];

// const pad2 = (n: number) => String(n).padStart(2, '0');

// export default function LeavesPage() {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const { canApprove, user } = usePermission();
//   const hasApprovePermission = canApprove('leaves');

//   // NOTE: `user.employeeId` is what the original code relied on — if that
//   // field doesn't exist on your auth user object this is why "My Leave
//   // Requests" rendered nothing: useMyLeaves() never fires when its id arg is
//   // falsy, and that fails silently (no error, no loading state, just empty).
//   // Falling back across the likely field names here; confirm the real one
//   // against usePermission()/your auth slice and drop the fallback once known.
//   const employeeId: number | undefined =
//     (user as any)?.employeeId ?? (user as any)?.employee_id ?? (user as any)?.id;

//   const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaves(hasApprovePermission);
//   const { data: myLeaves, isLoading: myLeavesLoading } = useMyLeaves(employeeId);
//   const { data: balances } = useLeaveBalances();
//   const approveLeave = useApproveLeave();
//   const rejectLeave = useRejectLeave();
//   const testCredit = useTestMonthlyLeaveCredit();

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
//   const dateTo = `${calYear}-${pad2(calMonth + 1)}-${pad2(daysInMonth)}`;
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
//       if (leave.status === 'Pending') return 'leave-pending';
//       if (leave.status === 'Rejected') return 'leave-rejected';
//     }
//     const att = attendanceByDate.get(iso);
//     if (att?.finalStatus === 'Holiday') return 'holiday';
//     if (att?.finalStatus === 'Weekly Off') return 'weekly-off';
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

//   const runTestCredit = () => {
//     if (!employeeId) return;
//     testCredit.mutate({ employeeId, year: calYear, month: calMonth + 1 });
//   };

//   return (
//     <AppShell>
//       <div className="pg-enter">
//         <div className="ph" style={{ alignItems: 'flex-end' }}>
//           <div>
//             <h1 style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Leave Management</h1>
//             <p style={{ color: 'var(--ink4)', fontSize: 12.5 }}>
//               {pendingCount === 0 ? 'All caught up' : `${pendingCount} pending approval${pendingCount === 1 ? '' : 's'}`}
//             </p>
//           </div>
//           <div style={{ display: 'flex', gap: 8 }}>
//             <button
//               className="btn btn-sec btn-sm"
//               onClick={runTestCredit}
//               disabled={!employeeId || testCredit.isPending}
//               title={`Run the monthly CL/EL/ShL credit job for ${monthLabel}`}
//             >
//               {testCredit.isPending ? 'Crediting…' : 'Test Leave Credit'}
//             </button>
//             <button className="btn btn-pri btn-sm" onClick={() => router.push('/leaves/new')}>
//               + Apply Leave
//             </button>
//           </div>
//         </div>

//         {/* Balances — straight off the API, no placeholders */}
//         {/* <div className="g4 mb14">
//           <StatCard label="Pending Approvals" value={pendingCount} color="var(--amber)" />
//           {(balances ?? []).map((b) => (
//             <StatCard
//               key={b.leave_type_id}
//               label={`${b.code} · ${b.name}`}
//               value={b.remaining}
//               sub={`of ${b.allocated} days`}
//               color={LEAVE_TYPE_COLOR[b.code] ?? 'var(--blue)'}
//             />
//           ))}


//           {balances && balances.length === 0 && (
//             <div style={{ fontSize: 12, color: 'var(--ink4)', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
//               No leave balances set up yet.
//             </div>
//           )}
//         </div> */}

//         <div className="g4 mb14">
//           {/* <StatCard
//             label="Pending Approvals"
//             value={pendingCount}
//             color="var(--amber)"
//           /> */}

//           {(balances ?? []).map((b) => (
//             <LeaveBalanceCard
//               key={b.leave_type_id}
//               balance={b}
//               color={LEAVE_TYPE_COLOR[b.code] ?? 'var(--blue)'}
//             />
//           ))}

//           {balances && balances.length === 0 && (
//             <div
//               style={{
//                 fontSize: 12,
//                 color: 'var(--ink4)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 padding: '0 4px',
//               }}
//             >
//               No leave balances set up yet.
//             </div>
//           )}
//         </div>

//         <div className="g2">
//           {/* Pending Approvals Table */}
//           <div className="card">
//             <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//               Pending Approvals
//             </div>
//             {!hasApprovePermission ? (
//               <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>
//                 You don't have permission to approve leave requests.
//               </div>
//             ) : pendingLoading ? (
//               <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//             ) : pendingCount === 0 ? (
//               <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
//             ) : (
//               <div className="tw">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Employee</th>
//                       <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Type</th>
//                       <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Dates</th>
//                       <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Days</th>
//                       <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Reason</th>
//                       <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {pendingLeaves!.map((req) => {
//                       const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
//                       const rejectingThis = rejectLeave.isPending && rejectLeave.variables?.id === req.id;
//                       const rowBusy = approvingThis || rejectingThis || rejectTargetId === req.id;
//                       return (
//                         <tr key={req.id}>
//                           <td><strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong></td>
//                           <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
//                           <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
//                           <td style={{ color: 'var(--ink3)' }}>{req.days}</td>
//                           <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
//                           <td>
//                             <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.55 : 1, justifyContent: 'flex-end' }}>
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
//               <span style={{ fontWeight: 500, fontSize: 12.5 }}>{monthLabel}</span>
//               <button type="button" className="btn btn-sec btn-sm" onClick={goNextMonth} aria-label="Next month">›</button>
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 9, marginTop: 9 }}>
//               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
//                 <div
//                   key={i}
//                   style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink4)', padding: 3 }}
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
//                       textAlign: 'center', fontSize: 11, fontWeight: isToday ? 600 : 400,
//                       padding: '6px 0', borderRadius: 6,
//                       background: style.bg,
//                       color: style.fg,
//                       border: `1px solid ${style.bd}`,
//                       boxShadow: isToday ? 'inset 0 0 0 1.5px var(--blue)' : undefined,
//                     }}
//                   >
//                     {day}
//                   </div>
//                 );
//               })}
//             </div>
//             <div style={{ display: 'flex', gap: 12, fontSize: 10.5, flexWrap: 'wrap' }}>
//               {CALENDAR_LEGEND.map((item) => (
//                 <div key={item.kind} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                   <div
//                     style={{
//                       width: 8, height: 8, borderRadius: 2,
//                       background: DAY_STYLE[item.kind].bg, border: `1px solid ${DAY_STYLE[item.kind].bd}`,
//                     }}
//                   />
//                   <span style={{ color: 'var(--ink4)' }}>{item.label}</span>
//                 </div>
//               ))}
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <div style={{ width: 8, height: 8, borderRadius: 2, boxShadow: 'inset 0 0 0 1.5px var(--blue)' }} />
//                 <span style={{ color: 'var(--ink4)' }}>Today</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* My Leave Requests */}
//         <div className="card" style={{ marginTop: 14 }}>
//           <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//             My Leave Requests
//           </div>
//           {!employeeId ? (
//             <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>
//               Couldn't resolve your employee id from the session — check the <code>employeeId</code> field on the auth user object.
//             </div>
//           ) : myLeavesLoading ? (
//             <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//           ) : !myLeaves || myLeaves.length === 0 ? (
//             <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>
//               You haven't applied for any leave yet.
//             </div>
//           ) : (
//             <div className="tw">
//               <table>
//                 <thead>
//                   <tr>
//                     <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Type</th>
//                     <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Application</th>
//                     <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Dates</th>
//                     <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Days</th>
//                     <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Status</th>
//                     <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Reason</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {myLeaves.map((req) => (
//                     <tr key={req.id}>
//                       <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
//                       <td style={{ color: 'var(--ink3)' }}>{LEAVE_APPLICATION_TYPE_LABELS[req.leave_application_type] ?? '—'}</td>
//                       <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
//                       <td style={{ color: 'var(--ink3)' }}>{req.days}</td>
//                       <td>
//                         <Chip variant={statusToVariant(req.status)}>{req.status}</Chip>
//                       </td>
//                       <td style={{ color: 'var(--ink3)' }}>
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

// 'use client';
// import React, { useEffect, useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAppDispatch } from '../../../store';
// import { setPageTitle } from '../../../store/slices/uiSlice';
// import { AppShell } from '../../../layouts/AppLayout';
// import { StatCard } from '../../../components/ui/StatCard';
// import { Chip, statusToVariant } from '../../../components/ui/Chip';
// import { Modal } from '../../../components/ui/Modal';
// import { usePermission } from '../../../features/auth/hooks/usePermission';
// import {
//   usePendingLeaves,
//   useApproveLeave,
//   useRejectLeave,
//   useCancelLeave,
//   useMyLeaves,
//   useLeaves,
//   useLeaveBalances,
//   useCompanyLeaveBalances,
//   useLeaveTypes,
//   useUpdateLeaveType,
//   useLeavePolicy,
//   useUpdateLeavePolicy,
//   useLeaveCredits,
//   useCreditSpecialLeave,
//   useHolidayList,
//   useCreateHoliday,
//   useDeleteHoliday,
// } from '../../../features/leaves/hooks/useLeaves';
// import type { Holiday } from '../../../services/api/leave.service';
// import apiClient from '../../../services/api/client';

// // ============================================================================
// // ASSUMPTIONS THAT NEED VERIFYING AGAINST YOUR ACTUAL PROJECT
// // ----------------------------------------------------------------------------
// // 1. Employee list: I don't have an "Employees" hook/service from you, so the
// //    "Employee" dropdown under Holidays & Special (Credit special leave) and
// //    the name lookups below call a guessed `/employees` GET. Swap
// //    `useEmployeeOptions()` below for your real employees hook if you have one.
// // 2. Sandwich days / per-day breakdown: the backend's `apply()` currently
// //    trusts whatever `days` the client sends — nothing server-side computes
// //    sandwich days or writes LeaveRequestDay rows yet (that's the
// //    lvCalcDays-equivalent from your original JS demo, never ported to the
// //    backend). The "sandwich 1" tag in Image 2's All Requests table will
// //    only ever show real data once that calculation service exists; for now
// //    `sandwich_days` reads straight from whatever the client posted.
// // 3. "Triggers" tab (rightmost tab in every image): nothing in any file
// //    you've shared references what this is (your original JS demo called an
// //    undefined `tbRender('leaves')`). Left as a clearly-labeled placeholder.
// // ============================================================================

// function useEmployeeOptions() {
//   const [options, setOptions] = useState<{ id: number; name: string; employee_code?: string }[]>([]);
//   useEffect(() => {
//     let cancelled = false;
//     apiClient.get('/employees', { params: { limit: 200 } })
//       .then((res: any) => {
//         if (cancelled) return;
//         const rows = res?.data?.data ?? res?.data ?? [];
//         setOptions(rows.map((e: any) => ({
//           id: e.id,
//           name: [e.first_name, e.last_name].filter(Boolean).join(' ') || e.employee_code || `#${e.id}`,
//           employee_code: e.employee_code,
//         })));
//       })
//       .catch(() => setOptions([]));
//     return () => { cancelled = true; };
//   }, []);
//   return options;
// }

// const LEAVE_TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'amber'> = {
//   CL: 'blue', SHORT: 'purple', EL: 'green', SPECIAL: 'amber', HALF: 'amber',
// };

// function formatDateRange(from: string, to: string) {
//   const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
//   const f = new Date(from + 'T00:00:00').toLocaleDateString('en-IN', opts);
//   if (from === to) return f;
//   const t = new Date(to + 'T00:00:00').toLocaleDateString('en-IN', opts);
//   return `${f} – ${t}`;
// }

// const pad2 = (n: number) => String(n).padStart(2, '0');

// // ============================================================================
// // Self-contained form primitives — NOT dependent on "form-field" / "field-label" /
// // "form-input" / "form-select" classes. Those were a guess at your CSS and the
// // guess was wrong: <label> is inline by default in plain HTML, so without a
// // class that actually sets display:block, the label text and the input just
// // ran together on one line ("Min advance days2" in your screenshot). These
// // use inline styles for every layout-critical property so they render
// // correctly regardless of what your global stylesheet defines.
// // ============================================================================

// const inputBaseStyle: React.CSSProperties = {
//   display: 'block',
//   width: '100%',
//   boxSizing: 'border-box',
//   padding: '9px 11px',
//   border: '1px solid var(--border)',
//   borderRadius: 8,
//   fontSize: 13,
//   color: 'var(--ink)',
//   background: 'var(--surface)',
//   outline: 'none',
// };

// function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//       <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>{label}</label>
//       {children}
//       {hint && <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ink4)', lineHeight: 1.4 }}>{hint}</span>}
//     </div>
//   );
// }

// function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
//   return <input {...props} style={{ ...inputBaseStyle, ...props.style }} />;
// }

// function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
//   return <select {...props} style={{ ...inputBaseStyle, ...props.style }} />;
// }

// function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
//   return (
//     <label
//       style={{
//         display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--ink2)',
//         padding: '9px 10px', borderRadius: 8, background: 'var(--surface2)', cursor: 'pointer',
//       }}
//     >
//       <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, flexShrink: 0 }} />
//       {label}
//     </label>
//   );
// }

// const TABS = ['Overview', 'All Requests', 'Balances', 'Holidays & Special', 'Policy', 'Triggers'] as const;
// type Tab = typeof TABS[number];

// export default function LeavesPage() {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const { canApprove, user } = usePermission();
//   const hasApprovePermission = canApprove('leaves');
//   const employeeId: number | undefined =
//     (user as any)?.employeeId ?? (user as any)?.employee_id ?? (user as any)?.id;

//   const [tab, setTab] = useState<Tab>('Overview');

//   useEffect(() => {
//     dispatch(setPageTitle({ title: 'Leave Management', breadcrumb: 'Operations' }));
//   }, [dispatch]);

//   const { data: pendingLeaves, isLoading: pendingLoading } = usePendingLeaves(hasApprovePermission);
//   const { data: myLeaves } = useMyLeaves(employeeId);
//   const { data: myBalances } = useLeaveBalances(employeeId);
//   const { data: leaveTypes } = useLeaveTypes();
//   const { data: policy } = useLeavePolicy(hasApprovePermission);
//   const { data: holidaysData, isLoading: holidaysLoading } = useHolidayList();
//   const holidays = holidaysData ?? [];
//   const approveLeave = useApproveLeave();
//   const rejectLeave = useRejectLeave();
//   const employeeOptions = useEmployeeOptions();

//   const pendingCount = pendingLeaves?.length ?? 0;
//   const todayIso = new Date().toISOString().slice(0, 10);

//   const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
//   const [rejectReason, setRejectReason] = useState('');
//   const closeRejectModal = () => { setRejectTargetId(null); setRejectReason(''); };
//   const confirmReject = () => {
//     if (!rejectTargetId || !rejectReason.trim()) return;
//     rejectLeave.mutate({ id: rejectTargetId, reason: rejectReason.trim() }, { onSuccess: closeRejectModal });
//   };

//   const subtitleParts = [
//     'EL', 'CL', 'Short (1h)', 'Special', 'Half day',
//     `Sandwich ${policy?.sandwich_enabled ? 'on' : 'off'}`,
//     `${pendingCount} pending`,
//   ];

//   return (
//     <AppShell>
//       <div className="pg-enter">
//         <div className="ph" style={{ alignItems: 'flex-end', justifyContent: 'space-between', display: 'flex' }}>
//           <div>
//             <h1 style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Leave Management</h1>
//             <p style={{ color: 'var(--ink4)', fontSize: 12.5 }}>{subtitleParts.join(' · ')}</p>
//           </div>
//           <div style={{ display: 'flex', gap: 8 }}>
//             <button className="btn btn-sec btn-sm" onClick={() => setTab('Policy')}>Policy</button>
//             <button className="btn btn-pri btn-sm" onClick={() => router.push('/leaves/new')}>+ Apply Leave</button>
//           </div>
//         </div>

//         <div style={{ display: 'flex', gap: 4, margin: '12px 0 14px', background: 'var(--surface2)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
//           {TABS.map((t) => (
//             <button
//               key={t}
//               className="btn btn-sm"
//               onClick={() => setTab(t)}
//               style={{
//                 background: tab === t ? 'var(--surface)' : 'transparent',
//                 color: tab === t ? 'var(--ink)' : 'var(--ink4)',
//                 boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
//                 fontWeight: tab === t ? 600 : 500,
//                 border: 'none',
//               }}
//             >
//               {t}
//             </button>
//           ))}
//         </div>

//         {tab === 'Overview' && (
//           <OverviewTab
//             hasApprovePermission={hasApprovePermission}
//             pendingLeaves={pendingLeaves}
//             pendingLoading={pendingLoading}
//             pendingCount={pendingCount}
//             myLeaves={myLeaves}
//             myBalances={myBalances}
//             holidays={holidays}
//             todayIso={todayIso}
//             approveLeave={approveLeave}
//             setRejectTargetId={setRejectTargetId}
//             rejectTargetId={rejectTargetId}
//           />
//         )}

//         {tab === 'All Requests' && (
//           <AllRequestsTab canApprove={hasApprovePermission} approveLeave={approveLeave} setRejectTargetId={setRejectTargetId} />
//         )}

//         {tab === 'Balances' && (
//           <BalancesTab hasApprovePermission={hasApprovePermission} myBalances={myBalances} />
//         )}

//         {tab === 'Holidays & Special' && (
//           <HolidaysSpecialTab canManage={hasApprovePermission} holidays={holidays} holidaysLoading={holidaysLoading} employeeOptions={employeeOptions} />
//         )}

//         {tab === 'Policy' && <PolicyTab canManage={hasApprovePermission} leaveTypes={leaveTypes} policy={policy} />}

//         {tab === 'Triggers' && (
//           <div className="card" style={{ padding: 32, fontSize: 12.5, color: 'var(--ink4)' }}>
//             No trigger-builder integration is wired up here — nothing in the files shared so far defines what this
//             tab should show (your original demo called an undefined <code>tbRender('leaves')</code>). Point me at
//             that module's API and I'll wire this tab up properly.
//           </div>
//         )}
//       </div>

//       <Modal
//         open={rejectTargetId !== null}
//         onClose={closeRejectModal}
//         title="Reject Leave Request"
//         subtitle="This reason will be shared with the employee."
//         footer={
//           <>
//             <button className="btn btn-sec" onClick={closeRejectModal} disabled={rejectLeave.isPending}>Cancel</button>
//             <button className="btn btn-pri" onClick={confirmReject} disabled={rejectLeave.isPending || !rejectReason.trim()}>
//               {rejectLeave.isPending ? 'Rejecting…' : 'OK'}
//             </button>
//           </>
//         }
//       >
//         <Field label="Reason for Rejection">
//           <textarea
//             rows={3}
//             autoFocus
//             placeholder="Explain why this leave request is being rejected…"
//             value={rejectReason}
//             onChange={(e) => setRejectReason(e.target.value)}
//             style={{ ...inputBaseStyle, resize: 'vertical', fontFamily: 'inherit' }}
//           />
//         </Field>
//       </Modal>
//     </AppShell>
//   );
// }

// // ============================================================================
// // OVERVIEW TAB
// // ============================================================================
// function OverviewTab({
//   hasApprovePermission, pendingLeaves, pendingLoading, pendingCount, myLeaves, myBalances,
//   holidays, todayIso, approveLeave, setRejectTargetId, rejectTargetId,
// }: any) {
//   const { data: companyBalances } = useCompanyLeaveBalances(undefined, hasApprovePermission);
//   const { data: approvedToday } = useLeaves(
//     hasApprovePermission ? { status: 'Approved', limit: 200 } : undefined,
//   );

//   // No dedicated "on leave today" endpoint — approximated client-side from
//   // the approved-requests page. Fine for a stat card; would need a real
//   // date-range filter on GET /leaves to be exact at scale.
//   const onLeaveToday = useMemo(() => {
//     if (!hasApprovePermission || !approvedToday) return 0;
//     return approvedToday.filter((r: any) => r.from_date <= todayIso && r.to_date >= todayIso).length;
//   }, [approvedToday, todayIso, hasApprovePermission]);

//   const avgEl = useMemo(() => {
//     if (hasApprovePermission && companyBalances?.length) {
//       return (companyBalances.reduce((s: number, b: any) => s + Number(b.EL || 0), 0) / companyBalances.length).toFixed(1);
//     }
//     const own = (myBalances ?? []).find((b: any) => b.code === 'EL');
//     return own ? Number(own.available).toFixed(1) : '—';
//   }, [companyBalances, myBalances, hasApprovePermission]);

//   const holidaysRemaining = useMemo(
//     () => holidays.filter((h: Holiday) => h.date >= todayIso).length,
//     [holidays, todayIso],
//   );

//   const now = new Date();
//   const [calYear, setCalYear] = useState(now.getFullYear());
//   const [calMonth, setCalMonth] = useState(now.getMonth());
//   const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
//   const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
//   const firstWeekday = new Date(calYear, calMonth, 1).getDay();
//   const holidayDates = new Set(holidays.map((h: Holiday) => h.date));
//   const leaveDates = new Set(
//     (myLeaves ?? [])
//       .filter((l: any) => l.status !== 'Cancelled')
//       .flatMap((l: any) => {
//         const out: string[] = [];
//         let d = new Date(l.from_date + 'T00:00:00');
//         const end = new Date(l.to_date + 'T00:00:00');
//         while (d <= end) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
//         return out;
//       }),
//   );
//   const goPrev = () => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); };
//   const goNext = () => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); };

//   return (
//     <>
//       <div className="g4 mb14">
//         <StatCard label="Pending Approvals" value={pendingCount} color="var(--amber)" />
//         <StatCard label="On Leave Today" value={onLeaveToday} color="var(--green)" />
//         <StatCard label="Avg EL Balance" value={`${avgEl}d`} color="var(--blue)" />
//         <StatCard label="Holidays Remaining" value={holidaysRemaining} color="var(--pink)" />
//       </div>

//       <div className="g2">
//         <div className="card">
//           <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//             Pending Approvals
//           </div>
//           {!hasApprovePermission ? (
//             <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>You don't have permission to approve leave requests.</div>
//           ) : pendingLoading ? (
//             <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//           ) : pendingCount === 0 ? (
//             <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
//           ) : (
//             <div className="tw">
//               <table>
//                 <thead>
//                   <tr>
//                     {['Employee', 'Type', 'Dates', 'Days', 'Reason', ''].map((h) => (
//                       <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {pendingLeaves.map((req: any) => {
//                     const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
//                     const rowBusy = approvingThis || rejectTargetId === req.id;
//                     return (
//                       <tr key={req.id}>
//                         <td><strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong></td>
//                         <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
//                         <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
//                         <td style={{ color: 'var(--ink3)' }}>{req.days}</td>
//                         <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
//                         <td>
//                           <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.55 : 1, justifyContent: 'flex-end' }}>
//                             <Chip variant="green" onClick={() => { if (!rowBusy) approveLeave.mutate(req.id); }}>{approvingThis ? '…' : 'Approve'}</Chip>
//                             <Chip variant="red" onClick={() => { if (!rowBusy) setRejectTargetId(req.id); }}>Reject</Chip>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//           <div className="card" style={{ padding: 16 }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//               <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>Balances</span>
//               <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 11.5, color: 'var(--blue)' }}>View all</a>
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
//               {(myBalances ?? []).map((b: any) => (
//                 <div key={b.leave_type_id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
//                   <div style={{ fontSize: 9.5, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.02em' }}>{b.code}</div>
//                   <div style={{ fontSize: 18, fontWeight: 600 }}>{b.available}</div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="card cp">
//             <div className="ct" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <button type="button" className="btn btn-sec btn-sm" onClick={goPrev} aria-label="Previous month">‹</button>
//               <span style={{ fontWeight: 500, fontSize: 12.5 }}>{monthLabel}</span>
//               <button type="button" className="btn btn-sec btn-sm" onClick={goNext} aria-label="Next month">›</button>
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginTop: 9, marginBottom: 6 }}>
//               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
//                 <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink4)', padding: 3 }}>{d}</div>
//               ))}
//               {[
//                 ...Array(firstWeekday).fill(null),
//                 ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
//               ].map((day, i) => {
//                 if (day === null) return <div key={i} />;
//                 const iso = `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`;
//                 const isToday = iso === todayIso;
//                 const isHoliday = holidayDates.has(iso);
//                 const isLeave = leaveDates.has(iso);
//                 const bg = isLeave ? 'var(--green-lt)' : isHoliday ? 'var(--purple-lt)' : 'transparent';
//                 return (
//                   <div key={i} style={{
//                     textAlign: 'center', fontSize: 11, fontWeight: isToday ? 600 : 400,
//                     padding: '6px 0', borderRadius: 6, background: bg,
//                     boxShadow: isToday ? 'inset 0 0 0 1.5px var(--blue)' : undefined,
//                   }}>
//                     {day}
//                   </div>
//                 );
//               })}
//             </div>
//             <div style={{ display: 'flex', gap: 12, fontSize: 10.5, flexWrap: 'wrap' }}>
//               <LegendDot color="var(--green-lt)" label="Leave" />
//               <LegendDot color="var(--purple-lt)" label="Holiday" />
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <div style={{ width: 8, height: 8, borderRadius: 2, boxShadow: 'inset 0 0 0 1.5px var(--blue)' }} />
//                 <span style={{ color: 'var(--ink4)' }}>Today</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function LegendDot({ color, label }: { color: string; label: string }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//       <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
//       <span style={{ color: 'var(--ink4)' }}>{label}</span>
//     </div>
//   );
// }

// // ============================================================================
// // ALL REQUESTS TAB
// // ============================================================================
// function AllRequestsTab({ canApprove, approveLeave, setRejectTargetId }: any) {
//   const [status, setStatus] = useState<string>('');
//   const [typeId, setTypeId] = useState<string>('');
//   const { data: leaveTypes } = useLeaveTypes();
//   const { data: leaves, isLoading } = useLeaves({
//     status: (status || undefined) as any,
//     leave_type_id: typeId ? Number(typeId) : undefined,
//     limit: 100,
//   });
//   const cancelLeave = useCancelLeave();

//   return (
//     <div className="card">
//       <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>Leave requests</span>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 150 }}>
//             <option value="">All statuses</option>
//             {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
//           </Select>
//           <Select value={typeId} onChange={(e) => setTypeId(e.target.value)} style={{ width: 130 }}>
//             <option value="">All types</option>
//             {(leaveTypes ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.code}</option>)}
//           </Select>
//         </div>
//       </div>
//       {isLoading ? (
//         <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//       ) : !leaves?.length ? (
//         <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No leave requests match.</div>
//       ) : (
//         <div className="tw">
//           <table>
//             <thead>
//               <tr>
//                 {['Employee', 'Type', 'Dates', 'Days', 'Reason', 'Status', 'Applied', 'Action'].map((h) => (
//                   <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {leaves.map((req: any) => {
//                 const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
//                 const cancellingThis = cancelLeave.isPending && cancelLeave.variables === req.id;
//                 return (
//                   <tr key={req.id}>
//                     <td>
//                       <strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong>
//                       <div style={{ fontSize: 10.5, color: 'var(--ink4)' }}>{req.ref_no}</div>
//                     </td>
//                     <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
//                     <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
//                     <td style={{ color: 'var(--ink3)' }}>
//                       {req.leaveType?.unit === 'minutes' ? `${req.minutes} min` : req.days}
//                       {req.sandwich_days > 0 && <span style={{ color: 'var(--amber)', marginLeft: 6, fontSize: 11 }}>sandwich {req.sandwich_days}</span>}
//                     </td>
//                     <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
//                     <td><Chip variant={statusToVariant(req.status)}>{req.status}</Chip></td>
//                     <td style={{ color: 'var(--ink3)' }}>{req.applied_at ? formatDateRange(req.applied_at, req.applied_at) : '—'}</td>
//                     <td>
//                       <div style={{ display: 'flex', gap: 8 }}>
//                         {req.status === 'Pending' && canApprove && (
//                           <>
//                             <a href="#" onClick={(e) => { e.preventDefault(); approveLeave.mutate(req.id); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>{approvingThis ? '…' : 'Approve'}</a>
//                             <a href="#" onClick={(e) => { e.preventDefault(); setRejectTargetId(req.id); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>Reject</a>
//                           </>
//                         )}
//                         {['Pending', 'Approved'].includes(req.status) && (
//                           <a href="#" onClick={(e) => { e.preventDefault(); if (!cancellingThis) cancelLeave.mutate(req.id); }} style={{ fontSize: 11.5, color: 'var(--blue)' }}>
//                             {cancellingThis ? '…' : 'Cancel'}
//                           </a>
//                         )}
//                         {!(req.status === 'Pending' || req.status === 'Approved') && <span style={{ color: 'var(--ink4)' }}>—</span>}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// // ============================================================================
// // BALANCES TAB
// // ============================================================================
// function BalancesTab({ hasApprovePermission, myBalances }: any) {
//   const { data: companyBalances, isLoading } = useCompanyLeaveBalances(undefined, hasApprovePermission);

//   if (!hasApprovePermission) {
//     return (
//       <div className="card">
//         <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//           Leave balances
//         </div>
//         <div style={{ padding: 24, fontSize: 12, color: 'var(--ink3)' }}>
//           {(myBalances ?? []).map((b: any) => (
//             <div key={b.leave_type_id} style={{ marginBottom: 6 }}>{b.code} — {b.available} of {b.allocated}</div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="card">
//       <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//         Leave balances (calendar year)
//       </div>
//       {isLoading ? (
//         <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
//       ) : !companyBalances?.length ? (
//         <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No employees found.</div>
//       ) : (
//         <div className="tw">
//           <table>
//             <thead>
//               <tr>
//                 {['Employee', 'EL', 'CL', 'Special', 'Short Leave (this month)'].map((h) => (
//                   <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {companyBalances.map((row: any) => (
//                 <tr key={row.employee_id}>
//                   <td>
//                     <strong style={{ fontWeight: 500 }}>{row.name}</strong>
//                     <div style={{ fontSize: 10.5, color: 'var(--ink4)' }}>{row.employee_code}</div>
//                   </td>
//                   <td>{row.EL}</td>
//                   <td>{row.CL}</td>
//                   <td style={{ color: row.SPECIAL > 0 ? 'var(--blue)' : undefined }}>{row.SPECIAL}</td>
//                   <td>{Math.max(0, row.short_allocated_minutes - row.short_used_minutes)} / {row.short_allocated_minutes} min</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// // ============================================================================
// // HOLIDAYS & SPECIAL TAB
// // ============================================================================
// function HolidaysSpecialTab({ canManage, holidays, holidaysLoading, employeeOptions }: any) {
//   const [holDate, setHolDate] = useState('');
//   const [holName, setHolName] = useState('');
//   const createHoliday = useCreateHoliday();
//   const deleteHoliday = useDeleteHoliday();

//   const [splEmployee, setSplEmployee] = useState<number | ''>('');
//   const [splDate, setSplDate] = useState('');
//   const [splDays, setSplDays] = useState('1');
//   const [splNote, setSplNote] = useState('');
//   const { data: leaveTypes } = useLeaveTypes();
//   const specialLeaveType = (leaveTypes ?? []).find((t: any) => t.code === 'SPECIAL');
//   const creditSpecialLeave = useCreditSpecialLeave();
//   const { data: credits } = useLeaveCredits(undefined, canManage);

//   const todayIso = new Date().toISOString().slice(0, 10);
//   const sortedHolidays = [...holidays].sort((a: Holiday, b: Holiday) => a.date.localeCompare(b.date));

//   const submitHoliday = () => {
//     if (!holDate || !holName.trim()) return;
//     createHoliday.mutate(
//       { date: holDate, name: holName.trim() },
//       { onSuccess: () => { setHolDate(''); setHolName(''); } },
//     );
//   };

//   const submitCredit = () => {
//     if (!splEmployee || !specialLeaveType || !splDate || Number(splDays) <= 0) return;
//     creditSpecialLeave.mutate({
//       employee_id: Number(splEmployee),
//       leave_type_id: specialLeaveType.id,
//       credit_date: splDate,
//       days: Number(splDays),
//       note: splNote || undefined,
//     });
//   };

//   return (
//     <div className="g2">
//       <div className="card">
//         <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//           Company holidays
//         </div>
//         {canManage && (
//           <div style={{ display: 'flex', gap: 10, padding: 14, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
//             <TextInput type="date" value={holDate} onChange={(e) => setHolDate(e.target.value)} style={{ width: 160, flexShrink: 0 }} disabled={createHoliday.isPending} />
//             <TextInput type="text" placeholder="Holiday name" value={holName} onChange={(e) => setHolName(e.target.value)} style={{ flex: 1 }} disabled={createHoliday.isPending} />
//             <button
//               className="btn btn-pri btn-sm"
//               onClick={submitHoliday}
//               disabled={createHoliday.isPending || !holDate || !holName.trim()}
//               style={{ flexShrink: 0 }}
//             >
//               {createHoliday.isPending ? 'Adding…' : 'Add'}
//             </button>
//           </div>
//         )}
//         <div className="tw">
//           <table>
//             <thead>
//               <tr>
//                 <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Date</th>
//                 <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Name</th>
//                 <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Status</th>
//                 {canManage && <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}></th>}
//               </tr>
//             </thead>
//             <tbody>
//               {sortedHolidays.map((h: Holiday) => {
//                 const removingThis = deleteHoliday.isPending && deleteHoliday.variables === h.id;
//                 return (
//                   <tr key={h.id} style={{ opacity: removingThis ? 0.5 : 1 }}>
//                     <td>{formatDateRange(h.date, h.date)}</td>
//                     <td><strong style={{ fontWeight: 500 }}>{h.name}</strong></td>
//                     <td>
//                       <Chip variant={h.date >= todayIso ? 'green' : 'gray'}>{h.date >= todayIso ? 'Upcoming' : 'Past'}</Chip>
//                     </td>
//                     {canManage && (
//                       <td>
//                         <a
//                           href="#"
//                           onClick={(e) => { e.preventDefault(); if (!removingThis) deleteHoliday.mutate(h.id); }}
//                           style={{ fontSize: 11.5, color: 'var(--blue)', pointerEvents: removingThis ? 'none' : 'auto' }}
//                         >
//                           {removingThis ? 'Removing…' : 'Remove'}
//                         </a>
//                       </td>
//                     )}
//                   </tr>
//                 );
//               })}
//               {!sortedHolidays.length && (
//                 <tr>
//                   <td colSpan={canManage ? 4 : 3} style={{ padding: 20, color: 'var(--ink4)', fontSize: 12 }}>
//                     {holidaysLoading ? 'Loading…' : 'No holidays configured.'}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="card">
//         <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//           Credit special leave
//         </div>
//         {canManage ? (
//           <div style={{ padding: 20 }}>
//             <p style={{ fontSize: 12, color: 'var(--ink4)', margin: '0 0 18px', lineHeight: 1.5 }}>
//               Employees who work on a holiday earn special leave. Credit days here; they can apply them as Special Leave.
//             </p>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
//               <Field label="Employee">
//                 <Select value={splEmployee} onChange={(e) => setSplEmployee(e.target.value ? Number(e.target.value) : '')}>
//                   <option value="">Select…</option>
//                   {employeeOptions.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
//                 </Select>
//               </Field>
//               <Field label="Holiday worked">
//                 <TextInput type="date" value={splDate} onChange={(e) => setSplDate(e.target.value)} />
//               </Field>
//             </div>
//             <div style={{ marginBottom: 16 }}>
//               <Field label="Days earned">
//                 <TextInput type="number" min={0.5} step={0.5} value={splDays} onChange={(e) => setSplDays(e.target.value)} />
//               </Field>
//             </div>
//             <div style={{ marginBottom: 18 }}>
//               <Field label="Note">
//                 <TextInput type="text" placeholder="e.g. Worked on Republic Day" value={splNote} onChange={(e) => setSplNote(e.target.value)} />
//               </Field>
//             </div>
//             <button
//               className="btn btn-pri btn-sm"
//               onClick={submitCredit}
//               disabled={creditSpecialLeave.isPending || !specialLeaveType}
//             >
//               {creditSpecialLeave.isPending ? 'Crediting…' : 'Credit special leave'}
//             </button>
//             {!specialLeaveType && (
//               <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 10 }}>
//                 No leave type with code "SPECIAL" found for this company — create one under the Policy tab first.
//               </p>
//             )}
//           </div>
//         ) : (
//           <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>You don't have permission to credit special leave.</div>
//         )}

//         <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)' }}>
//           Credit history
//         </div>
//         <div className="tw">
//           <table>
//             <thead>
//               <tr>
//                 {['Employee', 'Holiday', 'Days', 'Note'].map((h) => (
//                   <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {(credits ?? []).map((c: any) => {
//                 const emp = employeeOptions.find((e: any) => e.id === c.employee_id);
//                 return (
//                   <tr key={c.id}>
//                     <td>{emp?.name ?? `#${c.employee_id}`}</td>
//                     <td>{formatDateRange(c.credit_date, c.credit_date)}{c.holiday_name ? ` · ${c.holiday_name}` : ''}</td>
//                     <td>{c.days}</td>
//                     <td style={{ color: 'var(--ink3)' }}>{c.note || '—'}</td>
//                   </tr>
//                 );
//               })}
//               {!credits?.length && (
//                 <tr><td colSpan={4} style={{ padding: 20, color: 'var(--ink4)', fontSize: 12 }}>No special leave credits yet.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ============================================================================
// // POLICY TAB
// // ============================================================================
// function PolicyTab({ canManage, leaveTypes, policy }: any) {
//   const updatePolicy = useUpdateLeavePolicy();
//   const updateType = useUpdateLeaveType();

//   const [sandwichEnabled, setSandwichEnabled] = useState(policy?.sandwich_enabled ?? true);
//   const [includeWO, setIncludeWO] = useState(policy?.sandwich_include_weekly_off ?? true);
//   const [includeHol, setIncludeHol] = useState(policy?.sandwich_include_holidays ?? true);

//   useEffect(() => {
//     if (!policy) return;
//     setSandwichEnabled(policy.sandwich_enabled);
//     setIncludeWO(policy.sandwich_include_weekly_off);
//     setIncludeHol(policy.sandwich_include_holidays);
//   }, [policy]);

//   if (!canManage) {
//     return (
//       <div className="card" style={{ padding: 24, fontSize: 12.5, color: 'var(--ink4)' }}>
//         You don't have permission to view or edit leave policy.
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div style={{ background: 'var(--blue-lt)', color: 'var(--blue)', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
//         Super Admin / HR can set advance notice, backdating limits, quotas, and sandwich rules per leave type.
//         Weekly offs come from each employee's assigned Weekly Off master (not a company-wide day list).
//       </div>

//       <div className="card" style={{ padding: 20, marginBottom: 16 }}>
//         <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sandwich policy</div>
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
//           <CheckboxRow checked={sandwichEnabled} onChange={setSandwichEnabled} label="Enable sandwich policy globally" />
//           <CheckboxRow checked={includeWO} onChange={setIncludeWO} label="Count weekly offs between leave days" />
//           <CheckboxRow checked={includeHol} onChange={setIncludeHol} label="Count holidays between leave days" />
//         </div>

//         <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, fontSize: 11.5, color: 'var(--ink4)', marginBottom: 12, lineHeight: 1.5 }}>
//           <strong style={{ color: 'var(--ink2)', display: 'block', marginBottom: 4 }}>Weekly offs are per employee</strong>
//           Each employee's assigned <strong>Weekly Off</strong> master preset is used for sandwich and chargeable-day
//           calculation. Presets like "Sunday + 2nd & 4th Saturday" are evaluated per date.
//         </div>
//         <p style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 16 }}>
//           Example: employee with Sat+Sun off takes leave Fri–Mon → 4 days charged when sandwich is on.
//         </p>

//         <button
//           className="btn btn-pri btn-sm"
//           disabled={updatePolicy.isPending}
//           onClick={() => updatePolicy.mutate({
//             sandwich_enabled: sandwichEnabled,
//             sandwich_include_weekly_off: includeWO,
//             sandwich_include_holidays: includeHol,
//           })}
//         >
//           {updatePolicy.isPending ? 'Saving…' : 'Save sandwich policy'}
//         </button>
//       </div>

//       {(leaveTypes ?? []).map((type: any) => (
//         <LeaveTypePolicyCard key={type.id} type={type} onSave={(patch: any) => updateType.mutate({ id: type.id, data: patch })} saving={updateType.isPending} />
//       ))}
//     </div>
//   );
// }

// function LeaveTypePolicyCard({ type, onSave, saving }: any) {
//   const [enabled, setEnabled] = useState(type.is_active);
//   const [minAdvance, setMinAdvance] = useState(type.min_advance_days);
//   const [maxBackdate, setMaxBackdate] = useState(type.max_backdate_days);
//   const [quota, setQuota] = useState(type.days_per_year);
//   const [monthlyQuota, setMonthlyQuota] = useState(type.monthly_quota_minutes);
//   const [sandwichApplies, setSandwichApplies] = useState(type.sandwich_applies);

//   const isDayType = type.unit === 'day' && !type.is_earned && type.code !== 'HALF';
//   const isShort = type.unit === 'minutes';
//   const isHalf = type.code === 'HALF';

//   return (
//     <div className="card" style={{ padding: 20, marginBottom: 14 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//           <Chip variant={LEAVE_TYPE_VARIANT[type.code] ?? 'blue'}>{type.code}</Chip>
//           <strong style={{ fontSize: 14 }}>{type.name}</strong>
//         </div>
//         <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink3)', cursor: 'pointer' }}>
//           <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 15, height: 15 }} />
//           Enabled
//         </label>
//       </div>

//       <p style={{ fontSize: 12, color: 'var(--ink4)', margin: '0 0 18px', lineHeight: 1.5 }}>
//         {isShort ? '1 hour / month — full 60 min or two 30-min slots.'
//           : isHalf ? 'First half or second half. Deducts 0.5 day from the linked leave type.'
//           : type.is_earned ? 'Earned by working on holidays. Balance is credited by HR/Admin.'
//           : 'Must be applied within the configured advance/backdate window.'}
//       </p>

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, marginBottom: 18 }}>
//         <Field label="Min advance days" hint="Leave start must be at least this many days after today">
//           <TextInput type="number" min={0} value={minAdvance} onChange={(e) => setMinAdvance(Number(e.target.value))} />
//         </Field>
//         <Field label="Max backdate days" hint="0 = cannot apply after taking leave">
//           <TextInput type="number" min={0} value={maxBackdate} onChange={(e) => setMaxBackdate(Number(e.target.value))} />
//         </Field>
//         {isDayType && (
//           <Field label="Annual quota (days)">
//             <TextInput type="number" min={0} step={0.5} value={quota} onChange={(e) => setQuota(Number(e.target.value))} />
//           </Field>
//         )}
//         {isShort && (
//           <Field label="Monthly quota (minutes)">
//             <TextInput type="number" min={0} value={monthlyQuota} onChange={(e) => setMonthlyQuota(Number(e.target.value))} />
//           </Field>
//         )}
//       </div>

//       <div style={{ marginBottom: 18 }}>
//         <CheckboxRow checked={sandwichApplies} onChange={setSandwichApplies} label="Sandwich policy applies" />
//       </div>

//       <button
//         className="btn btn-sec btn-sm"
//         disabled={saving}
//         onClick={() => onSave({
//           is_active: enabled,
//           min_advance_days: minAdvance,
//           max_backdate_days: maxBackdate,
//           days_per_year: isDayType ? quota : undefined,
//           monthly_quota_minutes: isShort ? monthlyQuota : undefined,
//           sandwich_applies: sandwichApplies,
//         })}
//       >
//         {saving ? 'Saving…' : 'Save'}
//       </button>
//     </div>
//   );
// }








'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip, statusToVariant } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
import { usePermission } from '../../../features/auth/hooks/usePermission';
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
import type { Holiday } from '../../../services/api/leave.service';
// CORRECTED — was `apiClient` + a guessed `GET /employees`, silently
// swallowing any failure. searchManagers is a real, already-proven function:
// your own ApplyLeaveForm.tsx already imports it from this exact file to
// populate its admin employee-search dropdown, so it's a known-real endpoint
// instead of another guess.
// import { searchManagers } from '../../../services/api/employee.service';

// ============================================================================
// ASSUMPTIONS THAT NEED VERIFYING AGAINST YOUR ACTUAL PROJECT
// ----------------------------------------------------------------------------
// 1. Employee list: searchManagers('') is called once on mount to get a
//    roster for the dropdowns below. If searchManagers requires a minimum
//    query length, is scoped to "managers" specifically (its name suggests
//    it might only return people eligible to be picked as a manager, not
//    every employee), or paginates/limits results, this will show a partial
//    or empty list — check the console warning this now logs, and swap in
//    a dedicated "list all employees" function if one exists instead.
// 2. Sandwich days / per-day breakdown: the backend's `apply()` currently
//    trusts whatever `days` the client sends — nothing server-side computes
//    sandwich days or writes LeaveRequestDay rows yet (that's the
//    lvCalcDays-equivalent from your original JS demo, never ported to the
//    backend). The "sandwich 1" tag in Image 2's All Requests table will
//    only ever show real data once that calculation service exists; for now
//    `sandwich_days` reads straight from whatever the client posted.
// 3. "Triggers" tab (rightmost tab in every image): nothing in any file
//    you've shared references what this is (your original JS demo called an
//    undefined `tbRender('leaves')`). Left as a clearly-labeled placeholder.
// ============================================================================

// function useEmployeeOptions() {
//   const [options, setOptions] = useState<{ id: number; name: string; employee_code?: string }[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let cancelled = false;
//     setError(null);

//     searchManagers('')
//       .then((res: any) => {
//         if (cancelled) return;
//         const rows = res?.data?.data ?? res?.data ?? [];
//         if (!Array.isArray(rows) || rows.length === 0) {
//           console.warn(
//             '[useEmployeeOptions] searchManagers("") returned no rows — check whether it requires ' +
//             'a minimum query length, is scoped to managers only, or the response shape differs from res.data.data.',
//             res,
//           );
//         }
//         setOptions(rows.map((e: any) => ({
//           id: e.id,
//           name: [e.first_name, e.last_name].filter(Boolean).join(' ') || e.employee_code || `#${e.id}`,
//           employee_code: e.employee_code,
//         })));
//       })
//       .catch((err: any) => {
//         if (cancelled) return;
//         console.error('[useEmployeeOptions] searchManagers("") failed:', err);
//         setError(err?.message || 'Failed to load employees');
//         setOptions([]);
//       });

//     return () => { cancelled = true; };
//   }, []);

//   return { options, error };
// }

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
// "form-input" / "form-select" classes. Those were a guess at your CSS and the
// guess was wrong: <label> is inline by default in plain HTML, so without a
// class that actually sets display:block, the label text and the input just
// ran together on one line ("Min advance days2" in your screenshot). These
// use inline styles for every layout-critical property so they render
// correctly regardless of what your global stylesheet defines.
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

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBaseStyle, ...props.style }} />;
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

export default function LeavesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canApprove, user } = usePermission();
  const hasApprovePermission = canApprove('leaves');
  const employeeId: number | undefined =
    (user as any)?.employeeId ?? (user as any)?.employee_id ?? (user as any)?.id;

  const [tab, setTab] = useState<Tab>('Overview');

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
            <button className="btn btn-pri btn-sm" onClick={() => router.push('/leaves/new')}>+ Apply Leave</button>
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
            setRejectTargetId={setRejectTargetId}
            rejectTargetId={rejectTargetId}
          />
        )}

        {tab === 'All Requests' && (
          <AllRequestsTab canApprove={hasApprovePermission} approveLeave={approveLeave} setRejectTargetId={setRejectTargetId} />
        )}

        {tab === 'Balances' && (
          <BalancesTab hasApprovePermission={hasApprovePermission} myBalances={myBalances} />
        )}

        {tab === 'Holidays & Special' && (
          // <HolidaysSpecialTab
          //   canManage={hasApprovePermission}
          //   holidays={holidays}
          //   holidaysLoading={holidaysLoading}
          //   employeeOptions={employeeOptions}
          //   employeeOptionsError={employeeOptionsError}
          // />
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

        {/* {tab === 'Triggers' && (
          <div className="card" style={{ padding: 32, fontSize: 12.5, color: 'var(--ink4)' }}>
            No trigger-builder integration is wired up here — nothing in the files shared so far defines what this
            tab should show (your original demo called an undefined <code>tbRender('leaves')</code>). Point me at
            that module's API and I'll wire this tab up properly.
          </div>
        )} */}
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
    </AppShell>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function OverviewTab({
  hasApprovePermission, pendingLeaves, pendingLoading, pendingCount, myLeaves, myBalances,
  holidays, todayIso, approveLeave, setRejectTargetId, rejectTargetId,
}: any) {
  const { data: companyBalances } = useCompanyLeaveBalances(undefined, hasApprovePermission);
  const { data: approvedToday } = useLeaves(
    hasApprovePermission ? { status: 'Approved', limit: 200 } : undefined,
  );

  // No dedicated "on leave today" endpoint — approximated client-side from
  // the approved-requests page. Fine for a stat card; would need a real
  // date-range filter on GET /leaves to be exact at scale.
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
          </div>
          {!hasApprovePermission ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>You don't have permission to approve leave requests.</div>
          ) : pendingLoading ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>Loading…</div>
          ) : pendingCount === 0 ? (
            <div style={{ padding: 24, fontSize: 12, color: 'var(--ink4)' }}>No pending leave requests.</div>
          ) : (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    {['Employee', 'Type', 'Dates', 'Days', 'Reason', ''].map((h) => (
                      <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map((req: any) => {
                    const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
                    const rowBusy = approvingThis || rejectTargetId === req.id;
                    return (
                      <tr key={req.id}>
                        <td><strong style={{ fontWeight: 500 }}>{[req.employee?.first_name, req.employee?.last_name].filter(Boolean).join(' ') || '—'}</strong></td>
                        <td><Chip variant={LEAVE_TYPE_VARIANT[req.leaveType?.code ?? ''] ?? 'blue'}>{req.leaveType?.code ?? '—'}</Chip></td>
                        <td style={{ color: 'var(--ink3)' }}>{formatDateRange(req.from_date, req.to_date)}</td>
                        <td style={{ color: 'var(--ink3)' }}>{req.days}</td>
                        <td style={{ color: 'var(--ink3)' }}>{req.reason || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, opacity: rowBusy ? 0.55 : 1, justifyContent: 'flex-end' }}>
                            <Chip variant="green" onClick={() => { if (!rowBusy) approveLeave.mutate(req.id); }}>{approvingThis ? '…' : 'Approve'}</Chip>
                            <Chip variant="red" onClick={() => { if (!rowBusy) setRejectTargetId(req.id); }}>Reject</Chip>
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
    </>
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
function AllRequestsTab({ canApprove, approveLeave, setRejectTargetId }: any) {
  const [status, setStatus] = useState<string>('');
  const [typeId, setTypeId] = useState<string>('');
  const { data: leaveTypes } = useLeaveTypes();
  const { data: leaves, isLoading } = useLeaves({
    status: (status || undefined) as any,
    leave_type_id: typeId ? Number(typeId) : undefined,
    limit: 100,
  });
  const cancelLeave = useCancelLeave();

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
        <div className="tw">
          <table>
            <thead>
              <tr>
                {['Employee', 'Type', 'Dates', 'Days', 'Reason', 'Status', 'Applied', 'Action'].map((h) => (
                  <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map((req: any) => {
                const approvingThis = approveLeave.isPending && approveLeave.variables === req.id;
                const cancellingThis = cancelLeave.isPending && cancelLeave.variables === req.id;
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
              })}
            </tbody>
          </table>
        </div>
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
        <div className="tw">
          <table>
            <thead>
              <tr>
                {['Employee', 'EL', 'CL', 'Special', 'Short Leave (this month)'].map((h) => (
                  <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companyBalances.map((row: any) => (
                <tr key={row.employee_id}>
                  <td>
                    <strong style={{ fontWeight: 500 }}>{row.name}</strong>
                    <div style={{ fontSize: 10.5, color: 'var(--ink4)' }}>{row.employee_code}</div>
                  </td>
                  <td>{row.EL}</td>
                  <td>{row.CL}</td>
                  <td style={{ color: row.SPECIAL > 0 ? 'var(--blue)' : undefined }}>{row.SPECIAL}</td>
                  <td>{Math.max(0, row.short_allocated_minutes - row.short_used_minutes)} / {row.short_allocated_minutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Date</th>
                <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Name</th>
                <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>Status</th>
                {canManage && <th style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}></th>}
              </tr>
            </thead>
            <tbody>
              {sortedHolidays.map((h: Holiday) => {
                const removingThis = deleteHoliday.isPending && deleteHoliday.variables === h.id;
                return (
                  <tr key={h.id} style={{ opacity: removingThis ? 0.5 : 1 }}>
                    <td>{formatDateRange(h.date, h.date)}</td>
                    <td><strong style={{ fontWeight: 500 }}>{h.name}</strong></td>
                    <td>
                      <Chip variant={h.date >= todayIso ? 'green' : 'gray'}>{h.date >= todayIso ? 'Upcoming' : 'Past'}</Chip>
                    </td>
                    {canManage && (
                      <td>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (!removingThis) deleteHoliday.mutate(h.id); }}
                          style={{ fontSize: 11.5, color: 'var(--blue)', pointerEvents: removingThis ? 'none' : 'auto' }}
                        >
                          {removingThis ? 'Removing…' : 'Remove'}
                        </a>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!sortedHolidays.length && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} style={{ padding: 20, color: 'var(--ink4)', fontSize: 12 }}>
                    {holidaysLoading ? 'Loading…' : 'No holidays configured.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              {/* <Field label="Employee">
                <Select value={splEmployee} onChange={(e) => setSplEmployee(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">{employeeOptions.length ? 'Select…' : 'No employees found'}</option>
                  {employeeOptions.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </Field> */}

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
        <div className="tw">
          <table>
            <thead>
              <tr>
                {['Employee', 'Holiday', 'Days', 'Note'].map((h) => (
                  <th key={h} style={{ fontWeight: 500, color: 'var(--ink4)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(credits ?? []).map((c: any) => {
                const emp = managedEmployees.find((e: any) => e.id === c.employee_id);
                return (
                  <tr key={c.id}>
                    <td>
                      {emp
                        ? [
                          emp.first_name,
                          emp.middle_name,
                          emp.last_name,
                        ]
                          .filter(Boolean)
                          .join(' ')
                        : `#${c.employee_id}`}
                    </td>
                    <td>{formatDateRange(c.credit_date, c.credit_date)}{c.holiday_name ? ` · ${c.holiday_name}` : ''}</td>
                    <td>{c.days}</td>
                    <td style={{ color: 'var(--ink3)' }}>{c.note || '—'}</td>
                  </tr>
                );
              })}
              {!credits?.length && (
                <tr><td colSpan={4} style={{ padding: 20, color: 'var(--ink4)', fontSize: 12 }}>No special leave credits yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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