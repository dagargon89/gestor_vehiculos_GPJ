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
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_admin_config_1 = require("../../config/firebase-admin.config");
const users_service_1 = require("../../modules/users/users.service");
let FirebaseAuthGuard = class FirebaseAuthGuard {
    constructor(usersService) {
        this.usersService = usersService;
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
                user = await this.usersService.createFromFirebase({
                    firebaseUid,
                    email: decodedToken.email || '',
                    displayName: decodedToken.name || null,
                    photoURL: decodedToken.picture || null,
                });
            }
            await this.usersService.updateLastLogin(user.id);
            const userWithPermissions = await this.usersService.findOneWithPermissions(user.id);
            if (userWithPermissions.status !== 'active') {
                throw new common_1.UnauthorizedException('Usuario suspendido o inactivo');
            }
            request.user = userWithPermissions;
            request.firebaseToken = decodedToken;
            return true;
        }
        catch (err) {
            const error = err;
            if (error.code === 'auth/id-token-expired') {
                throw new common_1.UnauthorizedException('Token expirado');
            }
            throw new common_1.UnauthorizedException('Token inválido');
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map