// 'use client';

// import { useMemo, useState, useEffect, useRef } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { GripVertical, Pencil, X, Loader2, Building2, Users2, Check } from 'lucide-react';
// import { useQueries } from '@tanstack/react-query';

// import {
//   useCreateDepartment,
//   useUpdateDepartment,
//   useDeleteDepartment,
// } from '@/features/departments/hooks/useDepartments';

// import { departmentService } from '@/services/api/department.service';
// import type { Department } from '@/services/api/department.service';

// import {
//   useSubDepartments,
//   useCreateSubDepartment,
//   useUpdateSubDepartment,
//   useDeleteSubDepartment,
// } from '@/features/sub-departments/hooks/useSubDepartments';

// import { useCompanies } from '@/features/companies/hooks/useCompanies';
// import type { SubDepartment } from '@/services/api/subDepartment.service';

// type Tab = 'department' | 'subdepartment';
// type Row = Department | SubDepartment;

// export default function DepartmentsPage() {
//   const [tab, setTab] = useState<Tab>('department');
//   const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDeptId, setQuickAddDeptId] = useState<number | ''>('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editingName, setEditingName] = useState('');

//   // ─── Fetch Companies ───────────────────────────────────────────────────
//   const { data: companies = [], isLoading: companiesLoading } = useCompanies({ limit: 100 });

//   const allCompanyIds = useMemo(() => companies.map((c) => c.id), [companies]);
//   const isAllCompaniesSelected = companies.length > 0 && selectedCompanyIds.length === companies.length;

//   // Auto-select all companies on initial load
//   useEffect(() => {
//     if (companies.length > 0 && selectedCompanyIds.length === 0) {
//       setSelectedCompanyIds(companies.map((c) => c.id));
//     }
//   }, [companies]);

//   function toggleSelectAll() {
//     setSelectedCompanyIds(isAllCompaniesSelected ? [] : allCompanyIds);
//   }

//   function toggleCompany(companyId: number) {
//     setSelectedCompanyIds((prev) =>
//       prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
//     );
//   }

//   // ─── Fetch Departments Across Selected Companies ───────────────────────
//   const departmentQueries = useQueries({
//     queries: selectedCompanyIds.map((companyId) => ({
//       queryKey: ['departments', { company_id: companyId, is_active: 'true' }],
//       queryFn: async () => {
//         const res = await departmentService.getAll({ company_id: companyId, is_active: 'true' });
//         return res.data ?? [];
//       },
//       enabled: selectedCompanyIds.length > 0,
//     })),
//   });

//   const deptLoading = departmentQueries.some((q) => q.isLoading);

//   const activeDepartments = useMemo(() => {
//     const map = new Map<number, Department>();
//     departmentQueries.forEach((queryResult) => {
//       if (Array.isArray(queryResult.data)) {
//         queryResult.data.forEach((dept) => map.set(dept.id, dept));
//       }
//     });
//     return Array.from(map.values());
//   }, [departmentQueries]);

//   // Default select first available department when switching to sub-departments
//   useEffect(() => {
//     if (tab === 'subdepartment' && !quickAddDeptId && activeDepartments.length > 0) {
//       setQuickAddDeptId(activeDepartments[0].id);
//     }
//   }, [tab, activeDepartments, quickAddDeptId]);

//   // ─── Fetch Sub-Departments ─────────────────────────────────────────────
//   const { data: subDepartments = [], isLoading: subDeptLoading } = useSubDepartments({ is_active: 'true' });

//   const companyDepartmentIds = useMemo(
//     () => new Set(activeDepartments.map((d) => d.id)),
//     [activeDepartments]
//   );

//   // A sub-department shows for the currently selected companies if it's
//   // flagged "all departments", or if ANY of its linked departments belongs
//   // to a department under the selected companies.
//   const activeSubDepartments = useMemo(() => {
//     if (selectedCompanyIds.length === 0) return [];
//     return subDepartments.filter(
//       (sd) =>
//         sd.is_all_departments ||
//         (sd.department_ids ?? []).some((id) => companyDepartmentIds.has(id))
//     );
//   }, [subDepartments, companyDepartmentIds, selectedCompanyIds]);

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDepartment = useCreateDepartment();
//   const updateDepartment = useUpdateDepartment();
//   const deleteDepartment = useDeleteDepartment();

//   const createSubDepartment = useCreateSubDepartment();
//   const updateSubDepartment = useUpdateSubDepartment();
//   const deleteSubDepartment = useDeleteSubDepartment();

//   // ─── Filtering ───────────────────────────────────────────────────────────
//   const filteredDepartments = useMemo(
//     () => activeDepartments.filter((d) => d.department_name.toLowerCase().includes(filter.toLowerCase())),
//     [activeDepartments, filter]
//   );

//   const filteredSubDepartments = useMemo(
//     () => activeSubDepartments.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [activeSubDepartments, filter]
//   );

//   const isLoading = tab === 'department' ? deptLoading : subDeptLoading;
//   const rows: Row[] = tab === 'department' ? filteredDepartments : filteredSubDepartments;

//   // ─── Company Toggles (Departments) ─────────────────────────────────────
//   async function handleToggleRowAllCompanies(department: Department) {
//     const nextValue = !department.is_all_companies;

//     let fallbackIds = department.company_ids && department.company_ids.length > 0
//       ? department.company_ids
//       : (selectedCompanyIds.length > 0 ? [selectedCompanyIds[0]] : (allCompanyIds[0] ? [allCompanyIds[0]] : []));

//     await updateDepartment.mutateAsync({
//       id: department.id,
//       data: {
//         is_all_companies: nextValue,
//         company_ids: nextValue ? [] : fallbackIds,
//       },
//     });
//   }

//   async function handleToggleRowCompany(department: Department, companyId: number) {
//     const currentIds = department.company_ids || [];

//     let nextIds: number[];
//     if (department.is_all_companies) {
//       nextIds = [companyId];
//     } else {
//       nextIds = currentIds.includes(companyId)
//         ? currentIds.filter((id) => id !== companyId)
//         : [...currentIds, companyId];
//     }

//     if (nextIds.length === 0) {
//       window.alert('Department must belong to at least one company or have "All Companies" enabled.');
//       return;
//     }

//     await updateDepartment.mutateAsync({
//       id: department.id,
//       data: {
//         is_all_companies: false,
//         company_ids: nextIds,
//       },
//     });
//   }

//   // ─── Department Toggles (Sub-Departments) ──────────────────────────────
//   async function handleToggleRowAllDepartments(sub: SubDepartment) {
//     const nextValue = !sub.is_all_departments;
//     const fallbackIds = sub.department_ids && sub.department_ids.length > 0
//       ? sub.department_ids
//       : (activeDepartments[0]?.id ? [activeDepartments[0].id] : []);

//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: {
//         is_all_departments: nextValue,
//         department_ids: nextValue ? [] : fallbackIds,
//       },
//     });
//   }

//   async function handleToggleRowDepartment(sub: SubDepartment, departmentId: number) {
//     const currentIds = sub.department_ids || [];
//     let nextIds: number[];

//     if (sub.is_all_departments) {
//       nextIds = [departmentId];
//     } else {
//       nextIds = currentIds.includes(departmentId)
//         ? currentIds.filter((id) => id !== departmentId)
//         : [...currentIds, departmentId];
//     }

//     if (nextIds.length === 0) {
//       window.alert('Sub-department must belong to at least one department or have "All departments" enabled.');
//       return;
//     }

//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: {
//         is_all_departments: false,
//         department_ids: nextIds,
//       },
//     });
//   }

