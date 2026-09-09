'use client';
import { ReactNode } from 'react';
import { DataTable as PrimeDataTable, type DataTableRowClickEvent } from 'primereact/datatable';
import { Column as PrimeColumn } from 'primereact/column';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  /** Optional per-column alignment, forwarded to PrimeReact. */
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  // Pagination (server-side — rendered via the shared <Pagination> bar)
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  // Toolbar
  toolbar?: ReactNode;
  emptyText?: string;
  // Row selection (opt-in — off by default so existing tables are unaffected)
  selectable?: boolean;
  /** Field used to identify a row for selection. Defaults to `id`. */
  dataKey?: string;
  selection?: T[];
  onSelectionChange?: (rows: T[]) => void;
  /** Rendered above the table whenever at least one row is selected. */
  selectionBar?: (selected: T[], clear: () => void) => ReactNode;
  /** Min width for horizontal scroll, mirrors the old `.tw` wrapper behavior. */
  minWidth?: string;
  /** Render without the surrounding `.card` (for tables nested inside an existing card). */
  bare?: boolean;
}

export function DataTable<T>({
  columns, data, isLoading, rowKey, onRowClick,
  page, totalPages, total, limit, onPageChange,
  toolbar, emptyText = 'No records found.',
  selectable, dataKey = 'id', selection, onSelectionChange, selectionBar,
  minWidth = '480px', bare = false,
}: DataTableProps<T>) {
  const selected = selection ?? [];

  // Fully controlled "select all": we compute the header-checkbox state and the
  // toggle ourselves (via `selectAll` + `onSelectAllChange`) instead of letting
  // PrimeReact diff object references. This keeps the header checkbox in sync
  // with the rows through refetches (search / filter / sort / pagination) and
  // preserves selections made on other server-fetched pages.
  const keyOf = (row: T) => (row as Record<string, unknown>)[dataKey] as string | number;
  const selectedKeys = new Set(selected.map(keyOf));
  const allSelected = data.length > 0 && data.every((r) => selectedKeys.has(keyOf(r)));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const additions = data.filter((r) => !selectedKeys.has(keyOf(r)));
      onSelectionChange?.([...selected, ...additions]);
    } else {
      const pageKeys = new Set(data.map(keyOf));
      onSelectionChange?.(selected.filter((s) => !pageKeys.has(keyOf(s))));
    }
  };

  return (
    <div className={bare ? '' : 'card'}>
      {toolbar && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 17px', borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap', gap: 8,
          }}
        >
          {toolbar}
        </div>
      )}

      {selectable && selectionBar && selected.length > 0 && (
        <div style={{ padding: '10px 17px 0' }}>
          {selectionBar(selected, () => onSelectionChange?.([]))}
        </div>
      )}

      <div className="tw" style={{ padding: '0 4px' }}>
        <PrimeDataTable
          value={data}
          loading={isLoading}
          dataKey={dataKey}
          rowHover
          emptyMessage={emptyText}
          className="p-datatable-sm"
          tableStyle={{ minWidth }}
          onRowClick={onRowClick ? (e: DataTableRowClickEvent) => onRowClick(e.data as T) : undefined}
          selectionMode={selectable ? 'checkbox' : undefined}
          selection={selectable ? (selected as any) : undefined}
          selectAll={selectable ? allSelected : undefined}
          onSelectAllChange={
            selectable
              ? (e: { checked: boolean }) => handleSelectAll(e.checked)
              : undefined
          }
          onSelectionChange={
            selectable
              ? (e: { value: unknown }) => onSelectionChange?.((e.value ?? []) as T[])
              : undefined
          }
        >
          {selectable && (
            <PrimeColumn selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          )}
          {columns.map((col) => (
            <PrimeColumn
              key={col.key}
              header={col.header}
              headerStyle={col.width ? { width: col.width } : undefined}
              align={col.align}
              body={
                col.render
                  ? (row: T, opts: { rowIndex: number }) => col.render!(row, opts.rowIndex)
                  : (row: T) => (row as Record<string, unknown>)[col.key] as ReactNode
              }
            />
          ))}
        </PrimeDataTable>
      </div>

      {page !== undefined && totalPages !== undefined && total !== undefined && limit !== undefined && onPageChange && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
