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

  it('ordena y filtra sobre el dataset completo antes de paginar (no al revés)', () => {
    // Raw insertion order deliberately does NOT match alphabetical order, so that a
    // paginate-first bug (slice by page, then sort/filter only the current page) would
    // produce a different page 2 than a correct filter/sort-then-paginate implementation.
    const manyRows: Row[] = [
      { id: '1', name: 'Elvira', email: 'elvira@x.com' },
      { id: '2', name: 'Beto', email: 'beto@x.com' },
      { id: '3', name: 'Diana', email: 'diana@x.com' },
      { id: '4', name: 'Ana', email: 'ana@x.com' },
      { id: '5', name: 'Carlos', email: 'carlos@x.com' },
    ];
    // Alphabetical order: Ana, Beto, Carlos, Diana, Elvira.
    // With pageSize 2: page 1 = [Ana, Beto], page 2 = [Carlos, Diana], page 3 = [Elvira].
    const { result } = renderHook(() =>
      useDataTable(manyRows, { pageSize: 2, searchFields: (r) => [r.name, r.email] }),
    );
    act(() => result.current.toggleSort('name', (r) => r.name));
    act(() => result.current.setPage(2));

    // A paginate-first bug would instead slice the raw (unsorted) data into pages of 2
    // (page 2 raw = [Diana, Ana]) and only sort/filter within that slice, so this
    // assertion fails under that bug but passes for the correct sort-then-paginate order.
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Carlos', 'Diana']);

    // Combine with search too: searching for a needle that matches a subset spread across
    // the raw dataset must filter the FULL set first, then sort, then paginate.
    act(() => result.current.setSearch(''));
    act(() => result.current.setPage(1));
    act(() => result.current.setSearch('a')); // matches Elvira, Diana, Ana, Carlos (not Beto)
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Ana', 'Carlos']);
    expect(result.current.totalItems).toBe(4);
  });

  it('expone filteredData con el set completo filtrado y ordenado, sin paginar', () => {
    const manyRows: Row[] = [
      { id: '1', name: 'Elvira', email: 'elvira@x.com' },
      { id: '2', name: 'Beto', email: 'beto@x.com' },
      { id: '3', name: 'Diana', email: 'diana@x.com' },
      { id: '4', name: 'Ana', email: 'ana@x.com' },
      { id: '5', name: 'Carlos', email: 'carlos@x.com' },
    ];
    const { result } = renderHook(() =>
      useDataTable(manyRows, { pageSize: 2, searchFields: (r) => [r.name, r.email] }),
    );

    act(() => result.current.toggleSort('name', (r) => r.name));
    act(() => result.current.setSearch('a')); // matches Elvira, Diana, Ana, Carlos (not Beto)

    // filteredData should hold ALL matching rows (sorted), not just the current page.
    expect(result.current.filteredData.map((r) => r.name)).toEqual([
      'Ana',
      'Carlos',
      'Diana',
      'Elvira',
    ]);
    expect(result.current.filteredData.length).toBe(4);
    // paginatedData remains the current-page slice of that same filtered/sorted set.
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Ana', 'Carlos']);
  });
});
