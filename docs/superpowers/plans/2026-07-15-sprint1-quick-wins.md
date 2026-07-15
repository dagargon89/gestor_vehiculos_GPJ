# Sprint 1 — Quick wins de usabilidad y negocio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Depende de** `docs/superpowers/plans/2026-07-15-sprint0-seguridad.md` (asume que Jest ya está instalado en el backend, Task 2 de ese plan).

**Goal:** Cerrar los quick-wins de alto impacto/bajo esfuerzo del roadmap (U2, U3, U5, U6, dashboard de costos, U1) — feedback de acciones, notificación al aprobador, sanciones/licencia bloqueando reservas, costo real en el dashboard, y modo oscuro roto en 3 páginas.

**Architecture:** Frontend: se introduce Vitest + React Testing Library (no existía ningún test en el frontend) y `react-hot-toast` para feedback de acciones; un componente `<QueryErrorState>` compartido para el manejo de error de carga. Backend: nuevo método de consulta de "aprobadores" reutilizando el modelo RBAC existente, validaciones de sanción/licencia en `ReservationsService.create()`, ampliación del cálculo de costos del dashboard con `fuel_records`.

**Tech Stack:** React 19 + Vite 7 + `@tanstack/react-query` + Tailwind (frontend); NestJS + TypeORM (backend); Vitest + `@testing-library/react` + `jsdom` (nuevo); `react-hot-toast` (nuevo).

## Global Constraints

- Frontend corre en el host con `npm run dev` (HMR) — los cambios en `frontend/src/**` se reflejan solos, no requieren rebuild de Docker.
- Backend: tras cualquier cambio en `backend/src/**`, `cd /root/flotilla/gestor_vehiculos_GPJ && docker compose -f docker_compose.yml up -d --build backend`, verificar con `docker logs fleet-backend --tail 30`.
- Todas las páginas de listado usan el patrón `usePagination` (`frontend/src/hooks/usePagination.ts`) y `TableToolbar` (`frontend/src/components/ui/TableToolbar.tsx`) — no reinventar paginación/exportación en esta tarea, ya existen.
- Convención de tema: usar variables CSS (`var(--color-text)`, `var(--color-text-muted)`, `var(--color-surface)`, `var(--color-border)`, `var(--color-bg-soft)`) en vez de clases Tailwind fijas (`text-slate-900`, `bg-white`, `border-slate-200`) — patrón de referencia correcto: `frontend/src/pages/Dashboard/Dashboard.tsx` y `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx` (el archivo `VehicleRequestPage.backup.tsx` en la misma carpeta es el ejemplo del patrón roto — no usarlo de referencia, ignorarlo).
- Roles sembrados: `admin` (bypassa todo permiso), `manager_flotilla`, `conductor`. El conductor tiene por defecto (hardcodeado en `backend/src/common/guards/permissions.guard.ts`) `reservations:read/create/update` — pero en la base de datos real (`backend/src/database/seeds/index.ts`) también tiene explícitamente esos 3, **nunca** `reservations:delete`. Esto es relevante para Task 3 (distinguir "aprobador" de "conductor").

---

### Task 1: Bootstrap de Vitest + toasts globales (U2)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/lib/toast.ts`
- Test: `frontend/src/lib/toast.spec.ts`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: `notifySuccess(message: string): void`, `notifyError(message: string): void` desde `frontend/src/lib/toast.ts` — usados por todas las páginas en Tasks siguientes.

- [ ] **Step 1: Instalar dependencias**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm install react-hot-toast
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/ui
```

- [ ] **Step 2: Añadir bloque `test` a `vite.config.ts` y script a `package.json`**

En `frontend/vite.config.ts`, añadir la clave `test` al objeto de `defineConfig` (Vitest la lee del mismo archivo):
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['vehiculos.participajuarez.org'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
      },
    },
  },
})
```

En `frontend/package.json`, añadir al bloque `"scripts"`: `"test": "vitest run"`.

Crear `frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Escribir el test que falla**

Crear `frontend/src/lib/toast.spec.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('lib/toast', () => {
  it('notifySuccess delega en toast.success', async () => {
    const { notifySuccess } = await import('./toast');
    notifySuccess('Guardado correctamente');
    expect(toast.success).toHaveBeenCalledWith('Guardado correctamente');
  });

  it('notifyError delega en toast.error', async () => {
    const { notifyError } = await import('./toast');
    notifyError('Algo salió mal');
    expect(toast.error).toHaveBeenCalledWith('Algo salió mal');
  });
});
```

- [ ] **Step 4: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm test -- toast.spec.ts
```
Expected: FAIL — `Failed to resolve import "./toast"` (el módulo no existe todavía).

- [ ] **Step 5: Implementar el wrapper**

Crear `frontend/src/lib/toast.ts`:
```ts
import toast from 'react-hot-toast';

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(message: string): void {
  toast.error(message);
}
```

- [ ] **Step 6: Ejecutar y verificar que pasa**

```bash
npm test -- toast.spec.ts
```
Expected: PASS, 2 tests.

- [ ] **Step 7: Montar el `<Toaster/>` global**

En `frontend/src/App.tsx`, añadir el import:
```ts
import { Toaster } from 'react-hot-toast';
```
y dentro de `<QueryClientProvider client={queryClient}>`, como primer hijo (antes de `<BrowserRouter>`):
```tsx
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
      <BrowserRouter>
```

