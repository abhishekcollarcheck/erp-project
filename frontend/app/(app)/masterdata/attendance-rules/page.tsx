'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, GripVertical, Pencil, Check } from 'lucide-react';

import {
  useSaturdayRulesData,
  useCreateSaturdayRule,
  useUpdateSaturdayRule,
  useDeleteSaturdayRule,
  useDeleteAllSaturdayRules,
  useGraceMinutesData,
  useCreateGraceMinute,
  useUpdateGraceMinute,
  useDeleteGraceMinute,
  useDeleteAllGraceMinutes,
  useAttendanceTypesData,
  useCreateAttendanceType,
  useUpdateAttendanceType,
  useDeleteAttendanceType,
  useDeleteAllAttendanceTypes,
} from '@/features/attendance-rule/hooks/useAttendanceRules';


type TabType = 'saturday' | 'grace' | 'attendance';

export default function AttendanceRulesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('saturday');
  const [inputValue, setInputValue] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // ─── Saturday Rules Data & Mutations ──────────────────────────────────────
  const { data: saturdayRulesResponse } = useSaturdayRulesData();
  const saturdayRules = saturdayRulesResponse?.data || [];
  const createSaturdayRule = useCreateSaturdayRule();
  const updateSaturdayRule = useUpdateSaturdayRule();
  const deleteSaturdayRule = useDeleteSaturdayRule();
  const deleteAllSaturdayRules = useDeleteAllSaturdayRules();

  // ─── Grace Minutes Data & Mutations ────────────────────────────────────────
  const { data: graceMinutesResponse } = useGraceMinutesData();
  const graceMinutes = graceMinutesResponse?.data || [];
  const createGraceMinute = useCreateGraceMinute();
  const updateGraceMinute = useUpdateGraceMinute();
  const deleteGraceMinute = useDeleteGraceMinute();
  const deleteAllGraceMinutes = useDeleteAllGraceMinutes();

  // ─── Attendance Types Data & Mutations ─────────────────────────────────────
  const { data: attendanceTypesResponse } = useAttendanceTypesData();
  const attendanceTypes = attendanceTypesResponse?.data || [];
  const createAttendanceType = useCreateAttendanceType();
  const updateAttendanceType = useUpdateAttendanceType();
  const deleteAttendanceType = useDeleteAttendanceType();
  const deleteAllAttendanceTypes = useDeleteAllAttendanceTypes();

  // ─── Add Handler ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!inputValue.trim()) return;

    if (activeTab === 'saturday') {
      await createSaturdayRule.mutateAsync({ name: inputValue.trim() });
    } else if (activeTab === 'grace') {
      await createGraceMinute.mutateAsync({ name: inputValue.trim() });
    } else if (activeTab === 'attendance') {
      await createAttendanceType.mutateAsync({ name: inputValue.trim() });
    }

    setInputValue('');
  };

  // ─── Save Edit Handler ────────────────────────────────────────────────────
  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    if (activeTab === 'saturday') {
      await updateSaturdayRule.mutateAsync({ id, data: { name: editName.trim() } });
    } else if (activeTab === 'grace') {
      await updateGraceMinute.mutateAsync({ id, data: { name: editName.trim() } });
    } else if (activeTab === 'attendance') {
      await updateAttendanceType.mutateAsync({ id, data: { name: editName.trim() } });
    }

    setEditingId(null);
  };

  // ─── Delete Item Handler ──────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    if (activeTab === 'saturday') deleteSaturdayRule.mutate(id);
    if (activeTab === 'grace') deleteGraceMinute.mutate(id);
    if (activeTab === 'attendance') deleteAttendanceType.mutate(id);
  };

  // ─── Delete Master Handler ────────────────────────────────────────────────
  const handleDeleteMaster = () => {
    if (confirm(`Are you sure you want to delete all items for this section?`)) {
      if (activeTab === 'saturday') deleteAllSaturdayRules.mutate();
      if (activeTab === 'grace') deleteAllGraceMinutes.mutate();
      if (activeTab === 'attendance') deleteAllAttendanceTypes.mutate();
    }
  };

  // ─── Active Data Filtering ────────────────────────────────────────────────
  const currentList = useMemo(() => {
    let list: Array<{ id: number; name: string }> = [];
    if (activeTab === 'saturday') list = saturdayRules;
    if (activeTab === 'grace') list = graceMinutes;
    if (activeTab === 'attendance') list = attendanceTypes;

    return list.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [activeTab, saturdayRules, graceMinutes, attendanceTypes, filterText]);

  // Tab Placeholder Labels
  const placeholderText = {
    saturday: 'Add saturday off...',
    grace: 'Add grace minutes...',
    attendance: 'Add attendance type...',
  }[activeTab];

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          
          {/* Header Section */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Attendance Rules</h1>
              <p className="text-xs text-gray-400">
                Saturday-nth rules (for weekly-off presets), grace minutes, attendance types
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleDeleteMaster}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                Delete master
              </button>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                AUTO-SAVE ON
              </span>
            </div>
          </div>

          <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('saturday');
                  setEditingId(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'saturday'
                    ? 'border border-blue-600 bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Saturday Rules
                <span className="text-[11px] opacity-70">{saturdayRules.length}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('grace');
                  setEditingId(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'grace'
                    ? 'border border-blue-600 bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Grace Minutes
                <span className="text-[11px] opacity-70">{graceMinutes.length}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('attendance');
                  setEditingId(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'attendance'
                    ? 'border border-blue-600 bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Attendance Type
                <span className="text-[11px] opacity-70">{attendanceTypes.length}</span>
              </button>
            </div>

            {/* Input Row */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={placeholderText}
                className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAdd}
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
                {currentList.length}
              </span>
            </div>

            {/* List Render Area */}
            {activeTab === 'saturday' ? (
              /* Saturday Rules Layout - Vertical List */
              <div className="mt-4 flex flex-col gap-1">
                {currentList.map((item, index) => {
                  const isEditing = editingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between rounded-lg py-2 px-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="cursor-grab text-gray-300" />
                        <span className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-[11px] font-medium text-gray-400">
                          {index + 1}
                        </span>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="rounded border border-blue-500 px-2 py-0.5 text-xs font-medium outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-800">{item.name}</span>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditName(item.name);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grace Minutes & Attendance Type Layout - Horizontal Badges */
              <div className="mt-4 flex flex-wrap gap-2">
                {currentList.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/50 px-3 py-1.5 transition-all hover:bg-gray-100"
                    >
                      <GripVertical size={14} className="cursor-grab text-gray-300" />
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-24 rounded border border-blue-500 px-1 py-0.5 text-xs font-semibold outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingId(item.id);
                            setEditName(item.name);
                          }}
                          className="cursor-pointer text-xs font-bold text-gray-800 hover:text-blue-600"
                        >
                          {item.name}
                        </span>
                      )}

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}