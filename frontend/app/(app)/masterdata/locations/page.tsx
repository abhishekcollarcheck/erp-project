// 'use client';

// import React, { useState, useMemo } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import { Select } from '@/components/ui/Select';
// import {
//   useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
//   useStates, useCreateState, useUpdateState, useDeleteState,
//   useCities, useCreateCity, useUpdateCity, useDeleteCity,
//   useSites, useCreateSite, useUpdateSite, useDeleteSite,
//   usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
// } from '@/features/locations/hooks/uselocation';

// // ─── Active Tab Types ────────────────────────────────────────────────────────
// type TabKey =
//   | 'state_country'
//   | 'city'
//   | 'site'
//   | 'address_country'
//   | 'address_state'
//   | 'address_city'
//   | 'pay_register';

// export default function LocationsPage() {
//   const [activeTab, setActiveTab] = useState<TabKey>('state_country');
//   const [filterText, setFilterText] = useState('');

//   // New Item Input State
//   const [newTitle, setNewTitle] = useState('');
//   const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

//   // Edit Inline State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editTitle, setEditTitle] = useState('');

//   // ─── React Query Hooks ────────────────────────────────────────────────────
//   const { data: countries = [], isLoading: loadingCountries } = useCountries();
//   const { data: states = [], isLoading: loadingStates } = useStates();
//   const { data: cities = [], isLoading: loadingCities } = useCities();
//   const { data: sites = [], isLoading: loadingSites } = useSites();
//   const { data: payRegisters = [], isLoading: loadingPayRegisters } = usePayRegisters();

//   // Mutations
//   const createCountry = useCreateCountry();
//   const updateCountry = useUpdateCountry();
//   const deleteCountry = useDeleteCountry();

//   const createState = useCreateState();
//   const updateState = useUpdateState();
//   const deleteState = useDeleteState();

//   const createCity = useCreateCity();
//   const updateCity = useUpdateCity();
//   const deleteCity = useDeleteCity();

//   const createSite = useCreateSite();
//   const updateSite = useUpdateSite();
//   const deleteSite = useDeleteSite();

//   const createPayRegister = useCreatePayRegister();
//   const updatePayRegister = useUpdatePayRegister();
//   const deletePayRegister = useDeletePayRegister();

//   // ─── Filtered Data ────────────────────────────────────────────────────────
//   const listItems = useMemo(() => {
//     const query = filterText.toLowerCase().trim();

//     switch (activeTab) {
//       case 'state_country':
//       case 'address_state':
//         return states
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.country ? `, ${s.country.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.country_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'city':
//       case 'address_city':
//         return cities
//           .map((c) => ({
//             id: c.id,
//             name: `${c.name}${c.state ? `, ${c.state.name}` : ''}`,
//             rawName: c.name,
//             parentId: c.state_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'site':
//         return sites
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.city ? `, ${s.city.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.city_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'address_country':
//         return countries
//           .map((c) => ({ id: c.id, name: c.name, rawName: c.name }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'pay_register':
//         return payRegisters
//           .map((p) => ({
//             id: p.id,
//             name: `${p.name}${p.state ? `, ${p.state.name}` : ''}`,
//             rawName: p.name,
//             parentId: p.state_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       default:
//         return [];
//     }
//   }, [activeTab, filterText, states, cities, sites, countries, payRegisters]);

//   // ─── Handlers ─────────────────────────────────────────────────────────────
//   const handleAdd = async () => {
//     if (!newTitle.trim()) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') {
//       const countryId = selectedParentId || countries[0]?.id || 1;
//       await createState.mutateAsync({ name: newTitle.trim(), country_id: countryId });
//     } else if (activeTab === 'city' || activeTab === 'address_city') {
//       const stateId = selectedParentId || states[0]?.id || 1;
//       await createCity.mutateAsync({ name: newTitle.trim(), state_id: stateId });
//     } else if (activeTab === 'site') {
//       await createSite.mutateAsync({ name: newTitle.trim(), company_id: 1, city_id: selectedParentId || undefined });
//     } else if (activeTab === 'address_country') {
//       await createCountry.mutateAsync({ name: newTitle.trim() });
//     } else if (activeTab === 'pay_register') {
//       await createPayRegister.mutateAsync({ name: newTitle.trim(), company_id: 1, state_id: selectedParentId || undefined });
//     }

//     setNewTitle('');
//     setSelectedParentId(null);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editTitle.trim()) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') {
//       await updateState.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'city' || activeTab === 'address_city') {
//       await updateCity.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'site') {
//       await updateSite.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'address_country') {
//       await updateCountry.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'pay_register') {
//       await updatePayRegister.mutateAsync({ id, data: { name: editTitle.trim() } });
//     }

//     setEditingId(null);
//     setEditTitle('');
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm('Are you sure you want to delete this item?')) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
//     else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
//     else if (activeTab === 'site') await deleteSite.mutateAsync(id);
//     else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
//     else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
//   };

//   const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters;

//   // ─── Render Tabs Configuration ───────────────────────────────────────────
//   const tabDefs: { key: TabKey; label: string; count: number }[] = [
//     { key: 'state_country', label: 'State / Country', count: states.length },
//     { key: 'city', label: 'City', count: cities.length },
//     { key: 'site', label: 'Site', count: sites.length },
//     { key: 'address_country', label: 'Address Country', count: countries.length },
//     { key: 'address_state', label: 'Address State', count: states.length },
//     { key: 'address_city', label: 'Address City', count: cities.length },
//     { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
//   ];

//   return (
//     <AppShell>
//       <MasterDataLayout>
//         <SimpleMasterList
//           title="Locations"
//           subtitle="Work site hierarchy · Address country / state / city for employee forms"
//           addPlaceholder={`Add ${tabDefs.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
//           emptyText="No records found."
//           isLoading={isLoading}
//           items={listItems}
//           tabs={tabDefs.map((t) => ({
//             label: t.label,
//             count: t.count,
//             active: activeTab === t.key,
//             onClick: () => {
//               setActiveTab(t.key);
//               setFilterText('');
//               setEditingId(null);
//             },
//           }))}
//           addExtra={
//             (activeTab === 'state_country' || activeTab === 'address_state') ? (
//               <div className="fg" style={{ margin: 0, width: 180 }}>
//                 <Select
//                   value={selectedParentId ?? ''}
//                   onChange={(v) => setSelectedParentId(Number(v))}
//                   options={countries.map((c) => ({ value: c.id, label: c.name }))}
//                   placeholder="Select Country"
//                   filter
//                 />
//               </div>
//             ) : (activeTab === 'city' || activeTab === 'address_city') ? (
//               <div className="fg" style={{ margin: 0, width: 180 }}>
//                 <Select
//                   value={selectedParentId ?? ''}
//                   onChange={(v) => setSelectedParentId(Number(v))}
//                   options={states.map((s) => ({ value: s.id, label: s.name }))}
//                   placeholder="Select State"
//                   filter
//                 />
//               </div>
//             ) : undefined
//           }
//           name={newTitle}
//           onNameChange={setNewTitle}
//           onAdd={handleAdd}
//           filterText={filterText}
//           onFilterChange={setFilterText}
//           editingId={editingId}
//           editName={editTitle}
//           onEditNameChange={setEditTitle}
//           onStartEdit={(item) => {
//             setEditingId(item.id);
//             setEditTitle(item.rawName);
//           }}
//           onSaveEdit={handleSaveEdit}
//           onCancelEdit={() => {
//             setEditingId(null);
//             setEditTitle('');
//           }}
//           onDelete={handleDelete}
//         />
//       </MasterDataLayout>
//     </AppShell>
//   );
// }






















// 'use client';

// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import { Select } from '@/components/ui/Select';
// import {
//   useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
//   useStates, useCreateState, useUpdateState, useDeleteState,
//   useCities, useCreateCity, useUpdateCity, useDeleteCity,
//   useSites, useCreateSite, useUpdateSite, useDeleteSite,
//   usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
// } from '@/features/locations/hooks/uselocation';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';

