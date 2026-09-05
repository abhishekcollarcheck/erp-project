'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useMaritalStatusData,
  useCreateMaritalStatus,
  useUpdateMaritalStatus,
  useDeleteMaritalStatus,
} from '@/features/maritalStatus/hooks/useMaritalStatus';

export default function MaritalStatusPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: maritalStatuses = [] } = useMaritalStatusData();

  const createMaritalStatus = useCreateMaritalStatus();
  const updateMaritalStatus = useUpdateMaritalStatus();
  const deleteMaritalStatus = useDeleteMaritalStatus();

  const handleAddMaritalStatus = async () => {
    if (!name.trim()) return;
    await createMaritalStatus.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateMaritalStatus.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredMaritalStatuses = useMemo(() => {
    return maritalStatuses.filter((m) =>
      m.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [maritalStatuses, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Marital Status"
          addPlaceholder="Add marital status..."
          items={filteredMaritalStatuses}
          name={name}
          onNameChange={setName}
          onAdd={handleAddMaritalStatus}
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
          onDelete={(id) => deleteMaritalStatus.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
