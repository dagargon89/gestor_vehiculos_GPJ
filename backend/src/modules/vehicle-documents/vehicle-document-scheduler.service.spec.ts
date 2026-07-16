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