// // ─── Active Tab Types ────────────────────────────────────────────────────────
// type TabKey =
//   | 'state_country'
//   | 'city'
//   | 'site'
//   | 'address_country'
//   | 'address_state'
//   | 'address_city'
//   | 'pay_register';

// // Each tab edits one underlying entity's "name" field. Maps to the field_key
// // from location-seed.sql. address_state/address_city are alternate VIEWS of
// // the same state/city records as state_country/city, so they share a
// // field_key — there's no separate permission for the "duplicate" tabs.
// const TAB_TO_FIELD_KEY: Record<TabKey, string> = {
//   state_country: 'state_name',
//   address_state: 'state_name',
//   city: 'city_name',
//   address_city: 'city_name',
//   site: 'site_name',
//   address_country: 'country_name',
//   pay_register: 'pay_register_name',
// };

// const ALL_TABS = Object.keys(TAB_TO_FIELD_KEY) as TabKey[];

// export default function LocationsPage() {
//   // Resource name for personal permissions and useFieldPermissions() is
//   // 'location' (singular) throughout — matches the actual backend slug
//   // (hr_modules.slug and the system_permissions entries), confirmed after
//   // the plural 'locations' version silently failed every canCreate/
//   // canEdit/canDelete check despite the field-permission matrix being
//   // fully open.
//   const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('location');

//   // f() = existing-record permissions (completionPct: 100 — editing a row
//   // that already exists).
//   const f = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );
//   // fCreate() = new-record permissions (completionPct: 0 — same "Add"
//   // onboarding-style bonus as Shifts' create form).
//   const fCreate = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );

//   const canViewTab = useCallback((tab: TabKey) => f(TAB_TO_FIELD_KEY[tab]).can_view, [f]);

//   const [activeTab, setActiveTab] = useState<TabKey>('state_country');
//   const [filterText, setFilterText] = useState('');

//   // New Item Input State
//   const [newTitle, setNewTitle] = useState('');
//   const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

//   // Edit Inline State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editTitle, setEditTitle] = useState('');

//   // If the active tab isn't viewable for this role (or field perms just
//   // loaded), fall back to the first tab that is — instead of showing a
//   // blank/broken view for a tab the user can't actually see.
//   useEffect(() => {
//     if (fieldsLoading) return;
//     if (!canViewTab(activeTab)) {
//       const firstVisible = ALL_TABS.find(canViewTab);
//       if (firstVisible) setActiveTab(firstVisible);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fieldsLoading, fp, isSuperAdmin]);

//   // ─── React Query Hooks ────────────────────────────────────────────────────
//   const { data: countries = [], isLoading: loadingCountries } = useCountries();
//   const { data: states = [], isLoading: loadingStates } = useStates();
//   const { data: cities = [], isLoading: loadingCities } = useCities();
//   const { data: sites = [], isLoading: loadingSites } = useSites();
//   const { data: payRegisters = [], isLoading: loadingPayRegisters } = usePayRegisters();

//   // Mutations
//   const createCountry = useCreateCountry();
//   const updateCountry = useUpdateCountry();
//   const deleteCountry = useDeleteCountry();

//   const createState = useCreateState();
//   const updateState = useUpdateState();
//   const deleteState = useDeleteState();

//   const createCity = useCreateCity();
//   const updateCity = useUpdateCity();
//   const deleteCity = useDeleteCity();

//   const createSite = useCreateSite();
//   const updateSite = useUpdateSite();
//   const deleteSite = useDeleteSite();

//   const createPayRegister = useCreatePayRegister();
//   const updatePayRegister = useUpdatePayRegister();
//   const deletePayRegister = useDeletePayRegister();

//   // ─── Filtered Data ────────────────────────────────────────────────────────
//   const listItems = useMemo(() => {
//     const query = filterText.toLowerCase().trim();

//     switch (activeTab) {
//       case 'state_country':
//       case 'address_state':
//         return states
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.country ? `, ${s.country.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.country_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'city':
//       case 'address_city':
//         return cities
//           .map((c) => ({
//             id: c.id,
//             name: `${c.name}${c.state ? `, ${c.state.name}` : ''}`,
//             rawName: c.name,
//             parentId: c.state_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'site':
//         return sites
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.city ? `, ${s.city.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.city_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'address_country':
//         return countries
//           .map((c) => ({ id: c.id, name: c.name, rawName: c.name }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'pay_register':
//         return payRegisters
//           .map((p) => ({
//             id: p.id,
//             name: `${p.name}${p.state ? `, ${p.state.name}` : ''}`,
//             rawName: p.name,
//             parentId: p.state_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       default:
//         return [];
//     }
//   }, [activeTab, filterText, states, cities, sites, countries, payRegisters]);

//   // ─── Permission gates for the current tab ────────────────────────────────
//   const currentFieldKey = TAB_TO_FIELD_KEY[activeTab];
//   const canAddCurrent = canCreate('location') && fCreate(currentFieldKey).can_edit;
//   const canEditCurrent = canEdit('location') && f(currentFieldKey).can_edit;
//   const canDeleteCurrent = canDelete('location');

//   // ─── Handlers — gated internally regardless of whether SimpleMasterList
//   //     ends up hiding/disabling the corresponding button (see note below) ──
//   const handleAdd = async () => {
//     if (!newTitle.trim() || !canAddCurrent) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') {
//       const countryId = selectedParentId || countries[0]?.id || 1;
//       await createState.mutateAsync({ name: newTitle.trim(), country_id: countryId });
//     } else if (activeTab === 'city' || activeTab === 'address_city') {
//       const stateId = selectedParentId || states[0]?.id || 1;
//       await createCity.mutateAsync({ name: newTitle.trim(), state_id: stateId });
//     } else if (activeTab === 'site') {
//       await createSite.mutateAsync({ name: newTitle.trim(), company_id: 1, city_id: selectedParentId || undefined });
//     } else if (activeTab === 'address_country') {
//       await createCountry.mutateAsync({ name: newTitle.trim() });
//     } else if (activeTab === 'pay_register') {
//       await createPayRegister.mutateAsync({ name: newTitle.trim(), company_id: 1, state_id: selectedParentId || undefined });
//     }

//     setNewTitle('');
//     setSelectedParentId(null);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editTitle.trim() || !canEditCurrent) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') {
//       await updateState.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'city' || activeTab === 'address_city') {
//       await updateCity.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'site') {
//       await updateSite.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'address_country') {
//       await updateCountry.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'pay_register') {
//       await updatePayRegister.mutateAsync({ id, data: { name: editTitle.trim() } });
//     }

//     setEditingId(null);
//     setEditTitle('');
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDeleteCurrent) return;
//     if (!confirm('Are you sure you want to delete this item?')) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
//     else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
//     else if (activeTab === 'site') await deleteSite.mutateAsync(id);
//     else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
//     else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
//   };

//   const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters || fieldsLoading;

//   // ─── Render Tabs Configuration ───────────────────────────────────────────
//   // Tabs the role can't view are hidden entirely, not just disabled — same
//   // principle as Shifts hiding whole table columns for a field with
//   // can_view: false.
//   const tabDefs: { key: TabKey; label: string; count: number }[] = (
//     [
//       { key: 'state_country', label: 'State / Country', count: states.length },
//       { key: 'city', label: 'City', count: cities.length },
//       { key: 'site', label: 'Site', count: sites.length },
//       { key: 'address_country', label: 'Address Country', count: countries.length },
//       { key: 'address_state', label: 'Address State', count: states.length },
//       { key: 'address_city', label: 'Address City', count: cities.length },
//       { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
//     ] as { key: TabKey; label: string; count: number }[]
//   ).filter((t) => canViewTab(t.key));

