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
exports.CostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cost_entity_1 = require("../../database/entities/cost.entity");
let CostsService = class CostsService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(filters) {
        const qb = this.repo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.vehicle', 'v')
            .orderBy('c.date', 'DESC');
        if (filters?.vehicleId)
            qb.andWhere('c.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
        if (filters?.category)
            qb.andWhere('c.category = :category', { category: filters.category });
        return qb.getMany();
    }
    async findOne(id) {
        const c = await this.repo.findOne({
            where: { id },
            relations: ['vehicle'],
        });
        if (!c)
            throw new common_1.NotFoundException('Costo no encontrado');
        return c;
    }
    async create(data) {
        const cost = this.repo.create(data);
        return this.repo.save(cost);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.softDelete(id);
    }
};
exports.CostsService = CostsService;
exports.CostsService = CostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cost_entity_1.Cost)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CostsService);
//# sourceMappingURL=costs.service.js.map