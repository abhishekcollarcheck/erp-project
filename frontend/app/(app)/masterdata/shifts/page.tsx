// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
// import { Chip } from '@/components/ui/Chip';
// import { DataTable, type Column } from '@/components/ui/DataTable';
// import { Select } from '@/components/ui/Select';
// import {
//   useShifts,
//   useCreateShift,
//   useUpdateShift,
//   useDeleteShift,
// } from '@/features/shift/hooks/useShift';
// import { Shift } from '@/services/api/shift.service';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';

// export default function ShiftsPage() {
//   const { canCreate, canEdit, canDelete } = usePermission();

//   const [filterText, setFilterText] = useState('');

//   // Form State
//   const [label, setLabel] = useState('');
//   const [startTime, setStartTime] = useState('09:45');
//   const [endTime, setEndTime] = useState('19:00');
//   const [halfDayTime, setHalfDayTime] = useState('14:22');
//   const [daySpan, setDaySpan] = useState<'1 day' | '2 days'>('1 day');

//   // Editing State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editLabel, setEditLabel] = useState('');
//   const [editStartTime, setEditStartTime] = useState('');
//   const [editEndTime, setEditEndTime] = useState('');
//   const [editHalfDayTime, setEditHalfDayTime] = useState('');
//   const [editDaySpan, setEditDaySpan] = useState<'1 day' | '2 days'>('1 day');

//   // React Query Hooks
//   const { data: shifts = [], isLoading } = useShifts();
//   const createShift = useCreateShift();
//   const updateShift = useUpdateShift();
//   const deleteShift = useDeleteShift();

//   const handleCreate = async () => {
//     if (!label.trim() || !canCreate('shifts')) return;

//     await createShift.mutateAsync({
//       label: label.trim(),
//       start_time: startTime || null,
//       end_time: endTime || null,
//       half_day_time: halfDayTime || null,
//       day_span: daySpan,
//     });

//     handleCancelForm();
//   };

//   const handleCancelForm = () => {
//     setLabel('');
//     setStartTime('09:45');
//     setEndTime('19:00');
//     setHalfDayTime('14:22');
//     setDaySpan('1 day');
//   };

//   const startEdit = (shift: Shift) => {
//     if (!canEdit('shifts')) return;
//     setEditingId(shift.id);
//     setEditLabel(shift.label);
//     setEditStartTime(shift.start_time || '');
//     setEditEndTime(shift.end_time || '');
//     setEditHalfDayTime(shift.half_day_time || '');
//     setEditDaySpan(shift.day_span);
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editLabel.trim() || !canEdit('shifts')) return;

//     await updateShift.mutateAsync({
//       id,
//       data: {
//         label: editLabel.trim(),
//         start_time: editStartTime || null,
//         end_time: editEndTime || null,
//         half_day_time: editHalfDayTime || null,
//         day_span: editDaySpan,
//       },
//     });

//     setEditingId(null);
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDelete('shifts')) return;
//     if (confirm('Are you sure you want to delete this shift?')) {
//       await deleteShift.mutateAsync(id);
//     }
//   };

//   const formatTimeDisplay = (time: string | null) => {
//     if (!time) return '-';
//     const [h, m] = time.split(':');
//     let hour = parseInt(h, 10);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     hour = hour % 12 || 12;
//     return `${hour}:${m} ${ampm}`;
//   };

//   const filteredShifts = useMemo(() => {
//     return shifts.filter((s) =>
//       s.label.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [shifts, filterText]);

//   const canModify = canEdit('shifts') || canDelete('shifts');

//   const shiftColumns: Column<Shift>[] = [
//     {
//       key: 'label', header: 'Shift',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
//         </div>
//       ) : <strong>{shift.label}</strong>,
//     },
//     {
//       key: 'start', header: 'Start', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.start_time)}</Chip>,
//     },
//     {
//       key: 'end', header: 'End', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.end_time)}</Chip>,
//     },
//     {
//       key: 'half', header: 'Half', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editHalfDayTime} onChange={(e) => setEditHalfDayTime(e.target.value)} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.half_day_time)}</Chip>,
//     },
//     {
//       key: 'span', header: 'Span', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <Select
//             value={editDaySpan}
//             onChange={(v) => setEditDaySpan(v as '1 day' | '2 days')}
//             options={[
//               { value: '1 day', label: '1 day' },
//               { value: '2 days', label: '2 days' },
//             ]}
//           />
//         </div>
//       ) : <>{shift.day_span}</>,
//     },
//     // Actions column only rendered at all if the user can edit or delete —
//     // avoids an empty/dead column for read-only roles.
//     ...(canModify ? [{
//       key: 'actions', header: 'Actions', align: 'right' as const,
//       render: (shift: Shift) => (
//         <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
//           {editingId === shift.id ? (
//             <>
//               <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => handleSaveEdit(shift.id)}>
//                 <Check size={14} /> Save
//               </button>
//               <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>
//                 <X size={14} />
//               </button>
//             </>
//           ) : (
//             <>
//               {canEdit('shifts') && (
//                 <button type="button" className="btn btn-ghost btn-sm" title="Edit Shift" onClick={() => startEdit(shift)}>
//                   <Pencil size={13} />
//                 </button>
//               )}
//               {canDelete('shifts') && (
//                 <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} title="Delete Shift" onClick={() => handleDelete(shift.id)}>
//                   <Trash2 size={13} />
//                 </button>
//               )}
//             </>
//           )}
//         </div>
//       ),
//     }] : []),
//   ];

