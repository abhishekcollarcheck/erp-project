'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, GripVertical, Pencil, Check } from 'lucide-react';
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
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Probation</h1>
              <p className="text-xs text-gray-400">Manage probation periods and status options</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-xs font-medium text-red-500 hover:underline">
                Delete master
              </button>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                AUTO-SAVE ON
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setActiveTab('periods');
                setEditingId(null);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeTab === 'periods'
                  ? 'border border-blue-200 bg-blue-50 text-blue-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Period <span className="text-[11px] opacity-75">{periods.length}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('statuses');
                setEditingId(null);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeTab === 'statuses'
                  ? 'border border-blue-200 bg-blue-50 text-blue-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Status <span className="text-[11px] opacity-75">{statuses.length}</span>
            </button>
          </div>

          {/* Main Content Box */}
          <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            {/* Input Row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={
                  activeTab === 'periods' ? 'Add probation period...' : 'Add probation status...'
                }
                className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              >
                Add
              </button>
            </div>

            {/* Search & Total Badge */}
            <div className="mt-4 flex items-center justify-between">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="h-8 w-44 rounded-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                {filteredItems.length}
              </span>
            </div>

            {/* List Display */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {filteredItems.length === 0 ? (
                <span className="text-xs text-gray-400">No records found</span>
              ) : (
                filteredItems.map((item, index) => {
                  const isEditingThis = editingId === item.id;

                  if (isEditingThis) {
                    return (
                      <div key={item.id} className="flex w-full items-center gap-3 py-1 text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <GripVertical size={14} className="cursor-grab text-gray-300" />
                          <span className="w-4 text-center font-semibold text-gray-500">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex flex-1 items-center justify-between rounded-md border border-blue-500 bg-white px-3 py-1.5 ring-1 ring-blue-500">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            className="w-full bg-transparent font-medium text-gray-900 outline-none"
                          />
                          <div className="flex items-center gap-2 pl-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="text-gray-400 hover:text-green-600"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 transition-shadow hover:shadow-xs"
                    >
                      <GripVertical size={14} className="cursor-grab text-gray-300" />
                      <span
                        onDoubleClick={() => handleStartEdit(item)}
                        className="cursor-pointer"
                        title="Double click to edit"
                      >
                        {item.name}
                      </span>
                      <div className="ml-0.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-600"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}