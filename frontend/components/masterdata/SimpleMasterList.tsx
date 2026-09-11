'use client';

import { ReactNode, useMemo, useRef } from 'react';
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
  /**
   * `value` is the freshly-typed text, read directly off the input at click
   * time (see the `editValueRef` note below) — pass it through to whatever
   * gets saved instead of re-reading `editName`/other external state, which
   * may be stale by the time this fires. Optional only so existing callers
   * that still read their own `editName` state keep compiling; new/fixed
   * callers should prefer the passed `value`.
   */
  onSaveEdit: (id: number, value?: string) => void;
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
  // PrimeReact's DataTable only re-invokes a Column's `body` render prop for
  // a row when that row's entry in `value` changes — a parent re-render that
  // leaves `items` and `editingId` untouched (e.g. typing into the inline
  // edit input, which only changes `editName`) does NOT get a fresh
  // `body()` call. Two consequences, both fixed below:
  //  1. Clicking Edit correctly calls onStartEdit/setEditingId, but without
  //     `editingId` changing the row's data too, the row never re-renders
  //     into its input — the click visibly "does nothing".
  //  2. Once editing, every handler PrimeReact cached for that row (Save,
  //     Cancel, the input's onChange) stays bound to the closures from the
  //     moment editing started — including whatever `editName`/`onSaveEdit`
  //     were at that instant. Typing updates state fine (the onChange still
  //     calls the stable `onEditNameChange` setter), but clicking Save
  //     re-invokes that stale closure, which silently saves the pre-edit
  //     text since it never picked up the newer one.
  // Fix for (1): fold `editingId` into the row data so entering/leaving edit
  // mode always changes `value`'s identity, forcing a re-render.
  // Fix for (2): `editValueRef` mirrors the latest `editName` on every
  // render (a plain assignment, not tied to any effect timing). Because a
  // ref's object identity never changes, even a stale cached closure that
  // captured `editValueRef` still reads today's `.current` — so Save always
  // sends what's actually in the box regardless of when PrimeReact last
  // bothered to re-render that cell.
  const editValueRef = useRef(editName);
  editValueRef.current = editName;

  const tableItems = useMemo(
    () => items.map((item) => ({ ...item, __editing: editingId === item.id })),
    [items, editingId],
  );

  const nameBody = (item: T & { __editing: boolean }) => {
    const isEditing = item.__editing;
    return isEditing ? (
      <div className="master-inline-edit">
        <input
          key={item.id}
          type="text"
          defaultValue={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit(item.id, editValueRef.current);
            if (e.key === 'Escape') onCancelEdit();
          }}
          autoFocus
        />
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => onSaveEdit(item.id, editValueRef.current)}>
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

  const actionsBody = (item: T & { __editing: boolean }) => (
    item.__editing ? null : (
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
            value={isLoading ? [] : tableItems}
            loading={isLoading}
            dataKey="id"
            emptyMessage={emptyText}
            className="p-datatable-sm"
            tableStyle={{ minWidth: '360px' }}
          >
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
