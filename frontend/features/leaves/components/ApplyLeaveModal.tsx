// 'use client';
// import React, { useEffect, useMemo, useState } from 'react';
// import { Modal } from '../../../components/ui/Modal';
// import {
//   useLeaveTypes,
//   useLeaveBalances,
//   useShortLeaveBalance,
//   useEmployeeWeeklyOff,
//   useMyManagers,
//   useApplyLeave,
//   useEditLeave,
// } from '../hooks/useLeaves';
// import { ACCENTS, balanceState, LeaveBalanceCard, type LeaveBalanceRow } from './LeaveBalanceVisuals';
// import type { LeaveRequest, LeaveApplicationType } from '../../../services/api/leave.service';

// // ============================================================================
// // Self-contained plain form primitives for the non-balance fields — same
// // approach as the rest of the Leave Management page (inline styles, no
// // dependency on global "form-*" classes).
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

// const LEAVE_TYPE_ORDER: Record<string, number> = { SHORT: 0, EL: 1, CL: 2 };

// function todayIso() {
//   return new Date().toISOString().slice(0, 10);
// }

// function inclusiveDayCount(from: string, to: string) {
//   if (!from || !to) return 0;
//   const f = new Date(from + 'T00:00:00');
//   const t = new Date(to + 'T00:00:00');
//   const diff = Math.round((t.getTime() - f.getTime()) / 86400000);
//   return diff >= 0 ? diff + 1 : 0;
// }

// // ============================================================================
// // ApplyLeaveModal — used for both "Apply Leave" (mode="create") and
// // "Edit Leave Request" (mode="edit"). Renders in-page instead of navigating
// // to /leaves/new. Leave-type picker uses the same ring/balance-card visual
// // as ApplyLeaveForm.tsx.
// //
// // ASSUMPTION: self-service only (no on-behalf-of employee picker).
// // ============================================================================

// interface ApplyLeaveModalProps {
//   open: boolean;
//   onClose: () => void;
//   employeeId?: number;
//   mode: 'create' | 'edit';
//   editingLeave?: LeaveRequest | null;
// }

// export function ApplyLeaveModal({ open, onClose, employeeId, mode, editingLeave }: ApplyLeaveModalProps) {
//   const { data: allTypes } = useLeaveTypes();
//   const sortedTypes = useMemo(
//     () => [...(allTypes ?? [])].sort((a, b) => (LEAVE_TYPE_ORDER[a.code] ?? 99) - (LEAVE_TYPE_ORDER[b.code] ?? 99)),
//     [allTypes],
//   );

//   const { data: balances } = useLeaveBalances(employeeId, undefined, open);
//   const balanceByType = useMemo(
//     () => new Map((balances ?? []).map((b) => [b.leave_type_id, b as LeaveBalanceRow])),
//     [balances],
//   );

//   const now = new Date();
//   const shortType = sortedTypes.find((t) => t.code === 'SHORT');
//   const { data: shortBalance } = useShortLeaveBalance(employeeId, now.getFullYear(), now.getMonth() + 1, open && !!shortType);
//   const shortBalanceAsRow: LeaveBalanceRow | undefined = shortType && shortBalance
//     ? {
//       leave_type_id: shortType.id,
//       name: shortType.name,
//       code: 'SHORT',
//       year: shortBalance.year,
//       allocated: shortBalance.allocated_minutes,
//       used: shortBalance.used_minutes,
//       pending: shortBalance.pending_minutes,
//       carried_forward: 0,
//       available: shortBalance.available_minutes,
//     }
//     : undefined;

//   const { data: weeklyOff } = useEmployeeWeeklyOff(employeeId, open);
//   const { data: myManagers } = useMyManagers(open && mode === 'create');

//   const applyLeave = useApplyLeave();
//   const editLeaveMutation = useEditLeave();
//   const saving = applyLeave.isPending || editLeaveMutation.isPending;

