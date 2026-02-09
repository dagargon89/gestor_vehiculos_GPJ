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
let VehiclesService = class VehiclesService {
    constructor(vehicleRepo) {
        this.vehicleRepo = vehicleRepo;
    }
    async findAll(status) {
        return this.vehicleRepo.find({
            where: status ? { status } : {},
            order: { plate: 'ASC' },
        });
    }
    async findOne(id) {
        const v = await this.vehicleRepo.findOne({ where: { id } });
        if (!v)
            throw new common_1.NotFoundException('Vehículo no encontrado');
        return v;
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
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map