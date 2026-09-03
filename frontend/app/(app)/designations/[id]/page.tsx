// 'use client';
// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useQuery }             from '@tanstack/react-query';
// import { useAppDispatch }       from '../../../../store';
// import { setPageTitle }         from '../../../../store/slices/uiSlice';
// import { AppShell }             from '../../../../layouts/AppLayout';
// import { Chip }                 from '../../../../components/ui/Chip';
// import { Modal }                from '../../../../components/ui/Modal';
// import { DesignationFormModal } from '../../../../features/designations/components/DesignationFormModal';
// import {
//   useDesignation, useDeleteDesignation, useToggleDesignation,
// } from '../../../../features/designations/hooks/useDesignations';
// import { usePermission }        from '../../../../features/auth/hooks/usePermission';
// import { departmentService }    from '../../../../services/api/department.service';
// import { getInitials }          from '../../../../utils/formatters';

// export default function DesignationDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const id = parseInt(params.id as string, 10);
//   const { canManageEmployees } = usePermission();

//   const [editOpen,   setEditOpen]   = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);

//   const { data: designation, isLoading, isError } = useDesignation(id);
//   const deleteMutation = useDeleteDesignation();
//   const toggleMutation = useToggleDesignation();

//   const { data: deptsRes } = useQuery({
//     queryKey: ['departments'],
//     queryFn:  () => departmentService.getAll(),
//     staleTime: 5 * 60_000,
//     select:    (res) => res.data,
//   });
//   const deptOptions = (deptsRes || []).map((d: any) => ({ value: d.id, label: d.name }));

//   useEffect(() => {
//     if (designation) dispatch(setPageTitle({ title: designation.designation_name, breadcrumb: 'Designations' }));
//   }, [designation, dispatch]);

//   const handleDelete = async () => {
//     await deleteMutation.mutateAsync(id);
//     router.push('/designations');
//   };

//   // Grade colour logic
//   const gradeColor = (grade: string | null | undefined) => {
//     if (!grade) return 'gray';
//     const u = grade.toUpperCase();
//     if (u.startsWith('L')) return 'blue';
//     if (u.startsWith('M')) return 'purple';
//     if (u.includes('SENIOR') || u.includes('LEAD')) return 'teal';
//     return 'amber';
//   };

//   if (isLoading) {
//     return (
//       <AppShell>
//         <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink4)', fontSize: 13 }}>
//           Loading designation…
//         </div>
//       </AppShell>
//     );
//   }

//   if (isError || !designation) {
//     return (
//       <AppShell>
//         <div style={{ textAlign: 'center', padding: '60px 0' }}>
//           <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>Designation not found</div>
//           <button className="btn btn-sec btn-sm" onClick={() => router.push('/designations')}>
//             ← Back to Designations
//           </button>
//         </div>
//       </AppShell>
//     );
//   }

//   const employeeCount = designation.employees?.length ?? 0;

//   return (
//     <AppShell>
//       <div className="pg-enter">

//         {/* Header */}
//         <div className="ph">
//           <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
//             {/* Icon */}
//             <div style={{
//               width: 52, height: 52, borderRadius: 13,
//               background: designation.is_active
//                 ? 'linear-gradient(135deg, var(--blue), var(--purple))'
//                 : 'var(--surface3)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//               color: designation.is_active ? '#fff' : 'var(--ink4)',
//               fontSize: 20, fontWeight: 700, flexShrink: 0,
//             }}>
//               🎯
//             </div>
//             <div>
//               <h1 style={{ marginBottom: 6 }}>{designation.designation_name}</h1>
//               <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
//                 <Chip variant={designation.is_active ? 'green' : 'gray'}>
//                   {designation.is_active ? 'Active' : 'Inactive'}
//                 </Chip>
//              </div>
//             </div>
//           </div>

