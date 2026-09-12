'use client';

import { ReactNode, useState } from 'react';
import { GripVertical, Pencil, X, Check } from 'lucide-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chip } from '@/components/ui/Chip';

export interface MasterListItem {
  id: number;
  name: string;
}

export interface MasterListTab {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

interface SimpleMasterListProps<T extends MasterListItem> {
  title: string;
  subtitle?: string;
  addPlaceholder: string;
  items: T[];
  isLoading?: boolean;
  emptyText?: string;
  tabs?: MasterListTab[];

  name: string;
  onNameChange: (value: string) => void;
  onAdd: () => void;

  filterText: string;
  onFilterChange: (value: string) => void;

  editingId: number | null;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartEdit: (item: T) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;

  headerExtra?: ReactNode;
  /** Extra control rendered between the add-input and the Add button (e.g. a parent-select dropdown). */
  addExtra?: ReactNode;
  /** Extra content rendered between the filter row and the table (e.g. a sub-editor section). */
  extraBeforeList?: ReactNode;
}

/**
 * Shared presentation layer for the ~20 "single-field lookup" master pages
 * (Gender, Blood Group, Notice Period, Employee Status, ...). Every page
 * keeps 100% of its own state/hooks/mutations — this component only renders
 * them, using the same .card/.btn/.search-bar/.tw table/Chip tokens as the
 * rest of the app instead of ad-hoc Tailwind, so every master list looks and
 * behaves the same way.
 */
export function SimpleMasterList<T extends MasterListItem>({
  title,
  subtitle = 'Used across Add Employee, filters & transfers',
  addPlaceholder,
  items,
  isLoading = false,
  emptyText = 'No records match these filters.',
  tabs,
  name,
  onNameChange,
  onAdd,
  filterText,
  onFilterChange,
  editingId,
  editName,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  headerExtra,
  addExtra,
  extraBeforeList,
}: SimpleMasterListProps<T>) {
  // Selection is visual-only here — none of the lookup master pages expose a
  // bulk action, but the checkboxes keep every listing table consistent.
  const [selected, setSelected] = useState<T[]>([]);

  const selectedIds = new Set(selected.map((i) => i.id));
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected([...selected, ...items.filter((i) => !selectedIds.has(i.id))]);
    else {
      const pageIds = new Set(items.map((i) => i.id));
      setSelected(selected.filter((i) => !pageIds.has(i.id)));
    }
  };

