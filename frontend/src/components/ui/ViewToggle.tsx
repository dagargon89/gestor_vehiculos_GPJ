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
    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => handleChange('table')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          value === 'table'
            ? 'bg-primary text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="Vista tabla"
      >
        <span className="material-icons text-lg">table_rows</span>
        Tabla
      </button>
      <button
        type="button"
        onClick={() => handleChange('cards')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          value === 'cards'
            ? 'bg-primary text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="Vista tarjetas"
      >
        <span className="material-icons text-lg">grid_view</span>
        Tarjetas
      </button>
    </div>
  );
}
