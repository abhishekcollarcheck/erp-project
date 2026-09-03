// import { MasterDataLayout } from '@/components/layout/MasterDataLayout'
// import { AppShell } from '@/layouts/AppLayout'
// import React from 'react'

// const page = () => {
//     return (
//         <AppShell>
//             <MasterDataLayout>

//                 <div>page</div>
//             </MasterDataLayout>
//         </AppShell>
//     )
// }

// export default page


'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { GripVertical, Pencil, X, Plus, Search } from 'lucide-react';
import {
  useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
  useStates, useCreateState, useUpdateState, useDeleteState,
  useCities, useCreateCity, useUpdateCity, useDeleteCity,
  useSites, useCreateSite, useUpdateSite, useDeleteSite,
  usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
} from '@/features/locations/hooks/uselocation';

// ─── Active Tab Types ────────────────────────────────────────────────────────
type TabKey =
  | 'state_country'
  | 'city'
  | 'site'
  | 'address_country'
  | 'address_state'
  | 'address_city'
  | 'pay_register';


  
export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('state_country');
  const [filterText, setFilterText] = useState('');
  
  // New Item Input State
  const [newTitle, setNewTitle] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  // Edit Inline State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // ─── React Query Hooks ────────────────────────────────────────────────────
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useStates();
  const { data: cities = [], isLoading: loadingCities } = useCities();
  const { data: sites = [], isLoading: loadingSites } = useSites();
  const { data: payRegisters = [], isLoading: loadingPayRegisters } = usePayRegisters();

  // Mutations
  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();
  const deleteCountry = useDeleteCountry();

  const createState = useCreateState();
  const updateState = useUpdateState();
  const deleteState = useDeleteState();

  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();

  const createPayRegister = useCreatePayRegister();
  const updatePayRegister = useUpdatePayRegister();
  const deletePayRegister = useDeletePayRegister();

  // ─── Filtered Data ────────────────────────────────────────────────────────
  const listItems = useMemo(() => {
    const query = filterText.toLowerCase().trim();

    switch (activeTab) {
      case 'state_country':
      case 'address_state':
        return states
          .map((s) => ({
            id: s.id,
            name: `${s.name}${s.country ? `, ${s.country.name}` : ''}`,
            rawName: s.name,
            parentId: s.country_id,
          }))
          .filter((item) => item.name.toLowerCase().includes(query));

      case 'city':
      case 'address_city':
        return cities
          .map((c) => ({
            id: c.id,
            name: `${c.name}${c.state ? `, ${c.state.name}` : ''}`,
            rawName: c.name,
            parentId: c.state_id,
          }))
          .filter((item) => item.name.toLowerCase().includes(query));

      case 'site':
        return sites
          .map((s) => ({
            id: s.id,
            name: `${s.name}${s.city ? `, ${s.city.name}` : ''}`,
            rawName: s.name,
            parentId: s.city_id ?? undefined,
          }))
          .filter((item) => item.name.toLowerCase().includes(query));

      case 'address_country':
        return countries
          .map((c) => ({ id: c.id, name: c.name, rawName: c.name }))
          .filter((item) => item.name.toLowerCase().includes(query));

      case 'pay_register':
        return payRegisters
          .map((p) => ({
            id: p.id,
            name: `${p.name}${p.state ? `, ${p.state.name}` : ''}`,
            rawName: p.name,
            parentId: p.state_id ?? undefined,
          }))
          .filter((item) => item.name.toLowerCase().includes(query));

      default:
        return [];
    }
  }, [activeTab, filterText, states, cities, sites, countries, payRegisters]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newTitle.trim()) return;

    if (activeTab === 'state_country' || activeTab === 'address_state') {
      const countryId = selectedParentId || countries[0]?.id || 1;
      await createState.mutateAsync({ name: newTitle.trim(), country_id: countryId });
    } else if (activeTab === 'city' || activeTab === 'address_city') {
      const stateId = selectedParentId || states[0]?.id || 1;
      await createCity.mutateAsync({ name: newTitle.trim(), state_id: stateId });
    } else if (activeTab === 'site') {
      await createSite.mutateAsync({ name: newTitle.trim(), company_id: 1, city_id: selectedParentId || undefined });
    } else if (activeTab === 'address_country') {
      await createCountry.mutateAsync({ name: newTitle.trim() });
    } else if (activeTab === 'pay_register') {
      await createPayRegister.mutateAsync({ name: newTitle.trim(), company_id: 1, state_id: selectedParentId || undefined });
    }

    setNewTitle('');
    setSelectedParentId(null);
  };

  const startEdit = (id: number, rawName: string) => {
    setEditingId(id);
    setEditTitle(rawName);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;

    if (activeTab === 'state_country' || activeTab === 'address_state') {
      await updateState.mutateAsync({ id, data: { name: editTitle.trim() } });
    } else if (activeTab === 'city' || activeTab === 'address_city') {
      await updateCity.mutateAsync({ id, data: { name: editTitle.trim() } });
    } else if (activeTab === 'site') {
      await updateSite.mutateAsync({ id, data: { name: editTitle.trim() } });
    } else if (activeTab === 'address_country') {
      await updateCountry.mutateAsync({ id, data: { name: editTitle.trim() } });
    } else if (activeTab === 'pay_register') {
      await updatePayRegister.mutateAsync({ id, data: { name: editTitle.trim() } });
    }

    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
    else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
    else if (activeTab === 'site') await deleteSite.mutateAsync(id);
    else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
    else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
  };

  const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters;

  // ─── Render Tabs Configuration ───────────────────────────────────────────
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'state_country', label: 'State / Country', count: states.length },
    { key: 'city', label: 'City', count: cities.length },
    { key: 'site', label: 'Site', count: sites.length },
    { key: 'address_country', label: 'Address Country', count: countries.length },
    { key: 'address_state', label: 'Address State', count: states.length },
    { key: 'address_city', label: 'Address City', count: cities.length },
    { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
  ];

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Locations</h1>
              <p className="text-xs text-gray-400">
                Work site hierarchy · Address country / state / city for employee forms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs font-semibold text-red-500 hover:text-red-600">
                Delete master
              </button>
              <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                AUTO-SAVE ON
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setFilterText('');
                    setEditingId(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] ${
                      active ? 'font-bold text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick-Add Bar */}
          <div className="flex items-center gap-2 py-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Add ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
              className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />

            {/* Parent selector conditionally shown for hierarchical entities */}
            {(activeTab === 'state_country' || activeTab === 'address_state') && (
              <select
                value={selectedParentId ?? ''}
                onChange={(e) => setSelectedParentId(Number(e.target.value))}
                className="h-10 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-400"
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {(activeTab === 'city' || activeTab === 'address_city') && (
              <select
                value={selectedParentId ?? ''}
                onChange={(e) => setSelectedParentId(Number(e.target.value))}
                className="h-10 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-400"
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleAdd}
              className="flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
            >
              Add
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between py-2">
            <div className="relative w-64">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="h-8 w-full rounded-md border border-gray-200 bg-white pl-3 pr-8 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
            </div>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
              {listItems.length}
            </span>
          </div>

          {/* List Section */}
          <div className="min-h-0 flex-1 overflow-y-auto pt-2">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading location data...</div>
            ) : listItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No records found.</div>
            ) : (
              <div className="space-y-1">
                {listItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50/80"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <GripVertical size={14} className="cursor-grab text-gray-300 opacity-60 group-hover:opacity-100" />
                      <span className="min-w-[18px] text-left text-[11px] font-semibold text-gray-300">
                        {index + 1}
                      </span>

                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                          className="h-7 w-64 rounded border border-blue-400 px-2 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-blue-100"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs font-semibold text-gray-800">{item.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {editingId === item.id ? (
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(item.id, item.rawName)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}