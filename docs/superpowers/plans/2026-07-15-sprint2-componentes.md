# Sprint 2 — Componentes compartidos y consistencia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Depende de** `docs/superpowers/plans/2026-07-15-sprint1-quick-wins.md` (asume Vitest + `react-hot-toast` + `notifySuccess`/`notifyError` + `QueryErrorState` ya existen, y que el Sprint 0 ya dejó Jest funcionando en el backend).

**Goal:** Extraer `<Modal>`, `<ConfirmDialog>` y `<DataTable>` compartidos para resolver de una vez consistencia visual, accesibilidad (Escape/foco/ARIA) y duplicación (roadmap ítem 11); unificar la validación de fechas de reserva (ítem 12); arreglar la doble columna FK (C6) más índices y unicidad de placa/VIN (ítem 13).

**Architecture:** 3 componentes nuevos en `frontend/src/components/ui/` que reemplazan JSX duplicado en 14 páginas; un hook `useDataTable` que envuelve el `usePagination` existente añadiendo búsqueda de texto y orden; un módulo compartido de validación de fechas de reserva; en el backend, corrección de entidades TypeORM + una migración de esquema (columnas, índices, constraints únicos).

**Tech Stack:** React 19 + TypeScript + Tailwind + Vitest/RTL (frontend); NestJS + TypeORM + PostgreSQL (backend).

## Global Constraints

- No reinventar `TableToolbar` (`frontend/src/components/ui/TableToolbar.tsx`) ni `usePagination` (`frontend/src/hooks/usePagination.ts`) — ya funcionan bien, esta tarea los envuelve, no los reemplaza.
- Backend: rebuild tras cada cambio (`cd /root/flotilla/gestor_vehiculos_GPJ && docker compose -f docker_compose.yml up -d --build backend`).
- Cualquier migración de esquema debe generarse con `npm run migration:generate -- src/database/migrations/<Nombre>` y aplicarse con `npm run migration:run` — `synchronize` ya está desactivado desde el Sprint 0 (Task 5), así que **todo** cambio de esquema de aquí en adelante debe pasar por una migración explícita.
- Convención de tema: variables CSS (`var(--color-text)`, `var(--color-surface)`, `var(--color-border)`, `var(--color-bg-soft)`, `var(--color-text-muted)`) — no clases Tailwind fijas de color.

---

### Task 1: Componente `<Modal>` compartido

