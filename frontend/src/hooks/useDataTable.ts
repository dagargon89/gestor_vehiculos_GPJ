import { useMemo, useState } from 'react';
import { usePagination } from './usePagination';

export function useDataTable<T>(
  data: T[],
  opts: { pageSize?: number; searchFields?: (row: T) => string[] } = {},
) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [sortAccessor, setSortAccessor] = useState<((row: T) => string | number) | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim() || !opts.searchFields) return data;
    const needle = search.trim().toLowerCase();
    return data.filter((row) =>
      opts.searchFields!(row).some((field) => field?.toLowerCase().includes(needle)),
    );
  }, [data, search, opts.searchFields]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortAccessor) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = sortAccessor(a);
      const vb = sortAccessor(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortAccessor, sortDir]);

  const toggleSort = (key: string, accessor: (row: T) => string | number) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortAccessor(() => accessor);
      setSortDir('asc');
    }
  };

  const pagination = usePagination<T>(sorted, { pageSize: opts.pageSize ?? 25 });

  return { search, setSearch, sortKey, sortDir, toggleSort, filteredData: sorted, ...pagination };
}