//   return (
//     <PermissionGuard permission="shifts:view">
//       <AppShell>
//         <MasterDataLayout>
//           <div className="pg-enter">
//             <div className="ph">
//               <div>
//                 <h1>Shifts</h1>
//                 <p>Name, start, end &amp; half-day in one place · Syncs to employee forms</p>
//               </div>
//             </div>

//             {/* New Shift Creation — hidden entirely for roles without shifts:create */}
//             {canCreate('shifts') && (
//               <div className="card cp mb14">
//                 <div className="ct">New shift</div>

//                 <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
//                   <div className="fg" style={{ minWidth: 220, flex: 1 }}>
//                     <label>Shift Name / Marking</label>
//                     <input
//                       type="text"
//                       value={label}
//                       onChange={(e) => setLabel(e.target.value)}
//                       placeholder="e.g. Shift (9.45 A - 7.0 P)"
//                     />
//                   </div>

//                   <div className="fg" style={{ width: 120 }}>
//                     <label>Start</label>
//                     <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
//                   </div>

//                   <div className="fg" style={{ width: 120 }}>
//                     <label>End</label>
//                     <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
//                   </div>

//                   <div className="fg" style={{ width: 130 }}>
//                     <label>Half-Day Mark</label>
//                     <input type="time" value={halfDayTime} onChange={(e) => setHalfDayTime(e.target.value)} />
//                   </div>

//                   <div className="fg" style={{ width: 120 }}>
//                     <label>Day Span</label>
//                     <Select
//                       value={daySpan}
//                       onChange={(v) => setDaySpan(v as '1 day' | '2 days')}
//                       options={[
//                         { value: '1 day', label: '1 day' },
//                         { value: '2 days', label: '2 days' },
//                       ]}
//                     />
//                   </div>

//                   <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
//                     <button type="button" className="btn btn-sec btn-sm" onClick={handleCancelForm}>
//                       Cancel
//                     </button>
//                     <button type="button" className="btn btn-pri btn-sm" disabled={createShift.isPending || !label.trim()} onClick={handleCreate}>
//                       <Plus size={14} />
//                       Save Shift
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <DataTable
//               columns={shiftColumns}
//               data={filteredShifts}
//               isLoading={isLoading}
//               rowKey={(s) => s.id}
//               minWidth="720px"
//               emptyText="No shifts found."
//               toolbar={
//                 <>
//                   <div className="search-bar" style={{ maxWidth: 240 }}>
//                     <span style={{ color: 'var(--ink4)' }}>⌕</span>
//                     <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter shifts..." />
//                   </div>
//                   <Chip variant="gray">{filteredShifts.length}</Chip>
//                 </>
//               }
//             />
//           </div>
//         </MasterDataLayout>
//       </AppShell>
//     </PermissionGuard>
//   );
// }






















// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
// import { Chip } from '@/components/ui/Chip';
// import { DataTable, type Column } from '@/components/ui/DataTable';
// import { Select } from '@/components/ui/Select';
// import {
//   useShifts,
//   useCreateShift,
//   useUpdateShift,
//   useDeleteShift,
// } from '@/features/shift/hooks/useShift';
// import { Shift } from '@/services/api/shift.service';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, FieldPermProvider, useFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';

// // Backend field_key (from the field-permission builder) → actual Shift model
// // property. Only thing to touch if either side is ever renamed.
// const FIELD_KEY_TO_PROP = {
//   shift_name: 'label',
//   shift_start: 'start_time',
//   shift_end: 'end_time',
//   shift_half_day_mark: 'half_day_time',
//   shift_day_span: 'day_span',
// } as const;

// type ShiftFieldKey = keyof typeof FIELD_KEY_TO_PROP;

// // ── Outer: page shell, fetches field perms, sets up the provider ─────────────
// export default function ShiftsPage() {
//   const { isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('shifts');

//   return (
//     <PermissionGuard permission="shifts:view">
//       <FieldPermProvider fp={fp} completionPct={100} bypass={isSuperAdmin}>
//         <ShiftsContent fieldsLoading={fieldsLoading} />
//       </FieldPermProvider>
//     </PermissionGuard>
//   );
// }

