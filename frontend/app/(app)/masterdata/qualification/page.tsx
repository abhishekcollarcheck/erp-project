'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useQualificationData,
  useCreateQualification,
  useUpdateQualification,
  useDeleteQualification,
} from '@/features/qualification/hoooks/useQualification';

export default function QualificationPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: qualifications = [] } = useQualificationData();

  const createQualification = useCreateQualification();
  const updateQualification = useUpdateQualification();
  const deleteQualification = useDeleteQualification();

  const handleAddQualification = async () => {
    if (!name.trim()) return;
    await createQualification.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateQualification.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredQualifications = useMemo(() => {
    return qualifications.filter((q) =>
      q.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [qualifications, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Qualification"
          addPlaceholder="Add qualification..."
          items={filteredQualifications}
          name={name}
          onNameChange={setName}
          onAdd={handleAddQualification}
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
          onDelete={(id) => deleteQualification.mutate(id)}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
