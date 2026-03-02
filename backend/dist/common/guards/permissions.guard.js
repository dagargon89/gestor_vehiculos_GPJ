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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = exports.REQUIRE_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
exports.REQUIRE_PERMISSION_KEY = 'require_permission';
const CONDUCTOR_DEFAULT_PERMISSIONS = [
    { resource: 'vehicles', action: 'read' },
    { resource: 'vehicles', action: 'create' },
    { resource: 'vehicles', action: 'update' },
    { resource: 'reservations', action: 'read' },
    { resource: 'reservations', action: 'create' },
    { resource: 'reservations', action: 'update' },
    { resource: 'fuel_records', action: 'read' },
    { resource: 'fuel_records', action: 'create' },
    { resource: 'fuel_records', action: 'update' },
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'create' },
    { resource: 'incidents', action: 'update' },
    { resource: 'notifications', action: 'read' },
];
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const required = this.reflector.get(exports.REQUIRE_PERMISSION_KEY, context.getHandler());
        if (!required)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.ForbiddenException('No autorizado');
        const roleName = user.role?.name?.toLowerCase();
        if (roleName === 'admin')
            return true;
        const explicit = (user.permissions ?? []);
        const effective = roleName === 'conductor'
            ? [
                ...explicit,
                ...CONDUCTOR_DEFAULT_PERMISSIONS.filter((dp) => !explicit.some((ep) => ep.resource === dp.resource && ep.action === dp.action)),
            ]
            : explicit;
        const hasPermission = effective.some((p) => p.resource === required.resource && p.action === required.action);
        if (!hasPermission)
            throw new common_1.ForbiddenException('Sin permiso para esta acción');
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map