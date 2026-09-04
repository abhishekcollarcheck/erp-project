// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { Pencil, X, Clock } from 'lucide-react';
// // import { useShifts } from '@/features/shift/hooks/useShift';
// import {
//   useShifts,
//   useCreateShift,
//   useUpdateShift,
//   useDeleteShift,
// } from '@/features/shift/hooks/useShift';
// import { Shift } from '@/services/api/shift.service';

// export default function ShiftsPage() {
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
//     if (!label.trim()) return;

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
//     setStartTime('');
//     setEndTime('');
//     setHalfDayTime('');
//     setDaySpan('1 day');
//   };

//   const startEdit = (shift: Shift) => {
//     setEditingId(shift.id);
//     setEditLabel(shift.label);
//     setEditStartTime(shift.start_time || '');
//     setEditEndTime(shift.end_time || '');
//     setEditHalfDayTime(shift.half_day_time || '');
//     setEditDaySpan(shift.day_span);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editLabel.trim()) return;

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

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
//           {/* Header Bar */}
//           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-gray-900">Shifts</h1>
//               <p className="text-xs text-gray-400">
//                 Name, start, end & half-day in one place · Syncs to employee forms
//               </p>
//             </div>
//             <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
//               AUTO-SAVE ON
//             </span>
//           </div>

//           {/* New Shift Creation Panel */}
//           <div className="my-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
//             <h2 className="mb-3 text-xs font-semibold text-gray-700">New shift</h2>
//             <div className="grid grid-cols-12 gap-3">
//               <div className="col-span-4">
//                 <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   SHIFT NAME / MARKING
//                 </label>
//                 <input
//                   type="text"
//                   value={label}
//                   onChange={(e) => setLabel(e.target.value)}
//                   placeholder="e.g. Shift (9.45 A - 7.0 P)"
//                   className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                 />
//               </div>

//               <div className="col-span-2">
//                 <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   START
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="time"
//                     value={startTime}
//                     onChange={(e) => setStartTime(e.target.value)}
//                     className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div className="col-span-2">
//                 <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   END
//                 </label>
//                 <input
//                   type="time"
//                   value={endTime}
//                   onChange={(e) => setEndTime(e.target.value)}
//                   className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div className="col-span-2">
//                 <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   HALF-DAY MARK
//                 </label>
//                 <input
//                   type="time"
//                   value={halfDayTime}
//                   onChange={(e) => setHalfDayTime(e.target.value)}
//                   className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div className="col-span-2">
//                 <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   DAY SPAN
//                 </label>
//                 <select
//                   value={daySpan}
//                   onChange={(e) => setDaySpan(e.target.value as '1 day' | '2 days')}
//                   className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none focus:border-blue-500"
//                 >
//                   <option value="1 day">1 day</option>
//                   <option value="2 days">2 days</option>
//                 </select>
//               </div>
//             </div>

//             <div className="mt-4 flex justify-end gap-2">
//               <button
//                 onClick={handleCancelForm}
//                 className="rounded-md border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreate}
//                 className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
//               >
//                 Save Shift
//               </button>
//             </div>
//           </div>

//           {/* Table Header Filter */}
//           <div className="flex items-center justify-between py-2">
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => setFilterText(e.target.value)}
//               placeholder="Filter shifts..."
//               className="h-8 w-48 rounded-md border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400 focus:border-blue-400"
//             />
//             <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
//               {filteredShifts.length} shifts
//             </span>
//           </div>

