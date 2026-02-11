import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private repo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(filters?: {
    status?: string;
    vehicleId?: string;
    userId?: string;
    start?: string;
    end?: string;
  }): Promise<Reservation[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.userId) where.userId = filters.userId;

    const options: FindManyOptions<Reservation> = {
      relations: ['vehicle', 'user'],
      order: { startDatetime: 'DESC' },
    };
    if (Object.keys(where).length > 0) {
      options.where = where;
    }
    let list = await this.repo.find(options);

    if (filters?.start) {
      const start = new Date(filters.start);
      list = list.filter((r) => r.endDatetime > start);
    }
    if (filters?.end) {
      const end = new Date(filters.end);
      list = list.filter((r) => r.startDatetime < end);
    }
    return list;
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
    const r = this.repo.create(payload as Partial<Reservation>);
    return this.repo.save(r);
  }

  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const previous = await this.findOne(id);
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
      'checkinFuelPhotoUrl',
      'checkinConditionPhotoUrls',
      'checkoutOdometer',
      'checkoutFuelPhotoUrl',
      'checkoutConditionPhotoUrls',
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
      return previous;
    }
    await this.repo.update(id, payload);
    const updated = await this.findOne(id);

    const vehicleLabel = previous.vehicle
      ? `${previous.vehicle.plate} – ${previous.vehicle.brand} ${previous.vehicle.model}`
      : 'vehículo';
    const newStatus = (payload.status as string) ?? previous.status;

    if (newStatus === 'cancelled') {
      await this.notificationsService.notifyUser(
        previous.userId,
        'reservation_cancelled',
        'Reserva cancelada',
        `Tu reserva de ${vehicleLabel} ha sido cancelada.`,
        '/mis-solicitudes',
      );
    } else if (previous.status === 'pending' && newStatus === 'active') {
      await this.notificationsService.notifyUser(
        previous.userId,
        'reservation_approved',
        'Reserva aprobada',
        `Tu solicitud de ${vehicleLabel} ha sido aprobada. Ya puedes hacer check-in cuando retires el vehículo.`,
        '/mis-solicitudes',
      );
    } else {
      await this.notificationsService.notifyUser(
        previous.userId,
        'reservation_updated',
        'Reserva modificada',
        `Tu reserva de ${vehicleLabel} ha sido modificada. Revisa los detalles en Mis solicitudes.`,
        '/mis-solicitudes',
      );
    }

    return updated;
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
    const reservation = await this.findOne(id);
    await this.repo.softDelete(id);
    const vehicleLabel = reservation.vehicle
      ? `${reservation.vehicle.plate} – ${reservation.vehicle.brand} ${reservation.vehicle.model}`
      : 'vehículo';
    await this.notificationsService.notifyUser(
      reservation.userId,
      'reservation_cancelled',
      'Reserva cancelada',
      `Tu reserva de ${vehicleLabel} ha sido cancelada o eliminada.`,
      '/mis-solicitudes',
    );
  }

  async checkIn(
    id: string,
    userId: string,
    odometer: number,
    fuelPhotoUrl?: string,
    conditionPhotoUrls?: string[],
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.userId !== userId) {
      throw new ForbiddenException('Solo el titular de la reserva puede hacer check-in');
    }
    if (reservation.status !== 'active') {
      throw new BadRequestException('Solo se puede hacer check-in en una reserva activa');
    }
    if (reservation.checkinOdometer != null) {
      throw new BadRequestException('Ya registraste el check-in para esta reserva');
    }
    const odometerNum = Number(odometer);
    if (!Number.isInteger(odometerNum) || odometerNum < 0) {
      throw new BadRequestException('El odómetro debe ser un número entero mayor o igual a 0');
    }
    const payload: Record<string, unknown> = { checkinOdometer: odometerNum };
    if (fuelPhotoUrl != null && fuelPhotoUrl !== '') payload.checkinFuelPhotoUrl = fuelPhotoUrl;
    if (conditionPhotoUrls != null && conditionPhotoUrls.length > 0) {
      payload.checkinConditionPhotoUrls = JSON.stringify(conditionPhotoUrls);
    }
    await this.repo.update(id, payload);
    return this.findOne(id);
  }

  async checkOut(
    id: string,
    userId: string,
    odometer: number,
    fuelPhotoUrl?: string,
    conditionPhotoUrls?: string[],
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.userId !== userId) {
      throw new ForbiddenException('Solo el titular de la reserva puede hacer check-out');
    }
    if (reservation.checkinOdometer == null) {
      throw new BadRequestException('Debes hacer check-in antes del check-out');
    }
    if (reservation.checkoutOdometer != null) {
      throw new BadRequestException('Ya registraste el check-out para esta reserva');
    }
    const odometerNum = Number(odometer);
    if (!Number.isInteger(odometerNum) || odometerNum < 0) {
      throw new BadRequestException('El odómetro debe ser un número entero mayor o igual a 0');
    }
    if (odometerNum < reservation.checkinOdometer) {
      throw new BadRequestException('El odómetro de devolución no puede ser menor que el de salida');
    }
    const payload: Record<string, unknown> = {
      checkoutOdometer: odometerNum,
      status: 'completed',
    };
    if (fuelPhotoUrl != null && fuelPhotoUrl !== '') payload.checkoutFuelPhotoUrl = fuelPhotoUrl;
    if (conditionPhotoUrls != null && conditionPhotoUrls.length > 0) {
      payload.checkoutConditionPhotoUrls = JSON.stringify(conditionPhotoUrls);
    }
    await this.repo.update(id, payload);
    await this.vehicleRepo.update(reservation.vehicleId, { currentOdometer: odometerNum });
    return this.findOne(id);
  }
}
