# Sprint 3 — Valor a mediano plazo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Depende de** los 3 planes previos (`2026-07-15-sprint0-seguridad.md`, `2026-07-15-sprint1-quick-wins.md`, `2026-07-15-sprint2-componentes.md`) — en particular, Task 5 de este plan asume que Jest (backend) y Vitest (frontend) ya existen, y Task 2 asume que el fix de doble FK de `cost.entity.ts` (Sprint 2, Task 5) ya se aplicó.

**Goal:** Cerrar los 5 puntos de "valor a mediano plazo" del roadmap: mantenimiento preventivo por km/fecha con alertas automáticas, reporte de rendimiento km/L y TCO por vehículo, documentos del vehículo con alertas de vencimiento, sincronización automática de `vehicle.status` + auto-captura de combustible en el check-out, y el pipeline de CI.

**Architecture:** Se añaden campos de programación (`nextServiceOdometer`/`nextServiceDate`/intervalos) a `Vehicle`; un nuevo scheduler de mantenimiento que replica el patrón ya usado por `ReservationsSchedulerService`; un nuevo módulo `vehicle-documents` (entidad ligera que referencia `StorageFile` para el archivo físico); dos reportes SQL nuevos en `ReportsService`; cambios puntuales en `ReservationsService`/`MaintenanceService` para sincronizar `vehicle.status`; y un workflow de GitHub Actions que corre las suites de Jest/Vitest ya existentes desde los Sprints 0-2.

**Tech Stack:** NestJS + TypeORM + `@nestjs/schedule` (backend); React + Vite (frontend); GitHub Actions (nuevo).

## Global Constraints

- Toda la lógica de "quién es aprobador" reutiliza el mismo patrón introducido en el Sprint 1 (Task 4): un permiso que `conductor` **nunca** tiene en el seed (`backend/src/database/seeds/index.ts`) sirve de proxy de "rol elevado" vía `UsersService.findUsersWithPermission(resource, action)`. Para mantenimiento, `conductor` no tiene absolutamente ningún permiso de `maintenance` en el seed (a diferencia de `reservations`, donde sí tiene `create/read/update`), así que **cualquier** acción de `maintenance` (`create`, `update` o `delete`) sirve como proxy — se usa `maintenance:delete` por consistencia con el patrón de reservas.
- Backend: rebuild tras cada cambio (`cd /root/flotilla/gestor_vehiculos_GPJ && docker compose -f docker_compose.yml up -d --build backend`).
- Todo cambio de esquema requiere migración explícita (`synchronize: false` desde Sprint 0).
- El único cron existente hoy vive en `backend/src/modules/reservations/reservations-scheduler.service.ts` — usar el mismo patrón (`@Cron`, `OnApplicationBootstrap`, notificación in-app + email opcional) para los cronjobs nuevos de esta tarea.

---

### Task 1: Mantenimiento preventivo por km/fecha + cron de alertas

**Files:**
- Modify: `backend/src/database/entities/vehicle.entity.ts`
- Create: `backend/src/database/migrations/<timestamp>-AddPreventiveMaintenanceFields.ts`
- Modify: `backend/src/modules/maintenance/maintenance.service.ts`
- Modify: `backend/src/modules/maintenance/maintenance.module.ts`
- Create: `backend/src/modules/maintenance/maintenance-scheduler.service.ts`
- Test: `backend/src/modules/maintenance/maintenance.service.spec.ts`
- Test: `backend/src/modules/maintenance/maintenance-scheduler.service.spec.ts`

**Interfaces:**
- Produces: `Vehicle.maintenanceIntervalKm?: number`, `Vehicle.maintenanceIntervalDays?: number`, `Vehicle.nextServiceOdometer?: number`, `Vehicle.nextServiceDate?: Date`.
- Consumes: `UsersService.findUsersWithPermission` (Sprint 1, Task 4), `NotificationsService.notifyUser` (existente).

- [ ] **Step 1: Añadir los campos a `Vehicle` y generar la migración**

En `backend/src/database/entities/vehicle.entity.ts`, añadir (junto a `currentOdometer`):
```ts
  @Column({ type: 'int', nullable: true })
  maintenanceIntervalKm: number;

  @Column({ type: 'int', nullable: true })
  maintenanceIntervalDays: number;

  @Column({ type: 'int', nullable: true })
  nextServiceOdometer: number;

  @Column({ type: 'date', nullable: true })
  nextServiceDate: Date;
```

Generar la migración:
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm run migration:generate -- src/database/migrations/AddPreventiveMaintenanceFields
```
Expected: genera 4 `ADD COLUMN` sobre `vehicles`, todas nullable (no requiere backfill). Revisar el archivo generado y aplicar:
```bash
npm run migration:run
```

- [ ] **Step 2: Escribir el test que falla para `MaintenanceService`**

Crear `backend/src/modules/maintenance/maintenance.service.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