//   return (
//     <PermissionGuard permission="location:view">
//       <AppShell>
//         <MasterDataLayout>
//           <SimpleMasterList
//             title="Locations"
//             subtitle="Work site hierarchy · Address country / state / city for employee forms"
//             addPlaceholder={`Add ${tabDefs.find((t) => t.key === activeTab)?.label.toLowerCase() ?? ''}...`}
//             emptyText="No records found."
//             isLoading={isLoading}
//             items={listItems}
//             tabs={tabDefs.map((t) => ({
//               label: t.label,
//               count: t.count,
//               active: activeTab === t.key,
//               onClick: () => {
//                 setActiveTab(t.key);
//                 setFilterText('');
//                 setEditingId(null);
//               },
//             }))}
//             addExtra={
//               !canAddCurrent ? undefined :
//               (activeTab === 'state_country' || activeTab === 'address_state') ? (
//                 <div className="fg" style={{ margin: 0, width: 180 }}>
//                   <Select
//                     value={selectedParentId ?? ''}
//                     onChange={(v) => setSelectedParentId(Number(v))}
//                     options={countries.map((c) => ({ value: c.id, label: c.name }))}
//                     placeholder="Select Country"
//                     filter
//                   />
//                 </div>
//               ) : (activeTab === 'city' || activeTab === 'address_city') ? (
//                 <div className="fg" style={{ margin: 0, width: 180 }}>
//                   <Select
//                     value={selectedParentId ?? ''}
//                     onChange={(v) => setSelectedParentId(Number(v))}
//                     options={states.map((s) => ({ value: s.id, label: s.name }))}
//                     placeholder="Select State"
//                     filter
//                   />
//                 </div>
//               ) : undefined
//             }
//             name={newTitle}
//             onNameChange={setNewTitle}
//             // onAdd itself stays required and permission-checked internally
//             // as a safety net, but visibility is now actually controlled by
//             // canAdd below (SimpleMasterList hides the whole add-row).
//             onAdd={handleAdd}
//             filterText={filterText}
//             onFilterChange={setFilterText}
//             editingId={editingId}
//             editName={editTitle}
//             onEditNameChange={setEditTitle}
//             onStartEdit={(item: { id: number; name: string; rawName: string }) => {
//               if (!canEditCurrent) return;
//               setEditingId(item.id);
//               setEditTitle(item.rawName);
//             }}
//             onSaveEdit={handleSaveEdit}
//             onCancelEdit={() => {
//               setEditingId(null);
//               setEditTitle('');
//             }}
//             onDelete={handleDelete}
//             canAdd={canAddCurrent}
//             canEdit={canEditCurrent}
//             canDelete={canDeleteCurrent}
//             fieldPerm={f(currentFieldKey)}
//           />
//         </MasterDataLayout>
//       </AppShell>
//     </PermissionGuard>
//   );
// }



// 'use client';

// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import { Select } from '@/components/ui/Select';
// import {
//   useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
//   useStates, useCreateState, useUpdateState, useDeleteState,
//   useCities, useCreateCity, useUpdateCity, useDeleteCity,
//   useSites, useCreateSite, useUpdateSite, useDeleteSite,
//   usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
// } from '@/features/locations/hooks/uselocation';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';

// // ─── Active Tab Types ────────────────────────────────────────────────────────
// type TabKey =
//   | 'state_country'
//   | 'city'
//   | 'site'
//   | 'address_country'
//   | 'address_state'
//   | 'address_city'
//   | 'pay_register';

// // Each tab edits one underlying entity's "name" field. Maps to the field_key
// // from location-seed.sql. address_state/address_city are alternate VIEWS of
// // the same state/city records as state_country/city, so they share a
// // field_key — there's no separate permission for the "duplicate" tabs.
// const TAB_TO_FIELD_KEY: Record<TabKey, string> = {
//   state_country: 'state_name',
//   address_state: 'state_name',
//   city: 'city_name',
//   address_city: 'city_name',
//   site: 'site_name',
//   address_country: 'country_name',
//   pay_register: 'pay_register_name',
// };

// const ALL_TABS = Object.keys(TAB_TO_FIELD_KEY) as TabKey[];

// export default function LocationsPage() {
//   // Resource name for personal permissions and useFieldPermissions() is
//   // 'location' (singular) throughout — matches the actual backend slug
//   // (hr_modules.slug and the system_permissions entries), confirmed after
//   // the plural 'locations' version silently failed every canCreate/
//   // canEdit/canDelete check despite the field-permission matrix being
//   // fully open.
//   const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('location');

//   // f() = existing-record permissions (completionPct: 100 — editing a row
//   // that already exists).
//   const f = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );
//   // fCreate() = new-record permissions (completionPct: 0 — same "Add"
//   // onboarding-style bonus as Shifts' create form).
//   const fCreate = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );

//   const canViewTab = useCallback((tab: TabKey) => f(TAB_TO_FIELD_KEY[tab]).can_view, [f]);

//   const [activeTab, setActiveTab] = useState<TabKey>('state_country');
//   const [filterText, setFilterText] = useState('');

//   // New Item Input State
//   const [newTitle, setNewTitle] = useState('');
//   const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

//   // Edit Inline State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editTitle, setEditTitle] = useState('');

//   // If the active tab isn't viewable for this role (or field perms just
//   // loaded), fall back to the first tab that is — instead of showing a
//   // blank/broken view for a tab the user can't actually see.
//   useEffect(() => {
//     if (fieldsLoading) return;
//     if (!canViewTab(activeTab)) {
//       const firstVisible = ALL_TABS.find(canViewTab);
//       if (firstVisible) setActiveTab(firstVisible);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fieldsLoading, fp, isSuperAdmin]);

//   // ─── React Query Hooks ────────────────────────────────────────────────────
//   const { data: countries = [], isLoading: loadingCountries } = useCountries();
//   const { data: states = [], isLoading: loadingStates } = useStates();
//   const { data: cities = [], isLoading: loadingCities } = useCities();
//   const { data: sites = [], isLoading: loadingSites } = useSites();
//   const { data: payRegisters = [], isLoading: loadingPayRegisters } = usePayRegisters();

//   // Mutations
//   const createCountry = useCreateCountry();
//   const updateCountry = useUpdateCountry();
//   const deleteCountry = useDeleteCountry();

//   const createState = useCreateState();
//   const updateState = useUpdateState();
//   const deleteState = useDeleteState();

//   const createCity = useCreateCity();
//   const updateCity = useUpdateCity();
//   const deleteCity = useDeleteCity();

//   const createSite = useCreateSite();
//   const updateSite = useUpdateSite();
//   const deleteSite = useDeleteSite();

//   const createPayRegister = useCreatePayRegister();
//   const updatePayRegister = useUpdatePayRegister();
//   const deletePayRegister = useDeletePayRegister();

//   // ─── Filtered Data ────────────────────────────────────────────────────────
//   const listItems = useMemo(() => {
//     const query = filterText.toLowerCase().trim();

