// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { Pencil, X, Plus } from 'lucide-react';
// import {
//   useWeeklyOffs,
//   useCreateWeeklyOff,
//   useUpdateWeeklyOff,
//   useDeleteWeeklyOff,
// } from '@/features/weeklyoff/hooks/useWeeklyoff';
// // import { WeekDay } from '@/services/api/weeklyOffService';
// // import { useCreateWeeklyOff } from '@/features/weeklyoff/hooks/useWeeklyoff';
// import { WeekDay, NthRule, WeeklyOffPreset } from '@/services/api/weeklyOffService';

// const DAYS: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// const FULL_DAY_NAMES: Record<WeekDay, string> = {
//   Sun: 'Sunday',
//   Mon: 'Monday',
//   Tue: 'Tuesday',
//   Wed: 'Wednesday',
//   Thu: 'Thursday',
//   Fri: 'Friday',
//   Sat: 'Saturday',
// };

// export default function WeeklyOffsPage() {
//   const [filterText, setFilterText] = useState('');

//   // Creation State
//   const [name, setName] = useState('');
//   const [alwaysOff, setAlwaysOff] = useState<WeekDay[]>([]);
//   const [nthRules, setNthRules] = useState<NthRule[]>([]);

//   // Editing State
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // Queries & Mutations
//   const { data: presets = [], isLoading } = useWeeklyOffs();
//   const createPreset = useCreateWeeklyOff();
//   const updatePreset = useUpdateWeeklyOff();
//   const deletePreset = useDeleteWeeklyOff();

//   const handleToggleAlwaysOff = (day: WeekDay) => {
//     setAlwaysOff((prev) =>
//       prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
//     );
//   };

//   const handleAddNthRule = () => {
//     setNthRules((prev) => [...prev, { weeks: [2, 4], day: 'Sat' }]);
//   };

//   const handleRemoveNthRule = (index: number) => {
//     setNthRules((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleUpdateNthRuleDay = (index: number, day: WeekDay) => {
//     setNthRules((prev) => {
//       const updated = [...prev];
//       updated[index].day = day;
//       return updated;
//     });
//   };

//   const handleToggleNthRuleWeek = (ruleIndex: number, weekNum: number) => {
//     setNthRules((prev) => {
//       const updated = [...prev];
//       const targetWeeks = updated[ruleIndex].weeks;
//       if (targetWeeks.includes(weekNum)) {
//         updated[ruleIndex].weeks = targetWeeks.filter((w) => w !== weekNum);
//       } else {
//         updated[ruleIndex].weeks = [...targetWeeks, weekNum].sort();
//       }
//       return updated;
//     });
//   };

//   const handleSavePreset = async () => {
//     if (!name.trim()) return;

//     await createPreset.mutateAsync({
//       name: name.trim(),
//       always_off: alwaysOff,
//       nth_off_rules: nthRules,
//     });

//     handleResetForm();
//   };

//   const handleResetForm = () => {
//     setName('');
//     setAlwaysOff([]);
//     setNthRules([]);
//   };

//   const handleDelete = async (id: number) => {
//     if (confirm('Are you sure you want to delete this preset?')) {
//       await deletePreset.mutateAsync(id);
//     }
//   };

//   const formatAlwaysOff = (days: WeekDay[]) => {
//     if (!days || days.length === 0) return '-';
//     return days.map((d) => FULL_DAY_NAMES[d] || d).join(', ');
//   };

//   const formatNthRules = (rules: NthRule[]) => {
//     if (!rules || rules.length === 0) return '-';
//     return rules
//       .map((r) => {
//         const ordinalString = r.weeks
//           .map((w) => {
//             if (w === 1) return '1st';
//             if (w === 2) return '2nd';
//             if (w === 3) return '3rd';
//             return `${w}th`;
//           })
//           .join(' & ');
//         return `${ordinalString} ${r.day}`;
//       })
//       .join(', ');
//   };

