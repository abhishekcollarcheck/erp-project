'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useBloodGroupData,
  useCreateBloodGroup,
  useUpdateBloodGroup,
  useDeleteBloodGroup,
} from '@/features/bloodGroup/hooks/useBloodGroup';

export default function BloodGroupPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: bloodGroups = [] } = useBloodGroupData();

  const createBloodGroup = useCreateBloodGroup();
  const updateBloodGroup = useUpdateBloodGroup();
  const deleteBloodGroup = useDeleteBloodGroup();

  const handleAddBloodGroup = async () => {
    if (!name.trim()) return;
    await createBloodGroup.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateBloodGroup.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredBloodGroups = useMemo(() => {
    return bloodGroups.filter((bg) =>
      bg.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [bloodGroups, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Blood Group"
          addPlaceholder="Add blood group..."
          items={filteredBloodGroups}
          name={name}
          onNameChange={setName}
          onAdd={handleAddBloodGroup}
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
          onDelete={(id) => deleteBloodGroup.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