- [ ] **Step 8: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm run dev
```
Abrir el navegador, iniciar sesión, y confirmar visualmente que la app carga sin errores en consola (el `<Toaster/>` no debe mostrar nada todavía — se usa en la Task 2).

- [ ] **Step 9: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/test frontend/src/lib/toast.ts frontend/src/lib/toast.spec.ts frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(U2): bootstrap Vitest and add global toast notifications

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Aplicar toasts de éxito/error en las 14 páginas de administración (U2)

**Files:**
- Modify: `frontend/src/pages/Users/UsersList.tsx`
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx`
- Modify: `frontend/src/pages/FuelRecords/FuelRecordsList.tsx`
- Modify: `frontend/src/pages/SystemSettings/SystemSettingsPage.tsx`
- Modify: `frontend/src/pages/RolePermissions/RolePermissionsPage.tsx`
- Modify: `frontend/src/pages/Sanctions/SanctionList.tsx`
- Modify: `frontend/src/pages/Providers/ProvidersList.tsx`
- Modify: `frontend/src/pages/Incidents/IncidentList.tsx`
- Modify: `frontend/src/pages/Costs/CostsList.tsx`
- Modify: `frontend/src/pages/Maintenance/MaintenanceList.tsx`
- Modify: `frontend/src/pages/MyRequests/MyRequestsPage.tsx`
- Modify: `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx`

**Interfaces:**
- Consumes: `notifySuccess`/`notifyError` de `frontend/src/lib/toast.ts` (Task 1).

Todas las páginas de esta lista comparten **exactamente** el mismo patrón: un `deleteMutation` con `onSuccess: () => queryClient.invalidateQueries(...)` y sin `onError`, y un modal de formulario cuyo `onSuccess={() => queryClient.invalidateQueries(...)}` se pasa como prop desde la página. Se corrige el mismo patrón en cada archivo.

- [ ] **Step 1: Patrón completo en `UsersList.tsx` (página de referencia)**

Import, al inicio del archivo:
```ts
import { notifySuccess, notifyError } from '../../lib/toast';
```

Cambiar (línea 171-174):
```ts
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
```
por:
```ts
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notifySuccess('Usuario eliminado correctamente.');
    },
    onError: () => notifyError('No se pudo eliminar el usuario.'),
  });
```

Cambiar (línea 392):
```tsx
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
```
por:
```tsx
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifySuccess('Usuario guardado correctamente.');
          }}
```

- [ ] **Step 2: Verificación manual del patrón de referencia**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
En el navegador: editar un usuario y guardar → debe aparecer un toast verde "Usuario guardado correctamente." arriba a la derecha. Eliminar un usuario → toast "Usuario eliminado correctamente.". Provocar un error (p. ej. apagar el backend un momento y reintentar eliminar) → toast rojo de error.

- [ ] **Step 3: Aplicar el mismo patrón, archivo por archivo**

Repetir exactamente la misma transformación (import + `onSuccess`/`onError` en `deleteMutation` + `onSuccess` del modal) en cada archivo, sustituyendo el nombre del recurso y el mensaje. Ubicaciones exactas del `deleteMutation` y del `onSuccess={() => queryClient.invalidateQueries...}` del modal en cada archivo:

| Archivo | `deleteMutation` (líneas) | `onSuccess` del modal (línea) | queryKey / mensaje |
|---|---|---|---|
| `Vehicles/VehiclesList.tsx` | no existe como `useMutation` reusable — revisar `handleDelete` línea 484-486, envolver la llamada `apiClient.delete` en un try/catch con `notifySuccess`/`notifyError` | línea 688 | `'vehicles'` / "Vehículo guardado/eliminado correctamente." |
| `Reservations/ReservationsList.tsx` | revisar `handleDelete` línea 461-467 (usa `apiClient.delete` directo, no `useMutation`) — envolver en try/catch | línea 605 | `'reservations'` / "Reserva guardada/eliminada correctamente." |
| `FuelRecords/FuelRecordsList.tsx` | líneas 186-188 | línea 310 | `'fuel-records'` / "Registro de combustible guardado/eliminado correctamente." |
| `SystemSettings/SystemSettingsPage.tsx` | líneas 170-172 | línea 378 | `'system-settings'` / "Configuración guardada/eliminada correctamente." |
| `RolePermissions/RolePermissionsPage.tsx` | usa `updateMutation` (línea 156-161), no `deleteMutation` — añadir `notifySuccess` en su `onSuccess` (línea 159-161) | `onSuccess={handleRoleCreated}` línea 286 — añadir `notifySuccess` dentro de `handleRoleCreated` | `'roles'` / "Permisos actualizados correctamente." |
| `Sanctions/SanctionList.tsx` | líneas 182-184 | línea 346 | `'sanctions'` / "Sanción guardada/eliminada correctamente." |
| `Providers/ProvidersList.tsx` | líneas 166-168 | línea 338 | `'providers'` / "Proveedor guardado/eliminado correctamente." |
| `Incidents/IncidentList.tsx` | líneas 218-220 | línea 412 | `'incidents'` / "Incidente guardado/eliminado correctamente." |
| `Costs/CostsList.tsx` | líneas 213-215 | línea 530 | `'costs'` / "Gasto guardado/eliminado correctamente." |
| `Maintenance/MaintenanceList.tsx` | líneas 208-210 | línea 384 | `'maintenance'` / "Mantenimiento guardado/eliminado correctamente." |
| `MyRequests/MyRequestsPage.tsx` | no tiene `deleteMutation` (el conductor no borra); localizar el/los `useMutation` de cancelar/check-in/check-out cerca de la línea 175-488 y añadir `notifySuccess`/`notifyError` a cada uno | — | `'reservations'` / mensaje según acción |
| `VehicleRequest/VehicleRequestPage.tsx` | no tiene `deleteMutation`; el `handleSubmit` del modal de reserva (catch en línea 122) ya muestra error inline — añadir `notifySuccess('Solicitud enviada correctamente.')` justo después de la llamada exitosa a `apiClient.post`, antes de cerrar el modal | — | — |