//           <div className="ph-r">
//             <button className="btn btn-sec btn-sm" onClick={() => router.push('/designations')}>← Back</button>
//             {canManageEmployees && (
//               <>
//                 <button
//                   className="btn btn-sec btn-sm"
//                   onClick={() => toggleMutation.mutate(id)}
//                   disabled={toggleMutation.isPending}
//                 >
//                   {designation.is_active ? 'Deactivate' : 'Activate'}
//                 </button>
//                 <button className="btn btn-sec btn-sm" onClick={() => setEditOpen(true)}>Edit</button>
//                 <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>Delete</button>
//               </>
//             )}
//           </div>
//         </div>

//         <div className="g2">
//           {/* Left column — details */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

//             {/* Overview */}
//             <div className="card cp">
//               <div className="ct">Designation Details</div>
//               {[
//                 { label: 'Name',           value: designation.designation_name },
//                 { label: 'Status',         value: <Chip variant={designation.is_active ? 'green' : 'gray'}>{designation.is_active ? 'Active' : 'Inactive'}</Chip> },
//                 { label: 'Active Employees', value: <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: employeeCount > 0 ? 'var(--blue)' : 'var(--ink4)', fontSize: 14 }}>{employeeCount}</span> },
//               ].map((row) => (
//                 <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
//                   <span style={{ color: 'var(--ink4)', fontWeight: 500 }}>{row.label}</span>
//                   <span>{row.value}</span>
//                 </div>
//               ))}
//             </div>

//             {/* Quick actions */}
//             {canManageEmployees && (
//               <div className="card cp">
//                 <div className="ct">Actions</div>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//                   <button className="btn btn-sec" style={{ justifyContent: 'flex-start' }} onClick={() => setEditOpen(true)}>
//                     ✏️ Edit designation
//                   </button>
//                   <button
//                     className="btn btn-sec"
//                     style={{ justifyContent: 'flex-start', color: designation.is_active ? 'var(--amber)' : 'var(--green)', borderColor: designation.is_active ? 'var(--amber-bd)' : 'var(--green-bd)' }}
//                     onClick={() => toggleMutation.mutate(id)}
//                     disabled={toggleMutation.isPending}
//                   >
//                     {designation.is_active ? '⏸ Deactivate designation' : '▶ Activate designation'}
//                   </button>
//                   <button
//                     className="btn btn-danger"
//                     style={{ justifyContent: 'flex-start' }}
//                     onClick={() => setDeleteOpen(true)}
//                     disabled={employeeCount > 0}
//                     title={employeeCount > 0 ? `Cannot delete — ${employeeCount} employees are assigned` : ''}
//                   >
//                     🗑 Delete designation
//                     {employeeCount > 0 && <span style={{ marginLeft: 6, fontSize: 10, opacity: .7 }}>(reassign employees first)</span>}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Right column — employees */}
//           <div className="card">
//             <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//               <div style={{ fontSize: 13, fontWeight: 700 }}>
//                 Employees with this designation
//                 <span style={{ fontSize: 11, color: 'var(--ink4)', fontWeight: 400, marginLeft: 6 }}>
//                   {employeeCount} active
//                 </span>
//               </div>
//               <button
//                 className="btn btn-sec btn-sm"
//                 onClick={() => router.push(`/employees?designation_id=${id}`)}
//               >
//                 View all →
//               </button>
//             </div>

//             {employeeCount > 0 ? (
//               designation.employees!.map((emp) => (
//                 <div
//                   key={emp.id}
//                   style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .1s' }}
//                   onClick={() => router.push(`/employees/${emp.id}`)}
//                   onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'; }}
//                   onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
//                 >
//                   <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
//                     {getInitials(`${emp.first_name} ${emp.last_name}`)}
//                   </div>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                       {emp.first_name} {emp.last_name}
//                     </div>
//                     <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{emp.employee_code}</div>
//                   </div>
//                   <Chip variant={emp.status === 'Active' ? 'green' : 'amber'}>{emp.status}</Chip>
//                 </div>
//               ))
//             ) : (
//               <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink4)' }}>
//                 <div style={{ fontSize: 28, marginBottom: 10 }}>👥</div>
//                 <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No employees yet</div>
//                 <div style={{ fontSize: 12 }}>Employees will appear here when assigned this designation</div>
//                 <button
//                   className="btn btn-sec btn-sm"
//                   style={{ marginTop: 14 }}
//                   onClick={() => router.push('/employees')}
//                 >
//                   Go to Employees →
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Edit modal */}
//       <DesignationFormModal
//         open={editOpen}
//         onClose={() => setEditOpen(false)}
//         designation={designation}
//         departments={deptOptions}
//       />

