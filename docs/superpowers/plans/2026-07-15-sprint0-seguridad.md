# Sprint 0 — Seguridad crítica (C1-C5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los 5 hallazgos críticos de seguridad/integridad de `docs/ANALISIS_Y_MEJORAS.md` (secretos versionados, escalada de privilegios, endpoints sin permiso, bypass de aprobación de reservas, `synchronize` activo) sin romper el flujo funcional existente.

**Architecture:** Fixes puntuales sobre el backend NestJS existente (`backend/src/modules/**`), sin nuevos módulos. Se introduce Jest por primera vez en el backend (hoy no existe ningún test) para poder verificar con TDD los fixes de C2/C3/C4, que son toda lógica de autorización en servicios y controllers.

**Tech Stack:** NestJS 10 + TypeORM + PostgreSQL 15 (`postgres:15-alpine`), `class-validator`/`class-transformer` (ya usado por el `ValidationPipe` global), Jest + `ts-jest` + `@nestjs/testing` (nuevos).

## Global Constraints

- Editar solo `backend/src/**` — el contenedor `fleet-backend` NO tiene volúmenes montados; nada de lo editado en `backend/src` corre hasta reconstruir la imagen.
- Tras cada tarea que toque backend: `cd /root/flotilla/gestor_vehiculos_GPJ && docker compose -f docker_compose.yml up -d --build backend`, luego verificar con `docker ps --filter "name=fleet-backend" --format "{{.Status}}"` (debe decir `Up X (healthy)`) y `docker logs fleet-backend --tail 30` (buscar `Nest application successfully started`).
- El repo de trabajo (`/home/dagargon89/gestor_vehiculos_GPJ`) y el repo desplegado (`/root/flotilla/gestor_vehiculos_GPJ`) son checkouts separados del mismo git — los cambios de `docker_compose.yml` hechos aquí requieren `git pull` en el lado de despliegue antes del rebuild.
- No usar `--no-verify`, `--force`, `kill -9` sobre contenedores, ni borrar volúmenes (`postgres_data`, `redis_data`) sin confirmación explícita del usuario.
- Convención de autorización existente a reutilizar: decorador `@RequirePermission(resource, action)` (`backend/src/common/decorators/permissions.decorator.ts`, metadata key `REQUIRE_PERMISSION_KEY` de `backend/src/common/guards/permissions.guard.ts`), guard de clase `@UseGuards(FirebaseAuthGuard, PermissionsGuard)`.
- El `ValidationPipe` global (`backend/src/main.ts`) ya está configurado con `{ whitelist: true, transform: true, forbidNonWhitelisted: false }` — cualquier endpoint que tipe su `@Body()` con una clase DTO decorada con `class-validator` obtiene automáticamente el *stripping* de campos no declarados; los endpoints que hoy tipan `@Body()` como `Record<string, unknown>` o `Partial<Entity>` NO se benefician de esto (por eso existen C2/C4).
- Rol con bypass total de permisos: `admin` (`permissions.guard.ts:48`). Rol con permisos por defecto hardcodeados: `conductor` (`CONDUCTOR_DEFAULT_PERMISSIONS`, líneas 14-28 del mismo guard) — incluye `reservations:create/update`, por lo que cualquier fix de reservas debe asumir que un conductor SIEMPRE puede llamar `create`/`update` de reservas.
- Roles sembrados (`backend/src/database/seeds/index.ts`): `admin`, `manager_flotilla`, `conductor`.

---

### Task 1: C1 — Secretos versionados en git

**Files:**
- Modify: `.gitignore` (raíz del repo)
- Sin cambios de código (git housekeeping)

**Interfaces:** N/A (esta tarea no toca código de aplicación).

- [ ] **Step 1: Confirmar el estado actual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git ls-files | grep -E "^\.env$|^backend/\.env$|^frontend/\.env$"
```

Expected: imprime `.env` y `frontend/.env` (ambos trackeados). `backend/.env` no debe aparecer.

- [ ] **Step 2: Actualizar `.gitignore`**

El archivo actual es:
```
# Environment files con secretos
backend/.env
frontend/.env

# Node modules
node_modules/
backend/node_modules/
frontend/node_modules/

# Build output
backend/dist/
frontend/dist/

