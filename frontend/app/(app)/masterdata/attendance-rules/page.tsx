'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';

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
        <SimpleMasterList
          title="Attendance Rules"
          subtitle="Saturday-nth rules (for weekly-off presets), grace minutes, attendance types"
          addPlaceholder={placeholderText}
          items={currentList}
          headerExtra={
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={handleDeleteMaster}>
              Delete master
            </button>
          }
          tabs={[
            {
              label: 'Saturday Rules',
              count: saturdayRules.length,
              active: activeTab === 'saturday',
              onClick: () => { setActiveTab('saturday'); setEditingId(null); },
            },
            {
              label: 'Grace Minutes',
              count: graceMinutes.length,
              active: activeTab === 'grace',
              onClick: () => { setActiveTab('grace'); setEditingId(null); },
            },
            {
              label: 'Attendance Type',
              count: attendanceTypes.length,
              active: activeTab === 'attendance',
              onClick: () => { setActiveTab('attendance'); setEditingId(null); },
            },
          ]}
          name={inputValue}
          onNameChange={setInputValue}
          onAdd={handleAdd}
          filterText={filterText}
          onFilterChange={setFilterText}
          editingId={editingId}
          editName={editName}
          onEditNameChange={setEditName}
          onStartEdit={(item) => {
            setEditingId(item.id);
            setEditName(item.name);
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDelete={handleDelete}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
