"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const firebase_auth_guard_1 = require("./guards/firebase-auth.guard");
const permissions_guard_1 = require("./guards/permissions.guard");
const users_module_1 = require("../modules/users/users.module");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule],
        providers: [firebase_auth_guard_1.FirebaseAuthGuard, permissions_guard_1.PermissionsGuard],
        exports: [firebase_auth_guard_1.FirebaseAuthGuard, permissions_guard_1.PermissionsGuard, users_module_1.UsersModule],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map