# Logs
*.log
```

Cambiar el bloque de environment files a:
```
# Environment files con secretos
.env
backend/.env
frontend/.env
```

- [ ] **Step 3: Sacar del índice de git los archivos ya trackeados**

```bash
git rm --cached .env frontend/.env
```

Esto deja los archivos en disco (no se borran) pero los saca del control de versiones. Verificar:
```bash
git status --short
```
Expected: `.gitignore` modificado, `.env` y `frontend/.env` como `D ` (deleted del índice) o similar, y NO deben volver a aparecer en `git status` después de esto (confirmar corriendo `git status` una segunda vez tras el commit).

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git rm --cached .env frontend/.env
git commit -m "$(cat <<'EOF'
security(C1): stop tracking .env files, fix root .gitignore rule

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verificar que ya no se pueden volver a trackear por accidente**

```bash
touch /tmp/test-gitignore-check && cp .env /tmp/env-check-backup 2>/dev/null; git check-ignore -v .env frontend/.env backend/.env
```
Expected: las 3 rutas deben salir listadas con la regla de `.gitignore` que las cubre (confirma que `git add -A` futuro no las re-trackeará).

- [ ] **Step 6: Rotación de credenciales (acción manual, fuera del repo — requiere al usuario)**

Esto **no se puede automatizar de forma segura** desde este plan porque toca consolas externas (Firebase, Postgres en producción). Antes de cerrar esta tarea, el usuario debe:
1. En Firebase Console → Project Settings → Service Accounts: generar una **nueva** clave privada del service account, descargar el JSON, actualizar `backend/.env` (el archivo local, ya no trackeado) con las nuevas credenciales. Revocar/eliminar la clave antigua desde la misma consola.
2. Cambiar `DB_PASSWORD` en la instancia de Postgres real (`ALTER USER fleet_user WITH PASSWORD '<nueva-contraseña-fuerte>';`) y actualizar `backend/.env` y el `DB_PASSWORD` usado por `docker_compose.yml`/entorno del host.
3. Ninguna de las claves que ya estuvieron expuestas en el historial de git debe reutilizarse, aunque se elimine el archivo del índice — el historial de commits anteriores sigue conteniéndolas. Si se desea limpiar también el historial (`git filter-repo` o BFG), **confirmar explícitamente con el usuario antes de ejecutar** porque reescribe el historial y requiere force-push — no ejecutar como parte automática de este plan.

- [ ] **Step 7: Commit final de confirmación** (solo si Step 6 ya se completó y hay algún cambio adicional, p. ej. `backend/.env.example` con las nuevas variables documentadas sin valores reales — verificar que `backend/.env.example` y `frontend/.env.example` no contengan secretos reales, solo placeholders).

---

### Task 2: Bootstrap de Jest en el backend + C2 (escalada de privilegios en `sync-user`)

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/modules/auth/dto/sync-user.dto.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/users/users.service.ts`
- Test: `backend/src/modules/users/users.service.spec.ts`

**Interfaces:**
- Produces: `UsersService.updateOwnProfile(id: string, data: Partial<User>): Promise<User>` — strips cualquier campo fuera de una whitelist de perfil propio (sin `roleId` ni `status`).
- Produces: `SyncUserDto` (clase con decoradores `class-validator`) exportada desde `backend/src/modules/auth/dto/sync-user.dto.ts`, campos: `displayName?, phone?, licenseNumber?, licenseType?, licenseExpiry?, licenseRestrictions?, emergencyContactName?, emergencyContactPhone?, emergencyContactRelationship?, emailNotifications?`. Deliberadamente **sin** `roleId` ni `status`.
- Consumes: nada de tareas previas.

- [ ] **Step 1: Instalar Jest**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm install --save-dev jest ts-jest @types/jest @nestjs/testing
```

- [ ] **Step 2: Añadir script de test y config de Jest a `backend/package.json`**

Añadir `"test": "jest"` al bloque `"scripts"`, y un bloque `"jest"` nuevo a nivel raíz del `package.json` (mismo patrón que usa el scaffold estándar de NestJS):

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

- [ ] **Step 3: Escribir el test que falla**

Crear `backend/src/modules/users/users.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';