//     switch (activeTab) {
//       case 'state_country':
//       case 'address_state':
//         return states
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.country ? `, ${s.country.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.country_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'city':
//       case 'address_city':
//         return cities
//           .map((c) => ({
//             id: c.id,
//             name: `${c.name}${c.state ? `, ${c.state.name}` : ''}`,
//             rawName: c.name,
//             parentId: c.state_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'site':
//         return sites
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.city ? `, ${s.city.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.city_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'address_country':
//         return countries
//           .map((c) => ({ id: c.id, name: c.name, rawName: c.name }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'pay_register':
//         return payRegisters
//           .map((p) => ({
//             id: p.id,
//             name: `${p.name}${p.state ? `, ${p.state.name}` : ''}`,
//             rawName: p.name,
//             parentId: p.state_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       default:
//         return [];
//     }
//   }, [activeTab, filterText, states, cities, sites, countries, payRegisters]);

//   // ─── Permission gates for the current tab ────────────────────────────────
//   const currentFieldKey = TAB_TO_FIELD_KEY[activeTab];
//   const canAddCurrent = canCreate('location') && fCreate(currentFieldKey).can_edit;
//   const canEditCurrent = canEdit('location') && f(currentFieldKey).can_edit;
//   const canDeleteCurrent = canDelete('location');

//   // ─── Handlers — gated internally regardless of whether SimpleMasterList
//   //     ends up hiding/disabling the corresponding button (see note below) ──
//   const handleAdd = async () => {
//     if (!newTitle.trim() || !canAddCurrent) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') {
//       const countryId = selectedParentId || countries[0]?.id || 1;
//       await createState.mutateAsync({ name: newTitle.trim(), country_id: countryId });
//     } else if (activeTab === 'city' || activeTab === 'address_city') {
//       const stateId = selectedParentId || states[0]?.id || 1;
//       await createCity.mutateAsync({ name: newTitle.trim(), state_id: stateId });
//     } else if (activeTab === 'site') {
//       await createSite.mutateAsync({ name: newTitle.trim(), company_id: 1, city_id: selectedParentId || undefined });
//     } else if (activeTab === 'address_country') {
//       await createCountry.mutateAsync({ name: newTitle.trim() });
//     } else if (activeTab === 'pay_register') {
//       await createPayRegister.mutateAsync({ name: newTitle.trim(), company_id: 1, state_id: selectedParentId || undefined });
//     }

//     setNewTitle('');
//     setSelectedParentId(null);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editTitle.trim() || !canEditCurrent) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') {
//       await updateState.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'city' || activeTab === 'address_city') {
//       await updateCity.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'site') {
//       await updateSite.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'address_country') {
//       await updateCountry.mutateAsync({ id, data: { name: editTitle.trim() } });
//     } else if (activeTab === 'pay_register') {
//       await updatePayRegister.mutateAsync({ id, data: { name: editTitle.trim() } });
//     }

//     setEditingId(null);
//     setEditTitle('');
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDeleteCurrent) return;
//     if (!confirm('Are you sure you want to delete this item?')) return;

//     if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
//     else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
//     else if (activeTab === 'site') await deleteSite.mutateAsync(id);
//     else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
//     else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
//   };

//   const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters || fieldsLoading;

//   // ─── Render Tabs Configuration ───────────────────────────────────────────
//   // Tabs the role can't view are hidden entirely, not just disabled — same
//   // principle as Shifts hiding whole table columns for a field with
//   // can_view: false.
//   const tabDefs: { key: TabKey; label: string; count: number }[] = (
//     [
//       { key: 'state_country', label: 'State / Country', count: states.length },
//       { key: 'city', label: 'City', count: cities.length },
//       { key: 'site', label: 'Site', count: sites.length },
//       { key: 'address_country', label: 'Address Country', count: countries.length },
//       { key: 'address_state', label: 'Address State', count: states.length },
//       { key: 'address_city', label: 'Address City', count: cities.length },
//       { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
//     ] as { key: TabKey; label: string; count: number }[]
//   ).filter((t) => canViewTab(t.key));

//   return (
//     <PermissionGuard permission="location:view">
//       <AppShell>
//         <MasterDataLayout>
//           <SimpleMasterList
//             title="Locations"
//             subtitle="Work site hierarchy · Address country / state / city for employee forms"
//             addPlaceholder={`Add ${tabDefs.find((t) => t.key === activeTab)?.label.toLowerCase() ?? ''}...`}
//             emptyText="No records found."
//             isLoading={isLoading}
//             items={listItems}
//             tabs={tabDefs.map((t) => ({
//               label: t.label,
//               count: t.count,
//               active: activeTab === t.key,
//               onClick: () => {
//                 setActiveTab(t.key);
//                 setFilterText('');
//                 setEditingId(null);
//               },
//             }))}
//             addExtra={
//               !canAddCurrent ? undefined :
//               (activeTab === 'state_country' || activeTab === 'address_state') ? (
//                 <div className="fg" style={{ margin: 0, width: 180 }}>
//                   <Select
//                     value={selectedParentId ?? ''}
//                     onChange={(v) => setSelectedParentId(Number(v))}
//                     options={countries.map((c) => ({ value: c.id, label: c.name }))}
//                     placeholder="Select Country"
//                     filter
//                   />
//                 </div>
//               ) : (activeTab === 'city' || activeTab === 'address_city') ? (
//                 <div className="fg" style={{ margin: 0, width: 180 }}>
//                   <Select
//                     value={selectedParentId ?? ''}
//                     onChange={(v) => setSelectedParentId(Number(v))}
//                     options={states.map((s) => ({ value: s.id, label: s.name }))}
//                     placeholder="Select State"
//                     filter
//                   />
//                 </div>
//               ) : undefined
//             }
//             name={newTitle}
//             onNameChange={setNewTitle}
//             // onAdd itself stays required and permission-checked internally
//             // as a safety net, but visibility is now actually controlled by
//             // canAdd below (SimpleMasterList hides the whole add-row).
//             onAdd={handleAdd}
//             filterText={filterText}
//             onFilterChange={setFilterText}
//             editingId={editingId}
//             editName={editTitle}
//             onEditNameChange={setEditTitle}
//             onStartEdit={(item: { id: number; name: string; rawName: string }) => {
//               if (!canEditCurrent) return;
//               setEditingId(item.id);
//               setEditTitle(item.rawName);
//             }}
//             onSaveEdit={handleSaveEdit}
//             onCancelEdit={() => {
//               setEditingId(null);
//               setEditTitle('');
//             }}
//             onDelete={handleDelete}
//             canAdd={canAddCurrent}
//             canEdit={canEditCurrent}
//             canDelete={canDeleteCurrent}
//             fieldPerm={f(currentFieldKey)}
//           />
//         </MasterDataLayout>
//       </AppShell>
//     </PermissionGuard>
//   );
// }













// 'use client';

// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { SimpleMasterList } from '@/components/masterdata/SimpleMasterList';
// import { Select } from '@/components/ui/Select';
// import {
//   useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
//   useStates, useCreateState, useUpdateState, useDeleteState,
//   useCities, useCreateCity, useUpdateCity, useDeleteCity,
//   useSites, useCreateSite, useUpdateSite, useDeleteSite,
//   usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
// } from '@/features/locations/hooks/uselocation';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
// import { showToast } from '@/utils/toast';

// // ─── Active Tab Types ────────────────────────────────────────────────────────
// type TabKey =
//   | 'state_country'
//   | 'city'
//   | 'site'
//   | 'address_country'
//   | 'address_state'
//   | 'address_city'
//   | 'pay_register';

// // Each tab edits one underlying entity's "name" field. Maps to the field_key
// // from location-seed.sql. address_state/address_city are alternate VIEWS of
// // the same state/city records as state_country/city, so they share a
// // field_key — there's no separate permission for the "duplicate" tabs.
// const TAB_TO_FIELD_KEY: Record<TabKey, string> = {
//   state_country: 'state_name',
//   address_state: 'state_name',
//   city: 'city_name',
//   address_city: 'city_name',
//   site: 'site_name',
//   address_country: 'country_name',
//   pay_register: 'pay_register_name',
// };

// const ALL_TABS = Object.keys(TAB_TO_FIELD_KEY) as TabKey[];

// export default function LocationsPage() {
//   // Resource name for personal permissions and useFieldPermissions() is
//   // 'location' (singular) throughout — matches the actual backend slug
//   // (hr_modules.slug and the system_permissions entries), confirmed after
//   // the plural 'locations' version silently failed every canCreate/
//   // canEdit/canDelete check despite the field-permission matrix being
//   // fully open.
//   const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('location');

//   // f() = existing-record permissions (completionPct: 100 — editing a row
//   // that already exists).
//   const f = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );
//   // fCreate() = new-record permissions (completionPct: 0 — same "Add"
//   // onboarding-style bonus as Shifts' create form).
//   const fCreate = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );

