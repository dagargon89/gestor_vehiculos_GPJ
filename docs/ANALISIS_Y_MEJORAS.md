# Análisis del proyecto — Irregularidades y oportunidades de mejora

**App:** Gestor de flota "Plan Juárez" · NestJS + TypeORM + PostgreSQL + Redis + Firebase · React 19 + Vite + Tailwind
**Fecha:** 2026-07-15
**Objetivo:** detectar irregularidades y oportunidades para hacer la app más útil y fácil de usar.

---

## Resumen ejecutivo

La base transaccional es **sólida**: reservas con check-in/check-out fotográfico, control de concurrencia con *advisory locks*, vencimientos automáticos con notificación + email, RBAC por `resource/action`, reportes exportables (CSV/Excel/PDF) y un buen componente `SearchSelect`. Sin embargo hay **6 problemas críticos de seguridad/integridad** que deben atenderse antes que nada, una **deuda de usabilidad grande** (el modo oscuro por defecto rompe media app, no hay feedback de acciones) y varios **ciclos de negocio modelados pero inactivos** (sanciones, licencias, mantenimiento preventivo) que, conectados, multiplican el valor con poco esfuerzo.

**Veredicto:** producto prometedor y funcional, pero con brechas de seguridad serias y una capa de UX a medio terminar. La mayoría de las mejoras de alto impacto son de bajo esfuerzo porque los datos ya se capturan; solo falta conectarlos, validarlos y darles feedback.

---

## 🔴 Crítico — Seguridad e integridad (atender primero)

| # | Hallazgo | Archivo | Riesgo |
|---|----------|---------|--------|
| C1 | **Secretos versionados en git.** El `.env` de la raíz (con `DB_PASSWORD` y la **clave privada del service account de Firebase**) y `frontend/.env` están trackeados. El `.gitignore` solo excluye `backend/.env` y `frontend/.env`, no la raíz. | `.env`, `.gitignore` | Fuga total de credenciales. Cualquiera con acceso al repo controla Firebase Admin y la BD. |
| C2 | **Escalada de privilegios vía `POST /api/auth/sync-user`.** Recibe body crudo y llama a `updateUserData`, que hace `userRepo.update(id, data)` **sin whitelist** (a diferencia de `update()` en la línea 130, que sí filtra). | `auth.controller.ts:35`, `users.service.ts:106` | Cualquier usuario autenticado se auto-asigna `roleId` de admin y `status`. Toma control total. |
| C3 | **Endpoints mutadores sin `@RequirePermission`.** El `PermissionsGuard` devuelve `true` si no hay metadata. Quedan abiertos a cualquier autenticado: crear/editar/borrar permisos y crear/borrar notificaciones (suplantando `userId`). | `permissions.controller.ts:33,38,46`, `notifications.controller.ts:39,62`, `storage.controller.ts` (upload/delete) | Romper el modelo RBAC (DoS de autorización), IDOR, suplantación. |
| C4 | **Bypass de aprobación y edición de reservas ajenas.** `status` está en `allowedKeys` de `create`/`update`; el conductor tiene `reservations:create/update`. Además `update()` **no verifica ownership** (a diferencia de check-in/out). | `reservations.service.ts:63,132` | Un conductor auto-aprueba su reserva (`status:'active'`) y puede modificar reservas de otros (fechas, `userId`, `vehicleId`). |
| C5 | **`synchronize` activo salvo `NODE_ENV==='production'` exacto, y el compose arranca en `development`.** Solo hay 2 migraciones; el esquema real depende de `synchronize`. | `database.config.ts:11`, `docker_compose.yml` (`NODE_ENV:-development`) | Alteración automática del esquema en runtime → deriva dev/prod y posible pérdida de datos. |
| C6 | **Doble columna FK.** `fuel-record`, `maintenance` e `incident` declaran `@Column() vehicleId` (col. `vehicleId`) **y** `@JoinColumn({ name: 'vehicle_id' })` (col. `vehicle_id`) — dos columnas físicas. El patrón correcto está en `reservation.entity.ts` (misma columna). | `fuel-record/maintenance/incident.entity.ts` | Al guardar por el escalar, la FK de la relación queda NULL; `leftJoinAndSelect(...vehicle)` no resuelve. Datos inconsistentes. |

**Otros de seguridad (medio):** sin `helmet` ni rate limiting (`@nestjs/throttler`); subida de archivos sin límite de tamaño/mimetype + `makePublic()`; credenciales por defecto (`admin123`, `fleet_secret`); fuga de `err.message` al cliente en prod (`reservations.controller.ts:96`); autoprovisión de usuarios `active` sin rol en el guard; permisos de conductor **hardcodeados** en el guard (`permissions.guard.ts:14`) que no se pueden revocar desde BD.