// // ── Inner: all the actual page logic, reads permissions via useFieldPerm() ───
// function ShiftsContent({ fieldsLoading }: { fieldsLoading: boolean }) {
//   const { canCreate, canEdit, canDelete } = usePermission();
//   const f = useFieldPerm();
//   const isVisible = (key: ShiftFieldKey) => f(key).can_view;
//   const canAddField = (key: ShiftFieldKey) => f(key).can_view && f(key).can_add;
//   const canEditField = (key: ShiftFieldKey) => f(key).can_view && f(key).can_edit;

//   const [filterText, setFilterText] = useState('');

//   // Form State
//   const [label, setLabel] = useState('');
//   const [startTime, setStartTime] = useState('09:45');
//   const [endTime, setEndTime] = useState('19:00');
//   const [halfDayTime, setHalfDayTime] = useState('14:22');
//   const [daySpan, setDaySpan] = useState<'1 day' | '2 days'>('1 day');

//   // Editing State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editLabel, setEditLabel] = useState('');
//   const [editStartTime, setEditStartTime] = useState('');
//   const [editEndTime, setEditEndTime] = useState('');
//   const [editHalfDayTime, setEditHalfDayTime] = useState('');
//   const [editDaySpan, setEditDaySpan] = useState<'1 day' | '2 days'>('1 day');

//   // React Query Hooks
//   const { data: shifts = [], isLoading } = useShifts();
//   const createShift = useCreateShift();
//   const updateShift = useUpdateShift();
//   const deleteShift = useDeleteShift();

//   const handleCreate = async () => {
//     if (!label.trim() || !canCreate('shifts')) return;

//     await createShift.mutateAsync({
//       label: label.trim(),
//       start_time: canAddField('shift_start') ? (startTime || null) : null,
//       end_time: canAddField('shift_end') ? (endTime || null) : null,
//       half_day_time: canAddField('shift_half_day_mark') ? (halfDayTime || null) : null,
//       day_span: canAddField('shift_day_span') ? daySpan : '1 day',
//     });

//     handleCancelForm();
//   };

//   const handleCancelForm = () => {
//     setLabel('');
//     setStartTime('09:45');
//     setEndTime('19:00');
//     setHalfDayTime('14:22');
//     setDaySpan('1 day');
//   };

//   const startEdit = (shift: Shift) => {
//     if (!canEdit('shifts')) return;
//     setEditingId(shift.id);
//     setEditLabel(shift.label);
//     setEditStartTime(shift.start_time || '');
//     setEditEndTime(shift.end_time || '');
//     setEditHalfDayTime(shift.half_day_time || '');
//     setEditDaySpan(shift.day_span);
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editLabel.trim() || !canEdit('shifts')) return;

//     await updateShift.mutateAsync({
//       id,
//       data: {
//         label: editLabel.trim(),
//         start_time: canEditField('shift_start') ? (editStartTime || null) : undefined,
//         end_time: canEditField('shift_end') ? (editEndTime || null) : undefined,
//         half_day_time: canEditField('shift_half_day_mark') ? (editHalfDayTime || null) : undefined,
//         day_span: canEditField('shift_day_span') ? editDaySpan : undefined,
//       },
//     });

//     setEditingId(null);
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDelete('shifts')) return;
//     if (confirm('Are you sure you want to delete this shift?')) {
//       await deleteShift.mutateAsync(id);
//     }
//   };

//   const formatTimeDisplay = (time: string | null) => {
//     if (!time) return '-';
//     const [h, m] = time.split(':');
//     let hour = parseInt(h, 10);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     hour = hour % 12 || 12;
//     return `${hour}:${m} ${ampm}`;
//   };

//   const filteredShifts = useMemo(() => {
//     return shifts.filter((s) =>
//       s.label.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [shifts, filterText]);

//   const canModify = canEdit('shifts') || canDelete('shifts');

//   const allColumns: Record<ShiftFieldKey, Column<Shift>> = {
//     shift_name: {
//       key: 'label', header: 'Shift',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} disabled={!canEditField('shift_name')} />
//         </div>
//       ) : <strong>{shift.label}</strong>,
//     },
//     shift_start: {
//       key: 'start', header: 'Start', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} disabled={!canEditField('shift_start')} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.start_time)}</Chip>,
//     },
//     shift_end: {
//       key: 'end', header: 'End', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} disabled={!canEditField('shift_end')} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.end_time)}</Chip>,
//     },
//     shift_half_day_mark: {
//       key: 'half', header: 'Half', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editHalfDayTime} onChange={(e) => setEditHalfDayTime(e.target.value)} disabled={!canEditField('shift_half_day_mark')} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.half_day_time)}</Chip>,
//     },
//     shift_day_span: {
//       key: 'span', header: 'Span', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <Select
//             value={editDaySpan}
//             onChange={(v) => setEditDaySpan(v as '1 day' | '2 days')}
//             options={[
//               { value: '1 day', label: '1 day' },
//               { value: '2 days', label: '2 days' },
//             ]}
//           />
//         </div>
//       ) : <>{shift.day_span}</>,
//     },
//   };

