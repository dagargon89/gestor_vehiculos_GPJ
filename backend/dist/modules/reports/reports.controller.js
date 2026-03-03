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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const firebase_auth_guard_1 = require("../../common/guards/firebase-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    parseDates(startDate, endDate) {
        const start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        return [start, end];
    }
    getVehicleUsage(startDate, endDate) {
        const [start, end] = this.parseDates(startDate, endDate);
        return this.reportsService.getVehicleUsageReport(start, end);
    }
    getDriverActivity(startDate, endDate) {
        const [start, end] = this.parseDates(startDate, endDate);
        return this.reportsService.getDriverActivityReport(start, end);
    }
    getReservationsHistory(startDate, endDate) {
        const [start, end] = this.parseDates(startDate, endDate);
        return this.reportsService.getReservationsHistoryReport(start, end);
    }
    getFuel(startDate, endDate) {
        const [start, end] = this.parseDates(startDate, endDate);
        return this.reportsService.getFuelReport(start, end);
    }
    getMaintenance(startDate, endDate) {
        const [start, end] = this.parseDates(startDate, endDate);
        return this.reportsService.getMaintenanceReport(start, end);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('vehicle-usage'),
    (0, permissions_decorator_1.RequirePermission)('reports', 'read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getVehicleUsage", null);
__decorate([
    (0, common_1.Get)('driver-activity'),
    (0, permissions_decorator_1.RequirePermission)('reports', 'read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDriverActivity", null);
__decorate([
    (0, common_1.Get)('reservations-history'),
    (0, permissions_decorator_1.RequirePermission)('reports', 'read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getReservationsHistory", null);
__decorate([
    (0, common_1.Get)('fuel'),
    (0, permissions_decorator_1.RequirePermission)('reports', 'read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getFuel", null);
__decorate([
    (0, common_1.Get)('maintenance'),
    (0, permissions_decorator_1.RequirePermission)('reports', 'read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMaintenance", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map