describe('MaintenanceService.update — programación del siguiente servicio', () => {
  let service: MaintenanceService;
  let repo: { update: jest.Mock; findOne: jest.Mock };
  let vehiclesService: { findOne: jest.Mock; update: jest.Mock };

  const completedMaintenance = {
    id: 'm1',
    vehicleId: 'v1',
    status: 'completed',
    odometerAtService: 50000,
  } as unknown as Maintenance;

  beforeEach(async () => {
    repo = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(completedMaintenance),
    };
    vehiclesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'v1', maintenanceIntervalKm: 10000, maintenanceIntervalDays: 180 }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: getRepositoryToken(Maintenance), useValue: repo },
        { provide: VehiclesService, useValue: vehiclesService },
      ],
    }).compile();
    service = module.get(MaintenanceService);
  });

  it('programa el siguiente servicio por km al completar un mantenimiento', async () => {
    await service.update('m1', { status: 'completed' });
    expect(vehiclesService.update).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({ nextServiceOdometer: 60000 }),
    );
  });

  it('no programa nada si el vehículo no tiene intervalos configurados', async () => {
    vehiclesService.findOne.mockResolvedValue({ id: 'v1' });
    await service.update('m1', { status: 'completed' });
    expect(vehiclesService.update).not.toHaveBeenCalled();
  });

  it('no toca el vehículo si el mantenimiento no queda en "completed"', async () => {
    await service.update('m1', { description: 'nota' });
    expect(vehiclesService.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- maintenance.service.spec.ts
```
Expected: FAIL — `VehiclesService` no está registrado como provider en el módulo real todavía y `update()` no llama a `vehiclesService.update`.

- [ ] **Step 4: Implementar la programación del siguiente servicio**

En `backend/src/modules/maintenance/maintenance.service.ts`, añadir el import e inyectar `VehiclesService`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private repo: Repository<Maintenance>,
    private vehiclesService: VehiclesService,
  ) {}
```

Cambiar `update()`:
```ts
  async update(id: string, data: Partial<Maintenance>): Promise<Maintenance> {
    await this.repo.update(id, data);
    const updated = await this.findOne(id);
    if (data.status === 'completed') {
      await this.scheduleNextService(updated);
    }
    return updated;
  }

  private async scheduleNextService(maintenance: Maintenance): Promise<void> {
    const vehicle = await this.vehiclesService.findOne(maintenance.vehicleId);
    const patch: Record<string, unknown> = {};
    if (vehicle.maintenanceIntervalKm && maintenance.odometerAtService != null) {
      patch.nextServiceOdometer = maintenance.odometerAtService + vehicle.maintenanceIntervalKm;
    }
    if (vehicle.maintenanceIntervalDays) {
      const next = new Date();
      next.setDate(next.getDate() + vehicle.maintenanceIntervalDays);
      patch.nextServiceDate = next;
    }
    if (Object.keys(patch).length > 0) {
      await this.vehiclesService.update(maintenance.vehicleId, patch);
    }
  }
```

- [ ] **Step 5: Registrar `VehiclesModule` en `MaintenanceModule`**

En `backend/src/modules/maintenance/maintenance.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance]), VehiclesModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
```
Verificar que no hay ciclo: `VehiclesModule` importa `StorageModule`, no `MaintenanceModule` — sin ciclo.

- [ ] **Step 6: Ejecutar y verificar que pasa**

```bash
npm test -- maintenance.service.spec.ts
```
Expected: PASS, 3 tests.

- [ ] **Step 7: Escribir el test que falla para el scheduler de alertas**

Crear `backend/src/modules/maintenance/maintenance-scheduler.service.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaintenanceSchedulerService } from './maintenance-scheduler.service';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('MaintenanceSchedulerService.checkUpcomingMaintenance', () => {
  let service: MaintenanceSchedulerService;
  let vehicleRepo: { createQueryBuilder: jest.Mock };
  let maintenanceRepo: { count: jest.Mock };
  let usersService: { findUsersWithPermission: jest.Mock };
  let notificationsService: { notifyUser: jest.Mock };

  const dueVehicle = { id: 'v1', plate: 'ABC-123', brand: 'Nissan', model: 'NP300' } as Vehicle;

  beforeEach(async () => {
    const qb = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue([dueVehicle]) };
    vehicleRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    maintenanceRepo = { count: jest.fn().mockResolvedValue(0) };
    usersService = { findUsersWithPermission: jest.fn().mockResolvedValue([{ id: 'approver-1' }]) };
    notificationsService = { notifyUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceSchedulerService,
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: getRepositoryToken(Maintenance), useValue: maintenanceRepo },
        { provide: UsersService, useValue: usersService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();
    service = module.get(MaintenanceSchedulerService);
  });

  it('notifica a los aprobadores cuando un vehículo está próximo a servicio', async () => {
    await service.checkUpcomingMaintenance();
    expect(usersService.findUsersWithPermission).toHaveBeenCalledWith('maintenance', 'delete');
    expect(notificationsService.notifyUser).toHaveBeenCalledWith(
      'approver-1',
      'maintenance_due',
      expect.any(String),
      expect.stringContaining('ABC-123'),
      '/maintenance',
    );
  });

  it('no notifica si ya existe un mantenimiento programado para ese vehículo', async () => {
    maintenanceRepo.count.mockResolvedValue(1);
    await service.checkUpcomingMaintenance();
    expect(notificationsService.notifyUser).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 8: Ejecutar y verificar que falla**

```bash
npm test -- maintenance-scheduler.service.spec.ts
```
Expected: FAIL — el módulo `./maintenance-scheduler.service` no existe.

- [ ] **Step 9: Implementar el scheduler**

Crear `backend/src/modules/maintenance/maintenance-scheduler.service.ts`:
```ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

const KM_THRESHOLD = 500;
const DAYS_THRESHOLD = 15;

@Injectable()
export class MaintenanceSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MaintenanceSchedulerService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Maintenance)
    private maintenanceRepo: Repository<Maintenance>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async onApplicationBootstrap() {
    await this.checkUpcomingMaintenance();
  }

  @Cron('0 7 * * *') // todos los días a las 7:00 AM
  async checkUpcomingMaintenance(): Promise<void> {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + DAYS_THRESHOLD);

    const dueVehicles = await this.vehicleRepo
      .createQueryBuilder('v')
      .where('v.deletedAt IS NULL')
      .andWhere(
        '((v.nextServiceOdometer IS NOT NULL AND v.currentOdometer IS NOT NULL AND (v.nextServiceOdometer - v.currentOdometer) <= :kmThreshold)' +
          ' OR (v.nextServiceDate IS NOT NULL AND v.nextServiceDate <= :soonDate))',
        { kmThreshold: KM_THRESHOLD, soonDate },
      )
      .getMany();

    if (dueVehicles.length === 0) return;

    const approvers = await this.usersService.findUsersWithPermission('maintenance', 'delete');

    for (const vehicle of dueVehicles) {
      try {
        const alreadyScheduled = await this.maintenanceRepo.count({
          where: { vehicleId: vehicle.id, status: 'scheduled' },
        });
        if (alreadyScheduled > 0) continue;

        const label = `${vehicle.plate} – ${vehicle.brand} ${vehicle.model}`;
        for (const approver of approvers) {
          await this.notificationsService.notifyUser(
            approver.id,
            'maintenance_due',
            'Mantenimiento próximo',
            `El vehículo ${label} está próximo a requerir mantenimiento preventivo.`,
            '/maintenance',
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to process upcoming maintenance for vehicle ${vehicle.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
```

Registrar en `maintenance.module.ts` (añadir `TypeOrmModule.forFeature([Vehicle])` — ya viene indirectamente por `VehiclesModule` pero ese módulo no exporta el repositorio de `Vehicle`, solo `VehiclesService`; para inyectar `@InjectRepository(Vehicle)` aquí hace falta declararlo también en este módulo):
```ts
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { MaintenanceSchedulerService } from './maintenance-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance, Vehicle]),
    VehiclesModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceSchedulerService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
```

- [ ] **Step 10: Ejecutar y verificar que pasa**

```bash
npm test -- maintenance-scheduler.service.spec.ts
npm test
```
Expected: PASS en ambos.

- [ ] **Step 11: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```
Editar un vehículo de prueba desde `/vehicles` con `maintenanceIntervalKm=10000` y `currentOdometer` a 400 km de `nextServiceOdometer` (o setear `nextServiceDate` a 10 días desde hoy). Esperar a la siguiente ejecución del cron (o reiniciar el contenedor para disparar `onApplicationBootstrap`) y confirmar en la campanita de un admin que llega "Mantenimiento próximo".

- [ ] **Step 12: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/database/entities/vehicle.entity.ts backend/src/database/migrations backend/src/modules/maintenance
git commit -m "$(cat <<'EOF'
feat: add preventive maintenance scheduling (km/date) with alert cron

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Rendimiento km/L y reporte de TCO por vehículo

**Files:**
- Modify: `backend/src/modules/reports/reports.service.ts`
- Modify: `backend/src/modules/reports/reports.controller.ts`
- Test: `backend/src/modules/reports/reports.service.spec.ts`
- Modify: `frontend/src/pages/Reports/ReportsPage.tsx`

**Interfaces:**
- Produces: `ReportsService.getFuelEfficiencyReport(startDate: Date, endDate: Date): Promise<unknown[]>`, `ReportsService.getTcoReport(startDate: Date, endDate: Date): Promise<unknown[]>`.
- Produces endpoints: `GET /reports/fuel-efficiency`, `GET /reports/tco` (mismo patrón que los 5 endpoints existentes de `ReportsController`).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `backend/src/modules/reports/reports.service.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Reservation } from '../../database/entities/reservation.entity';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { Incident } from '../../database/entities/incident.entity';

describe('ReportsService — reportes nuevos', () => {
  let service: ReportsService;
  let reservationsRepo: { query: jest.Mock };

  beforeEach(async () => {
    reservationsRepo = { query: jest.fn().mockResolvedValue([{ id: 'v1', plate: 'ABC-123', kmPerLiter: '12.50' }]) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Reservation), useValue: reservationsRepo },
        { provide: getRepositoryToken(FuelRecord), useValue: {} },
        { provide: getRepositoryToken(Maintenance), useValue: {} },
        { provide: getRepositoryToken(Incident), useValue: {} },
      ],
    }).compile();
    service = module.get(ReportsService);
  });

  it('getFuelEfficiencyReport ejecuta una consulta parametrizada con las fechas dadas', async () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const result = await service.getFuelEfficiencyReport(start, end);
    expect(reservationsRepo.query).toHaveBeenCalledWith(expect.stringContaining('kmPerLiter'), [start, end]);
    expect(result).toEqual([{ id: 'v1', plate: 'ABC-123', kmPerLiter: '12.50' }]);
  });

  it('getTcoReport ejecuta una consulta parametrizada con las fechas dadas', async () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    await service.getTcoReport(start, end);
    expect(reservationsRepo.query).toHaveBeenCalledWith(expect.stringContaining('totalCost'), [start, end]);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- reports.service.spec.ts
```
Expected: FAIL — `service.getFuelEfficiencyReport is not a function`.

- [ ] **Step 3: Implementar los 2 reportes**

En `backend/src/modules/reports/reports.service.ts`, añadir al final de la clase (antes del cierre `}`):
```ts
  /** Rendimiento (km/L) por vehículo en el período — requiere check-in y check-out completos */
  async getFuelEfficiencyReport(startDate: Date, endDate: Date): Promise<unknown[]> {
    const query = `
      SELECT
        v.id,
        v.plate,
        v.brand,
        v.model,
        COALESCE(SUM(r."checkoutOdometer" - r."checkinOdometer"), 0) as "totalKmDriven",
        COALESCE(fr_totals."totalLiters", 0) as "totalLiters",
        CASE WHEN COALESCE(fr_totals."totalLiters", 0) > 0
          THEN ROUND((COALESCE(SUM(r."checkoutOdometer" - r."checkinOdometer"), 0) / fr_totals."totalLiters")::numeric, 2)
          ELSE 0 END as "kmPerLiter"
      FROM vehicles v
      LEFT JOIN reservations r ON v.id = r."vehicle_id"
        AND r."checkinOdometer" IS NOT NULL AND r."checkoutOdometer" IS NOT NULL
        AND r."startDatetime" BETWEEN $1 AND $2
        AND r."deletedAt" IS NULL
      LEFT JOIN (
        SELECT vehicle_id, SUM(liters) as "totalLiters"
        FROM fuel_records
        WHERE date BETWEEN $1 AND $2 AND "deletedAt" IS NULL
        GROUP BY vehicle_id
      ) fr_totals ON fr_totals.vehicle_id = v.id
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model, fr_totals."totalLiters"
      HAVING COALESCE(fr_totals."totalLiters", 0) > 0
      ORDER BY "kmPerLiter" DESC
    `;
    return this.reservationsRepo.query(query, [startDate, endDate]);
  }

  /** Costo total de propiedad (TCO) por vehículo: combustible + otros costos (incluye mantenimiento vía categoría en costs) */
  async getTcoReport(startDate: Date, endDate: Date): Promise<unknown[]> {
    const query = `
      SELECT
        v.id,
        v.plate,
        v.brand,
        v.model,
        COALESCE(fuel_totals."fuelCost", 0) as "fuelCost",
        COALESCE(cost_totals."otherCost", 0) as "otherCost",
        COALESCE(fuel_totals."fuelCost", 0) + COALESCE(cost_totals."otherCost", 0) as "totalCost"
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) as "fuelCost"
        FROM fuel_records
        WHERE date BETWEEN $1 AND $2 AND "deletedAt" IS NULL
        GROUP BY vehicle_id
      ) fuel_totals ON fuel_totals.vehicle_id = v.id
      LEFT JOIN (
        SELECT vehicle_id, SUM(amount) as "otherCost"
        FROM costs
        WHERE date BETWEEN $1 AND $2 AND "deletedAt" IS NULL
        GROUP BY vehicle_id
      ) cost_totals ON cost_totals.vehicle_id = v.id
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model, fuel_totals."fuelCost", cost_totals."otherCost"
      HAVING COALESCE(fuel_totals."fuelCost", 0) + COALESCE(cost_totals."otherCost", 0) > 0
      ORDER BY "totalCost" DESC
    `;
    return this.reservationsRepo.query(query, [startDate, endDate]);
  }
```
Nota: esta consulta asume que `fuel_records.vehicle_id` y `costs.vehicle_id` ya son la columna única (no la duplicada) — depende del fix C6 del Sprint 2 (Task 5), que corrige exactamente `fuel-record.entity.ts` y `cost.entity.ts`.

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npm test -- reports.service.spec.ts
```
Expected: PASS, 2 tests.

- [ ] **Step 5: Añadir los endpoints al controller**

En `backend/src/modules/reports/reports.controller.ts`, añadir (junto a los otros 5 endpoints):
```ts
  @Get('fuel-efficiency')
  @RequirePermission('reports', 'read')
  getFuelEfficiency(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getFuelEfficiencyReport(start, end);
  }

  @Get('tco')
  @RequirePermission('reports', 'read')
  getTco(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getTcoReport(start, end);
  }
```

- [ ] **Step 6: Rebuild y verificación manual del backend**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```
```bash
curl "http://localhost:3001/api/reports/fuel-efficiency?startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer <token-admin>"
curl "http://localhost:3001/api/reports/tco?startDate=2026-01-01&endDate=2026-12-31" -H "Authorization: Bearer <token-admin>"
```
Expected: `200` con arrays de resultados (vacíos si no hay datos de combustible/costos en el rango).

- [ ] **Step 7: Añadir la pestaña "Rendimiento (km/L)" en el frontend (página de referencia)**

En `frontend/src/pages/Reports/ReportsPage.tsx`:

Cambiar el tipo `Tab` (línea 8):
```ts
type Tab = 'vehicle-usage' | 'driver-activity' | 'reservations-history' | 'fuel' | 'maintenance' | 'fuel-efficiency' | 'tco';
```

Añadir el tipo de fila tras `MaintenanceRow` (línea ~67):
```ts
type FuelEfficiencyRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  totalKmDriven: string;
  totalLiters: string;
  kmPerLiter: string;
};

type TcoRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  fuelCost: string;
  otherCost: string;
  totalCost: string;
};
```

Añadir a `TABS` (línea 69-75):
```ts
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'vehicle-usage', label: 'Uso de vehículos', icon: 'directions_car' },
  { id: 'driver-activity', label: 'Conductores', icon: 'people' },
  { id: 'reservations-history', label: 'Historial de reservas', icon: 'history' },
  { id: 'fuel', label: 'Combustible', icon: 'local_gas_station' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'build' },
  { id: 'fuel-efficiency', label: 'Rendimiento (km/L)', icon: 'speed' },
  { id: 'tco', label: 'Costo total (TCO)', icon: 'account_balance_wallet' },
];
```

Añadir las 2 queries (junto a `maintenanceQ`, línea ~159-164):
```ts
  const fuelEfficiencyQ = useQuery({
    queryKey: ['reports', 'fuel-efficiency', startDate, endDate],
    queryFn: () =>
      apiClient.get('/reports/fuel-efficiency', { params }).then((r) => r.data as FuelEfficiencyRow[]),
    enabled: activeTab === 'fuel-efficiency',
  });

  const tcoQ = useQuery({
    queryKey: ['reports', 'tco', startDate, endDate],
    queryFn: () => apiClient.get('/reports/tco', { params }).then((r) => r.data as TcoRow[]),
    enabled: activeTab === 'tco',
  });
```

Añadir la paginación (junto a `maPag`, línea 171):
```ts
  const fePag = usePagination<FuelEfficiencyRow>(fuelEfficiencyQ.data ?? []);
  const tcoPag = usePagination<TcoRow>(tcoQ.data ?? []);
```

Añadir el bloque de render (copiando exactamente la estructura del bloque `{activeTab === 'fuel' && (...)}` de las líneas 579-646 — mismo `TableToolbar` + `<table>`, cambiando: título "Rendimiento de combustible", columnas `['Placa', 'Marca / Modelo', 'Km recorridos', 'Litros', 'Km/L']`, filas `[r.plate, `${r.brand} ${r.model}`, r.totalKmDriven, r.totalLiters, r.kmPerLiter]`, `queryKey`/`data` de `fuelEfficiencyQ`/`fePag`, nombre de archivo `rendimiento.csv/xlsx/pdf`) justo después de ese bloque existente (antes de la línea 578 que cierra el `{activeTab === 'fuel' && (...)}`, o inmediatamente después — mantener el mismo nivel de indentación que los bloques hermanos).

- [ ] **Step 8: Replicar la misma estructura para la pestaña "Costo total (TCO)"**

Mismo patrón exacto que el Step 7, usando `tcoQ`/`tcoPag`, título "Costo total de propiedad (TCO)", columnas `['Placa', 'Marca / Modelo', 'Combustible', 'Otros costos', 'Total']`, filas `[r.plate, `${r.brand} ${r.model}`, r.fuelCost, r.otherCost, r.totalCost]`, nombre de archivo `tco.csv/xlsx/pdf`.

- [ ] **Step 9: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/reports`, cambiar a la pestaña "Rendimiento (km/L)" y "Costo total (TCO)", confirmar que cargan datos (o tabla vacía si no hay datos en el rango) y que exportar CSV/Excel/PDF funciona igual que en las demás pestañas.

- [ ] **Step 10: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/modules/reports frontend/src/pages/Reports/ReportsPage.tsx
git commit -m "$(cat <<'EOF'
feat: add fuel-efficiency (km/L) and TCO-per-vehicle reports

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Documentos del vehículo (seguro/circulación/verificación) + alertas de vencimiento

**Files:**
- Create: `backend/src/database/entities/vehicle-document.entity.ts`
- Create: `backend/src/database/migrations/<timestamp>-CreateVehicleDocuments.ts`
- Create: `backend/src/modules/vehicle-documents/vehicle-documents.service.ts`
- Create: `backend/src/modules/vehicle-documents/vehicle-documents.controller.ts`
- Create: `backend/src/modules/vehicle-documents/vehicle-documents.module.ts`
- Create: `backend/src/modules/vehicle-documents/vehicle-document-scheduler.service.ts`
- Test: `backend/src/modules/vehicle-documents/vehicle-documents.service.spec.ts`
- Test: `backend/src/modules/vehicle-documents/vehicle-document-scheduler.service.spec.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/database/seeds/index.ts`

**Interfaces:**
- Produces: entidad `VehicleDocument { id, vehicleId, vehicle, documentType: 'insurance'|'circulation_card'|'inspection', expiryDate, storageFileId?, notes? }`.
- Consumes: `StorageService`/`StorageModule` (existente) para el archivo físico (póliza escaneada, etc.) — este módulo solo referencia `storageFileId`, no reimplementa upload.

- [ ] **Step 1: Crear la entidad y la migración**

Crear `backend/src/database/entities/vehicle-document.entity.ts`:
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
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_documents')
export class VehicleDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  @Index()
  vehicleId: string;

  @Column()
  documentType: string; // 'insurance' | 'circulation_card' | 'inspection'

  @Column({ type: 'date' })
  @Index()
  expiryDate: Date;

  @Column({ nullable: true })
  storageFileId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

Añadir `VehicleDocument` a `backend/src/config/typeorm-data-source.ts` (import + array `entities`, junto a `StorageFile`).

Generar y aplicar la migración:
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm run migration:generate -- src/database/migrations/CreateVehicleDocuments
npm run migration:run
```

- [ ] **Step 2: Escribir el test que falla del servicio**

Crear `backend/src/modules/vehicle-documents/vehicle-documents.service.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';

describe('VehicleDocumentsService', () => {
  let service: VehicleDocumentsService;
  let repo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'd1', ...x })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleDocumentsService, { provide: getRepositoryToken(VehicleDocument), useValue: repo }],
    }).compile();
    service = module.get(VehicleDocumentsService);
  });

  it('crea un documento de vehículo', async () => {
    const result = await service.create({ vehicleId: 'v1', documentType: 'insurance', expiryDate: new Date('2027-01-01') });
    expect(result).toEqual(expect.objectContaining({ id: 'd1', vehicleId: 'v1', documentType: 'insurance' }));
  });

  it('findByVehicle filtra por vehicleId', async () => {
    await service.findByVehicle('v1');
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { vehicleId: 'v1' } }));
  });
});
```

- [ ] **Step 3: Ejecutar y verificar que falla**

```bash
npm test -- vehicle-documents.service.spec.ts
```
Expected: FAIL — módulo no existe.

- [ ] **Step 4: Implementar el servicio, controller y módulo**

Crear `backend/src/modules/vehicle-documents/vehicle-documents.service.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';

@Injectable()
export class VehicleDocumentsService {
  constructor(
    @InjectRepository(VehicleDocument)
    private repo: Repository<VehicleDocument>,
  ) {}

  async findByVehicle(vehicleId: string): Promise<VehicleDocument[]> {
    return this.repo.find({ where: { vehicleId }, order: { expiryDate: 'ASC' } });
  }

  async findOne(id: string): Promise<VehicleDocument> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async create(data: Partial<VehicleDocument>): Promise<VehicleDocument> {
    const doc = this.repo.create(data);
    return this.repo.save(doc);
  }

  async update(id: string, data: Partial<VehicleDocument>): Promise<VehicleDocument> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
```

Crear `backend/src/modules/vehicle-documents/vehicle-documents.controller.ts`:
```ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';

@Controller('vehicle-documents')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class VehicleDocumentsController {
  constructor(private service: VehicleDocumentsService) {}

  @Get()
  @RequirePermission('vehicle_documents', 'read')
  findByVehicle(@Query('vehicleId') vehicleId: string) {
    return this.service.findByVehicle(vehicleId);
  }

  @Post()
  @RequirePermission('vehicle_documents', 'create')
  create(@Body() body: Partial<VehicleDocument>) {
    return this.service.create(body);
  }

  @Put(':id')
  @RequirePermission('vehicle_documents', 'update')
  update(@Param('id') id: string, @Body() body: Partial<VehicleDocument>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('vehicle_documents', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

Crear `backend/src/modules/vehicle-documents/vehicle-documents.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { VehicleDocumentsController } from './vehicle-documents.controller';
import { VehicleDocumentScheduler } from './vehicle-document-scheduler.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleDocument]), UsersModule, NotificationsModule],
  controllers: [VehicleDocumentsController],
  providers: [VehicleDocumentsService, VehicleDocumentScheduler],
  exports: [VehicleDocumentsService],
})
export class VehicleDocumentsModule {}
```

Añadir `VehicleDocumentsModule` a `backend/src/app.module.ts` (import + entrada en `imports`).

Añadir el permiso `vehicle_documents` (`create/read/update/delete`) al seed en `backend/src/database/seeds/index.ts`, incluido en `managerResources` (junto a `'providers'`) y con `read` también en `conductorRole` si se decide que los conductores puedan ver los documentos de los vehículos que reservan (revisar con el usuario si aplica; por defecto, replicar el patrón de `maintenance` — solo admin/manager, sin acceso de conductor, ya que es información administrativa/legal del vehículo).

- [ ] **Step 5: Ejecutar y verificar que pasa**

```bash
npm test -- vehicle-documents.service.spec.ts
```
Expected: PASS, 2 tests.

- [ ] **Step 6: Escribir el test que falla del scheduler de alertas de vencimiento**

Crear `backend/src/modules/vehicle-documents/vehicle-document-scheduler.service.spec.ts` (mismo patrón que `maintenance-scheduler.service.spec.ts` de la Task 1, adaptado a documentos):
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleDocumentScheduler } from './vehicle-document-scheduler.service';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('VehicleDocumentScheduler.checkExpiringDocuments', () => {
  let service: VehicleDocumentScheduler;
  let repo: { find: jest.Mock };
  let usersService: { findUsersWithPermission: jest.Mock };
  let notificationsService: { notifyUser: jest.Mock };

  const expiringDoc = {
    id: 'd1',
    documentType: 'insurance',
    expiryDate: new Date(),
    vehicle: { plate: 'ABC-123', brand: 'Nissan', model: 'NP300' },
  } as unknown as VehicleDocument;

  beforeEach(async () => {
    repo = { find: jest.fn().mockResolvedValue([expiringDoc]) };
    usersService = { findUsersWithPermission: jest.fn().mockResolvedValue([{ id: 'approver-1' }]) };
    notificationsService = { notifyUser: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleDocumentScheduler,
        { provide: getRepositoryToken(VehicleDocument), useValue: repo },
        { provide: UsersService, useValue: usersService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();
    service = module.get(VehicleDocumentScheduler);
  });

  it('notifica a los aprobadores por cada documento próximo a vencer', async () => {
    await service.checkExpiringDocuments();
    expect(notificationsService.notifyUser).toHaveBeenCalledWith(
      'approver-1',
      'document_expiring',
      expect.any(String),
      expect.stringContaining('ABC-123'),
      '/vehicles',
    );
  });
});
```

- [ ] **Step 7: Ejecutar y verificar que falla**

```bash
npm test -- vehicle-document-scheduler.service.spec.ts
```
Expected: FAIL — módulo no existe.

- [ ] **Step 8: Implementar el scheduler**

Crear `backend/src/modules/vehicle-documents/vehicle-document-scheduler.service.ts`:
```ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

const DAYS_THRESHOLD = 30;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  insurance: 'seguro',
  circulation_card: 'tarjeta de circulación',
  inspection: 'verificación vehicular',
};

@Injectable()
export class VehicleDocumentScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(VehicleDocumentScheduler.name);

  constructor(
    @InjectRepository(VehicleDocument)
    private repo: Repository<VehicleDocument>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async onApplicationBootstrap() {
    await this.checkExpiringDocuments();
  }

  @Cron('0 7 * * *')
  async checkExpiringDocuments(): Promise<void> {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + DAYS_THRESHOLD);

    const expiring = await this.repo.find({
      where: { expiryDate: LessThanOrEqual(soonDate) },
      relations: ['vehicle'],
    });

    if (expiring.length === 0) return;

    const approvers = await this.usersService.findUsersWithPermission('vehicle_documents', 'delete');

    for (const doc of expiring) {
      try {
        const label = doc.vehicle ? `${doc.vehicle.plate} – ${doc.vehicle.brand} ${doc.vehicle.model}` : 'un vehículo';
        const docLabel = DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType;
        for (const approver of approvers) {
          await this.notificationsService.notifyUser(
            approver.id,
            'document_expiring',
            'Documento de vehículo por vencer',
            `El ${docLabel} de ${label} vence pronto (${new Date(doc.expiryDate).toLocaleDateString('es-MX')}).`,
            '/vehicles',
          );
        }
      } catch (err) {
        this.logger.error(`Failed to process expiring document ${doc.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}
```

- [ ] **Step 9: Ejecutar y verificar que pasa**

```bash
npm test -- vehicle-document-scheduler.service.spec.ts
npm test
```
Expected: PASS en ambos.

- [ ] **Step 10: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```
```bash
curl -X POST http://localhost:3001/api/vehicle-documents -H "Authorization: Bearer <token-admin>" -H "Content-Type: application/json" \
  -d '{"vehicleId":"<id-de-un-vehiculo>","documentType":"insurance","expiryDate":"2026-08-01"}'
```
Confirmar `201` y que el registro aparece en `GET /api/vehicle-documents?vehicleId=<id>`.

- [ ] **Step 11: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/database backend/src/modules/vehicle-documents backend/src/app.module.ts backend/src/config/typeorm-data-source.ts
git commit -m "$(cat <<'EOF'
feat: add vehicle documents (insurance/circulation/inspection) with expiry alerts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**Nota de alcance:** este plan no incluye la UI de frontend para subir/listar documentos de vehículo (fuera del roadmap explícito, que solo pide "documentos del vehículo + alertas de vencimiento" a nivel de backend/datos). Si se requiere una pestaña en `VehiclesList.tsx` o en el detalle del vehículo, es un plan de seguimiento — reutilizaría `StorageService.uploadFile` (ya existente) para el archivo físico y este CRUD para los metadatos.

---

### Task 4: Sincronización automática de `vehicle.status` + auto-captura de combustible en el check-out

**Files:**
- Modify: `backend/src/modules/reservations/reservations.service.ts`
- Modify: `backend/src/modules/reservations/reservations.controller.ts`
- Modify: `backend/src/modules/reservations/reservations.module.ts`
- Modify: `backend/src/modules/maintenance/maintenance.service.ts`
- Test: `backend/src/modules/reservations/reservations.service.spec.ts`
- Test: `backend/src/modules/maintenance/maintenance.service.spec.ts`
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx` (modal de check-out del admin, si existe) o `frontend/src/pages/MyRequests/MyRequestsPage.tsx` (modal de check-out del conductor — confirmar cuál de los dos archivos contiene el formulario de check-out antes de editar, buscando `checkoutFuelLevel` o `/check-out` con `grep -rn "check-out" frontend/src/pages`).

**Interfaces:**
- Produces: `ReservationsService.checkOut(id, userId, odometer, fuelPhotoUrl?, conditionPhotoUrls?, fuelLiters?, fuelCost?)` — **cambia la firma**: el parámetro `fuelLevel?: string` se reemplaza por `fuelLiters?: number, fuelCost?: number`. Único caller: `ReservationsController.checkOut`.
- Consumes: `FuelRecordsService.create` (existente, inyectado nuevo en `ReservationsService`).

- [ ] **Step 1: Escribir los tests que fallan en `reservations.service.spec.ts`**

Añadir al `describe` de `checkOut` (crear la sección si no existe en el archivo del Sprint 0):
```ts
  describe('checkOut — sincronización de estado y combustible', () => {
    let fuelRecordsService: { create: jest.Mock };

    beforeEach(() => {
      fuelRecordsService = { create: jest.fn().mockResolvedValue({}) };
      (service as unknown as { fuelRecordsService: typeof fuelRecordsService }).fuelRecordsService = fuelRecordsService;
      repo.findOne = jest.fn().mockResolvedValue({
        id: 'r1',
        userId: 'owner-1',
        vehicleId: 'v1',
        status: 'active',
        checkinOdometer: 1000,
        checkoutOdometer: null,
      });
    });

    it('marca el vehículo como disponible al hacer check-out', async () => {
      await service.checkOut('r1', 'owner-1', 1050);
      expect(vehicleRepo.update).toHaveBeenCalledWith('v1', expect.objectContaining({ status: 'available' }));
    });

    it('crea un FuelRecord cuando se informan litros y costo', async () => {
      await service.checkOut('r1', 'owner-1', 1050, undefined, undefined, 12.5, 350);
      expect(fuelRecordsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleId: 'v1', liters: 12.5, cost: 350, odometer: 1050 }),
      );
    });

    it('no crea FuelRecord si no se informan litros', async () => {
      await service.checkOut('r1', 'owner-1', 1050);
      expect(fuelRecordsService.create).not.toHaveBeenCalled();
    });
  });

  describe('checkIn — sincronización de estado', () => {
    it('marca el vehículo como en uso al hacer check-in', async () => {
      repo.findOne = jest.fn().mockResolvedValue({ id: 'r1', userId: 'owner-1', vehicleId: 'v1', status: 'active', checkinOdometer: null });
      await service.checkIn('r1', 'owner-1', 1000);
      expect(vehicleRepo.update).toHaveBeenCalledWith('v1', expect.objectContaining({ status: 'in_use' }));
    });
  });
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npm test -- reservations.service.spec.ts
```
Expected: FAIL — `checkIn`/`checkOut` no tocan `vehicle.status`, y `checkOut` no acepta `fuelLiters`/`fuelCost` ni conoce `fuelRecordsService`.

- [ ] **Step 3: Sincronizar `vehicle.status` e inyectar `FuelRecordsService`**

En `backend/src/modules/reservations/reservations.service.ts`, añadir el import:
```ts
import { FuelRecordsService } from '../fuel-records/fuel-records.service';
```
y en el constructor:
```ts
    private usersService: UsersService,
    private sanctionsService: SanctionsService,
    private fuelRecordsService: FuelRecordsService,
```

Cambiar `checkIn()` (añadir la última línea antes del `return`):
```ts
    await this.repo.update(id, payload);
    await this.vehicleRepo.update(reservation.vehicleId, { status: 'in_use' });
    return this.findOne(id);
  }
