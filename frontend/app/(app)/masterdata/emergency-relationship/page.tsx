'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useEmergencyRelationshipData,
  useCreateEmergencyRelationship,
  useUpdateEmergencyRelationship,
  useDeleteEmergencyRelationship,
} from '@/features/emergency-relationship/useEmergencyRelationship';

export default function EmergencyRelationshipPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: relationships = [] } = useEmergencyRelationshipData();

  const createRelationship = useCreateEmergencyRelationship();
  const updateRelationship = useUpdateEmergencyRelationship();
  const deleteRelationship = useDeleteEmergencyRelationship();

  const handleAddRelationship = async () => {
    if (!name.trim()) return;
    await createRelationship.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateRelationship.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredRelationships = useMemo(() => {
    return relationships.filter((r) =>
      r.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [relationships, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Emergency Relationship"
          addPlaceholder="Add emergency relationship..."
          items={filteredRelationships}
          name={name}
          onNameChange={setName}
          onAdd={handleAddRelationship}
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
          onDelete={(id) => deleteRelationship.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