//   const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
//   const [applicationType, setApplicationType] = useState<LeaveApplicationType>('full_day');
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [fromTime, setFromTime] = useState('');
//   const [toTime, setToTime] = useState('');
//   const [minutesChoice, setMinutesChoice] = useState<number>(0);
//   const [reason, setReason] = useState('');
//   const [undertakingAccepted, setUndertakingAccepted] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     if (mode === 'edit' && editingLeave) {
//       setLeaveTypeId(editingLeave.leave_type_id);
//       setApplicationType(editingLeave.leave_application_type);
//       setFromDate(editingLeave.from_date);
//       setToDate(editingLeave.to_date);
//       setFromTime(editingLeave.from_time ?? '');
//       setToTime(editingLeave.to_time ?? '');
//       setMinutesChoice(editingLeave.minutes ?? 0);
//       setReason(editingLeave.reason ?? '');
//       setUndertakingAccepted(editingLeave.undertaking_accepted ?? true);
//     } else {
//       setLeaveTypeId('');
//       setApplicationType('full_day');
//       setFromDate(todayIso());
//       setToDate(todayIso());
//       setFromTime('');
//       setToTime('');
//       setMinutesChoice(0);
//       setReason('');
//       setUndertakingAccepted(false);
//     }
//   }, [open, mode, editingLeave]);

//   const selectedType = useMemo(
//     () => sortedTypes.find((t) => t.id === leaveTypeId) ?? null,
//     [sortedTypes, leaveTypeId],
//   );
//   const isShort = selectedType?.unit === 'minutes';
//   const isHalfSelected = applicationType === 'first_half' || applicationType === 'second_half';

//   const selectedBalance = isShort ? shortBalanceAsRow : balanceByType.get(leaveTypeId as number);
//   const selectedState = balanceState(selectedBalance);

//   function handleTypeSelect(id: number) {
//     const type = sortedTypes.find((t) => t.id === id) ?? null;
//     const bal = type?.code === 'SHORT' ? shortBalanceAsRow : balanceByType.get(id);
//     if (balanceState(bal).blocked) return; // mirrors the card's own disabled state
//     setLeaveTypeId(id);
//     if (!type) return;
//     if (type.unit === 'minutes') {
//       setApplicationType('arrival_late');
//       setMinutesChoice(type.monthly_quota_minutes || 60);
//       setToDate(fromDate || todayIso());
//     } else {
//       setApplicationType('full_day');
//     }
//   }

//   const previewDays = useMemo(() => {
//     if (!selectedType || isShort) return 0;
//     if (isHalfSelected) return 0.5;
//     return inclusiveDayCount(fromDate, toDate);
//   }, [selectedType, isShort, isHalfSelected, fromDate, toDate]);

//   const quantityValue = isShort ? minutesChoice : previewDays;
//   const insufficientBalance =
//     !!selectedBalance && !!quantityValue && quantityValue > selectedBalance.available;

//   const canSubmit =
//     !!selectedType &&
//     !selectedState.blocked &&
//     !insufficientBalance &&
//     reason.trim().length > 0 &&
//     !!fromDate &&
//     (isShort || isHalfSelected ? true : !!toDate) &&
//     (!isShort || (!!fromTime && !!toTime && minutesChoice > 0)) &&
//     (mode === 'edit' || undertakingAccepted);

//   function handleSubmit() {
//     if (!selectedType || !canSubmit) return;

//     const effectiveToDate = isShort || isHalfSelected ? fromDate : toDate;
//     const days = isShort ? 0 : previewDays;
//     const minutes = isShort ? minutesChoice : 0;

