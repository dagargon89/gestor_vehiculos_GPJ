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
