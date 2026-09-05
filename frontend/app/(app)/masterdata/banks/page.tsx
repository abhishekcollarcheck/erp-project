'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useBankData,
  useCreateBank,
  useUpdateBank,
  useDeleteBank,
} from '@/features/banks/hooks/useBank';

export default function AllBanksPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: banks = [] } = useBankData();

  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  const deleteBank = useDeleteBank();

  const handleAddBank = async () => {
    if (!name.trim()) return;
    await createBank.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateBank.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredBanks = useMemo(() => {
    return banks.filter((b) =>
      b.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [banks, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="All Banks"
          addPlaceholder="Add all banks..."
          items={filteredBanks}
          name={name}
          onNameChange={setName}
          onAdd={handleAddBank}
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
          onDelete={(id) => deleteBank.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
