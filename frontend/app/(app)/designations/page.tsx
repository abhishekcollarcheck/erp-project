// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useQuery } from '@tanstack/react-query';
// import { useAppDispatch } from '../../../store';
// import { setPageTitle } from '../../../store/slices/uiSlice';
// import { AppShell } from '../../../layouts/AppLayout';
// import { StatCard } from '../../../components/ui/StatCard';
// import { Chip } from '../../../components/ui/Chip';
// import { Modal } from '../../../components/ui/Modal';
// import { DesignationFormModal } from '../../../features/designations/components/DesignationFormModal';
// import {
//   useDesignations, useDesignationStats,
//   useDeleteDesignation, useToggleDesignation,
// } from '../../../features/designations/hooks/useDesignations';
// import { usePermission } from '../../../features/auth/hooks/useAuth';
// import { useDebounce } from '../../../hooks/useDebounce';
// import { departmentService } from '../../../services/api/department.service';
// import type { Designation } from '../../../features/designations/types/designation.types';
// import { PermissionGuard } from '../../../utils/permissionGuard';

// export default function DesignationsPage() {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const { canEdit, canView, canDelete, canCreate } = usePermission();

//   const [search, setSearch] = useState('');
//   const [deptFilter, setDeptFilter] = useState<number | ''>('');
//   const [statusFilter, setStatusFilter] = useState<'true' | 'false' | 'all'>('true');
//   const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
//   const [formOpen, setFormOpen] = useState(false);
//   const [editTarget, setEditTarget] = useState<Designation | null>(null);
//   const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null);

//   const debouncedSearch = useDebounce(search, 350);
//   const deleteMutation = useDeleteDesignation();
//   const toggleMutation = useToggleDesignation();

//   const { data: designations = [], isLoading } = useDesignations({
//     search: debouncedSearch || undefined,
//     is_active: statusFilter,
//   });

//   const { data: stats } = useDesignationStats();

//   const { data: deptsRes } = useQuery({
//     queryKey: ['departments'],
//     queryFn: () => departmentService.getAll(),
//     staleTime: 5 * 60_000,
//     select: (res) => res.data,
//   });
//   const deptOptions = (deptsRes || []).map((d: any) => ({ value: d.id, label: d.name }));

//   useEffect(() => {
//     dispatch(setPageTitle({ title: 'Designations', breadcrumb: 'Organisation' }));
//   }, [dispatch]);

//   const openCreate = () => { setEditTarget(null); setFormOpen(true); };
//   const openEdit = (d: Designation) => { setEditTarget(d); setFormOpen(true); };

//   const handleDelete = async () => {
//     if (!deleteTarget) return;
//     await deleteMutation.mutateAsync(deleteTarget.id);
//     setDeleteTarget(null);
//   };

//   // ─── Grade chip colours ───────────────────────────────────────────────────
//   const gradeColor = (grade: string | null | undefined) => {
//     if (!grade) return 'gray';
//     const upper = grade.toUpperCase();
//     if (upper.startsWith('L')) return 'blue';
//     if (upper.startsWith('M')) return 'purple';
//     if (upper.includes('SENIOR') || upper.includes('SR') || upper.includes('LEAD')) return 'teal';
//     if (upper.includes('INTERN') || upper === 'L0' || upper === 'L1') return 'gray';
//     return 'amber';
//   };


//   return (
//     <PermissionGuard permission='designation:view'>
//       <AppShell onAddNew={canEdit('designation') ? openCreate : undefined}>
//         <div className="pg-enter">

//           {/* Header */}
//           <div className="ph">
//             <div>
//               <h1>Designations</h1>
//               <p>Roles and levels across your organisation · Linked to departments and employees</p>
//             </div>
//             <div className="ph-r">
//               {/* View toggle */}
//               <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2, gap: 2 }}>
//                 {(['cards', 'table'] as const).map((v) => (
//                   <button key={v} onClick={() => setViewMode(v)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: viewMode === v ? 'var(--surface)' : 'transparent', color: viewMode === v ? 'var(--ink)' : 'var(--ink4)', boxShadow: viewMode === v ? 'var(--sh)' : 'none', fontFamily: 'var(--font)', transition: 'all .1s' }}>
//                     {v === 'cards' ? '⊞ Cards' : '☰ Table'}
//                   </button>
//                 ))}
//               </div>

//               {canCreate('designation') && (
//                 <button className="btn btn-pri btn-sm" onClick={openCreate}>+ Add Designation</button>
//               )}
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="g4 mb14">
//             <StatCard label="Total" value={stats?.total ?? '…'} color="var(--blue)" />
//             <StatCard label="Active" value={stats?.active ?? '…'} color="var(--green)" />
//             <StatCard label="In Active" value={stats?.inactive ?? '…'} color="var(--teal)" />
//           </div>

