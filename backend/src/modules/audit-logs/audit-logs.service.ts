import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async findAll(filters?: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<AuditLog[]> {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC');
    if (filters?.userId) qb.andWhere('a.userId = :userId', { userId: filters.userId });
    if (filters?.resource) qb.andWhere('a.resource = :resource', { resource: filters.resource });
    if (filters?.resourceId) qb.andWhere('a.resourceId = :resourceId', { resourceId: filters.resourceId });
    if (filters?.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters?.from) qb.andWhere('a.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('a.createdAt <= :to', { to: filters.to });
    return qb.getMany();
  }

  async findOne(id: string): Promise<AuditLog> {
    const log = await this.repo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Registro de auditoría no encontrado');
    return log;
  }
}
