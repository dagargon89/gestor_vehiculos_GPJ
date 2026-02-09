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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../../database/entities/role.entity");
const permission_entity_1 = require("../../database/entities/permission.entity");
let RolesService = class RolesService {
    constructor(roleRepo, permissionRepo) {
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
    }
    async findAll() {
        return this.roleRepo.find({
            relations: ['permissions'],
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const r = await this.roleRepo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!r)
            throw new common_1.NotFoundException('Rol no encontrado');
        return r;
    }
    async create(data) {
        const role = this.roleRepo.create({
            name: data.name,
            description: data.description ?? undefined,
        });
        const saved = (await this.roleRepo.save(role));
        if (data.permissionIds?.length) {
            saved.permissions = await this.permissionRepo.findBy({
                id: (0, typeorm_2.In)(data.permissionIds),
            });
            await this.roleRepo.save(saved);
        }
        return this.findOne(saved.id);
    }
    async update(id, data) {
        const role = await this.findOne(id);
        if (data.name !== undefined)
            role.name = data.name;
        if (data.description !== undefined)
            role.description = data.description;
        if (data.permissionIds !== undefined) {
            role.permissions =
                data.permissionIds.length === 0
                    ? []
                    : await this.permissionRepo.findBy({ id: (0, typeorm_2.In)(data.permissionIds) });
        }
        await this.roleRepo.save(role);
        return this.findOne(id);
    }
    async remove(id) {
        await this.roleRepo.delete(id);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map