//   const shiftColumns: Column<Shift>[] = [
//     ...(Object.keys(FIELD_KEY_TO_PROP) as ShiftFieldKey[])
//       .filter(isVisible)
//       .map(key => allColumns[key]),
//     ...(canModify ? [{
//       key: 'actions', header: 'Actions', align: 'right' as const,
//       render: (shift: Shift) => (
//         <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
//           {editingId === shift.id ? (
//             <>
//               <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => handleSaveEdit(shift.id)}>
//                 <Check size={14} /> Save
//               </button>
//               <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>
//                 <X size={14} />
//               </button>
//             </>
//           ) : (
//             <>
//               {canEdit('shifts') && (
//                 <button type="button" className="btn btn-ghost btn-sm" title="Edit Shift" onClick={() => startEdit(shift)}>
//                   <Pencil size={13} />
//                 </button>
//               )}
//               {canDelete('shifts') && (
//                 <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} title="Delete Shift" onClick={() => handleDelete(shift.id)}>
//                   <Trash2 size={13} />
//                 </button>
//               )}
//             </>
//           )}
//         </div>
//       ),
//     }] : []),
//   ];

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="pg-enter">
//           <div className="ph">
//             <div>
//               <h1>Shifts</h1>
//               <p>Name, start, end &amp; half-day in one place · Syncs to employee forms</p>
//             </div>
//           </div>

//           {canCreate('shifts') && !fieldsLoading && (
//             <div className="card cp mb14">
//               <div className="ct">New shift</div>

//               <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
//                 {canAddField('shift_name') && (
//                   <div className="fg" style={{ minWidth: 220, flex: 1 }}>
//                     <label>Shift Name / Marking</label>
//                     <input
//                       type="text"
//                       value={label}
//                       onChange={(e) => setLabel(e.target.value)}
//                       placeholder="e.g. Shift (9.45 A - 7.0 P)"
//                     />
//                   </div>
//                 )}

//                 {canAddField('shift_start') && (
//                   <div className="fg" style={{ width: 120 }}>
//                     <label>Start</label>
//                     <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
//                   </div>
//                 )}

//                 {canAddField('shift_end') && (
//                   <div className="fg" style={{ width: 120 }}>
//                     <label>End</label>
//                     <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
//                   </div>
//                 )}

//                 {canAddField('shift_half_day_mark') && (
//                   <div className="fg" style={{ width: 130 }}>
//                     <label>Half-Day Mark</label>
//                     <input type="time" value={halfDayTime} onChange={(e) => setHalfDayTime(e.target.value)} />
//                   </div>
//                 )}

//                 {canAddField('shift_day_span') && (
//                   <div className="fg" style={{ width: 120 }}>
//                     <label>Day Span</label>
//                     <Select
//                       value={daySpan}
//                       onChange={(v) => setDaySpan(v as '1 day' | '2 days')}
//                       options={[
//                         { value: '1 day', label: '1 day' },
//                         { value: '2 days', label: '2 days' },
//                       ]}
//                     />
//                   </div>
//                 )}

//                 <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
//                   <button type="button" className="btn btn-sec btn-sm" onClick={handleCancelForm}>
//                     Cancel
//                   </button>
//                   <button type="button" className="btn btn-pri btn-sm" disabled={createShift.isPending || !label.trim()} onClick={handleCreate}>
//                     <Plus size={14} />
//                     Save Shift
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           <DataTable
//             columns={shiftColumns}
//             data={filteredShifts}
//             isLoading={isLoading || fieldsLoading}
//             rowKey={(s) => s.id}
//             minWidth="720px"
//             emptyText="No shifts found."
//             toolbar={
//               <>
//                 <div className="search-bar" style={{ maxWidth: 240 }}>
//                   <span style={{ color: 'var(--ink4)' }}>⌕</span>
//                   <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter shifts..." />
//                 </div>
//                 <Chip variant="gray">{filteredShifts.length}</Chip>
//               </>
//             }
//           />
//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }



// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
// import { Chip } from '@/components/ui/Chip';
// import { DataTable, type Column } from '@/components/ui/DataTable';
// import { Select } from '@/components/ui/Select';
// import {
//   useShifts,
//   useCreateShift,
//   useUpdateShift,
//   useDeleteShift,
// } from '@/features/shift/hooks/useShift';
// import { Shift } from '@/services/api/shift.service';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, FieldPermProvider, useFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';

// // Backend field_key (from the field-permission builder) → actual Shift model
// // property. Only thing to touch if either side is ever renamed.
// const FIELD_KEY_TO_PROP = {
//   shift_name: 'label',
//   shift_start: 'start_time',
//   shift_end: 'end_time',
//   shift_half_day_mark: 'half_day_time',
//   shift_day_span: 'day_span',
// } as const;

// type ShiftFieldKey = keyof typeof FIELD_KEY_TO_PROP;

// // ── Outer: page shell, fetches field perms, sets up the provider ─────────────
// export default function ShiftsPage() {
//   const { isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('shifts');

