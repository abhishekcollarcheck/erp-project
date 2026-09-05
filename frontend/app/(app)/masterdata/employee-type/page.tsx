'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useEmployeeTypes,
  useCreateEmployeeType,
  useUpdateEmployeeType,
  useDeleteEmployeeType,
} from '@/features/employee-type/hooks/useEmployeeType';
import { EmployeeType } from '@/services/api/employeeTypeService';

export default function EmployeeTypesPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: types = [], isLoading } = useEmployeeTypes();
  const createType = useCreateEmployeeType();
  const updateType = useUpdateEmployeeType();
  const deleteType = useDeleteEmployeeType();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createType.mutateAsync(name.trim());
    setName('');
  };

  const handleStartEdit = (type: EmployeeType) => {
    setEditingId(type.id);
    setEditName(type.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    await updateType.mutateAsync({
      id,
      data: { name: editName.trim() },
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this employee type?')) {
      await deleteType.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredTypes = useMemo(() => {
    return (types || []).filter((t) =>
      t.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [types, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Employee Type"
          addPlaceholder="Add employee type..."
          emptyText="No types found"
          isLoading={isLoading}
          items={filteredTypes}
          name={name}
          onNameChange={setName}
          onAdd={handleAdd}
          filterText={filterText}
          onFilterChange={setFilterText}
          editingId={editingId}
          editName={editName}
          onEditNameChange={setEditName}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