**Files:**
- Create: `frontend/src/components/ui/Modal.tsx`
- Test: `frontend/src/components/ui/Modal.spec.tsx`
- Modify: `frontend/src/pages/Users/UsersList.tsx`
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx`

**Interfaces:**
- Produces: `<Modal title={string} subtitle?={string} maxWidth?={string} onClose={() => void}>{children}</Modal>` — cierra con Escape, click en overlay, o botón ×; enfoca el primer control al abrir y restaura el foco anterior al cerrar; `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/components/ui/Modal.spec.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renderiza título y contenido con role="dialog"', () => {
    render(
      <Modal title="Editar usuario" onClose={() => {}}>
        <button>Guardar</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar usuario')).toBeInTheDocument();
  });

  it('llama a onClose al presionar Escape', () => {
    const onClose = vi.fn();
    render(<Modal title="X" onClose={onClose}><button>ok</button></Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al hacer click en el overlay pero no al hacer click dentro del diálogo', () => {
    const onClose = vi.fn();
    render(
      <Modal title="X" onClose={onClose}>
        <button>Contenido</button>
      </Modal>,
    );
    fireEvent.click(screen.getByText('Contenido'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('enfoca el primer control interactivo al montar', () => {
    render(
      <Modal title="X" onClose={() => {}}>
        <input placeholder="primero" />
        <button>segundo</button>
      </Modal>,
    );
    expect(screen.getByPlaceholderText('primero')).toHaveFocus();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm test -- Modal.spec.tsx
```
Expected: FAIL — `Failed to resolve import "./Modal"`.

- [ ] **Step 3: Implementar `Modal.tsx`**

Crear `frontend/src/components/ui/Modal.tsx`:
```tsx
import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`rounded-[16px] w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        style={{
          background: 'var(--color-bg-soft)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 flex items-start justify-between gap-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h3 id="modal-title" className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-xl leading-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- Modal.spec.tsx
```
Expected: PASS, 4 tests.

- [ ] **Step 5: Migrar `UserFormModal` (en `UsersList.tsx`) a `<Modal>`**

Import: `import { Modal } from '../../components/ui/Modal';`

Cambiar (líneas 73-83, el JSX de apertura hasta el `<form onSubmit=...>`):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Editar usuario</h3>
          <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
```
por:
```tsx
  return (
    <Modal title="Editar usuario" subtitle={user.email} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
```

Y cambiar el cierre (líneas 141-144):
```tsx
        </form>
      </div>
    </div>
  );
```
por:
```tsx
      </form>
    </Modal>
  );
```

- [ ] **Step 6: Migrar `VehicleFormModal` (en `VehiclesList.tsx`, líneas 196-201 y su cierre) y `ReservationFormModal` (en `ReservationsList.tsx`, líneas 109-118 y su cierre) con la misma transformación**: reemplazar el `<div className="fixed inset-0 ...">...<div className="... w-full max-w-lg ...">...<div className="px-6 py-4 border-b ...">` (header) por `<Modal title="..." subtitle={...} onClose={onClose}>`, y el `<form onSubmit={handleSubmit} className="p-6 space-y-4">` por `<form onSubmit={handleSubmit} className="space-y-4">` (quitar el padding `p-6`, ahora lo aplica `<Modal>`), y el cierre `</form></div></div>` por `</form></Modal>`. Usar como título: "Editar vehículo"/"Nuevo vehículo" para Vehicles, "Editar reserva"/"Nueva reserva" para Reservations (ya existe esa lógica condicional en el `<h3>` actual — moverla al prop `title` de `<Modal>`).

- [ ] **Step 7: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir cada uno de los 3 modales migrados: confirmar que se ven igual que antes, que Escape los cierra, que al abrir el foco entra al primer campo, y que en modo oscuro el fondo del modal ya no es blanco (usa `var(--color-bg-soft)`).

- [ ] **Step 8: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/components/ui/Modal.tsx frontend/src/components/ui/Modal.spec.tsx frontend/src/pages/Users/UsersList.tsx frontend/src/pages/Vehicles/VehiclesList.tsx frontend/src/pages/Reservations/ReservationsList.tsx
git commit -m "$(cat <<'EOF'
refactor(ui): extract shared accessible Modal component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Componente `<ConfirmDialog>` compartido — reemplazar `window.confirm`

**Files:**
- Create: `frontend/src/components/ui/ConfirmDialog.tsx`
- Test: `frontend/src/components/ui/ConfirmDialog.spec.tsx`
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx`
- Modify: `frontend/src/pages/Users/UsersList.tsx`
- Modify: `frontend/src/pages/Sanctions/SanctionList.tsx`
- Modify: `frontend/src/pages/SystemSettings/SystemSettingsPage.tsx`
- Modify: `frontend/src/pages/Incidents/IncidentList.tsx`
- Modify: `frontend/src/pages/Providers/ProvidersList.tsx`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx`
- Modify: `frontend/src/pages/Costs/CostsList.tsx`
- Modify: `frontend/src/pages/FuelRecords/FuelRecordsList.tsx`
- Modify: `frontend/src/pages/Maintenance/MaintenanceList.tsx`

**Interfaces:**
- Consumes: `<Modal>` (Task 1).
- Produces: `<ConfirmDialog message={string} title?={string} confirmLabel?={string} danger?={boolean} onConfirm={() => void} onCancel={() => void} />`.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/components/ui/ConfirmDialog.spec.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('muestra el mensaje y llama a onConfirm/onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog message="¿Eliminar este registro?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText('¿Eliminar este registro?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm test -- ConfirmDialog.spec.tsx
```
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar `ConfirmDialog.tsx`**

Crear `frontend/src/components/ui/ConfirmDialog.tsx`:
```tsx
import { Modal } from './Modal';

export function ConfirmDialog({
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-sm mb-6" style={{ color: 'var(--color-text)' }}>{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-4 py-2 rounded-lg text-white"
          style={{ background: danger ? '#ef4444' : 'var(--color-primary)' }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- ConfirmDialog.spec.tsx
```
Expected: PASS.

- [ ] **Step 5: Migrar el patrón completo en `VehiclesList.tsx` (página de referencia)**

Import: `import { ConfirmDialog } from '../../components/ui/ConfirmDialog';`

Añadir estado (junto a los demás `useState` del componente principal): `const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);`

Cambiar (líneas 484-486):
```ts
  const handleDelete = (v: Vehicle) => {
    if (!window.confirm(`¿Eliminar el vehículo ${v.plate} (${v.brand} ${v.model})?`)) return;
```
por:
```ts
  const handleDelete = (v: Vehicle) => {
    setDeleteTarget(v);
```
(dejar el resto del cuerpo de la función que sigue después de esa línea intacto por ahora — se moverá).

Crear una función separada para la confirmación real, y renderizar el diálogo condicionalmente al final del JSX del componente (antes del cierre del fragment/`</>` principal):
```tsx
      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar el vehículo ${deleteTarget.plate} (${deleteTarget.brand} ${deleteTarget.model})?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            const v = deleteTarget;
            setDeleteTarget(null);
            try {
              await apiClient.delete(`/vehicles/${v.id}`);
              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
              notifySuccess('Vehículo eliminado correctamente.');
            } catch {
              notifyError('No se pudo eliminar el vehículo.');
            }
          }}
        />
      )}
```
(esto reemplaza también el cuerpo residual de `handleDelete` que hacía el borrado directamente — mover esa lógica al `onConfirm` de arriba y dejar `handleDelete` solo con `setDeleteTarget(v)`).

- [ ] **Step 6: Verificación manual del patrón de referencia**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
En `/vehicles`, click en "Eliminar" sobre un vehículo → debe aparecer el diálogo tematizado (no el `confirm()` nativo del navegador), con Escape funcionando y foco correcto. Confirmar → toast de éxito y el vehículo desaparece de la lista. Cancelar → no pasa nada.

- [ ] **Step 7: Aplicar el mismo patrón al resto de páginas con `window.confirm`**

Mismo cambio (estado `deleteTarget`, `handleDelete` solo hace `setDeleteTarget`, `<ConfirmDialog>` condicional con la lógica de borrado real en `onConfirm`) en cada ubicación exacta:

| Archivo | Línea de `window.confirm` actual | Mensaje |
|---|---|---|
| `Users/UsersList.tsx` | 182 | `` `¿Eliminar al usuario ${u.displayName \|\| u.email}?` `` |
| `Sanctions/SanctionList.tsx` | 198 | `'¿Eliminar esta sanción?'` |
| `SystemSettings/SystemSettingsPage.tsx` | 186 | `` `¿Eliminar la configuración "${s.key}"?` `` |
| `Incidents/IncidentList.tsx` | 234 | `'¿Eliminar este incidente?'` |
| `Providers/ProvidersList.tsx` | 182 | `` `¿Eliminar el proveedor ${p.name}?` `` |
| `Reservations/ReservationsList.tsx` (borrado individual) | 466 | `` `¿Eliminar la reserva: ${label}?` `` |
| `Reservations/ReservationsList.tsx` (borrado múltiple de vencidas) | 287 | `` `¿Eliminar ${selected.size} reserva(s) vencida(s)? Esta acción no se puede deshacer.` `` — este caso confirma un borrado **por lote** (`selected: Set<string>`), no un solo objeto; usar `deleteTarget: 'bulk-overdue' \| null` o un booleano `confirmBulkDelete` en vez de un objeto `Vehicle`-like, y en `onConfirm` iterar sobre `selected` |
| `Costs/CostsList.tsx` | 220 | `` `¿Eliminar el gasto "${label}"?` `` |
| `FuelRecords/FuelRecordsList.tsx` | 194 | `'¿Eliminar este registro de combustible?'` |
| `Maintenance/MaintenanceList.tsx` | 224 | `'¿Eliminar este mantenimiento programado?'` |

- [ ] **Step 8: Verificación manual del resto de páginas**

Repetir la verificación del Step 6 en al menos 3 páginas adicionales de la tabla (p. ej. Sanctions, Costs, y el borrado múltiple de reservas vencidas) para confirmar que el caso de borrado por lote también funciona.

- [ ] **Step 9: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/components/ui/ConfirmDialog.tsx frontend/src/components/ui/ConfirmDialog.spec.tsx frontend/src/pages
git commit -m "$(cat <<'EOF'
refactor(ui): replace native window.confirm with themed ConfirmDialog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Hook `useDataTable` + componente `<DataTable>` (búsqueda y orden)

**Files:**
- Create: `frontend/src/hooks/useDataTable.ts`
- Test: `frontend/src/hooks/useDataTable.spec.ts`
- Create: `frontend/src/components/ui/DataTable.tsx`
- Test: `frontend/src/components/ui/DataTable.spec.tsx`
- Modify: `frontend/src/pages/Users/UsersList.tsx`

**Interfaces:**
- Produces: `useDataTable<T>(data: T[], opts: { pageSize?: number; searchFields?: (row: T) => string[] }): { search, setSearch, sortKey, sortDir, toggleSort, paginatedData, page, setPage, pageSize, setPageSize, totalItems, totalPages, startIndex, endIndex, PAGE_SIZE_OPTIONS }` — internamente reutiliza `usePagination` sobre los datos ya filtrados/ordenados.
- Produces: `<DataTable<T> columns={DataTableColumn<T>[]} rows={T[]} getRowKey={(row: T) => string} emptyMessage={string} search? sortKey? sortDir? onSearchChange? onSort? toolbar={ReactNode} />`.
- Consumes: `usePagination` (existente, sin cambios), `TableToolbar` (existente, sin cambios).

- [ ] **Step 1: Escribir el test que falla para `useDataTable`**

Crear `frontend/src/hooks/useDataTable.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataTable } from './useDataTable';

type Row = { id: string; name: string; email: string };

const rows: Row[] = [
  { id: '1', name: 'Beto', email: 'beto@x.com' },
  { id: '2', name: 'Ana', email: 'ana@x.com' },
  { id: '3', name: 'Carlos', email: 'carlos@x.com' },
];

describe('useDataTable', () => {
  it('filtra por texto usando searchFields', () => {
    const { result } = renderHook(() =>
      useDataTable(rows, { searchFields: (r) => [r.name, r.email] }),
    );
    act(() => result.current.setSearch('ana'));
    expect(result.current.paginatedData).toEqual([rows[1]]);
  });

  it('ordena ascendente y descendente al alternar toggleSort', () => {
    const { result } = renderHook(() =>
      useDataTable(rows, { searchFields: (r) => [r.name] }),
    );
    act(() => result.current.toggleSort('name', (r) => r.name));
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Ana', 'Beto', 'Carlos']);
    act(() => result.current.toggleSort('name', (r) => r.name));
    expect(result.current.paginatedData.map((r) => r.name)).toEqual(['Carlos', 'Beto', 'Ana']);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm test -- useDataTable.spec.ts
```
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar `useDataTable`**

Crear `frontend/src/hooks/useDataTable.ts`:
```ts
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

  return { search, setSearch, sortKey, sortDir, toggleSort, ...pagination };
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- useDataTable.spec.ts
```
Expected: PASS, 2 tests. (Revisar la firma real de `usePagination` en `frontend/src/hooks/usePagination.ts` antes de este paso — si su segundo argumento u opciones difieren de `{ pageSize }`, ajustar la llamada dentro de `useDataTable` para que compile; el resto del hook no depende de su implementación interna).

- [ ] **Step 5: Escribir el test que falla para `<DataTable>`**

Crear `frontend/src/components/ui/DataTable.spec.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';

type Row = { id: string; name: string };

describe('DataTable', () => {
  it('renderiza encabezados y filas', () => {
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Nombre', render: (r) => r.name }]}
        rows={[{ id: '1', name: 'Ana' }]}
        getRowKey={(r) => r.id}
        emptyMessage="No hay datos."
      />,
    );
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('muestra emptyMessage cuando rows está vacío', () => {
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Nombre', render: (r) => r.name }]}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyMessage="No hay datos."
      />,
    );
    expect(screen.getByText('No hay datos.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Ejecutar y verificar que falla**

```bash
npm test -- DataTable.spec.tsx
```
Expected: FAIL — módulo no existe.

- [ ] **Step 7: Implementar `<DataTable>`**

Crear `frontend/src/components/ui/DataTable.tsx`:
```tsx
import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  sortAccessor?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  sortKey,
  sortDir,
  onSort,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, accessor: (row: T) => string | number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-4 text-sm font-bold ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--color-text-soft)', cursor: col.sortAccessor ? 'pointer' : undefined }}
                onClick={() => col.sortAccessor && onSort?.(col.key, col.sortAccessor)}
              >
                {col.header}
                {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`} style={{ color: 'var(--color-text)' }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 8: Ejecutar y verificar que pasa**

```bash
npm test -- DataTable.spec.tsx
```
Expected: PASS, 2 tests.

- [ ] **Step 9: Migrar `UsersList.tsx` como página de referencia**

Reemplazar el uso directo de `usePagination` (líneas 192-203) por `useDataTable`:
```ts
  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    paginatedData: paginatedUsers,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    PAGE_SIZE_OPTIONS,
  } = useDataTable<User>(filteredUsers, {
    pageSize: 25,
    searchFields: (u) => [u.email, u.displayName ?? '', u.department ?? ''],
  });
```
Import: `import { useDataTable } from '../../hooks/useDataTable';` y quitar el import de `usePagination` si ya no se usa directamente en el archivo.

Añadir un input de búsqueda antes del `<TableToolbar>` (dentro del bloque `{view === 'table' && (...)}`, línea 256-257):
```tsx
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email, nombre o departamento..."
              className="input-field w-full max-w-sm"
            />
          </div>
```

Reemplazar el bloque `<table>...</table>` completo (líneas 273-336) por:
```tsx
          <DataTable<User>
            columns={[
              { key: 'email', header: 'Email', sortAccessor: (u) => u.email, render: (u) => u.email },
              { key: 'displayName', header: 'Nombre', sortAccessor: (u) => u.displayName ?? '', render: (u) => u.displayName ?? '—' },
              { key: 'department', header: 'Departamento', render: (u) => u.department ?? '—' },
              { key: 'role', header: 'Rol', render: (u) => getRoleName(u) },
              {
                key: 'status',
                header: 'Estado',
                render: (u) => (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                  </span>
                ),
              },
              {
                key: 'lastLoginAt',
                header: 'Último acceso',
                sortAccessor: (u) => u.lastLoginAt ?? '',
                render: (u) =>
                  u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                    : '—',
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (u) => (
                  <>
                    <button type="button" onClick={() => openEdit(u)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(u)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedUsers}
            getRowKey={(u) => u.id}
            emptyMessage="No hay usuarios registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
```
Import: `import { DataTable } from '../../components/ui/DataTable';`.

- [ ] **Step 10: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
En `/users`: confirmar que la tabla se ve igual, que escribir en el buscador filtra por email/nombre/departamento, y que hacer click en los encabezados "Email", "Nombre" o "Último acceso" ordena ascendente/descendente (flechita ▲/▼ visible).

- [ ] **Step 11: Rollout a las páginas restantes**

Aplicar la misma migración (reemplazar `usePagination` por `useDataTable`, añadir el input de búsqueda, reemplazar el `<table>` manual por `<DataTable columns={...}>`) en el resto de páginas de listado: `Vehicles/VehiclesList.tsx`, `Reservations/ReservationsList.tsx`, `FuelRecords/FuelRecordsList.tsx`, `SystemSettings/SystemSettingsPage.tsx`, `Sanctions/SanctionList.tsx`, `Providers/ProvidersList.tsx`, `Incidents/IncidentList.tsx`, `Costs/CostsList.tsx`, `Maintenance/MaintenanceList.tsx`, `MyRequests/MyRequestsPage.tsx`, `AuditLogs/AuditLogsPage.tsx`. Cada página define sus propias `columns` según las que ya renderiza hoy (mismo contenido de celda, ahora dentro de `render: (row) => ...`) y su propio `searchFields` (los 2-3 campos de texto más relevantes de esa entidad, p. ej. placa/marca/modelo para vehículos, motivo para sanciones). Verificar cada página manualmente tras migrarla (búsqueda + orden + que no se rompió ninguna acción existente).

- [ ] **Step 12: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/hooks/useDataTable.ts frontend/src/hooks/useDataTable.spec.ts frontend/src/components/ui/DataTable.tsx frontend/src/components/ui/DataTable.spec.tsx frontend/src/pages
git commit -m "$(cat <<'EOF'
refactor(ui): add search/sort via useDataTable + DataTable, migrate list pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Unificar validación de fechas de reserva

**Files:**
- Create: `frontend/src/lib/reservationDates.ts`
- Test: `frontend/src/lib/reservationDates.spec.ts`
- Modify: `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx`

**Interfaces:**
- Produces: `validateReservationDates(startDatetime: string, endDatetime: string, opts?: { allowPast?: boolean }): string | null` — devuelve el mensaje de error o `null` si es válido.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/lib/reservationDates.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateReservationDates } from './reservationDates';

describe('validateReservationDates', () => {
  it('rechaza fechas inválidas', () => {
    expect(validateReservationDates('no-es-fecha', '2026-08-01T10:00')).toMatch(/no son válidas/);
  });

  it('rechaza años fuera de rango', () => {
    expect(validateReservationDates('2010-01-01T10:00', '2010-01-01T12:00')).toMatch(/año debe estar entre/);
  });

  it('rechaza regreso anterior o igual a salida', () => {
    expect(validateReservationDates('2026-08-01T12:00', '2026-08-01T10:00')).toMatch(/posterior a la hora de salida/);
    expect(validateReservationDates('2026-08-01T12:00', '2026-08-01T12:00')).toMatch(/posterior a la hora de salida/);
  });

  it('rechaza fechas en el pasado salvo que allowPast sea true', () => {
    expect(validateReservationDates('2020-01-01T10:00', '2020-01-01T12:00')).toMatch(/no puede estar en el pasado|año debe estar entre/);
    expect(validateReservationDates('2020-01-01T10:00', '2020-01-01T12:00', { allowPast: true })).toMatch(/año debe estar entre/);
  });

  it('acepta un rango válido', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const start = future.toISOString().slice(0, 16);
    const end = new Date(future.getTime() + 3600000).toISOString().slice(0, 16);
    expect(validateReservationDates(start, end)).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm test -- reservationDates.spec.ts
```
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar `validateReservationDates`**

Crear `frontend/src/lib/reservationDates.ts`:
```ts
export function validateReservationDates(
  startDatetime: string,
  endDatetime: string,
  opts: { allowPast?: boolean } = {},
): string | null {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Las fechas no son válidas. Revisa hora de salida y de regreso.';
  }
  const yearMin = 2020;
  const yearMax = 2035;
  if (
    start.getFullYear() < yearMin ||
    start.getFullYear() > yearMax ||
    end.getFullYear() < yearMin ||
    end.getFullYear() > yearMax
  ) {
    return `El año debe estar entre ${yearMin} y ${yearMax}. Revisa las fechas.`;
  }
  if (!opts.allowPast && start.getTime() < Date.now() - 5 * 60 * 1000) {
    return 'La fecha de salida no puede estar en el pasado.';
  }
  if (end.getTime() <= start.getTime()) {
    return 'La hora de regreso debe ser posterior a la hora de salida.';
  }
  return null;
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- reservationDates.spec.ts
```
Expected: PASS, 5 tests.

- [ ] **Step 5: Usar la función en el modal del conductor**

En `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx`, import: `import { validateReservationDates } from '../../lib/reservationDates';`.

Cambiar el bloque de validación manual en `handleSubmit`:
```ts
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Las fechas no son válidas. Revisa hora de salida y de regreso.');
      return;
    }
    const yearMin = 2020;
    const yearMax = 2035;
    if (start.getFullYear() < yearMin || start.getFullYear() > yearMax || end.getFullYear() < yearMin || end.getFullYear() > yearMax) {
      setError(`El año debe estar entre ${yearMin} y ${yearMax}. Revisa las fechas.`);
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError('La hora de regreso debe ser posterior a la hora de salida.');
      return;
    }
```
por:
```ts
    const validationError = validateReservationDates(startDatetime, endDatetime);
    if (validationError) {
      setError(validationError);
      return;
    }
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
```

Añadir el atributo `min` a los dos inputs `datetime-local` de este archivo (usando el helper local `toDatetimeLocal` ya existente en el mismo componente):
```tsx
              <input
                type="datetime-local"
                required
                min={toDatetimeLocal(new Date())}
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="input-field w-full"
              />
```
(mismo `min` en el input de `endDatetime`).

- [ ] **Step 6: Usar la función en el modal del admin**

En `frontend/src/pages/Reservations/ReservationsList.tsx`, import: `import { validateReservationDates } from '../../lib/reservationDates';`.

En `handleSubmit` de `ReservationFormModal`, antes de construir `payload`:
```ts
    const validationError = validateReservationDates(form.startDatetime, form.endDatetime, {
      allowPast: Boolean(reservation), // al editar una reserva existente se permite conservar/corregir fechas pasadas
    });
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }
```
(insertar justo después de `setSubmitting(true);` y antes de `const payload = {...}`).

Añadir `min` solo quando se crea una reserva nueva (usando el helper local `toLocal` ya existente en este archivo):
```tsx
              <input
                type="datetime-local"
                required
                min={reservation ? undefined : toLocal(new Date())}
                value={form.startDatetime}
                onChange={(e) => setForm((f) => ({ ...f, startDatetime: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
```

- [ ] **Step 7: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
En `/solicitud-vehiculos`, intentar reservar con fecha de regreso anterior a la de salida → error. En `/reservations`, crear una reserva nueva desde el modal de admin con regreso anterior a salida → debe mostrar el mismo error (antes no validaba nada). Confirmar que editar una reserva existente ya vencida (fecha pasada) sigue permitiéndose desde el admin.

- [ ] **Step 8: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/lib/reservationDates.ts frontend/src/lib/reservationDates.spec.ts frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx frontend/src/pages/Reservations/ReservationsList.tsx
git commit -m "$(cat <<'EOF'
fix: unify reservation date validation between driver and admin modals

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: C6 — doble columna FK + índices + unicidad de placa/VIN/permission

**Files:**
- Modify: `backend/src/database/entities/fuel-record.entity.ts`
- Modify: `backend/src/database/entities/maintenance.entity.ts`
- Modify: `backend/src/database/entities/incident.entity.ts`
- Modify: `backend/src/database/entities/cost.entity.ts`
- Modify: `backend/src/database/entities/vehicle.entity.ts`
- Modify: `backend/src/database/entities/permission.entity.ts`
- Create: `backend/src/database/migrations/<timestamp>-FixDoubleFkAndAddConstraints.ts`

**Interfaces:** N/A (fix de esquema; las relaciones `vehicle`/`user` cargadas vía `leftJoinAndSelect` en los servicios existentes empiezan a resolver correctamente sin cambios de código en esos servicios).

- [ ] **Step 1: Corregir `fuel-record.entity.ts`**

Cambiar:
```ts
  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;
```
por (mismo patrón que `reservation.entity.ts`, columna física única):
```ts
  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;
```

- [ ] **Step 2: Corregir `maintenance.entity.ts`** con el mismo cambio exacto (misma forma de `vehicleId`/`vehicle`).

- [ ] **Step 2b: Corregir `cost.entity.ts`** — tiene exactamente el mismo bug (`@Column() vehicleId` + `@JoinColumn({ name: 'vehicle_id' })` por separado, líneas 17-22). Aplicar el mismo cambio: mover `vehicleId` a `@Column({ name: 'vehicle_id' })` justo después del `@ManyToOne`/`@JoinColumn`. Este entity no estaba en el hallazgo original C6 del análisis (que solo mencionaba fuel-record/maintenance/incident), pero tiene el mismo patrón roto y el reporte de TCO del Sprint 3 depende de que `cost.vehicle` resuelva correctamente vía `leftJoinAndSelect` — corregirlo aquí evita arrastrar el mismo bug a esa tarea.

- [ ] **Step 3: Corregir `incident.entity.ts`** — aplicar el mismo cambio para **ambas** duplas (`vehicleId`/`vehicle` y `userId`/`user`):
```ts
  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;
```

- [ ] **Step 4: Añadir unicidad e índices**

En `backend/src/database/entities/vehicle.entity.ts`, cambiar:
```ts
  @Column()
  plate: string;
```
por:
```ts
  @Column({ unique: true })
  plate: string;
```
y:
```ts
  @Column({ nullable: true })
  vin: string;
```
por:
```ts
  @Column({ nullable: true, unique: true })
  vin: string;
```

En `backend/src/database/entities/permission.entity.ts`, añadir el decorador de unicidad compuesta a nivel de clase:
```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique } from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
@Unique(['resource', 'action'])
export class Permission {
```

En `backend/src/database/entities/reservation.entity.ts`, añadir índices a las columnas de filtro frecuente (`status`, `vehicleId`, `userId` ya tienen columna; añadir `@Index()`):
```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
```
y decorar:
```ts
  @Column({ name: 'user_id' })
  @Index()
  userId: string;
  ...
  @Column({ name: 'vehicle_id' })
  @Index()
  vehicleId: string;
  ...
  @Column({ default: 'pending' })
  @Index()
  status: string;
```
(mover el `@Index()` a la línea inmediatamente anterior a cada `@Column` correspondiente, respetando el orden de decoradores de TypeORM — decorador de propiedad, se puede poner en cualquier orden relativo a `@Column`).

En `backend/src/database/entities/notification.entity.ts`, añadir `@Index()` a la columna `userId` (verificar el nombre exacto de la columna en ese archivo antes de aplicar — no fue leído en el análisis previo; confirmar con `grep -n "userId\|@Column" backend/src/database/entities/notification.entity.ts` antes de editar).

- [ ] **Step 5: Generar la migración**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm run migration:generate -- src/database/migrations/FixDoubleFkAndAddConstraints
```
Expected: TypeORM detecta el diff entre entidades y el esquema real (2 columnas duplicadas por tabla → 1; nuevos índices; nuevos `UNIQUE`) y genera el archivo de migración. **Revisar el archivo generado antes de aplicarlo** — el `DROP COLUMN` de las columnas `vehicleId`/`userId` duplicadas debe ir **después** de un `UPDATE` que copie los datos existentes a la columna que se conserva (`vehicle_id`/`user_id`), porque `migration:generate` por sí solo no sabe que hay que preservar datos, solo generará `ADD`/`DROP` de columnas. Editar el archivo generado para insertar, antes de cada `DROP COLUMN`, las sentencias de backfill:

```ts
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill antes de eliminar las columnas duplicadas
    await queryRunner.query(`UPDATE fuel_records SET vehicle_id = "vehicleId" WHERE vehicle_id IS NULL`);
    await queryRunner.query(`UPDATE maintenance SET vehicle_id = "vehicleId" WHERE vehicle_id IS NULL`);
    await queryRunner.query(`UPDATE incidents SET vehicle_id = "vehicleId" WHERE vehicle_id IS NULL`);
    await queryRunner.query(`UPDATE incidents SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL`);
    await queryRunner.query(`UPDATE costs SET vehicle_id = "vehicleId" WHERE vehicle_id IS NULL`);

    // ... aquí continúan las sentencias ADD/DROP/CREATE INDEX/ADD CONSTRAINT generadas automáticamente ...
  }
```
Y en `down()`, hacer el backfill inverso antes de recrear las columnas viejas (o aceptar que el `down()` no restaura los datos de las columnas eliminadas — documentarlo con un comentario si así queda, ya que es una migración destructiva de un dato redundante, no del dato canónico).

- [ ] **Step 6: Verificar que no hay filas huérfanas antes de aplicar `NOT NULL`/`UNIQUE`**

Antes de correr la migración contra la base de datos real, verificar que no existan violaciones:
```bash
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c \
  "SELECT plate, COUNT(*) FROM vehicles GROUP BY plate HAVING COUNT(*) > 1;"
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c \
  "SELECT vin, COUNT(*) FROM vehicles WHERE vin IS NOT NULL GROUP BY vin HAVING COUNT(*) > 1;"
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c \
  "SELECT resource, action, COUNT(*) FROM permissions GROUP BY resource, action HAVING COUNT(*) > 1;"
```
Expected: 0 filas en las 3 consultas. Si aparece alguna, resolver el duplicado manualmente (renombrar placa/VIN duplicados, o eliminar el permiso repetido) **antes** de correr `migration:run`, o la migración fallará al crear el `UNIQUE`/`@Unique`.

- [ ] **Step 7: Aplicar la migración**

```bash
npm run migration:run
```
Expected: corre sin errores. Verificar:
```bash
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c "\d fuel_records"
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c "\d incidents"
```
Expected: cada tabla ya no tiene la columna `vehicleId`/`userId` duplicada — solo `vehicle_id`/`user_id`.

- [ ] **Step 8: Verificación manual de que las relaciones ahora resuelven**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```
Crear un registro de combustible nuevo desde `/fuel-records`, y confirmar en el reporte de combustible (`/reports`) que el vehículo aparece correctamente asociado (antes de este fix, guardar por el escalar `vehicleId` dejaba `vehicle_id` en NULL y el `leftJoinAndSelect` no resolvía la relación).

- [ ] **Step 9: Correr la suite de backend completa**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test
```
Expected: PASS — ningún test de los Sprints 0-1 depende de las columnas eliminadas.

- [ ] **Step 10: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/database
git commit -m "$(cat <<'EOF'
fix(C6): remove duplicate FK columns, add uniqueness and indexes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Cobertura de la especificación:** ítem 11 (Modal/DataTable/ConfirmDialog — Tasks 1-3), ítem 12 (validación de fechas — Task 4), ítem 13 (C6 + índices + unicidad — Task 5) del roadmap "Sprint 2" están cubiertos.

**Placeholders:** el rollout de Task 2/Step 7 y Task 3/Step 11 da ubicación exacta (archivo + línea) para cada página en vez de repetir el código — el patrón completo con código real se muestra una vez (Steps 5/9 respectivamente) y verificado antes de replicarlo.

**Consistencia de tipos:** `ConfirmDialog` y `DataTable` se construyen sobre `Modal` (Task 1) sin cambiar su interfaz. `useDataTable` reutiliza `usePagination` sin modificarlo — Step 4 de Task 3 señala explícitamente verificar la firma real de `usePagination` antes de asumir compatibilidad, ya que no fue leída completa durante la investigación de este plan.

**Nota de alcance:** el punto "navegación: un solo dropdown Administración, sin sidebar/breadcrumbs" del análisis (sección 🟡 Medio, no está en el roadmap de sprints) queda fuera de este plan — no aparece en los 18 ítems numerados del roadmap.