  const nameBody = (item: T) => {
    const isEditing = editingId === item.id;
    return isEditing ? (
      <div className="master-inline-edit">
        <input
          type="text"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit(item.id);
            if (e.key === 'Escape') onCancelEdit();
          }}
          autoFocus
        />
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id)}>
          <Check size={14} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
          <X size={14} />
        </button>
      </div>
    ) : (
      <strong
        style={{ cursor: 'pointer' }}
        title="Double-click to edit"
        onDoubleClick={() => onStartEdit(item)}
      >
        {item.name}
      </strong>
    );
  };

  const actionsBody = (item: T) => (
    editingId === item.id ? null : (
      <div className="master-row-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartEdit(item)}>
          <Pencil size={13} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
          <X size={14} />
        </button>
      </div>
    )
  );

  return (
    <div className="pg-enter">
      <div className="ph">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="ph-r">{headerExtra}</div>
      </div>

      {tabs && tabs.length > 0 && (
        <div className="tabs mb14">
          {tabs.map((tab) => (
            <div
              key={tab.label}
              className={`tab${tab.active ? ' on' : ''}`}
              onClick={tab.onClick}
            >
              {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
            </div>
          ))}
        </div>
      )}

      <div className="card cp">
        <div className="master-add-row">
          <div className="fg" style={{ margin: 0, flex: 1 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              placeholder={addPlaceholder}
            />
          </div>
          {addExtra}
          <button type="button" className="btn btn-pri btn-sm" onClick={onAdd}>
            Add
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
          <div className="search-bar" style={{ maxWidth: 220 }}>
            <span style={{ color: 'var(--ink4)' }}>⌕</span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Filter..."
            />
          </div>
          <Chip variant="gray">{items.length}</Chip>
        </div>

        {extraBeforeList}

        <div className="tw">
          <DataTable
            value={isLoading ? [] : items}
            loading={isLoading}
            dataKey="id"
            selection={selected}
            selectionMode="checkbox"
            selectAll={allSelected}
            onSelectAllChange={(e) => handleSelectAll(e.checked)}
            onSelectionChange={(e) => setSelected((e.value ?? []) as T[])}
            emptyMessage={emptyText}
            className="p-datatable-sm"
            tableStyle={{ minWidth: '360px' }}
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column
              headerStyle={{ width: 28 }}
              body={() => <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />}
            />
            <Column header="Name" body={nameBody} />
            <Column header="Actions" headerStyle={{ width: 90, textAlign: 'right' }} body={actionsBody} />
          </DataTable>
        </div>
      </div>
    </div>
  );
}






// 'use client';

// import { ReactNode, useState } from 'react';
// import { GripVertical, Pencil, X, Check } from 'lucide-react';
// import { DataTable } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { Chip } from '@/components/ui/Chip';

// export interface MasterListItem {
//   id: number;
//   name: string;
// }

// export interface MasterListTab {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }

// interface SimpleMasterListProps<T extends MasterListItem> {
//   title: string;
//   subtitle?: string;
//   addPlaceholder: string;
//   items: T[];
//   isLoading?: boolean;
//   emptyText?: string;
//   tabs?: MasterListTab[];

//   name: string;
//   onNameChange: (value: string) => void;
//   onAdd: () => void;

//   filterText: string;
//   onFilterChange: (value: string) => void;

//   editingId: number | null;
//   editName: string;
//   onEditNameChange: (value: string) => void;
//   onStartEdit: (item: T) => void;
//   onSaveEdit: (id: number) => void;
//   onCancelEdit: () => void;
//   onDelete: (id: number) => void;

//   headerExtra?: ReactNode;
//   /** Extra control rendered between the add-input and the Add button (e.g. a parent-select dropdown). */
//   addExtra?: ReactNode;
//   /** Extra content rendered between the filter row and the table (e.g. a sub-editor section). */
//   extraBeforeList?: ReactNode;

//   /**
//    * Permission gates. Each defaults to true (no restriction) so existing
//    * callers that don't pass these keep working exactly as before. When
//    * false, the corresponding UI is actually removed — not just disabled,
//    * and not left for the caller's handler to silently no-op:
//    *   canAdd:    hides the entire add-row (input + addExtra + Add button)
//    *   canEdit:   hides the Pencil button and disables double-click-to-edit
//    *   canDelete: hides the delete (X) button
//    * If both canEdit and canDelete are false, the Actions column itself is
//    * dropped rather than rendered empty.
//    */
//   canAdd?: boolean;
//   canEdit?: boolean;
//   canDelete?: boolean;
// }

// /**
//  * Shared presentation layer for the ~20 "single-field lookup" master pages
//  * (Gender, Blood Group, Notice Period, Employee Status, ...). Every page
//  * keeps 100% of its own state/hooks/mutations — this component only renders
//  * them, using the same .card/.btn/.search-bar/.tw table/Chip tokens as the
//  * rest of the app instead of ad-hoc Tailwind, so every master list looks and
//  * behaves the same way.
//  */
// export function SimpleMasterList<T extends MasterListItem>({
//   title,
//   subtitle = 'Used across Add Employee, filters & transfers',
//   addPlaceholder,
//   items,
//   isLoading = false,
//   emptyText = 'No records match these filters.',
//   tabs,
//   name,
//   onNameChange,
//   onAdd,
//   filterText,
//   onFilterChange,
//   editingId,
//   editName,
//   onEditNameChange,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onDelete,
//   headerExtra,
//   addExtra,
//   extraBeforeList,
//   canAdd = true,
//   canEdit = true,
//   canDelete = true,
// }: SimpleMasterListProps<T>) {
//   // Selection is visual-only here — none of the lookup master pages expose a
//   // bulk action, but the checkboxes keep every listing table consistent.
//   const [selected, setSelected] = useState<T[]>([]);

//   const selectedIds = new Set(selected.map((i) => i.id));
//   const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) setSelected([...selected, ...items.filter((i) => !selectedIds.has(i.id))]);
//     else {
//       const pageIds = new Set(items.map((i) => i.id));
//       setSelected(selected.filter((i) => !pageIds.has(i.id)));
//     }
//   };

//   const showActionsColumn = canEdit || canDelete;

//   const nameBody = (item: T) => {
//     const isEditing = editingId === item.id;
//     if (isEditing) {
//       return (
//         <div className="master-inline-edit">
//           <input
//             type="text"
//             value={editName}
//             onChange={(e) => onEditNameChange(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') onSaveEdit(item.id);
//               if (e.key === 'Escape') onCancelEdit();
//             }}
//             autoFocus
//           />
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id)}>
//             <Check size={14} />
//           </button>
//           <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
//             <X size={14} />
//           </button>
//         </div>
//       );
//     }
//     return (
//       <strong
//         style={canEdit ? { cursor: 'pointer' } : undefined}
//         title={canEdit ? 'Double-click to edit' : undefined}
//         onDoubleClick={canEdit ? () => onStartEdit(item) : undefined}
//       >
//         {item.name}
//       </strong>
//     );
//   };

//   const actionsBody = (item: T) => {
//     if (editingId === item.id) return null;
//     if (!canEdit && !canDelete) return null;
//     return (
//       <div className="master-row-actions">
//         {canEdit && (
//           <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartEdit(item)}>
//             <Pencil size={13} />
//           </button>
//         )}
//         {canDelete && (
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
//             <X size={14} />
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="pg-enter">
//       <div className="ph">
//         <div>
//           <h1>{title}</h1>
//           <p>{subtitle}</p>
//         </div>
//         <div className="ph-r">{headerExtra}</div>
//       </div>

//       {tabs && tabs.length > 0 && (
//         <div className="tabs mb14">
//           {tabs.map((tab) => (
//             <div
//               key={tab.label}
//               className={`tab${tab.active ? ' on' : ''}`}
//               onClick={tab.onClick}
//             >
//               {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="card cp">
//         {canAdd && (
//           <div className="master-add-row">
//             <div className="fg" style={{ margin: 0, flex: 1 }}>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => onNameChange(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && onAdd()}
//                 placeholder={addPlaceholder}
//               />
//             </div>
//             {addExtra}
//             <button type="button" className="btn btn-pri btn-sm" onClick={onAdd}>
//               Add
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
//           <div className="search-bar" style={{ maxWidth: 220 }}>
//             <span style={{ color: 'var(--ink4)' }}>⌕</span>
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => onFilterChange(e.target.value)}
//               placeholder="Filter..."
//             />
//           </div>
//           <Chip variant="gray">{items.length}</Chip>
//         </div>

//         {extraBeforeList}