//   const canViewTab = useCallback((tab: TabKey) => f(TAB_TO_FIELD_KEY[tab]).can_view, [f]);

//   const [activeTab, setActiveTab] = useState<TabKey>('state_country');
//   const [filterText, setFilterText] = useState('');

//   // New Item Input State
//   const [newTitle, setNewTitle] = useState('');
//   const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

//   // Edit Inline State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editTitle, setEditTitle] = useState('');

//   // TEMP DEBUG — confirms whether editingId state is actually changing
//   useEffect(() => {
//     console.log('[LocationsPage] editingId state is now', editingId);
//   }, [editingId]);

//   // If the active tab isn't viewable for this role (or field perms just
//   // loaded), fall back to the first tab that is — instead of showing a
//   // blank/broken view for a tab the user can't actually see.
//   useEffect(() => {
//     if (fieldsLoading) return;
//     if (!canViewTab(activeTab)) {
//       const firstVisible = ALL_TABS.find(canViewTab);
//       if (firstVisible) setActiveTab(firstVisible);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fieldsLoading, fp, isSuperAdmin]);

//   // ─── React Query Hooks ────────────────────────────────────────────────────
//   const { data: countries = [], isLoading: loadingCountries } = useCountries();
//   const { data: states = [], isLoading: loadingStates } = useStates();
//   const { data: cities = [], isLoading: loadingCities } = useCities();
//   const { data: sites = [], isLoading: loadingSites } = useSites();
//   const { data: payRegisters = [], isLoading: loadingPayRegisters } = usePayRegisters();

//   // Mutations
//   const createCountry = useCreateCountry();
//   const updateCountry = useUpdateCountry();
//   const deleteCountry = useDeleteCountry();

//   const createState = useCreateState();
//   const updateState = useUpdateState();
//   const deleteState = useDeleteState();

//   const createCity = useCreateCity();
//   const updateCity = useUpdateCity();
//   const deleteCity = useDeleteCity();

//   const createSite = useCreateSite();
//   const updateSite = useUpdateSite();
//   const deleteSite = useDeleteSite();

//   const createPayRegister = useCreatePayRegister();
//   const updatePayRegister = useUpdatePayRegister();
//   const deletePayRegister = useDeletePayRegister();

//   // ─── Filtered Data ────────────────────────────────────────────────────────
//   const listItems = useMemo(() => {
//     const query = filterText.toLowerCase().trim();

//     switch (activeTab) {
//       case 'state_country':
//       case 'address_state':
//         return states
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.country ? `, ${s.country.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.country_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'city':
//       case 'address_city':
//         return cities
//           .map((c) => ({
//             id: c.id,
//             name: `${c.name}${c.state ? `, ${c.state.name}` : ''}`,
//             rawName: c.name,
//             parentId: c.state_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'site':
//         return sites
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.city ? `, ${s.city.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.city_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'address_country':
//         return countries
//           .map((c) => ({ id: c.id, name: c.name, rawName: c.name }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'pay_register':
//         return payRegisters
//           .map((p) => ({
//             id: p.id,
//             name: `${p.name}${p.state ? `, ${p.state.name}` : ''}`,
//             rawName: p.name,
//             parentId: p.state_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       default:
//         return [];
//     }
//   }, [activeTab, filterText, states, cities, sites, countries, payRegisters]);

//   // ─── Permission gates for the current tab ────────────────────────────────
//   const currentFieldKey = TAB_TO_FIELD_KEY[activeTab];
//   const canAddCurrent = canCreate('location') && fCreate(currentFieldKey).can_edit;
//   const canEditCurrent = canEdit('location') && f(currentFieldKey).can_edit;
//   const canDeleteCurrent = canDelete('location');

//   // ─── Handlers — gated internally regardless of whether SimpleMasterList
//   //     ends up hiding/disabling the corresponding button (see note below) ──
//   const handleAdd = async () => {
//     if (!newTitle.trim() || !canAddCurrent) return;

//     try {
//       if (activeTab === 'state_country' || activeTab === 'address_state') {
//         const countryId = selectedParentId || countries[0]?.id || 1;
//         await createState.mutateAsync({ name: newTitle.trim(), country_id: countryId });
//       } else if (activeTab === 'city' || activeTab === 'address_city') {
//         const stateId = selectedParentId || states[0]?.id || 1;
//         await createCity.mutateAsync({ name: newTitle.trim(), state_id: stateId });
//       } else if (activeTab === 'site') {
//         await createSite.mutateAsync({ name: newTitle.trim(), company_id: 1, city_id: selectedParentId || undefined });
//       } else if (activeTab === 'address_country') {
//         await createCountry.mutateAsync({ name: newTitle.trim() });
//       } else if (activeTab === 'pay_register') {
//         await createPayRegister.mutateAsync({ name: newTitle.trim(), company_id: 1, state_id: selectedParentId || undefined });
//       }

//       setNewTitle('');
//       setSelectedParentId(null);
//     } catch (err: any) {
//       // Without this, a backend rejection (validation error, 500, etc.)
//       // just silently does nothing — indistinguishable from "not working".
//       console.error('[Locations] add failed:', err);
//       showToast(err?.response?.data?.message || err?.message || 'Failed to add item');
//     }
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editTitle.trim() || !canEditCurrent) return;

//     try {
//       if (activeTab === 'state_country' || activeTab === 'address_state') {
//         await updateState.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'city' || activeTab === 'address_city') {
//         await updateCity.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'site') {
//         await updateSite.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'address_country') {
//         await updateCountry.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'pay_register') {
//         await updatePayRegister.mutateAsync({ id, data: { name: editTitle.trim() } });
//       }

//       setEditingId(null);
//       setEditTitle('');
//     } catch (err: any) {
//       // Previously: an update rejection here would throw past
//       // setEditingId(null) silently, leaving the row stuck open in edit
//       // mode with zero feedback — this is very likely what "editing isn't
//       // working" actually was. Now the real reason surfaces.
//       console.error('[Locations] save edit failed:', err);
//       showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDeleteCurrent) return;
//     if (!confirm('Are you sure you want to delete this item?')) return;

//     try {
//       if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
//       else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
//       else if (activeTab === 'site') await deleteSite.mutateAsync(id);
//       else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
//       else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
//     } catch (err: any) {
//       console.error('[Locations] delete failed:', err);
//       showToast(err?.response?.data?.message || err?.message || 'Failed to delete item');
//     }
//   };

//   const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters || fieldsLoading;

//   // ─── Render Tabs Configuration ───────────────────────────────────────────
//   // Tabs the role can't view are hidden entirely, not just disabled — same
//   // principle as Shifts hiding whole table columns for a field with
//   // can_view: false.
//   const tabDefs: { key: TabKey; label: string; count: number }[] = (
//     [
//       { key: 'state_country', label: 'State / Country', count: states.length },
//       { key: 'city', label: 'City', count: cities.length },
//       { key: 'site', label: 'Site', count: sites.length },
//       { key: 'address_country', label: 'Address Country', count: countries.length },
//       { key: 'address_state', label: 'Address State', count: states.length },
//       { key: 'address_city', label: 'Address City', count: cities.length },
//       { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
//     ] as { key: TabKey; label: string; count: number }[]
//   ).filter((t) => canViewTab(t.key));

