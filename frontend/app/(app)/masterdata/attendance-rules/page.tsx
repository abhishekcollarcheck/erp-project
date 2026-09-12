// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';

// import {
//   useSaturdayRulesData,
//   useCreateSaturdayRule,
//   useUpdateSaturdayRule,
//   useDeleteSaturdayRule,
//   useDeleteAllSaturdayRules,
//   useGraceMinutesData,
//   useCreateGraceMinute,
//   useUpdateGraceMinute,
//   useDeleteGraceMinute,
//   useDeleteAllGraceMinutes,
//   useAttendanceTypesData,
//   useCreateAttendanceType,
//   useUpdateAttendanceType,
//   useDeleteAttendanceType,
//   useDeleteAllAttendanceTypes,
// } from '@/features/attendance-rule/hooks/useAttendanceRules';

// type TabType = 'saturday' | 'grace' | 'attendance';

// export default function AttendanceRulesPage() {
//   const [activeTab, setActiveTab] = useState<TabType>('saturday');
//   const [inputValue, setInputValue] = useState('');
//   const [filterText, setFilterText] = useState('');

//   // Inline editing state
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   // ─── Saturday Rules Data & Mutations ──────────────────────────────────────
//   const { data: saturdayRulesResponse } = useSaturdayRulesData();
//   const saturdayRules = saturdayRulesResponse?.data || [];
//   const createSaturdayRule = useCreateSaturdayRule();
//   const updateSaturdayRule = useUpdateSaturdayRule();
//   const deleteSaturdayRule = useDeleteSaturdayRule();
//   const deleteAllSaturdayRules = useDeleteAllSaturdayRules();

//   // ─── Grace Minutes Data & Mutations ────────────────────────────────────────
//   const { data: graceMinutesResponse } = useGraceMinutesData();
//   const graceMinutes = graceMinutesResponse?.data || [];
//   const createGraceMinute = useCreateGraceMinute();
//   const updateGraceMinute = useUpdateGraceMinute();
//   const deleteGraceMinute = useDeleteGraceMinute();
//   const deleteAllGraceMinutes = useDeleteAllGraceMinutes();

//   // ─── Attendance Types Data & Mutations ─────────────────────────────────────
//   const { data: attendanceTypesResponse } = useAttendanceTypesData();
//   const attendanceTypes = attendanceTypesResponse?.data || [];
//   const createAttendanceType = useCreateAttendanceType();
//   const updateAttendanceType = useUpdateAttendanceType();
//   const deleteAttendanceType = useDeleteAttendanceType();
//   const deleteAllAttendanceTypes = useDeleteAllAttendanceTypes();

//   // ─── Add Handler ──────────────────────────────────────────────────────────
//   const handleAdd = async () => {
//     if (!inputValue.trim()) return;

//     if (activeTab === 'saturday') {
//       await createSaturdayRule.mutateAsync({ name: inputValue.trim() });
//     } else if (activeTab === 'grace') {
//       await createGraceMinute.mutateAsync({ name: inputValue.trim() });
//     } else if (activeTab === 'attendance') {
//       await createAttendanceType.mutateAsync({ name: inputValue.trim() });
//     }

//     setInputValue('');
//   };

//   // ─── Save Edit Handler ────────────────────────────────────────────────────
//   const handleSaveEdit = async (id: number) => {
//     if (!editName.trim()) {
//       setEditingId(null);
//       return;
//     }

//     if (activeTab === 'saturday') {
//       await updateSaturdayRule.mutateAsync({ id, data: { name: editName.trim() } });
//     } else if (activeTab === 'grace') {
//       await updateGraceMinute.mutateAsync({ id, data: { name: editName.trim() } });
//     } else if (activeTab === 'attendance') {
//       await updateAttendanceType.mutateAsync({ id, data: { name: editName.trim() } });
//     }

//     setEditingId(null);
//   };