//   return (
//     <PermissionGuard permission="shifts:view">
//       <FieldPermProvider fp={fp} completionPct={100} bypass={isSuperAdmin}>
//         <ShiftsContent fieldsLoading={fieldsLoading} />
//       </FieldPermProvider>
//     </PermissionGuard>
//   );
// }

// // ── Inner: all the actual page logic, reads permissions via useFieldPerm() ───
// function ShiftsContent({ fieldsLoading }: { fieldsLoading: boolean }) {
//   const { canCreate, canEdit, canDelete } = usePermission();
//   const f = useFieldPerm();
//   const isVisible = (key: ShiftFieldKey) => f(key).can_view;
//   const canAddField = (key: ShiftFieldKey) => f(key).can_view && f(key).can_add;
//   const canEditField = (key: ShiftFieldKey) => f(key).can_view && f(key).can_edit;

//   const [filterText, setFilterText] = useState('');

//   // Form State
//   const [label, setLabel] = useState('');
//   const [startTime, setStartTime] = useState('09:45');
//   const [endTime, setEndTime] = useState('19:00');
//   const [halfDayTime, setHalfDayTime] = useState('14:22');
//   const [daySpan, setDaySpan] = useState<'1 day' | '2 days'>('1 day');

//   // Editing State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editLabel, setEditLabel] = useState('');
//   const [editStartTime, setEditStartTime] = useState('');
//   const [editEndTime, setEditEndTime] = useState('');
//   const [editHalfDayTime, setEditHalfDayTime] = useState('');
//   const [editDaySpan, setEditDaySpan] = useState<'1 day' | '2 days'>('1 day');

//   // React Query Hooks
//   const { data: shifts = [], isLoading } = useShifts();
//   const createShift = useCreateShift();
//   const updateShift = useUpdateShift();
//   const deleteShift = useDeleteShift();

//   const handleCreate = async () => {
//     if (!label.trim() || !canCreate('shifts')) return;

//     await createShift.mutateAsync({
//       label: label.trim(),
//       start_time: canAddField('shift_start') ? (startTime || null) : null,
//       end_time: canAddField('shift_end') ? (endTime || null) : null,
//       half_day_time: canAddField('shift_half_day_mark') ? (halfDayTime || null) : null,
//       day_span: canAddField('shift_day_span') ? daySpan : '1 day',
//     });

//     handleCancelForm();
//   };

//   const handleCancelForm = () => {
//     setLabel('');
//     setStartTime('09:45');
//     setEndTime('19:00');
//     setHalfDayTime('14:22');
//     setDaySpan('1 day');
//   };

//   const startEdit = (shift: Shift) => {
//     if (!canEdit('shifts')) return;
//     setEditingId(shift.id);
//     setEditLabel(shift.label);
//     setEditStartTime(shift.start_time || '');
//     setEditEndTime(shift.end_time || '');
//     setEditHalfDayTime(shift.half_day_time || '');
//     setEditDaySpan(shift.day_span);
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editLabel.trim() || !canEdit('shifts')) return;

//     await updateShift.mutateAsync({
//       id,
//       data: {
//         label: editLabel.trim(),
//         start_time: canEditField('shift_start') ? (editStartTime || null) : undefined,
//         end_time: canEditField('shift_end') ? (editEndTime || null) : undefined,
//         half_day_time: canEditField('shift_half_day_mark') ? (editHalfDayTime || null) : undefined,
//         day_span: canEditField('shift_day_span') ? editDaySpan : undefined,
//       },
//     });

//     setEditingId(null);
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDelete('shifts')) return;
//     if (confirm('Are you sure you want to delete this shift?')) {
//       await deleteShift.mutateAsync(id);
//     }
//   };

//   const formatTimeDisplay = (time: string | null) => {
//     if (!time) return '-';
//     const [h, m] = time.split(':');
//     let hour = parseInt(h, 10);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     hour = hour % 12 || 12;
//     return `${hour}:${m} ${ampm}`;
//   };

//   const filteredShifts = useMemo(() => {
//     return shifts.filter((s) =>
//       s.label.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [shifts, filterText]);

//   const canModify = canEdit('shifts') || canDelete('shifts');

//   const allColumns: Record<ShiftFieldKey, Column<Shift>> = {
//     shift_name: {
//       key: 'label', header: 'Shift',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} disabled={!canEditField('shift_name')} />
//         </div>
//       ) : <strong>{shift.label}</strong>,
//     },
//     shift_start: {
//       key: 'start', header: 'Start', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} disabled={!canEditField('shift_start')} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.start_time)}</Chip>,
//     },
//     shift_end: {
//       key: 'end', header: 'End', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} disabled={!canEditField('shift_end')} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.end_time)}</Chip>,
//     },
//     shift_half_day_mark: {
//       key: 'half', header: 'Half', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="time" value={editHalfDayTime} onChange={(e) => setEditHalfDayTime(e.target.value)} disabled={!canEditField('shift_half_day_mark')} />
//         </div>
//       ) : <Chip variant="blue">{formatTimeDisplay(shift.half_day_time)}</Chip>,
//     },
//     shift_day_span: {
//       key: 'span', header: 'Span', align: 'center',
//       render: (shift) => editingId === shift.id ? (
//         <div className="fg" style={{ margin: 0 }}>
//           <Select
//             value={editDaySpan}
//             onChange={(v) => setEditDaySpan(v as '1 day' | '2 days')}
//             options={[
//               { value: '1 day', label: '1 day' },
//               { value: '2 days', label: '2 days' },
//             ]}
//           />
//         </div>
//       ) : <>{shift.day_span}</>,
//     },
//   };