//         <div className="tw">
//           <DataTable
//             value={isLoading ? [] : items}
//             loading={isLoading}
//             dataKey="id"
//             selection={selected}
//             selectionMode="checkbox"
//             selectAll={allSelected}
//             onSelectAllChange={(e) => handleSelectAll(e.checked)}
//             onSelectionChange={(e) => setSelected((e.value ?? []) as T[])}
//             emptyMessage={emptyText}
//             className="p-datatable-sm"
//             tableStyle={{ minWidth: '360px' }}
//           >
//             <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
//             <Column
//               headerStyle={{ width: 28 }}
//               body={() => <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />}
//             />
//             <Column header="Name" body={nameBody} />
//             {showActionsColumn && (
//               <Column header="Actions" headerStyle={{ width: 90, textAlign: 'right' }} body={actionsBody} />
//             )}
//           </DataTable>
//         </div>
//       </div>
//     </div>
//   );
// }




// 'use client';

// import { ReactNode, useState } from 'react';
// import { GripVertical, Pencil, X, Check } from 'lucide-react';
// import { DataTable } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { Chip } from '@/components/ui/Chip';
// import { maskedView, type FieldPerm } from '@/components/form/maskField';

// export interface MasterListItem {
//   id: number;
//   name: string;
// }

// export interface MasterListTab {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }

// interface SimpleMasterListProps<T extends MasterListItem> {
//   title: string;
//   subtitle?: string;
//   addPlaceholder: string;
//   items: T[];
//   isLoading?: boolean;
//   emptyText?: string;
//   tabs?: MasterListTab[];

//   name: string;
//   onNameChange: (value: string) => void;
//   onAdd: () => void;

//   filterText: string;
//   onFilterChange: (value: string) => void;

//   editingId: number | null;
//   editName: string;
//   onEditNameChange: (value: string) => void;
//   onStartEdit: (item: T) => void;
//   onSaveEdit: (id: number) => void;
//   onCancelEdit: () => void;
//   onDelete: (id: number) => void;

//   headerExtra?: ReactNode;
//   /** Extra control rendered between the add-input and the Add button (e.g. a parent-select dropdown). */
//   addExtra?: ReactNode;
//   /** Extra content rendered between the filter row and the table (e.g. a sub-editor section). */
//   extraBeforeList?: ReactNode;

//   /**
//    * Permission gates. Each defaults to true (no restriction) so existing
//    * callers that don't pass these keep working exactly as before. When
//    * false, the corresponding UI is actually removed — not just disabled,
//    * and not left for the caller's handler to silently no-op:
//    *   canAdd:    hides the entire add-row (input + addExtra + Add button)
//    *   canEdit:   hides the Pencil button and disables double-click-to-edit
//    *   canDelete: hides the delete (X) button
//    * If both canEdit and canDelete are false, the Actions column itself is
//    * dropped rather than rendered empty.
//    */
//   canAdd?: boolean;
//   canEdit?: boolean;
//   canDelete?: boolean;

//   /**
//    * The resolved FieldPermissionEntry for the "name" field this list is
//    * currently showing (e.g. state_name, city_name — whichever field_key the
//    * caller's active tab maps to). When is_masked/is_partial_masked is set,
//    * the displayed name is masked the same way FormInput masks a value, and
//    * copy is blocked. Omit if this list has no associated field permission
//    * (e.g. callers not yet wired to the RBAC field-permission system).
//    */
//   fieldPerm?: FieldPerm;
// }

// /**
//  * Shared presentation layer for the ~20 "single-field lookup" master pages
//  * (Gender, Blood Group, Notice Period, Employee Status, ...). Every page
//  * keeps 100% of its own state/hooks/mutations — this component only renders
//  * them, using the same .card/.btn/.search-bar/.tw table/Chip tokens as the
//  * rest of the app instead of ad-hoc Tailwind, so every master list looks and
//  * behaves the same way.
//  */
// export function SimpleMasterList<T extends MasterListItem>({
//   title,
//   subtitle = 'Used across Add Employee, filters & transfers',
//   addPlaceholder,
//   items,
//   isLoading = false,
//   emptyText = 'No records match these filters.',
//   tabs,
//   name,
//   onNameChange,
//   onAdd,
//   filterText,
//   onFilterChange,
//   editingId,
//   editName,
//   onEditNameChange,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onDelete,
//   headerExtra,
//   addExtra,
//   extraBeforeList,
//   canAdd = true,
//   canEdit = true,
//   canDelete = true,
//   fieldPerm,
// }: SimpleMasterListProps<T>) {
//   // Selection is visual-only here — none of the lookup master pages expose a
//   // bulk action, but the checkboxes keep every listing table consistent.
//   const [selected, setSelected] = useState<T[]>([]);

//   const selectedIds = new Set(selected.map((i) => i.id));
//   const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) setSelected([...selected, ...items.filter((i) => !selectedIds.has(i.id))]);
//     else {
//       const pageIds = new Set(items.map((i) => i.id));
//       setSelected(selected.filter((i) => !pageIds.has(i.id)));
//     }
//   };

//   const showActionsColumn = canEdit || canDelete;

//   const nameBody = (item: T) => {
//     const isEditing = editingId === item.id;
//     if (isEditing) {
//       // Reachable only when canEdit is true — and resolveFieldPerm already
//       // forces can_edit: false whenever a field is masked, so a masked
//       // field's Pencil button is already hidden upstream (canEdit prop is
//       // false). No masking branch needed here.
//       return (
//         <div className="master-inline-edit">
//           <input
//             type="text"
//             value={editName}
//             onChange={(e) => onEditNameChange(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') onSaveEdit(item.id);
//               if (e.key === 'Escape') onCancelEdit();
//             }}
//             autoFocus
//           />
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id)}>
//             <Check size={14} />
//           </button>
//           <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
//             <X size={14} />
//           </button>
//         </div>
//       );
//     }

