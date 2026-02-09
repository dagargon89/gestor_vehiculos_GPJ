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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../../database/entities/notification.entity");
let NotificationsService = class NotificationsService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(userId, read) {
        const qb = this.repo
            .createQueryBuilder('n')
            .leftJoinAndSelect('n.user', 'u')
            .orderBy('n.createdAt', 'DESC');
        if (userId)
            qb.andWhere('n.userId = :userId', { userId });
        if (read !== undefined)
            qb.andWhere('n.read = :read', { read });
        return qb.getMany();
    }
    async findOne(id) {
        const n = await this.repo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!n)
            throw new common_1.NotFoundException('Notificación no encontrada');
        return n;
    }
    async create(data) {
        const notification = this.repo.create(data);
        return this.repo.save(notification);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async markAsRead(id) {
        await this.repo.update(id, { read: true });
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete(id);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map