//   const shiftColumns: Column<Shift>[] = [
//     ...(Object.keys(FIELD_KEY_TO_PROP) as ShiftFieldKey[])
//       .filter(isVisible)
//       .map(key => allColumns[key]),
//     ...(canModify ? [{
//       key: 'actions', header: 'Actions', align: 'right' as const,
//       render: (shift: Shift) => (
//         <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
//           {editingId === shift.id ? (
//             <>
//               <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => handleSaveEdit(shift.id)}>
//                 <Check size={14} /> Save
//               </button>
//               <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>
//                 <X size={14} />
//               </button>
//             </>
//           ) : (
//             <>
//               {canEdit('shifts') && (
//                 <button type="button" className="btn btn-ghost btn-sm" title="Edit Shift" onClick={() => startEdit(shift)}>
//                   <Pencil size={13} />
//                 </button>
//               )}
//               {canDelete('shifts') && (
//                 <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} title="Delete Shift" onClick={() => handleDelete(shift.id)}>
//                   <Trash2 size={13} />
//                 </button>
//               )}
//             </>
//           )}
//         </div>
//       ),
//     }] : []),
//   ];

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="pg-enter">
//           <div className="ph">
//             <div>
//               <h1>Shifts</h1>
//               <p>Name, start, end &amp; half-day in one place · Syncs to employee forms</p>
//             </div>
//           </div>

//           {canCreate('shifts') && !fieldsLoading && (
//             <div className="card cp mb14">
//               <div className="ct">New shift</div>

//               <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
//                 {canAddField('shift_name') && (
//                   <div className="fg" style={{ minWidth: 220, flex: 1 }}>
//                     <label>Shift Name / Marking</label>
//                     <input
//                       type="text"
//                       value={label}
//                       onChange={(e) => setLabel(e.target.value)}
//                       placeholder="e.g. Shift (9.45 A - 7.0 P)"
//                     />
//                   </div>
//                 )}

//                 {canAddField('shift_start') && (
//                   <div className="fg" style={{ width: 120 }}>
//                     <label>Start</label>
//                     <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
//                   </div>
//                 )}

//                 {canAddField('shift_end') && (
//                   <div className="fg" style={{ width: 120 }}>
//                     <label>End</label>
//                     <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
//                   </div>
//                 )}

//                 {canAddField('shift_half_day_mark') && (
//                   <div className="fg" style={{ width: 130 }}>
//                     <label>Half-Day Mark</label>
//                     <input type="time" value={halfDayTime} onChange={(e) => setHalfDayTime(e.target.value)} />
//                   </div>
//                 )}

//                 {canAddField('shift_day_span') && (
//                   <div className="fg" style={{ width: 120 }}>
//                     <label>Day Span</label>
//                     <Select
//                       value={daySpan}
//                       onChange={(v) => setDaySpan(v as '1 day' | '2 days')}
//                       options={[
//                         { value: '1 day', label: '1 day' },
//                         { value: '2 days', label: '2 days' },
//                       ]}
//                     />
//                   </div>
//                 )}

//                 <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
//                   <button type="button" className="btn btn-sec btn-sm" onClick={handleCancelForm}>
//                     Cancel
//                   </button>
//                   <button type="button" className="btn btn-pri btn-sm" disabled={createShift.isPending || !label.trim()} onClick={handleCreate}>
//                     <Plus size={14} />
//                     Save Shift
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           <DataTable
//             columns={shiftColumns}
//             data={filteredShifts}
//             isLoading={isLoading || fieldsLoading}
//             rowKey={(s) => s.id}
//             minWidth="720px"
//             emptyText="No shifts found."
//             toolbar={
//               <>
//                 <div className="search-bar" style={{ maxWidth: 240 }}>
//                   <span style={{ color: 'var(--ink4)' }}>⌕</span>
//                   <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter shifts..." />
//                 </div>
//                 <Chip variant="gray">{filteredShifts.length}</Chip>
//               </>
//             }
//           />
//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }




'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from '@/features/shift/hooks/useShift';
import { Shift } from '@/services/api/shift.service';
import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import {
  useFieldPermissions, resolveFieldPerm, FieldPermProvider, useFieldPerm,
  type FieldPermMap,
} from '@/features/rbac/hooks/useFieldPermissions';
import { FormInput } from '@/components/form/FormInput';
import { FormTimeInput } from '@/components/form/FormTimeInput';
import { FormSelect } from '@/components/form/FormSelect';
import { FormSection } from '@/components/form/FormSection';

// Backend field_key (from the field-permission builder) → actual Shift model
// property. Only thing to touch if either side is ever renamed.
const FIELD_KEY_TO_PROP = {
  shift_name: 'label',
  shift_start: 'start_time',
  shift_end: 'end_time',
  shift_half_day_mark: 'half_day_time',
  shift_day_span: 'day_span',
} as const;

type ShiftFieldKey = keyof typeof FIELD_KEY_TO_PROP;

interface ShiftFormValues {
  shift_name: string;
  shift_start: string;
  shift_end: string;
  shift_half_day_mark: string;
  shift_day_span: '1 day' | '2 days';
}

const CREATE_DEFAULTS: ShiftFormValues = {
  shift_name: '', shift_start: '09:45', shift_end: '19:00',
  shift_half_day_mark: '14:22', shift_day_span: '1 day',
};

// ── Outer: page shell, fetches field perms, sets up the provider (100% —
//    the table rows and edit mode both concern existing/"complete" records) ─
export default function ShiftsPage() {
  const { isSuperAdmin } = usePermission();
  const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('shifts');

  return (
    <PermissionGuard permission="shifts:view">
      <FieldPermProvider fp={fp} completionPct={100} bypass={isSuperAdmin}>
        <ShiftsContent fp={fp} fieldsLoading={fieldsLoading} isSuperAdmin={isSuperAdmin} />
      </FieldPermProvider>
    </PermissionGuard>
  );
}