//     const mv = maskedView(item.name, fieldPerm);
//     const displayText = mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

//     return (
//       <strong
//         style={canEdit && mv.kind === 'none' ? { cursor: 'pointer' } : undefined}
//         title={
//           mv.kind !== 'none'
//             ? (mv.kind === 'full' ? 'This value is masked based on your role' : 'This value is partially masked based on your role')
//             : canEdit ? 'Double-click to edit' : undefined
//         }
//         onDoubleClick={canEdit && mv.kind === 'none' ? () => onStartEdit(item) : undefined}
//         data-nocopy={mv.noCopy || undefined}
//         onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
//       >
//         {displayText}
//         {mv.kind !== 'none' && (
//           <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}>🔒</span>
//         )}
//       </strong>
//     );
//   };

//   const actionsBody = (item: T) => {
//     if (editingId === item.id) return null;
//     if (!canEdit && !canDelete) return null;
//     return (
//       <div className="master-row-actions">
//         {canEdit && (
//           <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartEdit(item)}>
//             <Pencil size={13} />
//           </button>
//         )}
//         {canDelete && (
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
//             <X size={14} />
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="pg-enter">
//       <div className="ph">
//         <div>
//           <h1>{title}</h1>
//           <p>{subtitle}</p>
//         </div>
//         <div className="ph-r">{headerExtra}</div>
//       </div>

//       {tabs && tabs.length > 0 && (
//         <div className="tabs mb14">
//           {tabs.map((tab) => (
//             <div
//               key={tab.label}
//               className={`tab${tab.active ? ' on' : ''}`}
//               onClick={tab.onClick}
//             >
//               {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="card cp">
//         {canAdd && (
//           <div className="master-add-row">
//             <div className="fg" style={{ margin: 0, flex: 1 }}>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => onNameChange(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && onAdd()}
//                 placeholder={addPlaceholder}
//               />
//             </div>
//             {addExtra}
//             <button type="button" className="btn btn-pri btn-sm" onClick={onAdd}>
//               Add
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
//           <div className="search-bar" style={{ maxWidth: 220 }}>
//             <span style={{ color: 'var(--ink4)' }}>⌕</span>
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => onFilterChange(e.target.value)}
//               placeholder="Filter..."
//             />
//           </div>
//           <Chip variant="gray">{items.length}</Chip>
//         </div>

//         {extraBeforeList}

//         <div className="tw">
//           <DataTable
//             value={isLoading ? [] : items}
//             loading={isLoading}
//             dataKey="id"
//             selection={selected}
//             selectionMode="checkbox"
//             selectAll={allSelected}
//             onSelectAllChange={(e) => handleSelectAll(e.checked)}
//             onSelectionChange={(e) => setSelected((e.value ?? []) as T[])}
//             emptyMessage={emptyText}
//             className="p-datatable-sm"
//             tableStyle={{ minWidth: '360px' }}
//           >
//             <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
//             <Column
//               headerStyle={{ width: 28 }}
//               body={() => <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />}
//             />
//             <Column header="Name" body={nameBody} />
//             {showActionsColumn && (
//               <Column header="Actions" headerStyle={{ width: 90, textAlign: 'right' }} body={actionsBody} />
//             )}
//           </DataTable>
//         </div>
//       </div>
//     </div>
//   );
// }




// 'use client';

// import { ReactNode, useState } from 'react';
// import { GripVertical, Pencil, X, Check } from 'lucide-react';
// import { DataTable } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { Chip } from '@/components/ui/Chip';
// import { maskedView, type FieldPerm } from '@/components/form/maskField';

// export interface MasterListItem {
//   id: number;
//   name: string;
// }

// export interface MasterListTab {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }

// interface SimpleMasterListProps<T extends MasterListItem> {
//   title: string;
//   subtitle?: string;
//   addPlaceholder: string;
//   items: T[];
//   isLoading?: boolean;
//   emptyText?: string;
//   tabs?: MasterListTab[];

//   name: string;
//   onNameChange: (value: string) => void;
//   onAdd: () => void;

//   filterText: string;
//   onFilterChange: (value: string) => void;

//   editingId: number | null;
//   editName: string;
//   onEditNameChange: (value: string) => void;
//   onStartEdit: (item: T) => void;
//   onSaveEdit: (id: number) => void;
//   onCancelEdit: () => void;
//   onDelete: (id: number) => void;

//   headerExtra?: ReactNode;
//   /** Extra control rendered between the add-input and the Add button (e.g. a parent-select dropdown). */
//   addExtra?: ReactNode;
//   /** Extra content rendered between the filter row and the table (e.g. a sub-editor section). */
//   extraBeforeList?: ReactNode;

//   /**
//    * Permission gates. Each defaults to true (no restriction) so existing
//    * callers that don't pass these keep working exactly as before. When
//    * false, the corresponding UI is actually removed — not just disabled,
//    * and not left for the caller's handler to silently no-op:
//    *   canAdd:    hides the entire add-row (input + addExtra + Add button)
//    *   canEdit:   hides the Pencil button and disables double-click-to-edit
//    *   canDelete: hides the delete (X) button
//    * If both canEdit and canDelete are false, the Actions column itself is
//    * dropped rather than rendered empty.
//    */
//   canAdd?: boolean;
//   canEdit?: boolean;
//   canDelete?: boolean;

