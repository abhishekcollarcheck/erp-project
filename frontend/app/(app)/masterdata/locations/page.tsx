'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
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
  const tabDefs: { key: TabKey; label: string; count: number }[] = [
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
        <SimpleMasterList
          title="Locations"
          subtitle="Work site hierarchy · Address country / state / city for employee forms"
          addPlaceholder={`Add ${tabDefs.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
          emptyText="No records found."
          isLoading={isLoading}
          items={listItems}
          tabs={tabDefs.map((t) => ({
            label: t.label,
            count: t.count,
            active: activeTab === t.key,
            onClick: () => {
              setActiveTab(t.key);
              setFilterText('');
              setEditingId(null);
            },
          }))}
          addExtra={
            (activeTab === 'state_country' || activeTab === 'address_state') ? (
              <div className="fg" style={{ margin: 0, width: 160 }}>
                <select
                  value={selectedParentId ?? ''}
                  onChange={(e) => setSelectedParentId(Number(e.target.value))}
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (activeTab === 'city' || activeTab === 'address_city') ? (
              <div className="fg" style={{ margin: 0, width: 160 }}>
                <select
                  value={selectedParentId ?? ''}
                  onChange={(e) => setSelectedParentId(Number(e.target.value))}
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            ) : undefined
          }
          name={newTitle}
          onNameChange={setNewTitle}
          onAdd={handleAdd}
          filterText={filterText}
          onFilterChange={setFilterText}
          editingId={editingId}
          editName={editTitle}
          onEditNameChange={setEditTitle}
          onStartEdit={(item) => {
            setEditingId(item.id);
            setEditTitle(item.rawName);
          }}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => {
            setEditingId(null);
            setEditTitle('');
          }}
          onDelete={handleDelete}
        />
      </MasterDataLayout>
    </AppShell>
  );
}