//   // ─── Handlers ──────────────────────────────────────────────────────────
//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDeptId('');
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (selectedCompanyIds.length === 0) {
//       window.alert('Please select at least one company.');
//       return;
//     }

//     if (tab === 'department') {
//       await createDepartment.mutateAsync({
//         company_ids: selectedCompanyIds,
//         department_name: name,
//         head_id: null,
//       });
//     } else {
//       if (!quickAddDeptId) {
//         window.alert('Please select a department first.');
//         return;
//       }

//       await createSubDepartment.mutateAsync({
//         name,
//         is_all_departments: false,
//         department_ids: [Number(quickAddDeptId)],
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
//     setEditingName(tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name);
//   }

//   function cancelEdit() {
//     setEditingId(null);
//     setEditingName('');
//   }

//   async function commitEdit(row: Row) {
//     const name = editingName.trim();
//     if (!name || editingId === null) {
//       cancelEdit();
//       return;
//     }

//     const currentName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//     if (name === currentName) {
//       cancelEdit();
//       return;
//     }

//     if (tab === 'department') {
//       await updateDepartment.mutateAsync({
//         id: row.id,
//         data: { department_name: name },
//       });
//     } else {
//       await updateSubDepartment.mutateAsync({
//         id: row.id,
//         data: { name },
//       });
//     }
//     cancelEdit();
//   }

//   async function handleDelete(row: Row) {
//     const rowName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//     if (!window.confirm(`Delete "${rowName}"? This can't be undone.`)) return;

//     if (tab === 'department') {
//       await deleteDepartment.mutateAsync(row.id);
//     } else {
//       await deleteSubDepartment.mutateAsync(row.id);
//     }
//   }

//   async function handleDeleteMaster() {
//     if (selectedCompanyIds.length === 0) {
//       window.alert('Please select a company first.');
//       return;
//     }

//     const label = tab === 'department' ? 'all departments' : 'all sub-departments';
//     if (!window.confirm(`Delete ${label} (${rows.length} items)? This can't be undone.`)) return;

//     for (const row of rows) {
//       if (tab === 'department') {
//         await deleteDepartment.mutateAsync(row.id);
//       } else {
//         await deleteSubDepartment.mutateAsync(row.id);
//       }
//     }
//   }

//   const addDisabled =
//     !quickAddName.trim() ||
//     selectedCompanyIds.length === 0 ||
//     (tab === 'subdepartment' && !quickAddDeptId) ||
//     createDepartment.isPending ||
//     createSubDepartment.isPending;

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="mx-auto max-w-5xl px-6 py-8">
//           {/* Header */}
//           <div className="mb-6 flex items-start justify-between gap-4">
//             <div>
//               <h1 className="text-xl font-semibold tracking-tight text-slate-900">
//                 {tab === 'department' ? 'Departments' : 'Sub-Departments'}
//               </h1>
//               <p className="mt-1 text-[13px] text-slate-400">
//                 Departments link to companies, sub-departments link to departments.
//               </p>
//             </div>

//             <div className="flex items-center gap-3">
//               <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
//                 Auto-save on
//               </span>
//               <button
//                 onClick={handleDeleteMaster}
//                 disabled={selectedCompanyIds.length === 0 || rows.length === 0}
//                 className="text-[13px] font-medium text-red-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Delete all
//               </button>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="mb-5 flex items-center gap-2">
//             <TabButton
//               label="Department"
//               count={activeDepartments.length}
//               active={tab === 'department'}
//               onClick={() => switchTab('department')}
//             />
//             <TabButton
//               label="Sub Department"
//               count={activeSubDepartments.length}
//               active={tab === 'subdepartment'}
//               onClick={() => switchTab('subdepartment')}
//             />
//           </div>

//           {/* Quick Add Bar */}
//           <div className="mb-4 flex items-center gap-2.5">
//             {tab === 'subdepartment' && (
//               <select
//                 className="qin w-48 shrink-0"
//                 value={quickAddDeptId}
//                 onChange={(e) => setQuickAddDeptId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select department…</option>
//                 {activeDepartments.map((department) => (
//                   <option key={department.id} value={department.id}>
//                     {department.department_name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               className="qin flex-1"
//               placeholder={tab === 'department' ? 'Add department...' : 'Add sub-department...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={addDisabled}
//               className="rounded-md bg-blue-600 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
//             >
//               Add
//             </button>
//           </div>

//           {/* Filter Bar (company scope) */}
//           <div className="mb-6 rounded-lg border border-slate-200 bg-white">
//             <div className="border-b border-slate-100 px-4 py-3">
//               <ToggleChip
//                 checked={isAllCompaniesSelected}
//                 label="All companies"
//                 sublabel="applies everywhere"
//                 onChange={toggleSelectAll}
//                 emphasized
//               />
//             </div>

//             {companiesLoading ? (
//               <div className="flex items-center gap-2 px-4 py-4 text-[13px] text-slate-400">
//                 <Loader2 size={13} className="animate-spin" />
//                 Loading companies...
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4">
//                 {companies.map((company) => (
//                   <ToggleChip
//                     key={company.id}
//                     checked={selectedCompanyIds.includes(company.id)}
//                     label={company.name}
//                     onChange={() => toggleCompany(company.id)}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Search Bar */}
//           <div className="mb-3 flex items-center gap-2">
//             <input
//               className="qin w-52"
//               placeholder="Filter..."
//               value={filter}
//               onChange={(e) => setFilter(e.target.value)}
//             />
//             <div className="flex-1" />
//             <span className="text-[12px] text-slate-400">{rows.length} total</span>
//           </div>

//           {/* Table List */}
//           <div className="overflow-hidden rounded-lg border border-slate-100">
//             {selectedCompanyIds.length === 0 ? (
//               <div className="p-5 text-[13px] text-slate-400">Select at least one company to view departments.</div>
//             ) : isLoading ? (
//               <div className="flex items-center gap-2 p-5 text-[13px] text-slate-400">
//                 <Loader2 size={13} className="animate-spin" />
//                 Loading…
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-5 text-[13px] text-slate-400">
//                 No {tab === 'department' ? 'departments' : 'sub-departments'} found.
//               </div>
//             ) : (
//               rows.map((row, i) => (
//                 <RowItem
//                   key={row.id}
//                   row={row}
//                   index={i}
//                   tab={tab}
//                   isEditing={editingId === row.id}
//                   editingName={editingName}
//                   setEditingName={setEditingName}
//                   onStartEdit={() => startEdit(row)}
//                   onCommitEdit={() => commitEdit(row)}
//                   onCancelEdit={cancelEdit}
//                   onDelete={() => handleDelete(row)}
//                   companies={companies}
//                   activeDepartments={activeDepartments}
//                   deptLoading={deptLoading}
//                   onToggleRowAllCompanies={handleToggleRowAllCompanies}
//                   onToggleRowCompany={handleToggleRowCompany}
//                   onToggleRowAllDepartments={handleToggleRowAllDepartments}
//                   onToggleRowDepartment={handleToggleRowDepartment}
//                 />
//               ))
//             )}
//           </div>
//         </div>

//         <style jsx global>{`
//           .qin {
//             height: 38px;
//             border: 1px solid #e5e7eb;
//             border-radius: 6px;
//             padding: 0 12px;
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
//         'flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
//         active
//           ? 'border-blue-500 bg-white text-blue-600'
//           : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
//       ].join(' ')}
//     >
//       {label}
//       <span className={active ? 'text-[12px] font-semibold text-blue-600' : 'text-[12px] text-slate-400'}>
//         {count}
//       </span>
//     </button>
//   );
// }

// /**
//  * Self-contained toggle chip: checkbox + label live inside one bordered
//  * box with real padding on every side, and the checked state is carried
//  * by the box itself (border + fill color), not just the tiny native
//  * checkbox. Used in the top company filter and both expandable per-row
//  * panels — replaces bare `<input> + <span>` pairs in a flex-wrap, which
//  * left no breathing room once labels sat right next to each other.
//  */
// function ToggleChip({
//   checked,
//   label,
//   sublabel,
//   onChange,
//   emphasized = false,
// }: {
//   checked: boolean;
//   label: string;
//   sublabel?: string;
//   onChange: () => void;
//   emphasized?: boolean;
// }) {
//   return (
//     <label
//       className={[
//         'flex cursor-pointer select-none items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-[13px] transition-colors',
//         checked
//           ? 'border-blue-200 bg-blue-50/70 text-blue-700'
//           : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
//         emphasized ? 'font-semibold' : 'font-medium',
//       ].join(' ')}
//     >
//       <span
//         className={[
//           'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
//           checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white',
//         ].join(' ')}
//       >
//         {checked && <Check size={11} strokeWidth={3} className="text-white" />}
//       </span>
//       <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
//       <span className="truncate">{label}</span>
//       {sublabel && <span className="truncate font-normal text-slate-400">{sublabel}</span>}
//     </label>
//   );
// }

// /**
//  * A single "linked" badge for a row: "All companies" / "All departments"
//  * when the row is flagged as applying everywhere, a single count badge
//  * ("3 companies") when it's linked to specific ones, or a warning badge
//  * when nothing is linked. Replaces the previous per-item name chips —
//  * those got unreadable once a row had more than 3-4 links.
//  */
// function LinkBadge({
//   icon: Icon,
//   isAll,
//   count,
//   allLabel,
//   noneLabel,
//   unitSingular,
//   unitPlural,
// }: {
//   icon: typeof Building2;
//   isAll: boolean;
//   count: number;
//   allLabel: string;
//   noneLabel: string;
//   unitSingular: string;
//   unitPlural: string;
// }) {
//   if (isAll) {
//     return (
//       <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 px-3 py-1 text-[11px] font-medium text-blue-600">
//         <Icon size={12} />
//         {allLabel}
//       </span>
//     );
//   }

//   if (count === 0) {
//     return (
//       <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-600">
//         {noneLabel}
//       </span>
//     );
//   }

//   return (
//     <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 px-3 py-1 text-[11px] font-medium text-blue-600">
//       <Icon size={12} />
//       {count} {count === 1 ? unitSingular : unitPlural}
//     </span>
//   );
// }

// function RowItem({
//   row,
//   index,
//   tab,
//   isEditing,
//   editingName,
//   setEditingName,
//   onStartEdit,
//   onCommitEdit,
//   onCancelEdit,
//   onDelete,
//   companies,
//   activeDepartments,
//   deptLoading,
//   onToggleRowAllCompanies,
//   onToggleRowCompany,
//   onToggleRowAllDepartments,
//   onToggleRowDepartment,
// }: {
//   row: Row;
//   index: number;
//   tab: Tab;
//   isEditing: boolean;
//   editingName: string;
//   setEditingName: (v: string) => void;
//   onStartEdit: () => void;
//   onCommitEdit: () => void;
//   onCancelEdit: () => void;
//   onDelete: () => void;
//   companies: { id: number; name: string }[];
//   activeDepartments: Department[];
//   deptLoading: boolean;
//   onToggleRowAllCompanies: (d: Department) => void;
//   onToggleRowCompany: (d: Department, companyId: number) => void;
//   onToggleRowAllDepartments: (s: SubDepartment) => void;
//   onToggleRowDepartment: (s: SubDepartment, departmentId: number) => void;
// }) {
//   const rowRef = useRef<HTMLDivElement>(null);

//   const rowName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;

//   const isAllCompanies = tab === 'department' && (row as Department).is_all_companies;
//   const companyCount = tab === 'department' ? (row as Department).company_ids?.length ?? 0 : 0;

//   const isAllDepartments = tab === 'subdepartment' && (row as SubDepartment).is_all_departments;
//   const departmentCount = tab === 'subdepartment' ? (row as SubDepartment).department_ids?.length ?? 0 : 0;

//   /**
//    * Clicking directly on a checkbox moves focus to it immediately, so the
//    * old input's blur fires with a valid `relatedTarget` and the row stays
//    * open. But clicking on the checkbox's *label text* isn't focusable on
//    * its own — the browser blurs the name-edit input first (relatedTarget
//    * is empty at that point) and only focuses the checkbox afterward as
//    * the label's indirect activation, which is too late for that first
//    * blur check. That's what was closing the panel when clicking a name
//    * instead of its checkbox.
//    *
//    * Fix: defer the "did focus really leave the row" check to the next
//    * frame and check document.activeElement directly, once focus has
//    * actually settled, instead of trusting the blur event's timing.
//    */
//   function handleRowBlur() {
//     if (!isEditing) return;
//     requestAnimationFrame(() => {
//       if (!rowRef.current) return;
//       if (!rowRef.current.contains(document.activeElement)) {
//         onCommitEdit();
//       }
//     });
//   }

//   return (
//     <div ref={rowRef} className="border-b border-slate-100 last:border-b-0" onBlur={handleRowBlur}>
//       <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70">
//         <GripVertical size={14} className="shrink-0 cursor-grab text-slate-300" />
//         <span className="w-5 shrink-0 text-[12px] text-slate-400">{index + 1}</span>

//         {isEditing ? (
//           <input
//             autoFocus
//             className="qin !h-8 flex-1"
//             value={editingName}
//             onChange={(e) => setEditingName(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') onCommitEdit();
//               if (e.key === 'Escape') onCancelEdit();
//             }}
//           />
//         ) : (
//           <span className="flex-1 truncate text-[13.5px] font-medium text-slate-800">{rowName}</span>
//         )}

//         {tab === 'department' ? (
//           <LinkBadge
//             icon={Building2}
//             isAll={isAllCompanies}
//             count={companyCount}
//             allLabel="All companies"
//             noneLabel="No companies linked"
//             unitSingular="company"
//             unitPlural="companies"
//           />
//         ) : (
//           <LinkBadge
//             icon={Users2}
//             isAll={isAllDepartments}
//             count={departmentCount}
//             allLabel="All departments"
//             noneLabel="No departments linked"
//             unitSingular="department"
//             unitPlural="departments"
//           />
//         )}

//         <button
//           onClick={onStartEdit}
//           className={`shrink-0 text-slate-400 transition-colors hover:text-slate-600 ${isEditing ? 'text-blue-600' : ''}`}
//           title="Edit"
//         >
//           <Pencil size={13} />
//         </button>

//         <button onClick={onDelete} className="shrink-0 text-slate-400 transition-colors hover:text-red-500" title="Delete">
//           <X size={15} />
//         </button>
//       </div>

//       {/* Expandable Company Checkbox Grid (Department Tab) */}
//       {tab === 'department' && isEditing && (
//         <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-10">
//           <div className="mb-3">
//             <ToggleChip
//               checked={(row as Department).is_all_companies}
//               label="All companies"
//               sublabel="applies everywhere"
//               onChange={() => onToggleRowAllCompanies(row as Department)}
//               emphasized
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
//             {companies.map((company) => {
//               const isChecked =
//                 (row as Department).is_all_companies || (row as Department).company_ids?.includes(company.id);

//               return (
//                 <ToggleChip
//                   key={company.id}
//                   checked={Boolean(isChecked)}
//                   label={company.name}
//                   onChange={() => onToggleRowCompany(row as Department, company.id)}
//                 />
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Expandable Department Checkbox Grid (Sub-Department Tab) */}
//       {tab === 'subdepartment' && isEditing && (
//         <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-10">
//           <div className="mb-3">
//             <ToggleChip
//               checked={(row as SubDepartment).is_all_departments}
//               label="All departments"
//               sublabel="applies everywhere"
//               onChange={() => onToggleRowAllDepartments(row as SubDepartment)}
//               emphasized
//             />
//           </div>

//           {deptLoading ? (
//             <div className="flex items-center gap-2 py-1 text-slate-400">
//               <Loader2 size={12} className="animate-spin" />
//               Loading departments...
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
//               {activeDepartments.map((department) => {
//                 const isChecked =
//                   (row as SubDepartment).is_all_departments ||
//                   (row as SubDepartment).department_ids?.includes(department.id);

//                 return (
//                   <ToggleChip
//                     key={department.id}
//                     checked={Boolean(isChecked)}
//                     label={department.department_name}
//                     onChange={() => onToggleRowDepartment(row as SubDepartment, department.id)}
//                   />
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }



// 'use client';

// import { useMemo, useState, useEffect, useRef } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { 
//   GripVertical, 
//   Pencil, 
//   Trash2, 
//   Loader2, 
//   Building2, 
//   Layers, 
//   Check, 
//   Plus, 
//   ChevronDown,
//   Globe,
//   Search,
//   AlertCircle,
//   X
// } from 'lucide-react';
// import { useQueries } from '@tanstack/react-query';

// import {
//   useCreateDepartment,
//   useUpdateDepartment,
//   useDeleteDepartment,
// } from '@/features/departments/hooks/useDepartments';
// import { departmentService } from '@/services/api/department.service';
// import type { Department } from '@/services/api/department.service';

// import {
//   useSubDepartments,
//   useCreateSubDepartment,
//   useUpdateSubDepartment,
//   useDeleteSubDepartment,
// } from '@/features/sub-departments/hooks/useSubDepartments';

// import { useCompanies } from '@/features/companies/hooks/useCompanies';
// import type { SubDepartment } from '@/services/api/subDepartment.service';

// type Tab = 'department' | 'subdepartment';
// type Row = Department | SubDepartment;

// export default function DepartmentsPage() {
//   const [tab, setTab] = useState<Tab>('department');
//   const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDeptId, setQuickAddDeptId] = useState<number | ''>('');

//   // Track active entity being renamed
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // ─── Fetch Companies ───────────────────────────────────────────────────
//   const { data: companies = [], isLoading: companiesLoading } = useCompanies({ limit: 100 });
//   const allCompanyIds = useMemo(() => companies.map((c) => c.id), [companies]);

//   // Priority logic: If no specific company selected, apply ALL company IDs automatically
//   const effectiveCompanyIds = useMemo(() => {
//     if (selectedCompanyIds.length > 0) return selectedCompanyIds;
//     return allCompanyIds;
//   }, [selectedCompanyIds, allCompanyIds]);

