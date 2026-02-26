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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
const role_entity_1 = require("../../database/entities/role.entity");
let UsersService = UsersService_1 = class UsersService {
    constructor(userRepo, roleRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }
    async findByFirebaseUid(firebaseUid) {
        return this.userRepo.findOne({ where: { firebaseUid }, relations: ['role'] });
    }
    async findAll() {
        return this.userRepo.find({
            relations: ['role'],
            order: { email: 'ASC' },
        });
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
        let role = user.role ?? null;
        let roleIdToLoad = user.roleId?.trim() || null;
        if (!role && !roleIdToLoad) {
            try {
                const raw = await this.userRepo.query('SELECT role_id FROM users WHERE id = $1 LIMIT 1', [id]);
                roleIdToLoad = raw?.[0]?.role_id?.trim() || null;
            }
            catch {
                roleIdToLoad = null;
            }
            if (!roleIdToLoad) {
                try {
                    const rawAlt = await this.userRepo.query('SELECT roleid FROM users WHERE id = $1 LIMIT 1', [id]);
                    roleIdToLoad = rawAlt?.[0]?.roleid?.trim() || null;
                }
                catch {
                    roleIdToLoad = null;
                }
            }
        }
        if (!role && roleIdToLoad) {
            const loadedRole = await this.roleRepo.findOne({
                where: { id: roleIdToLoad },
                relations: ['permissions'],
            });
            if (loadedRole) {
                role = loadedRole;
                user.role = loadedRole;
            }
        }
        const permissions = (role?.permissions ?? []).map((p) => ({ resource: p.resource, action: p.action }));
        return { ...user, permissions };
    }
    async createFromFirebase(dto) {
        const rawEmail = typeof dto.email === 'string' ? dto.email.trim() : '';
        const emailForDb = rawEmail || `firebase_${dto.firebaseUid}@local`;
        const user = this.userRepo.create({
            firebaseUid: dto.firebaseUid,
            email: emailForDb,
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
    async update(id, data) {
        const payload = {};
        for (const key of UsersService_1.UPDATE_ALLOWED_KEYS) {
            if (key in data) {
                const value = data[key];
                payload[key] = value;
            }
        }
        if (payload.roleId === '')
            payload.roleId = null;
        await this.userRepo.update(id, payload);
        return this.findOne(id);
    }
    async remove(id) {
        await this.userRepo.softDelete(id);
    }
};
exports.UsersService = UsersService;
UsersService.UPDATE_ALLOWED_KEYS = [
    'displayName',
    'department',
    'status',
    'roleId',
    'employeeId',
    'phone',
    'licenseNumber',
    'licenseType',
    'licenseExpiry',
    'licenseRestrictions',
    'emergencyContactName',
    'emergencyContactPhone',
    'emergencyContactRelationship',
    'emailNotifications',
    'autoApprovalEnabled',
];
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map