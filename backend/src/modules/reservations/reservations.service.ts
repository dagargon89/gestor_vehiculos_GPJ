import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private repo: Repository<Reservation>,
  ) {}

  async findAll(filters?: {
    status?: string;
    vehicleId?: string;
    userId?: string;
    start?: string;
    end?: string;
  }): Promise<Reservation[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.vehicle', 'v')
      .leftJoinAndSelect('r.user', 'u')
      .orderBy('r.startDatetime', 'DESC');
    if (filters?.status) qb.andWhere('r.status = :status', { status: filters.status });
    if (filters?.vehicleId) qb.andWhere('r.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters?.userId) qb.andWhere('r.userId = :userId', { userId: filters.userId });
    if (filters?.start) {
      qb.andWhere('r.endDatetime > :start', { start: filters.start });
    }
    if (filters?.end) {
      qb.andWhere('r.startDatetime < :end', { end: filters.end });
    }
    return qb.getMany();
  }

  async findOne(id: string): Promise<Reservation> {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['vehicle', 'user'],
    });
    if (!r) throw new NotFoundException('Reserva no encontrada');
    return r;
  }

  async create(data: Partial<Reservation>): Promise<Reservation> {
    const r = this.repo.create(data);
    return this.repo.save(r);
  }

  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const allowedKeys = [
      'vehicleId',
      'userId',
      'startDatetime',
      'endDatetime',
      'status',
      'eventName',
      'description',
      'destination',
      'checkinOdometer',
      'checkoutOdometer',
    ] as const;
    const payload: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      const value = data[key];
      if (value !== undefined && value !== null) {
        payload[key] = value;
      }
    }
    if (payload.startDatetime && typeof payload.startDatetime === 'string') {
      payload.startDatetime = new Date(payload.startDatetime as string);
    }
    if (payload.endDatetime && typeof payload.endDatetime === 'string') {
      payload.endDatetime = new Date(payload.endDatetime as string);
    }
    if (Object.keys(payload).length === 0) {
      return this.findOne(id);
    }
    await this.repo.update(id, payload);
    return this.findOne(id);
  }

  async findOverdue(): Promise<Reservation[]> {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.vehicle', 'v')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.endDatetime < :now', { now: new Date() })
      .andWhere('r.status = :status', { status: 'active' })
      .getMany();
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
