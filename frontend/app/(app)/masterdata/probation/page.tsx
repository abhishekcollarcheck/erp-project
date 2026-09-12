// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import {
//   useProbationList,
//   useCreateProbation,
//   useUpdateProbation,
//   useDeleteProbation,
// } from '@/features/probation/hooks/useProbation';
// import { ProbationType, ProbationItem } from '@/services/api/probationService';

// export default function ProbationPage() {
//   const [activeTab, setActiveTab] = useState<ProbationType>('periods');
//   const [name, setName] = useState('');
//   const [filterText, setFilterText] = useState('');

//   // Inline Edit State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   // Data fetching
//   const { data: periods = [] } = useProbationList('periods');
//   const { data: statuses = [] } = useProbationList('statuses');

//   const currentList = activeTab === 'periods' ? periods : statuses;

//   // Mutations for current active tab
//   const createMutation = useCreateProbation(activeTab);
//   const updateMutation = useUpdateProbation(activeTab);
//   const deleteMutation = useDeleteProbation(activeTab);

//   const handleAdd = async () => {
//     if (!name.trim()) return;
//     await createMutation.mutateAsync({ name: name.trim() });
//     setName('');
//   };

//   const handleStartEdit = (item: ProbationItem) => {
//     setEditingId(item.id);
//     setEditName(item.name);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editName.trim()) {
//       handleCancelEdit();
//       return;
//     }
//     await updateMutation.mutateAsync({ id, data: { name: editName.trim() } });
//     setEditingId(null);
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//     setEditName('');
//   };

//   const handleDelete = async (id: number) => {
//     if (confirm('Are you sure you want to delete this item?')) {
//       await deleteMutation.mutateAsync(id);
//       if (editingId === id) handleCancelEdit();
//     }
//   };

//   const filteredItems = useMemo(() => {
//     return currentList.filter((item) =>
//       item.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [currentList, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Probation"
//           subtitle="Manage probation periods and status options"
//           addPlaceholder={activeTab === 'periods' ? 'Add probation period...' : 'Add probation status...'}
//           emptyText="No records found"
//           items={filteredItems}
//           tabs={[
//             {
//               label: 'Period',
//               count: periods.length,
//               active: activeTab === 'periods',
//               onClick: () => {
//                 setActiveTab('periods');
//                 setEditingId(null);
//               },
//             },
//             {
//               label: 'Status',
//               count: statuses.length,
//               active: activeTab === 'statuses',
//               onClick: () => {
//                 setActiveTab('statuses');
//                 setEditingId(null);
//               },
//             },
//           ]}
//           name={name}
//           onNameChange={setName}
//           onAdd={handleAdd}
//           filterText={filterText}
//           onFilterChange={setFilterText}
//           editingId={editingId}
//           editName={editName}
//           onEditNameChange={setEditName}
//           onStartEdit={handleStartEdit}
//           onSaveEdit={handleSaveEdit}
//           onCancelEdit={handleCancelEdit}
//           onDelete={handleDelete}
//         />
//       </MasterDataLayout>
//     </AppShell>
//   );
// }




'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { GripVertical, Pencil, X, Lock } from 'lucide-react';
import {
  useProbationList, useCreateProbation, useUpdateProbation, useDeleteProbation,
} from '@/features/probation/hooks/useProbation';
import { ProbationType, ProbationItem } from '@/services/api/probationService';

import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

// Which field_key (from probation-seed.sql) governs the active tab.
const FIELD_KEY: Record<ProbationType, string> = {
  periods: 'probation_period_name',
  statuses: 'probation_status_name',
};

const TAB_LABEL: Record<ProbationType, string> = {
  periods: 'Period',
  statuses: 'Status',
};

const PLACEHOLDER: Record<ProbationType, string> = {
  periods: 'Add probation period...',
  statuses: 'Add probation status...',
};

export default function ProbationPage() {
  const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
  const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('probation');

  const f = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const fCreate = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );

  const [activeTab, setActiveTab] = useState<ProbationType>('periods');
  const currentFieldKey = FIELD_KEY[activeTab];
  const fieldPerm = f(currentFieldKey);
  const canAddCurrent = canCreate('probation') && fCreate(currentFieldKey).can_edit;
  const canEditCurrent = canEdit('probation') && fieldPerm.can_edit;
  const canDeleteCurrent = canDelete('probation');

  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: periods = [] } = useProbationList('periods');
  const { data: statuses = [] } = useProbationList('statuses');
  const currentList = activeTab === 'periods' ? periods : statuses;

  const createMutation = useCreateProbation(activeTab);
  const updateMutation = useUpdateProbation(activeTab);
  const deleteMutation = useDeleteProbation(activeTab);

  const handleAdd = async () => {
    if (!name.trim() || !canAddCurrent) return;
    try {
      await createMutation.mutateAsync({ name: name.trim() });
      setName('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add item');
    }
  };

  const startEdit = (item: ProbationItem) => {
    if (!canEditCurrent) return;
    setEditingId(item.id);
    setEditName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!canEditCurrent || !editName.trim()) {
      cancelEdit();
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, data: { name: editName.trim() } });
      cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete item');
    }
  };

  const filteredItems = useMemo(() => {
    return currentList.filter((item) => item.name.toLowerCase().includes(filterText.toLowerCase().trim()));
  }, [currentList, filterText]);

  return (
    <PermissionGuard permission="probation:view">
      <AppShell>
        <MasterDataLayout>
          <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Probation</h1>
                <p className="text-xs text-gray-400">Manage probation periods and status options</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
              {(Object.keys(TAB_LABEL) as ProbationType[]).map((tab) => {
                const active = activeTab === tab;
                const count = tab === 'periods' ? periods.length : statuses.length;
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setEditingId(null); setFilterText(''); }}
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

            {canAddCurrent && (
              <div className="flex items-center gap-2 py-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">{filteredItems.length}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pt-2">
              {fieldsLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No records found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item, index) => {
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
                              <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-gray-600" title="Edit">
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