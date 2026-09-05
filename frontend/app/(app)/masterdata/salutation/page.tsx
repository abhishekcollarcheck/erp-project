'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useSalutationData,
  useCreateSalutation,
  useUpdateSalutation,
  useDeleteSalutation,
} from '@/features/salutation/hooks/useSalutation';

export default function SalutationPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: salutations = [] } = useSalutationData();

  const createSalutation = useCreateSalutation();
  const updateSalutation = useUpdateSalutation();
  const deleteSalutation = useDeleteSalutation();

  const handleAddSalutation = async () => {
    if (!name.trim()) return;
    await createSalutation.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateSalutation.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredSalutations = useMemo(() => {
    return salutations.filter((s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [salutations, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Salutation"
          addPlaceholder="Add salutation..."
          items={filteredSalutations}
          name={name}
          onNameChange={setName}
          onAdd={handleAddSalutation}
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
          onDelete={(id) => deleteSalutation.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
