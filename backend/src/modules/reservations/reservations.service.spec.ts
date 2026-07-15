import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from '../../database/entities/reservation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { UsersService } from '../users/users.service';
import { SanctionsService } from '../sanctions/sanctions.service';

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
  let notificationsService: { notifyUser: jest.Mock };
  let usersService: { findUsersWithPermission: jest.Mock; findOne: jest.Mock };

  const pendingReservation = {
    id: 'r1',
    userId: 'owner-1',
    status: 'pending',
    vehicle: { plate: 'ABC-123', brand: 'Nissan', model: 'NP300' },
  } as unknown as Reservation;

  beforeEach(async () => {
    // `update()` runs assertNoConflict() (via repo.createQueryBuilder) whenever the
    // resulting status is 'pending'/'active' — which is true for every case here
    // (owner edits keep status 'pending'; the admin case sets it to 'active'). The
    // brief's `createQueryBuilder: jest.fn()` returns undefined, so `.where(...)`
    // on it throws. Made it a chainable stub resolving to "no conflicts" (getCount
    // 0) so the ownership/status behavior under test isn't masked by this.
    const queryBuilderStub: Record<string, jest.Mock> = {};
    queryBuilderStub.where = jest.fn().mockReturnValue(queryBuilderStub);
    queryBuilderStub.andWhere = jest.fn().mockReturnValue(queryBuilderStub);
    queryBuilderStub.getCount = jest.fn().mockResolvedValue(0);
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(pendingReservation),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderStub),
    };
    vehicleRepo = { update: jest.fn().mockResolvedValue(undefined) };
    dataSource = { transaction: jest.fn(async (cb) => cb({ query: jest.fn(), getRepository: () => repo })) };
    notificationsService = { notifyUser: jest.fn() };
    usersService = {
      findUsersWithPermission: jest.fn().mockResolvedValue([{ id: 'approver-1' }, { id: 'approver-2' }]),
      // Consumed by the sanction/license check at the top of create() — defaults to a
      // driver with no license-expiry data (never blocks) so pre-existing tests that
      // don't care about this validation keep working unmodified.
      findOne: jest.fn().mockResolvedValue({ id: 'driver-1', licenseExpiry: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: repo },
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: SystemSettingsService, useValue: { findByKey: jest.fn().mockResolvedValue(null) } },
        { provide: UsersService, useValue: usersService },
        // SanctionsService is mocked here even though ReservationsService.create()
        // doesn't consume it yet — a later step in this sprint's plan wires it in,
        // and adding the provider now keeps this shared beforeEach forward-compatible.
        { provide: SanctionsService, useValue: { isUserSanctioned: jest.fn().mockResolvedValue(false) } },
        // ReservationsService injects the real `DataSource` class from typeorm (no
        // custom token), so the provider token here must be that class itself —
        // the brief's `.overrideProvider(require('typeorm').DataSource)` pattern
        // has nothing to override since no provider was registered under that
        // token, so DI still fails. Registering it directly avoids that.
        { provide: require('typeorm').DataSource, useValue: dataSource },
      ],
    }).compile();
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
  });

  describe('create — sanciones y licencia', () => {
    it('rechaza la reserva si el usuario tiene una sanción vigente', async () => {
      (usersService as unknown as { findOne: jest.Mock }).findOne = jest
        .fn()
        .mockResolvedValue({ id: 'driver-1', licenseExpiry: null });
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
