'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useEmployeeStatuses,
  useCreateEmployeeStatus,
  useUpdateEmployeeStatus,
  useDeleteEmployeeStatus,
} from '@/features/employeeStatus/hooks/useEmployeeStatus';
import { EmployeeStatus } from '@/services/api/employeeStatusService';

export default function EmployeeStatusesPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: statuses = [], isLoading } = useEmployeeStatuses();
  const createStatus = useCreateEmployeeStatus();
  const updateStatus = useUpdateEmployeeStatus();
  const deleteStatus = useDeleteEmployeeStatus();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createStatus.mutateAsync(name.trim());
    setName('');
  };

  const handleStartEdit = (statusItem: EmployeeStatus) => {
    setEditingId(statusItem.id);
    setEditName(statusItem.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    await updateStatus.mutateAsync({
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
    if (confirm('Are you sure you want to delete this employee status?')) {
      await deleteStatus.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredStatuses = useMemo(() => {
    return (statuses || []).filter((s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [statuses, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Employee Status"
          addPlaceholder="Add employee status..."
          emptyText="No status found"
          isLoading={isLoading}
          items={filteredStatuses}
          name={name}
          onNameChange={setName}
          onAdd={handleAdd}
          filterText={filterText}
          onFilterChange={setFilterText}
          editingId={editingId}
          editName={editName}
          onEditNameChange={setEditName}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
