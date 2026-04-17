/**
 * Assigns a consistent color to each vehicle based on its ID.
 * Colors are basic, high-contrast and look good in both light and dark themes.
 */

const PALETTE = [
  { bg: '#3b82f6', border: '#2563eb' }, // blue
  { bg: '#22c55e', border: '#16a34a' }, // green
  { bg: '#f97316', border: '#ea580c' }, // orange
  { bg: '#a855f7', border: '#9333ea' }, // purple
  { bg: '#06b6d4', border: '#0891b2' }, // cyan
  { bg: '#ef4444', border: '#dc2626' }, // red
  { bg: '#eab308', border: '#ca8a04' }, // yellow
  { bg: '#ec4899', border: '#db2777' }, // pink
  { bg: '#14b8a6', border: '#0d9488' }, // teal
  { bg: '#84cc16', border: '#65a30d' }, // lime
  { bg: '#8b5cf6', border: '#7c3aed' }, // violet
  { bg: '#f43f5e', border: '#e11d48' }, // rose
];

/** XOR-chunks hash: splits the UUID into four 8-hex-char segments and
 *  XORs them together. Distributes UUIDs much better than djb2 because
 *  it uses all 32 hex digits with equal weight. */
function hashId(id: string): number {
  const clean = id.replace(/-/g, '');
  const a = parseInt(clean.slice(0, 8), 16) || 0;
  const b = parseInt(clean.slice(8, 16), 16) || 0;
  const c = parseInt(clean.slice(16, 24), 16) || 0;
  const d = parseInt(clean.slice(24, 32), 16) || 0;
  return ((a ^ b ^ c ^ d) >>> 0) % PALETTE.length;
}

export type VehicleColor = { bg: string; border: string };

/** Returns a stable { bg, border } color pair for the given vehicle ID. */
export function getVehicleColor(vehicleId: string): VehicleColor {
  return PALETTE[hashId(vehicleId)];
}

/** Same color but with reduced opacity for pending events (alpha on the bg). */
export function getVehicleColorPending(vehicleId: string): VehicleColor {
  const c = PALETTE[hashId(vehicleId)];
  // parse hex → rgba with 0.55 alpha
  const r = parseInt(c.bg.slice(1, 3), 16);
  const g = parseInt(c.bg.slice(3, 5), 16);
  const b = parseInt(c.bg.slice(5, 7), 16);
  return {
    bg: `rgba(${r},${g},${b},0.55)`,
    border: c.border,
  };
}