```

Cambiar la firma y el cuerpo de `checkOut()`:
```ts
  async checkOut(
    id: string,
    userId: string,
    odometer: number,
    fuelPhotoUrl?: string,
    conditionPhotoUrls?: string[],
    fuelLiters?: number,
    fuelCost?: number,
  ): Promise<Reservation> {
```
(quitar el antiguo parámetro `fuelLevel?: string`). Al final del método, cambiar:
```ts
    await this.repo.update(id, payload);
    await this.vehicleRepo.update(reservation.vehicleId, { currentOdometer: odometerNum });
    return this.findOne(id);
  }
```
por:
```ts
    await this.repo.update(id, payload);
    await this.vehicleRepo.update(reservation.vehicleId, { currentOdometer: odometerNum, status: 'available' });
    if (fuelLiters != null && fuelLiters > 0) {
      await this.fuelRecordsService.create({
        vehicleId: reservation.vehicleId,
        date: new Date(),
        liters: fuelLiters,
        cost: fuelCost,
        odometer: odometerNum,
      });
    }
    return this.findOne(id);
  }
```
Quitar también la línea `if (fuelLevel != null && fuelLevel.trim() !== '') payload.checkoutFuelLevel = fuelLevel.trim();` (ya no se recibe `fuelLevel`) — la columna `checkoutFuelLevel` de `Reservation` queda en la entidad sin escritura nueva (no se borra en esta tarea, solo deja de alimentarse desde el check-out; el histórico existente se conserva para no perder datos ya capturados).

- [ ] **Step 4: Registrar `FuelRecordsModule` en `ReservationsModule`**

En `backend/src/modules/reservations/reservations.module.ts`, añadir:
```ts
import { FuelRecordsModule } from '../fuel-records/fuel-records.module';
```
```ts
  imports: [
    TypeOrmModule.forFeature([Reservation, Vehicle]),
    NotificationsModule,
    SystemSettingsModule,
    UsersModule,
    SanctionsModule,
    FuelRecordsModule,
  ],