//   /**
//    * The resolved FieldPermissionEntry for the "name" field this list is
//    * currently showing (e.g. state_name, city_name — whichever field_key the
//    * caller's active tab maps to). When is_masked/is_partial_masked is set,
//    * the displayed name is masked the same way FormInput masks a value, and
//    * copy is blocked. Omit if this list has no associated field permission
//    * (e.g. callers not yet wired to the RBAC field-permission system).
//    */
//   fieldPerm?: FieldPerm;
// }

// /**
//  * Shared presentation layer for the ~20 "single-field lookup" master pages
//  * (Gender, Blood Group, Notice Period, Employee Status, ...). Every page
//  * keeps 100% of its own state/hooks/mutations — this component only renders
//  * them, using the same .card/.btn/.search-bar/.tw table/Chip tokens as the
//  * rest of the app instead of ad-hoc Tailwind, so every master list looks and
//  * behaves the same way.
//  */
// export function SimpleMasterList<T extends MasterListItem>({
//   title,
//   subtitle = 'Used across Add Employee, filters & transfers',
//   addPlaceholder,
//   items,
//   isLoading = false,
//   emptyText = 'No records match these filters.',
//   tabs,
//   name,
//   onNameChange,
//   onAdd,
//   filterText,
//   onFilterChange,
//   editingId,
//   editName,
//   onEditNameChange,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onDelete,
//   headerExtra,
//   addExtra,
//   extraBeforeList,
//   canAdd = true,
//   canEdit = true,
//   canDelete = true,
//   fieldPerm,
// }: SimpleMasterListProps<T>) {
//   // Selection is visual-only here — none of the lookup master pages expose a
//   // bulk action, but the checkboxes keep every listing table consistent.
//   const [selected, setSelected] = useState<T[]>([]);

//   const selectedIds = new Set(selected.map((i) => i.id));
//   const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) setSelected([...selected, ...items.filter((i) => !selectedIds.has(i.id))]);
//     else {
//       const pageIds = new Set(items.map((i) => i.id));
//       setSelected(selected.filter((i) => !pageIds.has(i.id)));
//     }
//   };

//   const showActionsColumn = canEdit || canDelete;

//   const nameBody = (item: T) => {
//     const isEditing = editingId === item.id;
//     if (isEditing) {
//       // Reachable only when canEdit is true — and resolveFieldPerm already
//       // forces can_edit: false whenever a field is masked, so a masked
//       // field's Pencil button is already hidden upstream (canEdit prop is
//       // false). No masking branch needed here.
//       return (
//         <div className="master-inline-edit">
//           <input
//             type="text"
//             value={editName}
//             onChange={(e) => onEditNameChange(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') onSaveEdit(item.id);
//               if (e.key === 'Escape') onCancelEdit();
//             }}
//             autoFocus
//           />
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id)}>
//             <Check size={14} />
//           </button>
//           <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
//             <X size={14} />
//           </button>
//         </div>
//       );
//     }

//     const mv = maskedView(item.name, fieldPerm);
//     const displayText = mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

//     return (
//       <strong
//         style={canEdit && mv.kind === 'none' ? { cursor: 'pointer' } : undefined}
//         title={
//           mv.kind !== 'none'
//             ? (mv.kind === 'full' ? 'This value is masked based on your role' : 'This value is partially masked based on your role')
//             : canEdit ? 'Double-click to edit' : undefined
//         }
//         onDoubleClick={canEdit && mv.kind === 'none' ? () => {
//           // TEMP DEBUG
//           console.log('[SimpleMasterList] double-click fired for item', item, { canEdit, mvKind: mv.kind });
//           onStartEdit(item);
//         } : undefined}
//         data-nocopy={mv.noCopy || undefined}
//         onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
//       >
//         {displayText}
//         {mv.kind !== 'none' && (
//           <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}>🔒</span>
//         )}
//       </strong>
//     );
//   };

//   const actionsBody = (item: T) => {
//     if (editingId === item.id) return null;
//     if (!canEdit && !canDelete) return null;
//     return (
//       <div className="master-row-actions">
//         {canEdit && (
//           <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
//             // TEMP DEBUG
//             console.log('[SimpleMasterList] Pencil clicked for item', item, { canEdit, editingId, itemId: item.id });
//             onStartEdit(item);
//           }}>
//             <Pencil size={13} />
//           </button>
//         )}
//         {canDelete && (
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
//             <X size={14} />
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="pg-enter">
//       <div className="ph">
//         <div>
//           <h1>{title}</h1>
//           <p>{subtitle}</p>
//         </div>
//         <div className="ph-r">{headerExtra}</div>
//       </div>

//       {tabs && tabs.length > 0 && (
//         <div className="tabs mb14">
//           {tabs.map((tab) => (
//             <div
//               key={tab.label}
//               className={`tab${tab.active ? ' on' : ''}`}
//               onClick={tab.onClick}
//             >
//               {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="card cp">
//         {canAdd && (
//           <div className="master-add-row">
//             <div className="fg" style={{ margin: 0, flex: 1 }}>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => onNameChange(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && onAdd()}
//                 placeholder={addPlaceholder}
//               />
//             </div>
//             {addExtra}
//             <button type="button" className="btn btn-pri btn-sm" onClick={onAdd}>
//               Add
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
//           <div className="search-bar" style={{ maxWidth: 220 }}>
//             <span style={{ color: 'var(--ink4)' }}>⌕</span>
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => onFilterChange(e.target.value)}
//               placeholder="Filter..."
//             />
//           </div>
//           <Chip variant="gray">{items.length}</Chip>
//         </div>

//         {extraBeforeList}

