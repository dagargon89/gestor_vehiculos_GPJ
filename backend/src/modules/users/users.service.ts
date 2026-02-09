import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';

export interface CreateFromFirebaseDto {
  firebaseUid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid }, relations: ['role'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['role'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findOneWithPermissions(id: string): Promise<User & { permissions?: { resource: string; action: string }[] }> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const permissions =
      user.role?.permissions?.map((p) => ({ resource: p.resource, action: p.action })) || [];
    return { ...user, permissions };
  }

  async createFromFirebase(dto: CreateFromFirebaseDto): Promise<User> {
    const user = this.userRepo.create({
      firebaseUid: dto.firebaseUid,
      email: dto.email,
      displayName: dto.displayName ?? null,
      photoUrl: dto.photoURL ?? null,
      status: 'active',
    } as Partial<User>);
    return this.userRepo.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepo.update(id, { lastLoginAt: new Date() });
  }

  async updateUserData(id: string, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data as Partial<User>);
    return this.findOne(id);
  }
}