//       {/* Delete confirmation */}
//       <Modal
//         open={deleteOpen}
//         onClose={() => setDeleteOpen(false)}
//         title="Delete Designation"
//         subtitle={`Delete "${designation.designation_name}"? This cannot be undone.`}
//         footer={
//           <>
//             <button className="btn btn-sec" onClick={() => setDeleteOpen(false)}>Cancel</button>
//             <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending || employeeCount > 0}>
//               {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
//             </button>
//           </>
//         }
//       >
//         <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
//           {employeeCount > 0
//             ? `⚠ Cannot delete — ${employeeCount} employee(s) currently hold this designation. Reassign them first.`
//             : '⚠ This action permanently removes the designation from the system.'}
//         </div>
//       </Modal>
//     </AppShell>
//   );
// }




'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { AppShell } from '@/layouts/AppLayout';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import {
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  Briefcase,
  Layers,
  Plus,
  Search,
  Check,
  Building2
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

import { useDepartments } from '@/features/departments/hooks/useDepartments'; // Fallback / local hook for fetching departments
import type { Designation, SubDesignation } from '@/services/api/designation.service';

type Tab = 'designation' | 'subdesignation';
type Row = Designation | SubDesignation;

export default function DesignationsPage() {
  const [tab, setTab] = useState<Tab>('designation');
  const [filter, setFilter] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddParentId, setQuickAddParentId] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // ─── Fetch Master Data ──────────────────────────────────────────────────
  const { data: departments = [], isLoading: deptsLoading } = useDepartments({ is_active: 'true' });
  const { data: designations = [], isLoading: designationsLoading } = useDesignations({ is_active: 'true' });
  const { data: subDesignations = [], isLoading: subDesignationsLoading } = useSubDesignations({ is_active: 'true' });

  // ─── Mutations ──────────────────────────────────────────────────────────
  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const deleteDesignation = useDeleteDesignation();

  const createSubDesignation = useCreateSubDesignation();
  const updateSubDesignation = useUpdateSubDesignation();
  const deleteSubDesignation = useDeleteSubDesignation();

  // Set default parent designation for quick add when sub-designation tab is active
  useEffect(() => {
    if (tab === 'subdesignation' && !quickAddParentId && designations.length > 0) {
      setQuickAddParentId(designations[0].id);
    }
  }, [tab, designations, quickAddParentId]);

  // ─── Filters ────────────────────────────────────────────────────────────
  const filteredDesignations = useMemo(
    () => designations.filter((d) => d.name.toLowerCase().includes(filter.toLowerCase())),
    [designations, filter]
  );

  const filteredSubDesignations = useMemo(
    () => subDesignations.filter((sd) => sd.name.toLowerCase().includes(filter.toLowerCase())),
    [subDesignations, filter]
  );

  const isLoading = deptsLoading || (tab === 'designation' ? designationsLoading : subDesignationsLoading);
  const rows: Row[] = tab === 'designation' ? filteredDesignations : filteredSubDesignations;

  function switchTab(next: Tab) {
    setTab(next);
    setFilter('');
    setQuickAddName('');
    setQuickAddParentId('');
    setEditingId(null);
  }

  // ─── Quick Creation ─────────────────────────────────────────────────────
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
      if (!quickAddParentId) {
        alert('Please select a parent designation.');
        return;
      }
      await createSubDesignation.mutateAsync({
        name,
        is_all_designations: false,
        designation_ids: [Number(quickAddParentId)],
      });
    }

    setQuickAddName('');
  }

  // ─── Deletion ───────────────────────────────────────────────────────────
  async function handleDelete(row: Row) {
    if (!confirm(`Delete "${row.name}"? This action cannot be undone.`)) return;

    if (tab === 'designation') {
      await deleteDesignation.mutateAsync(row.id);
    } else {
      await deleteSubDesignation.mutateAsync(row.id);
    }
  }

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="mx-auto max-w-5xl px-6 py-8">
          
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Designation Management
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Configure job titles, department mappings, and linked sub-designation hierarchies.
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>

          {/* Navigation Tabs & Search Bar */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => switchTab('designation')}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === 'designation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase size={14} />
                Designations
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {designations.length}
                </span>
              </button>

              <button
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
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 w-48 rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Inline Quick Creation Panel */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {tab === 'subdesignation' && (
              <select
                className="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                value={quickAddParentId}
                onChange={(e) => setQuickAddParentId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select Parent Designation...</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="h-9 flex-1 px-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
              placeholder={tab === 'designation' ? 'Add new designation...' : 'Add new sub-designation...'}
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />

            <button
              onClick={handleQuickAdd}
              disabled={!quickAddName.trim()}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Item List Container */}
          <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
                <Loader2 size={16} className="animate-spin text-blue-600" /> Loading designation records...
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active designation records found.
              </div>
            ) : (
              rows.map((row, idx) => (
                <RowItem
                  key={row.id}
                  index={idx + 1}
                  row={row}
                  tab={tab}
                  departments={departments}
                  designations={designations}
                  isEditing={editingId === row.id}
                  onToggleEdit={() => setEditingId(editingId === row.id ? null : row.id)}
                  onStopEdit={() => setEditingId(null)}
                  onDelete={() => handleDelete(row)}
                  updateDesignation={updateDesignation}
                  updateSubDesignation={updateSubDesignation}
                />
              ))
            )}
          </div>

        </div>
      </MasterDataLayout>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW ITEM COMPONENT (WITH INLINE DROPDOWN POPOVER)
