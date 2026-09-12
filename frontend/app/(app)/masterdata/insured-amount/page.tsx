// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { X, Plus } from 'lucide-react';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import { Select } from '@/components/ui/Select';
// import {
//   useInsuredData,
//   useCreateInsuredMaster,
//   useUpdateInsuredMaster,
//   useDeleteInsuredMaster,
//   useCreateBracket,
//   useUpdateBracket,
//   useDeleteBracket,
// } from '@/features/insuredAmounts/useInsuredAmount';

// export default function InsuredAmountPage() {
//   const [name, setName] = useState('');
//   const [filterText, setFilterText] = useState('');
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState('');

//   const { data } = useInsuredData();
//   const masters = data?.masters || [];
//   const brackets = data?.brackets || [];

//   const createMaster = useCreateInsuredMaster();
//   const updateMaster = useUpdateInsuredMaster();
//   const deleteMaster = useDeleteInsuredMaster();
//   const createBracket = useCreateBracket();
//   const updateBracket = useUpdateBracket();
//   const deleteBracket = useDeleteBracket();

//   const handleAddMaster = async () => {
//     if (!name.trim()) return;
//     await createMaster.mutateAsync(name.trim());
//     setName('');
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (editName.trim()) {
//       await updateMaster.mutateAsync({ id, name: editName.trim() });
//     }
//     setEditingId(null);
//   };

//   const handleAddBracketRow = async () => {
//     if (masters.length === 0) {
//       alert('Please add at least one Insured Amount chip first');
//       return;
//     }
//     const lastBracket = brackets[brackets.length - 1];
//     const newMin = lastBracket ? Number(lastBracket.max_salary || 0) : 0;
//     await createBracket.mutateAsync({
//       min_salary: newMin,
//       max_salary: null,
//       insured_amount_id: masters[0].id,
//     });
//   };

//   const formatCurrency = (val: number | null) => {
//     if (val === null) return '';
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0,
//     }).format(val);
//   };

//   const generateRuleText = (min: number, max: number | null, amountName: string) => {
//     const formattedMin = formatCurrency(min);
//     const cleanAmount = amountName.replace(/,/g, '');
//     const formattedAmount = !isNaN(Number(cleanAmount))
//       ? formatCurrency(Number(cleanAmount))
//       : `₹${amountName}`;

//     if (min === 0 && max !== null) {
//       return `Under ${formatCurrency(max)} → ${formattedAmount}`;
//     }
//     if (max === null) {
//       return `${formattedMin} and above → ${formattedAmount}`;
//     }
//     return `${formattedMin} – under ${formatCurrency(max)} → ${formattedAmount}`;
//   };

//   const filteredMasters = useMemo(() => {
//     return masters.filter((m) =>
//       m.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [masters, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Insured Amount"
//           subtitle="Insured covers by salary bracket - Auto-fills on Add Employee from Gross (PM)"
//           addPlaceholder="Add insured amount..."
//           items={filteredMasters}
//           name={name}
//           onNameChange={setName}
//           onAdd={handleAddMaster}
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
//           onDelete={(id) => deleteMaster.mutate(id)}
//           extraBeforeList={
//             <div className="card cp" style={{ background: 'var(--surface2)', marginBottom: 14 }}>
//               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
//                 <div>
//                   <div className="ct" style={{ marginBottom: 2 }}>Salary brackets → Insured amount</div>
//                   <p style={{ fontSize: 11, color: 'var(--ink4)', margin: 0 }}>
//                     Gross monthly salary (₹). Range is min inclusive → max exclusive (blank max = no upper limit).
//                   </p>
//                 </div>
//                 <button type="button" className="btn btn-sec btn-sm" onClick={handleAddBracketRow}>
//                   <Plus size={12} /> Bracket
//                 </button>
//               </div>

//               <div className="tw" style={{ marginTop: 10 }}>
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Min ₹</th>
//                       <th>Max ₹</th>
//                       <th>Insured Amount</th>
//                       <th>Rule</th>
//                       <th style={{ textAlign: 'right' }}>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {brackets.map((row) => {
//                       const selectedMaster = masters.find((m) => m.id === row.insured_amount_id);
//                       const amountName = selectedMaster ? selectedMaster.name : '';

//                       return (
//                         <BracketRowItem
//                           key={row.id}
//                           row={row}
//                           masters={masters}
//                           amountName={amountName}
//                           onUpdate={(id, payload) => updateBracket.mutate({ id, payload })}
//                           onDelete={(id) => deleteBracket.mutate(id)}
//                           generateRuleText={generateRuleText}
//                         />
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           }
//         />
//       </MasterDataLayout>
//     </AppShell>
//   );
// }

