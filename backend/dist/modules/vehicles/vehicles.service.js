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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vehicle_entity_1 = require("../../database/entities/vehicle.entity");
const reservation_entity_1 = require("../../database/entities/reservation.entity");
let VehiclesService = class VehiclesService {
    constructor(vehicleRepo, reservationRepo) {
        this.vehicleRepo = vehicleRepo;
        this.reservationRepo = reservationRepo;
    }
    async findAll(status) {
        const vehicles = await this.vehicleRepo.find({
            where: status ? { status } : {},
            order: { plate: 'ASC' },
        });
        if (vehicles.length === 0)
            return [];
        const vehicleIds = vehicles.map((v) => v.id);
        const allCompleted = await this.reservationRepo
            .createQueryBuilder('r')
            .where('r.status = :status', { status: 'completed' })
            .andWhere('r.vehicleId IN (:...ids)', { ids: vehicleIds })
            .leftJoinAndSelect('r.user', 'user')
            .orderBy('r.endDatetime', 'DESC')
            .getMany();
        const byVehicle = new Map();
        for (const r of allCompleted) {
            if (!byVehicle.has(r.vehicleId)) {
                const user = r.user;
                byVehicle.set(r.vehicleId, {
                    lastFuelLevel: r.checkoutFuelLevel ?? null,
                    lastUsedByUser: user ? (user.displayName || user.email) || null : null,
                });
            }
        }
        return vehicles.map((v) => {
            const extra = byVehicle.get(v.id);
            return {
                ...v,
                lastFuelLevel: extra?.lastFuelLevel ?? null,
                lastUsedByUser: extra?.lastUsedByUser ?? null,
            };
        });
    }
    async findOne(id) {
        const v = await this.vehicleRepo.findOne({ where: { id } });
        if (!v)
            throw new common_1.NotFoundException('Vehículo no encontrado');
        const last = await this.reservationRepo.findOne({
            where: { vehicleId: id, status: 'completed' },
            relations: ['user'],
            order: { endDatetime: 'DESC' },
        });
        const user = last?.user;
        return {
            ...v,
            lastFuelLevel: last?.checkoutFuelLevel ?? null,
            lastUsedByUser: user ? (user.displayName || user.email) || null : null,
        };
    }
    async create(data) {
        const vehicle = this.vehicleRepo.create(data);
        return this.vehicleRepo.save(vehicle);
    }
    async update(id, data) {
        await this.vehicleRepo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.vehicleRepo.softDelete(id);
    }
    async addPhoto(id, photoUrl) {
        const v = await this.findOne(id);
        const urls = v.photoUrls ? `${v.photoUrls},${photoUrl}` : photoUrl;
        return this.update(id, { photoUrls: urls });
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vehicle_entity_1.Vehicle)),
    __param(1, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map