//   // ─── Delete Item Handler ──────────────────────────────────────────────────
//   const handleDelete = (id: number) => {
//     if (activeTab === 'saturday') deleteSaturdayRule.mutate(id);
//     if (activeTab === 'grace') deleteGraceMinute.mutate(id);
//     if (activeTab === 'attendance') deleteAttendanceType.mutate(id);
//   };

//   // ─── Delete Master Handler ────────────────────────────────────────────────
//   const handleDeleteMaster = () => {
//     if (confirm(`Are you sure you want to delete all items for this section?`)) {
//       if (activeTab === 'saturday') deleteAllSaturdayRules.mutate();
//       if (activeTab === 'grace') deleteAllGraceMinutes.mutate();
//       if (activeTab === 'attendance') deleteAllAttendanceTypes.mutate();
//     }
//   };

//   // ─── Active Data Filtering ────────────────────────────────────────────────
//   const currentList = useMemo(() => {
//     let list: Array<{ id: number; name: string }> = [];
//     if (activeTab === 'saturday') list = saturdayRules;
//     if (activeTab === 'grace') list = graceMinutes;
//     if (activeTab === 'attendance') list = attendanceTypes;

//     return list.filter((item) =>
//       item.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [activeTab, saturdayRules, graceMinutes, attendanceTypes, filterText]);

//   // Tab Placeholder Labels
//   const placeholderText = {
//     saturday: 'Add saturday off...',
//     grace: 'Add grace minutes...',
//     attendance: 'Add attendance type...',
//   }[activeTab];

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Attendance Rules"
//           subtitle="Saturday-nth rules (for weekly-off presets), grace minutes, attendance types"
//           addPlaceholder={placeholderText}
//           items={currentList}
//           headerExtra={
//             <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={handleDeleteMaster}>
//               Delete master
//             </button>
//           }
//           tabs={[
//             {
//               label: 'Saturday Rules',
//               count: saturdayRules.length,
//               active: activeTab === 'saturday',
//               onClick: () => { setActiveTab('saturday'); setEditingId(null); },
//             },
//             {
//               label: 'Grace Minutes',
//               count: graceMinutes.length,
//               active: activeTab === 'grace',
//               onClick: () => { setActiveTab('grace'); setEditingId(null); },
//             },
//             {
//               label: 'Attendance Type',
//               count: attendanceTypes.length,
//               active: activeTab === 'attendance',
//               onClick: () => { setActiveTab('attendance'); setEditingId(null); },
//             },
//           ]}
//           name={inputValue}
//           onNameChange={setInputValue}
//           onAdd={handleAdd}
//           filterText={filterText}
//           onFilterChange={setFilterText}
//           editingId={editingId}
//           editName={editName}
//           onEditNameChange={setEditName}
//           onStartEdit={(item) => {
//             setEditingId(item.id);
//             setEditName(item.name);
//           }}
//           onSaveEdit={handleSaveEdit}
//           onCancelEdit={() => setEditingId(null)}
//           onDelete={handleDelete}
//         />
//       </MasterDataLayout>
//     </AppShell>
//   );
// }














// 'use client';

// import React, { useState, useMemo, useCallback } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';

// import {
//   useSaturdayRulesData, useCreateSaturdayRule, useUpdateSaturdayRule, useDeleteSaturdayRule, useDeleteAllSaturdayRules,
//   useGraceMinutesData, useCreateGraceMinute, useUpdateGraceMinute, useDeleteGraceMinute, useDeleteAllGraceMinutes,
//   useAttendanceTypesData, useCreateAttendanceType, useUpdateAttendanceType, useDeleteAttendanceType, useDeleteAllAttendanceTypes,
// } from '@/features/attendance-rule/hooks/useAttendanceRules';

// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
// import { showToast } from '@/utils/toast';

// type TabType = 'saturday' | 'grace' | 'attendance';

// // Which field_key (from attendance-rule-seed.sql) governs the active tab.
// const FIELD_KEY: Record<TabType, string> = {
//   saturday: 'saturday_rule_name',
//   grace: 'grace_minute_name',
//   attendance: 'attendance_type_name',
// };

