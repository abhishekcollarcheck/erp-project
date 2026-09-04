// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { X, GripVertical, Pencil, Check, Plus } from 'lucide-react';
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
//     if (masters.length === 0) return alert('Please add at least one Insured Amount chip first');
//     const lastBracket = brackets[brackets.length - 1];
//     const newMin = lastBracket ? Number(lastBracket.max_salary || 0) : 0;
//     await createBracket.mutateAsync({
//       min_salary: newMin,
//       max_salary: newMin + 25000,
//       insured_amount_id: masters[0].id,
//     });
//   };

//   const formatCurrency = (val: number | null) => {
//     if (val === null) return '';
//     return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
//   };

//   const generateRuleText = (min: number, max: number | null, amountName: string) => {
//     const formattedMin = formatCurrency(min);
//     const formattedAmount = formatCurrency(Number(amountName.replace(/,/g, ''))) || `₹${amountName}`;
    
//     if (min === 0 && max) {
//       return `Under ${formatCurrency(max)} → ${formattedAmount}`;
//     }
//     if (max === null) {
//       return `${formattedMin} and above → ${formattedAmount}`;
//     }
//     return `${formattedMin} – under ${formatCurrency(max)} → ${formattedAmount}`;
//   };

//   const filteredMasters = useMemo(() => {
//     return masters.filter((m) => m.name.toLowerCase().includes(filterText.toLowerCase().trim()));
//   }, [masters, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
//           {/* Header */}
//           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-gray-900">Insured Amount</h1>
//               <p className="text-xs text-gray-400">Insured covers by salary bracket - Auto-fills on Add Employee from Gross (PM)</p>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="text-xs font-medium text-red-500 hover:underline">Delete master</button>
//               <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">AUTO-SAVE ON</span>
//             </div>
//           </div>

//           <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
//             {/* Input Row */}
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
//                 placeholder="Add insured amount..."
//                 className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500"
//               />
//               <button
//                 type="button"
//                 onClick={handleAddMaster}
//                 className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>

//             {/* Filter Input */}
//             <div className="mt-4 flex items-center justify-between">
//               <input
//                 type="text"
//                 value={filterText}
//                 onChange={(e) => setFilterText(e.target.value)}
//                 placeholder="Filter..."
//                 className="h-8 w-44 rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400"
//               />
//               <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
//                 {filteredMasters.length}
//               </span>
//             </div>

//             {/* Salary Brackets Box */}
//             <div className="mt-6 rounded-xl border border-gray-100 bg-slate-50/50 p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-xs font-bold text-gray-800">Salary brackets → Insured amount</h3>
//                   <p className="text-[11px] text-gray-400">Gross monthly salary (₹). Range is min inclusive → max exclusive (blank max = no upper limit).</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={handleAddBracketRow}
//                   className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs"
//                 >
//                   <Plus size={12} /> Bracket
//                 </button>
//               </div>

//               {/* Table Column Headers */}
//               <div className="mt-4 grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
//                 <div className="col-span-2">MIN ₹</div>
//                 <div className="col-span-2">MAX ₹</div>
//                 <div className="col-span-3">INSURED AMOUNT</div>
//                 <div className="col-span-4">RULE</div>
//                 <div className="col-span-1 text-right">ACTION</div>
//               </div>

//               {/* Table Rows */}
//               <div className="mt-2 space-y-2">
//                 {brackets.map((row) => {
//                   const selectedMaster = masters.find((m) => m.id === row.insured_amount_id);
//                   const amountName = selectedMaster ? selectedMaster.name : '';

