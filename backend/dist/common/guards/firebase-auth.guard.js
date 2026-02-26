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
var FirebaseAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_admin_config_1 = require("../../config/firebase-admin.config");
const users_service_1 = require("../../modules/users/users.service");
let FirebaseAuthGuard = FirebaseAuthGuard_1 = class FirebaseAuthGuard {
    constructor(usersService) {
        this.usersService = usersService;
        this.logger = new common_1.Logger(FirebaseAuthGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('No se proporcionó token de autenticación');
        }
        const token = authHeader.split('Bearer ')[1];
        if (!firebase_admin_config_1.firebaseAuth) {
            throw new common_1.UnauthorizedException('Firebase no configurado');
        }
        try {
            const decodedToken = await firebase_admin_config_1.firebaseAuth.verifyIdToken(token);
            const firebaseUid = decodedToken.uid;
            let user = await this.usersService.findByFirebaseUid(firebaseUid);
            if (!user) {
                this.logger.log('Creando usuario en BD desde Firebase');
                user = await this.usersService.createFromFirebase({
                    firebaseUid,
                    email: decodedToken.email || '',
                    displayName: decodedToken.name || null,
                    photoURL: decodedToken.picture || null,
                });
            }
            try {
                await this.usersService.updateLastLogin(user.id);
            }
            catch (lastLoginErr) {
                this.logger.warn('updateLastLogin falló (no bloqueante):', lastLoginErr?.message);
            }
            const userWithPermissions = await this.usersService.findOneWithPermissions(user.id);
            if (userWithPermissions.status !== 'active') {
                throw new common_1.UnauthorizedException('Usuario suspendido o inactivo');
            }
            const role = userWithPermissions.role;
            const permissions = Array.isArray(userWithPermissions.permissions)
                ? userWithPermissions.permissions
                : [];
            request.user = {
                ...userWithPermissions,
                role: role != null ? { id: role.id, name: role.name } : null,
                permissions,
            };
            request.firebaseToken = decodedToken;
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException) {
                throw err;
            }
            const error = err;
            if (error.code === 'auth/id-token-expired') {
                throw new common_1.UnauthorizedException('Token expirado');
            }
            if (error.code && String(error.code).startsWith('auth/')) {
                throw new common_1.UnauthorizedException('Token inválido');
            }
            const msg = error.message ?? String(err);
            this.logger.error(`Error en autenticación/creación de usuario: ${msg}`, error.stack);
            const isDev = process.env.NODE_ENV !== 'production';
            throw new common_1.InternalServerErrorException(isDev ? `Error al crear o obtener usuario: ${msg}` : 'Error al crear o obtener usuario');
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = FirebaseAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map