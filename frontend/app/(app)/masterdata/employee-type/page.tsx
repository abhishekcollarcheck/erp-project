// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { X, GripVertical } from 'lucide-react';
// // import { useEmployeeTypes } from '@/features/employee-type/hooks/useEmployeeType';
// import {
//   useEmployeeTypes,
//   useCreateEmployeeType,
//   useDeleteEmployeeType,
// } from '../../../../features/employee-type/hooks/useEmployeeType';

// export default function EmployeeTypesPage() {
//   const [name, setName] = useState('');
//   const [filterText, setFilterText] = useState('');

//   const { data: types = [], isLoading } = useEmployeeTypes();
//   const createType = useCreateEmployeeType();
//   const deleteType = useDeleteEmployeeType();

//   const handleAdd = async () => {
//     if (!name.trim()) return;
//     await createType.mutateAsync(name.trim());
//     setName('');
//   };

//   const handleDelete = async (id: number) => {
//     if (confirm('Are you sure you want to delete this employee type?')) {
//       await deleteType.mutateAsync(id);
//     }
//   };

//   const filteredTypes = useMemo(() => {
//     return (types || []).filter((t) =>
//       t.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [types, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
//           {/* Top Header */}
//           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-gray-900">
//                 Employee Type
//               </h1>
//               <p className="text-xs text-gray-400">
//                 Used across Add Employee, filters & transfers
//               </p>
//             </div>
//             <div className="flex items-center gap-4">
//               <button
//                 type="button"
//                 className="text-xs font-semibold text-red-500 hover:text-red-700"
//               >
//                 Delete master
//               </button>
//               <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
//                 AUTO-SAVE ON
//               </span>
//             </div>
//           </div>

//           {/* Master Form Card */}
//           <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
//             {/* Input & Add Button */}
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
//                 placeholder="Add employee type..."
//                 className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//               <button
//                 type="button"
//                 onClick={handleAdd}
//                 className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
//               >
//                 Add
//               </button>
//             </div>

//             {/* Filter & Item Counter Row */}
//             <div className="mt-4 flex items-center justify-between">
//               <input
//                 type="text"
//                 value={filterText}
//                 onChange={(e) => setFilterText(e.target.value)}
//                 placeholder="Filter..."
//                 className="h-8 w-44 rounded-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400 focus:border-blue-400"
//               />
//               <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
//                 {filteredTypes.length}
//               </span>
//             </div>

//             {/* Employee Type Tag Pills */}
//             <div className="mt-4 flex flex-wrap gap-2.5">
//               {isLoading ? (
//                 <span className="text-xs text-gray-400">Loading...</span>
//               ) : filteredTypes.length === 0 ? (
//                 <span className="text-xs text-gray-400">No types found</span>
//               ) : (
//                 filteredTypes.map((type) => (
//                   <div
//                     key={type.id}
//                     className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 transition-shadow hover:shadow-xs"
//                   >
//                     <GripVertical size={14} className="cursor-grab text-gray-300" />
//                     <span>{type.name}</span>
//                     <button
//                       type="button"
//                       onClick={() => handleDelete(type.id)}
//                       className="ml-0.5 text-gray-400 hover:text-red-500"
//                     >
//                       <X size={13} />
//                     </button>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       </MasterDataLayout>
//     </AppShell>
//   );
// }




'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, GripVertical, Pencil, Check } from 'lucide-react';
import {
  useEmployeeTypes,
  useCreateEmployeeType,
  useUpdateEmployeeType,
  useDeleteEmployeeType,
} from '@/features/employee-type/hooks/useEmployeeType';
import { EmployeeType } from '@/services/api/employeeTypeService';
// import {EmployeeTyhpe}

export default function EmployeeTypesPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: types = [], isLoading } = useEmployeeTypes();
  const createType = useCreateEmployeeType();
  const updateType = useUpdateEmployeeType();
  const deleteType = useDeleteEmployeeType();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createType.mutateAsync(name.trim());
    setName('');
  };

  const handleStartEdit = (type: EmployeeType) => {
    setEditingId(type.id);
    setEditName(type.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    await updateType.mutateAsync({
      id,
      data: { name: editName.trim() },
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this employee type?')) {
      await deleteType.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredTypes = useMemo(() => {
    return (types || []).filter((t) =>
      t.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [types, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Employee Type
              </h1>
              <p className="text-xs text-gray-400">
                Used across Add Employee, filters & transfers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-xs font-semibold text-red-500 hover:text-red-700"
              >
                Delete master
              </button>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                AUTO-SAVE ON
              </span>
            </div>
          </div>

          {/* Master Form Card */}
          <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            {/* Top Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Add employee type..."
                className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              >
                Add
              </button>
            </div>

            {/* Filter & Counter Row */}
            <div className="mt-4 flex items-center justify-between">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="h-8 w-44 rounded-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                {filteredTypes.length}
              </span>
            </div>

            {/* Dynamic Container: Pills by default, expands to full-width input when editing */}
            <div className="mt-4 flex flex-wrap gap-2.5">
              {isLoading ? (
                <span className="text-xs text-gray-400">Loading...</span>
              ) : filteredTypes.length === 0 ? (
                <span className="text-xs text-gray-400">No types found</span>
              ) : (
                filteredTypes.map((type, index) => {
                  const isEditingThis = editingId === type.id;

                  // EDITING STATE -> Full-width Input Bar matching image
                  if (isEditingThis) {
                    return (
                      <div
                        key={type.id}
                        className="flex w-full items-center gap-3 py-1 text-xs"
                      >
                        <div className="flex items-center gap-1 text-gray-400">
                          <GripVertical size={14} className="cursor-grab text-gray-300" />
                          <span className="w-4 text-center font-semibold text-gray-500">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex flex-1 items-center justify-between rounded-md border border-blue-500 bg-white px-3 py-1.5 ring-1 ring-blue-500">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(type.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            autoComplete="off"
                            className="w-full bg-transparent font-medium text-gray-900 outline-none"
                          />
                          <div className="flex items-center gap-2 pl-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(type.id)}
                              className="text-gray-400 hover:text-green-600"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // DEFAULT STATE -> Tag / Pill layout (same as before)
                  return (
                    <div
                      key={type.id}
                      className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 transition-shadow hover:shadow-xs"
                    >
                      <GripVertical size={14} className="cursor-grab text-gray-300" />
                      <span
                        onDoubleClick={() => handleStartEdit(type)}
                        className="cursor-pointer"
                        title="Double click to edit"
                      >
                        {type.name}
                      </span>
                      <div className="ml-0.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(type)}
                          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(type.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}