// // Editable Sub-component for individual Bracket Row
// function BracketRowItem({
//   row,
//   masters,
//   amountName,
//   onUpdate,
//   onDelete,
//   generateRuleText,
// }: {
//   row: any;
//   masters: any[];
//   amountName: string;
//   onUpdate: (id: number, payload: any) => void;
//   onDelete: (id: number) => void;
//   generateRuleText: (min: number, max: number | null, amountName: string) => string;
// }) {
//   const [minSalary, setMinSalary] = useState<string>(String(row.min_salary ?? 0));
//   const [maxSalary, setMaxSalary] = useState<string>(
//     row.max_salary === null ? 'No limit' : String(row.max_salary)
//   );

//   const handleMinBlur = () => {
//     const parsedMin = Number(minSalary) || 0;
//     setMinSalary(String(parsedMin));
//     onUpdate(row.id, { min_salary: parsedMin });
//   };

//   const handleMaxBlur = () => {
//     const val = maxSalary.trim().toLowerCase();
//     if (val === '' || val === 'no limit') {
//       setMaxSalary('No limit');
//       onUpdate(row.id, { max_salary: null });
//     } else {
//       const parsedMax = Number(val);
//       if (!isNaN(parsedMax)) {
//         setMaxSalary(String(parsedMax));
//         onUpdate(row.id, { max_salary: parsedMax });
//       } else {
//         setMaxSalary('No limit');
//         onUpdate(row.id, { max_salary: null });
//       }
//     }
//   };

//   return (
//     <tr>
//       <td style={{ minWidth: 90 }}>
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="number" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} onBlur={handleMinBlur} />
//         </div>
//       </td>
//       <td style={{ minWidth: 90 }}>
//         <div className="fg" style={{ margin: 0 }}>
//           <input type="text" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} onBlur={handleMaxBlur} placeholder="No limit" />
//         </div>
//       </td>
//       <td style={{ minWidth: 140 }}>
//         <div className="fg" style={{ margin: 0 }}>
//           <Select
//             value={row.insured_amount_id}
//             onChange={(v) => onUpdate(row.id, { insured_amount_id: Number(v) })}
//             options={masters.map((m) => ({ value: m.id, label: `₹${m.name}` }))}
//           />
//         </div>
//       </td>
//       <td style={{ color: 'var(--ink4)' }}>
//         {generateRuleText(
//           Number(minSalary) || 0,
//           maxSalary === 'No limit' ? null : Number(maxSalary),
//           amountName
//         )}
//       </td>
//       <td style={{ textAlign: 'right' }}>
//         <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(row.id)}>
//           <X size={14} />
//         </button>
//       </td>
//     </tr>
//   );
// }






'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { GripVertical, Pencil, X, Plus, Lock } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import {
  useInsuredData,
  useCreateInsuredMaster,
  useUpdateInsuredMaster,
  useDeleteInsuredMaster,
  useCreateBracket,
  useUpdateBracket,
  useDeleteBracket,
} from '@/features/insuredAmounts/useInsuredAmount';

import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

const FIELD_KEY = 'insured_amount_name';