//   const filteredPresets = useMemo(() => {
//     return presets.filter((p) =>
//       p.name.toLowerCase().includes(filterText.toLowerCase().trim())
//     );
//   }, [presets, filterText]);

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
//           {/* Header */}
//           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
//             <div>
//               <h1 className="text-xl font-bold tracking-tight text-gray-900">Weekly Offs</h1>
//               <p className="text-xs text-gray-400">
//                 Presets for any weekday combo + nth Saturday · Site defaults on Locations → Site
//               </p>
//             </div>
//             <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
//               AUTO-SAVE ON
//             </span>
//           </div>

//           {/* New Preset Form Card */}
//           <div className="my-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
//             <h2 className="mb-3 text-xs font-bold text-gray-800">New weekly off preset</h2>

//             {/* Preset Name Input */}
//             <div className="mb-4">
//               <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                 PRESET NAME
//               </label>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="e.g. Sunday + 4th Saturday"
//                 className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//             </div>

//             {/* Weekdays Always Off */}
//             <div className="mb-4">
//               <label className="mb-1.5 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                 WEEKDAYS ALWAYS OFF (EVERY WEEK)
//               </label>
//               <div className="flex gap-2">
//                 {DAYS.map((day) => {
//                   const isChecked = alwaysOff.includes(day);
//                   return (
//                     <label
//                       key={day}
//                       className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs cursor-pointer select-none transition-all ${
//                         isChecked
//                           ? 'border-blue-500 bg-blue-50/20 font-medium text-gray-900'
//                           : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
//                       }`}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={isChecked}
//                         onChange={() => handleToggleAlwaysOff(day)}
//                         className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span>{day}</span>
//                     </label>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Nth-Of-Month Rules Section */}
//             <div className="mb-4">
//               <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                 NTH-OF-MONTH OFFS{' '}
//                 <span className="font-normal italic text-gray-300">
//                   (any weekday — e.g. 2nd & 4th Sunday)
//                 </span>
//               </label>

//               {/* Dynamic Rules List */}
//               {nthRules.map((rule, idx) => (
//                 <div key={idx} className="mb-2 flex items-center gap-3 rounded-md bg-gray-50 p-2">
//                   <div className="flex gap-1">
//                     {[1, 2, 3, 4, 5].map((w) => (
//                       <button
//                         key={w}
//                         type="button"
//                         onClick={() => handleToggleNthRuleWeek(idx, w)}
//                         className={`h-7 w-7 rounded text-xs font-semibold ${
//                           rule.weeks.includes(w)
//                             ? 'bg-blue-600 text-white'
//                             : 'bg-white text-gray-600 border border-gray-200'
//                         }`}
//                       >
//                         {w}
//                       </button>
//                     ))}
//                   </div>

//                   <select
//                     value={rule.day}
//                     onChange={(e) => handleUpdateNthRuleDay(idx, e.target.value as WeekDay)}
//                     className="h-7 rounded border border-gray-200 bg-white px-2 text-xs outline-none"
//                   >
//                     {DAYS.map((d) => (
//                       <option key={d} value={d}>
//                         {d}
//                       </option>
//                     ))}
//                   </select>

//                   <button
//                     type="button"
//                     onClick={() => handleRemoveNthRule(idx)}
//                     className="text-gray-400 hover:text-red-500"
//                   >
//                     <X size={14} />
//                   </button>
//                 </div>
//               ))}

//               <button
//                 type="button"
//                 onClick={handleAddNthRule}
//                 className="mt-1 flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-xs hover:bg-gray-50"
//               >
//                 <Plus size={12} /> Add nth rule
//               </button>
//             </div>

//             {/* Submit Action Button */}
//             <div className="flex justify-end pt-2">
//               <button
//                 type="button"
//                 onClick={handleSavePreset}
//                 className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800"
//               >
//                 Save Preset
//               </button>
//             </div>
//           </div>

//           {/* Presets Table Filters */}
//           <div className="flex items-center justify-between py-2">
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => setFilterText(e.target.value)}
//               placeholder="Filter presets..."
//               className="h-8 w-48 rounded-md border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-300 focus:border-blue-400"
//             />
//             <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
//               {filteredPresets.length} presets
//             </span>
//           </div>

