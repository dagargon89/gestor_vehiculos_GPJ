import { useState, useRef, useEffect, useMemo } from 'react';

export type SearchSelectOption = { value: string; label: string };

type SearchSelectProps = {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  required = false,
  disabled = false,
  className = '',
  id,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setHighlightIndex(0);
    searchInputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const item = el.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open, filteredOptions.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIndex((i) => (i > 0 ? i - 1 : filteredOptions.length - 1)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[highlightIndex];
      if (opt) { onChange(opt.value); setOpen(false); }
      return;
    }
  }

  const displayText   = selectedLabel || placeholder;
  const showPlaceholder = !selectedLabel;

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--color-input-bg)',
    color: showPlaceholder ? 'var(--color-text-muted)' : 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    textAlign: 'left',
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        aria-invalid={required && !value}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        style={triggerStyle}
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,132,255,0.45)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,132,255,0.10)'; }}
        onBlur={e  => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
      >
        <span className="truncate">{displayText}</span>
        <span className="material-icons shrink-0 ml-1" style={{ fontSize: 18, color: 'var(--color-text-muted)' }} aria-hidden>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {required && !value && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          value={value}
          onChange={() => {}}
        />
      )}

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
          style={{
            background: 'var(--color-menu-bg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
          }}
          role="listbox"
        >
          <div className="p-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar…"
              className="input-field"
              style={{ padding: '6px 12px', fontSize: 13 }}
              aria-label="Buscar opciones"
            />
          </div>
          <ul ref={listRef} className="max-h-60 overflow-auto py-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Sin resultados</li>
            ) : (
              filteredOptions.map((opt, i) => (
                <li key={opt.value} role="option" aria-selected={opt.value === value}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    onMouseEnter={() => setHighlightIndex(i)}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{
                      color: opt.value === value ? '#818cf8' : 'var(--color-text-soft)',
                      background: opt.value === value
                        ? 'rgba(99,132,255,0.10)'
                        : i === highlightIndex
                        ? 'rgba(99,132,255,0.07)'
                        : 'transparent',
                      fontWeight: opt.value === value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
