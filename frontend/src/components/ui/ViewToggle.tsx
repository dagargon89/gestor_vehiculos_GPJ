export type ViewMode = 'table' | 'cards';

const STORAGE_PREFIX = 'fleet_view_';

export function getStoredView(storageKey: string | undefined): ViewMode {
  if (!storageKey) return 'table';
  const s = localStorage.getItem(STORAGE_PREFIX + storageKey);
  return s === 'cards' ? 'cards' : 'table';
}

type ViewToggleProps = {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  storageKey?: string;
};

export function ViewToggle({ value, onChange, storageKey }: ViewToggleProps) {
  const handleChange = (v: ViewMode) => {
    onChange(v);
    if (storageKey) {
      localStorage.setItem(STORAGE_PREFIX + storageKey, v);
    }
  };

  return (
    <div
      className="flex rounded-[10px] p-0.5"
      style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
    >
      {(['table', 'cards'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => handleChange(mode)}
          className="flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors"
          style={
            value === mode
              ? { background: 'linear-gradient(135deg,#6384ff,#5a6fff)', color: '#ffffff' }
              : { color: 'var(--color-text-muted)', background: 'transparent' }
          }
          onMouseEnter={e => { if (value !== mode) (e.currentTarget as HTMLElement).style.background = 'rgba(99,132,255,0.08)'; }}
          onMouseLeave={e => { if (value !== mode) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          aria-label={mode === 'table' ? 'Vista tabla' : 'Vista tarjetas'}
        >
          <span className="material-icons text-lg">{mode === 'table' ? 'table_rows' : 'grid_view'}</span>
          {mode === 'table' ? 'Tabla' : 'Tarjetas'}
        </button>
      ))}
    </div>
  );
}
