// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import {
//   useModeOfPaymentData,
//   useCreateModeOfPayment,
//   useUpdateModeOfPayment,
//   useDeleteModeOfPayment,
// } from '@/features/modeofPayment/hooks/useModeOfPayment';

// export default function ModeOfPaymentPage() {
//   const [name, setName] = useState('');
//   const [filterText, setFilterText] = useState('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   const { data: modesOfPayment = [] } = useModeOfPaymentData();

//   const createMode = useCreateModeOfPayment();
//   const updateMode = useUpdateModeOfPayment();
//   const deleteMode = useDeleteModeOfPayment();

//   const handleAddModeOfPayment = async () => {
//     if (!name.trim()) return;
//     await createMode.mutateAsync(name.trim());
//     setName('');
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (editName.trim()) {
//       await updateMode.mutateAsync({ id, name: editName.trim() });
//     }
//     setEditingId(null);
//   };

//   const filteredModes = useMemo(() => {
//     return modesOfPayment.filter((m) =>
//       m.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [modesOfPayment, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Mode of Payment"
//           addPlaceholder="Add mode of payment..."
//           items={filteredModes}
//           name={name}
//           onNameChange={setName}
//           onAdd={handleAddModeOfPayment}
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
//           onDelete={(id) => deleteMode.mutate(id)}
//         />
//       </MasterDataLayout>
//     </AppShell>
//   );
// }




'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import {
  GripVertical,
  Pencil,
  X,
  Lock,
} from 'lucide-react';

import {
  useModeOfPaymentData,
  useCreateModeOfPayment,
  useUpdateModeOfPayment,
  useDeleteModeOfPayment,
} from '@/features/modeofPayment/hooks/useModeOfPayment';

import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';

import {
  useFieldPermissions,
  resolveFieldPerm,
} from '@/features/rbac/hooks/useFieldPermissions';

import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

const MODULE_KEY = 'mode_of_payment';
const FIELD_KEY = 'mode_of_payment_name';