//           {/* Presets Data Table */}
//           <div className="min-h-0 flex-1 overflow-y-auto">
//             <table className="w-full text-left text-xs border-collapse">
//               <thead>
//                 <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                   <th className="py-3 px-2 w-1/4">PRESET</th>
//                   <th className="py-3 px-2 w-1/3">ALWAYS OFF</th>
//                   <th className="py-3 px-2">NTH-OF-MONTH</th>
//                   <th className="py-3 px-2 text-right">ACTIONS</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {isLoading ? (
//                   <tr>
//                     <td colSpan={4} className="py-8 text-center text-gray-400">
//                       Loading presets...
//                     </td>
//                   </tr>
//                 ) : filteredPresets.length === 0 ? (
//                   <tr>
//                     <td colSpan={4} className="py-8 text-center text-gray-400">
//                       No presets found.
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredPresets.map((preset) => (
//                     <tr key={preset.id} className="group hover:bg-gray-50/60">
//                       <td className="py-3.5 px-2 font-bold text-gray-900">{preset.name}</td>
//                       <td className="py-3.5 px-2 text-gray-600">
//                         {formatAlwaysOff(preset.always_off)}
//                       </td>
//                       <td className="py-3.5 px-2 text-gray-600">
//                         {formatNthRules(preset.nth_off_rules)}
//                       </td>
//                       <td className="py-3.5 px-2 text-right">
//                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                           <button className="text-gray-400 hover:text-gray-600">
//                             <Pencil size={13} />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(preset.id)}
//                             className="text-gray-400 hover:text-red-500"
//                           >
//                             <X size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
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
import { Pencil, X, Plus } from 'lucide-react';
import {
  useWeeklyOffs,
  useCreateWeeklyOff,
  useUpdateWeeklyOff,
  useDeleteWeeklyOff,
} from '@/features/weeklyoff/hooks/useWeeklyoff';
import { WeekDay, NthRule, WeeklyOffPreset } from '@/services/api/weeklyOffService';

const DAYS: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES: Record<WeekDay, string> = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
};

// Safe JSON/Array Parser Guard
const parseArrayData = <T,>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function WeeklyOffsPage() {
  const [filterText, setFilterText] = useState('');

  // Form & Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [alwaysOff, setAlwaysOff] = useState<WeekDay[]>([]);
  const [nthRules, setNthRules] = useState<NthRule[]>([]);

  // React Query Hooks
  const { data: rawPresets = [], isLoading } = useWeeklyOffs();
  const createPreset = useCreateWeeklyOff();
  const updatePreset = useUpdateWeeklyOff();
  const deletePreset = useDeleteWeeklyOff();

  const handleToggleAlwaysOff = (day: WeekDay) => {
    setAlwaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddNthRule = () => {
    setNthRules((prev) => [...prev, { weeks: [], day: 'Sat' }]);
  };

  const handleRemoveNthRule = (index: number) => {
    setNthRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateNthRuleDay = (index: number, day: WeekDay) => {
    setNthRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], day };
      return updated;
    });
  };

  const handleToggleNthRuleWeek = (ruleIndex: number, weekNum: number) => {
    setNthRules((prev) => {
      const updated = [...prev];
      const targetWeeks = parseArrayData<number>(updated[ruleIndex]?.weeks);
      const newWeeks = targetWeeks.includes(weekNum)
        ? targetWeeks.filter((w) => w !== weekNum)
        : [...targetWeeks, weekNum].sort((a, b) => a - b);

      updated[ruleIndex] = { ...updated[ruleIndex], weeks: newWeeks };
      return updated;
    });
  };

  const handleStartEdit = (preset: WeeklyOffPreset) => {
    setEditingId(preset.id);
    setName(preset.name);
    setAlwaysOff(parseArrayData<WeekDay>(preset.always_off));
    setNthRules(parseArrayData<NthRule>(preset.nth_off_rules));
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setAlwaysOff([]);
    setNthRules([]);
  };

  const handleSavePreset = async () => {
    if (!name.trim()) return;

    if (editingId) {
      await updatePreset.mutateAsync({
        id: editingId,
        data: {
          name: name.trim(),
          always_off: alwaysOff,
          nth_off_rules: nthRules,
        },
      });
    } else {
      await createPreset.mutateAsync({
        name: name.trim(),
        always_off: alwaysOff,
        nth_off_rules: nthRules,
      });
    }

    handleResetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      await deletePreset.mutateAsync(id);
    }
  };

  const formatAlwaysOff = (days: any) => {
    const safeDays = parseArrayData<WeekDay>(days);
    if (safeDays.length === 0) return '-';
    return safeDays.map((d) => FULL_DAY_NAMES[d] || d).join(', ');
  };

  const formatNthRules = (rules: any) => {
    const safeRules = parseArrayData<NthRule>(rules);
    if (safeRules.length === 0) return '-';

    return safeRules
      .map((r) => {
        const safeWeeks = parseArrayData<number>(r.weeks);
        if (safeWeeks.length === 0) return `Any ${r.day}`;
        if (safeWeeks.length === 5) return `All ${r.day}`;

        const ordinalString = safeWeeks
          .map((w) => {
            if (w === 1) return '1st';
            if (w === 2) return '2nd';
            if (w === 3) return '3rd';
            return `${w}th`;
          })
          .join(' & ');
        return `${ordinalString} ${r.day}`;
      })
      .join(', ');
  };

  const filteredPresets = useMemo(() => {
    const safePresets = parseArrayData<WeeklyOffPreset>(rawPresets);
    return safePresets.filter((p) =>
      p.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [rawPresets, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Weekly Offs</h1>
              <p className="text-xs text-gray-400">
                Presets for any weekday combo + nth Saturday · Site defaults on Locations → Site
              </p>
            </div>
            <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              AUTO-SAVE ON
            </span>
          </div>

          {/* New / Edit Preset Form Card */}
          <div className="my-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <h2 className="mb-3 text-xs font-bold text-gray-800">
              {editingId ? 'Edit weekly off preset' : 'New weekly off preset'}
            </h2>

            {/* Preset Name */}
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                PRESET NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunday + 4th Saturday"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Always Off Days */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                WEEKDAYS ALWAYS OFF (EVERY WEEK)
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isChecked = alwaysOff.includes(day);
                  return (
                    <label
                      key={day}
                      className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/20 font-medium text-gray-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAlwaysOff(day)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{day}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Nth Off Rules */}
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                NTH-OF-MONTH OFFS{' '}
                <span className="font-normal italic text-gray-300">
                  (any weekday — e.g. 2nd & 4th Sunday)
                </span>
              </label>

              {nthRules.map((rule, idx) => {
                const safeWeeks = parseArrayData<number>(rule.weeks);
                return (
                  <div key={idx} className="mb-2 flex items-center gap-3 rounded-md bg-gray-50 p-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((w) => {
                        const isSelected = safeWeeks.includes(w);
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleToggleNthRuleWeek(idx, w)}
                            className={`h-7 w-7 rounded text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>

                    <select
                      value={rule.day}
                      onChange={(e) => handleUpdateNthRuleDay(idx, e.target.value as WeekDay)}
                      className="h-7 rounded border border-gray-200 bg-white px-2 text-xs outline-none"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveNthRule(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddNthRule}
                className="mt-1 flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-xs hover:bg-gray-50"
              >
                <Plus size={12} /> Add nth rule
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSavePreset}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800"
              >
                {editingId ? 'Update Preset' : 'Save Preset'}
              </button>
            </div>
          </div>

          {/* Table Filters */}
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter presets..."
              className="h-8 w-48 rounded-md border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-300 focus:border-blue-400"
            />
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
              {filteredPresets.length} presets
            </span>
          </div>

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2 w-1/4">PRESET</th>
                  <th className="py-3 px-2 w-1/3">ALWAYS OFF</th>
                  <th className="py-3 px-2">NTH-OF-MONTH</th>
                  <th className="py-3 px-2 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      Loading presets...
                    </td>
                  </tr>
                ) : filteredPresets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No presets found.
                    </td>
                  </tr>
                ) : (
                  filteredPresets.map((preset) => (
                    <tr key={preset.id} className="group hover:bg-gray-50/60">
                      <td className="py-3.5 px-2 font-bold text-gray-900">{preset.name}</td>
                      <td className="py-3.5 px-2 text-gray-600">
                        {formatAlwaysOff(preset.always_off)}
                      </td>
                      <td className="py-3.5 px-2 text-gray-600">
                        {formatNthRules(preset.nth_off_rules)}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(preset)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(preset.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}