//           {/* Top designation banner */}
//           {stats?.topDesignation && (
//             <div style={{ background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', borderRadius: 'var(--r)', padding: '10px 16px', marginBottom: 16, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
//               <span style={{ fontSize: 16 }}>🏆</span>
//               <span style={{ color: 'var(--ink3)' }}>
//                 Most populated designation: <strong style={{ color: 'var(--blue)' }}>{stats.topDesignation.name}</strong>
//                 <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--blue)', color: '#fff', padding: '1px 8px', borderRadius: 99 }}>{stats.topDesignation.count} employees</span>
//               </span>
//             </div>
//           )}

//           {/* Filters */}
//           <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
//             <div className="search-bar" style={{ maxWidth: 280 }}>
//               <span style={{ color: 'var(--ink4)' }}>⌕</span>
//               <input type="text" placeholder="Search name or grade…" value={search} onChange={(e) => setSearch(e.target.value)} />
//             </div>
//             {/* <select
//               value={deptFilter}
//               onChange={(e) => setDeptFilter(e.target.value ? Number(e.target.value) : '')}
//               style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}
//             >
//               <option value="">All Departments</option>
//               {deptOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
//             </select>
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value as any)}
//               style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font)', outline: 'none' }}
//             >
//               <option value="true">Active only</option>
//               <option value="false">Inactive only</option>
//               <option value="all">All</option>
//             </select>
//             <span style={{ fontSize: 11, color: 'var(--ink4)', alignSelf: 'center', marginLeft: 4 }}>
//               {designations.length} result{designations.length !== 1 ? 's' : ''}
//             </span> */}
//           </div>

//           {/* ─── TABLE VIEW ─── */}
//           {viewMode === 'table' && (
//             <div className="card">
//               <div className="tw">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Designation</th>
//                       <th>Employees</th>
//                       <th>Status</th>
//                       {canEdit('designation') && <th>Actions</th>}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {isLoading
//                       ? Array.from({ length: 5 }).map((_, i) => (
//                         <tr key={i}>
//                           {[140, 60, 100, 40, 60, 80].map((w, j) => (
//                             <td key={j}><div className="skeleton" style={{ height: 14, width: w }} /></td>
//                           ))}
//                         </tr>
//                       ))
//                       : designations.length === 0
//                         ? (
//                           <tr>
//                             <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--ink4)' }}>
//                               No designations found. {canEdit('designation') && <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={openCreate}>Create the first one →</span>}
//                             </td>
//                           </tr>
//                         )
//                         : designations.map((d) => (
//                           <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/designations/${d.id}`)}>
//                             <td>
//                               <strong style={{ color: 'var(--ink)' }}>{d.designation_name}</strong>
//                             </td>
//                             <td style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: (d.employee_count ?? 0) > 0 ? 'var(--blue)' : 'var(--ink4)', textAlign: 'center' }}>
//                               {d.employee_count ?? 0}
//                             </td>
//                             <td>
//                               <Chip variant={d.is_active ? 'green' : 'gray'}>{d.is_active ? 'Active' : 'Inactive'}</Chip>
//                             </td>
//                             <td onClick={(e) => e.stopPropagation()}>
//                               <div style={{ display: 'flex', gap: 4 }}>
//                                 {canEdit('designation') && (
//                                   <>
//                                     <Chip variant="gray" onClick={() => openEdit(d)}>Edit</Chip>
//                                     <Chip variant={d.is_active ? 'amber' : 'green'} onClick={() => toggleMutation.mutate(d.id)}>
//                                       {d.is_active ? 'Deactivate' : 'Activate'}
//                                     </Chip>
//                                   </>
//                                 )}
//                                 {canDelete('designation') && (
//                                   <Chip variant="red" onClick={() => setDeleteTarget(d)}>Delete</Chip>
//                                 )}
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* ─── CARDS VIEW ─── */}
//           {viewMode === 'cards' && (
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
//               {isLoading
//                 ? Array.from({ length: 8 }).map((_, i) => (
//                   <div key={i} className="card cp">
//                     <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
//                     <div className="skeleton" style={{ height: 12, width: '40%' }} />
//                   </div>
//                 ))
//                 : designations.length === 0
//                   ? (
//                     <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--ink4)' }}>
//                       <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
//                       <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No designations found</div>
//                       {canEdit('designation') && (
//                         <button className="btn btn-pri btn-sm" style={{ marginTop: 8 }} onClick={openCreate}>+ Add Designation</button>
//                       )}
//                     </div>
//                   )
//                   : designations.map((d) => (
//                     <div key={d.id} className="card" style={{ overflow: 'hidden' }}>
//                       {/* Colour top bar */}
//                       <div style={{ height: 4, background: d.is_active ? 'var(--blue)' : 'var(--border2)' }} />

