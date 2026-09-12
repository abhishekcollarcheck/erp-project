// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import {
//   useBloodGroupData,
//   useCreateBloodGroup,
//   useUpdateBloodGroup,
//   useDeleteBloodGroup,
// } from '@/features/bloodGroup/hooks/useBloodGroup';

// export default function BloodGroupPage() {
//   const [name, setName] = useState('');
//   const [filterText, setFilterText] = useState('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   const { data: bloodGroups = [] } = useBloodGroupData();

//   const createBloodGroup = useCreateBloodGroup();
//   const updateBloodGroup = useUpdateBloodGroup();
//   const deleteBloodGroup = useDeleteBloodGroup();

//   const handleAddBloodGroup = async () => {
//     if (!name.trim()) return;
//     await createBloodGroup.mutateAsync(name.trim());
//     setName('');
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (editName.trim()) {
//       await updateBloodGroup.mutateAsync({ id, name: editName.trim() });
//     }
//     setEditingId(null);
//   };

//   const filteredBloodGroups = useMemo(() => {
//     return bloodGroups.filter((bg) =>
//       bg.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [bloodGroups, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Blood Group"
//           addPlaceholder="Add blood group..."
//           items={filteredBloodGroups}
//           name={name}
//           onNameChange={setName}
//           onAdd={handleAddBloodGroup}
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
//           onDelete={(id) => deleteBloodGroup.mutate(id)}
//         />
//       </MasterDataLayout>
//     </AppShell>
//   );
// }















'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, GripVertical, Pencil, Check, Lock } from 'lucide-react';
import {
  useBloodGroupData,
  useCreateBloodGroup,
  useUpdateBloodGroup,
  useDeleteBloodGroup,
} from '@/features/bloodGroup/hooks/useBloodGroup';

import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

const FIELD_KEY = 'blood_group_name';

export default function BloodGroupPage() {
  const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
  const { data: fp } = useFieldPermissions('blood_group');

  const f = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const fCreate = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );

  const fieldPerm = f(FIELD_KEY);
  const canAddCurrent = canCreate('blood_group') && fCreate(FIELD_KEY).can_edit;
  const canEditCurrent = canEdit('blood_group') && fieldPerm.can_edit;
  const canDeleteCurrent = canDelete('blood_group');

  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: bloodGroups = [] } = useBloodGroupData();
  const createBloodGroup = useCreateBloodGroup();
  const updateBloodGroup = useUpdateBloodGroup();
  const deleteBloodGroup = useDeleteBloodGroup();

  const handleAddBloodGroup = async () => {
    if (!name.trim() || !canAddCurrent) return;
    try {
      await createBloodGroup.mutateAsync(name.trim());
      setName('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add blood group');
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
      await updateBloodGroup.mutateAsync({ id, name: editName.trim() });
      cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete this blood group?')) return;
    try {
      await deleteBloodGroup.mutateAsync(id);
      if (editingId === id) cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete blood group');
    }
  };

  const filteredBloodGroups = useMemo(() => {
    return bloodGroups.filter((bg) => bg.name.toLowerCase().includes(filterText.toLowerCase().trim()));
  }, [bloodGroups, filterText]);

  return (
    <PermissionGuard permission="blood_group:view">
      <AppShell>
        <MasterDataLayout>
          <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Blood Group</h1>
                <p className="text-xs text-gray-400">
                  Used across Add Employee, filters & transfers
                </p>
              </div>
              <div className="flex items-center gap-4">
                {canDeleteCurrent && (
                  <button className="text-xs font-medium text-red-500 hover:underline">
                    Delete master
                  </button>
                )}
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  AUTO-SAVE ON
                </span>
              </div>
            </div>

            <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              {/* Top Input Row — hidden entirely when the role can't add */}
              {canAddCurrent && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBloodGroup()}
                    placeholder="Add blood group..."
                    className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBloodGroup}
                    className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Filter Bar */}
              <div className="mt-4 flex items-center justify-between">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter..."
                  className="h-8 w-44 rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400"
                />
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                  {filteredBloodGroups.length}
                </span>
              </div>

              {/* Vertical List View */}
              <div className="mt-6 flex flex-col gap-2">
                {filteredBloodGroups.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const mv = maskedView(item.name, fieldPerm);
                  const displayText = mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-blue-500 bg-white px-3 py-2"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                          className="flex-1 text-xs font-semibold outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between rounded-lg border border-transparent px-2 py-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="cursor-grab text-gray-300" />
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                          {index + 1}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs font-bold text-gray-800"
                          onDoubleClick={() => startEdit(item)}
                          data-nocopy={mv.noCopy || undefined}
                          onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
                          onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
                          onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
                        >
                          {displayText}
                          {mv.kind !== 'none' && <Lock size={10} className="text-gray-400" />}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {canEditCurrent && mv.kind === 'none' && (
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {canDeleteCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </MasterDataLayout>
      </AppShell>
    </PermissionGuard>
  );
}