Para `Vehicles/VehiclesList.tsx` y `Reservations/ReservationsList.tsx` (que no usan `useMutation` para el borrado, sino `apiClient.delete` directo dentro de `handleDelete`), envolver así (ejemplo con Vehicles, línea 484-486):
```ts
  const handleDelete = async (v: Vehicle) => {
    if (!window.confirm(`¿Eliminar el vehículo ${v.plate} (${v.brand} ${v.model})?`)) return;
    try {
      await apiClient.delete(`/vehicles/${v.id}`);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      notifySuccess('Vehículo eliminado correctamente.');
    } catch {
      notifyError('No se pudo eliminar el vehículo.');
    }
  };
```
(ajustar el nombre de la función a `async` si no lo era, y revisar si ya existía una llamada a `apiClient.delete` distinta a una mutation — usar el mismo `apiClient.delete` que ya está en el archivo).

- [ ] **Step 4: Verificación manual de cada página**

Para cada archivo modificado: abrir la página en el navegador, crear/editar un registro (toast de éxito), eliminar un registro (toast de éxito), y forzar un error de red (DevTools → Network → Offline, o parar el backend) al intentar guardar/eliminar (toast de error). Confirmar que no quedó ninguna acción silenciosa.

- [ ] **Step 5: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages
git commit -m "$(cat <<'EOF'
feat(U2): surface success/error toasts on every create/update/delete action

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Manejo de error de carga con reintento (U3)

**Files:**
- Create: `frontend/src/components/ui/QueryErrorState.tsx`
- Test: `frontend/src/components/ui/QueryErrorState.spec.tsx`
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx`
- Modify: `frontend/src/pages/FuelRecords/FuelRecordsList.tsx`
- Modify: `frontend/src/pages/SystemSettings/SystemSettingsPage.tsx`
- Modify: `frontend/src/pages/Sanctions/SanctionList.tsx`
- Modify: `frontend/src/pages/Providers/ProvidersList.tsx`
- Modify: `frontend/src/pages/MyRequests/MyRequestsPage.tsx`
- Modify: `frontend/src/pages/Incidents/IncidentList.tsx`
- Modify: `frontend/src/pages/Costs/CostsList.tsx`
- Modify: `frontend/src/pages/Maintenance/MaintenanceList.tsx`
- Modify: `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx`
- Modify: `frontend/src/pages/AuditLogs/AuditLogsPage.tsx`

**Interfaces:**
- Produces: `<QueryErrorState title={string} message={string} onRetry={() => void} />` componente reutilizable.

- [ ] **Step 1: Escribir el test que falla**

Crear `frontend/src/components/ui/QueryErrorState.spec.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryErrorState } from './QueryErrorState';