//                       <div className="cp">
//                         {/* Header */}
//                         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
//                           <div>
//                             <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.2px' }}>
//                               {d.designation_name}
//                             </div>
//                           </div>
//                           <Chip variant={d.is_active ? 'green' : 'gray'}>
//                             {d.is_active ? 'Active' : 'Inactive'}
//                           </Chip>
//                         </div>

//                         {/* Head */}
//                         {/* {dept.head ? (
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
//                           <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
//                             {getInitials(`${dept.head.first_name} ${dept.head.last_name}`)}
//                           </div>
//                           <div>
//                             <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
//                               {dept.head.first_name} {dept.head.last_name}
//                             </div>
//                             <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Department Head</div>
//                           </div>
//                         </div>
//                       ) : (
//                         <div style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic', marginBottom: 12, padding: '6px 10px', background: 'var(--amber-lt)', borderRadius: 'var(--r)', border: '1px solid var(--amber-bd)' }}>
//                           ⚠ No head assigned
//                         </div>
//                       )} */}

//                         {/* Stats row */}
//                         <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
//                           <div style={{ textAlign: 'left', flex: 1 }}>
//                             <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>
//                               {d.employee_count ?? 0}
//                             </div>
//                             <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Employees</div>
//                           </div>
//                         </div>

//                         {/* Actions */}
//                           <div style={{ display: 'flex', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
//                             <Chip variant="blue" onClick={() => router.push(`/designations/${d.id}`)}>View</Chip>
//                             {canEdit('department') && (
//                               <Chip variant="gray" onClick={() => openEdit(d)}>Edit</Chip>
//                             )}
//                             {canDelete('department') && (
//                               <Chip variant="red" onClick={() => setDeleteTarget(d)}>Delete</Chip>
//                             )}
//                           </div>
//                       </div>
//                     </div>

//                   ))}
//             </div>
//           )}
//         </div>

//         {/* Create / Edit modal */}
//         <DesignationFormModal
//           open={formOpen}
//           onClose={() => { setFormOpen(false); setEditTarget(null); }}
//           designation={editTarget}
//           departments={deptOptions}
//         />

//         {/* Delete confirmation */}
//         <Modal
//           open={!!deleteTarget}
//           onClose={() => setDeleteTarget(null)}
//           title="Delete Designation"
//           subtitle={`Delete "${deleteTarget?.designation_name}"?`}
//           footer={
//             <>
//               <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>Cancel</button>
//               <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
//                 {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
//               </button>
//             </>
//           }
//         >
//           <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
//             ⚠ If active employees hold this designation, deletion will be blocked. Reassign them first.
//           </div>
//         </Modal>
//       </AppShell>
//     </PermissionGuard>
//   );
// }




























'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Layers,
  Search,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Building2,
} from 'lucide-react';

import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
// import { DesignationFormModal } from '../../../features/designations/components/DesignationFormModal';

import {
  useDesignations,
  useSubDesignations,
  useDeleteDesignation,
  useDeleteSubDesignation,
  useUpdateDesignation,
  useUpdateSubDesignation,
} from '../../../features/designation/hooks/useDesignations';

import { usePermission } from '../../../features/auth/hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { departmentService } from '../../../services/api/department.service';
import type { Designation, SubDesignation } from '../../../services/api/designation.service';
import { PermissionGuard } from '../../../utils/permissionGuard';

type ActiveTab = 'designation' | 'subdesignation';

