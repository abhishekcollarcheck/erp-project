'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useBondList,
  useCreateBond,
  useUpdateBond,
  useDeleteBond,
} from '@/features/bond/hooks/useBond';
import { Bond } from '@/services/api/bondService';

export default function BondPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Fetch list data
  const { data: bonds = [] } = useBondList();

  // Mutations
  const createMutation = useCreateBond();
  const updateMutation = useUpdateBond();
  const deleteMutation = useDeleteBond();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim() });
    setName('');
  };

  const handleStartEdit = (item: Bond) => {
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
    if (confirm('Are you sure you want to delete this bond option?')) {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredItems = useMemo(() => {
    return bonds.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [bonds, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Bond"
          addPlaceholder="Add bond..."
          emptyText="No bond options found"
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