```

- [ ] **Step 5: Actualizar el controller**

En `backend/src/modules/reservations/reservations.controller.ts`, cambiar el `@Body()` de `checkOut`:
```ts
  @Post(':id/check-out')
  @RequirePermission('reservations', 'update')
  checkOut(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { odometer: number; fuelPhotoUrl?: string; conditionPhotoUrls?: string[]; fuelLiters?: number; fuelCost?: number },
  ) {
    return this.reservationsService.checkOut(
      id,
      user.id,
      body.odometer,
      body.fuelPhotoUrl,
      body.conditionPhotoUrls,
      body.fuelLiters,
      body.fuelCost,
    );
  }
```
(reemplaza el `fuelLevel?: string` anterior).

- [ ] **Step 6: Escribir los tests que fallan para sincronizar `vehicle.status` desde mantenimiento**

Añadir a `backend/src/modules/maintenance/maintenance.service.spec.ts` (mismo archivo de la Task 1):
```ts
  describe('sincronización de vehicle.status', () => {
    it('marca el vehículo como "maintenance" al crear un mantenimiento programado', async () => {
      await service.create({ vehicleId: 'v1', status: 'scheduled', scheduledDate: new Date() } as Partial<Maintenance>);
      expect(vehiclesService.update).toHaveBeenCalledWith('v1', { status: 'maintenance' });
    });

    it('devuelve el vehículo a "available" cuando el mantenimiento se completa', async () => {
      await service.update('m1', { status: 'completed' });
      expect(vehiclesService.update).toHaveBeenCalledWith('v1', expect.objectContaining({ status: 'available' }));
    });
  });
