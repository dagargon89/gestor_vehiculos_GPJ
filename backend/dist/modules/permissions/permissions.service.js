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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_entity_1 = require("../../database/entities/permission.entity");
let PermissionsService = class PermissionsService {
    constructor(permissionRepo) {
        this.permissionRepo = permissionRepo;
    }
    async findAll() {
        return this.permissionRepo.find({
            order: { resource: 'ASC', action: 'ASC' },
        });
    }
    async findOne(id) {
        const p = await this.permissionRepo.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Permiso no encontrado');
        return p;
    }
    async create(data) {
        const permission = this.permissionRepo.create(data);
        return this.permissionRepo.save(permission);
    }
    async update(id, data) {
        await this.permissionRepo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.permissionRepo.delete(id);
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map