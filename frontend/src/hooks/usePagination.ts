import { useState, useMemo, useEffect } from 'react';

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function usePagination<T>(
  data: T[],
  options?: { pageSize?: number },
) {
  const defaultSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultSize);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    paginatedData,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  };
}
