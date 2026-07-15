import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataTable } from './useDataTable';

type Row = { id: string; name: string; email: string };

const rows: Row[] = [
  { id: '1', name: 'Beto', email: 'beto@x.com' },
  { id: '2', name: 'Ana', email: 'ana@x.com' },
  { id: '3', name: 'Carlos', email: 'carlos@x.com' },
];

describe('useDataTable', () => {
  it('filtra por texto usando searchFields', () => {
    const { result } = renderHook(() =>
      useDataTable(rows, { searchFields: (r) => [r.name, r.email] }),
    );
    act(() => result.current.setSearch('ana'));
    expect(result.current.paginatedData).toEqual([rows[1]]);
  });

  it('ordena ascendente y descendente al alternar toggleSort', () => {
    const { result } = renderHook(() =>
      useDataTable(rows, { searchFields: (r) => [r.name] }),
    );
    act(() => result.current.toggleSort('name', (r) => r.name));
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Ana', 'Beto', 'Carlos']);
    act(() => result.current.toggleSort('name', (r) => r.name));
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Carlos', 'Beto', 'Ana']);
  });
});