//   const isAllExplicitlySelected = companies.length > 0 && selectedCompanyIds.length === companies.length;

//   function toggleCompanyFilter(companyId: number) {
//     setSelectedCompanyIds((prev) =>
//       prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
//     );
//   }

//   function toggleSelectAllCompanies() {
//     setSelectedCompanyIds(isAllExplicitlySelected ? [] : allCompanyIds);
//   }

//   // ─── Fetch Departments Across Selected Companies ───────────────────────
//   const departmentQueries = useQueries({
//     queries: effectiveCompanyIds.map((companyId) => ({
//       queryKey: ['departments', { company_id: companyId, is_active: 'true' }],
//       queryFn: async () => {
//         const res = await departmentService.getAll({ company_id: companyId, is_active: 'true' });
//         return res.data ?? [];
//       },
//       enabled: effectiveCompanyIds.length > 0,
//     })),
//   });

//   const deptLoading = departmentQueries.some((q) => q.isLoading);

//   const activeDepartments = useMemo(() => {
//     const map = new Map<number, Department>();
//     departmentQueries.forEach((queryResult) => {
//       if (Array.isArray(queryResult.data)) {
//         queryResult.data.forEach((dept) => map.set(dept.id, dept));
//       }
//     });
//     return Array.from(map.values());
//   }, [departmentQueries]);

//   // Set default selection when toggling to sub-departments
//   useEffect(() => {
//     if (tab === 'subdepartment' && !quickAddDeptId && activeDepartments.length > 0) {
//       setQuickAddDeptId(activeDepartments[0].id);
//     }
//   }, [tab, activeDepartments, quickAddDeptId]);

//   // ─── Fetch Sub-Departments ─────────────────────────────────────────────
//   const { data: subDepartments = [], isLoading: subDeptLoading } = useSubDepartments({ is_active: 'true' });

//   const companyDepartmentIds = useMemo(
//     () => new Set(activeDepartments.map((d) => d.id)),
//     [activeDepartments]
//   );

//   const activeSubDepartments = useMemo(() => {
//     return subDepartments.filter(
//       (sd) =>
//         sd.is_all_departments ||
//         (sd.department_ids ?? []).some((id) => companyDepartmentIds.has(id))
//     );
//   }, [subDepartments, companyDepartmentIds]);

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDepartment = useCreateDepartment();
//   const updateDepartment = useUpdateDepartment();
//   const deleteDepartment = useDeleteDepartment();

//   const createSubDepartment = useCreateSubDepartment();
//   const updateSubDepartment = useUpdateSubDepartment();
//   const deleteSubDepartment = useDeleteSubDepartment();

//   // ─── Filtering ───────────────────────────────────────────────────────────
//   const filteredDepartments = useMemo(
//     () => activeDepartments.filter((d) => d.department_name.toLowerCase().includes(filter.toLowerCase())),
//     [activeDepartments, filter]
//   );

//   const filteredSubDepartments = useMemo(
//     () => activeSubDepartments.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [activeSubDepartments, filter]
//   );

//   const isLoading = tab === 'department' ? deptLoading : subDeptLoading;
//   const rows: Row[] = tab === 'department' ? filteredDepartments : filteredSubDepartments;

