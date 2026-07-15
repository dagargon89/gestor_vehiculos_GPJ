import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SanctionsService } from './sanctions.service';
import { Sanction } from '../../database/entities/sanction.entity';
import { UsersService } from '../users/users.service';

describe('SanctionsService.isUserSanctioned', () => {
  let service: SanctionsService;
  let repo: { createQueryBuilder: jest.Mock };
  let queryBuilderStub: Record<string, jest.Mock>;

  beforeEach(async () => {
    // Build a chainable query builder stub that captures all mock calls
    queryBuilderStub = {};
    queryBuilderStub.where = jest.fn().mockReturnValue(queryBuilderStub);
    queryBuilderStub.andWhere = jest.fn().mockReturnValue(queryBuilderStub);
    queryBuilderStub.getCount = jest.fn().mockResolvedValue(0);

    repo = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilderStub) };
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
    queryBuilderStub.getCount.mockResolvedValue(1);
    const userId = 'user-1';
    const atDate = new Date('2024-01-15');

    await expect(service.isUserSanctioned(userId, atDate)).resolves.toBe(true);

    // Assert query builder was called with alias 's'
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('s');

    // Assert the where clause for userId
    expect(queryBuilderStub.where).toHaveBeenCalledWith('s.userId = :userId', { userId });

    // Assert the andWhere clauses for effectiveDate and endDate logic
    expect(queryBuilderStub.andWhere).toHaveBeenCalledWith('s.effectiveDate <= :atDate', { atDate });
    expect(queryBuilderStub.andWhere).toHaveBeenCalledWith('(s.endDate IS NULL OR s.endDate >= :atDate)', { atDate });

    expect(queryBuilderStub.getCount).toHaveBeenCalled();
  });

  it('devuelve false si no hay sanciones vigentes', async () => {
    queryBuilderStub.getCount.mockResolvedValue(0);
    const userId = 'user-2';
    const atDate = new Date('2024-01-15');

    await expect(service.isUserSanctioned(userId, atDate)).resolves.toBe(false);

    // Assert query builder was called with alias 's'
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('s');

    // Assert the where clause for userId
    expect(queryBuilderStub.where).toHaveBeenCalledWith('s.userId = :userId', { userId });

    // Assert the andWhere clauses for effectiveDate and endDate logic
    expect(queryBuilderStub.andWhere).toHaveBeenCalledWith('s.effectiveDate <= :atDate', { atDate });
    expect(queryBuilderStub.andWhere).toHaveBeenCalledWith('(s.endDate IS NULL OR s.endDate >= :atDate)', { atDate });

    expect(queryBuilderStub.getCount).toHaveBeenCalled();
  });
});
