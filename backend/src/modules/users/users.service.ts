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

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['role'],
      order: { email: 'ASC' },
    });
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

    let role: Role | null = user.role ?? null;
    let roleIdToLoad = user.roleId?.trim() || null;

    if (!role && !roleIdToLoad) {
      try {
        const raw = await this.userRepo.query(
          'SELECT role_id FROM users WHERE id = $1 LIMIT 1',
          [id],
        ) as { role_id?: string | null }[];
        roleIdToLoad = raw?.[0]?.role_id?.trim() || null;
      } catch {
        roleIdToLoad = null;
      }
      if (!roleIdToLoad) {
        try {
          const rawAlt = await this.userRepo.query(
            'SELECT roleid FROM users WHERE id = $1 LIMIT 1',
            [id],
          ) as { roleid?: string | null }[];
          roleIdToLoad = rawAlt?.[0]?.roleid?.trim() || null;
        } catch {
          roleIdToLoad = null;
        }
      }
    }

    if (!role && roleIdToLoad) {
      const loadedRole = await this.roleRepo.findOne({
        where: { id: roleIdToLoad },
        relations: ['permissions'],
      });
      if (loadedRole) {
        role = loadedRole;
        (user as { role?: Role }).role = loadedRole;
      }
    }

    const permissions =
      (role?.permissions ?? []).map((p) => ({ resource: p.resource, action: p.action }));
    return { ...user, permissions };
  }

  async createFromFirebase(dto: CreateFromFirebaseDto): Promise<User> {
    const rawEmail = typeof dto.email === 'string' ? dto.email.trim() : '';
    const emailForDb = rawEmail || `firebase_${dto.firebaseUid}@local`;
    const user = this.userRepo.create({
      firebaseUid: dto.firebaseUid,
      email: emailForDb,
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

  /** Campos permitidos al actualizar por API (evita sobrescribir firebaseUid, email, etc.) */
  private static readonly UPDATE_ALLOWED_KEYS: (keyof User)[] = [
    'displayName',
    'department',
    'status',
    'roleId',
    'employeeId',
    'phone',
    'licenseNumber',
    'licenseType',
    'licenseExpiry',
    'licenseRestrictions',
    'emergencyContactName',
    'emergencyContactPhone',
    'emergencyContactRelationship',
    'emailNotifications',
    'autoApprovalEnabled',
  ];

  async update(id: string, data: Partial<User>): Promise<User> {
    const payload: Record<string, unknown> = {};
    for (const key of UsersService.UPDATE_ALLOWED_KEYS) {
      if (key in data) {
        const value = (data as Record<string, unknown>)[key];
        payload[key] = value;
      }
    }
    if (payload.roleId === '') payload.roleId = null;
    await this.userRepo.update(id, payload as Partial<User>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepo.softDelete(id);
  }
}
