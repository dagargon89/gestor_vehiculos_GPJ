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
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const incident_entity_1 = require("../../database/entities/incident.entity");
const users_service_1 = require("../users/users.service");
let IncidentsService = class IncidentsService {
    constructor(repo, usersService) {
        this.repo = repo;
        this.usersService = usersService;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.vehicleId)
            where.vehicleId = filters.vehicleId;
        if (filters?.userId)
            where.userId = filters.userId;
        if (filters?.status)
            where.status = filters.status;
        const list = await this.repo.find({
            where: Object.keys(where).length > 0 ? where : undefined,
            relations: ['vehicle', 'user'],
            order: { date: 'DESC' },
        });
        for (const i of list) {
            if (i.userId?.trim() && !i.user) {
                try {
                    i.user = await this.usersService.findOne(i.userId);
                }
                catch {
                    i.user = null;
                }
            }
        }
        return list;
    }
    async findOne(id) {
        const i = await this.repo.findOne({
            where: { id },
            relations: ['vehicle', 'user'],
        });
        if (!i)
            throw new common_1.NotFoundException('Incidente no encontrado');
        return i;
    }
    async create(data) {
        const incident = this.repo.create(data);
        return this.repo.save(incident);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.softDelete(id);
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(incident_entity_1.Incident)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map