//     if (mode === 'create') {
//       if (!employeeId) return;
//       applyLeave.mutate(
//         {
//           employee_id: employeeId,
//           leave_type_id: Number(leaveTypeId),
//           leave_application_type: applicationType,
//           from_date: fromDate,
//           to_date: effectiveToDate,
//           from_time: isShort ? fromTime : undefined,
//           to_time: isShort ? toTime : undefined,
//           days,
//           minutes,
//           reason: reason.trim(),
//           l1_manager_id: myManagers?.l1_manager?.id ?? null,
//           l2_manager_id: myManagers?.l2_manager?.id ?? null,
//           undertaking_accepted: undertakingAccepted,
//         },
//         { onSuccess: onClose },
//       );
//     } else if (editingLeave) {
//       editLeaveMutation.mutate(
//         {
//           id: editingLeave.id,
//           data: {
//             leave_type_id: Number(leaveTypeId),
//             leave_application_type: applicationType,
//             from_date: fromDate,
//             to_date: effectiveToDate,
//             from_time: isShort ? fromTime : null,
//             to_time: isShort ? toTime : null,
//             days,
//             minutes,
//             reason: reason.trim(),
//           },
//         },
//         { onSuccess: onClose },
//       );
//     }
//   }

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={mode === 'edit' ? 'Edit leave request' : 'Apply leave'}
//       subtitle={mode === 'edit' ? 'Only Pending requests can be edited.' : 'Pick a leave type below — the card shows what you actually have left'}
//       footer={
//         <>
//           <button className="btn btn-sec" onClick={onClose} disabled={saving}>Cancel</button>
//           <button className="btn btn-pri" onClick={handleSubmit} disabled={saving || !canSubmit}>
//             {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Submit request'}
//           </button>
//         </>
//       }
//     >
//       <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//         {/* Leave type — ring/balance cards */}
//         <div>
//           <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink3)', marginBottom: 8 }}>
//             Leave type
//           </label>
//           <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//             {sortedTypes.map((t, i) => (
//               <LeaveBalanceCard
//                 key={t.id}
//                 label={t.name}
//                 balance={t.code === 'SHORT' ? shortBalanceAsRow : balanceByType.get(t.id)}
//                 selected={leaveTypeId === t.id}
//                 onSelect={() => handleTypeSelect(t.id)}
//                 accent={ACCENTS[i % ACCENTS.length]}
//                 unit={t.code === 'SHORT' ? 'minute' : 'day'}
//               />
//             ))}
//           </div>

//           {selectedState.blocked && selectedBalance && (
//             <div style={{ marginTop: 10, background: 'rgba(220,38,38,.08)', color: 'var(--danger)', borderRadius: 8, padding: '9px 12px', fontSize: 11.5, fontWeight: 500 }}>
//               {selectedState.usedUp
//                 ? `You've used your entire ${selectedBalance.name} allowance for this year — pick a different leave type above.`
//                 : `Every remaining ${selectedBalance.name} day is on a pending request — pick a different leave type, or wait for approval.`}
//             </div>
//           )}
//         </div>

//         {!isShort && selectedType?.allow_half_day && (
//           <Field label="Day type">
//             <Select
//               value={isHalfSelected ? applicationType : 'full_day'}
//               onChange={(e) => {
//                 const val = e.target.value as LeaveApplicationType;
//                 setApplicationType(val);
//                 if (val !== 'full_day') setToDate(fromDate);
//               }}
//             >
//               <option value="full_day">Full day</option>
//               <option value="first_half">Half day — First half</option>
//               <option value="second_half">Half day — Second half</option>
//             </Select>
//           </Field>
//         )}

//         {isShort && (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
//             <Field label="Variant">
//               <Select value={applicationType} onChange={(e) => setApplicationType(e.target.value as LeaveApplicationType)}>
//                 <option value="arrival_late">Late coming</option>
//                 <option value="leaving_early">Leaving early</option>
//               </Select>
//             </Field>
//             <Field label="Duration">
//               <Select value={minutesChoice} onChange={(e) => setMinutesChoice(Number(e.target.value))}>
//                 <option value={selectedType?.monthly_quota_minutes || 60}>
//                   Full {selectedType?.monthly_quota_minutes || 60} min
//                 </option>
//                 {selectedType?.allow_split && (
//                   <option value={selectedType.split_chunk_minutes}>
//                     Half {selectedType.split_chunk_minutes} min
//                   </option>
//                 )}
//               </Select>
//             </Field>
//           </div>
//         )}

