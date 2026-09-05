'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
import {
  useProbationList,
  useCreateProbation,
  useUpdateProbation,
  useDeleteProbation,
} from '@/features/probation/hooks/useProbation';
import { ProbationType, ProbationItem } from '@/services/api/probationService';

export default function ProbationPage() {
  const [activeTab, setActiveTab] = useState<ProbationType>('periods');
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Data fetching
  const { data: periods = [] } = useProbationList('periods');
  const { data: statuses = [] } = useProbationList('statuses');

  const currentList = activeTab === 'periods' ? periods : statuses;

  // Mutations for current active tab
  const createMutation = useCreateProbation(activeTab);
  const updateMutation = useUpdateProbation(activeTab);
  const deleteMutation = useDeleteProbation(activeTab);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim() });
    setName('');
  };

  const handleStartEdit = (item: ProbationItem) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      handleCancelEdit();
      return;
    }
    await updateMutation.mutateAsync({ id, data: { name: editName.trim() } });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredItems = useMemo(() => {
    return currentList.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [currentList, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <SimpleMasterList
          title="Probation"
          subtitle="Manage probation periods and status options"
          addPlaceholder={activeTab === 'periods' ? 'Add probation period...' : 'Add probation status...'}
          emptyText="No records found"
          items={filteredItems}
          tabs={[
            {
              label: 'Period',
              count: periods.length,
              active: activeTab === 'periods',
              onClick: () => {
                setActiveTab('periods');
                setEditingId(null);
              },
            },
            {
              label: 'Status',
              count: statuses.length,
              active: activeTab === 'statuses',
              onClick: () => {
                setActiveTab('statuses');
                setEditingId(null);
              },
            },
          ]}
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
