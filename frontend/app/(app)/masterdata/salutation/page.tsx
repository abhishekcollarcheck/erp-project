'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, GripVertical, Pencil, Check } from 'lucide-react';
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
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Salutation</h1>
              <p className="text-xs text-gray-400">
                Used across Add Employee, filters & transfers
              </p>
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

          <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            {/* Top Input Row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSalutation()}
                placeholder="Add salutation..."
                className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSalutation}
                className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {/* Filter Bar */}
            <div className="mt-4 flex items-center justify-between">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="h-8 w-44 rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400"
              />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                {filteredSalutations.length}
              </span>
            </div>

            {/* Salutation Chips Container */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {filteredSalutations.map((item) => {
                const isEditing = editingId === item.id;
                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-md border border-blue-500 bg-white px-3 py-1"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xs font-semibold outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="text-green-600"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.id}
                    className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800"
                  >
                    <GripVertical size={14} className="cursor-grab text-gray-300" />
                    <span
                      onDoubleClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSalutation.mutate(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}