import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { FuelRecord } from '../../database/entities/fuel-record.entity';
import { Maintenance } from '../../database/entities/maintenance.entity';
import { Incident } from '../../database/entities/incident.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepo: Repository<Reservation>,
    @InjectRepository(FuelRecord)
    private fuelRecordsRepo: Repository<FuelRecord>,
    @InjectRepository(Maintenance)
    private maintenanceRepo: Repository<Maintenance>,
    @InjectRepository(Incident)
    private incidentsRepo: Repository<Incident>,
  ) {}

  /** Uso de vehículos: reservas, km y tasa de utilización por vehículo */
  async getVehicleUsageReport(startDate: Date, endDate: Date): Promise<unknown[]> {
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

  /** Actividad por conductor: reservas, km recorridos e incidentes en el período */
  async getDriverActivityReport(startDate: Date, endDate: Date): Promise<unknown[]> {
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

  /** Historial detallado de reservas en el período */
  async getReservationsHistoryReport(startDate: Date, endDate: Date): Promise<unknown[]> {
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

  /** Consumo de combustible por vehículo: litros, costo total y costo promedio */
  async getFuelReport(startDate: Date, endDate: Date): Promise<unknown[]> {
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

  /** Mantenimiento por vehículo: servicios realizados, pendientes y cancelados */
  async getMaintenanceReport(startDate: Date, endDate: Date): Promise<unknown[]> {
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
}
