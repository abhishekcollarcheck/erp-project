'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useModeOfPaymentData,
  useCreateModeOfPayment,
  useUpdateModeOfPayment,
  useDeleteModeOfPayment,
} from '@/features/modeofPayment/hooks/useModeOfPayment';

export default function ModeOfPaymentPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: modesOfPayment = [] } = useModeOfPaymentData();

  const createMode = useCreateModeOfPayment();
  const updateMode = useUpdateModeOfPayment();
  const deleteMode = useDeleteModeOfPayment();

  const handleAddModeOfPayment = async () => {
    if (!name.trim()) return;
    await createMode.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateMode.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredModes = useMemo(() => {
    return modesOfPayment.filter((m) =>
      m.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [modesOfPayment, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Mode of Payment"
          addPlaceholder="Add mode of payment..."
          items={filteredModes}
          name={name}
          onNameChange={setName}
          onAdd={handleAddModeOfPayment}
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
          onDelete={(id) => deleteMode.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
