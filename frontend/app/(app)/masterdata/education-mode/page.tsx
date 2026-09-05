'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useEducationModeData,
  useCreateEducationMode,
  useUpdateEducationMode,
  useDeleteEducationMode,
} from '@/features/education-mode/hooks/useEducationMode';

export default function EducationModePage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: educationModes = [] } = useEducationModeData();

  const createEducationMode = useCreateEducationMode();
  const updateEducationMode = useUpdateEducationMode();
  const deleteEducationMode = useDeleteEducationMode();

  const handleAddEducationMode = async () => {
    if (!name.trim()) return;
    await createEducationMode.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateEducationMode.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredEducationModes = useMemo(() => {
    return educationModes.filter((m) =>
      m.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [educationModes, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Education Mode"
          addPlaceholder="Add education mode..."
          items={filteredEducationModes}
          name={name}
          onNameChange={setName}
          onAdd={handleAddEducationMode}
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
          onDelete={(id) => deleteEducationMode.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