describe('QueryErrorState', () => {
  it('muestra el título y el mensaje de error', () => {
    render(<QueryErrorState title="Vehículos" message="Network Error" onRetry={() => {}} />);
    expect(screen.getByText('Error al cargar Vehículos.')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('llama a onRetry al hacer click en Reintentar', () => {
    const onRetry = vi.fn();
    render(<QueryErrorState title="Vehículos" message="Network Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm test -- QueryErrorState.spec.tsx
```
Expected: FAIL — `Failed to resolve import "./QueryErrorState"`.

- [ ] **Step 3: Implementar el componente**

Crear `frontend/src/components/ui/QueryErrorState.tsx`:
```tsx
export function QueryErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-[16px] px-6 py-4"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
    >
      <p className="font-medium">Error al cargar {title}.</p>
      <p className="text-sm mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: '#ef4444', color: '#fff' }}
      >
        Reintentar
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- QueryErrorState.spec.tsx
```
Expected: PASS, 2 tests.

- [ ] **Step 5: Aplicar en cada página de listado**

Patrón a aplicar en cada archivo (ejemplo con `VehiclesList.tsx`):

Import: `import { QueryErrorState } from '../../components/ui/QueryErrorState';`

Cambiar (línea 461):
```ts
  const { data: vehicles = [], isLoading } = useQuery({
```
por:
```ts
  const { data: vehicles = [], isLoading, isError, error, refetch } = useQuery({
```

Y justo después del `if (isLoading) return ...;` (línea 515), añadir:
```tsx
  if (isError) {
    return (
      <QueryErrorState
        title="vehículos"
        message={error instanceof Error ? error.message : 'Error desconocido'}
        onRetry={() => refetch()}
      />
    );
  }
```

Repetir la misma transformación (añadir `isError, error, refetch` al destructuring del `useQuery` principal de la página + bloque `if (isError) return <QueryErrorState .../>` tras el `if (isLoading)`) en:

| Archivo | Línea del `useQuery` | Línea del `if (isLoading)` | `title` |
|---|---|---|---|
| `Reservations/ReservationsList.tsx` | 404 | (buscar tras línea 404, antes de la tabla) | "reservas" |
| `FuelRecords/FuelRecordsList.tsx` | 162 | 210 | "registros de combustible" |
| `SystemSettings/SystemSettingsPage.tsx` | 121 | 206 | "configuración" |
| `Sanctions/SanctionList.tsx` | 165 | 235 | "sanciones" |
| `Providers/ProvidersList.tsx` | 158 | 207 | "proveedores" |
| `MyRequests/MyRequestsPage.tsx` | 488 | 510 | "tus solicitudes" |
| `Incidents/IncidentList.tsx` | 191 | 282 | "incidentes" |
| `Costs/CostsList.tsx` | 203 | (usa `isLoading` inline en el JSX, líneas 405/469 — añadir el chequeo de `isError` antes del `return` principal del componente) | "gastos" |
| `Maintenance/MaintenanceList.tsx` | 189 | 257 | "mantenimientos" |
| `VehicleRequest/VehicleRequestPage.tsx` | 284 | 292 | "vehículos disponibles" |
| `AuditLogs/AuditLogsPage.tsx` | 135 | (antes de la tabla, buscar el primer `if (isLoading)` o equivalente cerca de línea 278) | "la bitácora" |

- [ ] **Step 6: Verificación manual**

Para 3 páginas representativas (Vehicles, Reservations, Maintenance): con DevTools → Network → Offline, recargar la página y confirmar que se ve el bloque rojo "Error al cargar X." con botón "Reintentar" (no el falso empty-state "No hay X registrados"). Click en "Reintentar" con la red restaurada y confirmar que la tabla carga.

- [ ] **Step 7: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/components/ui/QueryErrorState.tsx frontend/src/components/ui/QueryErrorState.spec.tsx frontend/src/pages
git commit -m "$(cat <<'EOF'
feat(U3): show real error state with retry instead of a misleading empty list

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Notificar al aprobador de nuevas solicitudes (U5)

**Files:**
- Modify: `backend/src/modules/users/users.service.ts`
- Test: `backend/src/modules/users/users.service.spec.ts`
- Modify: `backend/src/modules/reservations/reservations.service.ts`
- Modify: `backend/src/modules/reservations/reservations.module.ts`
- Test: `backend/src/modules/reservations/reservations.service.spec.ts`

**Interfaces:**
- Produces: `UsersService.findUsersWithPermission(resource: string, action: string): Promise<User[]>`.
- Consumes: `NotificationsService.notifyUser` (ya existente, sin cambios de firma).

- [ ] **Step 1: Escribir el test que falla para `findUsersWithPermission`**

Añadir a `backend/src/modules/users/users.service.spec.ts` (mismo archivo del Sprint 0 Task 2, añadir un nuevo `describe`):
```ts
describe('UsersService.findUsersWithPermission', () => {
  let service: UsersService;
  let userRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'approver-1' }]),
    };
    userRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('devuelve los usuarios activos con el permiso dado', async () => {
    const result = await service.findUsersWithPermission('reservations', 'delete');
    expect(result).toEqual([{ id: 'approver-1' }]);
    const qb = userRepo.createQueryBuilder.mock.results[0].value;
    expect(qb.where).toHaveBeenCalledWith('permission.resource = :resource', { resource: 'reservations' });
    expect(qb.andWhere).toHaveBeenCalledWith('permission.action = :action', { action: 'delete' });
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- users.service.spec.ts
```
Expected: FAIL — `service.findUsersWithPermission is not a function`.

- [ ] **Step 3: Implementar `findUsersWithPermission`**

En `backend/src/modules/users/users.service.ts`, añadir (al final de la clase, antes de `remove()`):
```ts
  /**
   * Usuarios activos cuyo rol tiene el permiso dado en base de datos.
   * No incluye los permisos hardcodeados por rol en PermissionsGuard (p. ej. los
   * defaults de `conductor`) — solo lo sembrado explícitamente en `role_permissions`.
   */
  async findUsersWithPermission(resource: string, action: string): Promise<User[]> {
    return this.userRepo
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .innerJoin('role.permissions', 'permission')
      .where('permission.resource = :resource', { resource })
      .andWhere('permission.action = :action', { action })
      .andWhere('user.status = :status', { status: 'active' })
      .getMany();
  }
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- users.service.spec.ts
```
Expected: PASS.

- [ ] **Step 5: Escribir el test que falla para la notificación al aprobador**

Añadir a `backend/src/modules/reservations/reservations.service.spec.ts` (mismo archivo de Sprint 0 Task 4), añadiendo `UsersService` a los providers del `beforeEach` y un nuevo caso en `describe('create', ...)`:

```ts
    // dentro del mismo Test.createTestingModule del beforeEach existente, añadir:
    // { provide: UsersService, useValue: { findUsersWithPermission: jest.fn().mockResolvedValue([{ id: 'approver-1' }, { id: 'approver-2' }]) } },
```
(mostrar el `beforeEach` completo actualizado):
```ts
  let notificationsService: { notifyUser: jest.Mock };
  let usersService: { findUsersWithPermission: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(pendingReservation),
      createQueryBuilder: jest.fn(),
    };
    vehicleRepo = { update: jest.fn().mockResolvedValue(undefined) };
    dataSource = { transaction: jest.fn(async (cb) => cb({ query: jest.fn(), getRepository: () => repo })) };
    notificationsService = { notifyUser: jest.fn() };
    usersService = { findUsersWithPermission: jest.fn().mockResolvedValue([{ id: 'approver-1' }, { id: 'approver-2' }]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: repo },
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: SystemSettingsService, useValue: { findByKey: jest.fn().mockResolvedValue(null) } },
        { provide: UsersService, useValue: usersService },
        { provide: SanctionsService, useValue: { isUserSanctioned: jest.fn().mockResolvedValue(false) } },
        { provide: 'DataSource', useValue: dataSource },
      ],
    })
      .overrideProvider(require('typeorm').DataSource)
      .useValue(dataSource)
      .compile();
    service = module.get(ReservationsService);
  });
```
(nota: `SanctionsService` se añade aquí ya como mock porque `ReservationsService.create()` la necesitará en el Step de la Task 5 de este mismo plan — sin este mock, el test de Task 5 fallaría por falta de provider).

Y el nuevo test dentro de `describe('create', ...)`:
```ts
    it('notifica a todos los usuarios con reservations:delete cuando la reserva queda pending', async () => {
      await service.create({
        vehicleId: 'v1',
        userId: 'driver-1',
        startDatetime: undefined,
        endDatetime: undefined,
        eventName: 'Prueba',
      } as unknown as Partial<Reservation>);
      expect(usersService.findUsersWithPermission).toHaveBeenCalledWith('reservations', 'delete');
      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'approver-1',
        'reservation_requested',
        expect.any(String),
        expect.any(String),
        '/reservations',
      );
      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'approver-2',
        'reservation_requested',
        expect.any(String),
        expect.any(String),
        '/reservations',
      );
    });
```

- [ ] **Step 6: Ejecutar y verificar que falla**

```bash
npm test -- reservations.service.spec.ts
```
Expected: FAIL — `notificationsService.notifyUser` no se llama con `'reservation_requested'` (la rama `else` de notificación a aprobadores no existe todavía).

- [ ] **Step 7: Inyectar `UsersService` en `ReservationsService` y notificar a los aprobadores**

En `backend/src/modules/reservations/reservations.service.ts`, añadir el import:
```ts
import { UsersService } from '../users/users.service';
```
y en el constructor:
```ts
  constructor(
    @InjectRepository(Reservation)
    private repo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    private notificationsService: NotificationsService,
    private systemSettingsService: SystemSettingsService,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}
```

Cambiar el bloque final de `create()`:
```ts
    if (autoApproved) {
      const full = await this.findOne(saved.id);
      const vehicleLabel = full.vehicle
        ? `${full.vehicle.plate} – ${full.vehicle.brand} ${full.vehicle.model}`
        : 'vehículo';
      await this.notificationsService.notifyUser(
        full.userId,
        'reservation_approved',
        'Reserva aprobada automáticamente',
        `Tu solicitud de ${vehicleLabel} ha sido aprobada automáticamente. Ya puedes hacer check-in cuando retires el vehículo.`,
        '/mis-solicitudes',
      );
    }

    return saved;
```
por:
```ts
    const full = await this.findOne(saved.id);
    const vehicleLabel = full.vehicle
      ? `${full.vehicle.plate} – ${full.vehicle.brand} ${full.vehicle.model}`
      : 'vehículo';

    if (autoApproved) {
      await this.notificationsService.notifyUser(
        full.userId,
        'reservation_approved',
        'Reserva aprobada automáticamente',
        `Tu solicitud de ${vehicleLabel} ha sido aprobada automáticamente. Ya puedes hacer check-in cuando retires el vehículo.`,
        '/mis-solicitudes',
      );
    } else {
      const requesterLabel = full.user?.displayName || full.user?.email || 'Un conductor';
      const approvers = await this.usersService.findUsersWithPermission('reservations', 'delete');
      await Promise.all(
        approvers.map((approver) =>
          this.notificationsService.notifyUser(
            approver.id,
            'reservation_requested',
            'Nueva solicitud de reserva pendiente',
            `${requesterLabel} solicitó ${vehicleLabel} y espera aprobación.`,
            '/reservations',
          ),
        ),
      );
    }

    return saved;
```
(se usa `reservations:delete` como permiso distintivo de "aprobador" porque, según el seed, `conductor` nunca tiene esa acción — solo `admin` y `manager_flotilla` — a diferencia de `reservations:update`, que `conductor` sí tiene explícitamente en base de datos).

- [ ] **Step 8: Registrar `UsersModule` en `ReservationsModule`**

En `backend/src/modules/reservations/reservations.module.ts`, añadir el import y añadirlo a `imports`:
```ts
import { UsersModule } from '../users/users.module';
```
```ts
  imports: [
    TypeOrmModule.forFeature([Reservation, Vehicle]),
    NotificationsModule,
    SystemSettingsModule,
    UsersModule,
  ],
```

- [ ] **Step 9: Ejecutar y verificar que pasa**

```bash
npm test -- reservations.service.spec.ts
```
Expected: PASS.

```bash
npm test
```
Expected: toda la suite en verde.

- [ ] **Step 10: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
docker logs fleet-backend --tail 30
```
Con un conductor sin auto-aprobación activada, crear una reserva nueva; con un usuario admin o manager_flotilla, revisar la campanita de notificaciones y confirmar que aparece "Nueva solicitud de reserva pendiente".

- [ ] **Step 11: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/modules/users backend/src/modules/reservations
git commit -m "$(cat <<'EOF'
feat(U5): notify admins/managers when a new reservation request needs approval

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Sanciones y licencias bloquean la creación de reservas (U6)

**Files:**
- Modify: `backend/src/modules/sanctions/sanctions.service.ts`
- Test: `backend/src/modules/sanctions/sanctions.service.spec.ts`
- Modify: `backend/src/modules/reservations/reservations.service.ts`
- Modify: `backend/src/modules/reservations/reservations.module.ts`
- Test: `backend/src/modules/reservations/reservations.service.spec.ts`

**Interfaces:**
- Produces: `SanctionsService.isUserSanctioned(userId: string, atDate?: Date): Promise<boolean>`.
- Consumes: `UsersService.findOne` (ya existente) para leer `licenseExpiry`.

- [ ] **Step 1: Escribir el test que falla para `isUserSanctioned`**

Crear `backend/src/modules/sanctions/sanctions.service.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SanctionsService } from './sanctions.service';
import { Sanction } from '../../database/entities/sanction.entity';
import { UsersService } from '../users/users.service';

describe('SanctionsService.isUserSanctioned', () => {
  let service: SanctionsService;
  let repo: { createQueryBuilder: jest.Mock };

  const buildQb = (count: number) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  });

  beforeEach(async () => {
    repo = { createQueryBuilder: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SanctionsService,
        { provide: getRepositoryToken(Sanction), useValue: repo },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();
    service = module.get(SanctionsService);
  });

  it('devuelve true si hay una sanción vigente', async () => {
    repo.createQueryBuilder.mockReturnValue(buildQb(1));
    await expect(service.isUserSanctioned('user-1')).resolves.toBe(true);
  });

  it('devuelve false si no hay sanciones vigentes', async () => {
    repo.createQueryBuilder.mockReturnValue(buildQb(0));
    await expect(service.isUserSanctioned('user-1')).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- sanctions.service.spec.ts
```
Expected: FAIL — `service.isUserSanctioned is not a function`.

- [ ] **Step 3: Implementar `isUserSanctioned`**

En `backend/src/modules/sanctions/sanctions.service.ts`, añadir (antes de `remove()`):
```ts
  async isUserSanctioned(userId: string, atDate: Date = new Date()): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.effectiveDate <= :atDate', { atDate })
      .andWhere('(s.endDate IS NULL OR s.endDate >= :atDate)', { atDate })
      .getCount();
    return count > 0;
  }
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- sanctions.service.spec.ts
```
Expected: PASS.

- [ ] **Step 5: Escribir los tests que fallan en `reservations.service.spec.ts`**

Añadir `SanctionsService` real (no solo el mock genérico ya presente en el `beforeEach` de la Task 4) a los tests de `create`:
```ts
  describe('create — sanciones y licencia', () => {
    it('rechaza la reserva si el usuario tiene una sanción vigente', async () => {
      (usersService as unknown as { findOne: jest.Mock }).findOne = jest.fn().mockResolvedValue({ id: 'driver-1', licenseExpiry: null });
      const sanctionsService = { isUserSanctioned: jest.fn().mockResolvedValue(true) };
      (service as unknown as { sanctionsService: typeof sanctionsService }).sanctionsService = sanctionsService;
      await expect(
        service.create({ vehicleId: undefined, userId: 'driver-1', eventName: 'x' } as unknown as Partial<Reservation>),
      ).rejects.toThrow('sanción vigente');
    });

    it('rechaza la reserva si la licencia del usuario está vencida', async () => {
      (usersService as unknown as { findOne: jest.Mock }).findOne = jest
        .fn()
        .mockResolvedValue({ id: 'driver-1', licenseExpiry: '2020-01-01' });
      const sanctionsService = { isUserSanctioned: jest.fn().mockResolvedValue(false) };
      (service as unknown as { sanctionsService: typeof sanctionsService }).sanctionsService = sanctionsService;
      await expect(
        service.create({ vehicleId: undefined, userId: 'driver-1', eventName: 'x' } as unknown as Partial<Reservation>),
      ).rejects.toThrow('licencia');
    });
  });
```
Nota: este test manipula el provider directamente vía cast porque el `TestingModule` del `beforeEach` de la Task 4 ya registra `SanctionsService`/`UsersService` como mocks fijos (`isUserSanctioned` siempre `false`, sin `findOne`) — para no reescribir el `beforeEach` de la Task 4, se sobreescribe el mock puntualmente en cada test. Alternativa más limpia (preferida si se está reescribiendo el archivo desde cero): añadir `findOne: jest.fn().mockResolvedValue({ id: 'driver-1', licenseExpiry: null })` a `usersService` y `isUserSanctioned: jest.fn().mockResolvedValue(false)` a un `sanctionsService` mock ya en el `beforeEach` compartido, y sobreescribir el valor de retorno (`mockResolvedValueOnce`) dentro de cada test de este bloque.

- [ ] **Step 6: Ejecutar y verificar que fallan**

```bash
npm test -- reservations.service.spec.ts
```
Expected: FAIL — `create()` no valida sanción ni licencia todavía, así que no lanza ninguna excepción.

- [ ] **Step 7: Inyectar `SanctionsService` y validar en `create()`**

En `backend/src/modules/reservations/reservations.service.ts`, añadir el import:
```ts
import { SanctionsService } from '../sanctions/sanctions.service';
```
y en el constructor, junto a `usersService`:
```ts
    private usersService: UsersService,
    private sanctionsService: SanctionsService,
```

Al inicio de `create()`, justo después de construir `payload` (antes del bloque `let autoApproved = false;`), añadir:
```ts
    if (payload.userId) {
      const requester = await this.usersService.findOne(payload.userId as string);
      if (requester.licenseExpiry && new Date(requester.licenseExpiry) < new Date()) {
        throw new BadRequestException('No puedes reservar: tu licencia de conducir está vencida.');
      }
      const sanctioned = await this.sanctionsService.isUserSanctioned(payload.userId as string);
      if (sanctioned) {
        throw new BadRequestException('No puedes reservar: tienes una sanción vigente.');
      }
    }
```

- [ ] **Step 8: Registrar `SanctionsModule` en `ReservationsModule`**

En `backend/src/modules/reservations/reservations.module.ts`, añadir el import y añadirlo a `imports` (junto a `UsersModule` de la Task 4):
```ts
import { SanctionsModule } from '../sanctions/sanctions.module';
```
```ts
  imports: [
    TypeOrmModule.forFeature([Reservation, Vehicle]),
    NotificationsModule,
    SystemSettingsModule,
    UsersModule,
    SanctionsModule,
  ],
```
Verificar que no se genera un ciclo de imports: `SanctionsModule` importa `UsersModule` (no `ReservationsModule`), y `UsersModule` no importa `ReservationsModule` — sin ciclo.

- [ ] **Step 9: Ejecutar y verificar que pasan**

```bash
npm test -- reservations.service.spec.ts
npm test
```
Expected: PASS en ambos casos.

- [ ] **Step 10: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```
Crear una sanción vigente (sin `endDate`, o con `endDate` futura) para un usuario de prueba desde `/sanctions`, y como ese usuario intentar crear una reserva desde `/solicitud-vehiculos`. Expected: `400 Bad Request` con el mensaje de sanción vigente. Repetir poniendo `licenseExpiry` en el pasado para el mismo usuario (sin sanción) y confirmar el mensaje de licencia vencida.

- [ ] **Step 11: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/modules/sanctions backend/src/modules/reservations
git commit -m "$(cat <<'EOF'
feat(U6): block reservation creation for sanctioned drivers or expired licenses

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Incluir combustible en el dashboard y calcular costo por km

**Files:**
- Modify: `frontend/src/pages/Dashboard/Dashboard.tsx`

**Interfaces:** N/A (cálculo puramente en el componente, sigue el mismo patrón client-side ya usado por el resto del dashboard).

- [ ] **Step 1: Añadir el tipo y el fetch de `fuel_records`**

Tras el tipo `Cost` (línea ~38-42), añadir:
```ts
type FuelRecord = {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost?: number;
  odometer?: number;
};
```

Ampliar el tipo `Reservation` (líneas 17-24) para incluir los odómetros:
```ts
type Reservation = {
  id: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  vehicle?: { plate: string };
  user?: { displayName?: string };
  checkinOdometer?: number;
  checkoutOdometer?: number;
};
```

Tras el `useQuery` de `costs` (líneas 124-128), añadir:
```ts
  const { data: fuelRecords = [] } = useQuery<FuelRecord[]>({
    queryKey: ['fuel-records'],
    queryFn: async () => (await apiClient.get('/fuel-records')).data,
    retry: false,
  });
```

- [ ] **Step 2: Calcular costo total incluyendo combustible y costo por km**

Cambiar (línea 153-157):
```ts
  const costsInRange = costs.filter((c) => {
    const d = new Date(c.date);
    return d >= start && d <= end;
  });
  const totalCostsInRange = costsInRange.reduce((acc, c) => acc + Number(c.amount), 0);
```
por:
```ts
  const costsInRange = costs.filter((c) => {
    const d = new Date(c.date);
    return d >= start && d <= end;
  });
  const fuelRecordsInRange = fuelRecords.filter((f) => {
    const d = new Date(f.date);
    return d >= start && d <= end;
  });
  const fuelCostsInRange = fuelRecordsInRange.reduce((acc, f) => acc + Number(f.cost ?? 0), 0);
  const totalCostsInRange =
    costsInRange.reduce((acc, c) => acc + Number(c.amount), 0) + fuelCostsInRange;

  const kmDrivenInRange = reservationsInRange.reduce((acc, r) => {
    if (r.checkoutOdometer != null && r.checkinOdometer != null) {
      return acc + (r.checkoutOdometer - r.checkinOdometer);
    }
    return acc;
  }, 0);
  const costPerKm = kmDrivenInRange > 0 ? totalCostsInRange / kmDrivenInRange : null;
```

- [ ] **Step 3: Corregir la condición de "sin datos" del stat-card de costos**

Cambiar (líneas 334-336):
```tsx
            <span className="stat-card__value" style={{ fontSize: totalCostsInRange > 999999 ? 18 : undefined }}>
              {costs.length === 0 ? '—' : fmtCurrency(totalCostsInRange)}
            </span>
```
por:
```tsx
            <span className="stat-card__value" style={{ fontSize: totalCostsInRange > 999999 ? 18 : undefined }}>
              {costsInRange.length === 0 && fuelRecordsInRange.length === 0 ? '—' : fmtCurrency(totalCostsInRange)}
            </span>
```

- [ ] **Step 4: Añadir el stat-card de costo por km**

Justo después del `</Link>` que cierra el stat-card de "Costos del período" (línea 342) y antes del `</div>` que cierra el grid (línea 343), añadir:
```tsx
        <Link to="/reports" className="stat-card" style={{ textDecoration: 'none', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="stat-card__icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <span className="material-icons" style={{ fontSize: 20 }}>speed</span>
            </div>
            <span className="stat-card__value">
              {costPerKm == null ? '—' : fmtCurrency(costPerKm)}
            </span>
          </div>
          <div className="stat-card__label">Costo por km</div>
          <div className="stat-card__sub">
            <span className="badge badge-blue">{getRangeLabel(dateRange)}</span>
          </div>
        </Link>
```

- [ ] **Step 5: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm run dev
```
Abrir `/` (dashboard), confirmar que el stat-card "Costos del período" ahora incluye el gasto en combustible del rango (comparar contra `/fuel-records` filtrado manualmente por fecha) y que aparece un nuevo stat-card "Costo por km" con un valor coherente (o "—" si no hay reservas con check-in/check-out completos en el rango).

- [ ] **Step 6: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Dashboard/Dashboard.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): include fuel costs in totals and add cost-per-km KPI

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Modo oscuro roto en Users/Vehicles/Reservations (U1)

**Files:**
- Modify: `frontend/src/pages/Users/UsersList.tsx`
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx`

**Interfaces:** N/A (solo cambia estilos inline/clases, sin lógica).

- [ ] **Step 1: Arreglar el título y el panel de `UsersList.tsx`**

Cambiar (línea 237):
```tsx
          <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
```
por:
```tsx
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Usuarios</h2>
```

Cambiar (línea 257, panel contenedor de la tabla — verificar el className exacto en el archivo, patrón esperado `bg-white ... border-slate-200`):
```tsx
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
```
(aplicar el mismo cambio a cualquier otro contenedor de la página que use literalmente `bg-white`/`border-slate-200`/`text-slate-900` fuera del modal — el modal (`UserFormModal`) ya se cubre en la Task 1 del Sprint 2, no tocarlo aquí para evitar pisar ese trabajo).

- [ ] **Step 2: Arreglar el título de `VehiclesList.tsx`**

Cambiar (línea 520):
```tsx
          <h2 className="text-2xl font-bold text-slate-900">Vehículos</h2>
```
por:
```tsx
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Vehículos</h2>
```

- [ ] **Step 3: Arreglar el título de `ReservationsList.tsx`**

Cambiar (línea 503):
```tsx
          <h2 className="text-2xl font-bold text-slate-900">Gestión de reservas</h2>
```
por:
```tsx
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Gestión de reservas</h2>
```

- [ ] **Step 4: Verificación manual en modo oscuro y claro**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend
npm run dev
```
En el navegador, con el tema por defecto (oscuro), abrir `/users`, `/vehicles`, `/reservations` y confirmar que los títulos son legibles (no negro sobre fondo oscuro). Cambiar a tema claro (toggle de tema) y confirmar que los títulos siguen siendo legibles en ambos modos.

- [ ] **Step 5: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Users/UsersList.tsx frontend/src/pages/Vehicles/VehiclesList.tsx frontend/src/pages/Reservations/ReservationsList.tsx
git commit -m "$(cat <<'EOF'
fix(U1): use theme CSS variables instead of hardcoded light-mode classes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Cobertura de la especificación:** U1 (Task 7), U2 (Tasks 1-2), U3 (Task 3), U5 (Task 4), U6 (Task 5), "incluir combustible en el dashboard y calcular costo por km" (Task 6) — los 6 puntos del roadmap "Sprint 1" están cubiertos.

**Placeholders:** las tablas de Task 2/Step 3 y Task 3/Step 5 dan ubicación exacta (archivo + línea) y el mensaje/queryKey concretos para cada página en vez de repetir el mismo bloque de código 11-12 veces — el patrón completo se muestra una sola vez (Steps 1 de cada Task) con código real, y el resto son sustituciones mecánicas de nombre de recurso sobre el mismo patrón ya verificado. No hay pasos de tipo "hacer lo necesario" sin contenido concreto.

**Consistencia de tipos:** `ReservationsService.create/update` ahora reciben `SanctionsService`/`UsersService` inyectados — el `beforeEach` de `reservations.service.spec.ts` se actualiza una sola vez en la Task 4 y se reutiliza (con overrides puntuales) en la Task 5. `findUsersWithPermission` se usa con la misma firma `(resource, action)` en Task 4 y coincide con la definida en `UsersService`.
