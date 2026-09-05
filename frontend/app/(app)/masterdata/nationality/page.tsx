'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useNationalityData,
  useCreateNationality,
  useUpdateNationality,
  useDeleteNationality,
} from '@/features/nationality/hooks/useNationality';

export default function NationalityPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: nationalities = [] } = useNationalityData();

  const createNationality = useCreateNationality();
  const updateNationality = useUpdateNationality();
  const deleteNationality = useDeleteNationality();

  const handleAddNationality = async () => {
    if (!name.trim()) return;
    await createNationality.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateNationality.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredNationalities = useMemo(() => {
    return nationalities.filter((n) =>
      n.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [nationalities, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Nationality"
          addPlaceholder="Add nationality..."
          items={filteredNationalities}
          name={name}
          onNameChange={setName}
          onAdd={handleAddNationality}
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
          onDelete={(id) => deleteNationality.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
