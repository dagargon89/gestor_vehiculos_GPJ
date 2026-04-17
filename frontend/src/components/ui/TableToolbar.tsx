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

  const btnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-soft)',
    color: 'var(--color-text-soft)',
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 py-3 px-4"
      style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-table-head-bg)' }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span>
            Mostrando {startIndex}–{endIndex} de {totalItems}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="input-field"
            style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>por página</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={{ ...btnStyle, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm font-mono-data" style={{ color: 'var(--color-text-muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={{ ...btnStyle, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
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
            className="flex items-center gap-2"
            style={btnStyle}
          >
            <span className="material-icons text-lg">download</span>
            Exportar
            <span className="material-icons text-lg">{exportOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
          {exportOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 py-1 rounded-xl z-50"
              style={{
                background: 'var(--color-menu-bg)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {onExportCSV && (
                <button
                  type="button"
                  onClick={() => { onExportCSV(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--color-text-soft)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  CSV
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={() => { onExportExcel(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--color-text-soft)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Excel (.xlsx)
                </button>
              )}
              {onExportPDF && (
                <button
                  type="button"
                  onClick={() => { onExportPDF(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--color-text-soft)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