//                   return (
//                     <div key={row.id} className="grid grid-cols-12 items-center gap-3 text-xs">
//                       <div className="col-span-2">
//                         <input
//                           type="number"
//                           value={row.min_salary}
//                           onChange={(e) => updateBracket.mutate({ id: row.id, payload: { min_salary: Number(e.target.value) } })}
//                           className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 outline-none focus:border-blue-500"
//                         />
//                       </div>
//                       <div className="col-span-2">
//                         <input
//                           type="text"
//                           value={row.max_salary === null ? 'No limit' : row.max_salary}
//                           onChange={(e) => {
//                             const val = e.target.value;
//                             const parsed = val.toLowerCase() === 'no limit' || val === '' ? null : Number(val);
//                             updateBracket.mutate({ id: row.id, payload: { max_salary: parsed } });
//                           }}
//                           className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 outline-none focus:border-blue-500"
//                         />
//                       </div>
//                       <div className="col-span-3">
//                         <select
//                           value={row.insured_amount_id}
//                           onChange={(e) => updateBracket.mutate({ id: row.id, payload: { insured_amount_id: Number(e.target.value) } })}
//                           className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-800 outline-none focus:border-blue-500"
//                         >
//                           {masters.map((m) => (
//                             <option key={m.id} value={m.id}>
//                               ₹{m.name}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                       <div className="col-span-4 text-xs font-medium text-gray-400">
//                         {generateRuleText(row.min_salary, row.max_salary, amountName)}
//                       </div>
//                       <div className="col-span-1 text-right">
//                         <button
//                           type="button"
//                           onClick={() => deleteBracket.mutate(row.id)}
//                           className="text-gray-400 hover:text-red-500"
//                         >
//                           <X size={14} />
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Item Chips */}
//             <div className="mt-6 flex flex-wrap items-center gap-2.5">
//               {filteredMasters.map((item, index) => {
//                 const isEditing = editingId === item.id;
//                 if (isEditing) {
//                   return (
//                     <div key={item.id} className="flex items-center gap-2 rounded-md border border-blue-500 bg-white px-3 py-1">
//                       <input
//                         type="text"
//                         value={editName}
//                         onChange={(e) => setEditName(e.target.value)}
//                         className="text-xs font-semibold outline-none"
//                         autoFocus
//                       />
//                       <button type="button" onClick={() => handleSaveEdit(item.id)} className="text-green-600"><Check size={14} /></button>
//                       <button type="button" onClick={() => setEditingId(null)} className="text-gray-400"><X size={14} /></button>
//                     </div>
//                   );
//                 }
//                 return (
//                   <div key={item.id} className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800">
//                     <GripVertical size={14} className="cursor-grab text-gray-300" />
//                     <span onDoubleClick={() => { setEditingId(item.id); setEditName(item.name); }}>{item.name}</span>
//                     <button type="button" onClick={() => { setEditingId(item.id); setEditName(item.name); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
//                       <Pencil size={11} />
//                     </button>
//                     <button type="button" onClick={() => deleteMaster.mutate(item.id)} className="text-gray-400 hover:text-red-500">
//                       <X size={13} />
//                     </button>
//                   </div>
//                 );
//               })}
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
import { X, GripVertical, Pencil, Check, Plus } from 'lucide-react';
import {
  useInsuredData,
  useCreateInsuredMaster,
  useUpdateInsuredMaster,
  useDeleteInsuredMaster,
  useCreateBracket,
  useUpdateBracket,
  useDeleteBracket,
} from '@/features/insuredAmounts/useInsuredAmount';