// export default function AttendanceRulesPage() {
//   const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('attendance_rule');

//   // f() = existing rows (completionPct: 100). fCreate() = the quick-add row
//   // (completionPct: 0 — activates can_add's bonus), same split as every
//   // other SimpleMasterList-based page.
//   const f = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );
//   const fCreate = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );

//   const [activeTab, setActiveTab] = useState<TabType>('saturday');
//   const currentFieldKey = FIELD_KEY[activeTab];
//   const canAddCurrent = canCreate('attendance_rule') && fCreate(currentFieldKey).can_edit;
//   const canEditCurrent = canEdit('attendance_rule') && f(currentFieldKey).can_edit;
//   const canDeleteCurrent = canDelete('attendance_rule');

//   const [inputValue, setInputValue] = useState('');
//   const [filterText, setFilterText] = useState('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   // ─── Saturday Rules ──────────────────────────────────────────────────────
//   const { data: saturdayRulesResponse } = useSaturdayRulesData();
//   const saturdayRules = saturdayRulesResponse?.data || [];
//   const createSaturdayRule = useCreateSaturdayRule();
//   const updateSaturdayRule = useUpdateSaturdayRule();
//   const deleteSaturdayRule = useDeleteSaturdayRule();
//   const deleteAllSaturdayRules = useDeleteAllSaturdayRules();

//   // ─── Grace Minutes ───────────────────────────────────────────────────────
//   const { data: graceMinutesResponse } = useGraceMinutesData();
//   const graceMinutes = graceMinutesResponse?.data || [];
//   const createGraceMinute = useCreateGraceMinute();
//   const updateGraceMinute = useUpdateGraceMinute();
//   const deleteGraceMinute = useDeleteGraceMinute();
//   const deleteAllGraceMinutes = useDeleteAllGraceMinutes();

//   // ─── Attendance Types ────────────────────────────────────────────────────
//   const { data: attendanceTypesResponse } = useAttendanceTypesData();
//   const attendanceTypes = attendanceTypesResponse?.data || [];
//   const createAttendanceType = useCreateAttendanceType();
//   const updateAttendanceType = useUpdateAttendanceType();
//   const deleteAttendanceType = useDeleteAttendanceType();
//   const deleteAllAttendanceTypes = useDeleteAllAttendanceTypes();

//   const handleAdd = async () => {
//     if (!inputValue.trim() || !canAddCurrent) return;

//     try {
//       if (activeTab === 'saturday') await createSaturdayRule.mutateAsync({ name: inputValue.trim() });
//       else if (activeTab === 'grace') await createGraceMinute.mutateAsync({ name: inputValue.trim() });
//       else if (activeTab === 'attendance') await createAttendanceType.mutateAsync({ name: inputValue.trim() });
//       setInputValue('');
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to add item');
//     }
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!canEditCurrent) return;
//     if (!editName.trim()) {
//       setEditingId(null);
//       return;
//     }

//     try {
//       if (activeTab === 'saturday') await updateSaturdayRule.mutateAsync({ id, data: { name: editName.trim() } });
//       else if (activeTab === 'grace') await updateGraceMinute.mutateAsync({ id, data: { name: editName.trim() } });
//       else if (activeTab === 'attendance') await updateAttendanceType.mutateAsync({ id, data: { name: editName.trim() } });
//       setEditingId(null);
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDeleteCurrent) return;
//     try {
//       if (activeTab === 'saturday') await deleteSaturdayRule.mutateAsync(id);
//       else if (activeTab === 'grace') await deleteGraceMinute.mutateAsync(id);
//       else if (activeTab === 'attendance') await deleteAttendanceType.mutateAsync(id);
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to delete item');
//     }
//   };

//   const handleDeleteMaster = async () => {
//     if (!canDeleteCurrent) return;
//     if (!confirm('Are you sure you want to delete all items for this section?')) return;