//         <div className="tw">
//           <DataTable
//             value={isLoading ? [] : items}
//             loading={isLoading}
//             dataKey="id"
//             selection={selected}
//             selectionMode="checkbox"
//             selectAll={allSelected}
//             onSelectAllChange={(e) => handleSelectAll(e.checked)}
//             onSelectionChange={(e) => setSelected((e.value ?? []) as T[])}
//             emptyMessage={emptyText}
//             className="p-datatable-sm"
//             tableStyle={{ minWidth: '360px' }}
//           >
//             <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
//             <Column
//               headerStyle={{ width: 28 }}
//               body={() => <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />}
//             />
//             <Column header="Name" body={nameBody} />
//             {showActionsColumn && (
//               <Column header="Actions" headerStyle={{ width: 90, textAlign: 'right' }} body={actionsBody} />
//             )}
//           </DataTable>
//         </div>
//       </div>
//     </div>
//   );
// }








// 'use client';

// import { ReactNode, useState } from 'react';
// import { GripVertical, Pencil, X, Check } from 'lucide-react';
// import { DataTable } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { Chip } from '@/components/ui/Chip';
// import { maskedView, type FieldPerm } from '@/components/form/maskField';

// export interface MasterListItem {
//   id: number;
//   name: string;
//   [key: string]: any;
// }

// export interface MasterListTab {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }

// interface SimpleMasterListProps<T extends MasterListItem> {
//   title: string;
//   subtitle?: string;
//   addPlaceholder: string;
//   items: T[];
//   isLoading?: boolean;
//   emptyText?: string;
//   tabs?: MasterListTab[];

//   name: string;
//   onNameChange: (value: string) => void;
//   onAdd: () => void;

//   filterText: string;
//   onFilterChange: (value: string) => void;

//   editingId: number | null;
//   editName: string;
//   onEditNameChange: (value: string) => void;
//   onStartEdit: (item: T) => void;
//   onSaveEdit: (id: number) => void;
//   onCancelEdit: () => void;
//   onDelete: (id: number) => void;

//   headerExtra?: ReactNode;
//   addExtra?: ReactNode;
//   extraBeforeList?: ReactNode;

//   canAdd?: boolean;
//   canEdit?: boolean;
//   canDelete?: boolean;

//   fieldPerm?: FieldPerm;
// }

// export function SimpleMasterList<T extends MasterListItem>({
//   title,
//   subtitle = 'Used across Add Employee, filters & transfers',
//   addPlaceholder,
//   items,
//   isLoading = false,
//   emptyText = 'No records match these filters.',
//   tabs,
//   name,
//   onNameChange,
//   onAdd,
//   filterText,
//   onFilterChange,
//   editingId,
//   editName,
//   onEditNameChange,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onDelete,
//   headerExtra,
//   addExtra,
//   extraBeforeList,
//   canAdd = true,
//   canEdit = true,
//   canDelete = true,
//   fieldPerm,
// }: SimpleMasterListProps<T>) {
//   const [selected, setSelected] = useState<T[]>([]);

//   const selectedIds = new Set(selected.map((i) => i.id));
//   const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) setSelected([...selected, ...items.filter((i) => !selectedIds.has(i.id))]);
//     else {
//       const pageIds = new Set(items.map((i) => i.id));
//       setSelected(selected.filter((i) => !pageIds.has(i.id)));
//     }
//   };

//   const showActionsColumn = canEdit || canDelete;

//   const nameBody = (item: T) => {
//     const isEditing = editingId !== null && Number(editingId) === Number(item.id);

//     if (isEditing) {
//       return (
//         <div className="master-inline-edit">
//           <input
//             type="text"
//             value={editName}
//             onChange={(e) => onEditNameChange(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') onSaveEdit(item.id);
//               if (e.key === 'Escape') onCancelEdit();
//             }}
//             autoFocus
//           />
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id)}>
//             <Check size={14} />
//           </button>
//           <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
//             <X size={14} />
//           </button>
//         </div>
//       );
//     }

//     const mv = maskedView(item.name, fieldPerm);
//     const displayText = mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

//     return (
//       <strong
//         style={canEdit && mv.kind === 'none' ? { cursor: 'pointer' } : undefined}
//         title={
//           mv.kind !== 'none'
//             ? (mv.kind === 'full' ? 'This value is masked based on your role' : 'This value is partially masked based on your role')
//             : canEdit ? 'Double-click to edit' : undefined
//         }
//         onDoubleClick={canEdit && mv.kind === 'none' ? () => onStartEdit(item) : undefined}
//         data-nocopy={mv.noCopy || undefined}
//         onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
//       >
//         {displayText}
//         {mv.kind !== 'none' && (
//           <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}>🔒</span>
//         )}
//       </strong>
//     );
//   };

//   const actionsBody = (item: T) => {
//     if (editingId !== null && Number(editingId) === Number(item.id)) return null;
//     if (!canEdit && !canDelete) return null;

//     return (
//       <div className="master-row-actions">
//         {canEdit && (
//           <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartEdit(item)}>
//             <Pencil size={13} />
//           </button>
//         )}
//         {canDelete && (
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
//             <X size={14} />
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="pg-enter">
//       <div className="ph">
//         <div>
//           <h1>{title}</h1>
//           <p>{subtitle}</p>
//         </div>
//         <div className="ph-r">{headerExtra}</div>
//       </div>

