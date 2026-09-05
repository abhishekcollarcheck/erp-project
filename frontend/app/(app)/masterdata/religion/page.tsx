'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useReligionData,
  useCreateReligion,
  useUpdateReligion,
  useDeleteReligion,
} from '@/features/religion/hooks/useReligion';

export default function ReligionPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: religions = [] } = useReligionData();

  const createReligion = useCreateReligion();
  const updateReligion = useUpdateReligion();
  const deleteReligion = useDeleteReligion();

  const handleAddReligion = async () => {
    if (!name.trim()) return;
    await createReligion.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateReligion.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredReligions = useMemo(() => {
    return religions.filter((r) =>
      r.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [religions, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Religion"
          addPlaceholder="Add religion..."
          items={filteredReligions}
          name={name}
          onNameChange={setName}
          onAdd={handleAddReligion}
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
          onDelete={(id) => deleteReligion.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
