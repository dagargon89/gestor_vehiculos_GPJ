"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../../database/entities/reservation.entity");
const vehicle_entity_1 = require("../../database/entities/vehicle.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const system_settings_service_1 = require("../system-settings/system-settings.service");
let ReservationsService = class ReservationsService {
    constructor(repo, vehicleRepo, notificationsService, systemSettingsService) {
        this.repo = repo;
        this.vehicleRepo = vehicleRepo;
        this.notificationsService = notificationsService;
        this.systemSettingsService = systemSettingsService;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.vehicleId)
            where.vehicleId = filters.vehicleId;
        if (filters?.userId)
            where.userId = filters.userId;
        const options = {
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
    async findOne(id) {
        const r = await this.repo.findOne({
            where: { id },
            relations: ['vehicle', 'user'],
        });
        if (!r)
            throw new common_1.NotFoundException('Reserva no encontrada');
        return r;
    }
    async create(data) {
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
        ];
        const payload = {};
        for (const key of allowedKeys) {
            const value = data[key];
            if (value !== undefined && value !== null) {
                payload[key] = value;
            }
        }
        if (payload.startDatetime && typeof payload.startDatetime === 'string') {
            payload.startDatetime = new Date(payload.startDatetime);
        }
        if (payload.endDatetime && typeof payload.endDatetime === 'string') {
            payload.endDatetime = new Date(payload.endDatetime);
        }
        let autoApproved = false;
        if (payload.vehicleId && payload.startDatetime && payload.endDatetime) {
            await this.assertNoConflict(payload.vehicleId, payload.startDatetime, payload.endDatetime);
            const autoApproveSetting = await this.systemSettingsService.findByKey('auto_approve_reservations');
            if (autoApproveSetting?.value === 'true') {
                payload.status = 'active';
                autoApproved = true;
            }
        }
        const r = this.repo.create(payload);
        const saved = await this.repo.save(r);
        if (autoApproved) {
            const full = await this.findOne(saved.id);
            const vehicleLabel = full.vehicle
                ? `${full.vehicle.plate} – ${full.vehicle.brand} ${full.vehicle.model}`
                : 'vehículo';
            await this.notificationsService.notifyUser(full.userId, 'reservation_approved', 'Reserva aprobada automáticamente', `Tu solicitud de ${vehicleLabel} ha sido aprobada automáticamente. Ya puedes hacer check-in cuando retires el vehículo.`, '/mis-solicitudes');
        }
        return saved;
    }
    async update(id, data) {
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
        ];
        const payload = {};
        for (const key of allowedKeys) {
            const value = data[key];
            if (value !== undefined && value !== null) {
                payload[key] = value;
            }
        }
        if (payload.startDatetime && typeof payload.startDatetime === 'string') {
            payload.startDatetime = new Date(payload.startDatetime);
        }
        if (payload.endDatetime && typeof payload.endDatetime === 'string') {
            payload.endDatetime = new Date(payload.endDatetime);
        }
        if (Object.keys(payload).length === 0) {
            return previous;
        }
        const newStatus = payload.status ?? previous.status;
        if (newStatus === 'pending' || newStatus === 'active') {
            const newVehicleId = payload.vehicleId ?? previous.vehicleId;
            const newStart = payload.startDatetime ?? previous.startDatetime;
            const newEnd = payload.endDatetime ?? previous.endDatetime;
            await this.assertNoConflict(newVehicleId, newStart, newEnd, id);
        }
        await this.repo.update(id, payload);
        const updated = await this.findOne(id);
        const vehicleLabel = previous.vehicle
            ? `${previous.vehicle.plate} – ${previous.vehicle.brand} ${previous.vehicle.model}`
            : 'vehículo';
        if (newStatus === 'cancelled') {
            await this.notificationsService.notifyUser(previous.userId, 'reservation_cancelled', 'Reserva cancelada', `Tu reserva de ${vehicleLabel} ha sido cancelada.`, '/mis-solicitudes');
        }
        else if (previous.status === 'pending' && newStatus === 'active') {
            await this.notificationsService.notifyUser(previous.userId, 'reservation_approved', 'Reserva aprobada', `Tu solicitud de ${vehicleLabel} ha sido aprobada. Ya puedes hacer check-in cuando retires el vehículo.`, '/mis-solicitudes');
        }
        else {
            await this.notificationsService.notifyUser(previous.userId, 'reservation_updated', 'Reserva modificada', `Tu reserva de ${vehicleLabel} ha sido modificada. Revisa los detalles en Mis solicitudes.`, '/mis-solicitudes');
        }
        return updated;
    }
    async assertNoConflict(vehicleId, start, end, excludeId) {
        let qb = this.repo
            .createQueryBuilder('r')
            .where('r.vehicleId = :vehicleId', { vehicleId })
            .andWhere('r.status IN (:...statuses)', { statuses: ['pending', 'active'] })
            .andWhere('r.startDatetime < :end', { end })
            .andWhere('r.endDatetime > :start', { start });
        if (excludeId) {
            qb = qb.andWhere('r.id != :excludeId', { excludeId });
        }
        const count = await qb.getCount();
        if (count > 0) {
            throw new common_1.BadRequestException('El vehículo ya tiene una reserva en ese horario. Elige otro horario o vehículo.');
        }
    }
    async findOverdue() {
        return this.repo
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.vehicle', 'v')
            .leftJoinAndSelect('r.user', 'u')
            .where('r.endDatetime < :now', { now: new Date() })
            .andWhere('r.status = :status', { status: 'active' })
            .getMany();
    }
    async remove(id) {
        const reservation = await this.findOne(id);
        await this.repo.softDelete(id);
        const vehicleLabel = reservation.vehicle
            ? `${reservation.vehicle.plate} – ${reservation.vehicle.brand} ${reservation.vehicle.model}`
            : 'vehículo';
        await this.notificationsService.notifyUser(reservation.userId, 'reservation_cancelled', 'Reserva cancelada', `Tu reserva de ${vehicleLabel} ha sido cancelada o eliminada.`, '/mis-solicitudes');
    }
    async checkIn(id, userId, odometer, fuelPhotoUrl, conditionPhotoUrls) {
        const reservation = await this.findOne(id);
        if (reservation.userId !== userId) {
            throw new common_1.ForbiddenException('Solo el titular de la reserva puede hacer check-in');
        }
        if (reservation.status !== 'active') {
            throw new common_1.BadRequestException('Solo se puede hacer check-in en una reserva activa');
        }
        if (reservation.checkinOdometer != null) {
            throw new common_1.BadRequestException('Ya registraste el check-in para esta reserva');
        }
        const odometerNum = Number(odometer);
        if (!Number.isInteger(odometerNum) || odometerNum < 0) {
            throw new common_1.BadRequestException('El odómetro debe ser un número entero mayor o igual a 0');
        }
        const payload = { checkinOdometer: odometerNum };
        if (fuelPhotoUrl != null && fuelPhotoUrl !== '')
            payload.checkinFuelPhotoUrl = fuelPhotoUrl;
        if (conditionPhotoUrls != null && conditionPhotoUrls.length > 0) {
            payload.checkinConditionPhotoUrls = JSON.stringify(conditionPhotoUrls);
        }
        await this.repo.update(id, payload);
        return this.findOne(id);
    }
    async checkOut(id, userId, odometer, fuelPhotoUrl, conditionPhotoUrls, fuelLevel) {
        const reservation = await this.findOne(id);
        if (reservation.userId !== userId) {
            throw new common_1.ForbiddenException('Solo el titular de la reserva puede hacer check-out');
        }
        if (reservation.checkinOdometer == null) {
            throw new common_1.BadRequestException('Debes hacer check-in antes del check-out');
        }
        if (reservation.checkoutOdometer != null) {
            throw new common_1.BadRequestException('Ya registraste el check-out para esta reserva');
        }
        const odometerNum = Number(odometer);
        if (!Number.isInteger(odometerNum) || odometerNum < 0) {
            throw new common_1.BadRequestException('El odómetro debe ser un número entero mayor o igual a 0');
        }
        if (odometerNum < reservation.checkinOdometer) {
            throw new common_1.BadRequestException('El odómetro de devolución no puede ser menor que el de salida');
        }
        const payload = {
            checkoutOdometer: odometerNum,
            status: 'completed',
        };
        if (fuelPhotoUrl != null && fuelPhotoUrl !== '')
            payload.checkoutFuelPhotoUrl = fuelPhotoUrl;
        if (fuelLevel != null && fuelLevel.trim() !== '')
            payload.checkoutFuelLevel = fuelLevel.trim();
        if (conditionPhotoUrls != null && conditionPhotoUrls.length > 0) {
            payload.checkoutConditionPhotoUrls = JSON.stringify(conditionPhotoUrls);
        }
        await this.repo.update(id, payload);
        await this.vehicleRepo.update(reservation.vehicleId, { currentOdometer: odometerNum });
        return this.findOne(id);
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(vehicle_entity_1.Vehicle)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        system_settings_service_1.SystemSettingsService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map