//     try {
//       if (activeTab === 'saturday') await deleteAllSaturdayRules.mutateAsync();
//       else if (activeTab === 'grace') await deleteAllGraceMinutes.mutateAsync();
//       else if (activeTab === 'attendance') await deleteAllAttendanceTypes.mutateAsync();
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to delete all items');
//     }
//   };

//   const currentList = useMemo(() => {
//     let list: Array<{ id: number; name: string }> = [];
//     if (activeTab === 'saturday') list = saturdayRules;
//     if (activeTab === 'grace') list = graceMinutes;
//     if (activeTab === 'attendance') list = attendanceTypes;

//     return list.filter((item) => item.name.toLowerCase().includes(filterText.toLowerCase().trim()));
//   }, [activeTab, saturdayRules, graceMinutes, attendanceTypes, filterText]);

//   const placeholderText = {
//     saturday: 'Add saturday off...',
//     grace: 'Add grace minutes...',
//     attendance: 'Add attendance type...',
//   }[activeTab];

//   return (
//     <PermissionGuard permission="attendance_rule:view">
//       <AppShell>
//         <MasterDataLayout>
//           <SimpleMasterList
//             title="Attendance Rules"
//             subtitle="Saturday-nth rules (for weekly-off presets), grace minutes, attendance types"
//             addPlaceholder={placeholderText}
//             isLoading={fieldsLoading}
//             items={currentList}
//             headerExtra={
//               canDeleteCurrent && (
//                 <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={handleDeleteMaster}>
//                   Delete master
//                 </button>
//               )
//             }
//             tabs={[
//               {
//                 label: 'Saturday Rules',
//                 count: saturdayRules.length,
//                 active: activeTab === 'saturday',
//                 onClick: () => { setActiveTab('saturday'); setEditingId(null); },
//               },
//               {
//                 label: 'Grace Minutes',
//                 count: graceMinutes.length,
//                 active: activeTab === 'grace',
//                 onClick: () => { setActiveTab('grace'); setEditingId(null); },
//               },
//               {
//                 label: 'Attendance Type',
//                 count: attendanceTypes.length,
//                 active: activeTab === 'attendance',
//                 onClick: () => { setActiveTab('attendance'); setEditingId(null); },
//               },
//             ]}
//             name={inputValue}
//             onNameChange={setInputValue}
//             onAdd={handleAdd}
//             filterText={filterText}
//             onFilterChange={setFilterText}
//             editingId={editingId}
//             editName={editName}
//             onEditNameChange={setEditName}
//             onStartEdit={(item) => {
//               if (!canEditCurrent) return;
//               setEditingId(item.id);
//               setEditName(item.name);
//             }}
//             onSaveEdit={handleSaveEdit}
//             onCancelEdit={() => setEditingId(null)}
//             onDelete={handleDelete}
//             canAdd={canAddCurrent}
//             canEdit={canEditCurrent}
//             canDelete={canDeleteCurrent}
//             fieldPerm={f(currentFieldKey)}
//           />
//         </MasterDataLayout>
//       </AppShell>
//     </PermissionGuard>
//   );
// }










'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { GripVertical, Pencil, X, Lock } from 'lucide-react';

import {
  useSaturdayRulesData, useCreateSaturdayRule, useUpdateSaturdayRule, useDeleteSaturdayRule, useDeleteAllSaturdayRules,
  useGraceMinutesData, useCreateGraceMinute, useUpdateGraceMinute, useDeleteGraceMinute, useDeleteAllGraceMinutes,
  useAttendanceTypesData, useCreateAttendanceType, useUpdateAttendanceType, useDeleteAttendanceType, useDeleteAllAttendanceTypes,
} from '@/features/attendance-rule/hooks/useAttendanceRules';

import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

type TabType = 'saturday' | 'grace' | 'attendance';