//   // ─── Action Handlers ─────────────────────────────────────────────────────
//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDeptId('');
//     setEditingId(null);
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (tab === 'department') {
//       await createDepartment.mutateAsync({
//         company_ids: effectiveCompanyIds,
//         department_name: name,
//         head_id: null,
//       });
//     } else {
//       if (!quickAddDeptId) {
//         alert('Please choose a parent department first.');
//         return;
//       }
//       await createSubDepartment.mutateAsync({
//         name,
//         is_all_departments: false,
//         department_ids: [Number(quickAddDeptId)],
//       });
//     }

//     setQuickAddName('');
//   }

//   async function handleDelete(row: Row) {
//     const rowName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//     if (!confirm(`Delete "${rowName}"? This action cannot be undone.`)) return;

//     if (tab === 'department') {
//       await deleteDepartment.mutateAsync(row.id);
//     } else {
//       await deleteSubDepartment.mutateAsync(row.id);
//     }
//   }

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="mx-auto max-w-5xl px-6 py-8">
          
//           {/* Main Section Heading */}
//           <div className="mb-6 flex items-start justify-between">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-slate-900">
//                 Structure Management
//               </h1>
//               <p className="mt-1 text-xs text-slate-500">
//                 Organize structural hierarchy, link companies to departments, and pair sub-departments seamlessly.
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                 Live Sync Active
//               </span>
//             </div>
//           </div>

//           {/* Scope Filter Box */}
//           <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
//             <div className="mb-3 flex items-center justify-between">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
//                 <Building2 size={13} className="text-slate-400" />
//                 Company Scope Filter
//               </span>
//               <button
//                 onClick={toggleSelectAllCompanies}
//                 className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
//               >
//                 {isAllExplicitlySelected ? 'Deselect All' : 'Select All'}
//               </button>
//             </div>

//             {companiesLoading ? (
//               <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
//                 <Loader2 size={13} className="animate-spin text-blue-600" /> Loading company scope options...
//               </div>
//             ) : (
//               <div className="flex flex-wrap gap-2">
//                 {companies.map((company) => {
//                   const active = selectedCompanyIds.includes(company.id);
//                   return (
//                     <button
//                       key={company.id}
//                       onClick={() => toggleCompanyFilter(company.id)}
//                       className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
//                         active
//                           ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
//                           : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
//                       }`}
//                     >
//                       <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-blue-600' : 'bg-slate-300'}`} />
//                       {company.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}

//             {selectedCompanyIds.length === 0 && (
//               <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
//                 <AlertCircle size={13} className="text-amber-500 shrink-0" />
//                 No specific filter selected. All companies are automatically included.
//               </div>
//             )}
//           </div>

//           {/* Tab Navigation & Search Controls */}
//           <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
//             <div className="flex gap-2">
//               <button
//                 onClick={() => switchTab('department')}
//                 className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
//                   tab === 'department'
//                     ? 'border-blue-600 text-blue-600'
//                     : 'border-transparent text-slate-500 hover:text-slate-800'
//                 }`}
//               >
//                 <Building2 size={14} />
//                 Departments
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//                   {activeDepartments.length}
//                 </span>
//               </button>

//               <button
//                 onClick={() => switchTab('subdepartment')}
//                 className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
//                   tab === 'subdepartment'
//                     ? 'border-blue-600 text-blue-600'
//                     : 'border-transparent text-slate-500 hover:text-slate-800'
//                 }`}
//               >
//                 <Layers size={14} />
//                 Sub-Departments
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//                   {activeSubDepartments.length}
//                 </span>
//               </button>
//             </div>

//             <div className="relative">
//               <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={filter}
//                 onChange={(e) => setFilter(e.target.value)}
//                 className="h-8 w-48 rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           {/* Quick Creation Form Bar */}
//           <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
//             {tab === 'subdepartment' && (
//               <select
//                 className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
//                 value={quickAddDeptId}
//                 onChange={(e) => setQuickAddDeptId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select Department...</option>
//                 {activeDepartments.map((dept) => (
//                   <option key={dept.id} value={dept.id}>
//                     {dept.department_name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               type="text"
//               className="h-9 flex-1 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
//               placeholder={tab === 'department' ? 'Add new department...' : 'Add new sub-department...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={!quickAddName.trim()}
//               className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
//             >
//               <Plus size={14} />
//               Add
//             </button>
//           </div>

//           {/* Data List Container */}
//           <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
//             {isLoading ? (
//               <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
//                 <Loader2 size={16} className="animate-spin text-blue-600" /> Loading configuration records...
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-8 text-center text-xs text-slate-400">
//                 No active records available.
//               </div>
//             ) : (
//               <div className="divide-y divide-slate-100">
//                 {rows.map((row, idx) => (
//                   <RowItem
//                     key={row.id}
//                     index={idx + 1}
//                     row={row}
//                     tab={tab}
//                     companies={companies}
//                     activeDepartments={activeDepartments}
//                     isEditing={editingId === row.id}
//                     onStartEdit={() => setEditingId(row.id)}
//                     onStopEdit={() => setEditingId(null)}
//                     onDelete={() => handleDelete(row)}
//                     updateDepartment={updateDepartment}
//                     updateSubDepartment={updateSubDepartment}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// // ─── Row Item Component ──────────────────────────────────────────────────

// function RowItem({
//   index,
//   row,
//   tab,
//   companies,
//   activeDepartments,
//   isEditing,
//   onStartEdit,
//   onStopEdit,
//   onDelete,
//   updateDepartment,
//   updateSubDepartment,
// }: {
//   index: number;
//   row: Row;
//   tab: Tab;
//   companies: { id: number; name: string }[];
//   activeDepartments: Department[];
//   isEditing: boolean;
//   onStartEdit: () => void;
//   onStopEdit: () => void;
//   onDelete: () => void;
//   updateDepartment: any;
//   updateSubDepartment: any;
// }) {
//   const initialName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//   const [name, setName] = useState(initialName);
//   const [isSelectorOpen, setIsSelectorOpen] = useState(false);
//   const selectorRef = useRef<HTMLDivElement>(null);

//   // Synchronize state when external edits clear
//   useEffect(() => {
//     setName(initialName);
//   }, [initialName]);

//   // Handle outside click popover dismissal
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
//         setIsSelectorOpen(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   async function handleNameSave() {
//     const trimmed = name.trim();
//     if (!trimmed) {
//       setName(initialName);
//       onStopEdit();
//       return;
//     }

//     onStopEdit();
//     if (trimmed === initialName) return;

//     if (tab === 'department') {
//       await updateDepartment.mutateAsync({ id: row.id, data: { department_name: trimmed } });
//     } else {
//       await updateSubDepartment.mutateAsync({ id: row.id, data: { name: trimmed } });
//     }
//   }

//   // Department Scoping Logic
//   if (tab === 'department') {
//     const dept = row as Department;
//     const isGlobal = dept.is_all_companies;
//     const selectedIds = dept.company_ids ?? [];

//     const toggleGlobal = async () => {
//       await updateDepartment.mutateAsync({
//         id: dept.id,
//         data: { is_all_companies: !isGlobal, company_ids: !isGlobal ? [] : selectedIds },
//       });
//     };

//     const toggleCompany = async (cId: number) => {
//       const nextIds = selectedIds.includes(cId)
//         ? selectedIds.filter((id) => id !== cId)
//         : [...selectedIds, cId];

//       await updateDepartment.mutateAsync({
//         id: dept.id,
//         data: { is_all_companies: false, company_ids: nextIds },
//       });
//     };

//     return (
//       <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors">
//         <div className="flex items-center gap-3 flex-1">
//           <GripVertical size={14} className="text-slate-300 cursor-grab" />
//           <span className="text-xs font-semibold text-slate-400 w-5">{index}</span>

//           {isEditing ? (
//             <input
//               type="text"
//               autoFocus
//               className="h-7 w-64 rounded border border-blue-400 px-2 text-xs outline-none shadow-sm"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               onBlur={handleNameSave}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') handleNameSave();
//                 if (e.key === 'Escape') onStopEdit();
//               }}
//             />
//           ) : (
//             <div className="flex items-center gap-2">
//               <span className="text-xs font-semibold text-slate-800">{dept.department_name}</span>
//               <button onClick={onStartEdit} className="text-slate-400 hover:text-slate-600">
//                 <Pencil size={12} />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Popover Company Scope Selector */}
//         <div className="relative" ref={selectorRef}>
//           <button
//             onClick={() => setIsSelectorOpen(!isSelectorOpen)}
//             className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
//           >
//             {isGlobal ? (
//               <span className="flex items-center gap-1 text-blue-600 font-semibold">
//                 <Globe size={13} /> Global (All Companies)
//               </span>
//             ) : selectedIds.length > 0 ? (
//               <span className="flex items-center gap-1">
//                 <Building2 size={13} className="text-slate-400" />
//                 {selectedIds.length} {selectedIds.length === 1 ? 'Company' : 'Companies'}
//               </span>
//             ) : (
//               <span className="text-amber-600 font-medium">No Companies Assigned</span>
//             )}
//             <ChevronDown size={12} className="text-slate-400" />
//           </button>

//           {isSelectorOpen && (
//             <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
//               <div
//                 onClick={toggleGlobal}
//                 className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
//               >
//                 <span className="flex items-center gap-1.5">
//                   <Globe size={13} /> All Companies (Global)
//                 </span>
//                 {isGlobal && <Check size={14} className="text-blue-600" />}
//               </div>

//               <div className="my-1 border-t border-slate-100" />

//               <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
//                 {companies.map((company) => {
//                   const checked = !isGlobal && selectedIds.includes(company.id);
//                   return (
//                     <div
//                       key={company.id}
//                       onClick={() => toggleCompany(company.id)}
//                       className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
//                     >
//                       <span className="truncate">{company.name}</span>
//                       {checked && <Check size={14} className="text-blue-600" />}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

//         <button onClick={onDelete} className="ml-4 text-slate-400 hover:text-red-500">
//           <Trash2 size={14} />
//         </button>
//       </div>
//     );
//   }

//   // Sub-Department Scoping Logic
//   const sub = row as SubDepartment;
//   const isGlobalDept = sub.is_all_departments;
//   const selectedDeptIds = sub.department_ids ?? [];

//   const toggleGlobalDept = async () => {
//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: { is_all_departments: !isGlobalDept, department_ids: !isGlobalDept ? [] : selectedDeptIds },
//     });
//   };

//   const toggleDept = async (dId: number) => {
//     const nextIds = selectedDeptIds.includes(dId)
//       ? selectedDeptIds.filter((id) => id !== dId)
//       : [...selectedDeptIds, dId];

//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: { is_all_departments: false, department_ids: nextIds },
//     });
//   };

//   return (
//     <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors">
//       <div className="flex items-center gap-3 flex-1">
//         <GripVertical size={14} className="text-slate-300 cursor-grab" />
//         <span className="text-xs font-semibold text-slate-400 w-5">{index}</span>

//         {isEditing ? (
//           <input
//             type="text"
//             autoFocus
//             className="h-7 w-64 rounded border border-blue-400 px-2 text-xs outline-none shadow-sm"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             onBlur={handleNameSave}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') handleNameSave();
//               if (e.key === 'Escape') onStopEdit();
//             }}
//           />
//         ) : (
//           <div className="flex items-center gap-2">
//             <span className="text-xs font-semibold text-slate-800">{sub.name}</span>
//             <button onClick={onStartEdit} className="text-slate-400 hover:text-slate-600">
//               <Pencil size={12} />
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="relative" ref={selectorRef}>
//         <button
//           onClick={() => setIsSelectorOpen(!isSelectorOpen)}
//           className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
//         >
//           {isGlobalDept ? (
//             <span className="flex items-center gap-1 text-blue-600 font-semibold">
//               <Globe size={13} /> All Departments
//             </span>
//           ) : selectedDeptIds.length > 0 ? (
//             <span className="flex items-center gap-1">
//               <Layers size={13} className="text-slate-400" />
//               {selectedDeptIds.length} {selectedDeptIds.length === 1 ? 'Department' : 'Departments'}
//             </span>
//           ) : (
//             <span className="text-amber-600 font-medium">No Departments Assigned</span>
//           )}
//           <ChevronDown size={12} className="text-slate-400" />
//         </button>

//         {isSelectorOpen && (
//           <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
//             <div
//               onClick={toggleGlobalDept}
//               className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
//             >
//               <span className="flex items-center gap-1.5">
//                 <Globe size={13} /> All Departments
//               </span>
//               {isGlobalDept && <Check size={14} className="text-blue-600" />}
//             </div>

//             <div className="my-1 border-t border-slate-100" />

//             <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
//               {activeDepartments.map((dept) => {
//                 const checked = !isGlobalDept && selectedDeptIds.includes(dept.id);
//                 return (
//                   <div
//                     key={dept.id}
//                     onClick={() => toggleDept(dept.id)}
//                     className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
//                   >
//                     <span className="truncate">{dept.department_name}</span>
//                     {checked && <Check size={14} className="text-blue-600" />}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </div>

//       <button onClick={onDelete} className="ml-4 text-slate-400 hover:text-red-500">
//         <Trash2 size={14} />
//       </button>
//     </div>
//   );
// }




// 'use client';

// import { useMemo, useState, useEffect, useRef } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { 
//   GripVertical, 
//   Pencil, 
//   Trash2, 
//   Loader2, 
//   Building2, 
//   Layers, 
//   Check, 
//   Plus, 
//   ChevronDown,
//   Globe,
//   Search,
//   AlertCircle,
//   X
// } from 'lucide-react';
// import { useQueries } from '@tanstack/react-query';

// import {
//   useCreateDepartment,
//   useUpdateDepartment,
//   useDeleteDepartment,
// } from '@/features/departments/hooks/useDepartments';
// import { departmentService } from '@/services/api/department.service';
// import type { Department } from '@/services/api/department.service';

// import {
//   useSubDepartments,
//   useCreateSubDepartment,
//   useUpdateSubDepartment,
//   useDeleteSubDepartment,
// } from '@/features/sub-departments/hooks/useSubDepartments';

// import { useCompanies } from '@/features/companies/hooks/useCompanies';
// import type { SubDepartment } from '@/services/api/subDepartment.service';

// type Tab = 'department' | 'subdepartment';
// type Row = Department | SubDepartment;

// export default function DepartmentsPage() {
//   const [tab, setTab] = useState<Tab>('department');
//   const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDeptId, setQuickAddDeptId] = useState<number | ''>('');

//   // Track active entity being renamed
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // ─── Fetch Companies ───────────────────────────────────────────────────
//   const { data: companies = [], isLoading: companiesLoading } = useCompanies({ limit: 100 });
//   const allCompanyIds = useMemo(() => companies.map((c) => c.id), [companies]);

//   // Priority logic: If no specific company selected, apply ALL company IDs automatically
//   const effectiveCompanyIds = useMemo(() => {
//     if (selectedCompanyIds.length > 0) return selectedCompanyIds;
//     return allCompanyIds;
//   }, [selectedCompanyIds, allCompanyIds]);

//   const isAllExplicitlySelected = companies.length > 0 && selectedCompanyIds.length === companies.length;

//   function toggleCompanyFilter(companyId: number) {
//     setSelectedCompanyIds((prev) =>
//       prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
//     );
//   }

//   function toggleSelectAllCompanies() {
//     setSelectedCompanyIds(isAllExplicitlySelected ? [] : allCompanyIds);
//   }

//   // ─── Fetch Departments Across Selected Companies ───────────────────────
//   const departmentQueries = useQueries({
//     queries: effectiveCompanyIds.map((companyId) => ({
//       queryKey: ['departments', { company_id: companyId, is_active: 'true' }],
//       queryFn: async () => {
//         const res = await departmentService.getAll({ company_id: companyId, is_active: 'true' });
//         return res.data ?? [];
//       },
//       enabled: effectiveCompanyIds.length > 0,
//     })),
//   });

//   const deptLoading = departmentQueries.some((q) => q.isLoading);

//   const activeDepartments = useMemo(() => {
//     const map = new Map<number, Department>();
//     departmentQueries.forEach((queryResult) => {
//       if (Array.isArray(queryResult.data)) {
//         queryResult.data.forEach((dept) => map.set(dept.id, dept));
//       }
//     });
//     return Array.from(map.values());
//   }, [departmentQueries]);

//   // Set default selection when toggling to sub-departments
//   useEffect(() => {
//     if (tab === 'subdepartment' && !quickAddDeptId && activeDepartments.length > 0) {
//       setQuickAddDeptId(activeDepartments[0].id);
//     }
//   }, [tab, activeDepartments, quickAddDeptId]);

//   // ─── Fetch Sub-Departments ─────────────────────────────────────────────
//   const { data: subDepartments = [], isLoading: subDeptLoading } = useSubDepartments({ is_active: 'true' });

//   const companyDepartmentIds = useMemo(
//     () => new Set(activeDepartments.map((d) => d.id)),
//     [activeDepartments]
//   );

//   const activeSubDepartments = useMemo(() => {
//     return subDepartments.filter(
//       (sd) =>
//         sd.is_all_departments ||
//         (sd.department_ids ?? []).some((id) => companyDepartmentIds.has(id))
//     );
//   }, [subDepartments, companyDepartmentIds]);

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDepartment = useCreateDepartment();
//   const updateDepartment = useUpdateDepartment();
//   const deleteDepartment = useDeleteDepartment();

//   const createSubDepartment = useCreateSubDepartment();
//   const updateSubDepartment = useUpdateSubDepartment();
//   const deleteSubDepartment = useDeleteSubDepartment();

//   // ─── Filtering ───────────────────────────────────────────────────────────
//   const filteredDepartments = useMemo(
//     () => activeDepartments.filter((d) => d.department_name.toLowerCase().includes(filter.toLowerCase())),
//     [activeDepartments, filter]
//   );

//   const filteredSubDepartments = useMemo(
//     () => activeSubDepartments.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [activeSubDepartments, filter]
//   );

//   const isLoading = tab === 'department' ? deptLoading : subDeptLoading;
//   const rows: Row[] = tab === 'department' ? filteredDepartments : filteredSubDepartments;

//   // ─── Action Handlers ─────────────────────────────────────────────────────
//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDeptId('');
//     setEditingId(null);
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (tab === 'department') {
//       await createDepartment.mutateAsync({
//         company_ids: effectiveCompanyIds,
//         department_name: name,
//         head_id: null,
//       });
//     } else {
//       if (!quickAddDeptId) {
//         alert('Please choose a parent department first.');
//         return;
//       }
//       await createSubDepartment.mutateAsync({
//         name,
//         is_all_departments: false,
//         department_ids: [Number(quickAddDeptId)],
//       });
//     }

//     setQuickAddName('');
//   }

//   async function handleDelete(row: Row) {
//     const rowName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//     if (!confirm(`Delete "${rowName}"? This action cannot be undone.`)) return;

//     if (tab === 'department') {
//       await deleteDepartment.mutateAsync(row.id);
//     } else {
//       await deleteSubDepartment.mutateAsync(row.id);
//     }
//   }

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="mx-auto max-w-5xl px-6 py-8">
          
//           {/* Main Section Heading */}
//           <div className="mb-6 flex items-start justify-between">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-slate-900">
//                 Structure Management
//               </h1>
//               <p className="mt-1 text-xs text-slate-500">
//                 Organize structural hierarchy, link companies to departments, and pair sub-departments seamlessly.
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                 Live Sync Active
//               </span>
//             </div>
//           </div>

//           {/* Scope Filter Box */}
//           <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
//             <div className="mb-3 flex items-center justify-between">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
//                 <Building2 size={13} className="text-slate-400" />
//                 Company Scope Filter
//               </span>
//               <button
//                 onClick={toggleSelectAllCompanies}
//                 className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
//               >
//                 {isAllExplicitlySelected ? 'Deselect All' : 'Select All'}
//               </button>
//             </div>

//             {companiesLoading ? (
//               <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
//                 <Loader2 size={13} className="animate-spin text-blue-600" /> Loading company scope options...
//               </div>
//             ) : (
//               <div className="flex flex-wrap gap-2">
//                 {companies.map((company) => {
//                   const active = selectedCompanyIds.includes(company.id);
//                   return (
//                     <button
//                       key={company.id}
//                       onClick={() => toggleCompanyFilter(company.id)}
//                       className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
//                         active
//                           ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
//                           : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
//                       }`}
//                     >
//                       <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-blue-600' : 'bg-slate-300'}`} />
//                       {company.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}

//             {selectedCompanyIds.length === 0 && (
//               <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
//                 <AlertCircle size={13} className="text-amber-500 shrink-0" />
//                 No specific filter selected. All companies are automatically included.
//               </div>
//             )}
//           </div>

//           {/* Tab Navigation & Search Controls */}
//           <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
//             <div className="flex gap-2">
//               <button
//                 onClick={() => switchTab('department')}
//                 className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
//                   tab === 'department'
//                     ? 'border-blue-600 text-blue-600'
//                     : 'border-transparent text-slate-500 hover:text-slate-800'
//                 }`}
//               >
//                 <Building2 size={14} />
//                 Departments
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//                   {activeDepartments.length}
//                 </span>
//               </button>

//               <button
//                 onClick={() => switchTab('subdepartment')}
//                 className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
//                   tab === 'subdepartment'
//                     ? 'border-blue-600 text-blue-600'
//                     : 'border-transparent text-slate-500 hover:text-slate-800'
//                 }`}
//               >
//                 <Layers size={14} />
//                 Sub-Departments
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//                   {activeSubDepartments.length}
//                 </span>
//               </button>
//             </div>

//             <div className="relative">
//               <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={filter}
//                 onChange={(e) => setFilter(e.target.value)}
//                 className="h-8 w-48 rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           {/* Quick Creation Form Bar */}
//           <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
//             {tab === 'subdepartment' && (
//               <select
//                 className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
//                 value={quickAddDeptId}
//                 onChange={(e) => setQuickAddDeptId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select Department...</option>
//                 {activeDepartments.map((dept) => (
//                   <option key={dept.id} value={dept.id}>
//                     {dept.department_name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               type="text"
//               className="h-9 flex-1 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
//               placeholder={tab === 'department' ? 'Add new department...' : 'Add new sub-department...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={!quickAddName.trim()}
//               className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
//             >
//               <Plus size={14} />
//               Add
//             </button>
//           </div>

//           {/* Data List Container */}
//           <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
//             {isLoading ? (
//               <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
//                 <Loader2 size={16} className="animate-spin text-blue-600" /> Loading configuration records...
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-8 text-center text-xs text-slate-400">
//                 No active records available.
//               </div>
//             ) : (
//               <div className="divide-y divide-slate-100">
//                 {rows.map((row, idx) => (
//                   <RowItem
//                     key={row.id}
//                     index={idx + 1}
//                     row={row}
//                     tab={tab}
//                     companies={companies}
//                     activeDepartments={activeDepartments}
//                     isEditing={editingId === row.id}
//                     onStartEdit={() => setEditingId(row.id)}
//                     onStopEdit={() => setEditingId(null)}
//                     onDelete={() => handleDelete(row)}
//                     updateDepartment={updateDepartment}
//                     updateSubDepartment={updateSubDepartment}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// // ─── Row Item Component ──────────────────────────────────────────────────

// function RowItem({
//   index,
//   row,
//   tab,
//   companies,
//   activeDepartments,
//   isEditing,
//   onStartEdit,
//   onStopEdit,
//   onDelete,
//   updateDepartment,
//   updateSubDepartment,
// }: {
//   index: number;
//   row: Row;
//   tab: Tab;
//   companies: { id: number; name: string }[];
//   activeDepartments: Department[];
//   isEditing: boolean;
//   onStartEdit: () => void;
//   onStopEdit: () => void;
//   onDelete: () => void;
//   updateDepartment: any;
//   updateSubDepartment: any;
// }) {
//   const initialName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//   const [name, setName] = useState(initialName);
//   const [isSelectorOpen, setIsSelectorOpen] = useState(false);
//   const selectorRef = useRef<HTMLDivElement>(null);

//   // Synchronize state when external edits clear
//   useEffect(() => {
//     setName(initialName);
//   }, [initialName]);

//   // Handle outside click popover dismissal
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
//         setIsSelectorOpen(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   async function handleNameSave() {
//     const trimmed = name.trim();
//     if (!trimmed) {
//       setName(initialName);
//       onStopEdit();
//       return;
//     }

//     onStopEdit();
//     if (trimmed === initialName) return;

//     if (tab === 'department') {
//       await updateDepartment.mutateAsync({ id: row.id, data: { department_name: trimmed } });
//     } else {
//       await updateSubDepartment.mutateAsync({ id: row.id, data: { name: trimmed } });
//     }
//   }

//   // Department Scoping Logic
//   if (tab === 'department') {
//     const dept = row as Department;
//     const isGlobal = dept.is_all_companies;
//     const selectedIds = dept.company_ids ?? [];

//     const toggleGlobal = async () => {
//       await updateDepartment.mutateAsync({
//         id: dept.id,
//         data: { is_all_companies: !isGlobal, company_ids: !isGlobal ? [] : selectedIds },
//       });
//     };

//     const toggleCompany = async (cId: number) => {
//       const nextIds = selectedIds.includes(cId)
//         ? selectedIds.filter((id) => id !== cId)
//         : [...selectedIds, cId];

//       await updateDepartment.mutateAsync({
//         id: dept.id,
//         data: { is_all_companies: false, company_ids: nextIds },
//       });
//     };

//     return (
//       <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors">
//         <div className="flex items-center gap-3 flex-1">
//           <GripVertical size={14} className="text-slate-300 cursor-grab" />
//           <span className="text-xs font-semibold text-slate-400 w-5">{index}</span>

//           {isEditing ? (
//             <input
//               type="text"
//               autoFocus
//               className="h-7 w-64 rounded border border-blue-400 px-2 text-xs outline-none shadow-sm"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               onBlur={handleNameSave}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') handleNameSave();
//                 if (e.key === 'Escape') onStopEdit();
//               }}
//             />
//           ) : (
//             <div className="flex items-center gap-2">
//               <span className="text-xs font-semibold text-slate-800">{dept.department_name}</span>
//               <button onClick={onStartEdit} className="text-slate-400 hover:text-slate-600">
//                 <Pencil size={12} />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Popover Company Scope Selector */}
//         <div className="relative" ref={selectorRef}>
//           <button
//             onClick={() => setIsSelectorOpen(!isSelectorOpen)}
//             className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
//           >
//             {isGlobal ? (
//               <span className="flex items-center gap-1 text-blue-600 font-semibold">
//                 <Globe size={13} /> Global (All Companies)
//               </span>
//             ) : selectedIds.length > 0 ? (
//               <span className="flex items-center gap-1">
//                 <Building2 size={13} className="text-slate-400" />
//                 {selectedIds.length} {selectedIds.length === 1 ? 'Company' : 'Companies'}
//               </span>
//             ) : (
//               <span className="text-amber-600 font-medium">No Companies Assigned</span>
//             )}
//             <ChevronDown size={12} className="text-slate-400" />
//           </button>

//           {isSelectorOpen && (
//             <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
//               <div
//                 onClick={toggleGlobal}
//                 className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
//               >
//                 <span className="flex items-center gap-1.5">
//                   <Globe size={13} /> All Companies (Global)
//                 </span>
//                 {isGlobal && <Check size={14} className="text-blue-600" />}
//               </div>

//               <div className="my-1 border-t border-slate-100" />

//               <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
//                 {companies.map((company) => {
//                   const checked = !isGlobal && selectedIds.includes(company.id);
//                   return (
//                     <div
//                       key={company.id}
//                       onClick={() => toggleCompany(company.id)}
//                       className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
//                     >
//                       <span className="truncate">{company.name}</span>
//                       {checked && <Check size={14} className="text-blue-600" />}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

//         <button onClick={onDelete} className="ml-4 text-slate-400 hover:text-red-500">
//           <Trash2 size={14} />
//         </button>
//       </div>
//     );
//   }

//   // Sub-Department Scoping Logic
//   const sub = row as SubDepartment;
//   const isGlobalDept = sub.is_all_departments;
//   const selectedDeptIds = sub.department_ids ?? [];

//   const toggleGlobalDept = async () => {
//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: { is_all_departments: !isGlobalDept, department_ids: !isGlobalDept ? [] : selectedDeptIds },
//     });
//   };

//   const toggleDept = async (dId: number) => {
//     const nextIds = selectedDeptIds.includes(dId)
//       ? selectedDeptIds.filter((id) => id !== dId)
//       : [...selectedDeptIds, dId];

//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: { is_all_departments: false, department_ids: nextIds },
//     });
//   };

//   return (
//     <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors">
//       <div className="flex items-center gap-3 flex-1">
//         <GripVertical size={14} className="text-slate-300 cursor-grab" />
//         <span className="text-xs font-semibold text-slate-400 w-5">{index}</span>

//         {isEditing ? (
//           <input
//             type="text"
//             autoFocus
//             className="h-7 w-64 rounded border border-blue-400 px-2 text-xs outline-none shadow-sm"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             onBlur={handleNameSave}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') handleNameSave();
//               if (e.key === 'Escape') onStopEdit();
//             }}
//           />
//         ) : (
//           <div className="flex items-center gap-2">
//             <span className="text-xs font-semibold text-slate-800">{sub.name}</span>
//             <button onClick={onStartEdit} className="text-slate-400 hover:text-slate-600">
//               <Pencil size={12} />
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="relative" ref={selectorRef}>
//         <button
//           onClick={() => setIsSelectorOpen(!isSelectorOpen)}
//           className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
//         >
//           {isGlobalDept ? (
//             <span className="flex items-center gap-1 text-blue-600 font-semibold">
//               <Globe size={13} /> All Departments
//             </span>
//           ) : selectedDeptIds.length > 0 ? (
//             <span className="flex items-center gap-1">
//               <Layers size={13} className="text-slate-400" />
//               {selectedDeptIds.length} {selectedDeptIds.length === 1 ? 'Department' : 'Departments'}
//             </span>
//           ) : (
//             <span className="text-amber-600 font-medium">No Departments Assigned</span>
//           )}
//           <ChevronDown size={12} className="text-slate-400" />
//         </button>

//         {isSelectorOpen && (
//           <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
//             <div
//               onClick={toggleGlobalDept}
//               className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
//             >
//               <span className="flex items-center gap-1.5">
//                 <Globe size={13} /> All Departments
//               </span>
//               {isGlobalDept && <Check size={14} className="text-blue-600" />}
//             </div>

//             <div className="my-1 border-t border-slate-100" />

//             <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
//               {activeDepartments.map((dept) => {
//                 const checked = !isGlobalDept && selectedDeptIds.includes(dept.id);
//                 return (
//                   <div
//                     key={dept.id}
//                     onClick={() => toggleDept(dept.id)}
//                     className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
//                   >
//                     <span className="truncate">{dept.department_name}</span>
//                     {checked && <Check size={14} className="text-blue-600" />}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </div>

//       <button onClick={onDelete} className="ml-4 text-slate-400 hover:text-red-500">
//         <Trash2 size={14} />
//       </button>
//     </div>
//   );
// }





// 'use client';

// import { useMemo, useState, useEffect, useRef } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { 
//   GripVertical, 
//   Pencil, 
//   Trash2, 
//   Loader2, 
//   Building2, 
//   Layers, 
//   Plus, 
//   Search,
//   AlertCircle,
//   Check,
//   ChevronDown
// } from 'lucide-react';
// import { useQueries } from '@tanstack/react-query';

// import {
//   useCreateDepartment,
//   useUpdateDepartment,
//   useDeleteDepartment,
// } from '@/features/departments/hooks/useDepartments';
// import { departmentService } from '@/services/api/department.service';
// import type { Department } from '@/services/api/department.service';

// import {
//   useSubDepartments,
//   useCreateSubDepartment,
//   useUpdateSubDepartment,
//   useDeleteSubDepartment,
// } from '@/features/sub-departments/hooks/useSubDepartments';

// import { useCompanies } from '@/features/companies/hooks/useCompanies';
// import type { SubDepartment } from '@/services/api/subDepartment.service';

// type Tab = 'department' | 'subdepartment';
// type Row = Department | SubDepartment;

// export default function DepartmentsPage() {
//   const [tab, setTab] = useState<Tab>('department');
//   const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
//   const [filter, setFilter] = useState('');
//   const [quickAddName, setQuickAddName] = useState('');
//   const [quickAddDeptId, setQuickAddDeptId] = useState<number | ''>('');

//   const [editingId, setEditingId] = useState<number | null>(null);

//   // ─── Fetch Companies ───────────────────────────────────────────────────
//   const { data: companies = [], isLoading: companiesLoading } = useCompanies({ limit: 100 });
//   const allCompanyIds = useMemo(() => companies.map((c) => c.id), [companies]);

//   // Priority logic: If no company filter is checked, default to ALL company IDs
//   const effectiveCompanyIds = useMemo(() => {
//     if (selectedCompanyIds.length > 0) return selectedCompanyIds;
//     return allCompanyIds;
//   }, [selectedCompanyIds, allCompanyIds]);

//   const isAllExplicitlySelected = companies.length > 0 && selectedCompanyIds.length === companies.length;

//   function toggleCompanyFilter(companyId: number) {
//     setSelectedCompanyIds((prev) =>
//       prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
//     );
//   }

//   function toggleSelectAllCompanies() {
//     setSelectedCompanyIds(isAllExplicitlySelected ? [] : allCompanyIds);
//   }

//   // ─── Fetch Departments ─────────────────────────────────────────────────
//   const departmentQueries = useQueries({
//     queries: effectiveCompanyIds.map((companyId) => ({
//       queryKey: ['departments', { company_id: companyId, is_active: 'true' }],
//       queryFn: async () => {
//         const res = await departmentService.getAll({ company_id: companyId, is_active: 'true' });
//         return res.data ?? [];
//       },
//       enabled: effectiveCompanyIds.length > 0,
//     })),
//   });

//   const deptLoading = departmentQueries.some((q) => q.isLoading);

//   const activeDepartments = useMemo(() => {
//     const map = new Map<number, Department>();
//     departmentQueries.forEach((queryResult) => {
//       if (Array.isArray(queryResult.data)) {
//         queryResult.data.forEach((dept) => map.set(dept.id, dept));
//       }
//     });
//     return Array.from(map.values());
//   }, [departmentQueries]);

//   useEffect(() => {
//     if (tab === 'subdepartment' && !quickAddDeptId && activeDepartments.length > 0) {
//       setQuickAddDeptId(activeDepartments[0].id);
//     }
//   }, [tab, activeDepartments, quickAddDeptId]);

//   // ─── Fetch Sub-Departments ─────────────────────────────────────────────
//   const { data: subDepartments = [], isLoading: subDeptLoading } = useSubDepartments({ is_active: 'true' });

//   const companyDepartmentIds = useMemo(
//     () => new Set(activeDepartments.map((d) => d.id)),
//     [activeDepartments]
//   );

//   const activeSubDepartments = useMemo(() => {
//     return subDepartments.filter(
//       (sd) =>
//         sd.is_all_departments ||
//         (sd.department_ids ?? []).some((id) => companyDepartmentIds.has(id))
//     );
//   }, [subDepartments, companyDepartmentIds]);

//   // ─── Mutations ──────────────────────────────────────────────────────────
//   const createDepartment = useCreateDepartment();
//   const updateDepartment = useUpdateDepartment();
//   const deleteDepartment = useDeleteDepartment();

//   const createSubDepartment = useCreateSubDepartment();
//   const updateSubDepartment = useUpdateSubDepartment();
//   const deleteSubDepartment = useDeleteSubDepartment();

//   // ─── Filtering ───────────────────────────────────────────────────────────
//   const filteredDepartments = useMemo(
//     () => activeDepartments.filter((d) => d.department_name.toLowerCase().includes(filter.toLowerCase())),
//     [activeDepartments, filter]
//   );

//   const filteredSubDepartments = useMemo(
//     () => activeSubDepartments.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
//     [activeSubDepartments, filter]
//   );

//   const isLoading = tab === 'department' ? deptLoading : subDeptLoading;
//   const rows: Row[] = tab === 'department' ? filteredDepartments : filteredSubDepartments;

//   function switchTab(next: Tab) {
//     setTab(next);
//     setFilter('');
//     setQuickAddName('');
//     setQuickAddDeptId('');
//     setEditingId(null);
//   }

//   async function handleQuickAdd() {
//     const name = quickAddName.trim();
//     if (!name) return;

//     if (tab === 'department') {
//       await createDepartment.mutateAsync({
//         company_ids: effectiveCompanyIds,
//         department_name: name,
//         head_id: null,
//       });
//     } else {
//       if (!quickAddDeptId) {
//         alert('Please choose a parent department.');
//         return;
//       }
//       await createSubDepartment.mutateAsync({
//         name,
//         is_all_departments: false,
//         department_ids: [Number(quickAddDeptId)],
//       });
//     }

//     setQuickAddName('');
//   }

//   async function handleDelete(row: Row) {
//     const rowName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//     if (!confirm(`Delete "${rowName}"? This action cannot be undone.`)) return;

//     if (tab === 'department') {
//       await deleteDepartment.mutateAsync(row.id);
//     } else {
//       await deleteSubDepartment.mutateAsync(row.id);
//     }
//   }

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="mx-auto max-w-5xl px-6 py-8">
          
//           {/* Header */}
//           <div className="mb-6 flex items-start justify-between">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-slate-900">
//                 Structure Management
//               </h1>
//               <p className="mt-1 text-xs text-slate-500">
//                 Manage structural hierarchy, company assignments, and linked sub-departments.
//               </p>
//             </div>
//             <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
//               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//               Live Sync Active
//             </span>
//           </div>

//           {/* Scope Filter Box */}
//           <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
//             <div className="mb-3 flex items-center justify-between">
//               <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
//                 <Building2 size={13} className="text-slate-400" />
//                 Company Scope Filter
//               </span>
//               <button
//                 onClick={toggleSelectAllCompanies}
//                 className="text-xs font-medium text-blue-600 hover:text-blue-700"
//               >
//                 {isAllExplicitlySelected ? 'Deselect All' : 'Select All'}
//               </button>
//             </div>

//             {companiesLoading ? (
//               <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
//                 <Loader2 size={13} className="animate-spin text-blue-600" /> Loading company scope options...
//               </div>
//             ) : (
//               <div className="flex flex-wrap gap-2">
//                 {companies.map((company) => {
//                   const active = selectedCompanyIds.includes(company.id);
//                   return (
//                     <button
//                       key={company.id}
//                       onClick={() => toggleCompanyFilter(company.id)}
//                       className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
//                         active
//                           ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
//                           : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
//                       }`}
//                     >
//                       <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-blue-600' : 'bg-slate-300'}`} />
//                       {company.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}

//             {selectedCompanyIds.length === 0 && (
//               <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
//                 <AlertCircle size={13} className="text-amber-500 shrink-0" />
//                 No specific filter selected. All companies are automatically included.
//               </div>
//             )}
//           </div>

//           {/* Tab Navigation & Search */}
//           <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
//             <div className="flex gap-2">
//               <button
//                 onClick={() => switchTab('department')}
//                 className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
//                   tab === 'department'
//                     ? 'border-blue-600 text-blue-600'
//                     : 'border-transparent text-slate-500 hover:text-slate-800'
//                 }`}
//               >
//                 <Building2 size={14} />
//                 Departments
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//                   {activeDepartments.length}
//                 </span>
//               </button>

//               <button
//                 onClick={() => switchTab('subdepartment')}
//                 className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
//                   tab === 'subdepartment'
//                     ? 'border-blue-600 text-blue-600'
//                     : 'border-transparent text-slate-500 hover:text-slate-800'
//                 }`}
//               >
//                 <Layers size={14} />
//                 Sub-Departments
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//                   {activeSubDepartments.length}
//                 </span>
//               </button>
//             </div>

//             <div className="relative">
//               <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={filter}
//                 onChange={(e) => setFilter(e.target.value)}
//                 className="h-8 w-48 rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           {/* Quick Creation Form Bar */}
//           <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
//             {tab === 'subdepartment' && (
//               <select
//                 className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
//                 value={quickAddDeptId}
//                 onChange={(e) => setQuickAddDeptId(e.target.value ? Number(e.target.value) : '')}
//               >
//                 <option value="">Select Department...</option>
//                 {activeDepartments.map((dept) => (
//                   <option key={dept.id} value={dept.id}>
//                     {dept.department_name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <input
//               type="text"
//               className="h-9 flex-1 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
//               placeholder={tab === 'department' ? 'Add new department...' : 'Add new sub-department...'}
//               value={quickAddName}
//               onChange={(e) => setQuickAddName(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
//             />

//             <button
//               onClick={handleQuickAdd}
//               disabled={!quickAddName.trim()}
//               className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
//             >
//               <Plus size={14} />
//               Add
//             </button>
//           </div>

//           {/* Data List Container */}
//           <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
//             {isLoading ? (
//               <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
//                 <Loader2 size={16} className="animate-spin text-blue-600" /> Loading configuration records...
//               </div>
//             ) : rows.length === 0 ? (
//               <div className="p-8 text-center text-xs text-slate-400">
//                 No active records available.
//               </div>
//             ) : (
//               rows.map((row, idx) => (
//                 <RowItem
//                   key={row.id}
//                   index={idx + 1}
//                   row={row}
//                   tab={tab}
//                   companies={companies}
//                   activeDepartments={activeDepartments}
//                   isEditing={editingId === row.id}
//                   onToggleEdit={() => setEditingId(editingId === row.id ? null : row.id)}
//                   onStopEdit={() => setEditingId(null)}
//                   onDelete={() => handleDelete(row)}
//                   updateDepartment={updateDepartment}
//                   updateSubDepartment={updateSubDepartment}
//                 />
//               ))
//             )}
//           </div>

//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// // ─── Dropdown Row Component ───────────────────────────────────────────────

// function RowItem({
//   index,
//   row,
//   tab,
//   companies,
//   activeDepartments,
//   isEditing,
//   onToggleEdit,
//   onStopEdit,
//   onDelete,
//   updateDepartment,
//   updateSubDepartment,
// }: {
//   index: number;
//   row: Row;
//   tab: Tab;
//   companies: { id: number; name: string }[];
//   activeDepartments: Department[];
//   isEditing: boolean;
//   onToggleEdit: () => void;
//   onStopEdit: () => void;
//   onDelete: () => void;
//   updateDepartment: any;
//   updateSubDepartment: any;
// }) {
//   const initialName = tab === 'department' ? (row as Department).department_name : (row as SubDepartment).name;
//   const [name, setName] = useState(initialName);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     setName(initialName);
//   }, [initialName]);

//   // Click outside to close dropdown edit panel
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         if (isEditing) onStopEdit();
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [isEditing, onStopEdit]);

//   async function handleNameSave() {
//     const trimmed = name.trim();
//     if (!trimmed) {
//       setName(initialName);
//       return;
//     }
//     if (trimmed === initialName) return;

//     if (tab === 'department') {
//       await updateDepartment.mutateAsync({ id: row.id, data: { department_name: trimmed } });
//     } else {
//       await updateSubDepartment.mutateAsync({ id: row.id, data: { name: trimmed } });
//     }
//   }

//   // ─── Department Logics ───────────────────────────────────────────────
//   if (tab === 'department') {
//     const dept = row as Department;
//     const isGlobal = dept.is_all_companies;
//     const selectedCompanyIds = dept.company_ids ?? [];

//     // Format right-hand Pill Badge Text (Shows COUNT instead of long string)
//     let badgeText = '';
//     if (isGlobal) {
//       badgeText = 'All companies';
//     } else {
//       const count = selectedCompanyIds.length;
//       badgeText = count === 0 ? '0 Companies' : count === 1 ? '1 Company' : `${count} Companies`;
//     }

//     const handleToggleAllCompanies = async () => {
//       const next = !isGlobal;
//       await updateDepartment.mutateAsync({
//         id: dept.id,
//         data: {
//           is_all_companies: next,
//           company_ids: next ? [] : (selectedCompanyIds.length ? selectedCompanyIds : [companies[0]?.id]),
//         },
//       });
//     };

//     const handleToggleCompany = async (companyId: number) => {
//       let nextIds: number[];
//       if (isGlobal) {
//         nextIds = [companyId];
//       } else {
//         nextIds = selectedCompanyIds.includes(companyId)
//           ? selectedCompanyIds.filter((id) => id !== companyId)
//           : [...selectedCompanyIds, companyId];
//       }

//       await updateDepartment.mutateAsync({
//         id: dept.id,
//         data: {
//           is_all_companies: false,
//           company_ids: nextIds,
//         },
//       });
//     };

//     return (
//       <div className="relative px-4 py-3 hover:bg-slate-50/50 transition-colors" ref={dropdownRef}>
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
//             <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
//               {index}
//             </span>

//             {isEditing ? (
//               <input
//                 type="text"
//                 autoFocus
//                 className="h-7 w-64 rounded border border-blue-500 px-2 text-xs uppercase tracking-wide font-bold text-slate-900 outline-none shadow-sm"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 onBlur={handleNameSave}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') handleNameSave();
//                 }}
//               />
//             ) : (
//               <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
//                 {dept.department_name}
//               </span>
//             )}
//           </div>

//           <div className="flex items-center gap-3">
//             {/* Pill Badge showing COUNT or "All companies" */}
//             <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
//               {badgeText}
//             </span>

//             <button 
//               onClick={onToggleEdit} 
//               className={`p-1 rounded hover:bg-slate-100 transition-colors ${isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
//             >
//               <Pencil size={13} />
//             </button>
//             <button onClick={onDelete} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
//               <Trash2 size={13} />
//             </button>
//           </div>
//         </div>

//         {/* Editing Panel Dropdown */}
//         {isEditing && (
//           <div className="absolute left-10 top-12 z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
//             <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
//               Select Company Scope
//             </div>

//             <div className="space-y-1 max-h-56 overflow-y-auto">
//               <label 
//                 onClick={handleToggleAllCompanies}
//                 className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
//               >
//                 <span>All companies (applies everywhere)</span>
//                 {isGlobal && <Check size={14} className="text-blue-600" />}
//               </label>

//               <div className="my-1 border-t border-slate-100" />

//               {companies.map((company) => {
//                 const checked = isGlobal || selectedCompanyIds.includes(company.id);
//                 return (
//                   <label
//                     key={company.id}
//                     onClick={() => handleToggleCompany(company.id)}
//                     className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
//                   >
//                     <span>{company.name}</span>
//                     {checked && <Check size={14} className="text-blue-600" />}
//                   </label>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }

//   // ─── Sub-Department Logics ────────────────────────────────────────────
//   const sub = row as SubDepartment;
//   const isGlobalDept = sub.is_all_departments;
//   const selectedDeptIds = sub.department_ids ?? [];

//   let badgeText = '';
//   if (isGlobalDept) {
//     badgeText = 'All departments';
//   } else {
//     const count = selectedDeptIds.length;
//     badgeText = count === 0 ? '0 Departments' : count === 1 ? '1 Department' : `${count} Departments`;
//   }

//   const handleToggleAllDepartments = async () => {
//     const next = !isGlobalDept;
//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: {
//         is_all_departments: next,
//         department_ids: next ? [] : (selectedDeptIds.length ? selectedDeptIds : [activeDepartments[0]?.id]),
//       },
//     });
//   };

//   const handleToggleDepartment = async (deptId: number) => {
//     let nextIds: number[];
//     if (isGlobalDept) {
//       nextIds = [deptId];
//     } else {
//       nextIds = selectedDeptIds.includes(deptId)
//         ? selectedDeptIds.filter((id) => id !== deptId)
//         : [...selectedDeptIds, deptId];
//     }

//     await updateSubDepartment.mutateAsync({
//       id: sub.id,
//       data: {
//         is_all_departments: false,
//         department_ids: nextIds,
//       },
//     });
//   };

//   return (
//     <div className="relative px-4 py-3 hover:bg-slate-50/50 transition-colors" ref={dropdownRef}>
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
//           <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
//             {index}
//           </span>

//           {isEditing ? (
//             <input
//               type="text"
//               autoFocus
//               className="h-7 w-64 rounded border border-blue-500 px-2 text-xs uppercase tracking-wide font-bold text-slate-900 outline-none shadow-sm"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               onBlur={handleNameSave}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') handleNameSave();
//               }}
//             />
//           ) : (
//             <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
//               {sub.name}
//             </span>
//           )}
//         </div>

//         <div className="flex items-center gap-3">
//           <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
//             {badgeText}
//           </span>

//           <button 
//             onClick={onToggleEdit} 
//             className={`p-1 rounded hover:bg-slate-100 transition-colors ${isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
//           >
//             <Pencil size={13} />
//           </button>
//           <button onClick={onDelete} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
//             <Trash2 size={13} />
//           </button>
//         </div>
//       </div>

//       {/* Editing Dropdown Panel */}
//       {isEditing && (
//         <div className="absolute left-10 top-12 z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
//           <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
//             Select Department Scope
//           </div>

//           <div className="space-y-1 max-h-56 overflow-y-auto">
//             <label 
//               onClick={handleToggleAllDepartments}
//               className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
//             >
//               <span>All departments</span>
//               {isGlobalDept && <Check size={14} className="text-blue-600" />}
//             </label>

//             <div className="my-1 border-t border-slate-100" />

//             {activeDepartments.map((dept) => {
//               const checked = isGlobalDept || selectedDeptIds.includes(dept.id);
//               return (
//                 <label
//                   key={dept.id}
//                   onClick={() => handleToggleDepartment(dept.id)}
//                   className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
//                 >
//                   <span>{dept.department_name}</span>
//                   {checked && <Check size={14} className="text-blue-600" />}
//                 </label>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
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
import { useQueries } from '@tanstack/react-query';

import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/features/departments/hooks/useDepartments';

import { departmentService } from '@/services/api/department.service';
import type { Department } from '@/services/api/department.service';

import {
  useSubDepartments,
  useCreateSubDepartment,
  useUpdateSubDepartment,
  useDeleteSubDepartment,
} from '@/features/sub-departments/hooks/useSubDepartments';

import { useCompanies } from '@/features/companies/hooks/useCompanies';
import type { SubDepartment } from '@/services/api/subDepartment.service';

type Tab = 'department' | 'subdepartment';
type Row = Department | SubDepartment;

export default function DepartmentsPage() {
  const [tab, setTab] = useState<Tab>('department');

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [filter, setFilter] = useState('');

  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddDeptId, setQuickAddDeptId] = useState<number | ''>('');

  // ─────────────────────────────────────────────────────────────────────────
  // Edit modal state
  // ─────────────────────────────────────────────────────────────────────────

  const [editingRow, setEditingRow] = useState<Row | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Department edit state
  // ─────────────────────────────────────────────────────────────────────────

  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [editDepartmentCompanyIds, setEditDepartmentCompanyIds] = useState<number[]>([]);
  const [editDepartmentIsAllCompanies, setEditDepartmentIsAllCompanies] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-department edit state
  // ─────────────────────────────────────────────────────────────────────────

  const [editSubDepartmentName, setEditSubDepartmentName] = useState('');
  const [editSubDepartmentIds, setEditSubDepartmentIds] = useState<number[]>([]);
  const [editSubDepartmentIsAllDepartments, setEditSubDepartmentIsAllDepartments] =
    useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Companies
  // ─────────────────────────────────────────────────────────────────────────

  const {
    data: companies = [],
    isLoading: companiesLoading,
  } = useCompanies({ limit: 100 });

  const allCompanyIds = useMemo(
    () => companies.map((c) => c.id),
    [companies],
  );

  // Priority logic:
  // If no company filter is checked, default to ALL company IDs.
  const effectiveCompanyIds = useMemo(() => {
    if (selectedCompanyIds.length > 0) {
      return selectedCompanyIds;
    }

    return allCompanyIds;
  }, [selectedCompanyIds, allCompanyIds]);

  const isAllExplicitlySelected =
    companies.length > 0 &&
    selectedCompanyIds.length === companies.length;

  function toggleCompanyFilter(companyId: number) {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId],
    );
  }

  function toggleSelectAllCompanies() {
    setSelectedCompanyIds(
      isAllExplicitlySelected ? [] : allCompanyIds,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Departments
  // ─────────────────────────────────────────────────────────────────────────

  const departmentQueries = useQueries({
    queries: effectiveCompanyIds.map((companyId) => ({
      queryKey: [
        'departments',
        {
          company_id: companyId,
          is_active: 'true',
        },
      ],

      queryFn: async () => {
        const res = await departmentService.getAll({
          company_id: companyId,
          is_active: 'true',
        });

        return res.data ?? [];
      },

      enabled: effectiveCompanyIds.length > 0,
    })),
  });

  const deptLoading = departmentQueries.some(
    (q) => q.isLoading,
  );

  const activeDepartments = useMemo(() => {
    const map = new Map<number, Department>();

    departmentQueries.forEach((queryResult) => {
      if (Array.isArray(queryResult.data)) {
        queryResult.data.forEach((dept) => {
          map.set(dept.id, dept);
        });
      }
    });

    return Array.from(map.values());
  }, [departmentQueries]);

  useEffect(() => {
    if (
      tab === 'subdepartment' &&
      !quickAddDeptId &&
      activeDepartments.length > 0
    ) {
      setQuickAddDeptId(activeDepartments[0].id);
    }
  }, [tab, activeDepartments, quickAddDeptId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Sub-Departments
  // ─────────────────────────────────────────────────────────────────────────

  const {
    data: subDepartments = [],
    isLoading: subDeptLoading,
  } = useSubDepartments({
    is_active: 'true',
  });

  const companyDepartmentIds = useMemo(
    () => new Set(activeDepartments.map((d) => d.id)),
    [activeDepartments],
  );

  const activeSubDepartments = useMemo(() => {
    return subDepartments.filter(
      (sd) =>
        sd.is_all_departments ||
        (sd.department_ids ?? []).some((id) =>
          companyDepartmentIds.has(id),
        ),
    );
  }, [subDepartments, companyDepartmentIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const createSubDepartment = useCreateSubDepartment();
  const updateSubDepartment = useUpdateSubDepartment();
  const deleteSubDepartment = useDeleteSubDepartment();

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  const filteredDepartments = useMemo(
    () =>
      activeDepartments.filter((d) =>
        d.department_name
          .toLowerCase()
          .includes(filter.toLowerCase()),
      ),
    [activeDepartments, filter],
  );

  const filteredSubDepartments = useMemo(
    () =>
      activeSubDepartments.filter((sd) =>
        sd.name
          .toLowerCase()
          .includes(filter.toLowerCase()),
      ),
    [activeSubDepartments, filter],
  );

  const isLoading =
    tab === 'department'
      ? deptLoading
      : subDeptLoading;

  const rows: Row[] =
    tab === 'department'
      ? filteredDepartments
      : filteredSubDepartments;

  // ─────────────────────────────────────────────────────────────────────────
  // Tab switching
  // ─────────────────────────────────────────────────────────────────────────

  function switchTab(next: Tab) {
    setTab(next);
    setFilter('');
    setQuickAddName('');
    setQuickAddDeptId('');
    closeEditModal();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Quick Add
  // ─────────────────────────────────────────────────────────────────────────

  async function handleQuickAdd() {
    const name = quickAddName.trim();

    if (!name) return;

    try {
      if (tab === 'department') {
        await createDepartment.mutateAsync({
          company_ids: effectiveCompanyIds,
          department_name: name,
          head_id: null,
        });
      } else {
        if (!quickAddDeptId) {
          alert('Please choose a parent department.');
          return;
        }

        await createSubDepartment.mutateAsync({
          name,
          is_all_departments: false,
          department_ids: [Number(quickAddDeptId)],
        });
      }

      setQuickAddName('');
    } catch {
      // Mutation hook already handles/display errors.
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────────────────

  async function handleDelete(row: Row) {
    const rowName =
      tab === 'department'
        ? (row as Department).department_name
        : (row as SubDepartment).name;

    if (
      !confirm(
        `Delete "${rowName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      if (tab === 'department') {
        await deleteDepartment.mutateAsync(row.id);
      } else {
        await deleteSubDepartment.mutateAsync(row.id);
      }
    } catch {
      // Mutation hook already handles/display errors.
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Open Edit Modal
  // ─────────────────────────────────────────────────────────────────────────

  function openEditModal(row: Row) {
    setEditingRow(row);

    if (tab === 'department') {
      const dept = row as Department;

      setEditDepartmentName(dept.department_name);
      setEditDepartmentCompanyIds(dept.company_ids ?? []);
      setEditDepartmentIsAllCompanies(Boolean(dept.is_all_companies));

      return;
    }

    const sub = row as SubDepartment;

    setEditSubDepartmentName(sub.name);
    setEditSubDepartmentIds(sub.department_ids ?? []);
    setEditSubDepartmentIsAllDepartments(
      Boolean(sub.is_all_departments),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Close Edit Modal
  // ─────────────────────────────────────────────────────────────────────────

  function closeEditModal() {
    setEditingRow(null);

    setEditDepartmentName('');
    setEditDepartmentCompanyIds([]);
    setEditDepartmentIsAllCompanies(false);

    setEditSubDepartmentName('');
    setEditSubDepartmentIds([]);
    setEditSubDepartmentIsAllDepartments(false);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle Company in Edit Modal
  // ─────────────────────────────────────────────────────────────────────────

  function toggleEditCompany(companyId: number) {
    setEditDepartmentCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId],
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle All Companies in Edit Modal
  // ─────────────────────────────────────────────────────────────────────────

  function toggleEditAllCompanies() {
    setEditDepartmentIsAllCompanies((prev) => !prev);

    if (!editDepartmentIsAllCompanies) {
      setEditDepartmentCompanyIds([]);
    } else if (editDepartmentCompanyIds.length === 0) {
      setEditDepartmentCompanyIds(
        companies.map((company) => company.id),
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle Department in Sub-Department Edit Modal
  // ─────────────────────────────────────────────────────────────────────────

  function toggleEditDepartment(deptId: number) {
    setEditSubDepartmentIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle All Departments
  // ─────────────────────────────────────────────────────────────────────────

  function toggleEditAllDepartments() {
    setEditSubDepartmentIsAllDepartments((prev) => !prev);

    if (!editSubDepartmentIsAllDepartments) {
      setEditSubDepartmentIds([]);
    } else if (editSubDepartmentIds.length === 0) {
      setEditSubDepartmentIds(
        activeDepartments.map((dept) => dept.id),
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Save Department
  // ─────────────────────────────────────────────────────────────────────────

  async function handleSaveDepartment() {
    if (!editingRow || tab !== 'department') return;

    const dept = editingRow as Department;
    const trimmedName = editDepartmentName.trim();

    if (!trimmedName) {
      alert('Department name is required.');
      return;
    }

    try {
      await updateDepartment.mutateAsync({
        id: dept.id,

        data: {
          department_name: trimmedName,

          is_all_companies: editDepartmentIsAllCompanies,

          company_ids: editDepartmentIsAllCompanies
            ? []
            : editDepartmentCompanyIds,
        },
      });

      closeEditModal();
    } catch {
      // Mutation hook already handles/display errors.
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Save Sub-Department
  // ─────────────────────────────────────────────────────────────────────────

  async function handleSaveSubDepartment() {
    if (!editingRow || tab !== 'subdepartment') return;

    const sub = editingRow as SubDepartment;
    const trimmedName = editSubDepartmentName.trim();

    if (!trimmedName) {
      alert('Sub-department name is required.');
      return;
    }

    try {
      await updateSubDepartment.mutateAsync({
        id: sub.id,

        data: {
          name: trimmedName,

          is_all_departments:
            editSubDepartmentIsAllDepartments,

          department_ids:
            editSubDepartmentIsAllDepartments
              ? []
              : editSubDepartmentIds,
        },
      });

      closeEditModal();
    } catch {
      // Mutation hook already handles/display errors.
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Modal submit
  // ─────────────────────────────────────────────────────────────────────────

  async function handleSaveEdit() {
    if (tab === 'department') {
      await handleSaveDepartment();
    } else {
      await handleSaveSubDepartment();
    }
  }

  const editSaving =
    tab === 'department'
      ? updateDepartment.isPending
      : updateSubDepartment.isPending;

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="mx-auto w-full  px-6 py-8">

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Header */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Structure Management
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Manage structural hierarchy, company assignments,
                and linked sub-departments.
              </p>
            </div>

            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live Sync Active
            </span>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Company Scope Filter */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">

            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Building2
                  size={13}
                  className="text-slate-400"
                />

                Company Scope Filter
              </span>

              <button
                type="button"
                onClick={toggleSelectAllCompanies}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {isAllExplicitlySelected
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {companiesLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                <Loader2
                  size={13}
                  className="animate-spin text-blue-600"
                />

                Loading company scope options...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {companies.map((company) => {
                  const active =
                    selectedCompanyIds.includes(company.id);

                  return (
                    <button
                      type="button"
                      key={company.id}
                      onClick={() =>
                        toggleCompanyFilter(company.id)
                      }
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          active
                            ? 'bg-blue-600'
                            : 'bg-slate-300'
                        }`}
                      />

                      {company.name}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedCompanyIds.length === 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <AlertCircle
                  size={13}
                  className="shrink-0 text-amber-500"
                />

                No specific filter selected. All companies
                are automatically included.
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Tabs + Search */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">

            <div className="flex gap-2">

              <button
                type="button"
                onClick={() => switchTab('department')}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === 'department'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 size={14} />

                Departments

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {activeDepartments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('subdepartment')}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === 'subdepartment'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} />

                Sub-Departments

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {activeSubDepartments.length}
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
                onChange={(e) =>
                  setFilter(e.target.value)
                }
                className="h-8 w-48 rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Quick Creation */}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">

            {tab === 'subdepartment' && (
              <select
                className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                value={quickAddDeptId}
                onChange={(e) =>
                  setQuickAddDeptId(
                    e.target.value
                      ? Number(e.target.value)
                      : '',
                  )
                }
              >
                <option value="">
                  Select Department...
                </option>

                {activeDepartments.map((dept) => (
                  <option
                    key={dept.id}
                    value={dept.id}
                  >
                    {dept.department_name}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="h-9 flex-1 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
              placeholder={
                tab === 'department'
                  ? 'Add new department...'
                  : 'Add new sub-department...'
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
              disabled={
                !quickAddName.trim() ||
                createDepartment.isPending ||
                createSubDepartment.isPending
              }
              className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {createDepartment.isPending ||
              createSubDepartment.isPending ? (
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
              rows.map((row, idx) => (
                <RowItem
                  key={row.id}
                  index={idx + 1}
                  row={row}
                  tab={tab}
                  companies={companies}
                  isEditing={editingRow?.id === row.id}
                  onToggleEdit={() =>
                    openEditModal(row)
                  }
                  onDelete={() =>
                    handleDelete(row)
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* FULL WIDTH EDIT MODAL */}
        {/* ================================================================= */}

        {editingRow && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeEditModal();
              }
            }}
          >
            <div
              className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >

              {/* ───────────────────────────────────────────────────────── */}
              {/* Modal Header */}
              {/* ───────────────────────────────────────────────────────── */}

              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {tab === 'department' ? (
                      <Building2 size={19} />
                    ) : (
                      <Layers size={19} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {tab === 'department'
                        ? 'Edit Department'
                        : 'Edit Sub-Department'}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {tab === 'department'
                        ? 'Update department details and company scope.'
                        : 'Update sub-department details and department scope.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editSaving}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* Modal Body */}
              {/* ───────────────────────────────────────────────────────── */}

              <div className="flex-1 overflow-y-auto p-6">

                {tab === 'department' ? (
                  <div className="space-y-6">

                    {/* Department Name */}

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">
                        Department Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={editDepartmentName}
                        onChange={(e) =>
                          setEditDepartmentName(
                            e.target.value,
                          )
                        }
                        autoFocus
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter department name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          }
                        }}
                      />
                    </div>

                    {/* Company Scope */}

                    <div>

                      <div className="mb-3 flex items-center justify-between">

                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Company Scope
                          </label>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Choose which companies can use this department.
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                          {editDepartmentIsAllCompanies
                            ? 'Global'
                            : `${editDepartmentCompanyIds.length} selected`}
                        </span>
                      </div>

                      {/* All Companies */}

                      <button
                        type="button"
                        onClick={toggleEditAllCompanies}
                        className={`mb-3 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                          editDepartmentIsAllCompanies
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              editDepartmentIsAllCompanies
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-400'
                            }`}
                          >
                            <Building2 size={15} />
                          </div>

                          <div>
                            <div
                              className={`text-xs font-semibold ${
                                editDepartmentIsAllCompanies
                                  ? 'text-blue-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              All Companies
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Department applies to every company
                            </div>
                          </div>
                        </div>

                        {editDepartmentIsAllCompanies && (
                          <Check
                            size={18}
                            className="text-blue-600"
                          />
                        )}
                      </button>

                      {/* Company Flex Items */}

                      {!editDepartmentIsAllCompanies && (
                        <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                          {companies.length === 0 ? (
                            <div className="w-full py-5 text-center text-xs text-slate-400">
                              No companies available.
                            </div>
                          ) : (
                            companies.map((company) => {
                              const checked =
                                editDepartmentCompanyIds.includes(
                                  company.id,
                                );

                              return (
                                <button
                                  type="button"
                                  key={company.id}
                                  onClick={() =>
                                    toggleEditCompany(
                                      company.id,
                                    )
                                  }
                                  className={`flex min-w-[180px] flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all sm:max-w-[calc(50%-4px)] ${
                                    checked
                                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">

                                    <div
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                        checked
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-100 text-slate-400'
                                      }`}
                                    >
                                      <Building2 size={14} />
                                    </div>

                                    <span
                                      className={`truncate text-xs font-semibold ${
                                        checked
                                          ? 'text-blue-700'
                                          : 'text-slate-700'
                                      }`}
                                    >
                                      {company.name}
                                    </span>
                                  </div>

                                  <div
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                      checked
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {checked && (
                                      <Check size={12} />
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected summary */}

                    {!editDepartmentIsAllCompanies && (
                      <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                        <Check
                          size={14}
                          className="shrink-0"
                        />

                        <span>
                          {editDepartmentCompanyIds.length ===
                          0
                            ? 'No company selected.'
                            : `${editDepartmentCompanyIds.length} company${
                                editDepartmentCompanyIds.length ===
                                1
                                  ? ''
                                  : 'ies'
                              } selected.`}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* Sub Department Name */}

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">
                        Sub-Department Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={editSubDepartmentName}
                        onChange={(e) =>
                          setEditSubDepartmentName(
                            e.target.value,
                          )
                        }
                        autoFocus
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter sub-department name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          }
                        }}
                      />
                    </div>

                    {/* Department Scope */}

                    <div>

                      <div className="mb-3 flex items-center justify-between">

                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Department Scope
                          </label>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Choose which departments can use this sub-department.
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                          {editSubDepartmentIsAllDepartments
                            ? 'Global'
                            : `${editSubDepartmentIds.length} selected`}
                        </span>
                      </div>

                      {/* All Departments */}

                      <button
                        type="button"
                        onClick={toggleEditAllDepartments}
                        className={`mb-3 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                          editSubDepartmentIsAllDepartments
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              editSubDepartmentIsAllDepartments
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-400'
                            }`}
                          >
                            <Layers size={15} />
                          </div>

                          <div>
                            <div
                              className={`text-xs font-semibold ${
                                editSubDepartmentIsAllDepartments
                                  ? 'text-blue-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              All Departments
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Sub-department applies everywhere
                            </div>
                          </div>
                        </div>

                        {editSubDepartmentIsAllDepartments && (
                          <Check
                            size={18}
                            className="text-blue-600"
                          />
                        )}
                      </button>

                      {/* Department Flex Items */}

                      {!editSubDepartmentIsAllDepartments && (
                        <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                          {activeDepartments.length === 0 ? (
                            <div className="w-full py-5 text-center text-xs text-slate-400">
                              No departments available.
                            </div>
                          ) : (
                            activeDepartments.map((dept) => {
                              const checked =
                                editSubDepartmentIds.includes(
                                  dept.id,
                                );

                              return (
                                <button
                                  type="button"
                                  key={dept.id}
                                  onClick={() =>
                                    toggleEditDepartment(
                                      dept.id,
                                    )
                                  }
                                  className={`flex min-w-[180px] flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all sm:max-w-[calc(50%-4px)] ${
                                    checked
                                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">

                                    <div
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                        checked
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-100 text-slate-400'
                                      }`}
                                    >
                                      <Layers size={14} />
                                    </div>

                                    <span
                                      className={`truncate text-xs font-semibold ${
                                        checked
                                          ? 'text-blue-700'
                                          : 'text-slate-700'
                                      }`}
                                    >
                                      {dept.department_name}
                                    </span>
                                  </div>

                                  <div
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                      checked
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {checked && (
                                      <Check size={12} />
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected summary */}

                    {!editSubDepartmentIsAllDepartments && (
                      <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                        <Check
                          size={14}
                          className="shrink-0"
                        />

                        <span>
                          {editSubDepartmentIds.length ===
                          0
                            ? 'No department selected.'
                            : `${editSubDepartmentIds.length} department${
                                editSubDepartmentIds.length ===
                                1
                                  ? ''
                                  : 's'
                              } selected.`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* Modal Footer */}
              {/* ───────────────────────────────────────────────────────── */}

              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editSaving}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={14} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={
                    editSaving ||
                    (tab === 'department'
                      ? !editDepartmentName.trim()
                      : !editSubDepartmentName.trim())
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editSaving ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />

                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </MasterDataLayout>
    </AppShell>
  );
}

// ============================================================================
// ROW ITEM
// ============================================================================

function RowItem({
  index,
  row,
  tab,
  companies,
  isEditing,
  onToggleEdit,
  onDelete,
}: {
  index: number;
  row: Row;
  tab: Tab;
  companies: { id: number; name: string }[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
}) {
  if (tab === 'department') {
    const dept = row as Department;

    const isGlobal = dept.is_all_companies;
    const selectedCompanyIds = dept.company_ids ?? [];

    let badgeText = '';

    if (isGlobal) {
      badgeText = 'All companies';
    } else {
      const count = selectedCompanyIds.length;

      badgeText =
        count === 0
          ? '0 Companies'
          : count === 1
            ? '1 Company'
            : `${count} Companies`;
    }

    return (
      <div className="relative px-4 py-3 transition-colors hover:bg-slate-50/50">

        <div className="flex items-center justify-between gap-4">

          {/* Left */}

          <div className="flex min-w-0 items-center gap-3">

            <GripVertical
              size={14}
              className="shrink-0 cursor-grab text-slate-300"
            />

            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
              {index}
            </span>

            <span className="truncate text-xs font-bold uppercase tracking-wider text-slate-900">
              {dept.department_name}
            </span>
          </div>

          {/* Right */}

          <div className="flex shrink-0 items-center gap-3">

            <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
              {badgeText}
            </span>

            <button
              type="button"
              onClick={onToggleEdit}
              className={`rounded-lg p-1.5 transition-colors ${
                isEditing
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
              title="Edit department"
            >
              <Pencil size={13} />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
              title="Delete department"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUB DEPARTMENT
  // ==========================================================================

  const sub = row as SubDepartment;

  const isGlobalDept = sub.is_all_departments;
  const selectedDeptIds = sub.department_ids ?? [];

  let badgeText = '';

  if (isGlobalDept) {
    badgeText = 'All departments';
  } else {
    const count = selectedDeptIds.length;

    badgeText =
      count === 0
        ? '0 Departments'
        : count === 1
          ? '1 Department'
          : `${count} Departments`;
  }

  return (
    <div className="relative px-4 py-3 transition-colors hover:bg-slate-50/50">

      <div className="flex items-center justify-between gap-4">

        {/* Left */}

        <div className="flex min-w-0 items-center gap-3">

          <GripVertical
            size={14}
            className="shrink-0 cursor-grab text-slate-300"
          />

          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
            {index}
          </span>

          <span className="truncate text-xs font-bold uppercase tracking-wider text-slate-900">
            {sub.name}
          </span>
        </div>

        {/* Right */}

        <div className="flex shrink-0 items-center gap-3">

          <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
            {badgeText}
          </span>

          <button
            type="button"
            onClick={onToggleEdit}
            className={`rounded-lg p-1.5 transition-colors ${
              isEditing
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            title="Edit sub-department"
          >
            <Pencil size={13} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
            title="Delete sub-department"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}