'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useNoticePeriodList,
  useCreateNoticePeriod,
  useUpdateNoticePeriod,
  useDeleteNoticePeriod,
} from '@/features/notice/hooks/useNoticePeriod';
import { NoticePeriod } from '@/services/api/noticePeriodService';

export default function NoticePeriodPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Fetch list data
  const { data: noticePeriods = [] } = useNoticePeriodList();

  // Mutations
  const createMutation = useCreateNoticePeriod();
  const updateMutation = useUpdateNoticePeriod();
  const deleteMutation = useDeleteNoticePeriod();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim() });
    setName('');
  };

  const handleStartEdit = (item: NoticePeriod) => {
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
    if (confirm('Are you sure you want to delete this notice period?')) {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredItems = useMemo(() => {
    return noticePeriods.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [noticePeriods, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Notice Period"
          addPlaceholder="Add notice period..."
          emptyText="No notice periods found"
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