// Which field_key (from attendance-rule-seed.sql) governs the active tab.
const FIELD_KEY: Record<TabType, string> = {
  saturday: 'saturday_rule_name',
  grace: 'grace_minute_name',
  attendance: 'attendance_type_name',
};

const TAB_LABEL: Record<TabType, string> = {
  saturday: 'Saturday Rules',
  grace: 'Grace Minutes',
  attendance: 'Attendance Type',
};

const PLACEHOLDER: Record<TabType, string> = {
  saturday: 'Add saturday off...',
  grace: 'Add grace minutes...',
  attendance: 'Add attendance type...',
};

export default function AttendanceRulesPage() {
  const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
  const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('attendance_rule');

  const f = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const fCreate = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );

  const [activeTab, setActiveTab] = useState<TabType>('saturday');
  const currentFieldKey = FIELD_KEY[activeTab];
  const fieldPerm = f(currentFieldKey);
  const canAddCurrent = canCreate('attendance_rule') && fCreate(currentFieldKey).can_edit;
  const canEditCurrent = canEdit('attendance_rule') && fieldPerm.can_edit;
  const canDeleteCurrent = canDelete('attendance_rule');

  const [inputValue, setInputValue] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // ─── Saturday Rules ──────────────────────────────────────────────────────
  const { data: saturdayRulesResponse } = useSaturdayRulesData();
  const saturdayRules = saturdayRulesResponse?.data || [];
  const createSaturdayRule = useCreateSaturdayRule();
  const updateSaturdayRule = useUpdateSaturdayRule();
  const deleteSaturdayRule = useDeleteSaturdayRule();
  const deleteAllSaturdayRules = useDeleteAllSaturdayRules();

  // ─── Grace Minutes ───────────────────────────────────────────────────────
  const { data: graceMinutesResponse } = useGraceMinutesData();
  const graceMinutes = graceMinutesResponse?.data || [];
  const createGraceMinute = useCreateGraceMinute();
  const updateGraceMinute = useUpdateGraceMinute();
  const deleteGraceMinute = useDeleteGraceMinute();
  const deleteAllGraceMinutes = useDeleteAllGraceMinutes();

  // ─── Attendance Types ────────────────────────────────────────────────────
  const { data: attendanceTypesResponse } = useAttendanceTypesData();
  const attendanceTypes = attendanceTypesResponse?.data || [];
  const createAttendanceType = useCreateAttendanceType();
  const updateAttendanceType = useUpdateAttendanceType();
  const deleteAttendanceType = useDeleteAttendanceType();
  const deleteAllAttendanceTypes = useDeleteAllAttendanceTypes();

  const handleAdd = async () => {
    if (!inputValue.trim() || !canAddCurrent) return;
    try {
      if (activeTab === 'saturday') await createSaturdayRule.mutateAsync({ name: inputValue.trim() });
      else if (activeTab === 'grace') await createGraceMinute.mutateAsync({ name: inputValue.trim() });
      else if (activeTab === 'attendance') await createAttendanceType.mutateAsync({ name: inputValue.trim() });
      setInputValue('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add item');
    }
  };

  const startEdit = (id: number, name: string) => {
    if (!canEditCurrent) return;
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim() || !canEditCurrent) return;
    try {
      if (activeTab === 'saturday') await updateSaturdayRule.mutateAsync({ id, data: { name: editName.trim() } });
      else if (activeTab === 'grace') await updateGraceMinute.mutateAsync({ id, data: { name: editName.trim() } });
      else if (activeTab === 'attendance') await updateAttendanceType.mutateAsync({ id, data: { name: editName.trim() } });
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'saturday') await deleteSaturdayRule.mutateAsync(id);
      else if (activeTab === 'grace') await deleteGraceMinute.mutateAsync(id);
      else if (activeTab === 'attendance') await deleteAttendanceType.mutateAsync(id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete item');
    }
  };

  const handleDeleteMaster = async () => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete all items for this section?')) return;
    try {
      if (activeTab === 'saturday') await deleteAllSaturdayRules.mutateAsync();
      else if (activeTab === 'grace') await deleteAllGraceMinutes.mutateAsync();
      else if (activeTab === 'attendance') await deleteAllAttendanceTypes.mutateAsync();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete all items');
    }
  };

  const currentList = useMemo(() => {
    let list: Array<{ id: number; name: string }> = [];
    if (activeTab === 'saturday') list = saturdayRules;
    if (activeTab === 'grace') list = graceMinutes;
    if (activeTab === 'attendance') list = attendanceTypes;
    return list.filter((item) => item.name.toLowerCase().includes(filterText.toLowerCase().trim()));
  }, [activeTab, saturdayRules, graceMinutes, attendanceTypes, filterText]);

  const isLoading = fieldsLoading;

  return (
    <PermissionGuard permission="attendance_rule:view">
      <AppShell>
        <MasterDataLayout>
          <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Attendance Rules</h1>
                <p className="text-xs text-gray-400">
                  Saturday-nth rules (for weekly-off presets), grace minutes, attendance types
                </p>
              </div>
              <div className="flex items-center gap-3">
                {canDeleteCurrent && (
                  <button
                    onClick={handleDeleteMaster}
                    disabled={currentList.length === 0}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete master
                  </button>
                )}
                <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  AUTO-SAVE ON
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
              {(Object.keys(TAB_LABEL) as TabType[]).map((tab) => {
                const active = activeTab === tab;
                const count = tab === 'saturday' ? saturdayRules.length : tab === 'grace' ? graceMinutes.length : attendanceTypes.length;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setFilterText('');
                      setEditingId(null);
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      active ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {TAB_LABEL[tab]}
                    <span className={`text-[10px] ${active ? 'font-bold text-blue-600' : 'text-gray-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick-Add Bar — hidden entirely when the role can't add to this tab's field */}
            {canAddCurrent && (
              <div className="flex items-center gap-2 py-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={PLACEHOLDER[activeTab]}
                  className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  className="flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
                >
                  Add
                </button>
              </div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center justify-between py-2">
              <div className="relative w-64">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter..."
                  className="h-8 w-full rounded-md border border-gray-200 bg-white pl-3 pr-8 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
                />
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">{currentList.length}</span>
            </div>

            {/* List Section */}
            <div className="min-h-0 flex-1 overflow-y-auto pt-2">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading attendance rule data...</div>
              ) : currentList.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No records found.</div>
              ) : (
                <div className="space-y-1">
                  {currentList.map((item, index) => {
                    const isEditingRow = editingId === item.id;
                    const mv = maskedView(item.name, fieldPerm);
                    const displayText = mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

                    return (
                      <div key={item.id} className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50/80">
                        <div className="flex flex-1 items-center gap-3">
                          <GripVertical size={14} className="cursor-grab text-gray-300 opacity-60 group-hover:opacity-100" />
                          <span className="min-w-[18px] text-left text-[11px] font-semibold text-gray-300">{index + 1}</span>

                          {isEditingRow ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                              className="h-7 w-64 rounded border border-blue-400 px-2 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-blue-100"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="flex items-center gap-1 text-xs font-semibold text-gray-800"
                              data-nocopy={mv.noCopy || undefined}
                              onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
                              onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
                              onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
                            >
                              {displayText}
                              {mv.kind !== 'none' && <Lock size={10} className="text-gray-400" />}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          {isEditingRow ? (
                            <button onClick={() => handleSaveEdit(item.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                              Save
                            </button>
                          ) : (
                            canEditCurrent && mv.kind === 'none' && (
                              <button onClick={() => startEdit(item.id, item.name)} className="text-gray-400 hover:text-gray-600" title="Edit">
                                <Pencil size={13} />
                              </button>
                            )
                          )}
                          {canDeleteCurrent && (
                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600" title="Delete">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </MasterDataLayout>
      </AppShell>
    </PermissionGuard>
  );
}