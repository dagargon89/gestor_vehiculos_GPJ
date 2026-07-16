import { type ViewMode, storeView } from './viewMode';

type ViewToggleProps = {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  storageKey?: string;
};

export function ViewToggle({ value, onChange, storageKey }: ViewToggleProps) {
  const handleChange = (v: ViewMode) => {
    onChange(v);
    if (storageKey) {
      storeView(storageKey, v);
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
              ? { background: 'linear-gradient(135deg,#f5a524,#e08700)', color: 'var(--color-text-on-primary)' }
              : { color: 'var(--color-text-muted)', background: 'transparent' }
          }
          onMouseEnter={e => { if (value !== mode) (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.08)'; }}
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
