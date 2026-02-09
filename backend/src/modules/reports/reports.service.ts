import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepo: Repository<Reservation>,
  ) {}

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
      LEFT JOIN reservations r ON v.id = r."vehicleId" 
        AND r."createdAt" BETWEEN $1 AND $2
        AND r."deletedAt" IS NULL
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.plate, v.brand, v.model
      ORDER BY "totalReservations" DESC
    `;
    return this.reservationsRepo.query(query, [startDate, endDate]);
  }
}
