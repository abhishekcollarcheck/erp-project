'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useHouseTypeData,
  useCreateHouseType,
  useUpdateHouseType,
  useDeleteHouseType,
} from '@/features/house-type/hooks/useHouseType';

export default function HouseTypePage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: houseTypes = [] } = useHouseTypeData();

  const createHouseType = useCreateHouseType();
  const updateHouseType = useUpdateHouseType();
  const deleteHouseType = useDeleteHouseType();

  const handleAddHouseType = async () => {
    if (!name.trim()) return;
    await createHouseType.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateHouseType.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredHouseTypes = useMemo(() => {
    return houseTypes.filter((h) =>
      h.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [houseTypes, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="House Type"
          addPlaceholder="Add house type..."
          items={filteredHouseTypes}
          name={name}
          onNameChange={setName}
          onAdd={handleAddHouseType}
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
          onDelete={(id) => deleteHouseType.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
