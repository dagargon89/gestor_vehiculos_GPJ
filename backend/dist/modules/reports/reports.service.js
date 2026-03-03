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
const fuel_record_entity_1 = require("../../database/entities/fuel-record.entity");
const maintenance_entity_1 = require("../../database/entities/maintenance.entity");
const incident_entity_1 = require("../../database/entities/incident.entity");
let ReportsService = class ReportsService {
    constructor(reservationsRepo, fuelRecordsRepo, maintenanceRepo, incidentsRepo) {
        this.reservationsRepo = reservationsRepo;
        this.fuelRecordsRepo = fuelRecordsRepo;
        this.maintenanceRepo = maintenanceRepo;
        this.incidentsRepo = incidentsRepo;
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
      LEFT JOIN reservations r ON v.id = r."vehicle_id"
        AND r."startDatetime" BETWEEN $1 AND $2
        AND r."deletedAt" IS NULL
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model
      ORDER BY "totalReservations" DESC
    `;
        return this.reservationsRepo.query(query, [startDate, endDate]);
    }
    async getDriverActivityReport(startDate, endDate) {
        const query = `
      SELECT
        u.id,
        COALESCE(u."displayName", u.email) as "driverName",
        u.email,
        COUNT(DISTINCT r.id) as "totalReservations",
        COALESCE(SUM(
          CASE WHEN r."checkoutOdometer" IS NOT NULL AND r."checkinOdometer" IS NOT NULL
            THEN r."checkoutOdometer" - r."checkinOdometer" ELSE 0 END
        ), 0) as "totalKmDriven",
        COUNT(DISTINCT i.id) as "totalIncidents"
      FROM users u
      LEFT JOIN reservations r ON u.id = r."user_id"
        AND r."startDatetime" BETWEEN $1 AND $2
        AND r."deletedAt" IS NULL
      LEFT JOIN incidents i ON u.id = i."userId"
        AND i.date BETWEEN $1 AND $2
        AND i."deletedAt" IS NULL
      WHERE u."deletedAt" IS NULL
        AND u.status = 'active'
      GROUP BY u.id, u."displayName", u.email
      HAVING COUNT(DISTINCT r.id) > 0 OR COUNT(DISTINCT i.id) > 0
      ORDER BY "totalReservations" DESC, "driverName" ASC
    `;
        return this.reservationsRepo.query(query, [startDate, endDate]);
    }
    async getReservationsHistoryReport(startDate, endDate) {
        const query = `
      SELECT
        r.id,
        v.plate,
        v.brand,
        v.model,
        COALESCE(u."displayName", u.email) as "userName",
        r."startDatetime",
        r."endDatetime",
        r.status,
        r."eventName",
        r.destination,
        r."checkinOdometer",
        r."checkoutOdometer",
        CASE WHEN r."checkoutOdometer" IS NOT NULL AND r."checkinOdometer" IS NOT NULL
          THEN r."checkoutOdometer" - r."checkinOdometer" ELSE NULL END as "kmDriven"
      FROM reservations r
      JOIN vehicles v ON r."vehicle_id" = v.id
      LEFT JOIN users u ON r."user_id" = u.id
      WHERE r."deletedAt" IS NULL
        AND r."startDatetime" BETWEEN $1 AND $2
      ORDER BY r."startDatetime" DESC
    `;
        return this.reservationsRepo.query(query, [startDate, endDate]);
    }
    async getFuelReport(startDate, endDate) {
        const query = `
      SELECT
        v.id,
        v.plate,
        v.brand,
        v.model,
        COUNT(fr.id) as "totalRecords",
        COALESCE(SUM(fr.liters), 0) as "totalLiters",
        COALESCE(SUM(fr.cost), 0) as "totalCost",
        CASE WHEN COALESCE(SUM(fr.liters), 0) > 0
          THEN ROUND((SUM(fr.cost) / SUM(fr.liters))::numeric, 2)
          ELSE 0 END as "avgCostPerLiter"
      FROM vehicles v
      LEFT JOIN fuel_records fr ON v.id = fr."vehicleId"
        AND fr.date BETWEEN $1 AND $2
        AND fr."deletedAt" IS NULL
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model
      HAVING COUNT(fr.id) > 0
      ORDER BY "totalLiters" DESC
    `;
        return this.reservationsRepo.query(query, [startDate, endDate]);
    }
    async getMaintenanceReport(startDate, endDate) {
        const query = `
      SELECT
        v.id,
        v.plate,
        v.brand,
        v.model,
        COUNT(m.id) as "totalServices",
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as "completed",
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as "scheduled",
        COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END) as "cancelled",
        MAX(m."scheduledDate") as "lastServiceDate",
        STRING_AGG(DISTINCT m.type, ', ') FILTER (WHERE m.type IS NOT NULL) as "serviceTypes"
      FROM vehicles v
      LEFT JOIN maintenance m ON v.id = m."vehicleId"
        AND m."scheduledDate" BETWEEN $1 AND $2
        AND m."deletedAt" IS NULL
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model
      HAVING COUNT(m.id) > 0
      ORDER BY "totalServices" DESC
    `;
        return this.reservationsRepo.query(query, [startDate, endDate]);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(fuel_record_entity_1.FuelRecord)),
    __param(2, (0, typeorm_1.InjectRepository)(maintenance_entity_1.Maintenance)),
    __param(3, (0, typeorm_1.InjectRepository)(incident_entity_1.Incident)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map