//   return (
//     <PermissionGuard permission="location:view">
//       <AppShell>
//         <MasterDataLayout>
//           <SimpleMasterList
//             title="Locations"
//             subtitle="Work site hierarchy · Address country / state / city for employee forms"
//             addPlaceholder={`Add ${tabDefs.find((t) => t.key === activeTab)?.label.toLowerCase() ?? ''}...`}
//             emptyText="No records found."
//             isLoading={isLoading}
//             items={listItems}
//             tabs={tabDefs.map((t) => ({
//               label: t.label,
//               count: t.count,
//               active: activeTab === t.key,
//               onClick: () => {
//                 setActiveTab(t.key);
//                 setFilterText('');
//                 setEditingId(null);
//               },
//             }))}
//             addExtra={
//               !canAddCurrent ? undefined :
//               (activeTab === 'state_country' || activeTab === 'address_state') ? (
//                 <div className="fg" style={{ margin: 0, width: 180 }}>
//                   <Select
//                     value={selectedParentId ?? ''}
//                     onChange={(v) => setSelectedParentId(Number(v))}
//                     options={countries.map((c) => ({ value: c.id, label: c.name }))}
//                     placeholder="Select Country"
//                     filter
//                   />
//                 </div>
//               ) : (activeTab === 'city' || activeTab === 'address_city') ? (
//                 <div className="fg" style={{ margin: 0, width: 180 }}>
//                   <Select
//                     value={selectedParentId ?? ''}
//                     onChange={(v) => setSelectedParentId(Number(v))}
//                     options={states.map((s) => ({ value: s.id, label: s.name }))}
//                     placeholder="Select State"
//                     filter
//                   />
//                 </div>
//               ) : undefined
//             }
//             name={newTitle}
//             onNameChange={setNewTitle}
//             // onAdd itself stays required and permission-checked internally
//             // as a safety net, but visibility is now actually controlled by
//             // canAdd below (SimpleMasterList hides the whole add-row).
//             onAdd={handleAdd}
//             filterText={filterText}
//             onFilterChange={setFilterText}
//             editingId={editingId}
//             editName={editTitle}
//             onEditNameChange={setEditTitle}
//             onStartEdit={(item: { id: number; name: string; rawName: string }) => {
//               // TEMP DEBUG
//               console.log('[LocationsPage] onStartEdit called', { item, canEditCurrent, activeTab, currentFieldKey });
//               if (!canEditCurrent) {
//                 console.log('[LocationsPage] onStartEdit BLOCKED — canEditCurrent is false');
//                 return;
//               }
//               setEditingId(item.id);
//               setEditTitle(item.rawName);
//               console.log('[LocationsPage] setEditingId called with', item.id);
//             }}
//             onSaveEdit={handleSaveEdit}
//             onCancelEdit={() => {
//               setEditingId(null);
//               setEditTitle('');
//             }}
//             onDelete={handleDelete}
//             canAdd={canAddCurrent}
//             canEdit={canEditCurrent}
//             canDelete={canDeleteCurrent}
//             fieldPerm={f(currentFieldKey)}
//           />
//         </MasterDataLayout>
//       </AppShell>
//     </PermissionGuard>
//   );
// }



// 'use client';

// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
// import { AppShell } from '@/layouts/AppLayout';
// import { GripVertical, Pencil, X, Plus, Search, Lock } from 'lucide-react';
// import {
//   useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
//   useStates, useCreateState, useUpdateState, useDeleteState,
//   useCities, useCreateCity, useUpdateCity, useDeleteCity,
//   useSites, useCreateSite, useUpdateSite, useDeleteSite,
//   usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
// } from '@/features/locations/hooks/uselocation';
// import { usePermission } from '@/features/auth/hooks/useAuth';
// import { PermissionGuard } from '@/utils/permissionGuard';
// import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
// import { maskedView } from '@/components/form/maskField';
// import { showToast } from '@/utils/toast';

// // ─── Active Tab Types ────────────────────────────────────────────────────────
// type TabKey =
//   | 'state_country'
//   | 'city'
//   | 'site'
//   | 'address_country'
//   | 'address_state'
//   | 'address_city'
//   | 'pay_register';

// // Each tab edits one underlying entity's "name" field — maps to the field_key
// // from location-seed.sql. address_state/address_city are alternate VIEWS of
// // the same state/city records as state_country/city, so they share a
// // field_key rather than having their own.
// const TAB_TO_FIELD_KEY: Record<TabKey, string> = {
//   state_country: 'state_name',
//   address_state: 'state_name',
//   city: 'city_name',
//   address_city: 'city_name',
//   site: 'site_name',
//   address_country: 'country_name',
//   pay_register: 'pay_register_name',
// };

// const ALL_TABS = Object.keys(TAB_TO_FIELD_KEY) as TabKey[];

// export default function LocationsPage() {
//   // Resource name is 'location' (singular) throughout, matching the real
//   // backend slug — confirmed after 'locations' (plural) silently failed
//   // every check.
//   const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
//   const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('location');

//   const f = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );
//   const fCreate = useCallback(
//     (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
//     [fp, isSuperAdmin]
//   );
//   const canViewTab = useCallback((tab: TabKey) => f(TAB_TO_FIELD_KEY[tab]).can_view, [f]);

//   const [activeTab, setActiveTab] = useState<TabKey>('state_country');
//   const [filterText, setFilterText] = useState('');

//   // New Item Input State
//   const [newTitle, setNewTitle] = useState('');
//   const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

//   // Edit Inline State
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editTitle, setEditTitle] = useState('');

//   // Fall back to the first viewable tab if the active one isn't (or becomes)
//   // visible for this role.
//   useEffect(() => {
//     if (fieldsLoading) return;
//     if (!canViewTab(activeTab)) {
//       const firstVisible = ALL_TABS.find(canViewTab);
//       if (firstVisible) setActiveTab(firstVisible);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fieldsLoading, fp, isSuperAdmin]);

//   // ─── React Query Hooks ────────────────────────────────────────────────────
//   const { data: countries = [], isLoading: loadingCountries } = useCountries();
//   const { data: states = [], isLoading: loadingStates } = useStates();
//   const { data: cities = [], isLoading: loadingCities } = useCities();
//   const { data: sites = [], isLoading: loadingSites } = useSites();
//   const { data: payRegisters = [], isLoading: loadingPayRegisters } = usePayRegisters();

//   // Mutations
//   const createCountry = useCreateCountry();
//   const updateCountry = useUpdateCountry();
//   const deleteCountry = useDeleteCountry();

//   const createState = useCreateState();
//   const updateState = useUpdateState();
//   const deleteState = useDeleteState();

//   const createCity = useCreateCity();
//   const updateCity = useUpdateCity();
//   const deleteCity = useDeleteCity();

//   const createSite = useCreateSite();
//   const updateSite = useUpdateSite();
//   const deleteSite = useDeleteSite();

//   const createPayRegister = useCreatePayRegister();
//   const updatePayRegister = useUpdatePayRegister();
//   const deletePayRegister = useDeletePayRegister();

//   // ─── Filtered Data ────────────────────────────────────────────────────────
//   const listItems = useMemo(() => {
//     const query = filterText.toLowerCase().trim();

