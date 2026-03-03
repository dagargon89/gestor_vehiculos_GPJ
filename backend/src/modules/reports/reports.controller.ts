import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  private parseDates(startDate: string, endDate: string): [Date, Date] {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return [start, end];
  }

  @Get('vehicle-usage')
  @RequirePermission('reports', 'read')
  getVehicleUsage(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getVehicleUsageReport(start, end);
  }

  @Get('driver-activity')
  @RequirePermission('reports', 'read')
  getDriverActivity(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getDriverActivityReport(start, end);
  }

  @Get('reservations-history')
  @RequirePermission('reports', 'read')
  getReservationsHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getReservationsHistoryReport(start, end);
  }

  @Get('fuel')
  @RequirePermission('reports', 'read')
  getFuel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getFuelReport(start, end);
  }

  @Get('maintenance')
  @RequirePermission('reports', 'read')
  getMaintenance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [start, end] = this.parseDates(startDate, endDate);
    return this.reportsService.getMaintenanceReport(start, end);
  }
}
