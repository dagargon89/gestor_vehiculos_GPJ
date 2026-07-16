import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

describe('MaintenanceService.update — programación del siguiente servicio', () => {
  let service: MaintenanceService;
  let repo: { create: jest.Mock; save: jest.Mock; update: jest.Mock; findOne: jest.Mock };
  let vehiclesService: { findOne: jest.Mock; update: jest.Mock };

  const completedMaintenance = {
    id: 'm1',
    vehicleId: 'v1',
    status: 'completed',
    odometerAtService: 50000,
  } as unknown as Maintenance;

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
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
    // scheduleNextService now always reverts vehicle.status to 'available' on
    // completion, so vehiclesService.update IS called — but only with that status
    // field, never with fabricated nextServiceOdometer/nextServiceDate.
    vehiclesService.findOne.mockResolvedValue({ id: 'v1' });
    await service.update('m1', { status: 'completed' });
    expect(vehiclesService.update).toHaveBeenCalledWith('v1', { status: 'available' });
  });

  it('no toca el vehículo si el mantenimiento no queda en "completed"', async () => {
    await service.update('m1', { description: 'nota' });
    expect(vehiclesService.update).not.toHaveBeenCalled();
  });

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
});
