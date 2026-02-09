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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../../database/entities/reservation.entity");
let ReportsService = class ReportsService {
    constructor(reservationsRepo) {
        this.reservationsRepo = reservationsRepo;
    }
    async getVehicleUsageReport(startDate, endDate) {
        const query = `
      SELECT 
        v.id,
        v.plate,
        v.brand,
        v.model,
        COUNT(DISTINCT r.id) as "totalReservations",
        COALESCE(SUM(r."checkoutOdometer" - r."checkinOdometer"), 0) as "totalKmDriven",
        ROUND((COUNT(DISTINCT DATE(r."startDatetime"))::numeric / 
          NULLIF(EXTRACT(DAY FROM $2::timestamp - $1::timestamp), 0))::numeric * 100, 2) as "utilizationRate"
      FROM vehicles v
      LEFT JOIN reservations r ON v.id = r."vehicleId" 
        AND r."createdAt" BETWEEN $1 AND $2
        AND r."deletedAt" IS NULL
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model
      ORDER BY "totalReservations" DESC
    `;
        return this.reservationsRepo.query(query, [startDate, endDate]);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map