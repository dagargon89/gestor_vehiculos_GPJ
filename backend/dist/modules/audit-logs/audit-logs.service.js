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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
let AuditLogsService = class AuditLogsService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(filters) {
        const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC');
        if (filters?.userId)
            qb.andWhere('a.userId = :userId', { userId: filters.userId });
        if (filters?.resource)
            qb.andWhere('a.resource = :resource', { resource: filters.resource });
        if (filters?.resourceId)
            qb.andWhere('a.resourceId = :resourceId', { resourceId: filters.resourceId });
        if (filters?.action)
            qb.andWhere('a.action = :action', { action: filters.action });
        if (filters?.from)
            qb.andWhere('a.createdAt >= :from', { from: filters.from });
        if (filters?.to)
            qb.andWhere('a.createdAt <= :to', { to: filters.to });
        return qb.getMany();
    }
    async findOne(id) {
        const log = await this.repo.findOne({ where: { id } });
        if (!log)
            throw new common_1.NotFoundException('Registro de auditoría no encontrado');
        return log;
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map