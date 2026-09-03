'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { X, GripVertical, Pencil, Check } from 'lucide-react';
import {
  useBloodGroupData,
  useCreateBloodGroup,
  useUpdateBloodGroup,
  useDeleteBloodGroup,
} from '@/features/bloodGroup/hooks/useBloodGroup';

export default function BloodGroupPage() {
  const [name, setName] = useState('');
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { data: bloodGroups = [] } = useBloodGroupData();

  const createBloodGroup = useCreateBloodGroup();
  const updateBloodGroup = useUpdateBloodGroup();
  const deleteBloodGroup = useDeleteBloodGroup();

  const handleAddBloodGroup = async () => {
    if (!name.trim()) return;
    await createBloodGroup.mutateAsync(name.trim());
    setName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (editName.trim()) {
      await updateBloodGroup.mutateAsync({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const filteredBloodGroups = useMemo(() => {
    return bloodGroups.filter((bg) =>
      bg.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [bloodGroups, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Blood Group</h1>
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddBloodGroup()}
                placeholder="Add blood group..."
                className="h-10 flex-1 rounded-lg border border-gray-200 px-4 text-xs outline-none placeholder:text-gray-400 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddBloodGroup}
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
                {filteredBloodGroups.length}
              </span>
            </div>

            {/* Vertical List View */}
            <div className="mt-6 flex flex-col gap-2">
              {filteredBloodGroups.map((item, index) => {
                const isEditing = editingId === item.id;
                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-blue-500 bg-white px-3 py-2"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 text-xs font-semibold outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-lg border border-transparent px-2 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="cursor-grab text-gray-300" />
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                        {index + 1}
                      </span>
                      <span
                        className="text-xs font-bold text-gray-800"
                        onDoubleClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
                        }}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
                        }}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBloodGroup.mutate(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={15} />
                      </button>
                    </div>
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