//       {tabs && tabs.length > 0 && (
//         <div className="tabs mb14">
//           {tabs.map((tab) => (
//             <div
//               key={tab.label}
//               className={`tab${tab.active ? ' on' : ''}`}
//               onClick={tab.onClick}
//             >
//               {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="card cp">
//         {canAdd && (
//           <div className="master-add-row">
//             <div className="fg" style={{ margin: 0, flex: 1 }}>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => onNameChange(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && onAdd()}
//                 placeholder={addPlaceholder}
//               />
//             </div>
//             {addExtra}
//             <button type="button" className="btn btn-pri btn-sm" onClick={onAdd}>
//               Add
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
//           <div className="search-bar" style={{ maxWidth: 220 }}>
//             <span style={{ color: 'var(--ink4)' }}>⌕</span>
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => onFilterChange(e.target.value)}
//               placeholder="Filter..."
//             />
//           </div>
//           <Chip variant="gray">{items.length}</Chip>
//         </div>

//         {extraBeforeList}

//         <div className="tw">
//           <DataTable
//             value={isLoading ? [] : items}
//             loading={isLoading}
//             dataKey="id"
//             selection={selected}
//             selectionMode="checkbox"
//             selectAll={allSelected}
//             onSelectAllChange={(e) => handleSelectAll(e.checked)}
//             onSelectionChange={(e) => setSelected((e.value ?? []) as T[])}
//             emptyMessage={emptyText}
//             className="p-datatable-sm"
//             tableStyle={{ minWidth: '360px' }}
//           >
//             <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
//             <Column
//               headerStyle={{ width: 28 }}
//               body={() => <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />}
//             />
//             <Column header="Name" body={nameBody} />
//             {showActionsColumn && (
//               <Column header="Actions" headerStyle={{ width: 90, textAlign: 'right' }} body={actionsBody} />
//             )}
//           </DataTable>
//         </div>
//       </div>
//     </div>
//   );
// }




// 'use client';

// import { ReactNode, useState } from 'react';
// import { GripVertical, Pencil, X, Check } from 'lucide-react';
// import { DataTable } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { Chip } from '@/components/ui/Chip';
// import { maskedView, type FieldPerm } from '@/components/form/maskField';

// export interface MasterListItem {
//   id: number;
//   name: string;
// }

// export interface MasterListTab {
//   label: string;
//   count: number;
//   active: boolean;
//   onClick: () => void;
// }

// interface SimpleMasterListProps<T extends MasterListItem> {
//   title: string;
//   subtitle?: string;
//   addPlaceholder: string;
//   items: T[];
//   isLoading?: boolean;
//   emptyText?: string;
//   tabs?: MasterListTab[];

//   name: string;
//   onNameChange: (value: string) => void;
//   onAdd: () => void;

//   filterText: string;
//   onFilterChange: (value: string) => void;

//   editingId: number | null;
//   editName: string;
//   onEditNameChange: (value: string) => void;
//   onStartEdit: (item: T) => void;
//   onSaveEdit: (id: number) => void;
//   onCancelEdit: () => void;
//   onDelete: (id: number) => void;

//   headerExtra?: ReactNode;
//   /** Extra control rendered between the add-input and the Add button (e.g. a parent-select dropdown). */
//   addExtra?: ReactNode;
//   /** Extra content rendered between the filter row and the table (e.g. a sub-editor section). */
//   extraBeforeList?: ReactNode;

//   /**
//    * Permission gates. Each defaults to true (no restriction) so existing
//    * callers that don't pass these keep working exactly as before. When
//    * false, the corresponding UI is actually removed — not just disabled,
//    * and not left for the caller's handler to silently no-op:
//    *   canAdd:    hides the entire add-row (input + addExtra + Add button)
//    *   canEdit:   hides the Pencil button and disables double-click-to-edit
//    *   canDelete: hides the delete (X) button
//    * If both canEdit and canDelete are false, the Actions column itself is
//    * dropped rather than rendered empty.
//    */
//   canAdd?: boolean;
//   canEdit?: boolean;
//   canDelete?: boolean;

//   /**
//    * The resolved FieldPermissionEntry for the "name" field this list is
//    * currently showing (e.g. state_name, city_name — whichever field_key the
//    * caller's active tab maps to). When is_masked/is_partial_masked is set,
//    * the displayed name is masked the same way FormInput masks a value, and
//    * copy is blocked. Omit if this list has no associated field permission
//    * (e.g. callers not yet wired to the RBAC field-permission system).
//    */
//   fieldPerm?: FieldPerm;
// }

// /**
//  * Shared presentation layer for the ~20 "single-field lookup" master pages
//  * (Gender, Blood Group, Notice Period, Employee Status, ...). Every page
//  * keeps 100% of its own state/hooks/mutations — this component only renders
//  * them, using the same .card/.btn/.search-bar/.tw table/Chip tokens as the
//  * rest of the app instead of ad-hoc Tailwind, so every master list looks and
//  * behaves the same way.
//  */
// export function SimpleMasterList<T extends MasterListItem>({
//   title,
//   subtitle = 'Used across Add Employee, filters & transfers',
//   addPlaceholder,
//   items,
//   isLoading = false,
//   emptyText = 'No records match these filters.',
//   tabs,
//   name,
//   onNameChange,
//   onAdd,
//   filterText,
//   onFilterChange,
//   editingId,
//   editName,
//   onEditNameChange,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onDelete,
//   headerExtra,
//   addExtra,
//   extraBeforeList,
//   canAdd = true,
//   canEdit = true,
//   canDelete = true,
//   fieldPerm,
// }: SimpleMasterListProps<T>) {
//   // Selection is visual-only here — none of the lookup master pages expose a
//   // bulk action, but the checkboxes keep every listing table consistent.
//   const [selected, setSelected] = useState<T[]>([]);