---

## 🟠 Alto — Usabilidad que estorba el uso diario

| # | Hallazgo | Detalle |
|---|----------|---------|
| U1 | **Modo oscuro roto en ~16 páginas de admin.** La app arranca en tema oscuro (`ThemeContext`, `index.css`), pero las listas usan colores claros fijos (`bg-white`, `text-slate-900`). | Títulos con contraste ~1.05:1 (ilegibles) sobre el fondo oscuro; paneles/modales blancos estridentes. `UsersList.tsx:237`, `VehiclesList.tsx:520`, `ReservationsList.tsx:503`. Usar `var(--color-text/bg/border)` como ya hace el Dashboard. |
| U2 | **Sin feedback de acciones (no hay toasts).** No existe sistema de notificaciones toast. Crear/editar/borrar/aprobar/check-in son **silenciosos**: se cierra el modal y ya. | El usuario opera "a ciegas". Añadir toasts de éxito/error globales. |
| U3 | **Sin manejo de error de carga.** Solo `UsersList` maneja `isError`; el resto, si falla la petición, muestra el *empty state* engañoso ("No hay reservas"). | `ReservationsList.tsx:404`, `VehiclesList.tsx:461`, etc. Mostrar "Error al cargar" con reintento. |
| U4 | **Confirmaciones con `window.confirm` nativo** en 10+ borrados. | Rompe el estilo, no tematizable. Crear `<ConfirmDialog>` reutilizable. |
| U5 | **El aprobador no recibe notificación de solicitudes nuevas.** `notifyUser` solo se llama hacia el dueño de la reserva, nunca hacia admin/gestor. | Si la auto-aprobación está apagada, las solicitudes quedan invisibles hasta que un admin entra a mirar. **Gap más grave del flujo principal.** |
| U6 | **Sanciones y licencias no bloquean nada.** `create` de reserva no verifica sanción vigente ni licencia vencida/incompatible. | Módulos "decorativos": existen en papel pero no tienen efecto de negocio. Un conductor sancionado o con licencia vencida reserva sin problema. |

---

## 🟡 Medio — Funcionalidad y calidad

**Producto / valor de negocio**
- **Mantenimiento preventivo inexistente.** Solo CRUD por fecha; no hay "próximo servicio a X km" ni recurrente, ni alertas (solo hay **1 cron** en todo el sistema). Añadir `nextServiceOdometer/Date` a `Vehicle` + un `@Cron` de alertas.
- **Métricas financieras ausentes:** no se calcula **costo por km** ni **rendimiento km/L** (los datos —odómetro, litros— ya se capturan). El dashboard de costos **ignora `fuel_records`**, subestimando el gasto real.
- **Falta reporte de TCO por vehículo** (combustible + mantenimiento + otros).
- **Estado del vehículo desincronizado:** ni check-in/out ni mantenimiento cambian `vehicle.status`; se maneja a mano → contamina la "disponibilidad" del dashboard.
- **Auto-generar combustible/costo desde el check-out** (hoy hay doble captura; `checkoutFuelLevel` queda en un silo).
- **Documentación del vehículo inexistente:** sin seguro/póliza, tarjeta de circulación, verificación vehicular ni fechas de vencimiento (crítico en contexto gubernamental).
- **Flujo de rechazo con motivo:** hoy rechazar = borrar sin razón; el label `rejected` existe en Reportes pero ninguna acción lo genera.

**Backend / datos**
- **Validación casi inexistente:** solo `vehicles` usa DTOs con `class-validator`; el resto recibe `Record<string, unknown>`/`Partial<Entity>`, así que el `ValidationPipe` global no valida nada. Esto **habilita C2 y C4**.
- **Sin índices** (`@Index` = 0 usos) en columnas de filtro frecuente (`reservations`, `notifications`, `fuel_records`).
- **Sin unicidad** en `vehicle.plate`/`vin` ni en `permission(resource, action)`.
- **Sin paginación** en ningún `findAll` (devuelven tablas completas); `reservations.findAll` filtra por fechas **en memoria** tras cargar todo.
- **Auditoría no funcional:** `audit-logs.service` es solo lectura; ningún flujo escribe `AuditLog`.

