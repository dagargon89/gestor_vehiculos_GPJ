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
