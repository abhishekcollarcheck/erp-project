'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useShirtSizeData,
  useCreateShirtSize,
  useUpdateShirtSize,
  useDeleteShirtSize,
} from '@/features/shirtSize/hooks/useShirtSize';

export default function ShirtSizePage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: shirtSizes = [] } = useShirtSizeData();

  const createShirtSize = useCreateShirtSize();
  const updateShirtSize = useUpdateShirtSize();
  const deleteShirtSize = useDeleteShirtSize();

  const handleAddShirtSize = async () => {
    if (!name.trim()) return;
    await createShirtSize.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateShirtSize.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredShirtSizes = useMemo(() => {
    return shirtSizes.filter((s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [shirtSizes, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="T-Shirt/Shirt Size"
          addPlaceholder="Add t-shirt/shirt size..."
          items={filteredShirtSizes}
          name={name}
          onNameChange={setName}
          onAdd={handleAddShirtSize}
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
          onDelete={(id) => deleteShirtSize.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
