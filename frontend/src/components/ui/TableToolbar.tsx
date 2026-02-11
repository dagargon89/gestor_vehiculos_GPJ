import { useState, useRef, useEffect } from 'react';

type TableToolbarProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  startIndex: number;
  endIndex: number;
  pageSizeOptions?: number[];
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
};

export function TableToolbar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  startIndex,
  endIndex,
  pageSizeOptions = [10, 25, 50],
  onExportCSV,
  onExportExcel,
  onExportPDF,
}: TableToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasExport = onExportCSV || onExportExcel || onExportPDF;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 border-b border-slate-200 bg-slate-50/80">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            Mostrar {startIndex}-{endIndex} de {totalItems}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>por página</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
      {hasExport && (
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="material-icons text-lg">download</span>
            Exportar
            <span className="material-icons text-lg">{exportOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              {onExportCSV && (
                <button
                  type="button"
                  onClick={() => {
                    onExportCSV();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  CSV
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Excel (.xlsx)
                </button>
              )}
              {onExportPDF && (
                <button
                  type="button"
                  onClick={() => {
                    onExportPDF();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  PDF
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