// ─────────────────────────────────────────────────────────────────────────────

function RowItem({
  index,
  row,
  tab,
  departments,
  designations,
  isEditing,
  onToggleEdit,
  onStopEdit,
  onDelete,
  updateDesignation,
  updateSubDesignation,
}: {
  index: number;
  row: Row;
  tab: Tab;
  departments: { id: number; department_name: string }[];
  designations: Designation[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  updateDesignation: any;
  updateSubDesignation: any;
}) {
  const [name, setName] = useState(row.name);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(row.name);
  }, [row.name]);

  // Click outside listener to dismiss popover dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (isEditing) onStopEdit();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, onStopEdit]);

  async function handleNameSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(row.name);
      return;
    }
    if (trimmed === row.name) return;

    if (tab === 'designation') {
      await updateDesignation.mutateAsync({ id: row.id, data: { name: trimmed } });
    } else {
      await updateSubDesignation.mutateAsync({ id: row.id, data: { name: trimmed } });
    }
  }

  // ─── Designation Handlers ────────────────────────────────────────────────
  if (tab === 'designation') {
    const des = row as Designation;
    const isGlobalDept = des.is_all_departments;
    const selectedDeptIds = des.department_ids ?? [];

    // Calculate pill count
    let badgeText = '';
    if (isGlobalDept) {
      badgeText = 'All departments';
    } else {
      const count = selectedDeptIds.length;
      badgeText = count === 0 ? '0 Departments' : count === 1 ? '1 Department' : `${count} Departments`;
    }

    const handleToggleAllDepts = async () => {
      const next = !isGlobalDept;
      await updateDesignation.mutateAsync({
        id: des.id,
        data: {
          is_all_departments: next,
          department_ids: next ? [] : (selectedDeptIds.length ? selectedDeptIds : [departments[0]?.id]),
        },
      });
    };

    const handleToggleDept = async (deptId: number) => {
      let nextIds: number[];
      if (isGlobalDept) {
        nextIds = [deptId];
      } else {
        nextIds = selectedDeptIds.includes(deptId)
          ? selectedDeptIds.filter((id) => id !== deptId)
          : [...selectedDeptIds, deptId];
      }

      await updateDesignation.mutateAsync({
        id: des.id,
        data: {
          is_all_departments: false,
          department_ids: nextIds,
        },
      });
    };

    return (
      <div className="relative px-4 py-3 hover:bg-slate-50/50 transition-colors" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
              {index}
            </span>

            {isEditing ? (
              <input
                type="text"
                autoFocus
                className="h-7 w-64 rounded border border-blue-500 px-2 text-xs uppercase tracking-wide font-bold text-slate-900 outline-none shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                }}
              />
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {des.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Pill Count Badge */}
            <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
              {badgeText}
            </span>

            <button
              onClick={onToggleEdit}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Dropdown Popover */}
        {isEditing && (
          <div className="absolute left-10 top-12 z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Department Scope
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              <label
                onClick={handleToggleAllDepts}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
              >
                <span>All departments</span>
                {isGlobalDept && <Check size={14} className="text-blue-600" />}
              </label>

              <div className="my-1 border-t border-slate-100" />

              {departments.map((dept) => {
                const checked = isGlobalDept || selectedDeptIds.includes(dept.id);
                return (
                  <label
                    key={dept.id}
                    onClick={() => handleToggleDept(dept.id)}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <span>{dept.department_name}</span>
                    {checked && <Check size={14} className="text-blue-600" />}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Sub-Designation Handlers ────────────────────────────────────────────
  const sub = row as SubDesignation;
  const isGlobalDes = sub.is_all_designations;
  const selectedDesIds = sub.designation_ids ?? [];

  let badgeText = '';
  if (isGlobalDes) {
    badgeText = 'All designations';
  } else {
    const count = selectedDesIds.length;
    badgeText = count === 0 ? '0 Designations' : count === 1 ? '1 Designation' : `${count} Designations`;
  }

  const handleToggleAllDesignations = async () => {
    const next = !isGlobalDes;
    await updateSubDesignation.mutateAsync({
      id: sub.id,
      data: {
        is_all_designations: next,
        designation_ids: next ? [] : (selectedDesIds.length ? selectedDesIds : [designations[0]?.id]),
      },
    });
  };

  const handleToggleDesignation = async (desId: number) => {
    let nextIds: number[];
    if (isGlobalDes) {
      nextIds = [desId];
    } else {
      nextIds = selectedDesIds.includes(desId)
        ? selectedDesIds.filter((id) => id !== desId)
        : [...selectedDesIds, desId];
    }

    await updateSubDesignation.mutateAsync({
      id: sub.id,
      data: {
        is_all_designations: false,
        designation_ids: nextIds,
      },
    });
  };

  return (
    <div className="relative px-4 py-3 hover:bg-slate-50/50 transition-colors" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
            {index}
          </span>

          {isEditing ? (
            <input
              type="text"
              autoFocus
              className="h-7 w-64 rounded border border-blue-500 px-2 text-xs uppercase tracking-wide font-bold text-slate-900 outline-none shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
              }}
            />
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {sub.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-blue-400/80 bg-white px-3 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
            {badgeText}
          </span>

          <button
            onClick={onToggleEdit}
            className={`p-1 rounded hover:bg-slate-100 transition-colors ${
              isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isEditing && (
        <div className="absolute left-10 top-12 z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Select Parent Designations
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto">
            <label
              onClick={handleToggleAllDesignations}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              <span>All designations</span>
              {isGlobalDes && <Check size={14} className="text-blue-600" />}
            </label>

            <div className="my-1 border-t border-slate-100" />

            {designations.map((d) => {
              const checked = isGlobalDes || selectedDesIds.includes(d.id);
              return (
                <label
                  key={d.id}
                  onClick={() => handleToggleDesignation(d.id)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{d.name}</span>
                  {checked && <Check size={14} className="text-blue-600" />}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