```

- [ ] **Step 7: Ejecutar y verificar que fallan**

```bash
npm test -- maintenance.service.spec.ts reservations.service.spec.ts
```
Expected: FAIL en los nuevos casos.

- [ ] **Step 8: Sincronizar `vehicle.status` en `MaintenanceService`**

En `backend/src/modules/maintenance/maintenance.service.ts`, cambiar `create()`:
```ts
  async create(data: Partial<Maintenance>): Promise<Maintenance> {
    const maintenance = this.repo.create(data);
    const saved = await this.repo.save(maintenance);
    if (saved.vehicleId && saved.status === 'scheduled') {
      await this.vehiclesService.update(saved.vehicleId, { status: 'maintenance' } as never);
    }
    return saved;
  }
```
y `scheduleNextService` (Task 1) — extenderlo para también revertir el estado del vehículo al completar:
```ts
  private async scheduleNextService(maintenance: Maintenance): Promise<void> {
    const vehicle = await this.vehiclesService.findOne(maintenance.vehicleId);
    const patch: Record<string, unknown> = { status: 'available' };
    if (vehicle.maintenanceIntervalKm && maintenance.odometerAtService != null) {
      patch.nextServiceOdometer = maintenance.odometerAtService + vehicle.maintenanceIntervalKm;
    }
    if (vehicle.maintenanceIntervalDays) {
      const next = new Date();
      next.setDate(next.getDate() + vehicle.maintenanceIntervalDays);
      patch.nextServiceDate = next;
    }
    await this.vehiclesService.update(maintenance.vehicleId, patch);
  }