//         {selectedType && (
//           <div style={{ background: 'var(--blue-lt)', color: 'var(--blue)', padding: '9px 12px', borderRadius: 8, fontSize: 11.5 }}>
//             Apply ≥ {selectedType.min_advance_days || 0}d in advance ·{' '}
//             {selectedType.max_backdate_days > 0 ? `backdate up to ${selectedType.max_backdate_days}d` : 'no backdating'} ·{' '}
//             {selectedType.sandwich_applies ? 'sandwich applies' : 'no sandwich'}
//             {weeklyOff?.weeklyOffPreset?.name && ` · Weekly off: ${weeklyOff.weeklyOffPreset.name}`}
//           </div>
//         )}

//         {isShort ? (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
//             <Field label="Date">
//               <TextInput type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setToDate(e.target.value); }} />
//             </Field>
//             <Field label="From time">
//               <TextInput type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
//             </Field>
//             <Field label="To time">
//               <TextInput type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
//             </Field>
//           </div>
//         ) : isHalfSelected ? (
//           <Field label="Date">
//             <TextInput type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setToDate(e.target.value); }} />
//           </Field>
//         ) : (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
//             <Field label="From">
//               <TextInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//             </Field>
//             <Field label="To">
//               <TextInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
//             </Field>
//           </div>
//         )}

//         <Field label="Reason">
//           <textarea
//             rows={3}
//             placeholder="Why are you taking leave?"
//             value={reason}
//             onChange={(e) => setReason(e.target.value)}
//             style={{ ...inputBaseStyle, resize: 'vertical', fontFamily: 'inherit' }}
//           />
//         </Field>

//         {insufficientBalance && selectedBalance && !selectedState.blocked && (
//           <div style={{ background: 'rgba(220,38,38,.08)', color: 'var(--danger)', borderRadius: 8, padding: '9px 12px', fontSize: 11.5, fontWeight: 500 }}>
//             Insufficient {selectedBalance.name} balance — only {selectedBalance.available} {isShort ? 'minute(s)' : 'day(s)'} remaining, requested {quantityValue}.
//           </div>
//         )}

//         <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
//           <strong style={{ color: 'var(--ink2)' }}>Charge preview: </strong>
//           {isShort ? `${minutesChoice} minute(s)` : `${previewDays} day(s)`}
//           <div style={{ fontSize: 10.5, color: 'var(--ink4)', marginTop: 2 }}>
//             Final charged days may be adjusted by sandwich/holiday policy.
//           </div>
//         </div>

//         {mode === 'create' && (
//           <CheckboxRow
//             checked={undertakingAccepted}
//             onChange={setUndertakingAccepted}
//             label="I confirm the information above is accurate."
//           />
//         )}
//       </div>
//     </Modal>
//   );
// }



'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import {
  useLeaveTypes,
  useLeaveBalances,
  useShortLeaveBalance,
  useEmployeeWeeklyOff,
  useMyManagers,
  useApplyLeave,
  useEditLeave,
} from '../hooks/useLeaves';
import { balanceState, type LeaveBalanceRow } from './LeaveBalanceVisuals';
import type { LeaveRequest, LeaveApplicationType } from '../../../services/api/leave.service';

// ============================================================================
// Tailwind form primitives — same visual language as ApplyLeaveForm.tsx
// (rounded-xl, gray-200 borders, 11px uppercase labels, indigo focus ring).
// ============================================================================

const inputClass =
  'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint && <p className="mt-1.5 text-[10.5px] leading-snug text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5 text-[12.5px] text-gray-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
      />
      {label}
    </label>
  );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[11.5px] leading-relaxed text-blue-700">
      {children}
    </div>
  );
}

function WarningBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-medium leading-relaxed text-red-700">
      {children}
    </div>
  );
}

const LEAVE_TYPE_ORDER: Record<string, number> = { SHORT: 0, EL: 1, CL: 2 };

