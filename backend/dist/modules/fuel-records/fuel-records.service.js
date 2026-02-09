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
exports.FuelRecordsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fuel_record_entity_1 = require("../../database/entities/fuel-record.entity");
let FuelRecordsService = class FuelRecordsService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(vehicleId) {
        const qb = this.repo
            .createQueryBuilder('f')
            .leftJoinAndSelect('f.vehicle', 'v')
            .orderBy('f.date', 'DESC');
        if (vehicleId)
            qb.andWhere('f.vehicleId = :vehicleId', { vehicleId });
        return qb.getMany();
    }
    async findOne(id) {
        const f = await this.repo.findOne({
            where: { id },
            relations: ['vehicle'],
        });
        if (!f)
            throw new common_1.NotFoundException('Registro de combustible no encontrado');
        return f;
    }
    async create(data) {
        const record = this.repo.create(data);
        return this.repo.save(record);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.softDelete(id);
    }
};
exports.FuelRecordsService = FuelRecordsService;
exports.FuelRecordsService = FuelRecordsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fuel_record_entity_1.FuelRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FuelRecordsService);
//# sourceMappingURL=fuel-records.service.js.map