**Frontend / consistencia**
- **Reinvención de la rueda:** no hay `<Modal>`, `<DataTable>`, `<Card>`, `<PageHeader>` ni `<FormField>` compartidos; el modal se reimplementa en 14 páginas y la tabla+toolbar+paginación se copia 14 veces.
- **Sin búsqueda de texto ni ordenación** en tablas (solo filtro por estado/rol y paginación).
- **Validación de fechas incoherente:** el modal de reserva del conductor valida (regreso > salida, rango de año), el de admin **no**; los `datetime-local` no tienen `min` → se permiten fechas en el pasado.
- **Navegación:** toda la administración cuelga de **un solo dropdown** "Administración" (baja descubribilidad); sin barra lateral persistente, breadcrumbs ni `document.title` por ruta.
- **Modo oscuro definido pero no implementado** (`dark:` = 0 usos pese a estar en el DESIGN_SYSTEM).

---

## 🟢 Bajo — Higiene y mantenibilidad

- **0 tests** (ni backend ni frontend) y **sin CI** (`.github/workflows` inexistente).
- **Archivo de respaldo en el código fuente:** `frontend/src/pages/VehicleRequest/VehicleRequestPage.backup.tsx` (se compila/lintea; usar git para el historial).
- **`console.log` mezclados** con el `Logger` de Nest (39 en backend).
- **`/health` estático:** no verifica BD ni Redis (usar `@nestjs/terminus`).
- **Sin skeletons de carga:** todas las páginas hacen `Cargando…` en texto plano (salto brusco a la tabla).
- **Dockerfile corre como root**, sin `HEALTHCHECK`.
- **Estados vacíos engañosos al filtrar** ("No hay reservas" en vez de "Sin resultados para el filtro").
- **Formato de fecha inconsistente** entre páginas; enlaces de pie muertos (`Privacidad/Términos/Ayuda` → `#`); etiqueta "Nueva reserva (admin)" con jerga interna.
- **Sin i18n** (todo hardcodeado en español; ok si es solo-español).

---

## Roadmap sugerido (por impacto/esfuerzo)

### Sprint 0 — Seguridad (bloqueante, esfuerzo bajo)
1. **Rotar y desversionar secretos**: sacar `.env` raíz y `frontend/.env` de git (`git rm --cached`), añadirlos al `.gitignore`, **rotar** la clave de Firebase y la contraseña de BD.
2. **C2**: enrutar `sync-user` por `update()` con whitelist, o crear `SyncUserDto` sin `roleId`/`status`.
3. **C3**: añadir `@RequirePermission` a todos los endpoints mutadores (o `APP_GUARD` global + `@Public()`).
4. **C4**: quitar `status` del payload de `create`; validar ownership en `update`.
5. **C5**: `synchronize: false` + `NODE_ENV=production` explícito en el compose.

### Sprint 1 — Quick wins de usabilidad y negocio (alto impacto, bajo esfuerzo)
6. **Notificar al aprobador** cuando entra una solicitud (reutiliza `NotificationsService`).
7. **Aplicar sanciones y validar licencia** al crear reserva.
8. **Toasts de éxito/error** + manejo de `isError` en todas las páginas.
9. **Incluir combustible en el dashboard** y calcular **costo por km**.
10. **Arreglar el modo oscuro** de las páginas de admin (variables de tema).

### Sprint 2 — Componentes y consistencia (esfuerzo medio)
11. Extraer `<Modal>`, `<DataTable>` y `<ConfirmDialog>` compartidos (con ARIA, Escape, foco, búsqueda, orden, estados vacío/carga/error) → resuelve de una vez consistencia, accesibilidad, duplicación y U1–U4.
12. Unificar validación de fechas de reserva (no pasado, regreso > salida).
13. **C6** (doble FK) + índices + unicidad placa/VIN + migración base con `synchronize:false`.

### Sprint 3 — Valor a mediano plazo (esfuerzo medio-alto)
14. Mantenimiento preventivo por km/fecha + cron de alertas.
15. Rendimiento km/L y reporte de TCO por vehículo.
16. Documentos del vehículo (seguro/circulación/verificación) + alertas de vencimiento.
17. Sincronización automática del estado del vehículo; auto-generar combustible/costo desde el check-out.
18. Tests + CI.

---

## Fortalezas a conservar (referencia interna)
- `SearchSelect` (accesibilidad y teclado ejemplares), `MyRequests` (semántica de modal, estados vacíos por sección, botones táctiles), Dashboard/VehicleRequest (uso correcto de variables de tema).
- Control de concurrencia de reservas con `pg_advisory_xact_lock`.
- Scheduler de vencimientos con notificación in-app + email bien redactados.
- Reportes con exportación CSV/Excel/PDF y SQL parametrizado (sin inyección).
