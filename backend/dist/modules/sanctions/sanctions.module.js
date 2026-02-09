"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanctionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sanction_entity_1 = require("../../database/entities/sanction.entity");
const sanctions_service_1 = require("./sanctions.service");
const sanctions_controller_1 = require("./sanctions.controller");
let SanctionsModule = class SanctionsModule {
};
exports.SanctionsModule = SanctionsModule;
exports.SanctionsModule = SanctionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([sanction_entity_1.Sanction])],
        controllers: [sanctions_controller_1.SanctionsController],
        providers: [sanctions_service_1.SanctionsService],
        exports: [sanctions_service_1.SanctionsService],
    })
], SanctionsModule);
//# sourceMappingURL=sanctions.module.js.map