export default function InsuredAmountPage() {
  const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
  const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('insured_amount');

  const f = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const fCreate = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );

  const fieldPerm = f(FIELD_KEY);
  const canAddCurrent = canCreate('insured_amount') && fCreate(FIELD_KEY).can_edit;
  const canEditCurrent = canEdit('insured_amount') && fieldPerm.can_edit;
  const canDeleteCurrent = canDelete('insured_amount');

  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data } = useInsuredData();
  const masters = data?.masters || [];
  const brackets = data?.brackets || [];

  const createMaster = useCreateInsuredMaster();
  const updateMaster = useUpdateInsuredMaster();
  const deleteMaster = useDeleteInsuredMaster();
  const createBracket = useCreateBracket();
  const updateBracket = useUpdateBracket();
  const deleteBracket = useDeleteBracket();

  const handleAddMaster = async () => {
    if (!name.trim() || !canAddCurrent) return;
    try {
      await createMaster.mutateAsync(name.trim());
      setName('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add insured amount');
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
      await updateMaster.mutateAsync({ id, name: editName.trim() });
      cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
    }
  };

  const handleDeleteMaster = async (id: number) => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete this insured amount?')) return;
    try {
      await deleteMaster.mutateAsync(id);
      if (editingId === id) cancelEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete insured amount');
    }
  };

  const handleAddBracketRow = async () => {
    if (!canEditCurrent) return;
    if (masters.length === 0) {
      showToast('Please add at least one Insured Amount chip first');
      return;
    }
    const lastBracket = brackets[brackets.length - 1];
    const newMin = lastBracket ? Number(lastBracket.max_salary || 0) : 0;
    try {
      await createBracket.mutateAsync({ min_salary: newMin, max_salary: null, insured_amount_id: masters[0].id });
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add bracket');
    }
  };

  const handleUpdateBracket = async (id: number, payload: any) => {
    if (!canEditCurrent) return;
    try {
      await updateBracket.mutateAsync({ id, payload });
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to update bracket');
    }
  };

  const handleDeleteBracket = async (id: number) => {
    if (!canDeleteCurrent) return;
    try {
      await deleteBracket.mutateAsync(id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete bracket');
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const generateRuleText = (min: number, max: number | null, amountName: string) => {
    const formattedMin = formatCurrency(min);
    const cleanAmount = amountName.replace(/,/g, '');
    const formattedAmount = !isNaN(Number(cleanAmount)) ? formatCurrency(Number(cleanAmount)) : `₹${amountName}`;
    if (min === 0 && max !== null) return `Under ${formatCurrency(max)} → ${formattedAmount}`;
    if (max === null) return `${formattedMin} and above → ${formattedAmount}`;
    return `${formattedMin} – under ${formatCurrency(max)} → ${formattedAmount}`;
  };

  const filteredMasters = useMemo(() => {
    return masters.filter((m) => m.name.toLowerCase().includes(filterText.toLowerCase().trim()));
  }, [masters, filterText]);

  return (
    <PermissionGuard permission="insured_amount:view">
      <AppShell>
        <MasterDataLayout>
          <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Insured Amount</h1>
                <p className="text-xs text-gray-400">Insured covers by salary bracket - Auto-fills on Add Employee from Gross (PM)</p>
              </div>
            </div>

            {canAddCurrent && (
              <div className="flex items-center gap-2 py-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Add insured amount..."
                  className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
                />
                <button
                  onClick={handleAddMaster}
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
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">{filteredMasters.length}</span>
            </div>

            <div className="pt-2">
              {fieldsLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading...</div>
              ) : filteredMasters.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No insured amounts found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredMasters.map((item, index) => {
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
                            <button onClick={() => handleDeleteMaster(item.id)} className="text-gray-400 hover:text-red-600" title="Delete">
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

            {/* Salary bracket editor — rides on the same master field's
                permission (can_edit/can_delete); no separate field
                permission exists for min_salary/max_salary/insured_amount_id
                since these are relational/numeric config, not a form field. */}
            {fieldPerm.can_view && (
              <div className="card cp" style={{ background: 'var(--surface2)', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div className="ct" style={{ marginBottom: 2 }}>Salary brackets → Insured amount</div>
                    <p style={{ fontSize: 11, color: 'var(--ink4)', margin: 0 }}>
                      Gross monthly salary (₹). Range is min inclusive → max exclusive (blank max = no upper limit).
                    </p>
                  </div>
                  {canEditCurrent && (
                    <button type="button" className="btn btn-sec btn-sm" onClick={handleAddBracketRow}>
                      <Plus size={12} /> Bracket
                    </button>
                  )}
                </div>

                <div className="tw" style={{ marginTop: 10 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Min ₹</th>
                        <th>Max ₹</th>
                        <th>Insured Amount</th>
                        <th>Rule</th>
                        {(canEditCurrent || canDeleteCurrent) && <th style={{ textAlign: 'right' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {brackets.map((row) => {
                        const selectedMaster = masters.find((m) => m.id === row.insured_amount_id);
                        const amountName = selectedMaster ? selectedMaster.name : '';

                        return (
                          <BracketRowItem
                            key={row.id}
                            row={row}
                            masters={masters}
                            amountName={amountName}
                            canEdit={canEditCurrent}
                            canDelete={canDeleteCurrent}
                            onUpdate={handleUpdateBracket}
                            onDelete={handleDeleteBracket}
                            generateRuleText={generateRuleText}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </MasterDataLayout>
      </AppShell>
    </PermissionGuard>
  );
}

// Editable Sub-component for individual Bracket Row — plain HTML table, no
// PrimeReact, so this has never had the re-render bug seen elsewhere.
function BracketRowItem({
  row, masters, amountName, canEdit, canDelete, onUpdate, onDelete, generateRuleText,
}: {
  row: any;
  masters: any[];
  amountName: string;
  canEdit: boolean;
  canDelete: boolean;
  onUpdate: (id: number, payload: any) => void;
  onDelete: (id: number) => void;
  generateRuleText: (min: number, max: number | null, amountName: string) => string;
}) {
  const [minSalary, setMinSalary] = useState<string>(String(row.min_salary ?? 0));
  const [maxSalary, setMaxSalary] = useState<string>(row.max_salary === null ? 'No limit' : String(row.max_salary));

  const handleMinBlur = () => {
    if (!canEdit) return;
    const parsedMin = Number(minSalary) || 0;
    setMinSalary(String(parsedMin));
    onUpdate(row.id, { min_salary: parsedMin });
  };

  const handleMaxBlur = () => {
    if (!canEdit) return;
    const val = maxSalary.trim().toLowerCase();
    if (val === '' || val === 'no limit') {
      setMaxSalary('No limit');
      onUpdate(row.id, { max_salary: null });
    } else {
      const parsedMax = Number(val);
      if (!isNaN(parsedMax)) {
        setMaxSalary(String(parsedMax));
        onUpdate(row.id, { max_salary: parsedMax });
      } else {
        setMaxSalary('No limit');
        onUpdate(row.id, { max_salary: null });
      }
    }
  };

  return (
    <tr>
      <td style={{ minWidth: 90 }}>
        <div className="fg" style={{ margin: 0 }}>
          <input type="number" value={minSalary} disabled={!canEdit} onChange={(e) => setMinSalary(e.target.value)} onBlur={handleMinBlur} />
        </div>
      </td>
      <td style={{ minWidth: 90 }}>
        <div className="fg" style={{ margin: 0 }}>
          <input type="text" value={maxSalary} disabled={!canEdit} onChange={(e) => setMaxSalary(e.target.value)} onBlur={handleMaxBlur} placeholder="No limit" />
        </div>
      </td>
      <td style={{ minWidth: 140 }}>
        <div className="fg" style={{ margin: 0 }}>
          <Select
            value={row.insured_amount_id}
            onChange={(v) => canEdit && onUpdate(row.id, { insured_amount_id: Number(v) })}
            options={masters.map((m) => ({ value: m.id, label: `₹${m.name}` }))}
            disabled={!canEdit}
          />
        </div>
      </td>
      <td style={{ color: 'var(--ink4)' }}>
        {generateRuleText(Number(minSalary) || 0, maxSalary === 'No limit' ? null : Number(maxSalary), amountName)}
      </td>
      {(canEdit || canDelete) && (
        <td style={{ textAlign: 'right' }}>
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(row.id)}>
              <X size={14} />
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
