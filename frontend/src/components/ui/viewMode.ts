export type ViewMode = 'table' | 'cards';

const STORAGE_PREFIX = 'fleet_view_';

export function getStoredView(storageKey: string | undefined): ViewMode {
  if (!storageKey) return 'table';
  const s = localStorage.getItem(STORAGE_PREFIX + storageKey);
  return s === 'cards' ? 'cards' : 'table';
}

export function storeView(storageKey: string, view: ViewMode) {
  localStorage.setItem(STORAGE_PREFIX + storageKey, view);
}