export default function InsuredAmountPage() {
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
    if (!name.trim()) return;
    await createMaster.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateMaster.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleAddBracketRow = async () => {
    if (masters.length === 0) {
      alert('Please add at least one Insured Amount chip first');
      return;
    }
    const lastBracket = brackets[brackets.length - 1];
    const newMin = lastBracket ? Number(lastBracket.max_salary || 0) : 0;
    await createBracket.mutateAsync({
      min_salary: newMin,
      max_salary: null,
      insured_amount_id: masters[0].id,
    });
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const generateRuleText = (min: number, max: number | null, amountName: string) => {
    const formattedMin = formatCurrency(min);
    const cleanAmount = amountName.replace(/,/g, '');
    const formattedAmount = !isNaN(Number(cleanAmount))
      ? formatCurrency(Number(cleanAmount))
      : `₹${amountName}`;

    if (min === 0 && max !== null) {
      return `Under ${formatCurrency(max)} → ${formattedAmount}`;
    }
    if (max === null) {
      return `${formattedMin} and above → ${formattedAmount}`;
    }
    return `${formattedMin} – under ${formatCurrency(max)} → ${formattedAmount}`;
  };

  const filteredMasters = useMemo(() => {
    return masters.filter((m) =>
      m.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [masters, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Insured Amount</h1>
              <p className="text-xs text-gray-400">
                Insured covers by salary bracket - Auto-fills on Add Employee from Gross (PM)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-xs font-medium text-red-500 hover:underline">
                Delete master
              </button>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                AUTO-SAVE ON
              </span>
            </div>
          </div>

          <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            {/* Top Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
                placeholder="Add insured amount..."
                className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMaster}
                className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>

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
                {filteredMasters.length}
              </span>
            </div>

            {/* Salary Brackets Box */}
            <div className="mt-6 rounded-xl border border-gray-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-800">Salary brackets → Insured amount</h3>
                  <p className="text-[11px] text-gray-400">
                    Gross monthly salary (₹). Range is min inclusive → max exclusive (blank max = no upper limit).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBracketRow}
                  className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs"
                >
                  <Plus size={12} /> Bracket
                </button>
              </div>

              {/* Table Column Headers */}
              <div className="mt-4 grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <div className="col-span-2">MIN ₹</div>
                <div className="col-span-2">MAX ₹</div>
                <div className="col-span-3">INSURED AMOUNT</div>
                <div className="col-span-4">RULE</div>
                <div className="col-span-1 text-right">ACTION</div>
              </div>

              {/* Table Rows */}
              <div className="mt-2 space-y-2">
                {brackets.map((row) => {
                  const selectedMaster = masters.find((m) => m.id === row.insured_amount_id);
                  const amountName = selectedMaster ? selectedMaster.name : '';

                  return (
                    <BracketRowItem
                      key={row.id}
                      row={row}
                      masters={masters}
                      amountName={amountName}
                      onUpdate={(id, payload) => updateBracket.mutate({ id, payload })}
                      onDelete={(id) => deleteBracket.mutate(id)}
                      generateRuleText={generateRuleText}
                    />
                  );
                })}
              </div>
            </div>

            {/* Chips List */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {filteredMasters.map((item) => {
                const isEditing = editingId === item.id;
                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-md border border-blue-500 bg-white px-3 py-1"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xs font-semibold outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="text-green-600"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.id}
                    className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800"
                  >
                    <GripVertical size={14} className="cursor-grab text-gray-300" />
                    <span
                      onDoubleClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMaster.mutate(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}

// Editable Sub-component for individual Bracket Row
function BracketRowItem({
  row,
  masters,
  amountName,
  onUpdate,
  onDelete,
  generateRuleText,
}: {
  row: any;
  masters: any[];
  amountName: string;
  onUpdate: (id: number, payload: any) => void;
  onDelete: (id: number) => void;
  generateRuleText: (min: number, max: number | null, amountName: string) => string;
}) {
  const [minSalary, setMinSalary] = useState<string>(String(row.min_salary ?? 0));
  const [maxSalary, setMaxSalary] = useState<string>(
    row.max_salary === null ? 'No limit' : String(row.max_salary)
  );

  const handleMinBlur = () => {
    const parsedMin = Number(minSalary) || 0;
    setMinSalary(String(parsedMin));
    onUpdate(row.id, { min_salary: parsedMin });
  };

  const handleMaxBlur = () => {
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
    <div className="grid grid-cols-12 items-center gap-3 text-xs">
      {/* Editable MIN Input */}
      <div className="col-span-2">
        <input
          type="number"
          value={minSalary}
          onChange={(e) => setMinSalary(e.target.value)}
          onBlur={handleMinBlur}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 outline-none focus:border-blue-500"
        />
      </div>

      {/* Editable MAX Input */}
      <div className="col-span-2">
        <input
          type="text"
          value={maxSalary}
          onChange={(e) => setMaxSalary(e.target.value)}
          onBlur={handleMaxBlur}
          placeholder="No limit"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 outline-none focus:border-blue-500"
        />
      </div>

      {/* Select Insured Amount Dropdown */}
      <div className="col-span-3">
        <select
          value={row.insured_amount_id}
          onChange={(e) => onUpdate(row.id, { insured_amount_id: Number(e.target.value) })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-800 outline-none focus:border-blue-500"
        >
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              ₹{m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Rule Text Preview */}
      <div className="col-span-4 text-xs font-medium text-gray-400">
        {generateRuleText(
          Number(minSalary) || 0,
          maxSalary === 'No limit' ? null : Number(maxSalary),
          amountName
        )}
      </div>

      {/* Delete Action Button */}
      <div className="col-span-1 text-right">
        <button
          type="button"
          onClick={() => onDelete(row.id)}
          className="text-gray-400 hover:text-red-500"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}