describe('UsersService.updateOwnProfile', () => {
  let service: UsersService;
  let userRepo: { update: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue({ id: 'u1', displayName: 'Nuevo nombre' } as User),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('permite actualizar campos de perfil propio', async () => {
    await service.updateOwnProfile('u1', { displayName: 'Nuevo nombre' } as Partial<User>);
    expect(userRepo.update).toHaveBeenCalledWith('u1', { displayName: 'Nuevo nombre' });
  });

  it('descarta roleId y status aunque vengan en el body (anti escalada de privilegios)', async () => {
    await service.updateOwnProfile('u1', {
      displayName: 'Nuevo nombre',
      roleId: 'admin-role-id',
      status: 'active',
    } as Partial<User>);
    expect(userRepo.update).toHaveBeenCalledWith('u1', { displayName: 'Nuevo nombre' });
  });
});
```

- [ ] **Step 4: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- users.service.spec.ts
```
Expected: FAIL — `TypeError: service.updateOwnProfile is not a function` (el método aún no existe).

- [ ] **Step 5: Implementar `updateOwnProfile` en `UsersService`**

En `backend/src/modules/users/users.service.ts`, añadir (después de `UPDATE_ALLOWED_KEYS`/`update()` existentes, sin tocarlos):

```ts
  /** Campos que un usuario puede auto-actualizar vía /auth/sync-user. Nunca roleId ni status. */
  private static readonly SELF_SERVICE_ALLOWED_KEYS: (keyof User)[] = [
    'displayName',
    'phone',
    'licenseNumber',
    'licenseType',
    'licenseExpiry',
    'licenseRestrictions',
    'emergencyContactName',
    'emergencyContactPhone',
    'emergencyContactRelationship',
    'emailNotifications',
  ];

  async updateOwnProfile(id: string, data: Partial<User>): Promise<User> {
    const payload: Record<string, unknown> = {};
    for (const key of UsersService.SELF_SERVICE_ALLOWED_KEYS) {
      if (key in data) {
        payload[key] = (data as Record<string, unknown>)[key];
      }
    }
    await this.userRepo.update(id, payload as Partial<User>);
    return this.findOne(id);
  }
```

No modificar `updateUserData()` ni su uso en `deleteAccount()` (línea 13 de `auth.service.ts`) — ese es un call interno de confianza, no expuesto a input de cliente.

- [ ] **Step 6: Ejecutar y verificar que pasa**

```bash
npm test -- users.service.spec.ts
```
Expected: PASS, 2 tests.

- [ ] **Step 7: Crear el DTO restringido**

Crear `backend/src/modules/auth/dto/sync-user.dto.ts`:

```ts
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class SyncUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsArray()
  licenseRestrictions?: string[];

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;
}
```

- [ ] **Step 8: Usar el DTO en el controller**

En `backend/src/modules/auth/auth.controller.ts`, cambiar:

```ts
  @Post('sync-user')
  @UseGuards(FirebaseAuthGuard)
  syncUser(@CurrentUser() user: CurrentUserPayload, @Body() body: Record<string, unknown>) {
    return this.authService.updateUserData(user.id, body);
  }
```

por:

```ts
  @Post('sync-user')
  @UseGuards(FirebaseAuthGuard)
  syncUser(@CurrentUser() user: CurrentUserPayload, @Body() body: SyncUserDto) {
    return this.authService.updateUserData(user.id, body);
  }
```

y añadir el import: `import { SyncUserDto } from './dto/sync-user.dto';`.

Como el `ValidationPipe` global ya tiene `whitelist: true`, tipar el body como `SyncUserDto` (en vez de `Record<string, unknown>`) hace que Nest descarte automáticamente cualquier campo fuera del DTO (`roleId`, `status`, etc.) **antes** de que llegue al controller — capa adicional de defensa sobre el whitelist explícito del Step 5.

- [ ] **Step 9: Actualizar `AuthService.updateUserData`**

En `backend/src/modules/auth/auth.service.ts`, cambiar:

```ts
  async updateUserData(userId: string, data: Record<string, unknown>) {
    return this.usersService.updateUserData(userId, data as Parameters<typeof this.usersService.updateUserData>[1]);
  }
```

por:

```ts
  async updateUserData(userId: string, data: SyncUserDto) {
    return this.usersService.updateOwnProfile(userId, data as Partial<Parameters<typeof this.usersService.updateOwnProfile>[1]>);
  }
```

y añadir el import `import { SyncUserDto } from './dto/sync-user.dto';`. Dejar `deleteAccount()` (mismo archivo) sin cambios — sigue llamando a `usersService.updateUserData(userId, { status: 'inactive' })` directamente.

- [ ] **Step 10: Correr toda la suite**

```bash
npm test
```
Expected: PASS — 1 suite, 2 tests.

- [ ] **Step 11: Rebuild y verificación manual end-to-end**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
docker ps --filter "name=fleet-backend" --format "{{.Status}}"
docker logs fleet-backend --tail 30
```
Expected: `Up X (healthy)` y log `Nest application successfully started`.

Con un usuario NO admin autenticado (token Firebase válido de un conductor), probar:
```bash
curl -X POST http://localhost:3001/api/auth/sync-user \
  -H "Authorization: Bearer <token-de-conductor>" \
  -H "Content-Type: application/json" \
  -d '{"roleId":"<uuid-del-rol-admin>","status":"active","displayName":"Prueba C2"}'
curl http://localhost:3001/api/auth/me -H "Authorization: Bearer <token-de-conductor>"
```
Expected: `displayName` cambia a "Prueba C2"; `roleId` y `status` del usuario **no** cambian (siguen siendo los originales del conductor).

- [ ] **Step 12: Commit**

```bash
git add backend/package.json backend/src/modules/auth backend/src/modules/users
git commit -m "$(cat <<'EOF'
security(C2): stop sync-user from letting users self-assign roleId/status

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: C3 — Endpoints mutadores sin `@RequirePermission`

**Files:**
- Modify: `backend/src/modules/permissions/permissions.controller.ts`
- Modify: `backend/src/modules/notifications/notifications.controller.ts`
- Modify: `backend/src/modules/storage/storage.controller.ts`
- Test: `backend/src/modules/permissions/permissions.controller.spec.ts`
- Test: `backend/src/modules/notifications/notifications.controller.spec.ts`
- Test: `backend/src/modules/storage/storage.controller.spec.ts`

**Interfaces:**
- Consumes: `RequirePermission(resource: string, action: string)` de `backend/src/common/decorators/permissions.decorator.ts`, `REQUIRE_PERMISSION_KEY` de `backend/src/common/guards/permissions.guard.ts`.
- No produce interfaces nuevas — solo añade metadata de autorización a métodos existentes.

- [ ] **Step 1: Escribir los 3 tests que fallan**

Crear `backend/src/modules/permissions/permissions.controller.spec.ts`:
```ts
import 'reflect-metadata';
import { REQUIRE_PERMISSION_KEY } from '../../common/guards/permissions.guard';
import { PermissionsController } from './permissions.controller';

describe('PermissionsController — metadata de permisos', () => {
  it('create() requiere permissions:create', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, PermissionsController.prototype.create);
    expect(meta).toEqual({ resource: 'permissions', action: 'create' });
  });

  it('update() requiere permissions:update', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, PermissionsController.prototype.update);
    expect(meta).toEqual({ resource: 'permissions', action: 'update' });
  });

  it('remove() requiere permissions:delete', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, PermissionsController.prototype.remove);
    expect(meta).toEqual({ resource: 'permissions', action: 'delete' });
  });
});
```

Crear `backend/src/modules/notifications/notifications.controller.spec.ts`:
```ts
import 'reflect-metadata';
import { REQUIRE_PERMISSION_KEY } from '../../common/guards/permissions.guard';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController — metadata de permisos', () => {
  it('create() requiere notifications:create', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, NotificationsController.prototype.create);
    expect(meta).toEqual({ resource: 'notifications', action: 'create' });
  });

  it('remove() requiere notifications:delete', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, NotificationsController.prototype.remove);
    expect(meta).toEqual({ resource: 'notifications', action: 'delete' });
  });
});
```

Crear `backend/src/modules/storage/storage.controller.spec.ts`:
```ts
import 'reflect-metadata';
import { REQUIRE_PERMISSION_KEY } from '../../common/guards/permissions.guard';
import { StorageController } from './storage.controller';

describe('StorageController — metadata de permisos', () => {
  it('upload() requiere storage_files:create', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, StorageController.prototype.upload);
    expect(meta).toEqual({ resource: 'storage_files', action: 'create' });
  });

  it('delete() requiere storage_files:delete', () => {
    const meta = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, StorageController.prototype.delete);
    expect(meta).toEqual({ resource: 'storage_files', action: 'delete' });
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que los 3 fallan**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- permissions.controller.spec.ts notifications.controller.spec.ts storage.controller.spec.ts
```
Expected: FAIL — cada `expect(meta).toEqual(...)` recibe `undefined` en vez del objeto esperado (no hay decorador todavía).

- [ ] **Step 3: Añadir los decoradores faltantes en `permissions.controller.ts`**

Cambiar:
```ts
  @Post()
  create(@Body() body: { resource: string; action: string }) {
```
por:
```ts
  @Post()
  @RequirePermission('permissions', 'create')
  create(@Body() body: { resource: string; action: string }) {
```

Cambiar:
```ts
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ resource: string; action: string }>,
  ) {
```
por:
```ts
  @Put(':id')
  @RequirePermission('permissions', 'update')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ resource: string; action: string }>,
  ) {
```

Cambiar:
```ts
  @Delete(':id')
  remove(@Param('id') id: string) {
```
por:
```ts
  @Delete(':id')
  @RequirePermission('permissions', 'delete')
  remove(@Param('id') id: string) {
```

- [ ] **Step 4: Añadir los decoradores faltantes en `notifications.controller.ts`**

Cambiar:
```ts
  @Post()
  create(@Body() body: Partial<Notification>) {
```
por:
```ts
  @Post()
  @RequirePermission('notifications', 'create')
  create(@Body() body: Partial<Notification>) {
```

Cambiar:
```ts
  @Delete(':id')
  remove(@Param('id') id: string) {
```
por:
```ts
  @Delete(':id')
  @RequirePermission('notifications', 'delete')
  remove(@Param('id') id: string) {
```

- [ ] **Step 5: Añadir los decoradores faltantes en `storage.controller.ts`**

Cambiar:
```ts
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
```
por:
```ts
  @Post('upload')
  @RequirePermission('storage_files', 'create')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
```

Cambiar:
```ts
  @Delete(':id')
  delete(@Param('id') id: string) {
```
por:
```ts
  @Delete(':id')
  @RequirePermission('storage_files', 'delete')
  delete(@Param('id') id: string) {
```

No tocar `GET /storage/proxy` (no es mutador; ya está protegido a nivel de clase por `FirebaseAuthGuard`, y `storageService.fetchRemoteImage` restringe la descarga a `storage.googleapis.com`).

- [ ] **Step 6: Ejecutar y verificar que los 3 pasan**

```bash
npm test -- permissions.controller.spec.ts notifications.controller.spec.ts storage.controller.spec.ts
```
Expected: PASS — 7 tests en total.

- [ ] **Step 7: Verificar que los permisos `create`/`update`/`delete` de `permissions`, `notifications` y `storage_files` existen en el seed**

```bash
grep -n "'permissions'\|'notifications'\|'storage_files'" src/database/seeds/index.ts
```
Si falta alguna combinación resource/action (p. ej. `storage_files:create`), añadirla al seed y volver a correr `npm run seed` en el entorno de desarrollo — de lo contrario ni siquiera `admin`-adjacent roles con permisos explícitos podrán usar esos endpoints (nota: `admin` bypassa todo vía `permissions.guard.ts:48`, así que esto solo afecta a `manager_flotilla`/roles custom).

- [ ] **Step 8: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
docker logs fleet-backend --tail 30
```

Con un token de conductor (sin permisos explícitos de `permissions`/`notifications`/`storage_files` create/update/delete):
```bash
curl -X POST http://localhost:3001/api/permissions -H "Authorization: Bearer <token-conductor>" -H "Content-Type: application/json" -d '{"resource":"x","action":"y"}'
curl -X DELETE http://localhost:3001/api/notifications/<id-cualquiera> -H "Authorization: Bearer <token-conductor>"
```
Expected: ambos responden `403 Forbidden` (`"Sin permiso para esta acción"`), no `200`/`201`.

- [ ] **Step 9: Commit**

```bash
git add backend/src/modules/permissions backend/src/modules/notifications backend/src/modules/storage
git commit -m "$(cat <<'EOF'
security(C3): require explicit permissions on all mutating endpoints

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: C4 — Bypass de aprobación y edición de reservas ajenas

**Files:**
- Modify: `backend/src/modules/reservations/reservations.service.ts`
- Modify: `backend/src/modules/reservations/reservations.controller.ts`
- Test: `backend/src/modules/reservations/reservations.service.spec.ts`

**Interfaces:**
- Produces: `ReservationsService.update(id: string, data: Partial<Reservation>, currentUser: { id: string; role?: { name?: string } }): Promise<Reservation>` — firma cambia (antes solo `id, data`); único caller es `ReservationsController.update`.
- Consumes: `CurrentUserPayload` de `backend/src/common/decorators/current-user.decorator.ts` (ya usado por `checkIn`/`checkOut` en el mismo controller).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `backend/src/modules/reservations/reservations.service.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from '../../database/entities/reservation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let vehicleRepo: { update: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const pendingReservation = {
    id: 'r1',
    userId: 'owner-1',
    status: 'pending',
    vehicle: { plate: 'ABC-123', brand: 'Nissan', model: 'NP300' },
  } as unknown as Reservation;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: repo },
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: NotificationsService, useValue: { notifyUser: jest.fn() } },
        { provide: SystemSettingsService, useValue: { findByKey: jest.fn().mockResolvedValue(null) } },
        { provide: 'DataSource', useValue: dataSource },
      ],
    })
      .overrideProvider(require('typeorm').DataSource)
      .useValue(dataSource)
      .compile();
    service = module.get(ReservationsService);
  });

  describe('create', () => {
    it('ignora "status" enviado por el cliente (siempre queda en default "pending" salvo auto-approve)', async () => {
      await service.create({
        vehicleId: undefined,
        startDatetime: undefined,
        endDatetime: undefined,
        status: 'active',
        eventName: 'Prueba',
      } as unknown as Partial<Reservation>);
      const savedArg = repo.save.mock.calls[0][0];
      expect(savedArg.status).toBeUndefined();
    });
  });

  describe('update', () => {
    it('permite al dueño editar campos no sensibles', async () => {
      await service.update('r1', { destination: 'Nuevo destino' }, { id: 'owner-1' });
      expect(repo.update).toHaveBeenCalledWith('r1', { destination: 'Nuevo destino' });
    });

    it('descarta "status" cuando lo envía el propio dueño (anti auto-aprobación)', async () => {
      await service.update('r1', { status: 'active', destination: 'x' }, { id: 'owner-1' });
      expect(repo.update).toHaveBeenCalledWith('r1', { destination: 'x' });
    });

    it('permite "status" cuando lo envía un admin', async () => {
      await service.update('r1', { status: 'active' }, { id: 'admin-1', role: { name: 'admin' } });
      expect(repo.update).toHaveBeenCalledWith('r1', { status: 'active' });
    });

    it('rechaza la edición de un no-dueño sin rol elevado', async () => {
      await expect(
        service.update('r1', { destination: 'x' }, { id: 'otro-conductor' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- reservations.service.spec.ts
```
Expected: FAIL en varios casos — `create` guarda `status: 'active'` tal cual viene del cliente; `update` no lanza `ForbiddenException` para el caso de "no-dueño"; la llamada a `service.update` con 3 argumentos no compila con la firma actual de 2 argumentos (error de TypeScript).

- [ ] **Step 3: Arreglar `create()` — quitar `status` de la whitelist**

En `reservations.service.ts`, cambiar:
```ts
    const allowedKeys = [
      'vehicleId',
      'userId',
      'startDatetime',
      'endDatetime',
      'status',
      'eventName',
      'description',
      'destination',
      'checkinOdometer',
      'checkoutOdometer',
    ] as const;
```
por:
```ts
    const allowedKeys = [
      'vehicleId',
      'userId',
      'startDatetime',
      'endDatetime',
      'eventName',
      'description',
      'destination',
      'checkinOdometer',
      'checkoutOdometer',
    ] as const;
```
`status` ya no puede llegar por el body de creación; el `@Column({ default: 'pending' })` de la entidad (`reservation.entity.ts:39-40`) y la lógica de auto-aprobación existente (líneas 102-106, sin cambios) siguen siendo las únicas fuentes de `status` en `create()`.

- [ ] **Step 4: Arreglar `update()` — ownership + status solo para roles elevados**

Cambiar la firma y el cuerpo de `update()`:
```ts
  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const previous = await this.findOne(id);
    const allowedKeys = [
      'vehicleId',
      'userId',
      'startDatetime',
      'endDatetime',
      'status',
      'eventName',
      'description',
      'destination',
      'checkinOdometer',
      'checkinFuelPhotoUrl',
      'checkinConditionPhotoUrls',
      'checkoutOdometer',
      'checkoutFuelPhotoUrl',
      'checkoutConditionPhotoUrls',
    ] as const;
```
por:
```ts
  async update(
    id: string,
    data: Partial<Reservation>,
    currentUser: { id: string; role?: { name?: string } },
  ): Promise<Reservation> {
    const previous = await this.findOne(id);
    const isOwner = previous.userId === currentUser.id;
    const roleName = currentUser.role?.name?.toLowerCase();
    const isElevated = roleName === 'admin' || roleName === 'manager_flotilla';
    if (!isOwner && !isElevated) {
      throw new ForbiddenException('No tienes permiso para modificar esta reserva');
    }
    const baseAllowedKeys = [
      'vehicleId',
      'userId',
      'startDatetime',
      'endDatetime',
      'eventName',
      'description',
      'destination',
      'checkinOdometer',
      'checkinFuelPhotoUrl',
      'checkinConditionPhotoUrls',
      'checkoutOdometer',
      'checkoutFuelPhotoUrl',
      'checkoutConditionPhotoUrls',
    ] as const;
    const allowedKeys = isElevated ? ([...baseAllowedKeys, 'status'] as const) : baseAllowedKeys;
```
(el resto del método, desde `const payload: Record<string, unknown> = {};` en adelante, queda igual — sigue iterando sobre `allowedKeys`, que ahora es condicional).

- [ ] **Step 5: Propagar `currentUser` desde el controller**

En `reservations.controller.ts`, cambiar:
```ts
  @Put(':id')
  @RequirePermission('reservations', 'update')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      return await this.reservationsService.update(id, body as Parameters<typeof this.reservationsService.update>[1]);
    } catch (err) {
```
por:
```ts
  @Put(':id')
  @RequirePermission('reservations', 'update')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    try {
      return await this.reservationsService.update(
        id,
        body as Parameters<typeof this.reservationsService.update>[1],
        user,
      );
    } catch (err) {
```
(`CurrentUser`/`CurrentUserPayload` ya están importados en este archivo, usados por `checkIn`/`checkOut`).

- [ ] **Step 6: Ejecutar y verificar que pasan**

```bash
npm test -- reservations.service.spec.ts
```
Expected: PASS, 5 tests.

- [ ] **Step 7: Correr toda la suite del backend**

```bash
npm test
```
Expected: PASS — todas las suites de las Tasks 2, 3 y 4 en verde.

- [ ] **Step 8: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
docker logs fleet-backend --tail 30
```

Con un conductor dueño de una reserva `pending`:
```bash
curl -X PUT http://localhost:3001/api/reservations/<id-propio> \
  -H "Authorization: Bearer <token-conductor>" -H "Content-Type: application/json" \
  -d '{"status":"active"}'
curl http://localhost:3001/api/reservations/<id-propio> -H "Authorization: Bearer <token-conductor>"
```
Expected: la respuesta y el `GET` posterior muestran `status` sin cambiar (sigue `pending`).

Con el mismo conductor intentando editar una reserva de otro usuario:
```bash
curl -X PUT http://localhost:3001/api/reservations/<id-de-otro-usuario> \
  -H "Authorization: Bearer <token-conductor>" -H "Content-Type: application/json" \
  -d '{"destination":"hackeado"}'
```
Expected: `403 Forbidden`.

Con un admin aprobando la reserva del conductor:
```bash
curl -X PUT http://localhost:3001/api/reservations/<id-propio-del-conductor> \
  -H "Authorization: Bearer <token-admin>" -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```
Expected: `200`, `status` cambia a `active`.

- [ ] **Step 9: Commit**

```bash
git add backend/src/modules/reservations
git commit -m "$(cat <<'EOF'
security(C4): enforce reservation ownership and block client-side self-approval

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: C5 — `synchronize` activo por defecto

**Files:**
- Modify: `backend/src/config/database.config.ts`
- Modify: `docker_compose.yml` (raíz del repo)
- Create: `backend/src/database/migrations/<timestamp>-Baseline.ts`

**Interfaces:** N/A (config + migración; no cambia código de aplicación).

- [ ] **Step 1: Generar la migración baseline contra una base de datos vacía**

El esquema real hoy fue creado casi en su totalidad por `synchronize: true` (solo existen 2 migraciones para 15 entidades) — no basta con correr `migration:generate` contra la base de datos de desarrollo actual, porque ya coincide con las entidades y generaría una migración vacía. Hay que generarla contra una base de datos limpia:

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
docker run --rm -d --name pg-baseline-check \
  -e POSTGRES_PASSWORD=temp -e POSTGRES_USER=fleet_user -e POSTGRES_DB=fleet_baseline \
  -p 5544:5432 postgres:15-alpine
sleep 3
DB_HOST=localhost DB_PORT=5544 DB_USER=fleet_user DB_PASSWORD=temp DB_NAME=fleet_baseline \
  npm run migration:generate -- src/database/migrations/Baseline
```
Expected: se crea `backend/src/database/migrations/<timestamp>-Baseline.ts` con sentencias `CREATE TABLE` para las 15 entidades (revisar el archivo generado: debe incluir `users`, `roles`, `permissions`, `vehicles`, `reservations`, `maintenance`, `fuel_records`, `costs`, `incidents`, `sanctions`, `notifications`, `audit_logs`, `storage_files`, `providers`, `system_settings`, y sus FKs/índices).

- [ ] **Step 2: Verificar que la migración baseline aplica limpia**

```bash
DB_HOST=localhost DB_PORT=5544 DB_USER=fleet_user DB_PASSWORD=temp DB_NAME=fleet_baseline \
  npm run migration:run
```
Expected: corre sin errores, crea todas las tablas. Confirmar con:
```bash
docker exec pg-baseline-check psql -U fleet_user -d fleet_baseline -c "\dt"
```
Expected: lista las 15+ tablas de la aplicación más la tabla interna `migrations` de TypeORM.

```bash
docker stop pg-baseline-check
```

- [ ] **Step 3: Marcar la migración baseline como ya aplicada en la base de datos real de desarrollo**

La base de datos de desarrollo ya tiene el esquema (creado por `synchronize`), así que **no** se debe correr `up()` de la baseline ahí (fallaría, las tablas ya existen) — solo insertar el registro de control para que TypeORM la considere aplicada:

```bash
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c \
  "INSERT INTO migrations (timestamp, name) VALUES (<timestamp-del-archivo>, 'Baseline<timestamp>');"
```
(sustituir `<timestamp-del-archivo>` y el nombre exacto de la clase por los que generó el Step 1 — están en el nombre del archivo y en la propiedad `name` de la clase).

Confirmar:
```bash
docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c "SELECT * FROM migrations ORDER BY timestamp;"
```
Expected: 3 filas — las 2 migraciones existentes más la nueva `Baseline`.

- [ ] **Step 4: Desactivar `synchronize` incondicionalmente**

En `backend/src/config/database.config.ts`, cambiar:
```ts
  synchronize: process.env.NODE_ENV !== 'production',
```
por:
```ts
  synchronize: false,
```

- [ ] **Step 5: Forzar `NODE_ENV` explícito en el compose**

En `docker_compose.yml` (raíz), dentro del servicio `backend`, cambiar:
```yaml
    environment:
      NODE_ENV: ${NODE_ENV:-development}
```
por:
```yaml
    environment:
      NODE_ENV: ${NODE_ENV:-production}
```
De forma que si el operador olvida exportar `NODE_ENV` antes de `docker compose up`, el contenedor arranca en modo `production` (más restrictivo) en vez de `development` por defecto. Para levantar un entorno de desarrollo real hay que exportar explícitamente `NODE_ENV=development` antes de `docker compose up`.

- [ ] **Step 6: Sincronizar el cambio de `docker_compose.yml` hacia el checkout de despliegue**

Este archivo se edita en `/home/dagargon89/gestor_vehiculos_GPJ` pero el compose que corre de verdad vive en `/root/flotilla/gestor_vehiculos_GPJ` (checkout separado, per `CLAUDE.md`). Tras hacer commit y push de este cambio, en el servidor (usuario `root`) correr `git pull` sobre `/root/flotilla/gestor_vehiculos_GPJ` antes del rebuild del Step 7 — de lo contrario el rebuild seguirá usando el `docker_compose.yml` viejo con `NODE_ENV:-development`.

- [ ] **Step 7: Rebuild y verificar que no hay drift de esquema**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
docker logs fleet-backend --tail 30
```
Expected: arranca sin errores (`Nest application successfully started`), sin ningún log de TypeORM intentando alterar el esquema.

Verificar que las migraciones futuras corren limpio (smoke test con una migración vacía):
```bash
docker exec fleet-backend printenv NODE_ENV
```
Expected: si no se exportó `NODE_ENV` explícitamente al levantar, debe imprimir `production`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/config/database.config.ts backend/src/database/migrations docker_compose.yml
git commit -m "$(cat <<'EOF'
security(C5): disable schema auto-sync, add baseline migration, default NODE_ENV to production

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Cobertura de la especificación:** C1 (Task 1), C2 (Task 2), C3 (Task 3), C4 (Task 4), C5 (Task 5) — los 5 hallazgos críticos del roadmap "Sprint 0" están cubiertos con un task cada uno. El punto "otros de seguridad (medio)" del análisis (helmet, rate limiting, límite de subida de archivos, credenciales por defecto en código) **no** está en el alcance de este plan — corresponde a una iteración de seguridad posterior, fuera del Sprint 0 definido en el roadmap.

**Placeholders:** ninguno — cada step tiene código completo o comando exacto.

**Consistencia de tipos:** `ReservationsService.update` cambia de `(id, data)` a `(id, data, currentUser)` — el único caller (`ReservationsController.update`) se actualiza en el mismo Task (Step 5). `UsersService.updateOwnProfile` y `SyncUserDto` se usan consistentemente entre `auth.controller.ts`, `auth.service.ts` y `users.service.ts`.
