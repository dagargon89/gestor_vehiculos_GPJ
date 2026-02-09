import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const r = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!r) throw new NotFoundException('Rol no encontrado');
    return r;
  }

  async create(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<Role> {
    const role = this.roleRepo.create({
      name: data.name,
      description: data.description ?? undefined,
    });
    const saved = (await this.roleRepo.save(role)) as Role;
    if (data.permissionIds?.length) {
      saved.permissions = await this.permissionRepo.findBy({
        id: In(data.permissionIds),
      });
      await this.roleRepo.save(saved);
    }
    return this.findOne(saved.id);
  }

  async update(
    id: string,
    data: Partial<{ name: string; description: string; permissionIds: string[] }>,
  ): Promise<Role> {
    const role = await this.findOne(id);
    if (data.name !== undefined) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    if (data.permissionIds !== undefined) {
      role.permissions =
        data.permissionIds.length === 0
          ? []
          : await this.permissionRepo.findBy({ id: In(data.permissionIds) });
    }
    await this.roleRepo.save(role);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.roleRepo.delete(id);
  }
}
