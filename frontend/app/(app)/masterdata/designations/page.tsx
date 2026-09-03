// 'use client';

// import { useMemo, useState, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { GripVertical, Pencil, X, Loader2 } from 'lucide-react';

// import {
//   useDesignations,
//   useCreateDesignation,
//   useUpdateDesignation,
//   useDeleteDesignation,
//   useSubDesignations,
//   useCreateSubDesignation,
//   useUpdateSubDesignation,
//   useDeleteSubDesignation,
// } from '@/features/designation/hooks/useDesignations';

// import { useDepartments } from '@/features/departments/hooks/useDepartments';
// import type { Designation, SubDesignation } from '@/services/api/designation.service';

// type Tab = 'designation' | 'subdesignation';
// type Row = Designation | SubDesignation;

// export default function DesignationsPage() {
//   const [tab, setTab] = useState<Tab>('designation');
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDesignationId, setQuickAddDesignationId] = useState<number | ''>('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editingName, setEditingName] = useState('');

//   // ─── Fetch Departments (For linking to Designations) ───────────────────
//   const { data: departments = [], isLoading: deptsLoading } = useDepartments({ is_active: 'true' });

//   // ─── Fetch Designations ────────────────────────────────────────────────
//   const { data: designations = [], isLoading: designationsLoading } = useDesignations({ is_active: 'true' });

//   // Default select first available Designation when switching to Sub-Designations
//   useEffect(() => {
//     if (tab === 'subdesignation' && !quickAddDesignationId && designations.length > 0) {
//       setQuickAddDesignationId(designations[0].id);
//     }
//   }, [tab, designations, quickAddDesignationId]);

//   // ─── Fetch Sub-Designations ────────────────────────────────────────────
//   const { data: subDesignations = [], isLoading: subDesignationsLoading } = useSubDesignations({ is_active: 'true' });

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDesignation = useCreateDesignation();
//   const updateDesignation = useUpdateDesignation();
//   const deleteDesignation = useDeleteDesignation();

//   const createSubDesignation = useCreateSubDesignation();
//   const updateSubDesignation = useUpdateSubDesignation();
//   const deleteSubDesignation = useDeleteSubDesignation();

//   // ─── Filtering & Helpers ───────────────────────────────────────────────
//   const filteredDesignations = useMemo(
//     () => designations.filter((d) => d.name.toLowerCase().includes(filter.toLowerCase())),
//     [designations, filter]
//   );

//   const filteredSubDesignations = useMemo(
//     () => subDesignations.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [subDesignations, filter]
//   );

//   const designationNameById = useMemo(() => {
//     const map = new Map<number, string>();
//     designations.forEach((d) => map.set(d.id, d.name));
//     return map;
//   }, [designations]);

//   const isLoading = tab === 'designation' ? designationsLoading : subDesignationsLoading;
//   const rows: Row[] = tab === 'designation' ? filteredDesignations : filteredSubDesignations;

//   // ─── Toggle Department Handlers (Designations) ─────────────────────────
//   async function handleToggleRowAllDepartments(designation: Designation) {
//     const nextValue = !designation.is_all_departments;
//     const fallbackIds = designation.department_ids && designation.department_ids.length > 0
//       ? designation.department_ids
//       : (departments[0]?.id ? [departments[0].id] : []);

//     await updateDesignation.mutateAsync({
//       id: designation.id,
//       data: {
//         is_all_departments: nextValue,
//         department_ids: nextValue ? [] : fallbackIds,
//       },
//     });
//   }

//   async function handleToggleRowDepartment(designation: Designation, departmentId: number) {
//     const currentIds = designation.department_ids || [];
//     let nextIds: number[];

//     if (designation.is_all_departments) {
//       nextIds = [departmentId];
//     } else {
//       nextIds = currentIds.includes(departmentId)
//         ? currentIds.filter((id) => id !== departmentId)
//         : [...currentIds, departmentId];
//     }

//     if (nextIds.length === 0) {
//       window.alert('Designation must belong to at least one department or have "All departments" enabled.');
//       return;
//     }

//     await updateDesignation.mutateAsync({
//       id: designation.id,
//       data: {
//         is_all_departments: false,
//         department_ids: nextIds,
//       },
//     });
//   }

//   // ─── Standard Handlers ────────────────────────────────────────────────
//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDesignationId('');
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (tab === 'designation') {
//       await createDesignation.mutateAsync({
//         name,
//         is_all_departments: true,
//         department_ids: [],
//       });
//     } else {
//       if (!quickAddDesignationId) {
//         window.alert('Please select a designation first.');
//         return;
//       }

//       await createSubDesignation.mutateAsync({
//         designation_id: Number(quickAddDesignationId),
//         name,
//       });
//     }

//     setQuickAddName('');
//   }

//   function startEdit(row: Row) {
//     if (editingId === row.id) {
//       setEditingId(null);
//       setEditingName('');
//       return;
//     }
//     setEditingId(row.id);
//     setEditingName(row.name);
//   }

//   function cancelEdit() {
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function commitEdit(row: Row) {
//     const name = editingName.trim();
//     if (!name || editingId === null || name === row.name) {
//       cancelEdit();
//       return;
//     }

//     if (tab === 'designation') {
//       await updateDesignation.mutateAsync({
//         id: row.id,
//         data: { name },
//       });
//     } else {
//       const sub = row as SubDesignation;
//       await updateSubDesignation.mutateAsync({
//         id: sub.id,
//         data: { designation_id: sub.designation_id, name },
//       });
//     }
//     cancelEdit();
//   }

//   async function handleDelete(row: Row) {
//     if (!window.confirm(`Delete "${row.name}"? This can't be undone.`)) return;

//     if (tab === 'designation') {
//       await deleteDesignation.mutateAsync(row.id);
//     } else {
//       await deleteSubDesignation.mutateAsync(row.id);
//     }
//   }

//   async function handleDeleteMaster() {
//     const label = tab === 'designation' ? 'all designations' : 'all sub-designations';
//     if (!window.confirm(`Delete ${label} (${rows.length} items)? This can't be undone.`)) return;

//     for (const row of rows) {
//       if (tab === 'designation') {
//         await deleteDesignation.mutateAsync(row.id);
//       } else {
//         await deleteSubDesignation.mutateAsync(row.id);
//       }
//     }
//   }

//   const addDisabled =
//     !quickAddName.trim() ||
//     (tab === 'subdesignation' && !quickAddDesignationId) ||
//     createDesignation.isPending ||
//     createSubDesignation.isPending;

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="px-6 py-5">
//           {/* Header */}
//           <div className="mb-3.5 flex items-start justify-between">
//             <div>
//               <h1 className="text-[19px] font-bold text-slate-900">
//                 {tab === 'designation' ? 'Designations' : 'Sub Designations'}
//               </h1>
//               <p className="mt-0.5 text-[11.5px] text-slate-400">
//                 Designations → departments · Sub-designations → designations
//               </p>
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={handleDeleteMaster}
//                 disabled={rows.length === 0}
//                 className="text-[12px] font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Delete master
//               </button>
//               <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
//                 Auto-save on
//               </span>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="mb-4 flex items-center gap-2">
//             <TabButton
//               label="Designation"
//               count={designations.length}
//               active={tab === 'designation'}
//               onClick={() => switchTab('designation')}
//             />
//             <TabButton
//               label="Sub Designation"
//               count={subDesignations.length}
//               active={tab === 'subdesignation'}
//               onClick={() => switchTab('subdesignation')}
//             />
//           </div>

//           {/* Quick Add Bar */}
//           <div className="mb-3 flex items-center gap-2">
//             {tab === 'subdesignation' && (
//               <select
//                 className="qin w-56 shrink-0"
//                 value={quickAddDesignationId}
//                 onChange={(e) => setQuickAddDesignationId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select designation…</option>
//                 {designations.map((d) => (
//                   <option key={d.id} value={d.id}>
//                     {d.name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               className="qin flex-1"
//               placeholder={tab === 'designation' ? 'Add designation...' : 'Add sub-designation...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={addDisabled}
//               className="rounded-md bg-blue-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               Add
//             </button>
//           </div>

//           {/* Search Bar & Micro Tip */}
//           <div className="mb-2 flex items-center gap-2">
//             <input
//               className="qin w-52"
//               placeholder="Filter..."
//               value={filter}
//               onChange={(e) => setFilter(e.target.value)}
//             />
//             <div className="flex-1" />
//             <span className="w-8 shrink-0 text-right text-[12px] text-gray-400">{rows.length}</span>
//           </div>

//           <p className="mb-3 text-[11px] text-slate-400">
//             Tip: leave a designation on <span className="font-semibold text-slate-600">All departments</span> if it applies everywhere. Or link it to one or more departments. Drag <GripVertical className="inline h-3 w-3" /> to reorder.
//           </p>

//           {/* Main List */}
//           <div className="overflow-hidden rounded-md border border-gray-100 bg-white">
//             {isLoading ? (
//               <div className="flex items-center gap-2 p-4 text-xs text-gray-400">
//                 <Loader2 size={13} className="animate-spin" />
//                 Loading…
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-4 text-xs text-gray-400">
//                 No {tab === 'designation' ? 'designations' : 'sub-designations'} found.
//               </div>
//             ) : (
//               rows.map((row, i) => {
//                 const isEditing = editingId === row.id;

//                 const deptNames =
//                   tab === 'designation'
//                     ? (row as Designation).is_all_departments
//                       ? ['All departments']
//                       : (row as Designation).departments?.map((d) => d.department_name) || []
//                     : [];

//                 const parentDesignationTag =
//                   tab === 'subdesignation'
//                     ? (row as SubDesignation).designation?.name ??
//                       designationNameById.get((row as SubDesignation).designation_id) ??
//                       '—'
//                     : '';

//                 return (
//                   <div key={row.id} className="border-b border-gray-100 last:border-b-0">
//                     <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/80">
//                       <GripVertical size={14} className="shrink-0 cursor-grab text-gray-300" />
//                       <span className="w-5 shrink-0 text-[11px] text-gray-400">{i + 1}</span>

//                       {isEditing ? (
//                         <input
//                           autoFocus
//                           className="qin !h-8 flex-1"
//                           value={editingName}
//                           onChange={(e) => setEditingName(e.target.value)}
//                           onKeyDown={(e) => {
//                             if (e.key === 'Enter') commitEdit(row);
//                             if (e.key === 'Escape') cancelEdit();
//                           }}
//                           onBlur={() => commitEdit(row)}
//                         />
//                       ) : (
//                         <span className="flex-1 truncate text-[13px] font-semibold uppercase tracking-wide text-gray-800">
//                           {row.name}
//                         </span>
//                       )}

//                       {/* Right Tag Badges */}
//                       {tab === 'designation' ? (
//                         <div className="flex items-center gap-1.5 shrink-0">
//                           {deptNames.length > 0 ? (
//                             deptNames.map((name, idx) => (
//                               <span
//                                 key={idx}
//                                 className="rounded-full border border-blue-200 bg-blue-50/50 px-3 py-0.5 text-[11px] font-medium text-blue-600"
//                               >
//                                 {name}
//                               </span>
//                             ))
//                           ) : (
//                             <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-medium text-amber-600">
//                               No departments linked
//                             </span>
//                           )}
//                         </div>
//                       ) : (
//                         <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-0.5 text-[11px] font-medium text-blue-600">
//                           {parentDesignationTag}
//                         </span>
//                       )}

//                       <button
//                         onClick={() => startEdit(row)}
//                         className={`shrink-0 text-gray-400 hover:text-gray-600 ${isEditing ? 'text-blue-600' : ''}`}
//                         title="Edit"
//                       >
//                         <Pencil size={13} />
//                       </button>

//                       <button
//                         onClick={() => handleDelete(row)}
//                         className="shrink-0 text-gray-400 hover:text-red-500"
//                         title="Delete"
//                       >
//                         <X size={15} />
//                       </button>
//                     </div>

//                     {/* Expandable Department Checkbox Grid (Designation Tab) */}
//                     {tab === 'designation' && isEditing && (
//                       <div className="bg-slate-50/60 px-9 py-3 border-t border-slate-100 text-[12px]">
//                         <div className="mb-2">
//                           <label className="inline-flex cursor-pointer items-center gap-2 font-bold text-slate-800">
//                             <input
//                               type="checkbox"
//                               checked={(row as Designation).is_all_departments}
//                               onChange={() => handleToggleRowAllDepartments(row as Designation)}
//                               className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                             />
//                             <span>All departments</span>
//                             <span className="font-normal text-slate-400">(applies everywhere)</span>
//                           </label>
//                         </div>

//                         {deptsLoading ? (
//                           <div className="flex items-center gap-2 text-slate-400 py-1">
//                             <Loader2 size={12} className="animate-spin" />
//                             Loading departments...
//                           </div>
//                         ) : (
//                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-2">
//                             {departments.map((dept) => {
//                               const isChecked =
//                                 (row as Designation).is_all_departments ||
//                                 (row as Designation).department_ids?.includes(dept.id);

//                               return (
//                                 <label
//                                   key={dept.id}
//                                   className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-800 truncate"
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     checked={Boolean(isChecked)}
//                                     onChange={() => handleToggleRowDepartment(row as Designation, dept.id)}
//                                     className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                                   />
//                                   <span className="truncate">{dept.department_name}</span>
//                                 </label>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <style jsx global>{`
//           .qin {
//             height: 38px;
//             border: 1px solid #e5e7eb;
//             border-radius: 6px;
//             padding: 0 10px;
//             font-size: 13px;
//             color: #374151;
//             outline: none;
//             background: white;
//           }
//           .qin:focus {
//             border-color: #93c5fd;
//             box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
//           }
//         `}</style>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// function TabButton({
//   label,
//   count,
//   active,
//   onClick,
// }: {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={[
//         'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
//         active
//           ? 'border-blue-500 bg-white text-blue-600'
//           : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
//       ].join(' ')}
//     >
//       {label}
//       <span className={active ? 'text-[12px] font-semibold text-blue-600' : 'text-[12px] text-gray-400'}>
//         {count}
//       </span>
//     </button>
//   );
// }








// 'use client';

// import { useMemo, useState, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { GripVertical, Pencil, X, Loader2 } from 'lucide-react';

// import {
//   useDesignations,
//   useCreateDesignation,
//   useUpdateDesignation,
//   useDeleteDesignation,
//   useSubDesignations,
//   useCreateSubDesignation,
//   useUpdateSubDesignation,
//   useDeleteSubDesignation,
// } from '@/features/designation/hooks/useDesignations';

// import { useDepartments } from '@/features/departments/hooks/useDepartments';
// import type { Designation, SubDesignation } from '@/services/api/designation.service';

// type Tab = 'designation' | 'subdesignation';
// type Row = Designation | SubDesignation;

// export default function DesignationsPage() {
//   const [tab, setTab] = useState<Tab>('designation');
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDesignationId, setQuickAddDesignationId] = useState<number | ''>('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editingName, setEditingName] = useState('');

//   // ─── Fetch Departments (For linking to Designations) ───────────────────
//   const { data: departments = [], isLoading: deptsLoading } = useDepartments({ is_active: 'true' });

//   // ─── Fetch Designations ────────────────────────────────────────────────
//   const { data: designations = [], isLoading: designationsLoading } = useDesignations({ is_active: 'true' });

//   // Default select first available Designation when switching to Sub-Designations
//   useEffect(() => {
//     if (tab === 'subdesignation' && !quickAddDesignationId && designations.length > 0) {
//       setQuickAddDesignationId(designations[0].id);
//     }
//   }, [tab, designations, quickAddDesignationId]);

//   // ─── Fetch Sub-Designations ────────────────────────────────────────────
//   const { data: subDesignations = [], isLoading: subDesignationsLoading } = useSubDesignations({ is_active: 'true' });

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDesignation = useCreateDesignation();
//   const updateDesignation = useUpdateDesignation();
//   const deleteDesignation = useDeleteDesignation();

//   const createSubDesignation = useCreateSubDesignation();
//   const updateSubDesignation = useUpdateSubDesignation();
//   const deleteSubDesignation = useDeleteSubDesignation();

//   // ─── Filtering & Helpers ───────────────────────────────────────────────
//   const filteredDesignations = useMemo(
//     () => designations.filter((d) => d.name.toLowerCase().includes(filter.toLowerCase())),
//     [designations, filter]
//   );

//   const filteredSubDesignations = useMemo(
//     () => subDesignations.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [subDesignations, filter]
//   );

//   const designationNameById = useMemo(() => {
//     const map = new Map<number, string>();
//     designations.forEach((d) => map.set(d.id, d.name));
//     return map;
//   }, [designations]);

//   const isLoading = tab === 'designation' ? designationsLoading : subDesignationsLoading;
//   const rows: Row[] = tab === 'designation' ? filteredDesignations : filteredSubDesignations;

//   // ─── Toggle Department Handlers (Designations) ─────────────────────────
//   async function handleToggleRowAllDepartments(designation: Designation) {
//     const nextValue = !designation.is_all_departments;
//     const fallbackIds = designation.department_ids && designation.department_ids.length > 0
//       ? designation.department_ids
//       : (departments[0]?.id ? [departments[0].id] : []);

//     await updateDesignation.mutateAsync({
//       id: designation.id,
//       data: {
//         is_all_departments: nextValue,
//         department_ids: nextValue ? [] : fallbackIds,
//       },
//     });
//   }

//   async function handleToggleRowDepartment(designation: Designation, departmentId: number) {
//     const currentIds = designation.department_ids || [];
//     let nextIds: number[];

//     if (designation.is_all_departments) {
//       nextIds = [departmentId];
//     } else {
//       nextIds = currentIds.includes(departmentId)
//         ? currentIds.filter((id) => id !== departmentId)
//         : [...currentIds, departmentId];
//     }

//     if (nextIds.length === 0) {
//       window.alert('Designation must belong to at least one department or have "All departments" enabled.');
//       return;
//     }

//     await updateDesignation.mutateAsync({
//       id: designation.id,
//       data: {
//         is_all_departments: false,
//         department_ids: nextIds,
//       },
//     });
//   }

//   // ─── Standard Handlers ────────────────────────────────────────────────
//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDesignationId('');
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (tab === 'designation') {
//       await createDesignation.mutateAsync({
//         name,
//         is_all_departments: true,
//         department_ids: [],
//       });
//     } else {
//       if (!quickAddDesignationId) {
//         window.alert('Please select a designation first.');
//         return;
//       }

//       await createSubDesignation.mutateAsync({
//         designation_id: Number(quickAddDesignationId),
//         name,
//       });
//     }

//     setQuickAddName('');
//   }

//   function startEdit(row: Row) {
//     if (editingId === row.id) {
//       setEditingId(null);
//       setEditingName('');
//       return;
//     }
//     setEditingId(row.id);
//     setEditingName(row.name);
//   }

//   function cancelEdit() {
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function commitEdit(row: Row) {
//     const name = editingName.trim();
//     if (!name || editingId === null || name === row.name) {
//       cancelEdit();
//       return;
//     }

//     if (tab === 'designation') {
//       await updateDesignation.mutateAsync({
//         id: row.id,
//         data: { name },
//       });
//     } else {
//       const sub = row as SubDesignation;
//       await updateSubDesignation.mutateAsync({
//         id: sub.id,
//         data: { designation_id: sub.designation_id, name },
//       });
//     }
//     cancelEdit();
//   }

//   async function handleDelete(row: Row) {
//     if (!window.confirm(`Delete "${row.name}"? This can't be undone.`)) return;

//     if (tab === 'designation') {
//       await deleteDesignation.mutateAsync(row.id);
//     } else {
//       await deleteSubDesignation.mutateAsync(row.id);
//     }
//   }

//   async function handleDeleteMaster() {
//     const label = tab === 'designation' ? 'all designations' : 'all sub-designations';
//     if (!window.confirm(`Delete ${label} (${rows.length} items)? This can't be undone.`)) return;

//     for (const row of rows) {
//       if (tab === 'designation') {
//         await deleteDesignation.mutateAsync(row.id);
//       } else {
//         await deleteSubDesignation.mutateAsync(row.id);
//       }
//     }
//   }

//   const addDisabled =
//     !quickAddName.trim() ||
//     (tab === 'subdesignation' && !quickAddDesignationId) ||
//     createDesignation.isPending ||
//     createSubDesignation.isPending;

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="px-6 py-5">
//           {/* Header */}
//           <div className="mb-3.5 flex items-start justify-between">
//             <div>
//               <h1 className="text-[19px] font-bold text-slate-900">
//                 {tab === 'designation' ? 'Designations' : 'Sub Designations'}
//               </h1>
//               <p className="mt-0.5 text-[11.5px] text-slate-400">
//                 Designations → departments · Sub-designations → designations
//               </p>
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={handleDeleteMaster}
//                 disabled={rows.length === 0}
//                 className="text-[12px] font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Delete master
//               </button>
//               <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
//                 Auto-save on
//               </span>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="mb-4 flex items-center gap-2">
//             <TabButton
//               label="Designation"
//               count={designations.length}
//               active={tab === 'designation'}
//               onClick={() => switchTab('designation')}
//             />
//             <TabButton
//               label="Sub Designation"
//               count={subDesignations.length}
//               active={tab === 'subdesignation'}
//               onClick={() => switchTab('subdesignation')}
//             />
//           </div>

//           {/* Quick Add Bar */}
//           <div className="mb-3 flex items-center gap-2">
//             {tab === 'subdesignation' && (
//               <select
//                 className="qin w-56 shrink-0"
//                 value={quickAddDesignationId}
//                 onChange={(e) => setQuickAddDesignationId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select designation…</option>
//                 {designations.map((d) => (
//                   <option key={d.id} value={d.id}>
//                     {d.name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               className="qin flex-1"
//               placeholder={tab === 'designation' ? 'Add designation...' : 'Add sub-designation...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={addDisabled}
//               className="rounded-md bg-blue-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               Add
//             </button>
//           </div>

//           {/* Search Bar & Micro Tip */}
//           <div className="mb-2 flex items-center gap-2">
//             <input
//               className="qin w-52"
//               placeholder="Filter..."
//               value={filter}
//               onChange={(e) => setFilter(e.target.value)}
//             />
//             <div className="flex-1" />
//             <span className="w-8 shrink-0 text-right text-[12px] text-gray-400">{rows.length}</span>
//           </div>

//           <p className="mb-3 text-[11px] text-slate-400">
//             Tip: leave a designation on <span className="font-semibold text-slate-600">All departments</span> if it applies everywhere. Or link it to one or more departments. Drag <GripVertical className="inline h-3 w-3" /> to reorder.
//           </p>

//           {/* Main List */}
//           <div className="overflow-hidden rounded-md border border-gray-100 bg-white">
//             {isLoading ? (
//               <div className="flex items-center gap-2 p-4 text-xs text-gray-400">
//                 <Loader2 size={13} className="animate-spin" />
//                 Loading…
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-4 text-xs text-gray-400">
//                 No {tab === 'designation' ? 'designations' : 'sub-designations'} found.
//               </div>
//             ) : (
//               rows.map((row, i) => {
//                 const isEditing = editingId === row.id;

//                 const deptNames =
//                   tab === 'designation'
//                     ? (row as Designation).is_all_departments
//                       ? ['All departments']
//                       : (row as Designation).departments?.map((d) => d.department_name) || []
//                     : [];

//                 const parentDesignationTag =
//                   tab === 'subdesignation'
//                     ? (row as SubDesignation).designation?.name ??
//                       designationNameById.get((row as SubDesignation).designation_id) ??
//                       '—'
//                     : '';

//                 return (
//                   <div key={row.id} className="border-b border-gray-100 last:border-b-0">
//                     <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/80">
//                       <GripVertical size={14} className="shrink-0 cursor-grab text-gray-300" />
//                       <span className="w-5 shrink-0 text-[11px] text-gray-400">{i + 1}</span>

//                       {isEditing ? (
//                         <input
//                           autoFocus
//                           className="qin !h-8 flex-1"
//                           value={editingName}
//                           onChange={(e) => setEditingName(e.target.value)}
//                           onKeyDown={(e) => {
//                             if (e.key === 'Enter') {
//                               e.currentTarget.blur();
//                               commitEdit(row);
//                             }
//                             if (e.key === 'Escape') cancelEdit();
//                           }}
//                           onBlur={() => commitEdit(row)}
//                         />
//                       ) : (
//                         <span className="flex-1 truncate text-[13px] font-semibold uppercase tracking-wide text-gray-800">
//                           {row.name}
//                         </span>
//                       )}

//                       {/* Right Tag Badges */}
//                       {tab === 'designation' ? (
//                         <div className="flex shrink-0 items-center gap-1.5">
//                           {deptNames.length > 0 ? (
//                             deptNames.map((name, idx) => (
//                               <span
//                                 key={idx}
//                                 className="rounded-full border border-blue-200 bg-blue-50/50 px-3 py-0.5 text-[11px] font-medium text-blue-600"
//                               >
//                                 {name}
//                               </span>
//                             ))
//                           ) : (
//                             <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-medium text-amber-600">
//                               No departments linked
//                             </span>
//                           )}
//                         </div>
//                       ) : (
//                         <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-0.5 text-[11px] font-medium text-blue-600">
//                           {parentDesignationTag}
//                         </span>
//                       )}

//                       <button
//                         onClick={() => startEdit(row)}
//                         className={`shrink-0 text-gray-400 hover:text-gray-600 ${isEditing ? 'text-blue-600' : ''}`}
//                         title="Edit"
//                       >
//                         <Pencil size={13} />
//                       </button>

//                       <button
//                         onClick={() => handleDelete(row)}
//                         className="shrink-0 text-gray-400 hover:text-red-500"
//                         title="Delete"
//                       >
//                         <X size={15} />
//                       </button>
//                     </div>

//                     {/* Expandable Department Checkbox Grid (Designation Tab) */}
//                     {tab === 'designation' && isEditing && (
//                       <div className="border-t border-slate-100 bg-slate-50/60 px-9 py-3 text-[12px]">
//                         <div className="mb-2">
//                           <label className="inline-flex cursor-pointer items-center gap-2 font-bold text-slate-800">
//                             <input
//                               type="checkbox"
//                               checked={(row as Designation).is_all_departments}
//                               onChange={() => handleToggleRowAllDepartments(row as Designation)}
//                               className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                             />
//                             <span>All departments</span>
//                             <span className="font-normal text-slate-400">(applies everywhere)</span>
//                           </label>
//                         </div>

//                         {deptsLoading ? (
//                           <div className="flex items-center gap-2 py-1 text-slate-400">
//                             <Loader2 size={12} className="animate-spin" />
//                             Loading departments...
//                           </div>
//                         ) : (
//                           <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4 lg:grid-cols-6">
//                             {departments.map((dept) => {
//                               const isChecked =
//                                 (row as Designation).is_all_departments ||
//                                 (row as Designation).department_ids?.includes(dept.id);

//                               return (
//                                 <label
//                                   key={dept.id}
//                                   className="inline-flex cursor-pointer items-center gap-2 truncate font-medium text-slate-800"
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     checked={Boolean(isChecked)}
//                                     onChange={() => handleToggleRowDepartment(row as Designation, dept.id)}
//                                     className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                                   />
//                                   <span className="truncate">{dept.department_name}</span>
//                                 </label>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <style jsx global>{`
//           .qin {
//             height: 38px;
//             border: 1px solid #e5e7eb;
//             border-radius: 6px;
//             padding: 0 10px;
//             font-size: 13px;
//             color: #374151;
//             outline: none;
//             background: white;
//           }
//           .qin:focus {
//             border-color: #93c5fd;
//             box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
//           }
//         `}</style>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// function TabButton({
//   label,
//   count,
//   active,
//   onClick,
// }: {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={[
//         'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
//         active
//           ? 'border-blue-500 bg-white text-blue-600'
//           : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
//       ].join(' ')}
//     >
//       {label}
//       <span className={active ? 'text-[12px] font-semibold text-blue-600' : 'text-[12px] text-gray-400'}>
//         {count}
//       </span>
//     </button>
//   );
// }





// 'use client';

// import { useMemo, useState, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { GripVertical, Pencil, X, Loader2 } from 'lucide-react';

// import {
//   useDesignations,
//   useCreateDesignation,
//   useUpdateDesignation,
//   useDeleteDesignation,
//   useSubDesignations,
//   useCreateSubDesignation,
//   useUpdateSubDesignation,
//   useDeleteSubDesignation,
// } from '@/features/designation/hooks/useDesignations';

// import { useDepartments } from '@/features/departments/hooks/useDepartments';
// import type { Designation, SubDesignation } from '@/services/api/designation.service';

// type Tab = 'designation' | 'subdesignation';
// type Row = Designation | SubDesignation;

// export default function DesignationsPage() {
//   const [tab, setTab] = useState<Tab>('designation');
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDesignationId, setQuickAddDesignationId] = useState<number | ''>('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editingName, setEditingName] = useState('');

//   // ─── Fetch Departments (For linking to Designations) ───────────────────
//   const { data: departments = [], isLoading: deptsLoading } = useDepartments({ is_active: 'true' });

//   // ─── Fetch Designations ────────────────────────────────────────────────
//   const { data: designations = [], isLoading: designationsLoading } = useDesignations({ is_active: 'true' });

//   // Default select first available Designation when switching to Sub-Designations
//   useEffect(() => {
//     if (tab === 'subdesignation' && !quickAddDesignationId && designations.length > 0) {
//       setQuickAddDesignationId(designations[0].id);
//     }
//   }, [tab, designations, quickAddDesignationId]);

//   // ─── Fetch Sub-Designations ────────────────────────────────────────────
//   const { data: subDesignations = [], isLoading: subDesignationsLoading } = useSubDesignations({ is_active: 'true' });

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDesignation = useCreateDesignation();
//   const updateDesignation = useUpdateDesignation();
//   const deleteDesignation = useDeleteDesignation();

//   const createSubDesignation = useCreateSubDesignation();
//   const updateSubDesignation = useUpdateSubDesignation();
//   const deleteSubDesignation = useDeleteSubDesignation();

//   // ─── Filtering & Helpers ───────────────────────────────────────────────
//   const filteredDesignations = useMemo(
//     () => designations.filter((d) => d.name.toLowerCase().includes(filter.toLowerCase())),
//     [designations, filter]
//   );

//   const filteredSubDesignations = useMemo(
//     () => subDesignations.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [subDesignations, filter]
//   );

//   const isLoading = tab === 'designation' ? designationsLoading : subDesignationsLoading;
//   const rows: Row[] = tab === 'designation' ? filteredDesignations : filteredSubDesignations;

//   // ─── Toggle Department Handlers (Designations) ─────────────────────────
//   async function handleToggleRowAllDepartments(designation: Designation) {
//     const nextValue = !designation.is_all_departments;
//     const fallbackIds = designation.department_ids && designation.department_ids.length > 0
//       ? designation.department_ids
//       : (departments[0]?.id ? [departments[0].id] : []);

//     await updateDesignation.mutateAsync({
//       id: designation.id,
//       data: {
//         is_all_departments: nextValue,
//         department_ids: nextValue ? [] : fallbackIds,
//       },
//     });
//   }

//   async function handleToggleRowDepartment(designation: Designation, departmentId: number) {
//     const currentIds = designation.department_ids || [];
//     let nextIds: number[];

//     if (designation.is_all_departments) {
//       nextIds = [departmentId];
//     } else {
//       nextIds = currentIds.includes(departmentId)
//         ? currentIds.filter((id) => id !== departmentId)
//         : [...currentIds, departmentId];
//     }

//     if (nextIds.length === 0) {
//       window.alert('Designation must belong to at least one department or have "All departments" enabled.');
//       return;
//     }

//     await updateDesignation.mutateAsync({
//       id: designation.id,
//       data: {
//         is_all_departments: false,
//         department_ids: nextIds,
//       },
//     });
//   }

//   // ─── Toggle Designation Handlers (Sub-Designations) ────────────────────
//   async function handleToggleRowAllDesignations(sub: SubDesignation) {
//     const nextValue = !sub.is_all_designations;
//     const fallbackIds = sub.designation_ids && sub.designation_ids.length > 0
//       ? sub.designation_ids
//       : (designations[0]?.id ? [designations[0].id] : []);

//     await updateSubDesignation.mutateAsync({
//       id: sub.id,
//       data: {
//         is_all_designations: nextValue,
//         designation_ids: nextValue ? [] : fallbackIds,
//       },
//     });
//   }

//   async function handleToggleRowDesignation(sub: SubDesignation, designationId: number) {
//     const currentIds = sub.designation_ids || [];
//     let nextIds: number[];

//     if (sub.is_all_designations) {
//       nextIds = [designationId];
//     } else {
//       nextIds = currentIds.includes(designationId)
//         ? currentIds.filter((id) => id !== designationId)
//         : [...currentIds, designationId];
//     }

//     if (nextIds.length === 0) {
//       window.alert('Sub-designation must belong to at least one designation or have "All designations" enabled.');
//       return;
//     }

//     await updateSubDesignation.mutateAsync({
//       id: sub.id,
//       data: {
//         is_all_designations: false,
//         designation_ids: nextIds,
//       },
//     });
//   }

//   // ─── Standard Handlers ────────────────────────────────────────────────
//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDesignationId('');
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (tab === 'designation') {
//       await createDesignation.mutateAsync({
//         name,
//         is_all_departments: true,
//         department_ids: [],
//       });
//     } else {
//       if (!quickAddDesignationId) {
//         window.alert('Please select a designation first.');
//         return;
//       }

//       await createSubDesignation.mutateAsync({
//         name,
//         is_all_designations: false,
//         designation_ids: [Number(quickAddDesignationId)],
//       });
//     }

//     setQuickAddName('');
//   }

//   function startEdit(row: Row) {
//     if (editingId === row.id) {
//       setEditingId(null);
//       setEditingName('');
//       return;
//     }
//     setEditingId(row.id);
//     setEditingName(row.name);
//   }

//   function cancelEdit() {
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function commitEdit(row: Row) {
//     const name = editingName.trim();
//     if (!name || editingId === null || name === row.name) {
//       cancelEdit();
//       return;
//     }

//     if (tab === 'designation') {
//       await updateDesignation.mutateAsync({
//         id: row.id,
//         data: { name },
//       });
//     } else {
//       await updateSubDesignation.mutateAsync({
//         id: row.id,
//         data: { name },
//       });
//     }
//     cancelEdit();
//   }

//   async function handleDelete(row: Row) {
//     if (!window.confirm(`Delete "${row.name}"? This can't be undone.`)) return;

//     if (tab === 'designation') {
//       await deleteDesignation.mutateAsync(row.id);
//     } else {
//       await deleteSubDesignation.mutateAsync(row.id);
//     }
//   }

//   async function handleDeleteMaster() {
//     const label = tab === 'designation' ? 'all designations' : 'all sub-designations';
//     if (!window.confirm(`Delete ${label} (${rows.length} items)? This can't be undone.`)) return;

//     for (const row of rows) {
//       if (tab === 'designation') {
//         await deleteDesignation.mutateAsync(row.id);
//       } else {
//         await deleteSubDesignation.mutateAsync(row.id);
//       }
//     }
//   }

//   const addDisabled =
//     !quickAddName.trim() ||
//     (tab === 'subdesignation' && !quickAddDesignationId) ||
//     createDesignation.isPending ||
//     createSubDesignation.isPending;

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="px-6 py-5">
//           {/* Header */}
//           <div className="mb-3.5 flex items-start justify-between">
//             <div>
//               <h1 className="text-[19px] font-bold text-slate-900">
//                 {tab === 'designation' ? 'Designations' : 'Sub Designations'}
//               </h1>
//               <p className="mt-0.5 text-[11.5px] text-slate-400">
//                 Designations → departments · Sub-designations → designations
//               </p>
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={handleDeleteMaster}
//                 disabled={rows.length === 0}
//                 className="text-[12px] font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Delete master
//               </button>
//               <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
//                 Auto-save on
//               </span>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="mb-4 flex items-center gap-2">
//             <TabButton
//               label="Designation"
//               count={designations.length}
//               active={tab === 'designation'}
//               onClick={() => switchTab('designation')}
//             />
//             <TabButton
//               label="Sub Designation"
//               count={subDesignations.length}
//               active={tab === 'subdesignation'}
//               onClick={() => switchTab('subdesignation')}
//             />
//           </div>

//           {/* Quick Add Bar */}
//           <div className="mb-3 flex items-center gap-2">
//             {tab === 'subdesignation' && (
//               <select
//                 className="qin w-56 shrink-0"
//                 value={quickAddDesignationId}
//                 onChange={(e) => setQuickAddDesignationId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select designation…</option>
//                 {designations.map((d) => (
//                   <option key={d.id} value={d.id}>
//                     {d.name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               className="qin flex-1"
//               placeholder={tab === 'designation' ? 'Add designation...' : 'Add sub-designation...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={addDisabled}
//               className="rounded-md bg-blue-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               Add
//             </button>
//           </div>

//           {/* Search Bar & Micro Tip */}
//           <div className="mb-2 flex items-center gap-2">
//             <input
//               className="qin w-52"
//               placeholder="Filter..."
//               value={filter}
//               onChange={(e) => setFilter(e.target.value)}
//             />
//             <div className="flex-1" />
//             <span className="w-8 shrink-0 text-right text-[12px] text-gray-400">{rows.length}</span>
//           </div>

//           <p className="mb-3 text-[11px] text-slate-400">
//             {tab === 'designation' ? (
//               <>
//                 Tip: leave a designation on <span className="font-semibold text-slate-600">All departments</span> if it applies everywhere. Or link it to one or more departments. Drag <GripVertical className="inline h-3 w-3" /> to reorder.
//               </>
//             ) : (
//               <>
//                 Tip: leave a sub-designation on <span className="font-semibold text-slate-600">All designations</span> if it applies everywhere. Or link it to one or more designations. Drag <GripVertical className="inline h-3 w-3" /> to reorder.
//               </>
//             )}
//           </p>

//           {/* Main List */}
//           <div className="overflow-hidden rounded-md border border-gray-100 bg-white">
//             {isLoading ? (
//               <div className="flex items-center gap-2 p-4 text-xs text-gray-400">
//                 <Loader2 size={13} className="animate-spin" />
//                 Loading…
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-4 text-xs text-gray-400">
//                 No {tab === 'designation' ? 'designations' : 'sub-designations'} found.
//               </div>
//             ) : (
//               rows.map((row, i) => {
//                 const isEditing = editingId === row.id;

//                 const deptNames =
//                   tab === 'designation'
//                     ? (row as Designation).is_all_departments
//                       ? ['All departments']
//                       : (row as Designation).departments?.map((d) => d.department_name) || []
//                     : [];

//                 const designationNames =
//                   tab === 'subdesignation'
//                     ? (row as SubDesignation).is_all_designations
//                       ? ['All designations']
//                       : (row as SubDesignation).designations?.map((d) => d.name) || []
//                     : [];

//                 return (
//                   <div
//                     key={row.id}
//                     className="border-b border-gray-100 last:border-b-0"
//                     onBlur={(e) => {
//                       // Only commit/cancel when focus leaves the WHOLE row
//                       // (header + expandable checkbox panel). Moving focus
//                       // between elements inside the same row — e.g. from the
//                       // name input to a checkbox — must not collapse the panel.
//                       if (!isEditing) return;
//                       if (!e.currentTarget.contains(e.relatedTarget as Node)) {
//                         commitEdit(row);
//                       }
//                     }}
//                   >
//                     <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/80">
//                       <GripVertical size={14} className="shrink-0 cursor-grab text-gray-300" />
//                       <span className="w-5 shrink-0 text-[11px] text-gray-400">{i + 1}</span>

//                       {isEditing ? (
//                         <input
//                           autoFocus
//                           className="qin !h-8 flex-1"
//                           value={editingName}
//                           onChange={(e) => setEditingName(e.target.value)}
//                           onKeyDown={(e) => {
//                             if (e.key === 'Enter') commitEdit(row);
//                             if (e.key === 'Escape') cancelEdit();
//                           }}
//                         />
//                       ) : (
//                         <span className="flex-1 truncate text-[13px] font-semibold uppercase tracking-wide text-gray-800">
//                           {row.name}
//                         </span>
//                       )}

//                       {/* Right Tag Badges */}
//                       {tab === 'designation' ? (
//                         <div className="flex shrink-0 items-center gap-1.5">
//                           {deptNames.length > 0 ? (
//                             deptNames.map((name, idx) => (
//                               <span
//                                 key={idx}
//                                 className="rounded-full border border-blue-200 bg-blue-50/50 px-3 py-0.5 text-[11px] font-medium text-blue-600"
//                               >
//                                 {name}
//                               </span>
//                             ))
//                           ) : (
//                             <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-medium text-amber-600">
//                               No departments linked
//                             </span>
//                           )}
//                         </div>
//                       ) : (
//                         <div className="flex shrink-0 items-center gap-1.5">
//                           {designationNames.length > 0 ? (
//                             designationNames.map((name, idx) => (
//                               <span
//                                 key={idx}
//                                 className="rounded-full border border-blue-200 bg-blue-50/50 px-3 py-0.5 text-[11px] font-medium text-blue-600"
//                               >
//                                 {name}
//                               </span>
//                             ))
//                           ) : (
//                             <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-medium text-amber-600">
//                               No designations linked
//                             </span>
//                           )}
//                         </div>
//                       )}

//                       <button
//                         onClick={() => startEdit(row)}
//                         className={`shrink-0 text-gray-400 hover:text-gray-600 ${isEditing ? 'text-blue-600' : ''}`}
//                         title="Edit"
//                       >
//                         <Pencil size={13} />
//                       </button>

//                       <button
//                         onClick={() => handleDelete(row)}
//                         className="shrink-0 text-gray-400 hover:text-red-500"
//                         title="Delete"
//                       >
//                         <X size={15} />
//                       </button>
//                     </div>

//                     {/* Expandable Department Checkbox Grid (Designation Tab) */}
//                     {tab === 'designation' && isEditing && (
//                       <div className="border-t border-slate-100 bg-slate-50/60 px-9 py-3 text-[12px]">
//                         <div className="mb-2">
//                           <label className="inline-flex cursor-pointer items-center gap-2 font-bold text-slate-800">
//                             <input
//                               type="checkbox"
//                               checked={(row as Designation).is_all_departments}
//                               onChange={() => handleToggleRowAllDepartments(row as Designation)}
//                               className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                             />
//                             <span>All departments</span>
//                             <span className="font-normal text-slate-400">(applies everywhere)</span>
//                           </label>
//                         </div>

//                         {deptsLoading ? (
//                           <div className="flex items-center gap-2 py-1 text-slate-400">
//                             <Loader2 size={12} className="animate-spin" />
//                             Loading departments...
//                           </div>
//                         ) : (
//                           <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4 lg:grid-cols-6">
//                             {departments.map((dept) => {
//                               const isChecked =
//                                 (row as Designation).is_all_departments ||
//                                 (row as Designation).department_ids?.includes(dept.id);

//                               return (
//                                 <label
//                                   key={dept.id}
//                                   className="inline-flex cursor-pointer items-center gap-2 truncate font-medium text-slate-800"
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     checked={Boolean(isChecked)}
//                                     onChange={() => handleToggleRowDepartment(row as Designation, dept.id)}
//                                     className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                                   />
//                                   <span className="truncate">{dept.department_name}</span>
//                                 </label>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     )}

//                     {/* Expandable Designation Checkbox Grid (Sub-Designation Tab) */}
//                     {tab === 'subdesignation' && isEditing && (
//                       <div className="border-t border-slate-100 bg-slate-50/60 px-9 py-3 text-[12px]">
//                         <div className="mb-2">
//                           <label className="inline-flex cursor-pointer items-center gap-2 font-bold text-slate-800">
//                             <input
//                               type="checkbox"
//                               checked={(row as SubDesignation).is_all_designations}
//                               onChange={() => handleToggleRowAllDesignations(row as SubDesignation)}
//                               className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                             />
//                             <span>All designations</span>
//                             <span className="font-normal text-slate-400">(applies everywhere)</span>
//                           </label>
//                         </div>

//                         {designationsLoading ? (
//                           <div className="flex items-center gap-2 py-1 text-slate-400">
//                             <Loader2 size={12} className="animate-spin" />
//                             Loading designations...
//                           </div>
//                         ) : (
//                           <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4 lg:grid-cols-6">
//                             {designations.map((desig) => {
//                               const isChecked =
//                                 (row as SubDesignation).is_all_designations ||
//                                 (row as SubDesignation).designation_ids?.includes(desig.id);

//                               return (
//                                 <label
//                                   key={desig.id}
//                                   className="inline-flex cursor-pointer items-center gap-2 truncate font-medium text-slate-800"
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     checked={Boolean(isChecked)}
//                                     onChange={() => handleToggleRowDesignation(row as SubDesignation, desig.id)}
//                                     className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                                   />
//                                   <span className="truncate">{desig.name}</span>
//                                 </label>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <style jsx global>{`
//           .qin {
//             height: 38px;
//             border: 1px solid #e5e7eb;
//             border-radius: 6px;
//             padding: 0 10px;
//             font-size: 13px;
//             color: #374151;
//             outline: none;
//             background: white;
//           }
//           .qin:focus {
//             border-color: #93c5fd;
//             box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
//           }
//         `}</style>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// function TabButton({
//   label,
//   count,
//   active,
//   onClick,
// }: {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={[
//         'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
//         active
//           ? 'border-blue-500 bg-white text-blue-600'
//           : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
//       ].join(' ')}
//     >
//       {label}
//       <span className={active ? 'text-[12px] font-semibold text-blue-600' : 'text-[12px] text-gray-400'}>
//         {count}
//       </span>
//     </button>
//   );
// }





'use client';

import { useMemo, useState, useEffect } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import {
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Layers,
  Plus,
  Search,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
  useSubDesignations,
  useCreateSubDesignation,
  useUpdateSubDesignation,
  useDeleteSubDesignation,
} from '@/features/designation/hooks/useDesignations';

import { useDepartments } from '@/features/departments/hooks/useDepartments';

import type {
  Designation,
  SubDesignation,
} from '@/services/api/designation.service';

type Tab = 'designation' | 'subdesignation';
type Row = Designation | SubDesignation;

export default function DesignationsPage() {
  const [tab, setTab] = useState<Tab>('designation');
  const [filter, setFilter] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddDesignationId, setQuickAddDesignationId] = useState<
    number | ''
  >('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Departments
  // ─────────────────────────────────────────────────────────────────────────
  const {
    data: departments = [],
    isLoading: deptsLoading,
  } = useDepartments({
    is_active: 'true',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Designations
  // ─────────────────────────────────────────────────────────────────────────
  const {
    data: designations = [],
    isLoading: designationsLoading,
  } = useDesignations({
    is_active: 'true',
  });
  // Default select first available designation when switching
  // to Sub-Designations
  useEffect(() => {
    if (
      tab === 'subdesignation' &&
      !quickAddDesignationId &&
      designations.length > 0
    ) {
      setQuickAddDesignationId(designations[0].id);
    }
  }, [tab, designations, quickAddDesignationId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Sub-Designations
  // ─────────────────────────────────────────────────────────────────────────

  const {
    data: subDesignations = [],
    isLoading: subDesignationsLoading,
  } = useSubDesignations({
    is_active: 'true',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────

  const createDesignation = useCreateDesignation();

  const updateDesignation = useUpdateDesignation();

  const deleteDesignation = useDeleteDesignation();

  const createSubDesignation = useCreateSubDesignation();

  const updateSubDesignation = useUpdateSubDesignation();

  const deleteSubDesignation = useDeleteSubDesignation();

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  const filteredDesignations = useMemo(
    () =>
      designations.filter((d) =>
        d.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [designations, filter],
  );

  const filteredSubDesignations = useMemo(
    () =>
      subDesignations.filter((sd) =>
        sd.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [subDesignations, filter],
  );

  const isLoading =
    tab === 'designation'
      ? designationsLoading
      : subDesignationsLoading;

  const rows: Row[] =
    tab === 'designation'
      ? filteredDesignations
      : filteredSubDesignations;

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle Department Handlers
  // ─────────────────────────────────────────────────────────────────────────

  async function handleToggleRowAllDepartments(
    designation: Designation,
  ) {
    const nextValue = !designation.is_all_departments;

    const fallbackIds =
      designation.department_ids &&
      designation.department_ids.length > 0
        ? designation.department_ids
        : departments[0]?.id
          ? [departments[0].id]
          : [];

    await updateDesignation.mutateAsync({
      id: designation.id,

      data: {
        is_all_departments: nextValue,
        department_ids: nextValue ? [] : fallbackIds,
      },
    });
  }

  async function handleToggleRowDepartment(
    designation: Designation,
    departmentId: number,
  ) {
    const currentIds = designation.department_ids || [];

    let nextIds: number[];

    if (designation.is_all_departments) {
      nextIds = [departmentId];
    } else {
      nextIds = currentIds.includes(departmentId)
        ? currentIds.filter((id) => id !== departmentId)
        : [...currentIds, departmentId];
    }

    if (nextIds.length === 0) {
      window.alert(
        'Designation must belong to at least one department or have "All departments" enabled.',
      );

      return;
    }

    await updateDesignation.mutateAsync({
      id: designation.id,

      data: {
        is_all_departments: false,
        department_ids: nextIds,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle Designation Handlers
  // ─────────────────────────────────────────────────────────────────────────

  async function handleToggleRowAllDesignations(
    sub: SubDesignation,
  ) {
    const nextValue = !sub.is_all_designations;

    const fallbackIds =
      sub.designation_ids &&
      sub.designation_ids.length > 0
        ? sub.designation_ids
        : designations[0]?.id
          ? [designations[0].id]
          : [];

    await updateSubDesignation.mutateAsync({
      id: sub.id,

      data: {
        is_all_designations: nextValue,
        designation_ids: nextValue ? [] : fallbackIds,
      },
    });
  }

  async function handleToggleRowDesignation(
    sub: SubDesignation,
    designationId: number,
  ) {
    const currentIds = sub.designation_ids || [];

    let nextIds: number[];

    if (sub.is_all_designations) {
      nextIds = [designationId];
    } else {
      nextIds = currentIds.includes(designationId)
        ? currentIds.filter((id) => id !== designationId)
        : [...currentIds, designationId];
    }

    if (nextIds.length === 0) {
      window.alert(
        'Sub-designation must belong to at least one designation or have "All designations" enabled.',
      );

      return;
    }

    await updateSubDesignation.mutateAsync({
      id: sub.id,

      data: {
        is_all_designations: false,
        designation_ids: nextIds,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab Switching
  // ─────────────────────────────────────────────────────────────────────────

  function switchTab(next: Tab) {
    setTab(next);

    setFilter('');

    setQuickAddName('');

    setQuickAddDesignationId('');

    setEditingId(null);

    setEditingName('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Quick Add
  // ─────────────────────────────────────────────────────────────────────────

  async function handleQuickAdd() {
    const name = quickAddName.trim();

    if (!name) return;

    if (tab === 'designation') {
      await createDesignation.mutateAsync({
        name,

        is_all_departments: true,

        department_ids: [],
      });
    } else {
      if (!quickAddDesignationId) {
        window.alert('Please select a designation first.');

        return;
      }

      await createSubDesignation.mutateAsync({
        name,

        is_all_designations: false,

        designation_ids: [Number(quickAddDesignationId)],
      });
    }

    setQuickAddName('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Edit
  // ─────────────────────────────────────────────────────────────────────────

  function startEdit(row: Row) {
    if (editingId === row.id) {
      setEditingId(null);

      setEditingName('');

      return;
    }

    setEditingId(row.id);

    setEditingName(row.name);
  }

  function cancelEdit() {
    setEditingId(null);

    setEditingName('');
  }

  async function commitEdit(row: Row) {
    const name = editingName.trim();

    if (
      !name ||
      editingId === null ||
      name === row.name
    ) {
      cancelEdit();

      return;
    }

    if (tab === 'designation') {
      await updateDesignation.mutateAsync({
        id: row.id,

        data: {
          name,
        },
      });
    } else {
      await updateSubDesignation.mutateAsync({
        id: row.id,

        data: {
          name,
        },
      });
    }

    cancelEdit();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────────────────

  async function handleDelete(row: Row) {
    if (
      !window.confirm(
        `Delete "${row.name}"? This can't be undone.`,
      )
    ) {
      return;
    }

    if (tab === 'designation') {
      await deleteDesignation.mutateAsync(row.id);
    } else {
      await deleteSubDesignation.mutateAsync(row.id);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Delete Master
  // ─────────────────────────────────────────────────────────────────────────

  async function handleDeleteMaster() {
    const label =
      tab === 'designation'
        ? 'all designations'
        : 'all sub-designations';

    if (
      !window.confirm(
        `Delete ${label} (${rows.length} items)? This can't be undone.`,
      )
    ) {
      return;
    }

    for (const row of rows) {
      if (tab === 'designation') {
        await deleteDesignation.mutateAsync(row.id);
      } else {
        await deleteSubDesignation.mutateAsync(row.id);
      }
    }
  }

  const addDisabled =
    !quickAddName.trim() ||
    (tab === 'subdesignation' &&
      !quickAddDesignationId) ||
    createDesignation.isPending ||
    createSubDesignation.isPending;

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="mx-auto w-full px-6 py-8">

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Header */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {tab === 'designation'
                  ? 'Designation Management'
                  : 'Sub-Designation Management'}
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Manage designations, department assignments,
                and linked sub-designations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteMaster}
                disabled={rows.length === 0}
                className="text-xs font-medium text-red-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete master
              </button>

              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Auto-save on
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Tabs + Search */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">

            <div className="flex gap-2">

              <button
                type="button"
                onClick={() => switchTab('designation')}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === 'designation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 size={14} />

                Designations

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {designations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('subdesignation')}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === 'subdesignation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} />

                Sub-Designations

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {subDesignations.length}
                </span>
              </button>
            </div>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 w-48 rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Quick Creation */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">

            {tab === 'subdesignation' && (
              <select
                className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                value={quickAddDesignationId}
                onChange={(e) =>
                  setQuickAddDesignationId(
                    e.target.value
                      ? Number(e.target.value)
                      : '',
                  )
                }
              >
                <option value="">
                  Select Designation...
                </option>

                {designations.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                  >
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="h-9 flex-1 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
              placeholder={
                tab === 'designation'
                  ? 'Add new designation...'
                  : 'Add new sub-designation...'
              }
              value={quickAddName}
              onChange={(e) =>
                setQuickAddName(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuickAdd();
                }
              }}
            />

            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={addDisabled}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {createDesignation.isPending ||
              createSubDesignation.isPending ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Plus size={14} />
              )}

              Add
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Assignment Info */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">

            <div className="flex items-center gap-2">

              {tab === 'designation' ? (
                <Building2
                  size={14}
                  className="text-slate-400"
                />
              ) : (
                <Layers
                  size={14}
                  className="text-slate-400"
                />
              )}

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {tab === 'designation'
                  ? 'Department Assignment'
                  : 'Designation Assignment'}
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-slate-500">
              {tab === 'designation'
                ? 'A designation can apply to all departments or be linked to one or more specific departments.'
                : 'A sub-designation can apply to all designations or be linked to one or more specific designations.'}
            </p>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Data List */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="divide-y divide-slate-100 overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">

                <Loader2
                  size={16}
                  className="animate-spin text-blue-600"
                />

                Loading configuration records...
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active records available.
              </div>
            ) : (
              rows.map((row, idx) => {
                const isEditing =
                  editingId === row.id;

                const deptNames =
                  tab === 'designation'
                    ? (row as Designation)
                        .is_all_departments
                      ? ['All departments']
                      : (row as Designation)
                          .departments
                          ?.map(
                            (d) =>
                              d.department_name,
                          ) || []
                    : [];

                const designationNames =
                  tab === 'subdesignation'
                    ? (row as SubDesignation)
                        .is_all_designations
                      ? ['All designations']
                      : (row as SubDesignation)
                          .designations
                          ?.map(
                            (desig) =>
                              desig.name,
                          ) || []
                    : [];

                return (
                  <div
                    key={row.id}
                    className="relative"
                    onBlur={(e) => {
                      if (!isEditing) return;

                      if (
                        !e.currentTarget.contains(
                          e.relatedTarget as Node,
                        )
                      ) {
                        commitEdit(row);
                      }
                    }}
                  >

                    {/* Row */}

                    <div className="relative px-4 py-3 transition-colors hover:bg-slate-50/50">

                      <div className="flex items-center justify-between gap-4">

                        {/* Left */}

                        <div className="flex min-w-0 items-center gap-3">

                          <GripVertical
                            size={14}
                            className="shrink-0 cursor-grab text-slate-300"
                          />

                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                            {idx + 1}
                          </span>

                          {isEditing ? (
                            <input
                              autoFocus
                              className="h-9 flex-1 rounded-lg border border-blue-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                              value={editingName}
                              onChange={(e) =>
                                setEditingName(
                                  e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  commitEdit(row);
                                }

                                if (
                                  e.key === 'Escape'
                                ) {
                                  cancelEdit();
                                }
                              }}
                            />
                          ) : (
                            <span className="truncate text-xs font-bold uppercase tracking-wider text-slate-900">
                              {row.name}
                            </span>
                          )}
                        </div>

                        {/* Right */}

                        <div className="flex shrink-0 items-center gap-3">

                          {tab === 'designation' ? (
                            deptNames.length > 0 ? (
                              <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
                                {deptNames.length ===
                                1
                                  ? deptNames[0]
                                  : `${deptNames.length} Departments`}
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-600">
                                0 Departments
                              </span>
                            )
                          ) : designationNames.length >
                            0 ? (
                            <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
                              {designationNames.length ===
                              1
                                ? designationNames[0]
                                : `${designationNames.length} Designations`}
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-600">
                              0 Designations
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(row)
                            }
                            className={`rounded-lg p-1.5 transition-colors ${
                              isEditing
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(row)
                            }
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </div>
                    </div>

                    {/* ───────────────────────────────────────────────────── */}
                    {/* Designation → Department Assignment */}
                    {/* ───────────────────────────────────────────────────── */}

                    {tab === 'designation' &&
                      isEditing && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-9 py-4">

                          <div className="mb-3 flex items-center justify-between">

                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Department Scope
                              </div>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Choose where this designation
                                can be used.
                              </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                              {(row as Designation)
                                .is_all_departments
                                ? 'Global'
                                : `${(row as Designation).department_ids?.length ?? 0} selected`}
                            </span>
                          </div>

                          {/* All Departments */}

                          <label
                            className={`mb-3 flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                              (row as Designation)
                                .is_all_departments
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">

                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                  (row as Designation)
                                    .is_all_departments
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                <Building2 size={15} />
                              </div>

                              <div>
                                <div
                                  className={`text-xs font-semibold ${
                                    (row as Designation)
                                      .is_all_departments
                                      ? 'text-blue-700'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  All Departments
                                </div>

                                <div className="text-[10px] text-slate-400">
                                  Designation applies everywhere
                                </div>
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={Boolean(
                                (row as Designation)
                                  .is_all_departments,
                              )}
                              onChange={() =>
                                handleToggleRowAllDepartments(
                                  row as Designation,
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>

                          {/* Department Grid */}

                          {deptsLoading ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                              <Loader2
                                size={13}
                                className="animate-spin text-blue-600"
                              />

                              Loading departments...
                            </div>
                          ) : (
                            <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                              {departments.length === 0 ? (
                                <div className="w-full py-5 text-center text-xs text-slate-400">
                                  No departments available.
                                </div>
                              ) : (
                                departments.map(
                                  (dept) => {
                                    const isChecked =
                                      Boolean(
                                        (
                                          row as Designation
                                        )
                                          .is_all_departments,
                                      ) ||
                                      Boolean(
                                        (
                                          row as Designation
                                        )
                                          .department_ids
                                          ?.includes(
                                            dept.id,
                                          ),
                                      );

                                    return (
                                      <button
                                        type="button"
                                        key={dept.id}
                                        onClick={() =>
                                          handleToggleRowDepartment(
                                            row as Designation,
                                            dept.id,
                                          )
                                        }
                                        className={`flex min-w-[180px] flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all sm:max-w-[calc(50%-4px)] ${
                                          isChecked
                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                      >

                                        <div className="flex min-w-0 items-center gap-2.5">

                                          <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                              isChecked
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}
                                          >
                                            <Building2
                                              size={14}
                                            />
                                          </div>

                                          <span
                                            className={`truncate text-xs font-semibold ${
                                              isChecked
                                                ? 'text-blue-700'
                                                : 'text-slate-700'
                                            }`}
                                          >
                                            {
                                              dept.department_name
                                            }
                                          </span>
                                        </div>

                                        <div
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                            isChecked
                                              ? 'border-blue-600 bg-blue-600 text-white'
                                              : 'border-slate-300 bg-white'
                                          }`}
                                        >
                                          {isChecked && (
                                            <Check size={12} />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  },
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    {/* ───────────────────────────────────────────────────── */}
                    {/* Sub-Designation → Designation Assignment */}
                    {/* ───────────────────────────────────────────────────── */}

                    {tab === 'subdesignation' &&
                      isEditing && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-9 py-4">

                          <div className="mb-3 flex items-center justify-between">

                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Designation Scope
                              </div>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Choose which designations can
                                use this sub-designation.
                              </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                              {(row as SubDesignation)
                                .is_all_designations
                                ? 'Global'
                                : `${(row as SubDesignation).designation_ids?.length ?? 0} selected`}
                            </span>
                          </div>

                          {/* All Designations */}

                          <label
                            className={`mb-3 flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                              (row as SubDesignation)
                                .is_all_designations
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">

                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                  (row as SubDesignation)
                                    .is_all_designations
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                <Layers size={15} />
                              </div>

                              <div>
                                <div
                                  className={`text-xs font-semibold ${
                                    (row as SubDesignation)
                                      .is_all_designations
                                      ? 'text-blue-700'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  All Designations
                                </div>

                                <div className="text-[10px] text-slate-400">
                                  Sub-designation applies everywhere
                                </div>
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={Boolean(
                                (
                                  row as SubDesignation
                                )
                                  .is_all_designations,
                              )}
                              onChange={() =>
                                handleToggleRowAllDesignations(
                                  row as SubDesignation,
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>

                          {/* Designation Grid */}

                          {designationsLoading ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                              <Loader2
                                size={13}
                                className="animate-spin text-blue-600"
                              />

                              Loading designations...
                            </div>
                          ) : (
                            <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">

                              {designations.length === 0 ? (
                                <div className="w-full py-5 text-center text-xs text-slate-400">
                                  No designations available.
                                </div>
                              ) : (
                                designations.map(
                                  (desig) => {
                                    const isChecked =
                                      Boolean(
                                        (
                                          row as SubDesignation
                                        )
                                          .is_all_designations,
                                      ) ||
                                      Boolean(
                                        (
                                          row as SubDesignation
                                        )
                                          .designation_ids
                                          ?.includes(
                                            desig.id,
                                          ),
                                      );

                                    return (
                                      <button
                                        type="button"
                                        key={desig.id}
                                        onClick={() =>
                                          handleToggleRowDesignation(
                                            row as SubDesignation,
                                            desig.id,
                                          )
                                        }
                                        className={`flex min-w-[180px] flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all sm:max-w-[calc(50%-4px)] ${
                                          isChecked
                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                      >

                                        <div className="flex min-w-0 items-center gap-2.5">

                                          <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                              isChecked
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}
                                          >
                                            <Layers
                                              size={14}
                                            />
                                          </div>

                                          <span
                                            className={`truncate text-xs font-semibold ${
                                              isChecked
                                                ? 'text-blue-700'
                                                : 'text-slate-700'
                                            }`}
                                          >
                                            {desig.name}
                                          </span>
                                        </div>

                                        <div
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                            isChecked
                                              ? 'border-blue-600 bg-blue-600 text-white'
                                              : 'border-slate-300 bg-white'
                                          }`}
                                        >
                                          {isChecked && (
                                            <Check size={12} />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  },
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}
 