```
(el test de la Task 1 "no programa nada si el vehículo no tiene intervalos configurados" seguirá pasando porque ahora sigue llamando a `vehiclesService.update` — pero solo con `{status:'available'}` — revisar y ajustar ese test si su expectativa era `not.toHaveBeenCalled()` en absoluto; cambiar su aserción a `expect(vehiclesService.update).toHaveBeenCalledWith('v1', { status: 'available' })` en vez de `not.toHaveBeenCalled()`, ya que ahora sí se llama, solo que sin campos de programación).

- [ ] **Step 9: Ejecutar y verificar que pasan**

```bash
npm test -- maintenance.service.spec.ts reservations.service.spec.ts
npm test
```
Expected: PASS en toda la suite (ajustando la aserción señalada en el Step 8).

- [ ] **Step 10: Actualizar el frontend del check-out**

Localizar el modal de check-out (`grep -rn "check-out\|checkoutFuelLevel\|fuelLevel" frontend/src/pages/MyRequests/MyRequestsPage.tsx frontend/src/pages/Reservations/ReservationsList.tsx`). En el formulario correspondiente, reemplazar el campo de texto/selector de "nivel de gasolina" por dos campos numéricos:
```tsx
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Litros cargados (opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Costo del combustible (opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="input-field w-full"
                />
              </div>
```
y en la llamada `apiClient.post(.../check-out, {...})`, cambiar `fuelLevel: ...` por `fuelLiters: fuelLiters ? Number(fuelLiters) : undefined, fuelCost: fuelCost ? Number(fuelCost) : undefined`. Añadir los `useState` correspondientes (`const [fuelLiters, setFuelLiters] = useState(''); const [fuelCost, setFuelCost] = useState('');`) junto a los demás estados del formulario de check-out.

- [ ] **Step 11: Rebuild y verificación manual**

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Hacer check-in de una reserva activa propia → confirmar en `/vehicles` que el vehículo pasa a estado "En uso" (`in_use`). Hacer check-out informando litros y costo → confirmar que el vehículo vuelve a "Disponible" y que aparece un nuevo registro en `/fuel-records` para ese vehículo con los litros/costo capturados.

- [ ] **Step 12: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add backend/src/modules/reservations backend/src/modules/maintenance frontend/src/pages
git commit -m "$(cat <<'EOF'
feat: sync vehicle.status through reservation/maintenance lifecycle, auto-create fuel record on check-out

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Pipeline de CI (GitHub Actions)

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `backend/package.json` (bloque `jest.coverageThreshold`)

**Interfaces:** N/A.

- [ ] **Step 1: Medir la cobertura actual del backend**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend
npx jest --coverage
```
Anotar el porcentaje de `Statements`/`Branches`/`Functions`/`Lines` que reporta la tabla final — estos números, tras los Sprints 0-3, ya incluyen los tests de `users.service`, `reservations.service`, `permissions/notifications/storage.controller`, `sanctions.service`, `maintenance.service`, `maintenance-scheduler.service`, `vehicle-documents.service`, `vehicle-document-scheduler.service` y `reports.service`.

- [ ] **Step 2: Añadir un umbral de cobertura conservador**

En `backend/package.json`, dentro del bloque `"jest"` (creado en el Sprint 0, Task 2), añadir `coverageThreshold` usando un umbral **por debajo** del número medido en el Step 1 (para no romper CI de inmediato; ir subiéndolo en el futuro a medida que se añadan más tests):
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
  "testEnvironment": "node",
  "coverageThreshold": {
    "global": {
      "statements": 15,
      "branches": 10,
      "functions": 15,
      "lines": 15
    }
  }
}
```
(sustituir los números por ~5 puntos porcentuales por debajo de lo medido en el Step 1, para dejar margen).

- [ ] **Step 3: Crear el workflow de CI**

Crear `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 4: Verificar localmente que los mismos comandos pasan antes de subir**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/backend && npm ci && npm test -- --coverage && npm run build
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm ci && npm run lint && npm test && npm run build
```
Expected: los 4 comandos terminan en éxito (código de salida 0) antes de subir el workflow — si `npm run build` del frontend falla por errores de TypeScript preexistentes no relacionados con este plan, resolverlos como parte de este step (son bloqueantes para que CI sea útil).

- [ ] **Step 5: Commit y verificar en GitHub**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add .github/workflows/ci.yml backend/package.json
git commit -m "$(cat <<'EOF'
ci: add GitHub Actions pipeline running backend/frontend test+lint+build

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
git push
```
Tras el push, abrir la pestaña "Actions" del repositorio en GitHub y confirmar que ambos jobs (`backend`, `frontend`) terminan en verde.

---

## Self-Review

**Cobertura de la especificación:** ítem 14 (mantenimiento preventivo + cron — Task 1), ítem 15 (km/L + TCO — Task 2), ítem 16 (documentos de vehículo + alertas — Task 3), ítem 17 (sincronización de `vehicle.status` + auto-combustible desde check-out — Task 4), ítem 18 (tests + CI — Task 5, más el trabajo de tests acumulado en Sprints 0-3) están cubiertos.

**Placeholders:** ninguno — cada step muestra código completo; los 2 casos de "revisar antes de aplicar" (firma real de `usePagination` en Sprint 2, ubicación exacta del modal de check-out en Task 4/Step 10 de este plan) son verificaciones explícitas con el comando exacto a correr, no pasos vagos.

**Consistencia de tipos:** `ReservationsService.checkOut` cambia de `(id, userId, odometer, fuelPhotoUrl?, conditionPhotoUrls?, fuelLevel?)` a `(id, userId, odometer, fuelPhotoUrl?, conditionPhotoUrls?, fuelLiters?, fuelCost?)` — el único caller (`ReservationsController.checkOut`) se actualiza en el mismo Task (Step 5). `MaintenanceService` gana una dependencia de `VehiclesService` en la Task 1 y la reutiliza en la Task 4 sin cambiar su firma.

**Dependencia entre tasks de este mismo plan:** la Task 4 modifica `scheduleNextService` (definido en la Task 1) — si se ejecutan como subagentes independientes, la Task 4 debe aplicarse **después** de que la Task 1 esté mergeada, no en paralelo.