//           {/* Shifts Data Table */}
//           <div className="min-h-0 flex-1 overflow-y-auto">
//             <table className="w-full text-left text-xs border-collapse">
//               <thead>
//                 <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   <th className="py-3 px-2">SHIFT</th>
//                   <th className="py-3 px-2 text-center">START</th>
//                   <th className="py-3 px-2 text-center">END</th>
//                   <th className="py-3 px-2 text-center">HALF</th>
//                   <th className="py-3 px-2 text-center">SPAN</th>
//                   <th className="py-3 px-2 text-right">ACTIONS</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {isLoading ? (
//                   <tr>
//                     <td colSpan={6} className="py-6 text-center text-gray-400">
//                       Loading shifts...
//                     </td>
//                   </tr>
//                 ) : filteredShifts.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="py-6 text-center text-gray-400">
//                       No shifts found.
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredShifts.map((shift) => {
//                     const isEditing = editingId === shift.id;
//                     return (
//                       <tr key={shift.id} className="group hover:bg-gray-50/60">
//                         <td className="py-3 px-2 font-medium text-gray-800">
//                           {isEditing ? (
//                             <input
//                               type="text"
//                               value={editLabel}
//                               onChange={(e) => setEditLabel(e.target.value)}
//                               className="h-7 w-full rounded border border-blue-400 px-2 text-xs"
//                             />
//                           ) : (
//                             shift.label
//                           )}
//                         </td>

//                         <td className="py-3 px-2 text-center">
//                           {isEditing ? (
//                             <input
//                               type="time"
//                               value={editStartTime}
//                               onChange={(e) => setEditStartTime(e.target.value)}
//                               className="h-7 rounded border border-blue-400 px-1 text-xs"
//                             />
//                           ) : (
//                             <span className="inline-block min-w-[64px] rounded bg-gray-100 px-2 py-0.5 text-center text-[11px] font-bold text-blue-900">
//                               {formatTimeDisplay(shift.start_time)}
//                             </span>
//                           )}
//                         </td>

//                         <td className="py-3 px-2 text-center">
//                           {isEditing ? (
//                             <input
//                               type="time"
//                               value={editEndTime}
//                               onChange={(e) => setEditEndTime(e.target.value)}
//                               className="h-7 rounded border border-blue-400 px-1 text-xs"
//                             />
//                           ) : (
//                             <span className="inline-block min-w-[64px] rounded bg-gray-100 px-2 py-0.5 text-center text-[11px] font-bold text-blue-900">
//                               {formatTimeDisplay(shift.end_time)}
//                             </span>
//                           )}
//                         </td>

//                         <td className="py-3 px-2 text-center">
//                           {isEditing ? (
//                             <input
//                               type="time"
//                               value={editHalfDayTime}
//                               onChange={(e) => setEditHalfDayTime(e.target.value)}
//                               className="h-7 rounded border border-blue-400 px-1 text-xs"
//                             />
//                           ) : (
//                             <span className="inline-block min-w-[64px] rounded bg-gray-100 px-2 py-0.5 text-center text-[11px] font-bold text-blue-900">
//                               {formatTimeDisplay(shift.half_day_time)}
//                             </span>
//                           )}
//                         </td>

//                         <td className="py-3 px-2 text-center text-gray-500">
//                           {isEditing ? (
//                             <select
//                               value={editDaySpan}
//                               onChange={(e) => setEditDaySpan(e.target.value as '1 day' | '2 days')}
//                               className="h-7 rounded border border-blue-400 px-1 text-xs"
//                             >
//                               <option value="1 day">1 day</option>
//                               <option value="2 days">2 days</option>
//                             </select>
//                           ) : (
//                             shift.day_span
//                           )}
//                         </td>

//                         <td className="py-3 px-2 text-right">
//                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                             {isEditing ? (
//                               <button
//                                 onClick={() => handleSaveEdit(shift.id)}
//                                 className="text-xs font-semibold text-blue-600 hover:text-blue-800"
//                               >
//                                 Save
//                               </button>
//                             ) : (
//                               <button
//                                 onClick={() => startEdit(shift)}
//                                 className="text-gray-400 hover:text-gray-600"
//                               >
//                                 <Pencil size={13} />
//                               </button>
//                             )}
//                             <button
//                               onClick={() => handleDelete(shift.id)}
//                               className="text-gray-400 hover:text-red-600"
//                             >
//                               <X size={14} />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }



'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from '@/features/shift/hooks/useShift';
import { Shift } from '@/services/api/shift.service';

export default function ShiftsPage() {
  const [filterText, setFilterText] = useState('');

  // Form State
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('09:45');
  const [endTime, setEndTime] = useState('19:00');
  const [halfDayTime, setHalfDayTime] = useState('14:22');
  const [daySpan, setDaySpan] = useState<'1 day' | '2 days'>('1 day');

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editHalfDayTime, setEditHalfDayTime] = useState('');
  const [editDaySpan, setEditDaySpan] = useState<'1 day' | '2 days'>('1 day');

  // React Query Hooks
  const { data: shifts = [], isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const handleCreate = async () => {
    if (!label.trim()) return;

    await createShift.mutateAsync({
      label: label.trim(),
      start_time: startTime || null,
      end_time: endTime || null,
      half_day_time: halfDayTime || null,
      day_span: daySpan,
    });

    handleCancelForm();
  };

  const handleCancelForm = () => {
    setLabel('');
    setStartTime('09:45');
    setEndTime('19:00');
    setHalfDayTime('14:22');
    setDaySpan('1 day');
  };

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setEditLabel(shift.label);
    setEditStartTime(shift.start_time || '');
    setEditEndTime(shift.end_time || '');
    setEditHalfDayTime(shift.half_day_time || '');
    setEditDaySpan(shift.day_span);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editLabel.trim()) return;

    await updateShift.mutateAsync({
      id,
      data: {
        label: editLabel.trim(),
        start_time: editStartTime || null,
        end_time: editEndTime || null,
        half_day_time: editHalfDayTime || null,
        day_span: editDaySpan,
      },
    });

    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this shift?')) {
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

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Shifts</h1>
              <p className="mt-0.5 text-xs text-gray-400">
                Name, start, end & half-day in one place · Syncs to employee forms
              </p>
            </div>
            <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              AUTO-SAVE ON
            </span>
          </div>

          {/* New Shift Creation Card */}
          <div className="my-4 rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold text-gray-700">New shift</h2>
            
            <div className="flex flex-wrap items-end gap-3">
              {/* Shift Name Input */}
              <div className="min-w-[220px] flex-1">
                <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  SHIFT NAME / MARKING
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Shift (9.45 A - 7.0 P)"
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Start Time */}
              <div className="w-28">
                <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  START
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* End Time */}
              <div className="w-28">
                <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  END
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Half-Day Time */}
              <div className="w-32">
                <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  HALF-DAY MARK
                </label>
                <input
                  type="time"
                  value={halfDayTime}
                  onChange={(e) => setHalfDayTime(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Day Span */}
              <div className="w-28">
                <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  DAY SPAN
                </label>
                <select
                  value={daySpan}
                  onChange={(e) => setDaySpan(e.target.value as '1 day' | '2 days')}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="1 day">1 day</option>
                  <option value="2 days">2 days</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelForm}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createShift.isPending || !label.trim()}
                  className="inline-flex h-9 items-center gap-1 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  <Plus size={14} />
                  Save Shift
                </button>
              </div>
            </div>
          </div>

          {/* Table Header Filter & Counter */}
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter shifts..."
              className="h-8 w-52 rounded-md border border-gray-200 bg-white px-3 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {filteredShifts.length} shifts
            </span>
          </div>

          {/* Shifts Data Table */}
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200/70 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  <th className="py-3 px-4 w-[35%]">SHIFT</th>
                  <th className="py-3 px-3 w-[13%] text-center">START</th>
                  <th className="py-3 px-3 w-[13%] text-center">END</th>
                  <th className="py-3 px-3 w-[13%] text-center">HALF</th>
                  <th className="py-3 px-3 w-[13%] text-center">SPAN</th>
                  <th className="py-3 px-4 w-[13%] text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Loading shifts...
                    </td>
                  </tr>
                ) : filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No shifts found.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => {
                    const isEditing = editingId === shift.id;
                    return (
                      <tr key={shift.id} className="group hover:bg-gray-50/80 transition-colors">
                        {/* Shift Label */}
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="h-8 w-full rounded border border-blue-400 px-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            shift.label
                          )}
                        </td>

                        {/* Start Time */}
                        <td className="py-3 px-3 text-center">
                          {isEditing ? (
                            <input
                              type="time"
                              value={editStartTime}
                              onChange={(e) => setEditStartTime(e.target.value)}
                              className="h-8 rounded border border-blue-400 px-1.5 text-xs outline-none"
                            />
                          ) : (
                            <span className="inline-block min-w-[72px] rounded bg-blue-50/60 px-2.5 py-1 text-center text-[11px] font-semibold text-blue-950">
                              {formatTimeDisplay(shift.start_time)}
                            </span>
                          )}
                        </td>

                        {/* End Time */}
                        <td className="py-3 px-3 text-center">
                          {isEditing ? (
                            <input
                              type="time"
                              value={editEndTime}
                              onChange={(e) => setEditEndTime(e.target.value)}
                              className="h-8 rounded border border-blue-400 px-1.5 text-xs outline-none"
                            />
                          ) : (
                            <span className="inline-block min-w-[72px] rounded bg-blue-50/60 px-2.5 py-1 text-center text-[11px] font-semibold text-blue-950">
                              {formatTimeDisplay(shift.end_time)}
                            </span>
                          )}
                        </td>

                        {/* Half-Day Time */}
                        <td className="py-3 px-3 text-center">
                          {isEditing ? (
                            <input
                              type="time"
                              value={editHalfDayTime}
                              onChange={(e) => setEditHalfDayTime(e.target.value)}
                              className="h-8 rounded border border-blue-400 px-1.5 text-xs outline-none"
                            />
                          ) : (
                            <span className="inline-block min-w-[72px] rounded bg-blue-50/60 px-2.5 py-1 text-center text-[11px] font-semibold text-blue-950">
                              {formatTimeDisplay(shift.half_day_time)}
                            </span>
                          )}
                        </td>

                        {/* Day Span */}
                        <td className="py-3 px-3 text-center text-gray-600">
                          {isEditing ? (
                            <select
                              value={editDaySpan}
                              onChange={(e) =>
                                setEditDaySpan(e.target.value as '1 day' | '2 days')
                              }
                              className="h-8 rounded border border-blue-400 px-1 text-xs outline-none"
                            >
                              <option value="1 day">1 day</option>
                              <option value="2 days">2 days</option>
                            </select>
                          ) : (
                            shift.day_span
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(shift.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  <Check size={14} />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(shift)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Edit Shift"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(shift.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete Shift"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}