//   const selectedIds = new Set(selected.map((i) => i.id));
//   const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) setSelected([...selected, ...items.filter((i) => !selectedIds.has(i.id))]);
//     else {
//       const pageIds = new Set(items.map((i) => i.id));
//       setSelected(selected.filter((i) => !pageIds.has(i.id)));
//     }
//   };

//   const showActionsColumn = canEdit || canDelete;

//   const nameBody = (item: T) => {
//     // Compared as strings, not strict ===. If the API ever returns `id` as
//     // a string on some responses while editingId is a number (or vice
//     // versa), a strict comparison silently never matches — the edit input
//     // would never appear even though editingId is set correctly. This bit
//     // us once already (Locations) and is the most likely cause if it
//     // resurfaces on other SimpleMasterList-based pages.
//     const isEditing = editingId != null && String(editingId) === String(item.id);
//     if (isEditing) {
//       // Reachable only when canEdit is true — and resolveFieldPerm already
//       // forces can_edit: false whenever a field is masked, so a masked
//       // field's Pencil button is already hidden upstream (canEdit prop is
//       // false). No masking branch needed here.
//       return (
//         <div className="master-inline-edit">
//           <input
//             type="text"
//             value={editName}
//             onChange={(e) => onEditNameChange(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') onSaveEdit(item.id);
//               if (e.key === 'Escape') onCancelEdit();
//             }}
//             autoFocus
//           />
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id)}>
//             <Check size={14} />
//           </button>
//           <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
//             <X size={14} />
//           </button>
//         </div>
//       );
//     }

//     const mv = maskedView(item.name, fieldPerm);
//     const displayText = mv.kind === 'full' ? '••••••••' : mv.kind === 'partial' ? mv.text : item.name;

//     return (
//       <strong
//         style={canEdit && mv.kind === 'none' ? { cursor: 'pointer' } : undefined}
//         title={
//           mv.kind !== 'none'
//             ? (mv.kind === 'full' ? 'This value is masked based on your role' : 'This value is partially masked based on your role')
//             : canEdit ? 'Double-click to edit' : undefined
//         }
//         onDoubleClick={canEdit && mv.kind === 'none' ? () => {
//           // TEMP DEBUG
//           console.log('[SimpleMasterList] double-click fired for item', item, { canEdit, mvKind: mv.kind });
//           onStartEdit(item);
//         } : undefined}
//         data-nocopy={mv.noCopy || undefined}
//         onCopy={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onCut={mv.noCopy ? (e) => e.preventDefault() : undefined}
//         onContextMenu={mv.noCopy ? (e) => e.preventDefault() : undefined}
//       >
//         {displayText}
//         {mv.kind !== 'none' && (
//           <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}>🔒</span>
//         )}
//       </strong>
//     );
//   };

//   const actionsBody = (item: T) => {
//     if (editingId != null && String(editingId) === String(item.id)) return null;
//     if (!canEdit && !canDelete) return null;
//     return (
//       <div className="master-row-actions">
//         {canEdit && (
//           <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
//             // TEMP DEBUG
//             console.log('[SimpleMasterList] Pencil clicked for item', item, { canEdit, editingId, itemId: item.id });
//             onStartEdit(item);
//           }}>
//             <Pencil size={13} />
//           </button>
//         )}
//         {canDelete && (
//           <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
//             <X size={14} />
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="pg-enter">
//       <div className="ph">
//         <div>
//           <h1>{title}</h1>
//           <p>{subtitle}</p>
//         </div>
//         <div className="ph-r">{headerExtra}</div>
//       </div>

//       {tabs && tabs.length > 0 && (
//         <div className="tabs mb14">
//           {tabs.map((tab) => (
//             <div
//               key={tab.label}
//               className={`tab${tab.active ? ' on' : ''}`}
//               onClick={tab.onClick}
//             >
//               {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="card cp">
//         {canAdd && (
//           <div className="master-add-row">
//             <div className="fg" style={{ margin: 0, flex: 1 }}>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => onNameChange(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && onAdd()}
//                 placeholder={addPlaceholder}
//               />
//             </div>
//             {addExtra}
//             <button type="button" className="btn btn-pri btn-sm" onClick={onAdd}>
//               Add
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
//           <div className="search-bar" style={{ maxWidth: 220 }}>
//             <span style={{ color: 'var(--ink4)' }}>⌕</span>
//             <input
//               type="text"
//               value={filterText}
//               onChange={(e) => onFilterChange(e.target.value)}
//               placeholder="Filter..."
//             />
//           </div>
//           <Chip variant="gray">{items.length}</Chip>
//         </div>

//         {extraBeforeList}

//         <div className="tw">
//           <DataTable
//             value={isLoading ? [] : items}
//             loading={isLoading}
//             dataKey="id"
//             selection={selected}
//             selectionMode="checkbox"
//             selectAll={allSelected}
//             onSelectAllChange={(e) => handleSelectAll(e.checked)}
//             onSelectionChange={(e) => setSelected((e.value ?? []) as T[])}
//             emptyMessage={emptyText}
//             className="p-datatable-sm"
//             tableStyle={{ minWidth: '360px' }}
//           >
//             <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
//             <Column
//               headerStyle={{ width: 28 }}
//               body={() => <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />}
//             />
//             <Column header="Name" body={nameBody} />
//             {showActionsColumn && (
//               <Column header="Actions" headerStyle={{ width: 90, textAlign: 'right' }} body={actionsBody} />
//             )}
//           </DataTable>
//         </div>
//       </div>
//     </div>
//   );
// }