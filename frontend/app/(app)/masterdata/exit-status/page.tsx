'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useExitStatusList,
  useCreateExitStatus,
  useUpdateExitStatus,
  useDeleteExitStatus,
} from '@/features/exitStatus/hooks/useExitStatus';
import { ExitStatus } from '@/services/api/exitStatusService';

export default function ExitStatusPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Fetch list data
  const { data: exitStatuses = [] } = useExitStatusList();

  // Mutations
  const createMutation = useCreateExitStatus();
  const updateMutation = useUpdateExitStatus();
  const deleteMutation = useDeleteExitStatus();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim() });
    setName('');
  };

  const handleStartEdit = (item: ExitStatus) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      handleCancelEdit();
      return;
    }
    await updateMutation.mutateAsync({ id, data: { name: editName.trim() } });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this exit status?')) {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredItems = useMemo(() => {
    return exitStatuses.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [exitStatuses, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Exit Status"
          addPlaceholder="Add exit status..."
          emptyText="No exit statuses found"
          items={filteredItems}
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
