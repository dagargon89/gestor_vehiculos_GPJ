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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
const role_entity_1 = require("../../database/entities/role.entity");
let UsersService = class UsersService {
    constructor(userRepo, roleRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }
    async findByFirebaseUid(firebaseUid) {
        return this.userRepo.findOne({ where: { firebaseUid }, relations: ['role'] });
    }
    async findOne(id) {
        const user = await this.userRepo.findOne({ where: { id }, relations: ['role'] });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
    async findOneWithPermissions(id) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['role', 'role.permissions'],
        });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const permissions = user.role?.permissions?.map((p) => ({ resource: p.resource, action: p.action })) || [];
        return { ...user, permissions };
    }
    async createFromFirebase(dto) {
        const user = this.userRepo.create({
            firebaseUid: dto.firebaseUid,
            email: dto.email,
            displayName: dto.displayName ?? null,
            photoUrl: dto.photoURL ?? null,
            status: 'active',
        });
        return this.userRepo.save(user);
    }
    async updateLastLogin(id) {
        await this.userRepo.update(id, { lastLoginAt: new Date() });
    }
    async updateUserData(id, data) {
        await this.userRepo.update(id, data);
        return this.findOne(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map