export default function ModeOfPaymentPage() {
  /**
   * ------------------------------------------------------------
   * Permissions
   * ------------------------------------------------------------
   */
  const {
    canCreate,
    canEdit,
    canDelete,
    isSuperAdmin,
  } = usePermission();

  const {
    data: fp,
    isLoading: fieldsLoading,
  } = useFieldPermissions(MODULE_KEY);

  /**
   * Same permission resolver workflow as Banks
   */
  const f = useCallback(
    (key: string) =>
      resolveFieldPerm(fp, key, {
        completionPct: 100,
        bypass: isSuperAdmin,
      }),
    [fp, isSuperAdmin]
  );

  const fCreate = useCallback(
    (key: string) =>
      resolveFieldPerm(fp, key, {
        completionPct: 0,
        bypass: isSuperAdmin,
      }),
    [fp, isSuperAdmin]
  );

  const fieldPerm = f(FIELD_KEY);

  /**
   * Module + field permission
   */
  const canAddCurrent =
    canCreate(MODULE_KEY) &&
    fCreate(FIELD_KEY).can_edit;

  const canEditCurrent =
    canEdit(MODULE_KEY) &&
    fieldPerm.can_edit;

  const canDeleteCurrent =
    canDelete(MODULE_KEY);

  /**
   * ------------------------------------------------------------
   * State
   * ------------------------------------------------------------
   */
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editName, setEditName] = useState('');

  /**
   * ------------------------------------------------------------
   * API hooks
   * ------------------------------------------------------------
   */
  const {
    data: modesOfPayment = [],
  } = useModeOfPaymentData();

  const createMode = useCreateModeOfPayment();
  const updateMode = useUpdateModeOfPayment();
  const deleteMode = useDeleteModeOfPayment();

  /**
   * ------------------------------------------------------------
   * Add
   * ------------------------------------------------------------
   */
  const handleAddModeOfPayment = async () => {
    if (!name.trim() || !canAddCurrent) return;

    try {
      await createMode.mutateAsync(name.trim());

      setName('');
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to add mode of payment'
      );
    }
  };

  /**
   * ------------------------------------------------------------
   * Start Edit
   * ------------------------------------------------------------
   */
  const startEdit = (item: {
    id: number;
    name: string;
  }) => {
    if (!canEditCurrent) return;

    setEditingId(item.id);
    setEditName(item.name);
  };

  /**
   * ------------------------------------------------------------
   * Cancel Edit
   * ------------------------------------------------------------
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  /**
   * ------------------------------------------------------------
   * Save Edit
   * ------------------------------------------------------------
   */
  const handleSaveEdit = async (id: number) => {
    if (!canEditCurrent || !editName.trim()) {
      cancelEdit();
      return;
    }

    try {
      await updateMode.mutateAsync({
        id,
        name: editName.trim(),
      });

      cancelEdit();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to save changes'
      );
    }
  };

  /**
   * ------------------------------------------------------------
   * Delete
   * ------------------------------------------------------------
   */
  const handleDelete = async (id: number) => {
    if (!canDeleteCurrent) return;

    if (
      !confirm(
        'Are you sure you want to delete this mode of payment?'
      )
    ) {
      return;
    }

    try {
      await deleteMode.mutateAsync(id);

      if (editingId === id) {
        cancelEdit();
      }
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete mode of payment'
      );
    }
  };

  /**
   * ------------------------------------------------------------
   * Filter
   * ------------------------------------------------------------
   */
  const filteredModes = useMemo(() => {
    const search = filterText
      .toLowerCase()
      .trim();

    return modesOfPayment.filter((item) =>
      item.name.toLowerCase().includes(search)
    );
  }, [modesOfPayment, filterText]);

  /**
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */
  return (
    <PermissionGuard permission={`${MODULE_KEY}:view`}>
      <AppShell>
        <MasterDataLayout>
          <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">

            {/* ------------------------------------------------
                Header
            ------------------------------------------------ */}
            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  Mode of Payment
                </h1>

                <p className="text-xs text-gray-400">
                  Used across employee and payment related workflows
                </p>
              </div>
            </div>

            {/* ------------------------------------------------
                Add
            ------------------------------------------------ */}
            {canAddCurrent && (
              <div className="flex items-center gap-2 py-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Add mode of payment..."
                  className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddModeOfPayment();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={handleAddModeOfPayment}
                  disabled={createMode.isPending}
                  className="flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMode.isPending
                    ? 'Adding...'
                    : 'Add'}
                </button>
              </div>
            )}

            {/* ------------------------------------------------
                Filter
            ------------------------------------------------ */}
            <div className="flex items-center justify-between py-2">
              <div className="relative w-64">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) =>
                    setFilterText(e.target.value)
                  }
                  placeholder="Filter..."
                  className="h-8 w-full rounded-md border border-gray-200 bg-white pl-3 pr-8 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
                />
              </div>

              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
                {filteredModes.length}
              </span>
            </div>

            {/* ------------------------------------------------
                List
            ------------------------------------------------ */}
            <div className="min-h-0 flex-1 overflow-y-auto pt-2">

              {fieldsLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Loading...
                </div>
              ) : filteredModes.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No modes of payment found.
                </div>
              ) : (
                <div className="space-y-1">

                  {filteredModes.map((item, index) => {
                    const isEditingRow =
                      editingId === item.id;

                    /**
                     * Same masking workflow as Banks
                     */
                    const mv = maskedView(
                      item.name,
                      fieldPerm
                    );

                    const displayText =
                      mv.kind === 'full'
                        ? '••••••••'
                        : mv.kind === 'partial'
                        ? mv.text
                        : item.name;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50/80"
                      >

                        {/* ------------------------------------
                            Left side
                        ------------------------------------ */}
                        <div className="flex flex-1 items-center gap-3">

                          <GripVertical
                            size={14}
                            className="cursor-grab text-gray-300 opacity-60 group-hover:opacity-100"
                          />

                          <span className="min-w-[18px] text-left text-[11px] font-semibold text-gray-300">
                            {index + 1}
                          </span>

                          {/* --------------------------------
                              Edit input
                          -------------------------------- */}
                          {isEditingRow ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) =>
                                setEditName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(item.id);
                                }

                                if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              className="h-7 w-64 rounded border border-blue-400 px-2 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-blue-100"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="flex items-center gap-1 text-xs font-semibold text-gray-800"
                              data-nocopy={
                                mv.noCopy || undefined
                              }
                              onCopy={
                                mv.noCopy
                                  ? (e) =>
                                      e.preventDefault()
                                  : undefined
                              }
                              onCut={
                                mv.noCopy
                                  ? (e) =>
                                      e.preventDefault()
                                  : undefined
                              }
                              onContextMenu={
                                mv.noCopy
                                  ? (e) =>
                                      e.preventDefault()
                                  : undefined
                              }
                            >
                              {displayText}

                              {mv.kind !== 'none' && (
                                <Lock
                                  size={10}
                                  className="text-gray-400"
                                />
                              )}
                            </span>
                          )}
                        </div>

                        {/* ------------------------------------
                            Actions
                        ------------------------------------ */}
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">

                          {isEditingRow ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveEdit(item.id)
                                }
                                disabled={
                                  updateMode.isPending
                                }
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                              >
                                {updateMode.isPending
                                  ? 'Saving...'
                                  : 'Save'}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            canEditCurrent &&
                            mv.kind === 'none' && (
                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(item)
                                }
                                className="text-gray-400 hover:text-gray-600"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                            )
                          )}

                          {canDeleteCurrent && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(item.id)
                              }
                              disabled={
                                deleteMode.isPending
                              }
                              className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
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