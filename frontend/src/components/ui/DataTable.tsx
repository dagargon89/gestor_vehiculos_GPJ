import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  sortAccessor?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  sortKey,
  sortDir,
  onSort,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, accessor: (row: T) => string | number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-4 text-sm font-bold ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--color-text-soft)', cursor: col.sortAccessor ? 'pointer' : undefined }}
                onClick={() => col.sortAccessor && onSort?.(col.key, col.sortAccessor)}
              >
                {col.header}
                {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`} style={{ color: 'var(--color-text)' }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