function ShiftsContent({
  fp, fieldsLoading, isSuperAdmin,
}: { fp: FieldPermMap | undefined; fieldsLoading: boolean; isSuperAdmin: boolean }) {
  const { canCreate, canEdit, canDelete } = usePermission();

  // f() = existing-record permissions (completionPct: 100). Used for table
  // columns and whenever the form is in Edit mode.
  const f = useFieldPerm();
  // fCreate() = new-record permissions (completionPct: 0 — activates can_add's
  // bonus, mirroring the Employee Wizard's onboarding rule). Used only when
  // the form is in New (create) mode.
  const fCreate = useCallback(
    (key: ShiftFieldKey) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );

  const isVisible = (key: ShiftFieldKey) => f(key).can_view;

  const [filterText, setFilterText] = useState('');

  // One form, two modes. editingShift === null → "New shift" (fCreate perms).
  // editingShift set → "Edit shift" (f perms), pre-filled from that row.
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const isEditMode = editingShift !== null;
  const perm = isEditMode ? f : fCreate;

  const shiftForm = useForm<ShiftFormValues>({ defaultValues: CREATE_DEFAULTS });

  const startEdit = (shift: Shift) => {
    if (!canEdit('shifts')) return;
    setEditingShift(shift);
    shiftForm.reset({
      shift_name: shift.label,
      shift_start: shift.start_time || '',
      shift_end: shift.end_time || '',
      shift_half_day_mark: shift.half_day_time || '',
      shift_day_span: shift.day_span,
    });
    // Bring the form into view since it's above the table.
    document.getElementById('shift-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelForm = () => {
    setEditingShift(null);
    shiftForm.reset(CREATE_DEFAULTS);
  };

  // React Query Hooks
  const { data: shifts = [], isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const handleSubmitForm = shiftForm.handleSubmit(async (v) => {
    if (isEditMode && editingShift) {
      if (!canEdit('shifts')) return;
      await updateShift.mutateAsync({
        id: editingShift.id,
        data: {
          label: f('shift_name').can_edit ? v.shift_name.trim() : undefined,
          start_time: f('shift_start').can_edit ? (v.shift_start || null) : undefined,
          end_time: f('shift_end').can_edit ? (v.shift_end || null) : undefined,
          half_day_time: f('shift_half_day_mark').can_edit ? (v.shift_half_day_mark || null) : undefined,
          day_span: f('shift_day_span').can_edit ? v.shift_day_span : undefined,
        },
      });
    } else {
      if (!canCreate('shifts')) return;
      await createShift.mutateAsync({
        label: v.shift_name.trim(),
        start_time: fCreate('shift_start').can_edit ? (v.shift_start || null) : null,
        end_time: fCreate('shift_end').can_edit ? (v.shift_end || null) : null,
        half_day_time: fCreate('shift_half_day_mark').can_edit ? (v.shift_half_day_mark || null) : null,
        day_span: fCreate('shift_day_span').can_edit ? v.shift_day_span : '1 day',
      });
    }
    cancelForm();
  });

  const handleDelete = async (id: number) => {
    if (!canDelete('shifts')) return;
    if (confirm('Are you sure you want to delete this shift?')) {
      // Editing the row you just deleted would be stale — back out of edit mode.
      if (editingShift?.id === id) cancelForm();
      await deleteShift.mutateAsync(id);
    }
  };

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return '-';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) =>
      s.label.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [shifts, filterText]);

  const canModify = canEdit('shifts') || canDelete('shifts');

  const allColumns: Record<ShiftFieldKey, Column<Shift>> = {
    shift_name: { key: 'label', header: 'Shift', render: (shift) => <strong>{shift.label}</strong> },
    shift_start: { key: 'start', header: 'Start', align: 'center', render: (shift) => <Chip variant="blue">{formatTimeDisplay(shift.start_time)}</Chip> },
    shift_end: { key: 'end', header: 'End', align: 'center', render: (shift) => <Chip variant="blue">{formatTimeDisplay(shift.end_time)}</Chip> },
    shift_half_day_mark: { key: 'half', header: 'Half', align: 'center', render: (shift) => <Chip variant="blue">{formatTimeDisplay(shift.half_day_time)}</Chip> },
    shift_day_span: { key: 'span', header: 'Span', align: 'center', render: (shift) => <>{shift.day_span}</> },
  };

  const shiftColumns: Column<Shift>[] = [
    ...(Object.keys(FIELD_KEY_TO_PROP) as ShiftFieldKey[])
      .filter(isVisible)
      .map(key => allColumns[key]),
    ...(canModify ? [{
      key: 'actions', header: 'Actions', align: 'right' as const,
      render: (shift: Shift) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canEdit('shifts') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={editingShift?.id === shift.id ? { color: 'var(--blue)' } : undefined}
              title="Edit Shift"
              onClick={() => startEdit(shift)}
            >
              <Pencil size={13} />
            </button>
          )}
          {canDelete('shifts') && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} title="Delete Shift" onClick={() => handleDelete(shift.id)}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  const isSubmitting = createShift.isPending || updateShift.isPending;

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="pg-enter">
          <div className="ph">
            <div>
              <h1>Shifts</h1>
              <p>Name, start, end &amp; half-day in one place · Syncs to employee forms</p>
            </div>
          </div>

          {(canCreate('shifts') || (isEditMode && canEdit('shifts'))) && !fieldsLoading && (
            <div id="shift-form-card" className="card cp mb14" style={isEditMode ? { border: '1px solid var(--blue-md)' } : undefined}>
              <div className="ct" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{isEditMode ? `Editing "${editingShift?.label}"` : 'New shift'}</span>
                {isEditMode && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={cancelForm} title="Cancel edit">
                    <X size={14} /> Cancel edit
                  </button>
                )}
              </div>

              <FormProvider {...shiftForm}>
                <FormSection
                  fields={[
                    perm('shift_name'), perm('shift_start'), perm('shift_end'),
                    perm('shift_half_day_mark'), perm('shift_day_span'),
                  ]}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ minWidth: 220, flex: 1 }}>
                      <FormInput name="shift_name" label="Shift Name / Marking" required placeholder="e.g. Shift (9.45 A - 7.0 P)" fieldPerm={perm('shift_name')} />
                    </div>
                    <div style={{ width: 120 }}>
                      <FormTimeInput name="shift_start" label="Start" fieldPerm={perm('shift_start')} />
                    </div>
                    <div style={{ width: 120 }}>
                      <FormTimeInput name="shift_end" label="End" fieldPerm={perm('shift_end')} />
                    </div>
                    <div style={{ width: 130 }}>
                      <FormTimeInput name="shift_half_day_mark" label="Half-Day Mark" fieldPerm={perm('shift_half_day_mark')} />
                    </div>
                    <div style={{ width: 120 }}>
                      <FormSelect
                        name="shift_day_span"
                        label="Day Span"
                        options={[
                          { value: '1 day', label: '1 day' },
                          { value: '2 days', label: '2 days' },
                        ]}
                        fieldPerm={perm('shift_day_span')}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button type="button" className="btn btn-sec btn-sm" onClick={cancelForm}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-pri btn-sm"
                        disabled={isSubmitting || !shiftForm.watch('shift_name')?.trim()}
                        onClick={handleSubmitForm}
                      >
                        {!isEditMode && <Plus size={14} />}
                        {isSubmitting ? 'Saving…' : isEditMode ? 'Update Shift' : 'Save Shift'}
                      </button>
                    </div>
                  </div>
                </FormSection>
              </FormProvider>
            </div>
          )}

          <DataTable
            columns={shiftColumns}
            data={filteredShifts}
            isLoading={isLoading || fieldsLoading}
            rowKey={(s) => s.id}
            minWidth="720px"
            emptyText="No shifts found."
            toolbar={
              <>
                <div className="search-bar" style={{ maxWidth: 240 }}>
                  <span style={{ color: 'var(--ink4)' }}>⌕</span>
                  <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter shifts..." />
                </div>
                <Chip variant="gray">{filteredShifts.length}</Chip>
              </>
            }
          />
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}