//     switch (activeTab) {
//       case 'state_country':
//       case 'address_state':
//         return states
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.country ? `, ${s.country.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.country_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'city':
//       case 'address_city':
//         return cities
//           .map((c) => ({
//             id: c.id,
//             name: `${c.name}${c.state ? `, ${c.state.name}` : ''}`,
//             rawName: c.name,
//             parentId: c.state_id,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'site':
//         return sites
//           .map((s) => ({
//             id: s.id,
//             name: `${s.name}${s.city ? `, ${s.city.name}` : ''}`,
//             rawName: s.name,
//             parentId: s.city_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'address_country':
//         return countries
//           .map((c) => ({ id: c.id, name: c.name, rawName: c.name }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       case 'pay_register':
//         return payRegisters
//           .map((p) => ({
//             id: p.id,
//             name: `${p.name}${p.state ? `, ${p.state.name}` : ''}`,
//             rawName: p.name,
//             parentId: p.state_id ?? undefined,
//           }))
//           .filter((item) => item.name.toLowerCase().includes(query));

//       default:
//         return [];
//     }
//   }, [activeTab, filterText, states, cities, sites, countries, payRegisters]);

//   // ─── Permission gates for the current tab ────────────────────────────────
//   const currentFieldKey = TAB_TO_FIELD_KEY[activeTab];
//   const fieldPerm = f(currentFieldKey);
//   const canAddCurrent = canCreate('location') && fCreate(currentFieldKey).can_edit;
//   const canEditCurrent = canEdit('location') && fieldPerm.can_edit;
//   const canDeleteCurrent = canDelete('location');

//   // ─── Handlers ─────────────────────────────────────────────────────────────
//   const handleAdd = async () => {
//     if (!newTitle.trim() || !canAddCurrent) return;

//     try {
//       if (activeTab === 'state_country' || activeTab === 'address_state') {
//         const countryId = selectedParentId || countries[0]?.id || 1;
//         await createState.mutateAsync({ name: newTitle.trim(), country_id: countryId });
//       } else if (activeTab === 'city' || activeTab === 'address_city') {
//         const stateId = selectedParentId || states[0]?.id || 1;
//         await createCity.mutateAsync({ name: newTitle.trim(), state_id: stateId });
//       } else if (activeTab === 'site') {
//         await createSite.mutateAsync({ name: newTitle.trim(), company_id: 1, city_id: selectedParentId || undefined });
//       } else if (activeTab === 'address_country') {
//         await createCountry.mutateAsync({ name: newTitle.trim() });
//       } else if (activeTab === 'pay_register') {
//         await createPayRegister.mutateAsync({ name: newTitle.trim(), company_id: 1, state_id: selectedParentId || undefined });
//       }

//       setNewTitle('');
//       setSelectedParentId(null);
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to add item');
//     }
//   };

//   const startEdit = (id: number, rawName: string) => {
//     if (!canEditCurrent) return;
//     setEditingId(id);
//     setEditTitle(rawName);
//   };

//   const handleSaveEdit = async (id: number) => {
//     if (!editTitle.trim() || !canEditCurrent) return;

//     try {
//       if (activeTab === 'state_country' || activeTab === 'address_state') {
//         await updateState.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'city' || activeTab === 'address_city') {
//         await updateCity.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'site') {
//         await updateSite.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'address_country') {
//         await updateCountry.mutateAsync({ id, data: { name: editTitle.trim() } });
//       } else if (activeTab === 'pay_register') {
//         await updatePayRegister.mutateAsync({ id, data: { name: editTitle.trim() } });
//       }

//       setEditingId(null);
//       setEditTitle('');
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!canDeleteCurrent) return;
//     if (!confirm('Are you sure you want to delete this item?')) return;

//     try {
//       if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
//       else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
//       else if (activeTab === 'site') await deleteSite.mutateAsync(id);
//       else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
//       else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
//     } catch (err: any) {
//       showToast(err?.response?.data?.message || err?.message || 'Failed to delete item');
//     }
//   };

//   const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters || fieldsLoading;

//   // ─── Render Tabs Configuration ───────────────────────────────────────────
//   // Tabs the role can't view are dropped entirely, not just disabled.
//   const tabs: { key: TabKey; label: string; count: number }[] = (
//     [
//       { key: 'state_country', label: 'State / Country', count: states.length },
//       { key: 'city', label: 'City', count: cities.length },
//       { key: 'site', label: 'Site', count: sites.length },
//       { key: 'address_country', label: 'Address Country', count: countries.length },
//       { key: 'address_state', label: 'Address State', count: states.length },
//       { key: 'address_city', label: 'Address City', count: cities.length },
//       { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
//     ] as { key: TabKey; label: string; count: number }[]
//   ).filter((t) => canViewTab(t.key));

//   return (
//     <PermissionGuard permission="location:view">
//       <AppShell>
//         <MasterDataLayout>
//           <div className="flex h-full w-full flex-col bg-white p-6 font-sans text-gray-800">
//             {/* Header Bar */}
//             <div className="flex items-center justify-between pb-3">
//               <div>
//                 <h1 className="text-xl font-bold tracking-tight text-gray-900">Locations</h1>
//                 <p className="text-xs text-gray-400">
//                   Work site hierarchy · Address country / state / city for employee forms
//                 </p>
//               </div>
//               <div className="flex items-center gap-3">
//                 <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
//                   AUTO-SAVE ON
//                 </span>
//               </div>
//             </div>

//             {/* Navigation Tabs */}
//             <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
//               {tabs.map((tab) => {
//                 const active = activeTab === tab.key;
//                 return (
//                   <button
//                     key={tab.key}
//                     onClick={() => {
//                       setActiveTab(tab.key);
//                       setFilterText('');
//                       setEditingId(null);
//                     }}
//                     className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
//                       active
//                         ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20'
//                         : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
//                     }`}
//                   >
//                     {tab.label}
//                     <span
//                       className={`text-[10px] ${
//                         active ? 'font-bold text-blue-600' : 'text-gray-400'
//                       }`}
//                     >
//                       {tab.count}
//                     </span>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Quick-Add Bar — hidden entirely when the role can't add to this tab's field */}
//             {canAddCurrent && (
//               <div className="flex items-center gap-2 py-4">
//                 <input
//                   type="text"
//                   value={newTitle}
//                   onChange={(e) => setNewTitle(e.target.value)}
//                   placeholder={`Add ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase() ?? ''}...`}
//                   className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
//                   onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
//                 />

//                 {/* Parent selector conditionally shown for hierarchical entities */}
//                 {(activeTab === 'state_country' || activeTab === 'address_state') && (
//                   <select
//                     value={selectedParentId ?? ''}
//                     onChange={(e) => setSelectedParentId(Number(e.target.value))}
//                     className="h-10 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-400"
//                   >
//                     <option value="">Select Country</option>
//                     {countries.map((c) => (
//                       <option key={c.id} value={c.id}>
//                         {c.name}
//                       </option>
//                     ))}
//                   </select>
//                 )}

//                 {(activeTab === 'city' || activeTab === 'address_city') && (
//                   <select
//                     value={selectedParentId ?? ''}
//                     onChange={(e) => setSelectedParentId(Number(e.target.value))}
//                     className="h-10 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-400"
//                   >
//                     <option value="">Select State</option>
//                     {states.map((s) => (
//                       <option key={s.id} value={s.id}>
//                         {s.name}
//                       </option>
//                     ))}
//                   </select>
//                 )}

//                 <button
//                   onClick={handleAdd}
//                   className="flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
//                 >
//                   <Plus size={14} />
//                   Add
//                 </button>
//               </div>
//             )}

//             {/* Filter Bar */}
//             <div className="flex items-center justify-between py-2">
//               <div className="relative w-64">
//                 <input
//                   type="text"
//                   value={filterText}
//                   onChange={(e) => setFilterText(e.target.value)}
//                   placeholder="Filter..."
//                   className="h-8 w-full rounded-md border border-gray-200 bg-white pl-3 pr-8 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
//                 />
//               </div>
//               <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
//                 {listItems.length}
//               </span>
//             </div>

//             {/* List Section */}
//             <div className="min-h-0 flex-1 overflow-y-auto pt-2">
//               {isLoading ? (
//                 <div className="py-8 text-center text-xs text-gray-400">Loading location data...</div>
//               ) : listItems.length === 0 ? (
//                 <div className="py-8 text-center text-xs text-gray-400">No records found.</div>
//               ) : (
//                 <div className="space-y-1">
//                   {listItems.map((item, index) => {
//                     const isEditingRow = editingId === item.id;
//                     const mv = maskedView(item.rawName, fieldPerm);
//                     const displayText =
//                       mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

//                     return (
//                       <div
//                         key={item.id}
//                         className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50/80"
//                       >
//                         <div className="flex flex-1 items-center gap-3">
//                           <GripVertical size={14} className="cursor-grab text-gray-300 opacity-60 group-hover:opacity-100" />
//                           <span className="min-w-[18px] text-left text-[11px] font-semibold text-gray-300">
//                             {index + 1}
//                           </span>

