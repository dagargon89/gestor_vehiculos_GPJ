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
exports.FuelRecordsController = void 0;
const common_1 = require("@nestjs/common");
const fuel_records_service_1 = require("./fuel-records.service");
const firebase_auth_guard_1 = require("../../common/guards/firebase-auth.guard");
let FuelRecordsController = class FuelRecordsController {
    constructor(fuelRecordsService) {
        this.fuelRecordsService = fuelRecordsService;
    }
    findAll(vehicleId) {
        return this.fuelRecordsService.findAll(vehicleId);
    }
    findOne(id) {
        return this.fuelRecordsService.findOne(id);
    }
    create(body) {
        return this.fuelRecordsService.create(body);
    }
    update(id, body) {
        return this.fuelRecordsService.update(id, body);
    }
    remove(id) {
        return this.fuelRecordsService.remove(id);
    }
};
exports.FuelRecordsController = FuelRecordsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('vehicleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FuelRecordsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FuelRecordsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FuelRecordsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FuelRecordsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FuelRecordsController.prototype, "remove", null);
exports.FuelRecordsController = FuelRecordsController = __decorate([
    (0, common_1.Controller)('fuel-records'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __metadata("design:paramtypes", [fuel_records_service_1.FuelRecordsService])
], FuelRecordsController);
//# sourceMappingURL=fuel-records.controller.js.map