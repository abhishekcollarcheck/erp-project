'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useGenderData,
  useCreateGender,
  useUpdateGender,
  useDeleteGender,
} from '@/features/gender/hooks/useGender';

export default function GenderPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: genders = [] } = useGenderData();

  const createGender = useCreateGender();
  const updateGender = useUpdateGender();
  const deleteGender = useDeleteGender();

  const handleAddGender = async () => {
    if (!name.trim()) return;
    await createGender.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateGender.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredGenders = useMemo(() => {
    return genders.filter((g) =>
      g.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [genders, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Gender"
          addPlaceholder="Add gender..."
          items={filteredGenders}
          name={name}
          onNameChange={setName}
          onAdd={handleAddGender}
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
          onDelete={(id) => deleteGender.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
