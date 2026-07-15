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

  it('permite actualizar photoUrl (subida de foto de perfil vía /storage/upload + /auth/sync-user)', async () => {
    await service.updateOwnProfile('u1', {
      photoUrl: 'https://storage.example.com/profile/u1.jpg',
    } as Partial<User>);
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      photoUrl: 'https://storage.example.com/profile/u1.jpg',
    });
  });

  it('descarta roleId y status pero conserva photoUrl cuando llegan juntos en el body', async () => {
    await service.updateOwnProfile('u1', {
      photoUrl: 'https://storage.example.com/profile/u1.jpg',
      roleId: 'admin-role-id',
      status: 'active',
    } as Partial<User>);
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      photoUrl: 'https://storage.example.com/profile/u1.jpg',
    });
  });

  it('no llama a update cuando el payload está vacío (solo campos no permitidos)', async () => {
    const result = await service.updateOwnProfile('u1', {
      roleId: 'admin-role-id',
      status: 'active',
    } as Partial<User>);
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(userRepo.findOne).toHaveBeenCalled();
    expect(result).toEqual({ id: 'u1', displayName: 'Nuevo nombre' });
  });
});

describe('UsersService.findUsersWithPermission', () => {
  let service: UsersService;
  let userRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'approver-1' }]),
    };
    userRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('devuelve los usuarios activos con el permiso dado', async () => {
    const result = await service.findUsersWithPermission('reservations', 'delete');
    expect(result).toEqual([{ id: 'approver-1' }]);
    const qb = userRepo.createQueryBuilder.mock.results[0].value;
    expect(qb.where).toHaveBeenCalledWith('permission.resource = :resource', { resource: 'reservations' });
    expect(qb.andWhere).toHaveBeenCalledWith('permission.action = :action', { action: 'delete' });
  });
});
