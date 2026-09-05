'use client';

import { ReactNode } from 'react';
import { GripVertical, Pencil, X, Check } from 'lucide-react';
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
          <table>
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Name</th>
                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>
                    {emptyText}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id}>
                      <td>
                        <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--ink4)' }} />
                      </td>
                      <td>
                        {isEditing ? (
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
                        )}
                      </td>
                      <td>
                        {!isEditing && (
                          <div className="master-row-actions">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStartEdit(item)}>
                              <Pencil size={13} />
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