//                           {isEditingRow ? (
//                             <input
//                               type="text"
//                               value={editTitle}
//                               onChange={(e) => setEditTitle(e.target.value)}
//                               onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
//                               className="h-7 w-64 rounded border border-blue-400 px-2 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-blue-100"
//                               autoFocus
//                             />
//                           ) : (
//                             <span
//                               className="flex items-center gap-1 text-xs font-semibold text-gray-800"
//                               data-nocopy={mv.noCopy || undefined}
//                               onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
//                               onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
//                               onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
//                             >
//                               {displayText}
//                               {mv.kind !== 'none' && <Lock size={10} className="text-gray-400" />}
//                             </span>
//                           )}
//                         </div>

//                         <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
//                           {isEditingRow ? (
//                             <button
//                               onClick={() => handleSaveEdit(item.id)}
//                               className="text-xs font-semibold text-blue-600 hover:text-blue-700"
//                             >
//                               Save
//                             </button>
//                           ) : (
//                             canEditCurrent && mv.kind === 'none' && (
//                               <button
//                                 onClick={() => startEdit(item.id, item.rawName)}
//                                 className="text-gray-400 hover:text-gray-600"
//                                 title="Edit"
//                               >
//                                 <Pencil size={13} />
//                               </button>
//                             )
//                           )}
//                           {canDeleteCurrent && (
//                             <button
//                               onClick={() => handleDelete(item.id)}
//                               className="text-gray-400 hover:text-red-600"
//                               title="Delete"
//                             >
//                               <X size={14} />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>
//         </MasterDataLayout>
//       </AppShell>
//     </PermissionGuard>
//   );
// }




'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { GripVertical, Pencil, X, Plus, Search, Lock } from 'lucide-react';
import {
  useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry,
  useStates, useCreateState, useUpdateState, useDeleteState,
  useCities, useCreateCity, useUpdateCity, useDeleteCity,
  useSites, useCreateSite, useUpdateSite, useDeleteSite,
  usePayRegisters, useCreatePayRegister, useUpdatePayRegister, useDeletePayRegister,
} from '@/features/locations/hooks/uselocation';
import { usePermission } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/utils/permissionGuard';
import { useFieldPermissions, resolveFieldPerm } from '@/features/rbac/hooks/useFieldPermissions';
import { maskedView } from '@/components/form/maskField';
import { showToast } from '@/utils/toast';

// ─── Active Tab Types ────────────────────────────────────────────────────────
type TabKey =
  | 'state_country'
  | 'city'
  | 'site'
  | 'address_country'
  | 'address_state'
  | 'address_city'
  | 'pay_register';

// Each tab edits one underlying entity's "name" field — maps to the field_key
// from location-seed.sql. address_state/address_city are alternate VIEWS of
// the same state/city records as state_country/city, so they share a
// field_key rather than having their own.
const TAB_TO_FIELD_KEY: Record<TabKey, string> = {
  state_country: 'state_name',
  address_state: 'state_name',
  city: 'city_name',
  address_city: 'city_name',
  site: 'site_name',
  address_country: 'country_name',
  pay_register: 'pay_register_name',
};

const ALL_TABS = Object.keys(TAB_TO_FIELD_KEY) as TabKey[];

export default function LocationsPage() {
  // Resource name is 'location' (singular) throughout, matching the real
  // backend slug — confirmed after 'locations' (plural) silently failed
  // every check.
  const { canCreate, canEdit, canDelete, isSuperAdmin } = usePermission();
  const { data: fp, isLoading: fieldsLoading } = useFieldPermissions('location');

  const f = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 100, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const fCreate = useCallback(
    (key: string) => resolveFieldPerm(fp, key, { completionPct: 0, bypass: isSuperAdmin }),
    [fp, isSuperAdmin]
  );
  const canViewTab = useCallback((tab: TabKey) => f(TAB_TO_FIELD_KEY[tab]).can_view, [f]);

  const [activeTab, setActiveTab] = useState<TabKey>('state_country');
  const [filterText, setFilterText] = useState('');

  // New Item Input State
  const [newTitle, setNewTitle] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  // Edit Inline State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Fall back to the first viewable tab if the active one isn't (or becomes)
  // visible for this role.
  useEffect(() => {
    if (fieldsLoading) return;
    if (!canViewTab(activeTab)) {
      const firstVisible = ALL_TABS.find(canViewTab);
      if (firstVisible) setActiveTab(firstVisible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldsLoading, fp, isSuperAdmin]);

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

  // ─── Permission gates for the current tab ────────────────────────────────
  const currentFieldKey = TAB_TO_FIELD_KEY[activeTab];
  const fieldPerm = f(currentFieldKey);
  const canAddCurrent = canCreate('location') && fCreate(currentFieldKey).can_edit;
  const canEditCurrent = canEdit('location') && fieldPerm.can_edit;
  const canDeleteCurrent = canDelete('location');

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newTitle.trim() || !canAddCurrent) return;

    try {
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
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to add item');
    }
  };

  const startEdit = (id: number, rawName: string) => {
    if (!canEditCurrent) return;
    setEditingId(id);
    setEditTitle(rawName);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim() || !canEditCurrent) return;

    try {
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
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDeleteCurrent) return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (activeTab === 'state_country' || activeTab === 'address_state') await deleteState.mutateAsync(id);
      else if (activeTab === 'city' || activeTab === 'address_city') await deleteCity.mutateAsync(id);
      else if (activeTab === 'site') await deleteSite.mutateAsync(id);
      else if (activeTab === 'address_country') await deleteCountry.mutateAsync(id);
      else if (activeTab === 'pay_register') await deletePayRegister.mutateAsync(id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete item');
    }
  };

  const isLoading = loadingCountries || loadingStates || loadingCities || loadingSites || loadingPayRegisters || fieldsLoading;

  // ─── Render Tabs Configuration ───────────────────────────────────────────
  // Tabs the role can't view are dropped entirely, not just disabled.
  const tabs: { key: TabKey; label: string; count: number }[] = (
    [
      { key: 'state_country', label: 'State / Country', count: states.length },
      { key: 'city', label: 'City', count: cities.length },
      { key: 'site', label: 'Site', count: sites.length },
      { key: 'address_country', label: 'Address Country', count: countries.length },
      { key: 'address_state', label: 'Address State', count: states.length },
      { key: 'address_city', label: 'Address City', count: cities.length },
      { key: 'pay_register', label: 'Pay Register', count: payRegisters.length },
    ] as { key: TabKey; label: string; count: number }[]
  ).filter((t) => canViewTab(t.key));

  return (
    <PermissionGuard permission="location:view">
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

            {/* Quick-Add Bar — hidden entirely when the role can't add to this tab's field */}
            {canAddCurrent && (
              <div className="flex items-center gap-2 py-4">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={`Add ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase() ?? ''}...`}
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
            )}

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
                  {listItems.map((item, index) => {
                    const isEditingRow = editingId === item.id;
                    const mv = maskedView(item.rawName, fieldPerm);
                    const displayText =
                      mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50/80"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <GripVertical size={14} className="cursor-grab text-gray-300 opacity-60 group-hover:opacity-100" />
                          <span className="min-w-[18px] text-left text-[11px] font-semibold text-gray-300">
                            {index + 1}
                          </span>

                          {isEditingRow ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                              className="h-7 w-64 rounded border border-blue-400 px-2 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-blue-100"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="flex items-center gap-1 text-xs font-semibold text-gray-800"
                              data-nocopy={mv.noCopy || undefined}
                              onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
                              onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
                              onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
                            >
                              {displayText}
                              {mv.kind !== 'none' && <Lock size={10} className="text-gray-400" />}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          {isEditingRow ? (
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Save
                            </button>
                          ) : (
                            canEditCurrent && mv.kind === 'none' && (
                              <button
                                onClick={() => startEdit(item.id, item.rawName)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                            )
                          )}
                          {canDeleteCurrent && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </MasterDataLayout>
      </AppShell>
    </PermissionGuard>
  );
}