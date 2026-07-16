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
