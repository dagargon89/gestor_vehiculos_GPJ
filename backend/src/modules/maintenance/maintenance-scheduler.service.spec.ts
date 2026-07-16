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
