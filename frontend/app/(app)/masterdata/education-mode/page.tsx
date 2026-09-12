// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import {
//   useEducationModeData,
//   useCreateEducationMode,
//   useUpdateEducationMode,
//   useDeleteEducationMode,
// } from '@/features/education-mode/hooks/useEducationMode';

// export default function EducationModePage() {
//   const [name, setName] = useState('');
//   const [filterText, setFilterText] = useState('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   const { data: educationModes = [] } = useEducationModeData();

//   const createEducationMode = useCreateEducationMode();
//   const updateEducationMode = useUpdateEducationMode();
//   const deleteEducationMode = useDeleteEducationMode();

//   const handleAddEducationMode = async () => {
//     if (!name.trim()) return;
//     await createEducationMode.mutateAsync(name.trim());
//     setName('');
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (editName.trim()) {
//       await updateEducationMode.mutateAsync({ id, name: editName.trim() });
//     }
//     setEditingId(null);
//   };

//   const filteredEducationModes = useMemo(() => {
//     return educationModes.filter((m) =>
//       m.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [educationModes, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Education Mode"
//           addPlaceholder="Add education mode..."
//           items={filteredEducationModes}
//           name={name}
//           onNameChange={setName}
//           onAdd={handleAddEducationMode}
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
//           onDelete={(id) => deleteEducationMode.mutate(id)}
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
  useEducationModeData,
  useCreateEducationMode,
  useUpdateEducationMode,
  useDeleteEducationMode,
} from '@/features/education-mode/hooks/useEducationMode';

import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

const FIELD_KEY = 'education_mode_name';

export default function EducationModePage() {
  const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
  const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('education_mode');

  const f = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const fCreate = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );

  const fieldPerm = f(FIELD_KEY);
  const canAddCurrent = canCreate('education_mode') && fCreate(FIELD_KEY).can_edit;
  const canEditCurrent = canEdit('education_mode') && fieldPerm.can_edit;
  const canDeleteCurrent = canDelete('education_mode');

  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: educationModes = [] } = useEducationModeData();
  const createEducationMode = useCreateEducationMode();
  const updateEducationMode = useUpdateEducationMode();
  const deleteEducationMode = useDeleteEducationMode();

  const handleAddEducationMode = async () => {
    if (!name.trim() || !canAddCurrent) return;
    try {
      await createEducationMode.mutateAsync(name.trim());
      setName('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add education mode');
    }
  };

  const startEdit = (item: { id: number; name: string }) => {
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
      await updateEducationMode.mutateAsync({ id, name: editName.trim() });
      cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete this education mode?')) return;
    try {
      await deleteEducationMode.mutateAsync(id);
      if (editingId === id) cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete education mode');
    }
  };

  const filteredEducationModes = useMemo(() => {
    return educationModes.filter((m) => m.name.toLowerCase().includes(filterText.toLowerCase().trim()));
  }, [educationModes, filterText]);

  return (
    <PermissionGuard permission="education_mode:view">
      <AppShell>
        <MasterDataLayout>
          <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Education Mode</h1>
                <p className="text-xs text-gray-400">Used across Add Employee, filters &amp; transfers</p>
              </div>
            </div>

            {canAddCurrent && (
              <div className="flex items-center gap-2 py-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Add education mode..."
                  className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEducationMode()}
                />
                <button
                  onClick={handleAddEducationMode}
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
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">{filteredEducationModes.length}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pt-2">
              {fieldsLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading...</div>
              ) : filteredEducationModes.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No education modes found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredEducationModes.map((item, index) => {
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