// Full application-type list, matching the old ApplyLeaveForm — half day
// (first_half/second_half) is offered for EVERY non-short leave type, not
// gated behind a per-type "allow_half_day" flag.
const APPLICATION_TYPE_OPTIONS: { value: LeaveApplicationType; label: string; short: boolean }[] = [
  { value: 'arrival_late', label: 'Arrival Late', short: true },
  { value: 'leaving_early', label: 'Leaving Early', short: true },
  { value: 'full_day', label: 'Full Day', short: false },
  { value: 'first_half', label: '1st Half', short: false },
  { value: 'second_half', label: '2nd Half', short: false },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function inclusiveDayCount(from: string, to: string) {
  if (!from || !to) return 0;
  const f = new Date(from + 'T00:00:00');
  const t = new Date(to + 'T00:00:00');
  const diff = Math.round((t.getTime() - f.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

// ============================================================================
// ApplyLeaveModal — used for both "Apply Leave" (mode="create") and
// "Edit Leave Request" (mode="edit"). Renders in-page instead of navigating
// to /leaves/new.
//
// ASSUMPTION: self-service only (no on-behalf-of employee picker).
// ASSUMPTION: widened via a Tailwind width class on the content wrapper —
// if <Modal> has its own size/maxWidth prop, prefer that; I don't have
// that component's source to confirm.
// ============================================================================

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
  mode: 'create' | 'edit';
  editingLeave?: LeaveRequest | null;
}

export function ApplyLeaveModal({ open, onClose, employeeId, mode, editingLeave }: ApplyLeaveModalProps) {
  const { data: allTypes } = useLeaveTypes();
  const sortedTypes = useMemo(
    () => [...(allTypes ?? [])].sort((a, b) => (LEAVE_TYPE_ORDER[a.code] ?? 99) - (LEAVE_TYPE_ORDER[b.code] ?? 99)),
    [allTypes],
  );

  const { data: balances } = useLeaveBalances(employeeId, undefined, open);
  const balanceByType = useMemo(
    () => new Map((balances ?? []).map((b) => [b.leave_type_id, b as LeaveBalanceRow])),
    [balances],
  );

  const now = new Date();
  const shortType = sortedTypes.find((t) => t.code === 'SHORT');
  const { data: shortBalance } = useShortLeaveBalance(employeeId, now.getFullYear(), now.getMonth() + 1, open && !!shortType);
  const shortBalanceAsRow: LeaveBalanceRow | undefined = shortType && shortBalance
    ? {
      leave_type_id: shortType.id,
      name: shortType.name,
      code: 'SHORT',
      year: shortBalance.year,
      allocated: shortBalance.allocated_minutes,
      used: shortBalance.used_minutes,
      pending: shortBalance.pending_minutes,
      carried_forward: 0,
      available: shortBalance.available_minutes,
    }
    : undefined;

  const { data: weeklyOff } = useEmployeeWeeklyOff(employeeId, open);
  const { data: myManagers } = useMyManagers(open && mode === 'create');

  const applyLeave = useApplyLeave();
  const editLeaveMutation = useEditLeave();
  const saving = applyLeave.isPending || editLeaveMutation.isPending;

  const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
  const [applicationType, setApplicationType] = useState<LeaveApplicationType>('full_day');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [minutesChoice, setMinutesChoice] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [undertakingAccepted, setUndertakingAccepted] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && editingLeave) {
      setLeaveTypeId(editingLeave.leave_type_id);
      setApplicationType(editingLeave.leave_application_type);
      setFromDate(editingLeave.from_date);
      setToDate(editingLeave.to_date);
      setFromTime(editingLeave.from_time ?? '');
      setToTime(editingLeave.to_time ?? '');
      setMinutesChoice(editingLeave.minutes ?? 0);
      setReason(editingLeave.reason ?? '');
      setUndertakingAccepted(editingLeave.undertaking_accepted ?? true);
    } else {
      setLeaveTypeId('');
      setApplicationType('full_day');
      setFromDate(todayIso());
      setToDate(todayIso());
      setFromTime('');
      setToTime('');
      setMinutesChoice(0);
      setReason('');
      setUndertakingAccepted(false);
    }
  }, [open, mode, editingLeave]);

  const selectedType = useMemo(
    () => sortedTypes.find((t) => t.id === leaveTypeId) ?? null,
    [sortedTypes, leaveTypeId],
  );
  const isShort = selectedType?.unit === 'minutes';
  const isHalfSelected = applicationType === 'first_half' || applicationType === 'second_half';

  const selectedBalance = isShort ? shortBalanceAsRow : balanceByType.get(leaveTypeId as number);
  const selectedState = balanceState(selectedBalance);

  const applicationTypeOptions = APPLICATION_TYPE_OPTIONS.filter((o) => o.short === isShort);

  function handleTypeChange(id: number) {
    const type = sortedTypes.find((t) => t.id === id) ?? null;
    setLeaveTypeId(id);
    if (!type) return;
    if (type.unit === 'minutes') {
      setApplicationType('arrival_late');
      setMinutesChoice(type.monthly_quota_minutes || 60);
      setToDate(fromDate || todayIso());
    } else {
      setApplicationType('full_day');
    }
  }

  function handleApplicationTypeChange(val: LeaveApplicationType) {
    setApplicationType(val);
    if (val === 'first_half' || val === 'second_half') {
      setToDate(fromDate);
    }
  }

  const previewDays = useMemo(() => {
    if (!selectedType || isShort) return 0;
    if (isHalfSelected) return 0.5;
    return inclusiveDayCount(fromDate, toDate);
  }, [selectedType, isShort, isHalfSelected, fromDate, toDate]);

  const quantityValue = isShort ? minutesChoice : previewDays;
  const insufficientBalance =
    !!selectedBalance && !!quantityValue && quantityValue > selectedBalance.available;

  const canSubmit =
    !!selectedType &&
    !selectedState.blocked &&
    !insufficientBalance &&
    reason.trim().length > 0 &&
    !!fromDate &&
    (isShort || isHalfSelected ? true : !!toDate) &&
    (!isShort || (!!fromTime && !!toTime && minutesChoice > 0)) &&
    (mode === 'edit' || undertakingAccepted);

  function handleSubmit() {
    if (!selectedType || !canSubmit) return;

    const effectiveToDate = isShort || isHalfSelected ? fromDate : toDate;
    const days = isShort ? 0 : previewDays;
    const minutes = isShort ? minutesChoice : 0;

    if (mode === 'create') {
      if (!employeeId) return;
      applyLeave.mutate(
        {
          employee_id: employeeId,
          leave_type_id: Number(leaveTypeId),
          leave_application_type: applicationType,
          from_date: fromDate,
          to_date: effectiveToDate,
          from_time: isShort ? fromTime : undefined,
          to_time: isShort ? toTime : undefined,
          days,
          minutes,
          reason: reason.trim(),
          l1_manager_id: myManagers?.l1_manager?.id ?? null,
          l2_manager_id: myManagers?.l2_manager?.id ?? null,
          undertaking_accepted: undertakingAccepted,
        },
        { onSuccess: onClose },
      );
    } else if (editingLeave) {
      editLeaveMutation.mutate(
        {
          id: editingLeave.id,
          data: {
            leave_type_id: Number(leaveTypeId),
            leave_application_type: applicationType,
            from_date: fromDate,
            to_date: effectiveToDate,
            from_time: isShort ? fromTime : null,
            to_time: isShort ? toTime : null,
            days,
            minutes,
            reason: reason.trim(),
          },
        },
        { onSuccess: onClose },
      );
    }
  }

  const balanceLine = !selectedType
    ? null
    : isShort
      ? shortBalanceAsRow
        ? `Available: ${shortBalanceAsRow.available} min this month (of ${shortBalanceAsRow.allocated} allocated)`
        : 'Loading balance…'
      : selectedBalance
        ? `Available: ${selectedBalance.available} day(s) (of ${selectedBalance.allocated} allocated${selectedBalance.pending ? `, ${selectedBalance.pending} pending` : ''})`
        : selectedType.is_earned
          ? 'Earned leave — balance is credited by HR/Admin'
          : 'No balance record yet — treated as 0 available';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit leave request' : 'Apply leave'}
      subtitle={mode === 'edit' ? 'Only Pending requests can be edited.' : undefined}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-pri" onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Submit request'}
          </button>
        </>
      }
    >
      {/* Widened + spaced out — see the ASSUMPTION note above the component
          if <Modal> has its own width/size prop instead. */}
      <div className="flex max-w-9xl flex-col gap-5">
        {/* Balances — plain text strip, one pill per leave type */}
        {(balances?.length || shortBalanceAsRow) && (
          <div className="flex flex-wrap gap-2">
            {sortedTypes.map((t) => {
              const bal = t.code === 'SHORT' ? shortBalanceAsRow : balanceByType.get(t.id);
              return (
                <span key={t.id} className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                  <span className="font-semibold text-gray-800">{t.code}</span>: {bal ? bal.available : 0}{t.code === 'SHORT' ? 'm' : 'd'}
                </span>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Leave type">
            <Select value={leaveTypeId} onChange={(e) => handleTypeChange(Number(e.target.value))}>
              <option value="">Select…</option>
              {sortedTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Leave application type">
            <Select
              value={applicationType}
              onChange={(e) => handleApplicationTypeChange(e.target.value as LeaveApplicationType)}
              disabled={!selectedType}
            >
              {applicationTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        {balanceLine && (
          <p className="-mt-2 text-[11.5px] text-gray-400">
            {balanceLine}
            {weeklyOff?.weeklyOffPreset?.name && ` · Weekly off: ${weeklyOff.weeklyOffPreset.name}`}
          </p>
        )}

        {selectedState.blocked && selectedBalance && (
          <WarningBanner>
            {selectedState.usedUp
              ? `You've used your entire ${selectedBalance.name} allowance for this year — pick a different leave type above.`
              : `Every remaining ${selectedBalance.name} day is on a pending request — pick a different leave type, or wait for approval.`}
          </WarningBanner>
        )}

        {selectedType && (
          <InfoBanner>
            Apply ≥ {selectedType.min_advance_days || 0}d in advance ·{' '}
            {selectedType.max_backdate_days > 0 ? `backdate up to ${selectedType.max_backdate_days}d` : 'no backdating'} ·{' '}
            {selectedType.sandwich_applies ? 'sandwich applies' : 'no sandwich'}
          </InfoBanner>
        )}

        {isShort ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Field label="Date">
              <TextInput type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setToDate(e.target.value); }} />
            </Field>
            <Field label="From time">
              <TextInput type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
            </Field>
            <Field label="To time">
              <TextInput type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
            </Field>
            <Field label="Duration">
              <Select value={minutesChoice} onChange={(e) => setMinutesChoice(Number(e.target.value))}>
                <option value={selectedType?.monthly_quota_minutes || 60}>
                  Full {selectedType?.monthly_quota_minutes || 60} min
                </option>
                {selectedType?.allow_split && (
                  <option value={selectedType.split_chunk_minutes}>
                    Half {selectedType.split_chunk_minutes} min
                  </option>
                )}
              </Select>
            </Field>
          </div>
        ) : isHalfSelected ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Date">
              <TextInput type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setToDate(e.target.value); }} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="From">
              <TextInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Field>
            <Field label="To">
              <TextInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
          </div>
        )}

        <Field label="Reason">
          <textarea
            rows={3}
            placeholder="Why are you taking leave?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${inputClass} resize-y font-sans`}
          />
        </Field>

        {insufficientBalance && selectedBalance && !selectedState.blocked && (
          <WarningBanner>
            Insufficient {selectedBalance.name} balance — only {selectedBalance.available} {isShort ? 'minute(s)' : 'day(s)'} remaining, requested {quantityValue}.
          </WarningBanner>
        )}

        <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-[13px] text-gray-800">
          <span className="font-semibold text-gray-700">Charge preview: </span>
          {isShort ? `${minutesChoice} minute(s)` : `${previewDays} day(s)`}
          <p className="mt-1 text-[10.5px] leading-snug text-gray-400">
            Final charged days may be adjusted by sandwich/holiday policy.
          </p>
        </div>

        {mode === 'create' && (
          <CheckboxRow
            checked={undertakingAccepted}
            onChange={setUndertakingAccepted}
            label="I confirm the information above is accurate."
          />
        )}
      </div>
    </Modal>
  );
}