export default function DesignationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canEdit, canDelete, canCreate } = usePermission();

  // ─── State Management ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('designation');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'true' | 'false' | 'all'>('true');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Designation | SubDesignation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Designation | SubDesignation | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  // ─── Mutations ──────────────────────────────────────────────────────────
  const deleteDesignation = useDeleteDesignation();
  const deleteSubDesignation = useDeleteSubDesignation();
  const updateDesignation = useUpdateDesignation();
  const updateSubDesignation = useUpdateSubDesignation();

  // ─── Data Queries ───────────────────────────────────────────────────────
  const { data: designations = [], isLoading: loadingDesignations } = useDesignations({
    search: debouncedSearch || undefined,
    is_active: statusFilter,
  });

  const { data: subDesignations = [], isLoading: loadingSubDesignations } = useSubDesignations({
    search: debouncedSearch || undefined,
    is_active: statusFilter,
  });

  const { data: deptsRes } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
    staleTime: 5 * 60_000,
    select: (res) => res.data,
  });

  const deptOptions = useMemo(
    () => (deptsRes || []).map((d: any) => ({ value: d.id, label: d.department_name || d.name })),
    [deptsRes]
  );

  // Set Page Header Title
  useEffect(() => {
    dispatch(setPageTitle({ title: 'Designations', breadcrumb: 'Organisation' }));
  }, [dispatch]);

  // Reset filters on tab switch
  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearch('');
    setEditTarget(null);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (item: Designation | SubDesignation) => {
    setEditTarget(item);
    setFormOpen(true);
  };

  const handleToggleStatus = async (item: Designation | SubDesignation) => {
    if (activeTab === 'designation') {
      await updateDesignation.mutateAsync({
        id: item.id,
        data: { is_active: !item.is_active },
      });
    } else {
      await updateSubDesignation.mutateAsync({
        id: item.id,
        data: { is_active: !item.is_active },
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (activeTab === 'designation') {
      await deleteDesignation.mutateAsync(deleteTarget.id);
    } else {
      await deleteSubDesignation.mutateAsync(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // Derived stats
  const currentList = activeTab === 'designation' ? designations : subDesignations;
  const isLoading = activeTab === 'designation' ? loadingDesignations : loadingSubDesignations;

  const totalCount = currentList.length;
  const activeCount = currentList.filter((item) => item.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <PermissionGuard permission="designation:view">
      <AppShell onAddNew={canCreate('designation') ? openCreate : undefined}>
        <div className="pg-enter">
          
          {/* Top Page Header */}
          <div className="ph mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Designations & Roles
              </h1>
              <p className="text-xs text-slate-500">
                Manage job titles, hierarchies, and sub-role mappings across departments.
              </p>
            </div>

            <div className="ph-r flex items-center gap-3">
              {/* Cards / Table View Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid size={13} />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List size={13} />
                  Table
                </button>
              </div>

              {canCreate('designation') && (
                <button className="btn btn-pri btn-sm" onClick={openCreate}>
                  <Plus size={14} className="mr-1 inline" />
                  Add {activeTab === 'designation' ? 'Designation' : 'Sub-Designation'}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-4 flex items-center gap-4 border-b border-slate-200 pb-2">
            <button
              onClick={() => handleTabSwitch('designation')}
              className={`flex items-center gap-2 border-b-2 px-1 pb-2 text-xs font-semibold transition-colors ${
                activeTab === 'designation'
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
              onClick={() => handleTabSwitch('subdesignation')}
              className={`flex items-center gap-2 border-b-2 px-1 pb-2 text-xs font-semibold transition-colors ${
                activeTab === 'subdesignation'
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

          {/* Analytics Stat Cards */}
          <div className="g4 mb14 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <StatCard label={`Total ${activeTab === 'designation' ? 'Designations' : 'Sub-Designations'}`} value={totalCount} color="var(--blue)" />
            <StatCard label="Active Status" value={activeCount} color="var(--green)" />
            <StatCard label="Inactive / Archived" value={inactiveCount} color="var(--teal)" />
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="search-bar relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'designation' ? 'designations' : 'sub-designations'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="true font-medium">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="all">All Records</option>
            </select>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* TABLE VIEW MODE                                            */}
          {/* ────────────────────────────────────────────────────────── */}
          {viewMode === 'table' && (
            <div className="card overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm">
              <div className="tw overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="p-3">Title</th>
                      <th className="p-3">
                        {activeTab === 'designation' ? 'Mapped Departments' : 'Parent Designations'}
                      </th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="p-3"><div className="skeleton h-3 w-36 rounded" /></td>
                          <td className="p-3"><div className="skeleton h-3 w-48 rounded" /></td>
                          <td className="p-3"><div className="skeleton h-3 w-12 mx-auto rounded" /></td>
                          <td className="p-3"><div className="skeleton h-3 w-20 ml-auto rounded" /></td>
                        </tr>
                      ))
                    ) : currentList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          No {activeTab === 'designation' ? 'designations' : 'sub-designations'} found.
                        </td>
                      </tr>
                    ) : (
                      currentList.map((item) => {
                        const isDesignation = activeTab === 'designation';
                        const des = item as Designation;
                        const sub = item as SubDesignation;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                            onClick={() => isDesignation && router.push(`/designations/${item.id}`)}
                          >
                            <td className="p-3">
                              <span className="font-bold text-slate-900 uppercase tracking-wide">
                                {item.name}
                              </span>
                              {item.code && (
                                <span className="ml-2 font-mono text-[10px] text-slate-400">
                                  ({item.code})
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-slate-500">
                              {isDesignation ? (
                                des.is_all_departments ? (
                                  <span className="text-blue-600 font-medium">All Departments</span>
                                ) : (
                                  des.departments?.map((d) => d.department_name).join(', ') || 'Unassigned'
                                )
                              ) : sub.is_all_designations ? (
                                <span className="text-blue-600 font-medium">All Designations</span>
                              ) : (
                                sub.designations?.map((d) => d.name).join(', ') || 'Unassigned'
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <Chip variant={item.is_active ? 'green' : 'gray'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Chip>
                            </td>

                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {isDesignation && (
                                  <Chip variant="blue" onClick={() => router.push(`/designations/${item.id}`)}>
                                    View
                                  </Chip>
                                )}
                                {canEdit('designation') && (
                                  <>
                                    <Chip variant="gray" onClick={() => openEdit(item)}>Edit</Chip>
                                    <Chip
                                      variant={item.is_active ? 'amber' : 'green'}
                                      onClick={() => handleToggleStatus(item)}
                                    >
                                      {item.is_active ? 'Deactivate' : 'Activate'}
                                    </Chip>
                                  </>
                                )}
                                {canDelete('designation') && (
                                  <Chip variant="red" onClick={() => setDeleteTarget(item)}>Delete</Chip>
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
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* CARDS VIEW MODE                                            */}
          {/* ────────────────────────────────────────────────────────── */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
                    <div className="skeleton h-4 w-1/2 rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-8 w-full rounded" />
                  </div>
                ))
              ) : currentList.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm font-semibold">No records match your criteria</p>
                  {canCreate('designation') && (
                    <button className="btn btn-pri btn-sm mt-3" onClick={openCreate}>
                      + Add New Record
                    </button>
                  )}
                </div>
              ) : (
                currentList.map((item) => {
                  const isDesignation = activeTab === 'designation';
                  const des = item as Designation;
                  const sub = item as SubDesignation;

                  return (
                    <div
                      key={item.id}
                      className="card relative flex flex-col justify-between border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div className={`h-1 w-full ${item.is_active ? 'bg-blue-600' : 'bg-slate-300'}`} />

                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                              {item.name}
                            </h3>
                            {item.code && (
                              <span className="text-[10px] font-mono text-slate-400">
                                CODE: {item.code}
                              </span>
                            )}
                          </div>
                          <Chip variant={item.is_active ? 'green' : 'gray'}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Chip>
                        </div>

                        {/* Mapped Associations Pill Box */}
                        <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <Building2 size={12} />
                            {isDesignation ? 'Departments Scope' : 'Parent Designations'}
                          </div>
                          <div className="text-slate-700 font-medium truncate">
                            {isDesignation ? (
                              des.is_all_departments ? (
                                <span className="text-blue-600 font-semibold">Global (All Departments)</span>
                              ) : (
                                des.departments?.map((d) => d.department_name).join(', ') || 'No Departments'
                              )
                            ) : sub.is_all_designations ? (
                              <span className="text-blue-600 font-semibold">Global (All Designations)</span>
                            ) : (
                              sub.designations?.map((d) => d.name).join(', ') || 'No Parent Designations'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                        {isDesignation ? (
                          <button
                            onClick={() => router.push(`/designations/${item.id}`)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Eye size={13} />
                            Details
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-1.5">
                          {canEdit('designation') && (
                            <>
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <Chip
                                variant={item.is_active ? 'amber' : 'green'}
                                onClick={() => handleToggleStatus(item)}
                              >
                                {item.is_active ? 'Deactivate' : 'Activate'}
                              </Chip>
                            </>
                          )}
                          {canDelete('designation') && (
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Modal for Creating / Editing */}
          {/* <DesignationFormModal
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditTarget(null);
            }}
            designation={editTarget}
            departments={deptOptions}
          /> */}

          {/* Modal for Delete Confirmation */}
          <Modal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title={`Delete ${activeTab === 'designation' ? 'Designation' : 'Sub-Designation'}`}
            subtitle={`Are you sure you want to delete "${deleteTarget?.name}"?`}
            footer={
              <>
                <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleteDesignation.isPending || deleteSubDesignation.isPending}
                >
                  {deleteDesignation.isPending || deleteSubDesignation.isPending
                    ? 'Deleting…'
                    : 'Yes, Delete'}
                </button>
              </>
            }
          >
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                Deleting this record will unassign it from active employees and associated mappings. This action cannot be undone.
              </span>
            </div>
          </Modal>

        </div>
      </AppShell>
    </PermissionGuard>
  );
}