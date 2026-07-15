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
});
